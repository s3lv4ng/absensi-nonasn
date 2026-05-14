import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const includeUsers = searchParams.get('includeUsers') === 'true'

    const shifts = await db.workShift.findMany({
      orderBy: { createdAt: 'asc' },
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
    })

    return NextResponse.json({ shifts })
  } catch (error) {
    console.error('Shifts GET error:', error)
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
    const { name, startTime, endTime, lateTolerance, workDays, color } = body

    if (!name || !startTime || !endTime) {
      return NextResponse.json({ error: 'Nama, jam masuk, dan jam pulang wajib diisi' }, { status: 400 })
    }

    const shift = await db.workShift.create({
      data: {
        name,
        startTime,
        endTime,
        lateTolerance: lateTolerance ?? 15,
        workDays: workDays || '1,2,3,4,5',
        color: color || '#1e40af',
      },
    })

    return NextResponse.json({ shift }, { status: 201 })
  } catch (error) {
    console.error('Shifts POST error:', error)
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
    const { id, name, startTime, endTime, lateTolerance, workDays, color, isActive } = body

    if (!id) {
      return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (startTime !== undefined) updateData.startTime = startTime
    if (endTime !== undefined) updateData.endTime = endTime
    if (lateTolerance !== undefined) updateData.lateTolerance = lateTolerance
    if (workDays !== undefined) updateData.workDays = workDays
    if (color !== undefined) updateData.color = color
    if (isActive !== undefined) updateData.isActive = isActive

    const shift = await db.workShift.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ shift })
  } catch (error) {
    console.error('Shifts PUT error:', error)
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

    // Unassign users from this shift first
    await db.user.updateMany({
      where: { shiftId: id },
      data: { shiftId: null },
    })

    await db.workShift.delete({ where: { id } })

    return NextResponse.json({ message: 'Jam kerja berhasil dihapus' })
  } catch (error) {
    console.error('Shifts DELETE error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
