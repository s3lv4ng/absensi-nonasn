import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

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

    if (targetUserId !== authUser.userId && authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const updateData: Record<string, unknown> = {}
    if (faceDescriptor) updateData.faceDescriptor = faceDescriptor
    if (photo) updateData.photo = photo

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

// Reset face descriptor
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
      data: { faceDescriptor: null, photo: null },
    })

    return NextResponse.json({ message: 'Data wajah berhasil direset' })
  } catch (error) {
    console.error('Face reset error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
