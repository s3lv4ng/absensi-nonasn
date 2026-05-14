import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const body = await request.json()
    const { type, latitude, longitude, photo, confidence, status } = body

    if (!type || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Type, latitude, dan longitude wajib diisi' },
        { status: 400 }
      )
    }

    // Get office settings for validation
    const officeSetting = await db.officeSetting.findFirst()
    if (!officeSetting) {
      return NextResponse.json(
        { error: 'Pengaturan kantor belum dikonfigurasi' },
        { status: 400 }
      )
    }

    // Validate GPS location using Haversine
    const R = 6371000
    const toRad = (deg: number) => (deg * Math.PI) / 180
    const φ1 = toRad(officeSetting.latitude)
    const φ2 = toRad(latitude)
    const Δφ = toRad(latitude - officeSetting.latitude)
    const Δλ = toRad(longitude - officeSetting.longitude)
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c

    if (distance > officeSetting.radiusMeter) {
      return NextResponse.json(
        {
          error: `Anda berada di luar radius kantor (${Math.round(distance)}m dari kantor, max ${officeSetting.radiusMeter}m)`,
          distance: Math.round(distance),
          maxRadius: officeSetting.radiusMeter,
        },
        { status: 400 }
      )
    }

    // Check if already clocked in/out today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const existingToday = await db.attendance.findFirst({
      where: {
        userId: authUser.userId,
        type,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    })

    if (existingToday) {
      return NextResponse.json(
        { error: `Anda sudah melakukan absensi ${type.toLowerCase()} hari ini` },
        { status: 400 }
      )
    }

    // Determine status
    let attendanceStatus = status || 'HADIR'
    if (type === 'MASUK') {
      const now = new Date()
      const [hours, minutes] = officeSetting.startTime.split(':').map(Number)
      const startTime = new Date(now)
      startTime.setHours(hours, minutes + officeSetting.lateTolerance, 0, 0)

      if (now > startTime) {
        attendanceStatus = 'TELAT'
      }
    }

    const attendance = await db.attendance.create({
      data: {
        userId: authUser.userId,
        type,
        latitude,
        longitude,
        photo: photo || null,
        confidence: confidence || 0,
        status: attendanceStatus,
      },
    })

    return NextResponse.json({
      message: `Absensi ${type.toLowerCase()} berhasil`,
      attendance,
      distance: Math.round(distance),
    }, { status: 201 })
  } catch (error) {
    console.error('Attendance POST error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Non-admin users can only see their own data
    const effectiveUserId = authUser.role !== 'ADMIN' ? authUser.userId : userId

    const where: Record<string, unknown> = {}
    if (effectiveUserId) {
      where.userId = effectiveUserId
    }

    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lt: new Date(new Date(endDate).getTime() + 86400000) } : {}),
      }
    }

    if (status) {
      where.status = status
    }

    if (type) {
      where.type = type
    }

    const [attendances, total] = await Promise.all([
      db.attendance.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              nip: true,
              nama: true,
              email: true,
              role: true,
              photo: true,
              unitKerja: true,
              jabatan: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.attendance.count({ where }),
    ])

    return NextResponse.json({
      attendances,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Attendance GET error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
