import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { calculateAttendanceTiming } from '@/lib/attendance-utils'
import { getJakartaTime, createJakartaDate, formatJakartaDate } from '@/lib/timezone'

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

    // 2. Get today's date range using Jakarta timezone
    const nowJakarta = getJakartaTime(new Date())
    const todayStartUtc = createJakartaDate(nowJakarta.year, nowJakarta.month, nowJakarta.day, 0, 0)
    const todayEndUtc = createJakartaDate(nowJakarta.year, nowJakarta.month, nowJakarta.day + 1, 0, 0)

    // Format today's date as YYYY-MM-DD in Jakarta timezone
    const dateStr = formatJakartaDate(new Date())

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
          gte: todayStartUtc,
          lt: todayEndUtc,
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
        note: true,
      },
    })

    // Get all active shifts for late/early calculation
    const shifts = await db.workShift.findMany({
      where: { isActive: true },
    })
    const shiftMap = new Map(shifts.map((s) => [s.id, s]))

    // Get user shift assignments
    const userShifts = await db.user.findMany({
      where: { role: 'PEGAWAI', isActive: true },
      select: { id: true, shiftId: true },
    })
    const userShiftMap = new Map(userShifts.map((u) => [u.id, u.shiftId]))

    // Also get OfficeSetting as fallback
    const officeSettingFallback = await db.officeSetting.findFirst()

    // 5. Get approved leave requests that cover today
    const approvedLeaves = await db.leaveRequest.findMany({
      where: {
        status: 'APPROVED',
        startDate: { lte: todayEndUtc },
        endDate: { gte: todayStartUtc },
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
      pulangCepat: 0,
      total: empTotal,
    }

    // Helper function to calculate late/early minutes
    function calculateMinutes(att: { createdAt: Date; type: string; status: string; note: string | null }, userId: string): { lateMinutes: number | null; earlyMinutes: number | null } {
      let lateMinutes: number | null = null
      let earlyMinutes: number | null = null

      const userShiftId = userShiftMap.get(userId)
      const shift = userShiftId ? shiftMap.get(userShiftId) : null
      const effectiveShift = shift || null
      const fallbackStart = officeSettingFallback?.startTime || '08:00'
      const fallbackEnd = officeSettingFallback?.endTime || '17:00'
      const fallbackTolerance = officeSettingFallback?.lateTolerance || 0

      const attDate = new Date(att.createdAt)
      const startTime = effectiveShift?.startTime || fallbackStart
      const endTime = effectiveShift?.endTime || fallbackEnd
      const tolerance = effectiveShift?.lateTolerance ?? fallbackTolerance

      if (att.type === 'MASUK') {
        const result = calculateAttendanceTiming(startTime, endTime, tolerance, attDate, 'MASUK')
        if (result.isLate) {
          lateMinutes = result.lateMinutes
        }
      }

      if (att.type === 'PULANG') {
        const result = calculateAttendanceTiming(startTime, endTime, tolerance, attDate, 'PULANG')
        if (result.isEarly) {
          earlyMinutes = result.earlyMinutes
        }
      }

      // Fallback to note parsing
      if (!lateMinutes && att.note) {
        const lateMatch = att.note.match(/Terlambat\s+(\d+)\s+menit/)
        if (lateMatch) lateMinutes = parseInt(lateMatch[1])
      }
      if (!earlyMinutes && att.note) {
        const earlyMatch = att.note.match(/Pulang cepat\s+(\d+)\s+menit/)
        if (earlyMatch) earlyMinutes = parseInt(earlyMatch[1])
      }

      return { lateMinutes, earlyMinutes }
    }

    const employeeStatuses = employees.map((emp) => {
      const userAttendance = attendanceByUser.get(emp.id)
      const userLeave = leaveByUser.get(emp.id)

      const masukRecord = userAttendance?.get('MASUK')
      const pulangRecord = userAttendance?.get('PULANG')

      let status: string = 'BELUM_ABSEN'
      let leaveType: string | null = null
      let leaveStatus: string | null = null
      let lateMinutes: number | null = null
      let earlyMinutes: number | null = null

      // Calculate late/early minutes from attendance records
      if (masukRecord) {
        const calc = calculateMinutes({
          createdAt: masukRecord.createdAt,
          type: 'MASUK',
          status: masukRecord.status,
          note: null,
        }, emp.id)
        lateMinutes = calc.lateMinutes
      }
      if (pulangRecord) {
        const calc = calculateMinutes({
          createdAt: pulangRecord.createdAt,
          type: 'PULANG',
          status: pulangRecord.status,
          note: null,
        }, emp.id)
        earlyMinutes = calc.earlyMinutes
      }

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

      // Count pulang cepat separately (can overlap with HADIR/TELAT)
      if (earlyMinutes && earlyMinutes > 0) {
        summary.pulangCepat++
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
        lateMinutes,
        earlyMinutes,
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
