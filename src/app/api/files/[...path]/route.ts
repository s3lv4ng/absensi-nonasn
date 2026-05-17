import { NextRequest, NextResponse } from 'next/server'
import { get, getContentType, parseBlobUrl, type BlobCategory } from '@/lib/blob-store'

/**
 * GET /api/files/[...path] — Serve a file from blob storage.
 *
 * URL format: /api/files/{category}/{filename}
 * e.g., /api/files/attendance/abc123.jpg
 * e.g., /api/files/logo/logo-timestamp.png
 *
 * Query params:
 *   - download: If "true", forces download with Content-Disposition: attachment header
 *   - filename: Override filename for Content-Disposition header (used with download=true)
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

    // Check for download query parameter
    const { searchParams } = new URL(request.url)
    const isDownload = searchParams.get('download') === 'true'
    const overrideFilename = searchParams.get('filename') || filename

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Content-Length': buffer.length.toString(),
    }

    // If download=true, force the browser to download the file
    if (isDownload) {
      // Sanitize filename for Content-Disposition header
      const safeFilename = overrideFilename.replace(/[^\w\-. ]/g, '_')
      headers['Content-Disposition'] = `attachment; filename="${encodeURIComponent(safeFilename)}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`
      // No cache for download requests to ensure fresh response
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    } else {
      // For inline display, cache for 7 days (files are immutable once stored with UUID names)
      const safeFilename = filename.replace(/[^\w\-. ]/g, '_')
      headers['Content-Disposition'] = `inline; filename="${encodeURIComponent(safeFilename)}"`
      headers['Cache-Control'] = 'public, max-age=604800, immutable'
    }

    // Create response with proper headers
    const response = new NextResponse(buffer, {
      status: 200,
      headers,
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
