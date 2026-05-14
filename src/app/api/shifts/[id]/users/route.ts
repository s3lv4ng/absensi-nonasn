import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser()
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const { id } = await params

    const shift = await db.workShift.findUnique({
      where: { id },
      include: {
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
      },
    })

    if (!shift) {
      return NextResponse.json({ error: 'Jam kerja tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({
      users: shift.users,
      count: shift.users.length,
    })
  } catch (error) {
    console.error('Shift users GET error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
