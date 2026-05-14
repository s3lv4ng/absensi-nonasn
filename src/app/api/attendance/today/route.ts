import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || authUser.userId
    const effectiveUserId = authUser.role !== 'ADMIN' ? authUser.userId : userId

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayAttendance = await db.attendance.findMany({
      where: {
        userId: effectiveUserId,
        createdAt: {
          gte: today,
          lt: tomorrow,
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
