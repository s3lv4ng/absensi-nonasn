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
    const type = searchParams.get('type')

    const where: Record<string, unknown> = {}
    if (authUser.role !== 'ADMIN') {
      where.userId = authUser.userId
    }
    if (status) {
      where.status = status
    }
    if (type) {
      where.type = type
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
    const { userId, type, startDate, endDate, reason, status: reqStatus } = body

    if (!type || !startDate || !endDate || !reason) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 })
    }

    const isAdmin = authUser.role === 'ADMIN'
    const targetUserId = isAdmin && userId ? userId : authUser.userId
    const isManualEntry = isAdmin && userId ? true : false
    const initialStatus = isAdmin && reqStatus ? reqStatus : (isManualEntry ? 'APPROVED' : 'PENDING')

    const leave = await db.leaveRequest.create({
      data: {
        userId: targetUserId,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        status: initialStatus,
        isManualEntry,
        ...(isManualEntry ? { approvedBy: authUser.userId, approvedAt: new Date() } : {}),
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
    const { id, status, type, startDate, endDate, reason } = body

    if (!id) {
      return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}

    // Approve/reject
    if (status) {
      updateData.status = status
      updateData.approvedBy = authUser.userId
      updateData.approvedAt = new Date()
    }

    // Edit fields
    if (type !== undefined) updateData.type = type
    if (startDate !== undefined) updateData.startDate = new Date(startDate)
    if (endDate !== undefined) updateData.endDate = new Date(endDate)
    if (reason !== undefined) updateData.reason = reason

    const leave = await db.leaveRequest.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ leave })
  } catch (error) {
    console.error('Leaves PUT error:', error)
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

    await db.leaveRequest.delete({ where: { id } })

    return NextResponse.json({ message: 'Data berhasil dihapus' })
  } catch (error) {
    console.error('Leaves DELETE error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
