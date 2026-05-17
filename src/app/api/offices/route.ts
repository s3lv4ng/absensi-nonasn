import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Admin sees all offices, employees see only active ones
    const where = authUser.role === 'ADMIN' ? {} : { isActive: true }
    const orderBy = authUser.role === 'ADMIN' ? { createdAt: 'desc' as const } : { name: 'asc' as const }

    const [offices, total] = await Promise.all([
      db.office.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      db.office.count({ where }),
    ])

    return NextResponse.json({
      offices,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Offices GET error:', error)
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
    const { name, address, latitude, longitude, radiusMeter } = body

    if (!name || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: 'Nama, latitude, dan longitude wajib diisi' }, { status: 400 })
    }

    const office = await db.office.create({
      data: {
        name,
        address: address || null,
        latitude,
        longitude,
        radiusMeter: radiusMeter || 100,
      },
    })

    return NextResponse.json({ office }, { status: 201 })
  } catch (error) {
    console.error('Offices POST error:', error)
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
    const { id, name, address, latitude, longitude, radiusMeter, isActive } = body

    if (!id) {
      return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (address !== undefined) updateData.address = address
    if (latitude !== undefined) updateData.latitude = latitude
    if (longitude !== undefined) updateData.longitude = longitude
    if (radiusMeter !== undefined) updateData.radiusMeter = radiusMeter
    if (isActive !== undefined) updateData.isActive = isActive

    const office = await db.office.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ office })
  } catch (error) {
    console.error('Offices PUT error:', error)
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

    await db.office.delete({ where: { id } })

    return NextResponse.json({ message: 'Lokasi kantor berhasil dihapus' })
  } catch (error) {
    console.error('Offices DELETE error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
