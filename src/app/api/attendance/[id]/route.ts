import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { compressBase64Image } from '@/lib/image-compress'

// ---------------------------------------------------------------------------
// PATCH /api/attendance/[id] — Edit attendance (admin only)
// ---------------------------------------------------------------------------

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser()
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya admin yang dapat mengedit absensi.' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { status, type, note, buktiDukung, editReason } = body

    // Check attendance exists
    const existing = await db.attendance.findUnique({
      where: { id },
      include: { user: { select: { id: true, nama: true } } },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Data absensi tidak ditemukan' },
        { status: 404 }
      )
    }

    if (existing.isDeleted) {
      return NextResponse.json(
        { error: 'Data absensi sudah dihapus' },
        { status: 400 }
      )
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      editedBy: authUser.userId,
      editedAt: new Date(),
    }

    if (status && ['HADIR', 'TELAT', 'IZIN', 'CUTI', 'ALPHA', 'DINAS', 'PULANG_CEPAT'].includes(status)) {
      updateData.status = status
    }

    if (type && ['MASUK', 'PULANG'].includes(type)) {
      updateData.type = type
    }

    if (note !== undefined) {
      updateData.note = note || null
    }

    if (editReason) {
      updateData.editReason = editReason
    }

    // Compress bukti dukung image before storing
    if (buktiDukung) {
      try {
        updateData.buktiDukung = await compressBase64Image(buktiDukung, {
          maxWidth: 640,
          maxHeight: 480,
          quality: 60,
        })
      } catch (compressErr) {
        console.error('Bukti dukung compression failed:', compressErr)
        updateData.buktiDukung = buktiDukung
      }
    }

    const updated = await db.attendance.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true, nip: true, nama: true, email: true, role: true,
            photo: true, unitKerja: true, jabatan: true, shiftId: true,
            shift: {
              select: {
                id: true, name: true, startTime: true, endTime: true,
                lateTolerance: true, color: true,
              },
            },
          },
        },
        shift: {
          select: {
            id: true, name: true, startTime: true, endTime: true,
            lateTolerance: true, color: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: `Absensi ${existing.user?.nama ?? ''} berhasil diperbarui`,
      attendance: updated,
    })
  } catch (error) {
    console.error('Attendance PATCH error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/attendance/[id] — Soft delete attendance (admin only)
// ---------------------------------------------------------------------------

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser()
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya admin yang dapat menghapus absensi.' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Check attendance exists
    const existing = await db.attendance.findUnique({
      where: { id },
      include: { user: { select: { id: true, nama: true } } },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Data absensi tidak ditemukan' },
        { status: 404 }
      )
    }

    if (existing.isDeleted) {
      return NextResponse.json(
        { error: 'Data absensi sudah dihapus sebelumnya' },
        { status: 400 }
      )
    }

    // Soft delete
    const updated = await db.attendance.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedBy: authUser.userId,
        deletedAt: new Date(),
      },
    })

    return NextResponse.json({
      message: `Absensi ${existing.user?.nama ?? ''} berhasil dihapus`,
      attendance: updated,
    })
  } catch (error) {
    console.error('Attendance DELETE error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// GET /api/attendance/[id] — Get single attendance detail
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const { id } = await params

    const attendance = await db.attendance.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true, nip: true, nama: true, email: true, role: true,
            photo: true, unitKerja: true, jabatan: true, shiftId: true,
            shift: {
              select: {
                id: true, name: true, startTime: true, endTime: true,
                lateTolerance: true, color: true,
              },
            },
          },
        },
        shift: {
          select: {
            id: true, name: true, startTime: true, endTime: true,
            lateTolerance: true, color: true,
          },
        },
      },
    })

    if (!attendance) {
      return NextResponse.json(
        { error: 'Data absensi tidak ditemukan' },
        { status: 404 }
      )
    }

    // Non-admin can only see their own
    if (authUser.role !== 'ADMIN' && attendance.userId !== authUser.userId) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    // Resolve admin names for editedBy, deletedBy, manualBy
    const adminIds = [
      attendance.editedBy,
      attendance.deletedBy,
      attendance.manualBy,
    ].filter(Boolean) as string[]

    const adminUsers = adminIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: adminIds } },
          select: { id: true, nama: true, role: true },
        })
      : []

    const adminMap = new Map(adminUsers.map((u) => [u.id, u]))

    const result = {
      ...attendance,
      editedByUser: attendance.editedBy ? adminMap.get(attendance.editedBy) || null : null,
      deletedByUser: attendance.deletedBy ? adminMap.get(attendance.deletedBy) || null : null,
      manualByUser: attendance.manualBy ? adminMap.get(attendance.manualBy) || null : null,
    }

    return NextResponse.json({ attendance: result })
  } catch (error) {
    console.error('Attendance GET [id] error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
