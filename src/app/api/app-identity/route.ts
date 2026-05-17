import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Public endpoint - no auth required (used in layout/metadata)
export async function GET() {
  try {
    const setting = await db.officeSetting.findFirst()

    return NextResponse.json({
      appName: setting?.appName || 'Sistem Absensi Pegawai',
      logoPath: setting?.logoPath || null,
      faviconPath: setting?.faviconPath || null,
      pwaIcon192Path: setting?.pwaIcon192Path || null,
      pwaIcon512Path: setting?.pwaIcon512Path || null,
      officeName: setting?.officeName || 'Kantor Pusat',
      allowRegistration: setting?.allowRegistration !== null && setting?.allowRegistration !== undefined
        ? setting.allowRegistration
        : true,
    })
  } catch (error) {
    console.error('App Identity GET error:', error)
    return NextResponse.json({
      appName: 'Sistem Absensi Pegawai',
      logoPath: null,
      faviconPath: null,
      pwaIcon192Path: null,
      pwaIcon512Path: null,
      officeName: 'Kantor Pusat',
      allowRegistration: true,
    })
  }
}
