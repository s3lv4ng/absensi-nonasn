import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeUsers = searchParams.get('includeUsers') === 'true'
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { description: { contains: search } },
          ],
        }
      : {}

    const [jabatan, total] = await Promise.all([
      db.jabatan.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
        include: {
          _count: { select: { users: true } },
          ...(includeUsers
            ? {
                users: {
                  select: {
                    id: true,
                    nip: true,
                    nama: true,
                    email: true,
                    role: true,
                    photo: true,
                    unitKerja: true,
                    jabatan: true,
                    shiftId: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                  },
                  orderBy: { nama: 'asc' },
                },
              }
            : {}),
        },
      }),
      db.jabatan.count({ where }),
    ])

    return NextResponse.json({
      jabatan,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Jabatan GET error:', error)
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
    const { name, description, isActive } = body

    if (!name) {
      return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 })
    }

    // Check for duplicate name
    const existing = await db.jabatan.findUnique({ where: { name } })
    if (existing) {
      return NextResponse.json({ error: 'Nama jabatan sudah digunakan' }, { status: 409 })
    }

    const jabatan = await db.jabatan.create({
      data: {
        name,
        description: description || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    return NextResponse.json({ jabatan }, { status: 201 })
  } catch (error) {
    console.error('Jabatan POST error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const body = await request.json()
    const { id, name, description, isActive } = body

    if (!id) {
      return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 })
    }

    // If name is being changed, check for duplicate
    if (name !== undefined) {
      const existing = await db.jabatan.findUnique({ where: { name } })
      if (existing && existing.id !== id) {
        return NextResponse.json({ error: 'Nama jabatan sudah digunakan' }, { status: 409 })
      }
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (isActive !== undefined) updateData.isActive = isActive

    const jabatan = await db.jabatan.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ jabatan })
  } catch (error) {
    console.error('Jabatan PUT error:', error)
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
      return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 })
    }

    // Check if there are users assigned to this jabatan
    const userCount = await db.user.count({ where: { jabatanId: id } })
    if (userCount > 0) {
      return NextResponse.json(
        { error: `Tidak dapat menghapus jabatan karena masih ada ${userCount} pegawai yang terdaftar` },
        { status: 400 }
      )
    }

    await db.jabatan.delete({ where: { id } })

    return NextResponse.json({ message: 'Jabatan berhasil dihapus' })
  } catch (error) {
    console.error('Jabatan DELETE error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
