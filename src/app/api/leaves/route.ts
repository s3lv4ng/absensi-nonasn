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
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (authUser.role !== 'ADMIN') {
      where.userId = authUser.userId
    }
    if (status) {
      where.status = status
    }

    const leaves = await db.leaveRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            nip: true,
            nama: true,
            email: true,
            photo: true,
            unitKerja: true,
            jabatan: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ leaves })
  } catch (error) {
    console.error('Leaves GET error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const body = await request.json()
    const { type, startDate, endDate, reason } = body

    if (!type || !startDate || !endDate || !reason) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 })
    }

    const leave = await db.leaveRequest.create({
      data: {
        userId: authUser.userId,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
      },
    })

    return NextResponse.json({ leave }, { status: 201 })
  } catch (error) {
    console.error('Leaves POST error:', error)
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
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'ID dan status wajib diisi' }, { status: 400 })
    }

    const leave = await db.leaveRequest.update({
      where: { id },
      data: {
        status,
        approvedBy: authUser.userId,
        approvedAt: new Date(),
      },
    })

    return NextResponse.json({ leave })
  } catch (error) {
    console.error('Leaves PUT error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
