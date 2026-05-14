import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

    // Month boundaries
    const monthStart = new Date(year, month - 1, 1)
    monthStart.setHours(0, 0, 0, 0)
    const monthEnd = new Date(year, month, 1)
    monthEnd.setHours(0, 0, 0, 0)

    // Days in month
    const daysInMonth = new Date(year, month, 0).getDate()

    // Get office settings
    const officeSettings = await db.officeSetting.findFirst()

    // Get all active employees sorted by name
    const allEmployees = await db.user.findMany({
      where: { isActive: true, role: 'PEGAWAI' },
      select: {
        id: true,
        nip: true,
        nama: true,
        jabatan: true,
        unitKerja: true,
        shiftId: true,
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

    // Get all MASUK attendances for the month
    const masukAttendances = await db.attendance.findMany({
      where: {
        type: 'MASUK',
        createdAt: { gte: monthStart, lt: monthEnd },
      },
      select: {
        id: true,
        userId: true,
        status: true,
        createdAt: true,
        shiftId: true,
      },
    })

    // Get all PULANG attendances for the month
    const pulangAttendances = await db.attendance.findMany({
      where: {
        type: 'PULANG',
        createdAt: { gte: monthStart, lt: monthEnd },
      },
      select: {
        id: true,
        userId: true,
        status: true,
        createdAt: true,
        shiftId: true,
      },
    })

    // Get approved leave requests for the month
    const leaveRequests = await db.leaveRequest.findMany({
      where: {
        status: 'APPROVED',
        startDate: { lt: monthEnd },
        endDate: { gte: monthStart },
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
        date: { gte: monthStart, lt: monthEnd },
      },
      select: {
        id: true,
        name: true,
        date: true,
      },
    })

    // Build holiday set (date string -> holiday name)
    const holidayMap = new Map<string, string>()
    for (const h of holidays) {
      const d = new Date(h.date)
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      holidayMap.set(key, h.name)
    }

    // Get work days from office setting
    const workDaysStr = officeSettings?.workDays || '1,2,3,4,5'
    const workDayNums = workDaysStr.split(',').map(Number)

    // Helper: get date key
    const getDateKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

    // Build attendance maps per user per day
    type AttendanceInfo = {
      masukTime: string | null
      pulangTime: string | null
      masukStatus: string | null
      pulangStatus: string | null
    }

    const attendanceMap = new Map<string, AttendanceInfo>()

    const formatTime = (date: Date): string => {
      const h = date.getHours().toString().padStart(2, '0')
      const m = date.getMinutes().toString().padStart(2, '0')
      return `${h}:${m}`
    }

    // Process MASUK attendances
    for (const att of masukAttendances) {
      const attDate = new Date(att.createdAt)
      const key = `${att.userId}_${attDate.getDate()}`
      const existing = attendanceMap.get(key) || { masukTime: null, pulangTime: null, masukStatus: null, pulangStatus: null }
      existing.masukTime = formatTime(attDate)
      existing.masukStatus = att.status
      attendanceMap.set(key, existing)
    }

    // Process PULANG attendances
    for (const att of pulangAttendances) {
      const attDate = new Date(att.createdAt)
      const key = `${att.userId}_${attDate.getDate()}`
      const existing = attendanceMap.get(key) || { masukTime: null, pulangTime: null, masukStatus: null, pulangStatus: null }
      existing.pulangTime = formatTime(attDate)
      existing.pulangStatus = att.status
      attendanceMap.set(key, existing)
    }

    // Build leave map per user per day
    const leaveMap = new Map<string, string>() // userId_day -> leave type code
    for (const leave of leaveRequests) {
      const start = new Date(leave.startDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(leave.endDate)
      end.setHours(23, 59, 59, 999)

      // Iterate through all days of the leave
      const current = new Date(start)
      while (current <= end) {
        if (current.getMonth() === month - 1 && current.getFullYear() === year) {
          const day = current.getDate()
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
        current.setDate(current.getDate() + 1)
      }
    }

    // Build day info (which days are weekends, holidays, etc.)
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
      const holidayKey = getDateKey(date)
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
        status: string // 'HADIR' | 'TELAT' | 'DL' | 'DD' | 'I' | 'C' | 'S' | 'ALPHA' | '-' (weekend/holiday)
        isWeekend: boolean
        isHoliday: boolean
      }[] = []

      for (let d = 1; d <= daysInMonth; d++) {
        const info = dayInfo[d - 1]
        const attKey = `${emp.id}_${d}`
        const att = attendanceMap.get(attKey)
        const leaveCode = leaveMap.get(attKey)

        if (info.isWeekend || info.isHoliday) {
          days.push({
            day: d,
            masuk: null,
            pulang: null,
            status: '-',
            isWeekend: info.isWeekend,
            isHoliday: info.isHoliday,
          })
        } else if (att?.masukTime) {
          // Has attendance
          const masukStatus = att.masukStatus || 'HADIR'
          days.push({
            day: d,
            masuk: att.masukTime,
            pulang: att.pulangTime,
            status: masukStatus === 'TELAT' ? 'TELAT' : 'HADIR',
            isWeekend: false,
            isHoliday: false,
          })
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
