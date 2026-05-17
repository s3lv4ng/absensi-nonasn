import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { calculateAttendanceTiming } from '@/lib/attendance-utils'
import { formatJakartaTime, getJakartaDay, getJakartaDayOfWeek, getJakartaTime, getShiftDate, createJakartaDate } from '@/lib/timezone'

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))
    const unitKerjaId = searchParams.get('unitKerjaId') || ''
    const jabatanId = searchParams.get('jabatanId') || ''
    const shiftId = searchParams.get('shiftId') || ''

    // Month boundaries (in Jakarta timezone)
    // We need to query a wider range from the database because UTC dates may shift
    // by up to 7 hours from Jakarta dates. We'll filter to exact Jakarta dates afterwards.
    const monthStartUtc = createJakartaDate(year, month - 1, 1, 0, 0)
    const monthEndUtc = createJakartaDate(year, month, 1, 0, 0)

    // Days in month
    const daysInMonth = new Date(year, month, 0).getDate()

    // Get office settings
    const officeSettings = await db.officeSetting.findFirst()

    // Build employee filter
    const employeeFilter: Record<string, unknown> = { isActive: true, role: 'PEGAWAI' }
    if (unitKerjaId) employeeFilter.unitKerjaId = unitKerjaId
    if (jabatanId) employeeFilter.jabatanId = jabatanId
    if (shiftId) employeeFilter.shiftId = shiftId

    // Get all active employees sorted by name (with optional filters)
    const allEmployees = await db.user.findMany({
      where: employeeFilter,
      select: {
        id: true,
        nip: true,
        nama: true,
        jabatan: true,
        unitKerja: true,
        unitKerjaId: true,
        jabatanId: true,
        shiftId: true,
        mulaiBekerja: true,
        tanggalSelesai: true,
        shift: {
          select: {
            id: true,
            name: true,
            startTime: true,
            endTime: true,
            lateTolerance: true,
            workDays: true,
          },
        },
      },
      orderBy: { nama: 'asc' },
    })

    // Build a map of userId -> shift info
    const userShiftMap = new Map<string, { startTime: string; endTime: string; lateTolerance: number }>()
    for (const emp of allEmployees) {
      if (emp.shift) {
        userShiftMap.set(emp.id, {
          startTime: emp.shift.startTime,
          endTime: emp.shift.endTime,
          lateTolerance: emp.shift.lateTolerance,
        })
      }
    }

    // Default shift from office settings
    const defaultShift = {
      startTime: officeSettings?.startTime || '08:00',
      endTime: officeSettings?.endTime || '17:00',
      lateTolerance: officeSettings?.lateTolerance || 15,
    }

    // Build set of filtered employee IDs for attendance queries
    const filteredUserIds = new Set(allEmployees.map((e) => e.id))

    // Get all MASUK attendances for the month (query with buffer for timezone)
    const masukAttendances = await db.attendance.findMany({
      where: {
        type: 'MASUK',
        createdAt: { gte: monthStartUtc, lt: monthEndUtc },
        ...(filteredUserIds.size > 0 ? { userId: { in: Array.from(filteredUserIds) } } : {}),
      },
      select: {
        id: true,
        userId: true,
        status: true,
        createdAt: true,
        shiftId: true,
        isManual: true,
      },
    })

    // Get all PULANG attendances for the month
    const pulangAttendances = await db.attendance.findMany({
      where: {
        type: 'PULANG',
        createdAt: { gte: monthStartUtc, lt: monthEndUtc },
        ...(filteredUserIds.size > 0 ? { userId: { in: Array.from(filteredUserIds) } } : {}),
      },
      select: {
        id: true,
        userId: true,
        status: true,
        createdAt: true,
        shiftId: true,
        isManual: true,
      },
    })

    // Get approved leave requests for the month
    const leaveRequests = await db.leaveRequest.findMany({
      where: {
        status: 'APPROVED',
        startDate: { lt: monthEndUtc },
        endDate: { gte: monthStartUtc },
        ...(filteredUserIds.size > 0 ? { userId: { in: Array.from(filteredUserIds) } } : {}),
      },
      select: {
        id: true,
        userId: true,
        type: true,
        startDate: true,
        endDate: true,
      },
    })

    // Get holidays for the month
    const holidays = await db.holiday.findMany({
      where: {
        date: { gte: monthStartUtc, lt: monthEndUtc },
      },
      select: {
        id: true,
        name: true,
        date: true,
      },
    })

    // Build holiday set (Jakarta date key -> holiday name)
    const holidayMap = new Map<string, string>()
    for (const h of holidays) {
      const jakartaTime = getJakartaTime(new Date(h.date))
      const key = `${jakartaTime.year}-${jakartaTime.month}-${jakartaTime.day}`
      holidayMap.set(key, h.name)
    }

    // Get work days from office setting
    const workDaysStr = officeSettings?.workDays || '1,2,3,4,5'
    const workDayNums = workDaysStr.split(',').map(Number)

    // Helper: get Jakarta date key
    const getDateKey = (year: number, month: number, day: number) => `${year}-${month}-${day}`

    // Build attendance maps per user per day (using Jakarta shift date)
    type AttendanceInfo = {
      masukTime: string | null
      pulangTime: string | null
      masukStatus: string | null
      pulangStatus: string | null
      isManualMasuk: boolean
      isManualPulang: boolean
    }

    const attendanceMap = new Map<string, AttendanceInfo>()

    // Process MASUK attendances - group by effective shift date
    for (const att of masukAttendances) {
      const attDate = new Date(att.createdAt)

      // Get shift info for this user
      const shiftInfo = userShiftMap.get(att.userId) || defaultShift

      // Determine the effective shift date in Jakarta timezone
      const shiftDate = getShiftDate(attDate, shiftInfo.startTime, shiftInfo.endTime)

      // Filter: only include attendances that fall within the selected month in Jakarta time
      if (shiftDate.year !== year || shiftDate.month !== month - 1) continue

      const key = `${att.userId}_${shiftDate.day}`
      const existing = attendanceMap.get(key) || { masukTime: null, pulangTime: null, masukStatus: null, pulangStatus: null, isManualMasuk: false, isManualPulang: false }
      existing.masukTime = formatJakartaTime(attDate)
      existing.isManualMasuk = att.isManual

      // Recalculate TELAT status based on current shift assignment
      // This ensures the rekap shows correct status even if the original
      // attendance was saved with wrong status (e.g., user wasn't assigned to shift at that time)
      const calcResult = calculateAttendanceTiming(
        shiftInfo.startTime,
        shiftInfo.endTime,
        shiftInfo.lateTolerance,
        attDate,
        'MASUK'
      )
      existing.masukStatus = calcResult.isLate ? 'TELAT' : 'HADIR'

      attendanceMap.set(key, existing)
    }

    // Process PULANG attendances - group by effective shift date
    for (const att of pulangAttendances) {
      const attDate = new Date(att.createdAt)

      // Get shift info for this user
      const shiftInfo = userShiftMap.get(att.userId) || defaultShift

      // Determine the effective shift date in Jakarta timezone
      const shiftDate = getShiftDate(attDate, shiftInfo.startTime, shiftInfo.endTime)

      // Filter: only include attendances that fall within the selected month in Jakarta time
      if (shiftDate.year !== year || shiftDate.month !== month - 1) continue

      const key = `${att.userId}_${shiftDate.day}`
      const existing = attendanceMap.get(key) || { masukTime: null, pulangTime: null, masukStatus: null, pulangStatus: null, isManualMasuk: false, isManualPulang: false }
      existing.pulangTime = formatJakartaTime(attDate)
      existing.isManualPulang = att.isManual

      // Recalculate PULANG_CEPAT status based on current shift assignment
      const calcResult = calculateAttendanceTiming(
        shiftInfo.startTime,
        shiftInfo.endTime,
        shiftInfo.lateTolerance,
        attDate,
        'PULANG'
      )
      existing.pulangStatus = calcResult.isEarly ? 'PULANG_CEPAT' : 'HADIR'

      attendanceMap.set(key, existing)
    }

    // Build leave map per user per day (in Jakarta timezone)
    const leaveMap = new Map<string, string>() // userId_day -> leave type code
    for (const leave of leaveRequests) {
      const startJakarta = getJakartaTime(new Date(leave.startDate))
      const endJakarta = getJakartaTime(new Date(leave.endDate))

      // Iterate through all days of the leave in Jakarta timezone
      let currentYear = startJakarta.year
      let currentMonth = startJakarta.month
      let currentDay = startJakarta.day

      while (true) {
        const currentDate = createJakartaDate(currentYear, currentMonth, currentDay)
        const currentJakarta = getJakartaTime(currentDate)

        // Check if we've passed the end date
        if (currentJakarta.year > endJakarta.year ||
            (currentJakarta.year === endJakarta.year && currentJakarta.month > endJakarta.month) ||
            (currentJakarta.year === endJakarta.year && currentJakarta.month === endJakarta.month && currentJakarta.day > endJakarta.day)) {
          break
        }

        if (currentJakarta.month === month - 1 && currentJakarta.year === year) {
          const day = currentJakarta.day
          const key = `${leave.userId}_${day}`
          // Map leave type to code
          let code = leave.type
          if (leave.type === 'DINAS_LUAR' || leave.type === 'DL') code = 'DL'
          else if (leave.type === 'DINAS_DALAM' || leave.type === 'DD') code = 'DD'
          else if (leave.type === 'IZIN') code = 'I'
          else if (leave.type === 'CUTI') code = 'C'
          else if (leave.type === 'SAKIT') code = 'S'
          leaveMap.set(key, code)
        }

        // Move to next day
        currentDay++
        const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
        if (currentDay > daysInCurrentMonth) {
          currentDay = 1
          currentMonth++
          if (currentMonth > 11) {
            currentMonth = 0
            currentYear++
          }
        }
      }
    }

    // Build day info (which days are weekends, holidays, etc.) using Jakarta timezone
    const dayInfo: {
      day: number
      isWeekend: boolean
      isHoliday: boolean
      holidayName: string | null
    }[] = []

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d)
      const dayOfWeek = date.getDay()
      const isWeekend = !workDayNums.includes(dayOfWeek)
      const holidayKey = getDateKey(year, month - 1, d)
      const holidayName = holidayMap.get(holidayKey) || null
      const isHoliday = !!holidayName

      dayInfo.push({
        day: d,
        isWeekend,
        isHoliday,
        holidayName,
      })
    }

    // Build employee data rows
    const employeeRows = allEmployees.map((emp) => {
      const days: {
        day: number
        masuk: string | null
        pulang: string | null
        status: string // 'HADIR' | 'TELAT' | 'TIDAK_LENGKAP' | 'DL' | 'DD' | 'I' | 'C' | 'S' | 'ALPHA' | '-' (weekend/holiday)
        isWeekend: boolean
        isHoliday: boolean
        isManualMasuk?: boolean
        isManualPulang?: boolean
      }[] = []

      for (let d = 1; d <= daysInMonth; d++) {
        const info = dayInfo[d - 1]
        const attKey = `${emp.id}_${d}`
        const att = attendanceMap.get(attKey)
        const leaveCode = leaveMap.get(attKey)

        // Check if this date is before the employee's start date or after end date
        const currentDate = new Date(year, month - 1, d)
        const mulaiBekerja = emp.mulaiBekerja ? new Date(emp.mulaiBekerja) : null
        const tanggalSelesai = emp.tanggalSelesai ? new Date(emp.tanggalSelesai) : null

        // Normalize dates to compare only year-month-day (ignore time)
        const currentDateOnly = new Date(year, month - 1, d)
        const mulaiBekerjaOnly = mulaiBekerja ? new Date(mulaiBekerja.getFullYear(), mulaiBekerja.getMonth(), mulaiBekerja.getDate()) : null
        const tanggalSelesaiOnly = tanggalSelesai ? new Date(tanggalSelesai.getFullYear(), tanggalSelesai.getMonth(), tanggalSelesai.getDate()) : null

        if ((mulaiBekerjaOnly && currentDateOnly < mulaiBekerjaOnly) || (tanggalSelesaiOnly && currentDateOnly > tanggalSelesaiOnly)) {
          // Date is outside the employee's working period - don't mark as anything
          days.push({
            day: d,
            masuk: null,
            pulang: null,
            status: '-',
            isWeekend: false,
            isHoliday: false,
          })
          continue
        }

        // Check for leave code on this day (even weekends/holidays)
        if (leaveCode) {
          days.push({
            day: d,
            masuk: leaveCode,
            pulang: leaveCode,
            status: leaveCode,
            isWeekend: info.isWeekend,
            isHoliday: info.isHoliday,
          })
        } else if (info.isWeekend || info.isHoliday) {
          days.push({
            day: d,
            masuk: null,
            pulang: null,
            status: '-',
            isWeekend: info.isWeekend,
            isHoliday: info.isHoliday,
          })
        } else if (att?.masukTime && att?.pulangTime) {
          // Both masuk and pulang recorded -> full attendance
          const masukStatus = att.masukStatus || 'HADIR'
          days.push({
            day: d,
            masuk: att.masukTime,
            pulang: att.pulangTime,
            status: masukStatus === 'TELAT' ? 'TELAT' : 'HADIR',
            isWeekend: false,
            isHoliday: false,
            isManualMasuk: att.isManualMasuk,
            isManualPulang: att.isManualPulang,
          })
        } else if (att?.masukTime && !att?.pulangTime) {
          // Only masuk, no pulang
          if (att.isManualMasuk) {
            // Manual override by admin -> count as hadir
            const masukStatus = att.masukStatus || 'HADIR'
            days.push({
              day: d,
              masuk: att.masukTime,
              pulang: null,
              status: masukStatus === 'TELAT' ? 'TELAT' : 'HADIR',
              isWeekend: false,
              isHoliday: false,
              isManualMasuk: true,
            })
          } else {
            // Incomplete -> not counted as hadir
            days.push({
              day: d,
              masuk: att.masukTime,
              pulang: null,
              status: 'TIDAK_LENGKAP',
              isWeekend: false,
              isHoliday: false,
              isManualMasuk: false,
            })
          }
        } else if (!att?.masukTime && att?.pulangTime) {
          // Only pulang, no masuk
          if (att.isManualPulang) {
            // Manual override by admin -> count as hadir
            days.push({
              day: d,
              masuk: null,
              pulang: att.pulangTime,
              status: 'HADIR',
              isWeekend: false,
              isHoliday: false,
              isManualPulang: true,
            })
          } else {
            // Incomplete -> not counted as hadir
            days.push({
              day: d,
              masuk: null,
              pulang: att.pulangTime,
              status: 'TIDAK_LENGKAP',
              isWeekend: false,
              isHoliday: false,
              isManualPulang: false,
            })
          }
        } else if (leaveCode) {
          // Has approved leave
          days.push({
            day: d,
            masuk: leaveCode,
            pulang: leaveCode,
            status: leaveCode,
            isWeekend: false,
            isHoliday: false,
          })
        } else {
          // No attendance, no leave = ALPHA
          days.push({
            day: d,
            masuk: null,
            pulang: null,
            status: 'ALPHA',
            isWeekend: false,
            isHoliday: false,
          })
        }
      }

      return {
        userId: emp.id,
        nip: emp.nip,
        nama: emp.nama,
        jabatan: emp.jabatan,
        unitKerja: emp.unitKerja,
        shift: emp.shift ? {
          name: emp.shift.name,
          startTime: emp.shift.startTime,
          endTime: emp.shift.endTime,
        } : null,
        days,
      }
    })

    return NextResponse.json({
      officeName: officeSettings?.officeName || 'Kantor',
      month,
      year,
      daysInMonth,
      dayInfo,
      employees: employeeRows,
    })
  } catch (error) {
    console.error('Rekap Absen API error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
