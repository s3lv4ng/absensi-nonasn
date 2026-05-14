import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const body = await request.json()
    const { shiftId, userIds } = body

    if (!shiftId || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'shiftId dan userIds (array) wajib diisi' },
        { status: 400 }
      )
    }

    // Verify shift exists
    const shift = await db.workShift.findUnique({ where: { id: shiftId } })
    if (!shift) {
      return NextResponse.json({ error: 'Jam kerja tidak ditemukan' }, { status: 404 })
    }

    // Verify all users exist
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true },
    })
    const foundIds = users.map((u) => u.id)
    const notFoundIds = userIds.filter((id: string) => !foundIds.includes(id))
    if (notFoundIds.length > 0) {
      return NextResponse.json(
        { error: `User tidak ditemukan: ${notFoundIds.join(', ')}` },
        { status: 404 }
      )
    }

    // Assign all users to the shift
    const result = await db.user.updateMany({
      where: { id: { in: userIds } },
      data: { shiftId },
    })

    return NextResponse.json({
      message: `${result.count} pegawai berhasil ditugaskan ke jam kerja ${shift.name}`,
      assignedCount: result.count,
    })
  } catch (error) {
    console.error('Shift assign POST error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const body = await request.json()
    const { userIds } = body

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'userIds (array) wajib diisi' },
        { status: 400 }
      )
    }

    // Unassign users from their current shift
    const result = await db.user.updateMany({
      where: { id: { in: userIds }, shiftId: { not: null } },
      data: { shiftId: null },
    })

    return NextResponse.json({
      message: `${result.count} pegawai berhasil dilepas dari jam kerja`,
      unassignedCount: result.count,
    })
  } catch (error) {
    console.error('Shift unassign DELETE error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
