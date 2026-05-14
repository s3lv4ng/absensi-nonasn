import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const setting = await db.officeSetting.findFirst()

    const appName = setting?.appName || 'Sistem Absensi Pegawai'

    // Build icons array using dynamic API routes that always serve the correct icon from DB
    // This ensures PWA install prompt and app icons always match Application Identity settings
    const icons: Array<{ src: string; sizes: string; type: string; purpose: string }> = [
      {
        src: '/api/pwa-icon/192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/api/pwa-icon/512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/api/favicon',
        sizes: 'any',
        type: 'image/png',
        purpose: 'any',
      },
    ]

    const manifest = {
      name: appName,
      short_name: appName.length > 12 ? appName.substring(0, 12) : appName,
      description: 'Aplikasi absensi pegawai modern dengan verifikasi wajah dan validasi GPS',
      start_url: '/',
      display: 'standalone' as const,
      background_color: '#ffffff',
      theme_color: '#1e40af',
      orientation: 'portrait-primary' as const,
      icons,
      categories: ['business', 'productivity'],
      lang: 'id',
      dir: 'ltr' as const,
    }

    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('Manifest API error:', error)
    // Return a default manifest on error
    return NextResponse.json(
      {
        name: 'Sistem Absensi Pegawai',
        short_name: 'Absensi',
        description: 'Aplikasi absensi pegawai modern dengan verifikasi wajah dan validasi GPS',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#1e40af',
        orientation: 'portrait-primary',
        icons: [
          { src: '/api/pwa-icon/192', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/api/pwa-icon/512', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          { src: '/api/favicon', sizes: 'any', type: 'image/png', purpose: 'any' },
        ],
        categories: ['business', 'productivity'],
        lang: 'id',
        dir: 'ltr',
      },
      {
        headers: {
          'Content-Type': 'application/manifest+json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    )
  }
}
