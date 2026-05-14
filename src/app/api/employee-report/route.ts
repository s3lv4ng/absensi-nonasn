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
    const userId = searchParams.get('userId')
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

    if (!userId) {
      return NextResponse.json({ error: 'UserId wajib diisi' }, { status: 400 })
    }

    // Get employee info
    const employee = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nip: true,
        nama: true,
        email: true,
        unitKerja: true,
        jabatan: true,
        shift: true,
      },
    })

    if (!employee) {
      return NextResponse.json({ error: 'Pegawai tidak ditemukan' }, { status: 404 })
    }

    // Date range for the month
    const monthStart = new Date(year, month - 1, 1)
    monthStart.setHours(0, 0, 0, 0)
    const monthEnd = new Date(year, month, 1)
    monthEnd.setHours(0, 0, 0, 0)

    // Get all attendances for this user in the month
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

    // Get approved leaves for this user in the month
    const leaves = await db.leaveRequest.findMany({
      where: {
        userId,
        status: 'APPROVED',
        startDate: { lt: monthEnd },
        endDate: { gte: monthStart },
      },
    })

    // Build daily record for each day of the month
    const daysInMonth = new Date(year, month, 0).getDate()
    const dailyRecords = []

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day)
      const nextDate = new Date(year, month - 1, day + 1)

      const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' })
      const isWeekend = date.getDay() === 0 || date.getDay() === 6

      // Find MASUK and PULANG for this day
      const dayAttendances = attendances.filter((a) => {
        const aDate = new Date(a.createdAt)
        return aDate >= date && aDate < nextDate
      })

      const masuk = dayAttendances.find((a) => a.type === 'MASUK')
      const pulang = dayAttendances.find((a) => a.type === 'PULANG')

      // Check if on approved leave
      const onLeave = leaves.some((l) => {
        const start = new Date(l.startDate)
        const end = new Date(l.endDate)
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        return date >= start && date <= end
      })

      // Determine status
      let status = 'ALPHA'
      let leaveType: string | null = null

      if (isWeekend) {
        status = 'LIBUR'
      } else if (onLeave) {
        const leave = leaves.find((l) => {
          const start = new Date(l.startDate)
          const end = new Date(l.endDate)
          start.setHours(0, 0, 0, 0)
          end.setHours(23, 59, 59, 999)
          return date >= start && date <= end
        })
        if (leave) {
          status = leave.type
          leaveType = leave.type
        }
      } else if (masuk) {
        status = masuk.status
      }

      dailyRecords.push({
        day,
        date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        dayName,
        isWeekend,
        masukTime: masuk
          ? new Date(masuk.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
          : null,
        pulangTime: pulang
          ? new Date(pulang.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
          : null,
        status,
        leaveType,
        masukId: masuk?.id || null,
        pulangId: pulang?.id || null,
      })
    }

    // Summary
    const summary = {
      totalDays: daysInMonth,
      hadir: dailyRecords.filter((d) => d.status === 'HADIR').length,
      telat: dailyRecords.filter((d) => d.status === 'TELAT').length,
      izin: dailyRecords.filter((d) => d.status === 'IZIN' || d.status === 'DINAS').length,
      cuti: dailyRecords.filter((d) => d.status === 'CUTI').length,
      sakit: dailyRecords.filter((d) => d.status === 'SAKIT').length,
      alpha: dailyRecords.filter((d) => d.status === 'ALPHA').length,
      libur: dailyRecords.filter((d) => d.status === 'LIBUR').length,
    }

    return NextResponse.json({
      employee,
      dailyRecords,
      summary,
      month,
      year,
    })
  } catch (error) {
    console.error('Employee report error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
