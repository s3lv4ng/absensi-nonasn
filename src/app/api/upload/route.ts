import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { put, type BlobCategory } from '@/lib/blob-store'
import { compressImageBuffer, isImageBuffer } from '@/lib/image-compress'
import sharp from 'sharp'

/**
 * POST /api/upload — Upload a file to blob storage.
 *
 * Accepts FormData with:
 *   - file: The file to upload (required)
 *   - type: Category type — "logo" | "favicon" | "attachment" | "profile" | "attendance" | "bukti-dukung" (required)
 *
 * For "logo" and "favicon" types, also generates PWA icons (192x192, 512x512).
 *
 * Returns:
 *   { url: string, path: string, pwaIcon192?: string, pwaIcon512?: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    // Parse FormData
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = formData.get('type') as string | null

    if (!file) {
      return NextResponse.json({ error: 'File wajib diupload' }, { status: 400 })
    }

    if (!type) {
      return NextResponse.json({ error: 'Tipe upload wajib diisi' }, { status: 400 })
    }

    // Validate category
    const validCategories: BlobCategory[] = [
      'logo', 'favicon', 'attachment', 'profile',
      'attendance', 'bukti-dukung', 'pwa-icon',
    ]
    if (!validCategories.includes(type as BlobCategory)) {
      return NextResponse.json(
        { error: `Tipe upload tidak valid: ${type}` },
        { status: 400 }
      )
    }

    const category = type as BlobCategory

    // Read file into buffer
    const arrayBuffer = await file.arrayBuffer()
    let buffer = Buffer.from(arrayBuffer)

    // Compress images
    const isImage = isImageBuffer(buffer) || file.type.startsWith('image/')

    if (isImage) {
      try {
        // Different compression based on category
        if (category === 'attendance') {
          // Attendance photos: small, optimized for quick loading
          buffer = await compressImageBuffer(buffer, {
            maxWidth: 320,
            maxHeight: 240,
            quality: 60,
          })
        } else if (category === 'bukti-dukung') {
          // Bukti dukung: medium quality
          buffer = await compressImageBuffer(buffer, {
            maxWidth: 640,
            maxHeight: 480,
            quality: 60,
          })
        } else if (category === 'profile') {
          // Profile photos: square, medium quality
          buffer = await compressImageBuffer(buffer, {
            maxWidth: 320,
            maxHeight: 320,
            quality: 70,
          })
        } else if (category === 'attachment') {
          // Leave attachments: higher quality, larger max
          buffer = await compressImageBuffer(buffer, {
            maxWidth: 1280,
            maxHeight: 1280,
            quality: 75,
          })
        }
        // logo, favicon, pwa-icon: keep original quality (handled below for PWA)
      } catch (compressErr) {
        console.error('Image compression failed, storing original:', compressErr)
        // Keep original buffer if compression fails
      }
    }

    // Store the file
    const result = await put(category, buffer, {
      contentType: file.type || 'application/octet-stream',
    })

    const response: Record<string, string | undefined> = {
      url: result.url,
      path: result.url,
    }

    // Special handling for logo/favicon: generate PWA icons
    if ((category === 'logo' || category === 'favicon') && isImage) {
      try {
        // Generate 192x192 PWA icon
        const pwa192 = await sharp(buffer)
          .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer()

        const pwa192Result = await put('pwa-icon', pwa192, {
          contentType: 'image/png',
          filename: `${result.key.replace(/\.[^.]+$/, '')}-192`,
        })
        response.pwaIcon192 = pwa192Result.url

        // Generate 512x512 PWA icon
        const pwa512 = await sharp(buffer)
          .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer()

        const pwa512Result = await put('pwa-icon', pwa512, {
          contentType: 'image/png',
          filename: `${result.key.replace(/\.[^.]+$/, '')}-512`,
        })
        response.pwaIcon512 = pwa512Result.url
      } catch (pwaErr) {
        console.error('PWA icon generation failed:', pwaErr)
        // Don't fail the upload if PWA icon generation fails
      }
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error: any) {
    console.error('Upload POST error:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
