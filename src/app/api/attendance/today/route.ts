import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { getJakartaTime, createJakartaDate } from '@/lib/timezone'

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || authUser.userId
    const effectiveUserId = authUser.role !== 'ADMIN' ? authUser.userId : userId

    // Use Jakarta timezone for "today" boundaries
    const nowJakarta = getJakartaTime(new Date())
    const todayStartUtc = createJakartaDate(nowJakarta.year, nowJakarta.month, nowJakarta.day, 0, 0)
    const todayEndUtc = createJakartaDate(nowJakarta.year, nowJakarta.month, nowJakarta.day + 1, 0, 0)

    const todayAttendance = await db.attendance.findMany({
      where: {
        userId: effectiveUserId,
        createdAt: {
          gte: todayStartUtc,
          lt: todayEndUtc,
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    const masuk = todayAttendance.find((a) => a.type === 'MASUK')
    const pulang = todayAttendance.find((a) => a.type === 'PULANG')

    return NextResponse.json({
      masuk: masuk || null,
      pulang: pulang || null,
      hasClockedIn: !!masuk,
      hasClockedOut: !!pulang,
      allToday: todayAttendance,
    })
  } catch (error) {
    console.error('Today attendance error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
