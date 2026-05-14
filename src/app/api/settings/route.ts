import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET() {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const setting = await db.officeSetting.findFirst()

    if (!setting) {
      // Create default setting
      const newSetting = await db.officeSetting.create({
        data: {},
      })
      return NextResponse.json({ setting: newSetting })
    }

    return NextResponse.json({ setting })
  } catch (error) {
    console.error('Settings GET error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const body = await request.json()
    const {
      officeName,
      latitude,
      longitude,
      radiusMeter,
      startTime,
      endTime,
      lateTolerance,
      workDays,
      appName,
      logoPath,
      faviconPath,
      pwaIcon192Path,
      pwaIcon512Path,
    } = body

    let setting = await db.officeSetting.findFirst()

    if (!setting) {
      setting = await db.officeSetting.create({
        data: {
          officeName: officeName || 'Kantor Pusat',
          latitude: latitude ?? -6.2088,
          longitude: longitude ?? 106.8456,
          radiusMeter: radiusMeter ?? 100,
          startTime: startTime || '08:00',
          endTime: endTime || '17:00',
          lateTolerance: lateTolerance ?? 15,
          workDays: workDays || '1,2,3,4,5',
          appName: appName || 'Sistem Absensi Pegawai',
          logoPath: logoPath || null,
          faviconPath: faviconPath || null,
          pwaIcon192Path: pwaIcon192Path || null,
          pwaIcon512Path: pwaIcon512Path || null,
        },
      })
    } else {
      setting = await db.officeSetting.update({
        where: { id: setting.id },
        data: {
          ...(officeName !== undefined && { officeName }),
          ...(latitude !== undefined && { latitude }),
          ...(longitude !== undefined && { longitude }),
          ...(radiusMeter !== undefined && { radiusMeter }),
          ...(startTime !== undefined && { startTime }),
          ...(endTime !== undefined && { endTime }),
          ...(lateTolerance !== undefined && { lateTolerance }),
          ...(workDays !== undefined && { workDays }),
          ...(appName !== undefined && { appName }),
          ...(logoPath !== undefined && { logoPath }),
          ...(faviconPath !== undefined && { faviconPath }),
          ...(pwaIcon192Path !== undefined && { pwaIcon192Path }),
          ...(pwaIcon512Path !== undefined && { pwaIcon512Path }),
        },
      })
    }

    return NextResponse.json({ setting })
  } catch (error) {
    console.error('Settings PUT error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
