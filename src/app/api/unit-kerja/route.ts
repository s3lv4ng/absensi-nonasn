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

    const [unitKerja, total] = await Promise.all([
      db.unitKerja.findMany({
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
      db.unitKerja.count({ where }),
    ])

    return NextResponse.json({
      unitKerja,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('UnitKerja GET error:', error)
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
    const existing = await db.unitKerja.findUnique({ where: { name } })
    if (existing) {
      return NextResponse.json({ error: 'Nama unit kerja sudah digunakan' }, { status: 409 })
    }

    const unitKerja = await db.unitKerja.create({
      data: {
        name,
        description: description || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    return NextResponse.json({ unitKerja }, { status: 201 })
  } catch (error) {
    console.error('UnitKerja POST error:', error)
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
      const existing = await db.unitKerja.findUnique({ where: { name } })
      if (existing && existing.id !== id) {
        return NextResponse.json({ error: 'Nama unit kerja sudah digunakan' }, { status: 409 })
      }
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (isActive !== undefined) updateData.isActive = isActive

    const unitKerja = await db.unitKerja.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ unitKerja })
  } catch (error) {
    console.error('UnitKerja PUT error:', error)
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

    // Check if there are users assigned to this unit kerja
    const userCount = await db.user.count({ where: { unitKerjaId: id } })
    if (userCount > 0) {
      return NextResponse.json(
        { error: `Tidak dapat menghapus unit kerja karena masih ada ${userCount} pegawai yang terdaftar` },
        { status: 400 }
      )
    }

    await db.unitKerja.delete({ where: { id } })

    return NextResponse.json({ message: 'Unit kerja berhasil dihapus' })
  } catch (error) {
    console.error('UnitKerja DELETE error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
