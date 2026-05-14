import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET() {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const isAdmin = authUser.role === 'ADMIN'

    const leaveTypes = await db.leaveTypeCategory.findMany({
      where: isAdmin ? {} : { isActive: true },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ leaveTypes })
  } catch (error) {
    console.error('LeaveTypes GET error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }
    if (authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const body = await request.json()
    const { name, code, description, color } = body

    if (!name || !code) {
      return NextResponse.json(
        { error: 'Nama dan kode wajib diisi' },
        { status: 400 }
      )
    }

    const upperCode = code.toUpperCase().trim()
    const trimmedName = name.trim()

    // Check for duplicate code
    const existing = await db.leaveTypeCategory.findUnique({
      where: { code: upperCode },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Kode jenis cuti sudah digunakan' },
        { status: 400 }
      )
    }

    const leaveType = await db.leaveTypeCategory.create({
      data: {
        name: trimmedName,
        code: upperCode,
        description: description?.trim() || null,
        color: color || '#1e40af',
      },
    })

    return NextResponse.json({ leaveType }, { status: 201 })
  } catch (error) {
    console.error('LeaveTypes POST error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }
    if (authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const body = await request.json()
    const { id, name, code, description, color, isActive } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID wajib diisi' },
        { status: 400 }
      )
    }

    const existing = await db.leaveTypeCategory.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Jenis cuti tidak ditemukan' },
        { status: 404 }
      )
    }

    // If code is being changed, check for uniqueness
    if (code !== undefined) {
      const upperCode = code.toUpperCase().trim()
      if (upperCode !== existing.code) {
        const duplicate = await db.leaveTypeCategory.findUnique({
          where: { code: upperCode },
        })
        if (duplicate) {
          return NextResponse.json(
            { error: 'Kode jenis cuti sudah digunakan' },
            { status: 400 }
          )
        }
      }
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name.trim()
    if (code !== undefined) updateData.code = code.toUpperCase().trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (color !== undefined) updateData.color = color
    if (isActive !== undefined) updateData.isActive = isActive

    const leaveType = await db.leaveTypeCategory.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ leaveType })
  } catch (error) {
    console.error('LeaveTypes PUT error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }
    if (authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID wajib diisi' },
        { status: 400 }
      )
    }

    const existing = await db.leaveTypeCategory.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Jenis cuti tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if any LeaveRequest uses this leave type's code
    const usageCount = await db.leaveRequest.count({
      where: { type: existing.code },
    })
    if (usageCount > 0) {
      return NextResponse.json(
        { error: `Jenis cuti tidak dapat dihapus karena masih digunakan oleh ${usageCount} pengajuan cuti` },
        { status: 400 }
      )
    }

    await db.leaveTypeCategory.delete({ where: { id } })

    return NextResponse.json({ message: 'Jenis cuti berhasil dihapus' })
  } catch (error) {
    console.error('LeaveTypes DELETE error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
