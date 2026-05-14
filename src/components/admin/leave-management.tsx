'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  RefreshCw,
  UserX,
  CalendarDays,
  AlertTriangle,
  FileText,
  Loader2,
} from 'lucide-react'

import type { LeaveRequest, LeaveType, LeaveStatus } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Separator } from '@/components/ui/separator'

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateLong(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function typeBadgeClass(type: LeaveType): string {
  switch (type) {
    case 'IZIN':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800'
    case 'CUTI':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
    case 'SAKIT':
      return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-300 border-gray-200 dark:border-gray-700'
  }
}

function typeLabel(type: LeaveType): string {
  switch (type) {
    case 'IZIN': return 'Izin'
    case 'CUTI': return 'Cuti'
    case 'SAKIT': return 'Sakit'
    default: return type
  }
}

function statusBadgeClass(status: LeaveStatus): string {
  switch (status) {
    case 'PENDING':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800'
    case 'APPROVED':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
    case 'REJECTED':
      return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-300 border-gray-200 dark:border-gray-700'
  }
}

function statusLabel(status: LeaveStatus): string {
  switch (status) {
    case 'PENDING': return 'Menunggu'
    case 'APPROVED': return 'Disetujui'
    case 'REJECTED': return 'Ditolak'
    default: return status
  }
}

function statusIcon(status: LeaveStatus) {
  switch (status) {
    case 'PENDING': return <Clock className="size-3.5" />
    case 'APPROVED': return <CheckCircle2 className="size-3.5" />
    case 'REJECTED': return <XCircle className="size-3.5" />
  }
}

function countDays(start: string, end: string): number {
  const s = new Date(start)
  const e = new Date(end)
  const diff = e.getTime() - s.getTime()
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1)
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function LeaveSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>

      <Skeleton className="h-10 w-full max-w-md" />

      <Card className="bg-white/70 dark:bg-gray-900/60">
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Leave Table
// ---------------------------------------------------------------------------

function LeaveTable({
  leaves,
  onApprove,
  onReject,
  onViewDetail,
  actionLoading,
}: {
  leaves: LeaveRequest[]
  onApprove: (leave: LeaveRequest) => void
  onReject: (leave: LeaveRequest) => void
  onViewDetail: (leave: LeaveRequest) => void
  actionLoading: string | null
}) {
  if (leaves.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-2">
        <ClipboardCheck className="size-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Tidak ada pengajuan pada tab ini</p>
      </div>
    )
  }

  return (
    <ScrollArea className="max-h-[520px]">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Pegawai</TableHead>
            <TableHead className="hidden sm:table-cell">NIP</TableHead>
            <TableHead>Tipe</TableHead>
            <TableHead className="hidden md:table-cell">Tanggal Mulai</TableHead>
            <TableHead className="hidden md:table-cell">Tanggal Selesai</TableHead>
            <TableHead className="hidden lg:table-cell">Alasan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-center">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence>
            {leaves.map((leave, idx) => (
              <motion.tr
                key={leave.id}
                className="border-b border-blue-50 dark:border-blue-900/20 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors cursor-pointer"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: idx * 0.03, duration: 0.3 }}
                onClick={() => onViewDetail(leave)}
              >
                {/* Pegawai */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-full bg-[#1e40af]/10 dark:bg-blue-900/30 flex items-center justify-center text-xs font-bold text-[#1e40af] dark:text-blue-400 shrink-0">
                      {(leave.user?.nama ?? '??')
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <span className="text-sm font-medium truncate max-w-[120px]">
                      {leave.user?.nama ?? 'Unknown'}
                    </span>
                  </div>
                </TableCell>

                {/* NIP */}
                <TableCell className="hidden sm:table-cell">
                  <span className="text-xs font-mono text-muted-foreground">
                    {leave.user?.nip ?? '-'}
                  </span>
                </TableCell>

                {/* Tipe */}
                <TableCell>
                  <Badge variant="outline" className={`text-[10px] px-2 py-0 ${typeBadgeClass(leave.type as LeaveType)}`}>
                    {typeLabel(leave.type as LeaveType)}
                  </Badge>
                </TableCell>

                {/* Tanggal Mulai */}
                <TableCell className="hidden md:table-cell">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(leave.startDate)}
                  </span>
                </TableCell>

                {/* Tanggal Selesai */}
                <TableCell className="hidden md:table-cell">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(leave.endDate)}
                  </span>
                </TableCell>

                {/* Alasan */}
                <TableCell className="hidden lg:table-cell">
                  <span className="text-xs text-muted-foreground truncate max-w-[160px] block">
                    {leave.reason}
                  </span>
                </TableCell>

                {/* Status */}
                <TableCell>
                  <Badge variant="outline" className={`text-[10px] px-2 py-0 ${statusBadgeClass(leave.status as LeaveStatus)}`}>
                    <span className="flex items-center gap-1">
                      {statusIcon(leave.status as LeaveStatus)}
                      {statusLabel(leave.status as LeaveStatus)}
                    </span>
                  </Badge>
                </TableCell>

                {/* Aksi */}
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {leave.status === 'PENDING' ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-300"
                          disabled={actionLoading === leave.id}
                          onClick={() => onApprove(leave)}
                        >
                          {actionLoading === leave.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="size-3.5" />
                          )}
                          <span className="ml-1 text-xs">Setujui</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300"
                          disabled={actionLoading === leave.id}
                          onClick={() => onReject(leave)}
                        >
                          <XCircle className="size-3.5" />
                          <span className="ml-1 text-xs">Tolak</span>
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[#2563eb] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        onClick={() => onViewDetail(leave)}
                      >
                        <Eye className="size-3.5" />
                        <span className="ml-1 text-xs">Detail</span>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </motion.tr>
            ))}
          </AnimatePresence>
        </TableBody>
      </Table>
    </ScrollArea>
  )
}

// ---------------------------------------------------------------------------
// Detail Dialog
// ---------------------------------------------------------------------------

function LeaveDetailDialog({
  leave,
  open,
  onClose,
  onApprove,
  onReject,
  actionLoading,
}: {
  leave: LeaveRequest | null
  open: boolean
  onClose: () => void
  onApprove: (leave: LeaveRequest) => void
  onReject: (leave: LeaveRequest) => void
  actionLoading: string | null
}) {
  if (!leave) return null

  const days = countDays(leave.startDate, leave.endDate)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[#1e40af] dark:text-blue-300 flex items-center gap-2">
            <FileText className="size-5" />
            Detail Pengajuan
          </DialogTitle>
          <DialogDescription>
            Informasi lengkap pengajuan {typeLabel(leave.type as LeaveType).toLowerCase()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Employee Info */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-900/30">
            <div className="size-12 rounded-full bg-[#1e40af]/10 dark:bg-blue-900/30 flex items-center justify-center text-sm font-bold text-[#1e40af] dark:text-blue-400 shrink-0">
              {(leave.user?.nama ?? '??')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-foreground">{leave.user?.nama ?? 'Unknown'}</p>
              <p className="text-xs text-muted-foreground">
                NIP: {leave.user?.nip ?? '-'} &bull; {leave.user?.unitKerja ?? '-'}
              </p>
              <p className="text-xs text-muted-foreground">{leave.user?.email ?? '-'}</p>
            </div>
          </div>

          <Separator />

          {/* Leave Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Tipe Pengajuan</p>
              <Badge variant="outline" className={`text-xs ${typeBadgeClass(leave.type as LeaveType)}`}>
                {typeLabel(leave.type as LeaveType)}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <Badge variant="outline" className={`text-xs ${statusBadgeClass(leave.status as LeaveStatus)}`}>
                <span className="flex items-center gap-1">
                  {statusIcon(leave.status as LeaveStatus)}
                  {statusLabel(leave.status as LeaveStatus)}
                </span>
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Tanggal Mulai</p>
              <p className="text-sm font-medium">{formatDateLong(leave.startDate)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Tanggal Selesai</p>
              <p className="text-sm font-medium">{formatDateLong(leave.endDate)}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Durasi</p>
            <p className="text-sm font-medium">{days} hari</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Alasan</p>
            <p className="text-sm text-foreground bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700/50">
              {leave.reason}
            </p>
          </div>

          {leave.approvedAt && (
            <div className="text-xs text-muted-foreground">
              Diproses pada: {formatDateLong(leave.approvedAt)}
            </div>
          )}
        </div>

        {/* Actions */}
        {leave.status === 'PENDING' && (
          <>
            <Separator />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                disabled={actionLoading === leave.id}
                onClick={() => onReject(leave)}
              >
                {actionLoading === leave.id ? (
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                ) : (
                  <XCircle className="size-4 mr-1.5" />
                )}
                Tolak
              </Button>
              <Button
                className="bg-[#1e40af] hover:bg-[#1e3a8a] text-white"
                disabled={actionLoading === leave.id}
                onClick={() => onApprove(leave)}
              >
                {actionLoading === leave.id ? (
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                ) : (
                  <CheckCircle2 className="size-4 mr-1.5" />
                )}
                Setujui
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function LeaveManagement() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>('PENDING')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Confirmation dialog
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'APPROVED' | 'REJECTED' | null>(null)
  const [confirmLeave, setConfirmLeave] = useState<LeaveRequest | null>(null)

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLeave, setDetailLeave] = useState<LeaveRequest | null>(null)

  const fetchLeaves = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const statusParam = activeTab === 'ALL' ? '' : `?status=${activeTab}`
      const res = await fetch(`/api/leaves${statusParam}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Gagal memuat data pengajuan')
      }

      const data = await res.json()
      setLeaves(data.leaves ?? [])
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
      toast.error('Gagal memuat data', {
        description: err.message || 'Terjadi kesalahan saat memuat pengajuan',
      })
    } finally {
      setIsLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    fetchLeaves()
  }, [fetchLeaves])

  const handleAction = (leave: LeaveRequest, action: 'APPROVED' | 'REJECTED') => {
    setConfirmLeave(leave)
    setConfirmAction(action)
    setConfirmOpen(true)
  }

  const executeAction = async () => {
    if (!confirmLeave || !confirmAction) return

    try {
      setActionLoading(confirmLeave.id)

      const res = await fetch('/api/leaves', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: confirmLeave.id,
          status: confirmAction,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Gagal memproses pengajuan')
      }

      toast.success(
        confirmAction === 'APPROVED'
          ? 'Pengajuan disetujui'
          : 'Pengajuan ditolak',
        {
          description: `Pengajuan ${typeLabel(confirmLeave.type as LeaveType).toLowerCase()} dari ${confirmLeave.user?.nama ?? 'pegawai'} telah ${confirmAction === 'APPROVED' ? 'disetujui' : 'ditolak'}.`,
        }
      )

      // Refresh data
      await fetchLeaves()

      // Close detail dialog if open
      if (detailOpen && detailLeave?.id === confirmLeave.id) {
        setDetailOpen(false)
      }
    } catch (err: any) {
      toast.error('Gagal memproses', {
        description: err.message || 'Terjadi kesalahan saat memproses pengajuan',
      })
    } finally {
      setActionLoading(null)
      setConfirmOpen(false)
      setConfirmLeave(null)
      setConfirmAction(null)
    }
  }

  const openDetail = (leave: LeaveRequest) => {
    setDetailLeave(leave)
    setDetailOpen(true)
  }

  const pendingCount = leaves.filter((l) => l.status === 'PENDING').length
  const approvedCount = leaves.filter((l) => l.status === 'APPROVED').length
  const rejectedCount = leaves.filter((l) => l.status === 'REJECTED').length

  // ---- Loading state ----
  if (isLoading && leaves.length === 0) return <LeaveSkeleton />

  // ---- Error state ----
  if (error && leaves.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="size-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <UserX className="size-8 text-red-500" />
        </div>
        <p className="text-lg font-semibold text-foreground">Gagal Memuat Data</p>
        <p className="text-sm text-muted-foreground max-w-md text-center">{error}</p>
        <Button onClick={fetchLeaves} className="bg-[#1e40af] hover:bg-[#1e3a8a]">
          Coba Lagi
        </Button>
      </div>
    )
  }

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ================================================================= */}
      {/* Header                                                            */}
      {/* ================================================================= */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1e40af] dark:text-blue-300 tracking-tight">
            Manajemen Izin & Cuti
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kelola pengajuan izin, cuti, dan sakit pegawai
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchLeaves}
          disabled={isLoading}
          className="border-blue-200 dark:border-blue-800 text-[#2563eb] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
        >
          <RefreshCw className={`size-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </motion.div>

      {/* ================================================================= */}
      {/* Tabs + Table                                                      */}
      {/* ================================================================= */}
      <motion.div variants={itemVariants}>
        <Card className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30 shadow-lg shadow-blue-500/5">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4 bg-blue-50/50 dark:bg-blue-900/20">
                <TabsTrigger value="PENDING" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700 dark:data-[state=active]:bg-amber-900/40 dark:data-[state=active]:text-amber-300">
                  <Clock className="size-3.5 mr-1" />
                  Menunggu
                  {activeTab === 'PENDING' && pendingCount > 0 && (
                    <Badge className="ml-1.5 bg-amber-500 text-white text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center">
                      {pendingCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="APPROVED" className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-900/40 dark:data-[state=active]:text-emerald-300">
                  <CheckCircle2 className="size-3.5 mr-1" />
                  Disetujui
                </TabsTrigger>
                <TabsTrigger value="REJECTED" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-700 dark:data-[state=active]:bg-red-900/40 dark:data-[state=active]:text-red-300">
                  <XCircle className="size-3.5 mr-1" />
                  Ditolak
                </TabsTrigger>
                <TabsTrigger value="ALL" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900/40 dark:data-[state=active]:text-blue-300">
                  <ClipboardCheck className="size-3.5 mr-1" />
                  Semua
                </TabsTrigger>
              </TabsList>

              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <TabsContent value="PENDING">
                    <LeaveTable
                      leaves={leaves}
                      onApprove={(l) => handleAction(l, 'APPROVED')}
                      onReject={(l) => handleAction(l, 'REJECTED')}
                      onViewDetail={openDetail}
                      actionLoading={actionLoading}
                    />
                  </TabsContent>
                  <TabsContent value="APPROVED">
                    <LeaveTable
                      leaves={leaves}
                      onApprove={(l) => handleAction(l, 'APPROVED')}
                      onReject={(l) => handleAction(l, 'REJECTED')}
                      onViewDetail={openDetail}
                      actionLoading={actionLoading}
                    />
                  </TabsContent>
                  <TabsContent value="REJECTED">
                    <LeaveTable
                      leaves={leaves}
                      onApprove={(l) => handleAction(l, 'APPROVED')}
                      onReject={(l) => handleAction(l, 'REJECTED')}
                      onViewDetail={openDetail}
                      actionLoading={actionLoading}
                    />
                  </TabsContent>
                  <TabsContent value="ALL">
                    <LeaveTable
                      leaves={leaves}
                      onApprove={(l) => handleAction(l, 'APPROVED')}
                      onReject={(l) => handleAction(l, 'REJECTED')}
                      onViewDetail={openDetail}
                      actionLoading={actionLoading}
                    />
                  </TabsContent>
                </>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      {/* ================================================================= */}
      {/* Confirmation Dialog                                               */}
      {/* ================================================================= */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {confirmAction === 'APPROVED' ? (
                <CheckCircle2 className="size-5 text-emerald-500" />
              ) : (
                <XCircle className="size-5 text-red-500" />
              )}
              {confirmAction === 'APPROVED' ? 'Setujui Pengajuan?' : 'Tolak Pengajuan?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmLeave && (
                <span>
                  Apakah Anda yakin ingin {confirmAction === 'APPROVED' ? 'menyetujui' : 'menolak'} pengajuan{' '}
                  <strong>{typeLabel(confirmLeave.type as LeaveType).toLowerCase()}</strong> dari{' '}
                  <strong>{confirmLeave.user?.nama ?? 'pegawai'}</strong> pada tanggal{' '}
                  {formatDate(confirmLeave.startDate)} &ndash; {formatDate(confirmLeave.endDate)}?
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeAction}
              className={
                confirmAction === 'APPROVED'
                  ? 'bg-[#1e40af] hover:bg-[#1e3a8a] text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }
            >
              {confirmAction === 'APPROVED' ? 'Ya, Setujui' : 'Ya, Tolak'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ================================================================= */}
      {/* Detail Dialog                                                     */}
      {/* ================================================================= */}
      <LeaveDetailDialog
        leave={detailLeave}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onApprove={(l) => {
          setDetailOpen(false)
          handleAction(l, 'APPROVED')
        }}
        onReject={(l) => {
          setDetailOpen(false)
          handleAction(l, 'REJECTED')
        }}
        actionLoading={actionLoading}
      />
    </motion.div>
  )
}
