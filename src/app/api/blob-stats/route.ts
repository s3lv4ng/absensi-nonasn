import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getStats } from '@/lib/blob-store'

/**
 * GET /api/blob-stats — Get blob storage statistics.
 * Admin sees all, authenticated users see basic stats.
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const stats = await getStats()

    // Calculate totals
    let totalCount = 0
    let totalSize = 0
    for (const category of Object.values(stats)) {
      totalCount += category.count
      totalSize += category.totalSize
    }

    return NextResponse.json({
      categories: stats,
      total: { count: totalCount, size: totalSize },
    })
  } catch (error) {
    console.error('Blob stats GET error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
