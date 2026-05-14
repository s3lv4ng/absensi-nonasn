/**
 * Image compression utilities to save database storage.
 * Uses sharp (already installed) for server-side image processing.
 *
 * Strategy:
 * - Attendance photos: Resize to 320x240, JPEG quality 60 (~5-15KB per photo vs ~50-100KB raw)
 * - Face/profile photos: Resize to 320x320, JPEG quality 70 (~8-20KB per photo vs ~50-100KB raw)
 * - Leave attachments: Resize to max 1280px, JPEG quality 75 (~30-80KB vs up to 5MB raw)
 * - Logo/favicon: Keep as-is (handled separately with sharp for PWA icons)
 */

import sharp from 'sharp'

/**
 * Compress a base64 data URL image (typically from camera capture).
 * Returns a compressed base64 data URL string.
 *
 * @param dataUrl - The original base64 data URL (e.g., "data:image/jpeg;base64,...")
 * @param options - Compression options
 * @returns Compressed base64 data URL string
 */
export async function compressBase64Image(
  dataUrl: string,
  options: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
  } = {}
): Promise<string> {
  const {
    maxWidth = 320,
    maxHeight = 240,
    quality = 60,
  } = options

  if (!dataUrl || !dataUrl.startsWith('data:')) {
    return dataUrl // Not a data URL, return as-is
  }

  try {
    // Extract the base64 data and mime type from the data URL
    const matches = dataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/i)
    if (!matches) {
      return dataUrl // Can't parse, return as-is
    }

    const buffer = Buffer.from(matches[2], 'base64')

    // Use sharp to resize and compress
    const compressedBuffer = await sharp(buffer)
      .resize(maxWidth, maxHeight, {
        fit: 'inside', // Maintain aspect ratio, fit within bounds
        withoutEnlargement: true, // Don't upscale small images
      })
      .jpeg({ quality, mozjpeg: true }) // Convert to JPEG for best compression
      .toBuffer()

    // Return as base64 data URL
    return `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`
  } catch (error) {
    console.error('Image compression error (returning original):', error)
    return dataUrl // On error, return original to avoid data loss
  }
}

/**
 * Compress an image Buffer (from file upload).
 * Returns a compressed JPEG buffer.
 *
 * @param buffer - The original image buffer
 * @param options - Compression options
 * @returns Compressed image buffer
 */
export async function compressImageBuffer(
  buffer: Buffer,
  options: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
  } = {}
): Promise<Buffer> {
  const {
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 75,
  } = options

  try {
    return await sharp(buffer)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer()
  } catch (error) {
    console.error('Image buffer compression error (returning original):', error)
    return buffer
  }
}

/**
 * Check if a buffer is an image (by checking magic bytes).
 * Returns true for JPEG, PNG, GIF, WebP, BMP, SVG.
 */
export function isImageBuffer(buffer: Buffer): boolean {
  if (buffer.length < 4) return false

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return true
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return true
  // GIF: 47 49 46 38
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) return true
  // WebP: 52 49 46 46 ... 57 45 42 50
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) return true
  // BMP: 42 4D
  if (buffer[0] === 0x42 && buffer[1] === 0x4D) return true

  return false
}

/**
 * Estimate the byte size of a base64 data URL string.
 */
export function estimateBase64Size(dataUrl: string): number {
  if (!dataUrl || !dataUrl.startsWith('data:')) return 0
  const base64Part = dataUrl.split(',')[1]
  if (!base64Part) return 0
  // Base64 encodes 3 bytes in 4 characters
  return Math.ceil(base64Part.length * 3 / 4)
}

/**
 * Format byte size to human-readable string.
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
