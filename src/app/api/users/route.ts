import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { nama: { contains: search } },
        { nip: { contains: search } },
        { email: { contains: search } },
      ]
    }
    if (role) {
      where.role = role
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
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
          shiftId: true,
          shift: {
            select: {
              id: true,
              name: true,
              startTime: true,
              endTime: true,
              color: true,
            },
          },
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.user.count({ where }),
    ])

    return NextResponse.json({
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Users GET error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const body = await request.json()
    const { nip, nama, email, password, role, unitKerja, jabatan } = body

    if (!nip || !nama || !email || !password) {
      return NextResponse.json({ error: 'NIP, nama, email, dan password wajib diisi' }, { status: 400 })
    }

    const existingEmail = await db.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existingEmail) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 409 })
    }

    const existingNip = await db.user.findUnique({ where: { nip } })
    if (existingNip) {
      return NextResponse.json({ error: 'NIP sudah terdaftar' }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await db.user.create({
      data: {
        nip,
        nama,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: role || 'PEGAWAI',
        unitKerja: unitKerja || null,
        jabatan: jabatan || null,
      },
    })

    return NextResponse.json({
      user: {
        id: user.id,
        nip: user.nip,
        nama: user.nama,
        email: user.email,
        role: user.role,
        photo: user.photo,
        unitKerja: user.unitKerja,
        jabatan: user.jabatan,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Users POST error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const body = await request.json()
    const { id, nip, nama, email, role, unitKerja, jabatan, isActive, password, oldPassword } = body

    if (!id) {
      return NextResponse.json({ error: 'ID user wajib diisi' }, { status: 400 })
    }

    // Non-admin users can only update their own profile
    const isSelfUpdate = id === authUser.userId
    if (!isSelfUpdate && authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    // For self-update with password change, verify old password
    if (isSelfUpdate && password && authUser.role !== 'ADMIN') {
      if (!oldPassword) {
        return NextResponse.json({ error: 'Password lama wajib diisi' }, { status: 400 })
      }
      const targetUser = await db.user.findUnique({ where: { id } })
      if (!targetUser) {
        return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
      }
      const isValidOldPassword = await bcrypt.compare(oldPassword, targetUser.password)
      if (!isValidOldPassword) {
        return NextResponse.json({ error: 'Password lama salah' }, { status: 400 })
      }
    }

    const updateData: Record<string, unknown> = {}

    // Admin can update all fields
    if (authUser.role === 'ADMIN') {
      updateData.nip = nip
      updateData.nama = nama
      updateData.email = email?.toLowerCase()
      updateData.role = role
      updateData.unitKerja = unitKerja
      updateData.jabatan = jabatan
      updateData.isActive = isActive
    } else {
      // Self-update: only allow limited fields
      if (nama !== undefined) updateData.nama = nama
      if (email !== undefined) updateData.email = email.toLowerCase()
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 12)
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) delete updateData[key]
    })

    const user = await db.user.update({
      where: { id },
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
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Users PUT error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID user wajib diisi' }, { status: 400 })
    }

    await db.user.delete({ where: { id } })

    return NextResponse.json({ message: 'User berhasil dihapus' })
  } catch (error) {
    console.error('Users DELETE error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
