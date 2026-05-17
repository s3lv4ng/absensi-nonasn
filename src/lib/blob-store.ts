import { put as vercelPut, del as vercelDel } from '@vercel/blob'
import { randomUUID } from 'crypto'

export type BlobCategory =
  | 'logo'
  | 'favicon'
  | 'attendance'
  | 'bukti-dukung'
  | 'attachment'
  | 'profile'
  | 'pwa-icon'
  | 'documents'
  | 'images'
  | 'media'
  | 'archive'
  | 'other'

const MAX_SIZES: Record<BlobCategory, number> = {
  logo: 5 * 1024 * 1024,
  favicon: 2 * 1024 * 1024,
  attendance: 2 * 1024 * 1024,
  'bukti-dukung': 10 * 1024 * 1024,
  attachment: 15 * 1024 * 1024,
  profile: 5 * 1024 * 1024,
  'pwa-icon': 2 * 1024 * 1024,
  documents: 25 * 1024 * 1024,
  images: 15 * 1024 * 1024,
  media: 50 * 1024 * 1024,
  archive: 50 * 1024 * 1024,
  other: 25 * 1024 * 1024,
}

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/x-icon': 'ico',
  'application/pdf': 'pdf',
}

export interface BlobPutOptions {
  contentType: string
  filename?: string
  maxFileSize?: number
}

export interface BlobResult {
  key: string
  url: string
  filePath: string
  size: number
  category: BlobCategory
}

function getExtension(mimeType: string): string {
  return MIME_TO_EXT[mimeType] || 'bin'
}

export async function put(
  category: BlobCategory,
  data: Buffer | Uint8Array,
  options: BlobPutOptions
): Promise<BlobResult> {
  const buffer = Buffer.isBuffer(data)
    ? data
    : Buffer.from(data)

  const maxSize = options.maxFileSize || MAX_SIZES[category]

  if (buffer.length > maxSize) {
    throw new Error('Ukuran file melebihi batas')
  }

  const ext = getExtension(options.contentType)

  const baseName =
    options.filename || randomUUID()

  const pathname = `${category}/${baseName}.${ext}`

  const blob = await vercelPut(
    pathname,
    buffer,
    {
      access: 'public',
      contentType: options.contentType,
    }
  )

  return {
    key: pathname,
    url: blob.url,
    filePath: blob.url,
    size: buffer.length,
    category,
  }
}

export async function get(
  category: BlobCategory,
  key: string
): Promise<Buffer | null> {
  try {
    const response = await fetch(key)

    if (!response.ok) {
      return null
    }

    return Buffer.from(
      await response.arrayBuffer()
    )
  } catch {
    return null
  }
}

export async function del(
  category: BlobCategory,
  key: string
): Promise<boolean> {
  try {
    await vercelDel(key)
    return true
  } catch {
    return false
  }
}

export function getUrl(
  category: BlobCategory,
  key: string
): string {
  return key
}

export function parseBlobUrl(
  url: string
): { category: BlobCategory; key: string } | null {
  if (!url.startsWith('http')) {
    return null
  }

  const parts = url.split('/')

  const category =
    parts[parts.length - 2] as BlobCategory

  return {
    category,
    key: url,
  }
}

export function isBlobUrl(
  value: string | null | undefined
): boolean {
  if (!value) return false
  return value.startsWith('http')
}

export function isDataUrl(
  value: string | null | undefined
): boolean {
  if (!value) return false
  return value.startsWith('data:')
}

export async function putDataUrl(
  category: BlobCategory,
  dataUrl: string,
  options?: Omit<BlobPutOptions, 'contentType'>
): Promise<BlobResult> {
  const matches = dataUrl.match(
    /^data:([^;]+);base64,(.+)$/s
  )

  if (!matches) {
    throw new Error('Cannot parse data URL')
  }

  const contentType = matches[1]
  const base64Data = matches[2]

  const buffer = Buffer.from(
    base64Data,
    'base64'
  )

  return put(category, buffer, {
    ...options,
    contentType,
  })
}

export function autoCategorize(
  mimeType: string
): BlobCategory {
  if (mimeType.startsWith('image/')) {
    return 'images'
  }

  if (
    mimeType.startsWith('video/') ||
    mimeType.startsWith('audio/')
  ) {
    return 'media'
  }

  if (
    mimeType.includes('pdf') ||
    mimeType.includes('document') ||
    mimeType.includes('sheet') ||
    mimeType.startsWith('text/')
  ) {
    return 'documents'
  }

  if (
    mimeType.includes('zip') ||
    mimeType.includes('rar')
  ) {
    return 'archive'
  }

  return 'other'
}

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
    case 'pdf':
      return 'application/pdf'
    case 'mp4':
      return 'video/mp4'
    default:
      return 'application/octet-stream'
  }
}

export async function getStats(): Promise<
  Record<BlobCategory, { count: number; totalSize: number }>
> {
  return {
    logo: { count: 0, totalSize: 0 },
    favicon: { count: 0, totalSize: 0 },
    attendance: { count: 0, totalSize: 0 },
    'bukti-dukung': { count: 0, totalSize: 0 },
    attachment: { count: 0, totalSize: 0 },
    profile: { count: 0, totalSize: 0 },
    'pwa-icon': { count: 0, totalSize: 0 },
    documents: { count: 0, totalSize: 0 },
    images: { count: 0, totalSize: 0 },
    media: { count: 0, totalSize: 0 },
    archive: { count: 0, totalSize: 0 },
    other: { count: 0, totalSize: 0 },
  }
}