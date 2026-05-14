import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { readFile } from 'fs/promises'
import path from 'path'

// Cache PWA icon paths to avoid hitting DB on every request
let cachedIcons: {
  pwaIcon192: string | null
  pwaIcon512: string | null
  logoPath: string | null
  faviconPath: string | null
  timestamp: number
} | null = null
const CACHE_TTL = 60_000 // 60 seconds

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ size: string }> }
) {
  try {
    const { size } = await params
    const sizeNum = parseInt(size, 10)

    // Only allow valid PWA icon sizes
    if (![192, 512].includes(sizeNum)) {
      return new NextResponse('Invalid size', { status: 400 })
    }

    // Check cache-busting parameter
    const cacheBust = request.nextUrl.searchParams.get('v')

    let pwaIcon192: string | null = null
    let pwaIcon512: string | null = null
    let logoPath: string | null = null
    let faviconPath: string | null = null

    if (!cacheBust && cachedIcons && Date.now() - cachedIcons.timestamp < CACHE_TTL) {
      pwaIcon192 = cachedIcons.pwaIcon192
      pwaIcon512 = cachedIcons.pwaIcon512
      logoPath = cachedIcons.logoPath
      faviconPath = cachedIcons.faviconPath
    } else {
      const setting = await db.officeSetting.findFirst()
      pwaIcon192 = setting?.pwaIcon192Path || null
      pwaIcon512 = setting?.pwaIcon512Path || null
      logoPath = setting?.logoPath || null
      faviconPath = setting?.faviconPath || null

      cachedIcons = {
        pwaIcon192,
        pwaIcon512,
        logoPath,
        faviconPath,
        timestamp: Date.now(),
      }
    }

    // Determine the best icon path for the requested size
    let iconPath: string | null = null

    if (sizeNum === 192) {
      iconPath = pwaIcon192 || pwaIcon512 || faviconPath || logoPath
    } else if (sizeNum === 512) {
      iconPath = pwaIcon512 || pwaIcon192 || faviconPath || logoPath
    }

    // If we have a custom icon, serve it
    if (iconPath) {
      try {
        const filePath = path.join(process.cwd(), 'public', iconPath)
        const fileBuffer = await readFile(filePath)

        // Determine content type
        const ext = iconPath.split('.').pop()?.toLowerCase()
        const mimeMap: Record<string, string> = {
          svg: 'image/svg+xml',
          ico: 'image/x-icon',
          png: 'image/png',
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          webp: 'image/webp',
        }
        const contentType = (ext && mimeMap[ext]) || 'image/png'

        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        })
      } catch {
        // File not found, fall through to default
      }
    }

    // Serve default PWA icon
    try {
      const defaultFileName = sizeNum === 192 ? 'icon-192.png' : 'icon-512.png'
      const defaultPath = path.join(process.cwd(), 'public', defaultFileName)
      const defaultBuffer = await readFile(defaultPath)

      return new NextResponse(defaultBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      })
    } catch {
      return new NextResponse(null, { status: 404 })
    }
  } catch (error) {
    console.error('PWA Icon API error:', error)
    return new NextResponse(null, { status: 500 })
  }
}
