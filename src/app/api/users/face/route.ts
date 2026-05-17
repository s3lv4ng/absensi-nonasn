import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { compressBase64Image } from '@/lib/image-compress'

// Threshold for duplicate face prevention during registration.
// Lower than the attendance matching threshold (0.6) to avoid false positives.
// Different people's faces typically have distance > 0.5 with good descriptors.
// Only flag as duplicate if VERY similar (distance < 0.4) to prevent
// different people from being incorrectly blocked.
const DUPLICATE_FACE_THRESHOLD = 0.4

function calculateEuclideanDistance(desc1: number[], desc2: number[]): number {
  if (desc1.length !== desc2.length) return Infinity
  let sum = 0
  for (let i = 0; i < desc1.length; i++) {
    const diff = desc1[i] - desc2[i]
    sum += diff * diff
  }
  return Math.sqrt(sum)
}

// Get current user's face descriptor
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const targetUserId = userId || authUser.userId

    // Non-admin can only access their own face data
    if (targetUserId !== authUser.userId && authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const user = await db.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        faceDescriptor: true,
        photo: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({
      faceDescriptor: user.faceDescriptor,
      hasFaceData: !!user.faceDescriptor,
      hasPhoto: !!user.photo,
    })
  } catch (error) {
    console.error('Face GET error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// Update face descriptor for a user
export async function PUT(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, faceDescriptor, photo } = body
    const targetUserId = userId || authUser.userId

    // Non-admin trying to update someone else's face
    if (targetUserId !== authUser.userId && authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    // Check if user already has face registered (enforce once-only for non-admin)
    if (authUser.role !== 'ADMIN') {
      const existingUser = await db.user.findUnique({
        where: { id: targetUserId },
        select: { faceDescriptor: true, faceRegisteredAt: true },
      })

      if (existingUser?.faceDescriptor && existingUser?.faceRegisteredAt) {
        return NextResponse.json(
          { error: 'Wajah sudah terdaftar. Hubungi admin untuk mereset data wajah.' },
          { status: 400 }
        )
      }
    }

    // Check for duplicate face across other accounts
    // Uses a stricter threshold (0.4) than attendance matching (0.6)
    // to avoid blocking different people who happen to have similar descriptors
    if (faceDescriptor) {
      let newDescriptor: number[]
      try {
        newDescriptor = JSON.parse(faceDescriptor) as number[]
        if (!Array.isArray(newDescriptor) || newDescriptor.length !== 128) {
          return NextResponse.json(
            { error: 'Data deskriptor wajah tidak valid. Harap coba lagi.' },
            { status: 400 }
          )
        }
      } catch {
        return NextResponse.json(
          { error: 'Data deskriptor wajah tidak valid. Harap coba lagi.' },
          { status: 400 }
        )
      }

      const usersWithFaces = await db.user.findMany({
        where: {
          faceDescriptor: { not: null },
          id: { not: targetUserId },
        },
        select: { id: true, nama: true, faceDescriptor: true },
      })

      let closestMatch: { nama: string; distance: number } | null = null

      for (const existingUser of usersWithFaces) {
        if (!existingUser.faceDescriptor) continue
        try {
          const existingDescriptor = JSON.parse(existingUser.faceDescriptor) as number[]
          const distance = calculateEuclideanDistance(newDescriptor, existingDescriptor)

          // Log distances for debugging
          console.log(`[FaceRegistration] Distance vs ${existingUser.nama}: ${distance.toFixed(4)}`)

          // Track closest match for better error messages
          if (!closestMatch || distance < closestMatch.distance) {
            closestMatch = { nama: existingUser.nama, distance }
          }

          // Only block if VERY similar (strict threshold)
          if (distance < DUPLICATE_FACE_THRESHOLD) {
            console.warn(`[FaceRegistration] DUPLICATE DETECTED: distance=${distance.toFixed(4)} vs ${existingUser.nama}`)
            return NextResponse.json(
              {
                error: `Wajah ini sudah terdaftar pada akun lain (${existingUser.nama}). Satu wajah hanya boleh didaftarkan pada satu akun.`,
                distance: Math.round(distance * 100) / 100,
              },
              { status: 400 }
            )
          }
        } catch (parseErr) {
          console.error(`[FaceRegistration] Failed to parse descriptor for user ${existingUser.id}:`, parseErr)
          continue
        }
      }

      // Log if close but not blocked
      if (closestMatch && closestMatch.distance < 0.6) {
        console.warn(`[FaceRegistration] Close match but not blocked: distance=${closestMatch.distance.toFixed(4)} vs ${closestMatch.nama}`)
      }
    }

    const updateData: Record<string, unknown> = {}
    if (faceDescriptor) updateData.faceDescriptor = faceDescriptor
    // Compress profile/face photo to save database storage
    // Resize to 320x320, JPEG quality 70 (~8-20KB vs ~50-100KB raw)
    if (photo) {
      try {
        updateData.photo = await compressBase64Image(photo, {
          maxWidth: 320,
          maxHeight: 320,
          quality: 70,
        })
      } catch (compressErr) {
        console.error('Photo compression failed, storing original:', compressErr)
        updateData.photo = photo
      }
    }
    // Set faceRegisteredAt when registering face for the first time
    updateData.faceRegisteredAt = new Date()

    const user = await db.user.update({
      where: { id: targetUserId },
      data: updateData,
      select: {
        id: true,
        nip: true,
        nama: true,
        email: true,
        role: true,
        photo: true,
        faceDescriptor: true,
        faceRegisteredAt: true,
        unitKerja: true,
        jabatan: true,
        isActive: true,
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Face update error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// Reset face descriptor (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'UserId wajib diisi' }, { status: 400 })
    }

    await db.user.update({
      where: { id: userId },
      data: { faceDescriptor: null, photo: null, faceRegisteredAt: null },
    })

    return NextResponse.json({ message: 'Data wajah berhasil direset. Pegawai dapat mendaftarkan ulang wajah.' })
  } catch (error) {
    console.error('Face reset error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
