import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { calculateAttendanceTiming } from '@/lib/attendance-utils'
import { getJakartaTime, createJakartaDate } from '@/lib/timezone'
import { putDataUrl, isDataUrl } from '@/lib/blob-store'

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

    // Check if already clocked in/out today (using Jakarta timezone)
    const nowJakarta = getJakartaTime(new Date())

    // Determine shift boundaries for the "today" check
    // For cross-midnight shifts (e.g., 22:00-06:00), "today" spans from shift start to shift end
    const [startH, startM] = shiftStartTime.split(':').map(Number)
    const startMinutes = startH * 60 + startM

    // Determine the effective shift date in Jakarta timezone
    let shiftDateYear = nowJakarta.year
    let shiftDateMonth = nowJakarta.month
    let shiftDateDay = nowJakarta.day

    // Determine shift end time
    let shiftEndTime: string | null = null
    if (userWithShift?.shift && userWithShift.shift.isActive) {
      shiftEndTime = userWithShift.shift.endTime
    } else {
      const officeSettingFallback = await db.officeSetting.findFirst()
      shiftEndTime = officeSettingFallback?.endTime || null
    }

    const effectiveEndTime = shiftEndTime || '17:00'
    const [endH, endM] = effectiveEndTime.split(':').map(Number)
    const endMinutes = endH * 60 + endM
    const isCrossMidnight = startMinutes >= endMinutes

    if (isCrossMidnight) {
      // For cross-midnight shifts, if the current time is in the early morning (after midnight but before shift end),
      // the shift started on the previous Jakarta day
      if (nowJakarta.totalMinutes < startMinutes) {
        // Current time is before shift start (e.g., 02:00 for a 22:00 shift)
        // Shift started the previous day
        const prevDayDate = new Date(new Date().getTime() - 86400000)
        const prevJakarta = getJakartaTime(prevDayDate)
        shiftDateYear = prevJakarta.year
        shiftDateMonth = prevJakarta.month
        shiftDateDay = prevJakarta.day
      }
    }

    // Create the time range for the "today" check based on the shift date
    // Start: shift date 00:00 Jakarta time = shift date 00:00 - 7h UTC
    // End: shift date + 1 day 00:00 Jakarta time
    const todayStartUtc = createJakartaDate(shiftDateYear, shiftDateMonth, shiftDateDay, 0, 0)
    const todayEndUtc = createJakartaDate(shiftDateYear, shiftDateMonth, shiftDateDay + 1, 0, 0)

    const existingToday = await db.attendance.findFirst({
      where: {
        userId: authUser.userId,
        type,
        createdAt: {
          gte: todayStartUtc,
          lt: todayEndUtc,
        },
      },
    })

    if (existingToday) {
      return NextResponse.json(
        { error: `Anda sudah melakukan absensi ${type.toLowerCase()} hari ini` },
        { status: 400 }
      )
    }

    // Determine status based on user's assigned shift using shared utility
    let attendanceStatus = status || 'HADIR'
    let lateMinutes: number | null = null
    let earlyMinutes: number | null = null

    const now = new Date()

    if (type === 'MASUK') {
      const result = calculateAttendanceTiming(
        shiftStartTime,
        effectiveEndTime,
        shiftLateTolerance,
        now,
        'MASUK'
      )
      if (result.isLate) {
        attendanceStatus = 'TELAT'
        lateMinutes = result.lateMinutes
      }
    } else if (type === 'PULANG') {
      if (shiftEndTime) {
        const result = calculateAttendanceTiming(
          shiftStartTime,
          effectiveEndTime,
          shiftLateTolerance,
          now,
          'PULANG'
        )
        if (result.isEarly) {
          attendanceStatus = 'PULANG_CEPAT'
          earlyMinutes = result.earlyMinutes
        }
      }
    }

    // Store attendance photo in blob store (not in database as base64)
    // This keeps the database small and makes deployment easy
    let photoUrl: string | null = null
    if (photo && isDataUrl(photo)) {
      try {
        const blobResult = await putDataUrl('attendance', photo)
        photoUrl = blobResult.url
      } catch (blobErr) {
        console.error('Blob store save failed, storing as base64 fallback:', blobErr)
        // Fallback: keep the base64 in DB if blob store fails
        photoUrl = photo
      }
    } else if (photo) {
      // Already a URL or path
      photoUrl = photo
    }

    const attendance = await db.attendance.create({
      data: {
        userId: authUser.userId,
        type,
        latitude,
        longitude,
        photo: photoUrl,
        confidence: confidence || 0,
        status: attendanceStatus,
        shiftId: shiftId,
        note: [
          lateMinutes ? `Terlambat ${lateMinutes} menit` : '',
          earlyMinutes ? `Pulang cepat ${earlyMinutes} menit` : '',
        ].filter(Boolean).join(' | ') || null,
      },
    })

    return NextResponse.json({
      message: `Absensi ${type.toLowerCase()} berhasil`,
      attendance,
      distance: Math.round(distance),
      lateMinutes,
      earlyMinutes,
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
    const searchName = searchParams.get('searchName')
    const showDeleted = searchParams.get('showDeleted') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Non-admin users can only see their own data
    const effectiveUserId = authUser.role !== 'ADMIN' ? authUser.userId : userId

    const where: Record<string, unknown> = {}
    if (effectiveUserId) {
      where.userId = effectiveUserId
    }

    // Exclude soft-deleted by default (admin can toggle to see them)
    if (!showDeleted) {
      where.isDeleted = false
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

    // Filter by employee name
    if (searchName && searchName.trim()) {
      where.user = {
        nama: { contains: searchName.trim() },
      }
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
                  lateTolerance: true,
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
              lateTolerance: true,
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

    // Resolve admin names for editedBy, deletedBy, manualBy
    const adminIds = [
      ...new Set(
        attendances
          .flatMap((att) => [att.editedBy, att.deletedBy, att.manualBy])
          .filter(Boolean) as string[]
      ),
    ]

    const adminUsers = adminIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: adminIds } },
          select: { id: true, nama: true, role: true },
        })
      : []

    const adminMap = new Map(adminUsers.map((u) => [u.id, u]))

    // Calculate lateMinutes and earlyMinutes for each attendance
    const attendancesWithCalculations = attendances.map((att) => {
      let lateMinutes: number | null = null
      let earlyMinutes: number | null = null

      // Get the shift info: from the attendance's shift, the user's shift, or fallback
      const shiftData = att.shift || att.user?.shift || null

      if (shiftData) {
        const attDate = new Date(att.createdAt)

        if (att.type === 'MASUK') {
          const result = calculateAttendanceTiming(
            shiftData.startTime,
            shiftData.endTime,
            shiftData.lateTolerance || 0,
            attDate,
            'MASUK'
          )
          if (result.isLate) {
            lateMinutes = result.lateMinutes
          }
        }

        if (att.type === 'PULANG') {
          const result = calculateAttendanceTiming(
            shiftData.startTime,
            shiftData.endTime,
            shiftData.lateTolerance || 0,
            attDate,
            'PULANG'
          )
          if (result.isEarly) {
            earlyMinutes = result.earlyMinutes
          }
        }
      }

      // Also try to parse from the note field if no shift data or no calculated value
      if (!lateMinutes && att.note) {
        const lateMatch = att.note.match(/Terlambat\s+(\d+)\s+menit/)
        if (lateMatch) lateMinutes = parseInt(lateMatch[1])
      }
      if (!earlyMinutes && att.note) {
        const earlyMatch = att.note.match(/Pulang cepat\s+(\d+)\s+menit/)
        if (earlyMatch) earlyMinutes = parseInt(earlyMatch[1])
      }

      return {
        ...att,
        lateMinutes,
        earlyMinutes,
        editedByUser: att.editedBy ? adminMap.get(att.editedBy) || null : null,
        deletedByUser: att.deletedBy ? adminMap.get(att.deletedBy) || null : null,
        manualByUser: att.manualBy ? adminMap.get(att.manualBy) || null : null,
      }
    })

    return NextResponse.json({
      attendances: attendancesWithCalculations,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Attendance GET error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
