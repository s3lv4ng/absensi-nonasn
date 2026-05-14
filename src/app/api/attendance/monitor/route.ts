import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // 1. Check authentication
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // 2. Get today's date range (start of day to end of day in local timezone)
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

    // Format today's date as YYYY-MM-DD
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    // 3. Get all active PEGAWAI users (with pagination)
    const [employees, empTotal] = await Promise.all([
      db.user.findMany({
        where: {
          role: 'PEGAWAI',
          isActive: true,
        },
        select: {
          id: true,
          nama: true,
          nip: true,
          photo: true,
          unitKerja: true,
          jabatan: true,
        },
        orderBy: { nama: 'asc' },
        skip,
        take: limit,
      }),
      db.user.count({
        where: {
          role: 'PEGAWAI',
          isActive: true,
        },
      }),
    ])

    // 4. Get today's attendance records for all users (type MASUK and PULANG)
    const todayAttendances = await db.attendance.findMany({
      where: {
        createdAt: {
          gte: todayStart,
          lt: todayEnd,
        },
        type: { in: ['MASUK', 'PULANG'] },
      },
      select: {
        id: true,
        userId: true,
        type: true,
        status: true,
        createdAt: true,
        latitude: true,
        longitude: true,
      },
    })

    // 5. Get approved leave requests that cover today
    const approvedLeaves = await db.leaveRequest.findMany({
      where: {
        status: 'APPROVED',
        startDate: { lte: todayEnd },
        endDate: { gte: todayStart },
      },
      select: {
        id: true,
        userId: true,
        type: true,
        status: true,
        startDate: true,
        endDate: true,
      },
    })

    // Build lookup maps for quick access
    const attendanceByUser = new Map<string, Map<string, { createdAt: Date; status: string; latitude: number; longitude: number }> >()

    for (const att of todayAttendances) {
      if (!attendanceByUser.has(att.userId)) {
        attendanceByUser.set(att.userId, new Map())
      }
      attendanceByUser.get(att.userId)!.set(att.type, {
        createdAt: att.createdAt,
        status: att.status,
        latitude: att.latitude,
        longitude: att.longitude,
      })
    }

    const leaveByUser = new Map<string, { type: string; status: string }>()
    for (const leave of approvedLeaves) {
      leaveByUser.set(leave.userId, {
        type: leave.type,
        status: leave.status,
      })
    }

    // 6. For each employee, determine their status
    const summary = {
      hadir: 0,
      telat: 0,
      izin: 0,
      cuti: 0,
      sakit: 0,
      dinas: 0,
      belumAbsen: 0,
      total: empTotal,
    }

    const employeeStatuses = employees.map((emp) => {
      const userAttendance = attendanceByUser.get(emp.id)
      const userLeave = leaveByUser.get(emp.id)

      const masukRecord = userAttendance?.get('MASUK')
      const pulangRecord = userAttendance?.get('PULANG')

      let status: string = 'BELUM_ABSEN'
      let leaveType: string | null = null
      let leaveStatus: string | null = null

      // Priority 1: If they have an APPROVED leave covering today
      if (userLeave) {
        const leaveTypeCode = userLeave.type.toUpperCase()
        leaveType = userLeave.type
        leaveStatus = userLeave.status

        // Map leave type to status
        if (leaveTypeCode === 'IZIN') {
          status = 'IZIN'
        } else if (leaveTypeCode === 'CUTI') {
          status = 'CUTI'
        } else if (leaveTypeCode === 'SAKIT') {
          status = 'SAKIT'
        } else if (leaveTypeCode === 'DINAS') {
          status = 'DINAS'
        } else {
          // Custom leave type code - use it directly as the status
          status = userLeave.type
        }
      }
      // Priority 2: If they have a MASUK attendance today
      else if (masukRecord) {
        if (masukRecord.status === 'TELAT') {
          status = 'TELAT'
        } else {
          status = 'HADIR'
        }
      }
      // Priority 3: No attendance and no leave
      else {
        status = 'BELUM_ABSEN'
      }

      // Update summary counts
      const statusUpper = status.toUpperCase()
      if (statusUpper === 'HADIR') {
        summary.hadir++
      } else if (statusUpper === 'TELAT') {
        summary.telat++
      } else if (statusUpper === 'IZIN') {
        summary.izin++
      } else if (statusUpper === 'CUTI') {
        summary.cuti++
      } else if (statusUpper === 'SAKIT') {
        summary.sakit++
      } else if (statusUpper === 'DINAS') {
        summary.dinas++
      } else if (statusUpper === 'BELUM_ABSEN') {
        summary.belumAbsen++
      }

      // Format times as ISO strings so the frontend can parse them with new Date()
      const formatTime = (date: Date | null): string | null => {
        if (!date) return null
        return date.toISOString()
      }

      return {
        userId: emp.id,
        nama: emp.nama,
        nip: emp.nip,
        photo: emp.photo,
        unitKerja: emp.unitKerja,
        jabatan: emp.jabatan,
        status,
        masukTime: formatTime(masukRecord?.createdAt ?? null),
        pulangTime: formatTime(pulangRecord?.createdAt ?? null),
        leaveType,
        leaveStatus,
        masukLat: masukRecord?.latitude ?? null,
        masukLng: masukRecord?.longitude ?? null,
        pulangLat: pulangRecord?.latitude ?? null,
        pulangLng: pulangRecord?.longitude ?? null,
      }
    })

    // 7. Return the response
    return NextResponse.json({
      employees: employeeStatuses,
      date: dateStr,
      summary,
      page,
      totalPages: Math.ceil(empTotal / limit),
      total: empTotal,
    })
  } catch (error) {
    console.error('Attendance monitor error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
