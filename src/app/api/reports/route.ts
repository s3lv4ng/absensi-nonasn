import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { calculateAttendanceTiming } from '@/lib/attendance-utils'
import { getJakartaTime, createJakartaDate, formatJakartaDate, formatJakartaTime, getShiftDate, getJakartaDayOfWeek } from '@/lib/timezone'

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

    // Dashboard stats
    const totalEmployees = await db.user.count({
      where: { isActive: true, role: 'PEGAWAI' },
    })

    // Use Jakarta timezone for "today" boundaries
    const nowJakarta = getJakartaTime(new Date())
    const todayStartUtc = createJakartaDate(nowJakarta.year, nowJakarta.month, nowJakarta.day, 0, 0)
    const todayEndUtc = createJakartaDate(nowJakarta.year, nowJakarta.month, nowJakarta.day + 1, 0, 0)

    const todayAttendances = await db.attendance.findMany({
      where: {
        type: 'MASUK',
        createdAt: { gte: todayStartUtc, lt: todayEndUtc },
      },
      include: {
        user: {
          select: {
            id: true,
            nip: true,
            nama: true,
            unitKerja: true,
          },
        },
      },
    })

    const uniquePresentIds = new Set(todayAttendances.map((a) => a.userId))
    const presentToday = uniquePresentIds.size
    const lateToday = todayAttendances.filter((a) => a.status === 'TELAT').length
    const absentToday = totalEmployees - presentToday

    // Pending leaves
    const pendingLeaves = await db.leaveRequest.count({
      where: { status: 'PENDING' },
    })

    const approvedLeaves = await db.leaveRequest.count({
      where: {
        status: 'APPROVED',
        startDate: { lte: todayEndUtc },
        endDate: { gte: todayStartUtc },
      },
    })

    // Chart data - last 7 days (using Jakarta timezone)
    const chartData = []
    for (let i = 6; i >= 0; i--) {
      const dayYear = nowJakarta.year
      const dayMonth = nowJakarta.month
      const dayDay = nowJakarta.day - i

      const dayStartUtc = createJakartaDate(dayYear, dayMonth, dayDay, 0, 0)
      const dayEndUtc = createJakartaDate(dayYear, dayMonth, dayDay + 1, 0, 0)

      const dayAttendances = await db.attendance.findMany({
        where: {
          type: 'MASUK',
          createdAt: { gte: dayStartUtc, lt: dayEndUtc },
        },
      })

      const dayJakarta = getJakartaTime(dayStartUtc)
      const dayOfWeek = dayStartUtc.getUTCDay()
      const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
      const dayName = dayNames[dayOfWeek]
      const dayDate = dayJakarta.day + '/' + (dayJakarta.month + 1)

      chartData.push({
        name: `${dayName} ${dayDate}`,
        hadir: dayAttendances.filter((a) => a.status === 'HADIR').length,
        telat: dayAttendances.filter((a) => a.status === 'TELAT').length,
        izin: dayAttendances.filter((a) => a.status === 'IZIN').length,
        alpha: totalEmployees - dayAttendances.length,
      })
    }

    // Recent attendances
    const recentAttendances = await db.attendance.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            nip: true,
            nama: true,
            photo: true,
            unitKerja: true,
            jabatan: true,
          },
        },
      },
    })

    // ======================================================================
    // Monthly Reports Data (for Reports page)
    // ======================================================================

    // Calculate working days in the selected month
    const monthStartUtc = createJakartaDate(year, month - 1, 1, 0, 0)
    const monthEndUtc = createJakartaDate(year, month, 1, 0, 0)

    // Get office settings for work days
    const officeSettings = await db.officeSetting.findFirst()
    const workDaysStr = officeSettings?.workDays || '1,2,3,4,5'
    const workDayNums = workDaysStr.split(',').map(Number)

    // Count working days in the month (Jakarta calendar)
    let totalWorkingDays = 0
    const daysInMonth = new Date(year, month, 0).getDate()
    for (let d = 1; d <= daysInMonth; d++) {
      const dayDate = new Date(year, month - 1, d)
      if (workDayNums.includes(dayDate.getDay())) {
        totalWorkingDays++
      }
    }

    // Subtract holidays that fall on working days
    const holidays = await db.holiday.findMany({
      where: {
        date: { gte: monthStartUtc, lt: monthEndUtc },
      },
    })
    const holidayCount = holidays.filter((h) => {
      const d = new Date(h.date)
      return workDayNums.includes(d.getDay())
    }).length
    totalWorkingDays = Math.max(0, totalWorkingDays - holidayCount)

    // Get all MASUK attendances for the selected month
    const monthAttendances = await db.attendance.findMany({
      where: {
        type: 'MASUK',
        createdAt: { gte: monthStartUtc, lt: monthEndUtc },
      },
      select: {
        id: true,
        userId: true,
        status: true,
        createdAt: true,
        shiftId: true,
        isManual: true,
        user: {
          select: {
            id: true,
            nip: true,
            nama: true,
            unitKerja: true,
            shiftId: true,
            shift: {
              select: {
                id: true,
                startTime: true,
                endTime: true,
                lateTolerance: true,
              },
            },
          },
        },
      },
    })

    // Get approved leaves for the month
    const monthLeaves = await db.leaveRequest.findMany({
      where: {
        status: 'APPROVED',
        startDate: { lt: monthEndUtc },
        endDate: { gte: monthStartUtc },
      },
    })

    // Build employee summaries
    const employeeMap = new Map<string, {
      userId: string
      nip: string
      nama: string
      unitKerja: string | null
      hadir: number
      telat: number
      izin: number
      cuti: number
      sakit: number
      dinasLuar: number
      dinasDalam: number
      alpha: number
      pulangCepat: number
      lateCount: number
      totalLateMinutes: number
      totalEarlyMinutes: number
    }>()

    // Get all active employees
    const allEmployees = await db.user.findMany({
      where: { isActive: true, role: 'PEGAWAI' },
      select: { id: true, nip: true, nama: true, unitKerja: true },
    })

    for (const emp of allEmployees) {
      employeeMap.set(emp.id, {
        userId: emp.id,
        nip: emp.nip,
        nama: emp.nama,
        unitKerja: emp.unitKerja,
        hadir: 0,
        telat: 0,
        izin: 0,
        cuti: 0,
        sakit: 0,
        dinasLuar: 0,
        dinasDalam: 0,
        alpha: 0,
        pulangCepat: 0,
        lateCount: 0,
        totalLateMinutes: 0,
        totalEarlyMinutes: 0,
      })
    }

    // Get PULANG attendances for the month as well (for pulang cepat detection & pairing)
    const monthPulangAttendances = await db.attendance.findMany({
      where: {
        type: 'PULANG',
        createdAt: { gte: monthStartUtc, lt: monthEndUtc },
      },
      select: {
        id: true,
        userId: true,
        status: true,
        createdAt: true,
        shiftId: true,
        isManual: true,
        user: {
          select: {
            id: true,
            shiftId: true,
            shift: {
              select: {
                id: true,
                startTime: true,
                endTime: true,
                lateTolerance: true,
              },
            },
          },
        },
        shift: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            lateTolerance: true,
          },
        },
      },
    })

    // Also get all active shifts and OfficeSetting for calculations
    const allShifts = await db.workShift.findMany({ where: { isActive: true } })
    const shiftMap = new Map(allShifts.map((s) => [s.id, s]))
    const officeSettingsForCalc = await db.officeSetting.findFirst()

    // Build a map of PULANG attendances: userId_day -> { hasPulang: true, isManualPulang: boolean }
    // This is used to determine if a MASUK record has a corresponding PULANG for the same day
    const pulangDayMap = new Map<string, { isManualPulang: boolean }>()
    for (const att of monthPulangAttendances) {
      const attDate = new Date(att.createdAt)
      // Get shift info for this user to determine effective shift date
      const shiftData = att.shift || att.user?.shift || null
      const startTime = shiftData?.startTime || officeSettingsForCalc?.startTime || '08:00'
      const endTime = shiftData?.endTime || officeSettingsForCalc?.endTime || '17:00'
      const shiftDate = getShiftDate(attDate, startTime, endTime)
      // Only include PULANG within the selected month
      if (shiftDate.year === year && shiftDate.month === month - 1) {
        const key = `${att.userId}_${shiftDate.day}`
        pulangDayMap.set(key, { isManualPulang: att.isManual })
      }
    }

    // Count MASUK attendances per employee
    // Rule: hadir only counts when both MASUK and PULANG exist for the same day,
    // OR when the MASUK is manual (admin override)
    for (const att of monthAttendances) {
      const entry = employeeMap.get(att.userId)
      if (!entry) continue

      // Determine the effective shift date for this MASUK record
      const attDate = new Date(att.createdAt)
      const shiftData = att.user?.shift || null
      const startTime = shiftData?.startTime || officeSettingsForCalc?.startTime || '08:00'
      const endTime = shiftData?.endTime || officeSettingsForCalc?.endTime || '17:00'
      const shiftDate = getShiftDate(attDate, startTime, endTime)

      // Only process attendances within the selected month
      if (shiftDate.year !== year || shiftDate.month !== month - 1) continue

      // Check if there's a corresponding PULANG for this day
      const dayKey = `${att.userId}_${shiftDate.day}`
      const pulangInfo = pulangDayMap.get(dayKey)
      const hasPulang = !!pulangInfo

      // Calculate late minutes using shared utility
      const shiftId = att.shiftId
      const shift = shiftId ? shiftMap.get(shiftId) : null
      const shiftStartTime = shift?.startTime || officeSettingsForCalc?.startTime || '08:00'
      const shiftEndTime = shift?.endTime || officeSettingsForCalc?.endTime || '17:00'
      const tolerance = shift?.lateTolerance ?? officeSettingsForCalc?.lateTolerance ?? 0
      const calcResult = calculateAttendanceTiming(shiftStartTime, shiftEndTime, tolerance, attDate, 'MASUK')
      const isLate = calcResult.isLate

      if (att.status === 'HADIR' || att.status === 'TELAT') {
        // Check pair condition: both MASUK and PULANG must exist, OR MASUK is manual
        if (hasPulang || att.isManual) {
          // Count as hadir
          entry.hadir++
          if (isLate) {
            entry.telat++
            entry.lateCount++
            entry.totalLateMinutes += calcResult.lateMinutes
          }
        }
        // If no pulang and not manual, don't count as hadir (will fall through to alpha calculation)
      } else if (att.status === 'ALPHA') {
        entry.alpha++
      }
      // Note: IZIN, CUTI, SAKIT, DINAS statuses from attendance records are NOT counted here
      // to avoid double-counting. They are counted only from the LeaveRequest table below.
    }

    // Count PULANG_CEPAT from PULANG attendances
    for (const att of monthPulangAttendances) {
      const entry = employeeMap.get(att.userId)
      if (!entry) continue

      // Calculate early departure minutes using shared utility
      const shiftData = att.shift || att.user?.shift || null
      const startTime = shiftData?.startTime || officeSettingsForCalc?.startTime || '08:00'
      const endTime = shiftData?.endTime || officeSettingsForCalc?.endTime || '17:00'
      const tolerance = shiftData?.lateTolerance ?? officeSettingsForCalc?.lateTolerance ?? 0
      const attDate = new Date(att.createdAt)
      const result = calculateAttendanceTiming(startTime, endTime, tolerance, attDate, 'PULANG')
      if (result.isEarly) {
        entry.pulangCepat++
        entry.totalEarlyMinutes += result.earlyMinutes
      }
    }

    // Count leave-based statuses from approved leaves
    // Each leave may span multiple days; count each working day separately
    // All leave types (including DL/DD) only count working days (non-weekend, non-holiday)
    // so that summary counts are consistent with totalWorkingDays and percentages stay ≤ 100%
    for (const leave of monthLeaves) {
      const entry = employeeMap.get(leave.userId)
      if (!entry) continue

      // Calculate days within the leave period for this month
      const leaveStart = new Date(leave.startDate)
      const leaveEnd = new Date(leave.endDate)
      const effectiveStart = leaveStart < monthStartUtc ? monthStartUtc : leaveStart
      const effectiveEnd = leaveEnd > monthEndUtc ? monthEndUtc : leaveEnd

      let daysOnLeave = 0
      const current = new Date(effectiveStart)
      while (current <= effectiveEnd) {
        // Use Jakarta timezone to get the correct day of week
        const jakartaTime = getJakartaTime(current)
        const dayOfWeek = getJakartaDayOfWeek(current)

        if (workDayNums.includes(dayOfWeek)) {
          // Only count working days for ALL leave types (including DL/DD)
          const isHoliday = holidays.some((h) => {
            const hd = getJakartaTime(new Date(h.date))
            return hd.day === jakartaTime.day && hd.month === jakartaTime.month && hd.year === jakartaTime.year
          })
          if (!isHoliday) {
            daysOnLeave++
          }
        }
        current.setUTCDate(current.getUTCDate() + 1)
      }

      if (daysOnLeave > 0) {
        if (leave.type === 'SAKIT') {
          entry.sakit += daysOnLeave
        } else if (leave.type === 'DINAS' || leave.type === 'DINAS_LUAR' || leave.type === 'DL') {
          entry.dinasLuar += daysOnLeave
        } else if (leave.type === 'DINAS_DALAM' || leave.type === 'DD') {
          entry.dinasDalam += daysOnLeave
        } else if (leave.type === 'IZIN') {
          entry.izin += daysOnLeave
        } else if (leave.type === 'CUTI') {
          entry.cuti += daysOnLeave
        }
      }
    }

    // Calculate alpha for employees who didn't check in
    for (const [userId, entry] of employeeMap) {
      const totalRecorded = entry.hadir + entry.izin + entry.cuti + entry.sakit + entry.dinasLuar + entry.dinasDalam + entry.alpha
      if (totalWorkingDays > totalRecorded) {
        entry.alpha += totalWorkingDays - totalRecorded
      }
    }

    // Calculate percentages and build summaries
    const employeeSummaries = Array.from(employeeMap.values()).map((e) => {
      // DD and DL count as hadir for persentase
      const presentDays = e.hadir + e.dinasLuar + e.dinasDalam
      const persentase = totalWorkingDays > 0
        ? Math.round((presentDays / totalWorkingDays) * 1000) / 10
        : 0
      return {
        userId: e.userId,
        nip: e.nip,
        nama: e.nama,
        unitKerja: e.unitKerja,
        hadir: e.hadir,
        telat: e.telat,
        izin: e.izin,
        cuti: e.cuti,
        sakit: e.sakit,
        dinasLuar: e.dinasLuar,
        dinasDalam: e.dinasDalam,
        alpha: e.alpha,
        pulangCepat: e.pulangCepat,
        totalLateMinutes: e.totalLateMinutes,
        totalEarlyMinutes: e.totalEarlyMinutes,
        persentase,
      }
    })

    // Most late employees (top 3)
    const sortedByLate = [...Array.from(employeeMap.values())]
      .sort((a, b) => b.lateCount - a.lateCount)
      .filter((e) => e.lateCount > 0)
      .slice(0, 3)
    const mostLateEmployees = sortedByLate.map((e) => e.nama)

    // Average attendance rate
    const avgRate = employeeSummaries.length > 0
      ? Math.round((employeeSummaries.reduce((sum, e) => sum + e.persentase, 0) / employeeSummaries.length) * 10) / 10
      : 0

    // Daily attendance rates for line chart (using Jakarta timezone)
    const dailyRates = []
    for (let d = 1; d <= daysInMonth; d++) {
      const dayDate = new Date(year, month - 1, d)
      // Only include working days
      if (!workDayNums.includes(dayDate.getDay())) continue

      // Check if it's a holiday
      const isHoliday = holidays.some((h) => {
        const hd = getJakartaTime(new Date(h.date))
        return hd.day === d && hd.month === month - 1 && hd.year === year
      })
      if (isHoliday) continue

      const dayStartUtc = createJakartaDate(year, month - 1, d, 0, 0)
      const dayEndUtc = createJakartaDate(year, month - 1, d + 1, 0, 0)

      const dayAttendancesList = monthAttendances.filter((a) => {
        const aDate = new Date(a.createdAt)
        return aDate >= dayStartUtc && aDate < dayEndUtc
      })

      const dayHadir = dayAttendancesList.filter((a) => a.status === 'HADIR').length
      const dayTelat = dayAttendancesList.filter((a) => a.status === 'TELAT').length
      const dayPresent = dayHadir + dayTelat
      const rate = totalEmployees > 0
        ? Math.round((dayPresent / totalEmployees) * 1000) / 10
        : 0

      const dayLabel = d + '/' + month

      dailyRates.push({
        date: dayLabel,
        rate,
        hadir: dayHadir,
        telat: dayTelat,
        total: totalEmployees,
      })
    }

    return NextResponse.json({
      // Dashboard data
      stats: {
        totalEmployees,
        presentToday,
        absentToday,
        lateToday,
        pendingLeaves,
        onLeave: approvedLeaves,
      },
      chartData,
      recentAttendances,
      todayAttendances,

      // Reports page data
      totalWorkingDays,
      averageAttendanceRate: avgRate,
      mostLateEmployees,
      dailyRates,
      employeeSummaries,
    })
  } catch (error) {
    console.error('Reports GET error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
