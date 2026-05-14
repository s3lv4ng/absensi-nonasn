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
    const period = searchParams.get('period') || 'monthly' // monthly | yearly
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

    // Dashboard stats
    const totalEmployees = await db.user.count({
      where: { isActive: true, role: 'PEGAWAI' },
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayAttendances = await db.attendance.findMany({
      where: {
        type: 'MASUK',
        createdAt: { gte: today, lt: tomorrow },
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
        startDate: { lte: tomorrow },
        endDate: { gte: today },
      },
    })

    // Chart data - last 7 days (for dashboard)
    const chartData = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const dayAttendances = await db.attendance.findMany({
        where: {
          type: 'MASUK',
          createdAt: { gte: date, lt: nextDate },
        },
      })

      const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' })
      const dayDate = date.getDate() + '/' + (date.getMonth() + 1)

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
    const monthStart = new Date(year, month - 1, 1)
    monthStart.setHours(0, 0, 0, 0)
    const monthEnd = new Date(year, month, 1)
    monthEnd.setHours(0, 0, 0, 0)

    // Get office settings for work days
    const officeSettings = await db.officeSetting.findFirst()
    const workDaysStr = officeSettings?.workDays || '1,2,3,4,5'
    const workDayNums = workDaysStr.split(',').map(Number) // 0=Sun, 1=Mon, etc.

    // Count working days in the month
    let totalWorkingDays = 0
    const tempDate = new Date(monthStart)
    while (tempDate < monthEnd) {
      if (workDayNums.includes(tempDate.getDay())) {
        totalWorkingDays++
      }
      tempDate.setDate(tempDate.getDate() + 1)
    }

    // Subtract holidays that fall on working days
    const holidays = await db.holiday.findMany({
      where: {
        date: { gte: monthStart, lt: monthEnd },
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
        createdAt: { gte: monthStart, lt: monthEnd },
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

    // Get approved leaves for the month
    const monthLeaves = await db.leaveRequest.findMany({
      where: {
        status: 'APPROVED',
        startDate: { lt: monthEnd },
        endDate: { gte: monthStart },
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
      alpha: number
      lateCount: number
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
        alpha: 0,
        lateCount: 0,
      })
    }

    // Count attendances per employee
    for (const att of monthAttendances) {
      const entry = employeeMap.get(att.userId)
      if (!entry) continue

      if (att.status === 'HADIR') {
        entry.hadir++
      } else if (att.status === 'TELAT') {
        entry.telat++
        entry.lateCount++
        entry.hadir++ // telat also counts as present
      } else if (att.status === 'IZIN') {
        entry.izin++
      } else if (att.status === 'CUTI') {
        entry.cuti++
      } else if (att.status === 'ALPHA') {
        entry.alpha++
      }
    }

    // Calculate alpha for employees who didn't check in
    for (const [userId, entry] of employeeMap) {
      const totalRecorded = entry.hadir + entry.izin + entry.cuti + entry.alpha
      if (totalWorkingDays > totalRecorded) {
        entry.alpha += totalWorkingDays - totalRecorded
      }
    }

    // Calculate percentages and build summaries
    const employeeSummaries = Array.from(employeeMap.values()).map((e) => {
      const presentDays = e.hadir // hadir already includes telat
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
        alpha: e.alpha,
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

    // Daily attendance rates for line chart
    const dailyRates = []
    const rateDate = new Date(monthStart)
    while (rateDate < monthEnd) {
      // Only include working days
      if (workDayNums.includes(rateDate.getDay())) {
        // Check if it's a holiday
        const isHoliday = holidays.some((h) => {
          const hd = new Date(h.date)
          return hd.getDate() === rateDate.getDate() &&
            hd.getMonth() === rateDate.getMonth() &&
            hd.getFullYear() === rateDate.getFullYear()
        })

        if (!isHoliday) {
          const dayStart = new Date(rateDate)
          dayStart.setHours(0, 0, 0, 0)
          const dayEnd = new Date(rateDate)
          dayEnd.setDate(dayEnd.getDate() + 1)

          const dayAttendancesList = monthAttendances.filter((a) => {
            const aDate = new Date(a.createdAt)
            return aDate >= dayStart && aDate < dayEnd
          })

          const dayHadir = dayAttendancesList.filter((a) => a.status === 'HADIR').length
          const dayTelat = dayAttendancesList.filter((a) => a.status === 'TELAT').length
          const dayPresent = dayHadir + dayTelat
          const rate = totalEmployees > 0
            ? Math.round((dayPresent / totalEmployees) * 1000) / 10
            : 0

          const dayLabel = rateDate.getDate() + '/' + (rateDate.getMonth() + 1)

          dailyRates.push({
            date: dayLabel,
            rate,
            hadir: dayHadir,
            telat: dayTelat,
            total: totalEmployees,
          })
        }
      }
      rateDate.setDate(rateDate.getDate() + 1)
    }

    return NextResponse.json({
      // Dashboard data (existing)
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

      // Reports page data (new)
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
