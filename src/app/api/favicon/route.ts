import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { readFile } from 'fs/promises'
import path from 'path'
import { get, parseBlobUrl } from '@/lib/blob-store'

// Cache favicon
let cachedFavicon: { path: string; timestamp: number } | null = null
const CACHE_TTL = 30_000

export async function GET(request: NextRequest) {
  try {
    const cacheBust = request.nextUrl.searchParams.get('v')

    let faviconPath: string | null = null

    // gunakan cache jika masih valid
    if (
      !cacheBust &&
      cachedFavicon &&
      Date.now() - cachedFavicon.timestamp < CACHE_TTL
    ) {
      faviconPath = cachedFavicon.path
    } else {
      const setting = await db.officeSetting.findFirst()

      faviconPath =
        setting?.faviconPath ||
        setting?.logoPath ||
        null

      cachedFavicon = {
        path: faviconPath || '',
        timestamp: Date.now(),
      }
    }

    // jika ada favicon custom
    if (faviconPath) {
      // blob-store internal
      const blobInfo = parseBlobUrl(faviconPath)

      if (blobInfo) {
        const buffer = await get(
          blobInfo.category,
          blobInfo.key
        )

        if (buffer) {
          const ext = blobInfo.key
            .split('.')
            .pop()
            ?.toLowerCase()

          const mimeMap: Record<string, string> = {
            svg: 'image/svg+xml',
            ico: 'image/x-icon',
            png: 'image/png',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            webp: 'image/webp',
          }

          const contentType =
            (ext && mimeMap[ext]) ||
            'image/x-icon'

          return new NextResponse(buffer, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control':
                'no-cache, no-store, must-revalidate',
            },
          })
        }
      }

      // external URL
      if (
        faviconPath.startsWith('http://') ||
        faviconPath.startsWith('https://')
      ) {
        return NextResponse.redirect(faviconPath)
      }

      // file lokal public
      try {
        const filePath = path.join(
          process.cwd(),
          'public',
          faviconPath
        )

        const fileBuffer = await readFile(filePath)

        const ext = faviconPath
          .split('.')
          .pop()
          ?.toLowerCase()

        const mimeMap: Record<string, string> = {
          svg: 'image/svg+xml',
          ico: 'image/x-icon',
          png: 'image/png',
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          webp: 'image/webp',
        }

        const contentType =
          (ext && mimeMap[ext]) ||
          'image/x-icon'

        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control':
              'no-cache, no-store, must-revalidate',
          },
        })
      } catch (fileError) {
        console.error(
          'Custom favicon file not found:',
          faviconPath,
          fileError
        )
      }
    }

    // favicon default
    try {
      const defaultPath = path.join(
        process.cwd(),
        'public',
        'logo.svg'
      )

      const defaultBuffer =
        await readFile(defaultPath)

      return new NextResponse(defaultBuffer, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control':
            'no-cache, no-store, must-revalidate',
        },
      })
    } catch {
      const transparentPng = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      )

      return new NextResponse(transparentPng, {
        headers: {
          'Content-Type': 'image/png',
        },
      })
    }
  } catch (error) {
    console.error('Favicon API error:', error)

    return new NextResponse(null, {
      status: 500,
    })
  }
}
