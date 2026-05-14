import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { createJakartaDate, getJakartaTime } from '@/lib/timezone'

// GET - Fetch notifications for the current user
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 401 })
    }

    const userId = authUser.userId

    // Sync: generate notifications from live data, then return from DB
    await syncNotifications(authUser.userId, authUser.role)

    // Fetch from DB
    const notifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    const unreadCount = await db.notification.count({
      where: { userId, isRead: false },
    })

    return NextResponse.json({
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        time: formatTimeAgo(n.createdAt),
        read: n.isRead,
        relatedId: n.relatedId,
      })),
      unreadCount,
    })
  } catch (error) {
    console.error('Notifications API error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// PUT - Mark as read / Mark all as read
export async function PUT(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 401 })
    }

    const body = await request.json()
    const { action, notificationId } = body

    if (action === 'markAllRead') {
      await db.notification.updateMany({
        where: { userId: authUser.userId, isRead: false },
        data: { isRead: true },
      })
      return NextResponse.json({ success: true, message: 'Semua notifikasi ditandai sudah dibaca' })
    }

    if (action === 'markRead' && notificationId) {
      await db.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      })
      return NextResponse.json({ success: true, message: 'Notifikasi ditandai sudah dibaca' })
    }

    return NextResponse.json({ error: 'Aksi tidak valid' }, { status: 400 })
  } catch (error) {
    console.error('Notifications PUT error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// DELETE - Clear all / Clear read notifications
export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'clearAll') {
      await db.notification.deleteMany({
        where: { userId: authUser.userId },
      })
      return NextResponse.json({ success: true, message: 'Semua notifikasi dihapus' })
    }

    if (action === 'clearRead') {
      await db.notification.deleteMany({
        where: { userId: authUser.userId, isRead: true },
      })
      return NextResponse.json({ success: true, message: 'Notifikasi yang sudah dibaca dihapus' })
    }

    // Delete single notification
    const notificationId = searchParams.get('id')
    if (notificationId) {
      await db.notification.deleteMany({
        where: { id: notificationId, userId: authUser.userId },
      })
      return NextResponse.json({ success: true, message: 'Notifikasi dihapus' })
    }

    return NextResponse.json({ error: 'Aksi tidak valid' }, { status: 400 })
  } catch (error) {
    console.error('Notifications DELETE error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// ---- Helper: Sync notifications from live data ----
async function syncNotifications(userId: string, role: string) {
  const now = new Date()
  const jakartaNow = getJakartaTime(now)
  const todayStart = createJakartaDate(jakartaNow.year, jakartaNow.month, jakartaNow.day, 0, 0)
  const todayEnd = createJakartaDate(jakartaNow.year, jakartaNow.month, jakartaNow.day + 1, 0, 0)

  if (role === 'ADMIN') {
    // 1. Check for pending leave requests
    const pendingLeaves = await db.leaveRequest.findMany({
      where: { status: 'PENDING' },
      select: { id: true, type: true, user: { select: { nama: true } }, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    for (const leave of pendingLeaves) {
      // Check if we already have a notification for this leave
      const existing = await db.notification.findFirst({
        where: { userId, relatedId: leave.id, type: 'leave' },
      })
      if (!existing) {
        const leaveLabel = leave.type === 'CUTI' ? 'Cuti' : leave.type === 'IZIN' ? 'Izin' : leave.type === 'SAKIT' ? 'Sakit' : leave.type === 'DINAS' ? 'Dinas' : leave.type
        await db.notification.create({
          data: {
            userId,
            type: 'leave',
            title: `Pengajuan ${leaveLabel}`,
            message: `${leave.user.nama} mengajukan ${leave.type.toLowerCase()}`,
            relatedId: leave.id,
            isRead: false,
          },
        })
      }
    }

    // 2. Check for late employees today
    const lateCount = await db.attendance.count({
      where: {
        type: 'MASUK',
        status: 'TELAT',
        createdAt: { gte: todayStart, lt: todayEnd },
      },
    })

    if (lateCount > 0) {
      const existing = await db.notification.findFirst({
        where: { userId, type: 'late', relatedId: `late-${jakartaNow.year}-${jakartaNow.month}-${jakartaNow.day}` },
      })
      if (!existing) {
        await db.notification.create({
          data: {
            userId,
            type: 'late',
            title: 'Keterlambatan Hari Ini',
            message: `${lateCount} pegawai terlambat hari ini`,
            relatedId: `late-${jakartaNow.year}-${jakartaNow.month}-${jakartaNow.day}`,
            isRead: false,
          },
        })
      }
    }

    // 3. Attendance summary
    const todayMasuk = await db.attendance.count({
      where: { type: 'MASUK', createdAt: { gte: todayStart, lt: todayEnd } },
    })
    const totalEmployees = await db.user.count({ where: { isActive: true, role: 'PEGAWAI' } })

    if (todayMasuk > 0) {
      const existing = await db.notification.findFirst({
        where: { userId, type: 'attendance', relatedId: `attendance-${jakartaNow.year}-${jakartaNow.month}-${jakartaNow.day}` },
      })
      if (!existing) {
        await db.notification.create({
          data: {
            userId,
            type: 'attendance',
            title: 'Kehadiran Hari Ini',
            message: `${todayMasuk} dari ${totalEmployees} pegawai sudah absen masuk`,
            relatedId: `attendance-${jakartaNow.year}-${jakartaNow.month}-${jakartaNow.day}`,
            isRead: true,
          },
        })
      }
    }
  } else {
    // Employee: check their leave status updates
    const recentLeaves = await db.leaveRequest.findMany({
      where: {
        userId,
        status: { in: ['APPROVED', 'REJECTED'] },
      },
      select: { id: true, type: true, status: true, approvedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    })

    for (const leave of recentLeaves) {
      const isApproved = leave.status === 'APPROVED'
      const existing = await db.notification.findFirst({
        where: { userId, relatedId: `leave-status-${leave.id}`, type: 'leave' },
      })
      if (!existing) {
        await db.notification.create({
          data: {
            userId,
            type: 'leave',
            title: isApproved ? 'Pengajuan Disetujui' : 'Pengajuan Ditolak',
            message: `Pengajuan ${leave.type.toLowerCase()} Anda ${isApproved ? 'telah disetujui' : 'ditolak'}`,
            relatedId: `leave-status-${leave.id}`,
            isRead: false,
          },
        })
      }
    }
  }

  // Auto-cleanup: delete notifications older than 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  await db.notification.deleteMany({
    where: { createdAt: { lt: thirtyDaysAgo } },
  })
}

function formatTimeAgo(date: Date): string {
  const now = Date.now()
  const diff = now - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days} hari yang lalu`
  if (hours > 0) return `${hours} jam yang lalu`
  if (minutes > 0) return `${minutes} menit yang lalu`
  return 'Baru saja'
}
