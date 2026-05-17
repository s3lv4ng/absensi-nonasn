import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { getJakartaTime, createJakartaDate } from '@/lib/timezone'

interface CalendarDayData {
  day: number
  date: string
  dayOfWeek: number
  isWeekend: boolean
  isWorkDay: boolean
  status: string
  statusType: 'HADIR' | 'TELAT' | 'IZIN' | 'CUTI' | 'SAKIT' | 'DINAS_LUAR' | 'DINAS_DALAM' | 'ALPHA' | 'LIBUR' | 'WEEKEND' | 'MENUNGGU' | 'NON_AKTIF' | 'PULANG_CEPAT' | 'SETENGAH_HARI'
  holidayName: string | null
  masukTime: { hours: number; minutes: number } | null
  pulangTime: { hours: number; minutes: number } | null
  masukStatus: string | null
  pulangStatus: string | null
  isManual: boolean
  leaveType: string | null
  leaveReason: string | null
  lateMinutes: number | null
  earlyMinutes: number | null
}

function parseLateMinutes(note: string): number | null {
  const match = note.match(/Terlambat\s+(\d+)\s+menit/)
  return match ? parseInt(match[1]) : null
}

function parseEarlyMinutes(note: string): number | null {
  const match = note.match(/Pulang cepat\s+(\d+)\s+menit/)
  return match ? parseInt(match[1]) : null
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

    // Only allow pegawai to see their own calendar (admin can specify userId)
    const userId = authUser.role === 'ADMIN' && searchParams.get('userId')
      ? searchParams.get('userId')!
      : authUser.userId

    // Get the user with shift info
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { shift: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Pegawai tidak ditemukan' }, { status: 404 })
    }

    // Calculate date range for the month (Jakarta timezone)
    const monthStart = createJakartaDate(year, month - 1, 1, 0, 0)
    const monthEnd = createJakartaDate(year, month, 1, 0, 0)

    // Fetch attendance records for the month
    const attendances = await db.attendance.findMany({
      where: {
        userId,
        createdAt: {
          gte: monthStart,
          lt: monthEnd,
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Fetch approved leave requests that overlap with this month
    const leaves = await db.leaveRequest.findMany({
      where: {
        userId,
        status: 'APPROVED',
        startDate: { lt: monthEnd },
        endDate: { gte: monthStart },
      },
    })

    // Fetch holidays for the month
    const holidays = await db.holiday.findMany({
      where: {
        date: {
          gte: monthStart,
          lt: monthEnd,
        },
      },
    })

    // Get office settings for work days
    const officeSetting = await db.officeSetting.findFirst()

    // Determine work days from user's shift or office setting
    const workDaysStr = user.shift?.workDays || officeSetting?.workDays || '1,2,3,4,5'
    const workDays = workDaysStr.split(',').map(Number)

    // Build calendar data for each day
    const daysInMonth = new Date(year, month, 0).getDate()
    const calendarDays: CalendarDayData[] = []

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day)
      const dayOfWeek = date.getDay() // 0=Sun, 1=Mon, etc.
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      const isWorkDay = workDays.includes(dayOfWeek)
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

      // Check if this date is before the user's start work date
      const isBeforeStart = user.mulaiBekerja
        ? date < new Date(new Date(user.mulaiBekerja).toDateString())
        : false

      // Check if this date is after the user's end date
      const isAfterEnd = user.tanggalSelesai
        ? date > new Date(new Date(user.tanggalSelesai).toDateString())
        : false

      // Check holiday
      const holiday = holidays.find((h) => {
        const hJakarta = getJakartaTime(new Date(h.date))
        return hJakarta.year === year && hJakarta.month === month - 1 && hJakarta.day === day
      })

      // Get attendance records for this day (using Jakarta timezone)
      const dayStart = createJakartaDate(year, month - 1, day, 0, 0)
      const dayEnd = createJakartaDate(year, month - 1, day + 1, 0, 0)

      const dayAttendances = attendances.filter((a) => {
        const attDate = new Date(a.createdAt)
        return attDate >= dayStart && attDate < dayEnd
      })

      const masukRecord = dayAttendances.find((a) => a.type === 'MASUK')
      const pulangRecord = dayAttendances.find((a) => a.type === 'PULANG')

      // Check leave for this day
      const dayDate = new Date(year, month - 1, day)
      const activeLeave = leaves.find((l) => {
        const start = new Date(new Date(l.startDate).toDateString())
        const end = new Date(new Date(l.endDate).toDateString())
        return dayDate >= start && dayDate <= end
      })

      // Determine status for the day
      let status: string
      let statusType: CalendarDayData['statusType']

      if (isBeforeStart || isAfterEnd) {
        status = 'Non Aktif'
        statusType = 'NON_AKTIF'
      } else if (masukRecord && pulangRecord) {
        // Both masuk and pulang exist
        if (masukRecord.status === 'TELAT' && pulangRecord.status === 'PULANG_CEPAT') {
          status = 'Telat & Pulang Cepat'
          statusType = 'TELAT'
        } else if (masukRecord.status === 'TELAT') {
          status = 'Terlambat'
          statusType = 'TELAT'
        } else if (pulangRecord.status === 'PULANG_CEPAT') {
          status = 'Pulang Cepat'
          statusType = 'PULANG_CEPAT'
        } else {
          status = 'Hadir'
          statusType = 'HADIR'
        }
      } else if (masukRecord && !pulangRecord) {
        // Only masuk, no pulang
        if (masukRecord.status === 'TELAT') {
          status = 'Terlambat (Belum Pulang)'
          statusType = 'TELAT'
        } else {
          status = 'Hadir (Belum Pulang)'
          statusType = 'SETENGAH_HARI'
        }
      } else if (activeLeave) {
        // On approved leave — checked BEFORE holiday/weekend so DL/DD/Izin/Cuti/Sakit
        // are shown even when they fall on weekends or holidays
        const leaveType = activeLeave.type.toUpperCase()
        if (leaveType === 'DINAS_LUAR' || leaveType === 'DL') {
          status = 'Dinas Luar'
          statusType = 'DINAS_LUAR'
        } else if (leaveType === 'DINAS_DALAM' || leaveType === 'DD') {
          status = 'Dinas Dalam'
          statusType = 'DINAS_DALAM'
        } else if (leaveType === 'SAKIT') {
          status = 'Sakit'
          statusType = 'SAKIT'
        } else if (leaveType === 'CUTI') {
          status = 'Cuti'
          statusType = 'CUTI'
        } else if (leaveType === 'IZIN') {
          status = 'Izin'
          statusType = 'IZIN'
        } else {
          status = activeLeave.type
          statusType = 'IZIN'
        }
      } else if (holiday) {
        status = holiday.name
        statusType = 'LIBUR'
      } else if (isWeekend || !isWorkDay) {
        status = 'Akhir Pekan'
        statusType = 'WEEKEND'
      } else {
        // Work day but no attendance and no leave
        const today = new Date()
        const thisDate = new Date(year, month - 1, day)
        if (thisDate > today) {
          status = 'Belum Terjadi'
          statusType = 'MENUNGGU'
        } else {
          status = 'Alpha'
          statusType = 'ALPHA'
        }
      }

      calendarDays.push({
        day,
        date: dateStr,
        dayOfWeek,
        isWeekend,
        isWorkDay,
        status,
        statusType,
        holidayName: holiday?.name || null,
        masukTime: masukRecord ? getJakartaTime(new Date(masukRecord.createdAt)) : null,
        pulangTime: pulangRecord ? getJakartaTime(new Date(pulangRecord.createdAt)) : null,
        masukStatus: masukRecord?.status || null,
        pulangStatus: pulangRecord?.status || null,
        isManual: masukRecord?.isManual || pulangRecord?.isManual || false,
        leaveType: activeLeave?.type || null,
        leaveReason: activeLeave?.reason || null,
        lateMinutes: masukRecord?.note ? parseLateMinutes(masukRecord.note) : null,
        earlyMinutes: pulangRecord?.note ? parseEarlyMinutes(pulangRecord.note) : null,
      })
    }

    // Calculate summary
    const summary = {
      hadir: calendarDays.filter((d) => d.statusType === 'HADIR').length,
      telat: calendarDays.filter((d) => d.statusType === 'TELAT').length,
      izin: calendarDays.filter((d) => d.statusType === 'IZIN').length,
      cuti: calendarDays.filter((d) => d.statusType === 'CUTI').length,
      sakit: calendarDays.filter((d) => d.statusType === 'SAKIT').length,
      dinasLuar: calendarDays.filter((d) => d.statusType === 'DINAS_LUAR').length,
      dinasDalam: calendarDays.filter((d) => d.statusType === 'DINAS_DALAM').length,
      alpha: calendarDays.filter((d) => d.statusType === 'ALPHA').length,
      libur: calendarDays.filter((d) => d.statusType === 'LIBUR').length,
      pulangCepat: calendarDays.filter((d) => d.statusType === 'PULANG_CEPAT').length,
      setengahHari: calendarDays.filter((d) => d.statusType === 'SETENGAH_HARI').length,
      totalHariKerja: calendarDays.filter((d) => d.isWorkDay && !d.isWeekend && d.statusType !== 'NON_AKTIF' && d.statusType !== 'LIBUR').length,
    }

    return NextResponse.json({
      calendarDays,
      summary,
      month,
      year,
      employee: {
        id: user.id,
        nama: user.nama,
        nip: user.nip,
        shift: user.shift ? {
          name: user.shift.name,
          startTime: user.shift.startTime,
          endTime: user.shift.endTime,
        } : null,
      },
    })
  } catch (error) {
    console.error('Calendar API error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
