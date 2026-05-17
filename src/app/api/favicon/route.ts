import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { readFile } from 'fs/promises'
import path from 'path'
import { get, parseBlobUrl } from '@/lib/blob-store'

// Cache the favicon for a short time to avoid hitting DB on every request
let cachedFavicon: { path: string; timestamp: number } | null = null
const CACHE_TTL = 30_000 // 30 seconds

export async function GET(request: NextRequest) {
  try {
    // Check cache-busting parameter
    const cacheBust = request.nextUrl.searchParams.get('v')

    // Use cached path if available and not expired (unless cache-busting)
    let faviconPath: string | null = null

    if (!cacheBust && cachedFavicon && Date.now() - cachedFavicon.timestamp < CACHE_TTL) {
      faviconPath = cachedFavicon.path
    } else {
      const setting = await db.officeSetting.findFirst()
      faviconPath = setting?.faviconPath || setting?.logoPath || null

      // Update cache
      cachedFavicon = {
        path: faviconPath || '',
        timestamp: Date.now(),
      }
    }

    // If we have a custom favicon, serve it
    if (faviconPath) {
      // Check if it's a blob URL (stored in blob store)
      const blobInfo = parseBlobUrl(faviconPath)
      if (blobInfo) {
        const buffer = await get(blobInfo.category, blobInfo.key)
        if (buffer) {
          const ext = blobInfo.key.split('.').pop()?.toLowerCase()
          const mimeMap: Record<string, string> = {
            svg: 'image/svg+xml',
            ico: 'image/x-icon',
            png: 'image/png',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            webp: 'image/webp',
          }
          const contentType = (ext && mimeMap[ext]) || 'image/x-icon'

          return new NextResponse(buffer, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
              'X-Icon-Source': 'blob-store',
            },
          })
        }
      }

      // Try to read from public directory (legacy support)
      try {
        const filePath = path.join(process.cwd(), 'public', faviconPath)
        const fileBuffer = await readFile(filePath)

        // Determine content type from extension
        const ext = faviconPath.split('.').pop()?.toLowerCase()
        const mimeMap: Record<string, string> = {
          svg: 'image/svg+xml',
          ico: 'image/x-icon',
          png: 'image/png',
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          webp: 'image/webp',
        }
        const contentType = (ext && mimeMap[ext]) || 'image/x-icon'

        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Icon-Source': 'custom',
          },
        })
      } catch (fileError) {
        // File not found, fall through to default
        console.error('Custom favicon file not found:', faviconPath, fileError)
      }
    }

    // Serve default favicon
    try {
      const defaultPath = path.join(process.cwd(), 'public', 'logo.svg')
      const defaultBuffer = await readFile(defaultPath)

      return new NextResponse(defaultBuffer, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Icon-Source': 'default',
        },
      })
    } catch {
      // If even default doesn't exist, return a 1x1 transparent PNG
      const transparentPng = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      )

      return new NextResponse(transparentPng, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Icon-Source': 'fallback',
        },
      })
    }
  } catch (error) {
    console.error('Favicon API error:', error)

    // Return default on any error
    try {
      const defaultPath = path.join(process.cwd(), 'public', 'logo.svg')
      const defaultBuffer = await readFile(defaultPath)
      return new NextResponse(defaultBuffer, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      })
    } catch {
      return new NextResponse(null, { status: 500 })
    }
  }
}
