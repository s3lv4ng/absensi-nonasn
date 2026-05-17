import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { put, del, autoCategorize, type BlobCategory } from '@/lib/blob-store'
import { compressImageBuffer, isImageBuffer } from '@/lib/image-compress'
import { db } from '@/lib/db'

/**
 * GET /api/file-uploads — List all uploaded files (paginated, with filters).
 *
 * Query params:
 *   - category: Filter by category (documents|images|media|archive|other)
 *   - search: Search by filename
 *   - page: Page number (default 1)
 *   - limit: Items per page (default 20)
 *   - all: If "true", return all files without pagination
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || undefined
    const search = searchParams.get('search') || undefined
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const all = searchParams.get('all') === 'true'

    // Build where clause
    const where: any = { isDeleted: false }
    if (category) where.category = category
    if (search) where.filename = { contains: search }

    // Get total count
    const total = await db.fileUpload.count({ where })

    // Get files
    const files = await db.fileUpload.findMany({
      where,
      include: {
        uploader: {
          select: { id: true, nama: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      ...(all ? {} : { skip: (page - 1) * limit, take: limit }),
    })

    return NextResponse.json({
      files,
      pagination: all
        ? undefined
        : {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
    })
  } catch (error: any) {
    console.error('FileUploads GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/file-uploads — Upload one or more files to blob storage with DB tracking.
 *
 * Accepts FormData with:
 *   - files: One or more files (required)
 *   - category: Override auto-category (optional)
 *   - description: Description for all files (optional)
 *
 * Returns array of uploaded file metadata.
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const formData = await request.formData()
    const fileEntries = formData.getAll('files') as File[]
    const categoryOverride = formData.get('category') as string | null
    const description = formData.get('description') as string | null

    if (!fileEntries || fileEntries.length === 0) {
      return NextResponse.json({ error: 'File wajib diupload' }, { status: 400 })
    }

    // Validate category override
    const validCategories: BlobCategory[] = [
      'documents', 'images', 'media', 'archive', 'other',
    ]
    if (categoryOverride && !validCategories.includes(categoryOverride as BlobCategory)) {
      return NextResponse.json(
        { error: `Kategori tidak valid: ${categoryOverride}` },
        { status: 400 }
      )
    }

    const uploadedFiles = []

    for (const file of fileEntries) {
      // Read file into buffer
      const arrayBuffer = await file.arrayBuffer()
      let buffer = Buffer.from(arrayBuffer)

      // Auto-categorize based on MIME type
      const category = (categoryOverride || autoCategorize(file.type)) as BlobCategory

      // Compress images
      const isImage = isImageBuffer(buffer) || file.type.startsWith('image/')
      if (isImage && category === 'images') {
        try {
          buffer = await compressImageBuffer(buffer, {
            maxWidth: 1920,
            maxHeight: 1920,
            quality: 80,
          })
        } catch (compressErr) {
          console.error('Image compression failed, storing original:', compressErr)
        }
      }

      // Store the file in blob store
      const result = await put(category, buffer, {
        contentType: file.type || 'application/octet-stream',
      })

      // Save metadata to database
      const fileRecord = await db.fileUpload.create({
        data: {
          filename: file.name,
          storedName: result.key,
          category,
          mimeType: file.type || 'application/octet-stream',
          size: buffer.length,
          url: result.url,
          uploadedBy: authUser.id,
          description: description || null,
        },
        include: {
          uploader: {
            select: { id: true, nama: true, email: true },
          },
        },
      })

      uploadedFiles.push(fileRecord)
    }

    return NextResponse.json({ files: uploadedFiles }, { status: 201 })
  } catch (error: any) {
    console.error('FileUploads POST error:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/file-uploads — Delete one or more files (soft delete + physical delete).
 *
 * Body: { ids: string[] } or { id: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const body = await request.json()
    const ids: string[] = body.ids || (body.id ? [body.id] : [])

    if (ids.length === 0) {
      return NextResponse.json({ error: 'ID file wajib diisi' }, { status: 400 })
    }

    let deletedCount = 0

    for (const id of ids) {
      const fileRecord = await db.fileUpload.findUnique({ where: { id } })

      if (!fileRecord || fileRecord.isDeleted) continue

      // Try to delete physical file
      try {
        await del(fileRecord.category as BlobCategory, fileRecord.storedName)
      } catch {
        // Physical file might already be gone, continue with DB cleanup
      }

      // Soft delete in DB (also set deletedAt)
      await db.fileUpload.update({
        where: { id },
        data: { isDeleted: true, deletedAt: new Date() },
      })

      deletedCount++
    }

    return NextResponse.json({
      message: `${deletedCount} file berhasil dihapus`,
      deletedCount,
    })
  } catch (error: any) {
    console.error('FileUploads DELETE error:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
