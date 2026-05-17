/**
 * Blob Store - Local filesystem-based file storage.
 *
 * Designed for zero-config deployment: stores files in a `blobs/` directory
 * at the project root. Can be easily swapped to cloud storage (Vercel Blob,
 * S3, etc.) by replacing the implementation of put/get/delete.
 *
 * Directory structure:
 *   blobs/
 *     logo/         — App logo files
 *     favicon/      — Favicon files
 *     attendance/   — Attendance clock-in/out photos
 *     bukti-dukung/ — Supporting document photos
 *     attachment/   — Leave request attachments
 *     profile/      — User profile photos
 *     pwa-icon/     — PWA icon files
 */

import { promises as fs } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BLOBS_DIR = path.join(process.cwd(), 'blobs')

/** Allowed categories for organizing stored files */
export type BlobCategory =
  | 'logo'
  | 'favicon'
  | 'attendance'
  | 'bukti-dukung'
  | 'attachment'
  | 'profile'
  | 'pwa-icon'

/** Maximum file sizes per category (in bytes) */
const MAX_SIZES: Record<BlobCategory, number> = {
  logo: 5 * 1024 * 1024,         // 5 MB
  favicon: 2 * 1024 * 1024,      // 2 MB
  attendance: 2 * 1024 * 1024,   // 2 MB
  'bukti-dukung': 10 * 1024 * 1024, // 10 MB
  attachment: 15 * 1024 * 1024,  // 15 MB
  profile: 5 * 1024 * 1024,      // 5 MB
  'pwa-icon': 2 * 1024 * 1024,   // 2 MB
}

/** MIME type to extension mapping */
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/bmp': 'bmp',
  'image/x-icon': 'ico',
  'application/pdf': 'pdf',
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Ensure the directory for a category exists */
async function ensureDir(category: BlobCategory): Promise<string> {
  const dir = path.join(BLOBS_DIR, category)
  await fs.mkdir(dir, { recursive: true })
  return dir
}

/** Get file extension from MIME type */
function getExtension(mimeType: string): string {
  return MIME_TO_EXT[mimeType] || 'bin'
}

/** Validate that a key doesn't contain path traversal */
function validateKey(key: string): void {
  if (key.includes('..') || key.includes('/') || key.includes('\\')) {
    throw new Error(`Invalid blob key: ${key}`)
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface BlobPutOptions {
  /** MIME type of the file (used for extension and serving) */
  contentType: string
  /** Custom filename (without extension). If not provided, a UUID is generated. */
  filename?: string
  /** Maximum allowed size in bytes (overrides category default) */
  maxFileSize?: number
}

export interface BlobResult {
  /** The key (filename) used to reference this blob */
  key: string
  /** The URL path for serving this blob via the API */
  url: string
  /** The absolute filesystem path */
  filePath: string
  /** Size in bytes */
  size: number
  /** The category it was stored in */
  category: BlobCategory
}

/**
 * Store a file in the blob store.
 *
 * @param category - The storage category (determines subdirectory and size limit)
 * @param data - The file data as Buffer or Uint8Array
 * @param options - Put options including content type and optional filename
 * @returns BlobResult with key, url, filePath, and size
 */
export async function put(
  category: BlobCategory,
  data: Buffer | Uint8Array,
  options: BlobPutOptions
): Promise<BlobResult> {
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data)

  // Validate size
  const maxSize = options.maxFileSize || MAX_SIZES[category]
  if (buffer.length > maxSize) {
    throw new Error(
      `File size (${(buffer.length / 1024 / 1024).toFixed(1)} MB) exceeds maximum ` +
      `allowed size (${(maxSize / 1024 / 1024).toFixed(1)} MB) for category "${category}"`
    )
  }

  // Generate filename
  const ext = getExtension(options.contentType)
  const baseName = options.filename || randomUUID()
  const key = `${baseName}.${ext}`

  validateKey(key)

  // Ensure directory exists and write file
  const dir = await ensureDir(category)
  const filePath = path.join(dir, key)
  await fs.writeFile(filePath, buffer)

  return {
    key,
    url: `/api/files/${category}/${key}`,
    filePath,
    size: buffer.length,
    category,
  }
}

/**
 * Retrieve a file from the blob store.
 *
 * @param category - The storage category
 * @param key - The filename/key
 * @returns The file data as Buffer, or null if not found
 */
export async function get(
  category: BlobCategory,
  key: string
): Promise<Buffer | null> {
  validateKey(key)
  const filePath = path.join(BLOBS_DIR, category, key)

  try {
    return await fs.readFile(filePath)
  } catch (err: any) {
    if (err.code === 'ENOENT') return null
    throw err
  }
}

/**
 * Delete a file from the blob store.
 *
 * @param category - The storage category
 * @param key - The filename/key
 * @returns true if the file was deleted, false if it didn't exist
 */
export async function del(
  category: BlobCategory,
  key: string
): Promise<boolean> {
  validateKey(key)
  const filePath = path.join(BLOBS_DIR, category, key)

  try {
    await fs.unlink(filePath)
    return true
  } catch (err: any) {
    if (err.code === 'ENOENT') return false
    throw err
  }
}

/**
 * Check if a file exists in the blob store.
 *
 * @param category - The storage category
 * @param key - The filename/key
 */
export async function exists(
  category: BlobCategory,
  key: string
): Promise<boolean> {
  validateKey(key)
  const filePath = path.join(BLOBS_DIR, category, key)

  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * Get the URL path for serving a blob via the API.
 * This does NOT check if the file exists.
 *
 * @param category - The storage category
 * @param key - The filename/key
 * @returns The URL path, e.g., "/api/files/attendance/abc123.jpg"
 */
export function getUrl(category: BlobCategory, key: string): string {
  return `/api/files/${category}/${key}`
}

/**
 * Get the content type for a file based on its extension.
 *
 * @param key - The filename/key
 * @returns MIME type string
 */
export function getContentType(key: string): string {
  const ext = key.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'gif':
      return 'image/gif'
    case 'webp':
      return 'image/webp'
    case 'svg':
      return 'image/svg+xml'
    case 'ico':
      return 'image/x-icon'
    case 'bmp':
      return 'image/bmp'
    case 'pdf':
      return 'application/pdf'
    default:
      return 'application/octet-stream'
  }
}

/**
 * Delete all files in a category.
 *
 * @param category - The storage category
 * @returns Number of files deleted
 */
export async function deleteCategory(category: BlobCategory): Promise<number> {
  const dir = path.join(BLOBS_DIR, category)
  try {
    const files = await fs.readdir(dir)
    let count = 0
    for (const file of files) {
      try {
        await fs.unlink(path.join(dir, file))
        count++
      } catch {
        // Ignore individual file errors
      }
    }
    return count
  } catch (err: any) {
    if (err.code === 'ENOENT') return 0
    throw err
  }
}

/**
 * Get storage stats for all categories.
 * Useful for admin dashboard.
 */
export async function getStats(): Promise<
  Record<BlobCategory, { count: number; totalSize: number }>
> {
  const categories: BlobCategory[] = [
    'logo', 'favicon', 'attendance', 'bukti-dukung',
    'attachment', 'profile', 'pwa-icon',
  ]

  const stats: Record<string, { count: number; totalSize: number }> = {}

  for (const category of categories) {
    const dir = path.join(BLOBS_DIR, category)
    try {
      const files = await fs.readdir(dir)
      let totalSize = 0
      for (const file of files) {
        try {
          const stat = await fs.stat(path.join(dir, file))
          totalSize += stat.size
        } catch {
          // Ignore individual file errors
        }
      }
      stats[category] = { count: files.length, totalSize }
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        stats[category] = { count: 0, totalSize: 0 }
      } else {
        stats[category] = { count: 0, totalSize: 0 }
      }
    }
  }

  return stats as Record<BlobCategory, { count: number; totalSize: number }>
}

/**
 * Parse a blob URL path to extract category and key.
 * e.g., "/api/files/attendance/abc123.jpg" → { category: "attendance", key: "abc123.jpg" }
 */
export function parseBlobUrl(url: string): { category: BlobCategory; key: string } | null {
  const match = url.match(/^\/api\/files\/([^/]+)\/(.+)$/)
  if (!match) return null
  const [, category, key] = match
  if (!isBlobCategory(category)) return null
  return { category, key }
}

function isBlobCategory(value: string): value is BlobCategory {
  return [
    'logo', 'favicon', 'attendance', 'bukti-dukung',
    'attachment', 'profile', 'pwa-icon',
  ].includes(value)
}

/**
 * Store a base64 data URL as a blob file.
 * This is useful for migrating existing base64 data from the database.
 *
 * @param category - The storage category
 * @param dataUrl - The base64 data URL (e.g., "data:image/jpeg;base64,...")
 * @param options - Put options
 * @returns BlobResult with key, url, filePath, and size
 */
export async function putDataUrl(
  category: BlobCategory,
  dataUrl: string,
  options?: Omit<BlobPutOptions, 'contentType'>
): Promise<BlobResult> {
  if (!dataUrl || !dataUrl.startsWith('data:')) {
    throw new Error('Invalid data URL format')
  }

  // Parse the data URL
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/s)
  if (!matches) {
    throw new Error('Cannot parse data URL')
  }

  const contentType = matches[1]
  const base64Data = matches[2]
  const buffer = Buffer.from(base64Data, 'base64')

  return put(category, buffer, {
    ...options,
    contentType,
  })
}

/**
 * Check if a string is a blob URL (stored in blob store) vs base64 data URL.
 */
export function isBlobUrl(value: string | null | undefined): boolean {
  if (!value) return false
  return value.startsWith('/api/files/')
}

/**
 * Check if a string is a base64 data URL.
 */
export function isDataUrl(value: string | null | undefined): boolean {
  if (!value) return false
  return value.startsWith('data:')
}
