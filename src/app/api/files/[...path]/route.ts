import { NextRequest, NextResponse } from 'next/server'
import { get, getContentType, parseBlobUrl, type BlobCategory } from '@/lib/blob-store'

/**
 * GET /api/files/[...path] — Serve a file from blob storage.
 *
 * URL format: /api/files/{category}/{filename}
 * e.g., /api/files/attendance/abc123.jpg
 * e.g., /api/files/logo/logo-timestamp.png
 *
 * Sets appropriate Content-Type and caching headers.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathParts } = await params

    // Reconstruct the path from the catch-all route
    if (pathParts.length < 2) {
      return NextResponse.json({ error: 'Path tidak valid' }, { status: 400 })
    }

    const category = pathParts[0] as BlobCategory
    const filename = pathParts.slice(1).join('/')

    // Fetch the file from blob store
    const buffer = await get(category, filename)

    if (!buffer) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 404 })
    }

    // Determine content type
    const contentType = getContentType(filename)

    // Create response with proper headers
    const response = new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.length.toString(),
        // Cache for 7 days (files are immutable once stored with UUID names)
        'Cache-Control': 'public, max-age=604800, immutable',
      },
    })

    return response
  } catch (error) {
    console.error('File serve error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

/**
 * DELETE /api/files/[...path] — Delete a file from blob storage (admin only).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const authUser = await getAuthUser()
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const { path: pathParts } = await params

    if (pathParts.length < 2) {
      return NextResponse.json({ error: 'Path tidak valid' }, { status: 400 })
    }

    const { del } = await import('@/lib/blob-store')
    const category = pathParts[0] as BlobCategory
    const filename = pathParts.slice(1).join('/')

    const deleted = await del(category, filename)

    if (!deleted) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({ message: 'File berhasil dihapus' })
  } catch (error) {
    console.error('File delete error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
