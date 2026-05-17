import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { createJakartaDate } from '@/lib/timezone'
import { putDataUrl, isDataUrl } from '@/lib/blob-store'

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya admin yang dapat membuat absensi manual.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, type, date, time, status, note, shiftId, buktiDukung } = body

    // Validation
    if (!userId || !type || !date || !time || !status) {
      return NextResponse.json(
        { error: 'Data tidak lengkap. UserId, type, date, time, dan status wajib diisi.' },
        { status: 400 }
      )
    }

    if (!['MASUK', 'PULANG'].includes(type)) {
      return NextResponse.json({ error: 'Type harus MASUK atau PULANG' }, { status: 400 })
    }

    if (
      !['HADIR', 'TELAT', 'IZIN', 'CUTI', 'ALPHA', 'DINAS', 'PULANG_CEPAT'].includes(status)
    ) {
      return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 })
    }

    // Verify employee exists
    const employee = await db.user.findUnique({ where: { id: userId } })
    if (!employee) {
      return NextResponse.json({ error: 'Pegawai tidak ditemukan' }, { status: 404 })
    }

    // Parse the date and time to create a Jakarta-timezone-aware timestamp
    // Note: date.split('-') gives 1-indexed month, but createJakartaDate/Date.UTC expects 0-indexed
    const [year, month1Indexed, day] = date.split('-').map(Number)
    const month = month1Indexed - 1 // Convert to 0-indexed for Date.UTC
    const [hours, minutes] = time.split(':').map(Number)
    const createdAt = createJakartaDate(year, month, day, hours, minutes)

    // Check if the employee already has attendance for that type on that date
    const dayStart = createJakartaDate(year, month, day, 0, 0)
    const dayEnd = createJakartaDate(year, month, day + 1, 0, 0)

    const existingAttendance = await db.attendance.findFirst({
      where: {
        userId,
        type,
        createdAt: { gte: dayStart, lt: dayEnd },
        isManual: false, // Only check against real attendance
      },
    })

    if (existingAttendance) {
      return NextResponse.json(
        {
          error: `Pegawai sudah memiliki absensi ${type.toLowerCase()} pada tanggal tersebut`,
        },
        { status: 400 }
      )
    }

    // Store bukti dukung in blob store (not as base64 in database)
    let buktiDukungUrl: string | null = buktiDukung || null
    if (buktiDukung && isDataUrl(buktiDukung)) {
      try {
        const blobResult = await putDataUrl('bukti-dukung', buktiDukung)
        buktiDukungUrl = blobResult.url
      } catch (blobErr) {
        console.error('Bukti dukung blob store save failed:', blobErr)
        // Fallback: keep base64 in DB
        buktiDukungUrl = buktiDukung
      }
    }

    // Create manual attendance
    const attendance = await db.attendance.create({
      data: {
        userId,
        type,
        latitude: 0,
        longitude: 0,
        confidence: 0,
        status,
        note: note || `Absensi manual oleh admin`,
        shiftId: shiftId || employee.shiftId || null,
        isManual: true,
        manualBy: authUser.userId,
        buktiDukung: buktiDukungUrl,
        createdAt,
      },
      include: {
        user: {
          select: { id: true, nama: true, nip: true, photo: true, unitKerja: true, jabatan: true },
        },
      },
    })

    return NextResponse.json(
      {
        message: `Absensi manual berhasil ditambahkan untuk ${employee.nama}`,
        attendance,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Manual attendance POST error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
