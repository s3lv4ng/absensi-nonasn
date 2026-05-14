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
    const { type, latitude, longitude, photo, confidence, status, officeId, faceVerified } = body

    if (!type || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Type, latitude, dan longitude wajib diisi' },
        { status: 400 }
      )
    }

    // Check face verification flag
    if (faceVerified !== true) {
      return NextResponse.json(
        { error: 'Verifikasi wajah gagal. Wajah tidak cocok dengan data yang terdaftar.' },
        { status: 400 }
      )
    }

    // Get the user with their assigned shift
    const userWithShift = await db.user.findUnique({
      where: { id: authUser.userId },
      include: { shift: true },
    })

    // Check if user has registered face data - MUST have face registered to attend
    if (userWithShift && !userWithShift.faceDescriptor) {
      return NextResponse.json(
        { error: 'Data wajah belum terdaftar. Silakan daftarkan wajah Anda di halaman Profil terlebih dahulu.' },
        { status: 400 }
      )
    }

    // Get office location for validation - prefer selected office, fallback to OfficeSetting
    let officeLat: number
    let officeLon: number
    let officeRadius: number
    let shiftStartTime: string
    let shiftLateTolerance: number
    let shiftId: string | null = null

    if (officeId) {
      const office = await db.office.findUnique({ where: { id: officeId } })
      if (!office) {
        return NextResponse.json(
          { error: 'Lokasi kantor tidak ditemukan' },
          { status: 400 }
        )
      }
      officeLat = office.latitude
      officeLon = office.longitude
      officeRadius = office.radiusMeter
    } else {
      // Fallback to legacy OfficeSetting
      const officeSetting = await db.officeSetting.findFirst()
      if (!officeSetting) {
        return NextResponse.json(
          { error: 'Pengaturan kantor belum dikonfigurasi' },
          { status: 400 }
        )
      }
      officeLat = officeSetting.latitude
      officeLon = officeSetting.longitude
      officeRadius = officeSetting.radiusMeter
    }

    // Determine time settings: prefer user's assigned shift, fallback to OfficeSetting
    if (userWithShift?.shift && userWithShift.shift.isActive) {
      // Use the user's assigned work shift
      shiftStartTime = userWithShift.shift.startTime
      shiftLateTolerance = userWithShift.shift.lateTolerance
      shiftId = userWithShift.shift.id
    } else {
      // Fallback to OfficeSetting or defaults
      const officeSetting = await db.officeSetting.findFirst()
      shiftStartTime = officeSetting?.startTime || '08:00'
      shiftLateTolerance = officeSetting?.lateTolerance || 15
    }

    // Validate GPS location using Haversine
    const R = 6371000
    const toRad = (deg: number) => (deg * Math.PI) / 180
    const φ1 = toRad(officeLat)
    const φ2 = toRad(latitude)
    const Δφ = toRad(latitude - officeLat)
    const Δλ = toRad(longitude - officeLon)
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c

    if (distance > officeRadius) {
      return NextResponse.json(
        {
          error: `Anda berada di luar radius kantor (${Math.round(distance)}m dari kantor, max ${officeRadius}m)`,
          distance: Math.round(distance),
          maxRadius: officeRadius,
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

    // Determine status based on user's assigned shift
    let attendanceStatus = status || 'HADIR'
    if (type === 'MASUK') {
      const now = new Date()
      const [hours, minutes] = shiftStartTime.split(':').map(Number)
      const startTime = new Date(now)
      startTime.setHours(hours, minutes + shiftLateTolerance, 0, 0)

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
        shiftId: shiftId,
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
              shiftId: true,
              shift: {
                select: {
                  id: true,
                  name: true,
                  startTime: true,
                  endTime: true,
                  color: true,
                },
              },
            },
          },
          shift: {
            select: {
              id: true,
              name: true,
              startTime: true,
              endTime: true,
              color: true,
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
