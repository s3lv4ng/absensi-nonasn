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
  FileText,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  BadgeCheck,
  Upload,
  Paperclip,
  Tag,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

import type { LeaveRequest, LeaveType, LeaveStatus, User, LeaveTypeCategory } from '@/types'
import { LeaveTypeManagement } from '@/components/admin/leave-type-management'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  DialogFooter,
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

function typeBadgeClass(type: string): string {
  switch (type) {
    case 'IZIN':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800'
    case 'CUTI':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
    case 'SAKIT':
      return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800'
    case 'DINAS':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800'
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300 border-slate-200 dark:border-slate-700'
  }
}

function typeLabel(type: string): string {
  switch (type) {
    case 'IZIN': return 'Izin'
    case 'CUTI': return 'Cuti'
    case 'SAKIT': return 'Sakit'
    case 'DINAS': return 'Dinas'
    default: return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
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

function toISODate(dateStr: string): string {
  if (!dateStr) return ''
  // date input returns yyyy-MM-dd
  return dateStr
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function LeaveSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
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
  onEdit,
  onDelete,
  actionLoading,
}: {
  leaves: LeaveRequest[]
  onApprove: (leave: LeaveRequest) => void
  onReject: (leave: LeaveRequest) => void
  onViewDetail: (leave: LeaveRequest) => void
  onEdit: (leave: LeaveRequest) => void
  onDelete: (leave: LeaveRequest) => void
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
                    <div className="flex flex-col">
                      <span className="text-sm font-medium truncate max-w-[120px]">
                        {leave.user?.nama ?? 'Unknown'}
                      </span>
                      {leave.isManualEntry && (
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1.5 py-0 w-fit bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                        >
                          <BadgeCheck className="size-2.5 mr-0.5" />
                          Manual
                        </Badge>
                      )}
                    </div>
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
                  <Badge variant="outline" className={`text-[10px] px-2 py-0 ${typeBadgeClass(leave.type as string)}`}>
                    {typeLabel(leave.type as string)}
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
                  <div className="flex items-center justify-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                    {leave.status === 'PENDING' ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-300"
                          disabled={actionLoading === leave.id}
                          onClick={() => onApprove(leave)}
                          title="Setujui"
                        >
                          {actionLoading === leave.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="size-3.5" />
                          )}
                          <span className="ml-1 text-xs hidden xl:inline">Setujui</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300"
                          disabled={actionLoading === leave.id}
                          onClick={() => onReject(leave)}
                          title="Tolak"
                        >
                          <XCircle className="size-3.5" />
                          <span className="ml-1 text-xs hidden xl:inline">Tolak</span>
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[#2563eb] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        onClick={() => onViewDetail(leave)}
                        title="Detail"
                      >
                        <Eye className="size-3.5" />
                        <span className="ml-1 text-xs hidden xl:inline">Detail</span>
                      </Button>
                    )}
                    {/* Edit */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                      onClick={() => onEdit(leave)}
                      title="Edit"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    {/* Delete */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => onDelete(leave)}
                      title="Hapus"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
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
            Informasi lengkap pengajuan {typeLabel(leave.type as string).toLowerCase()}
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
              <Badge variant="outline" className={`text-xs ${typeBadgeClass(leave.type as string)}`}>
                {typeLabel(leave.type as string)}
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

          {leave.isManualEntry && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/40">
              <BadgeCheck className="size-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                Entri manual oleh Admin
              </span>
            </div>
          )}

          {/* Bukti Dukung */}
          {leave.attachment && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Bukti Dukung</p>
              <a
                href={leave.attachment}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm text-[#1e40af] dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                <Paperclip className="size-4" />
                Lihat Bukti Dukung
              </a>
            </div>
          )}

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
// Add Manual Dialog
// ---------------------------------------------------------------------------

function AddManualDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [pegawaiList, setPegawaiList] = useState<User[]>([])
  const [leaveTypeList, setLeaveTypeList] = useState<LeaveTypeCategory[]>([])
  const [loadingPegawai, setLoadingPegawai] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [userId, setUserId] = useState('')
  const [type, setType] = useState<string>('IZIN')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [attachmentName, setAttachmentName] = useState('')

  // Default leave type config
  const defaultTypes = [
    { code: 'IZIN', label: 'Izin', color: '#3b82f6' },
    { code: 'CUTI', label: 'Cuti', color: '#10b981' },
    { code: 'SAKIT', label: 'Sakit', color: '#ef4444' },
    { code: 'DINAS', label: 'Dinas', color: '#8b5cf6' },
  ]

  // Fetch pegawai list when dialog opens
  useEffect(() => {
    if (!open) return
    let cancelled = false
    async function fetchPegawai() {
      try {
        setLoadingPegawai(true)
        const res = await fetch('/api/users?role=PEGAWAI&limit=100')
        if (!res.ok) throw new Error('Gagal memuat data pegawai')
        const data = await res.json()
        if (!cancelled) setPegawaiList(data.users ?? [])
      } catch (err: any) {
        if (!cancelled) {
          toast.error('Gagal memuat pegawai', { description: err.message })
        }
      } finally {
        if (!cancelled) setLoadingPegawai(false)
      }
    }
    fetchPegawai()
    return () => { cancelled = true }
  }, [open])

  // Fetch leave types when dialog opens
  useEffect(() => {
    if (!open) return
    let cancelled = false
    async function fetchLeaveTypes() {
      try {
        const res = await fetch('/api/leave-types')
        if (res.ok) {
          const data = await res.json()
          if (!cancelled) setLeaveTypeList(data.leaveTypes || [])
        }
      } catch {
        // silently fail
      }
    }
    fetchLeaveTypes()
    return () => { cancelled = true }
  }, [open])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB')
      return
    }
    setAttachmentFile(file)
    setAttachmentName(file.name)
  }

  const removeAttachment = () => {
    setAttachmentFile(null)
    setAttachmentName('')
  }

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal mengupload file')
      }
      const data = await res.json()
      return data.url
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengupload file')
      return null
    }
  }

  const resetForm = () => {
    setUserId('')
    setType('IZIN')
    setStartDate('')
    setEndDate('')
    setReason('')
    setAttachmentFile(null)
    setAttachmentName('')
  }

  const handleSubmit = async () => {
    if (!userId) {
      toast.error('Pilih pegawai terlebih dahulu')
      return
    }
    if (!startDate || !endDate) {
      toast.error('Tanggal mulai dan selesai wajib diisi')
      return
    }
    if (!reason.trim()) {
      toast.error('Alasan wajib diisi')
      return
    }
    if (new Date(endDate) < new Date(startDate)) {
      toast.error('Tanggal selesai tidak boleh sebelum tanggal mulai')
      return
    }

    try {
      setSubmitting(true)

      // Upload file if exists
      let attachmentUrl: string | null = null
      if (attachmentFile) {
        attachmentUrl = await uploadFile(attachmentFile)
        if (attachmentFile && !attachmentUrl) {
          setSubmitting(false)
          return
        }
      }

      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          type,
          startDate,
          endDate,
          reason: reason.trim(),
          attachment: attachmentUrl,
          status: 'APPROVED',
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Gagal menambahkan data')
      }

      toast.success('Data berhasil ditambahkan', {
        description: `${typeLabel(type)} telah ditambahkan dan disetujui secara otomatis`,
      })

      resetForm()
      onClose()
      onSuccess()
    } catch (err: any) {
      toast.error('Gagal menambahkan', { description: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { resetForm(); onClose() } }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#1e40af] dark:text-blue-300 flex items-center gap-2">
            <Plus className="size-5" />
            Tambah Manual
          </DialogTitle>
          <DialogDescription>
            Tambahkan data izin / cuti / sakit / dinas secara manual. Status otomatis <strong>Disetujui</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Pegawai */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Pegawai</Label>
            <Select value={userId} onValueChange={setUserId} disabled={loadingPegawai}>
              <SelectTrigger className="border-blue-200 dark:border-blue-800">
                {loadingPegawai ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="size-3.5 animate-spin" />
                    <span className="text-muted-foreground">Memuat...</span>
                  </div>
                ) : (
                  <SelectValue placeholder="Pilih pegawai" />
                )}
              </SelectTrigger>
              <SelectContent>
                {pegawaiList.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nama} — {p.nip}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipe */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tipe</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="border-blue-200 dark:border-blue-800">
                <SelectValue placeholder="Pilih tipe" />
              </SelectTrigger>
              <SelectContent>
                {/* Default types */}
                {defaultTypes.map((dt) => (
                  <SelectItem key={dt.code} value={dt.code}>
                    <span className="flex items-center gap-2">
                      <span className="size-2 rounded-full" style={{ backgroundColor: dt.color }} /> {dt.label}
                    </span>
                  </SelectItem>
                ))}
                {/* Custom types from API */}
                {leaveTypeList.filter((lt) => lt.isActive && !defaultTypes.some(d => d.code === lt.code)).map((lt) => (
                  <SelectItem key={lt.code} value={lt.code}>
                    <span className="flex items-center gap-2">
                      <span className="size-2 rounded-full" style={{ backgroundColor: lt.color }} /> {lt.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tanggal Mulai & Selesai */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tanggal Mulai</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border-blue-200 dark:border-blue-800"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tanggal Selesai</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border-blue-200 dark:border-blue-800"
              />
            </div>
          </div>

          {/* Alasan */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Alasan</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Masukkan alasan..."
              rows={3}
              className="border-blue-200 dark:border-blue-800 resize-none"
            />
          </div>

          {/* Bukti Dukung */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Bukti Dukung (Opsional)</Label>
            {!attachmentFile ? (
              <div className="relative">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex items-center gap-2 p-3 rounded-xl border-2 border-dashed border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer">
                  <Upload className="size-5 text-[#1e40af] dark:text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-[#1e40af] dark:text-blue-400">Klik untuk upload</p>
                    <p className="text-[10px] text-muted-foreground">JPG, PNG, PDF, DOC/DOCX (Maks. 5MB)</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <Paperclip className="size-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm text-emerald-700 dark:text-emerald-300 flex-1 truncate">{attachmentName}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="size-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={removeAttachment}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            )}
          </div>

          {/* Status info */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40">
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
              Status otomatis: Disetujui (APPROVED)
            </span>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => { resetForm(); onClose() }}
            disabled={submitting}
            className="border-blue-200 dark:border-blue-800"
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-[#1e40af] hover:bg-[#1e3a8a] text-white"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin mr-1.5" />
                Menyimpan...
              </>
            ) : (
              <>
                <Plus className="size-4 mr-1.5" />
                Tambah
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Edit Dialog
// ---------------------------------------------------------------------------

function EditDialog({
  leave,
  open,
  onClose,
  onSuccess,
}: {
  leave: LeaveRequest | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [type, setType] = useState<string>('IZIN')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [leaveTypeList, setLeaveTypeList] = useState<LeaveTypeCategory[]>([])
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [attachmentName, setAttachmentName] = useState('')
  const [currentAttachment, setCurrentAttachment] = useState<string | null>(null)

  const defaultTypes = [
    { code: 'IZIN', label: 'Izin', color: '#3b82f6' },
    { code: 'CUTI', label: 'Cuti', color: '#10b981' },
    { code: 'SAKIT', label: 'Sakit', color: '#ef4444' },
    { code: 'DINAS', label: 'Dinas', color: '#8b5cf6' },
  ]

  // Fetch leave types
  useEffect(() => {
    if (!open) return
    let cancelled = false
    async function fetchLeaveTypes() {
      try {
        const res = await fetch('/api/leave-types')
        if (res.ok) {
          const data = await res.json()
          if (!cancelled) setLeaveTypeList(data.leaveTypes || [])
        }
      } catch {
        // silently fail
      }
    }
    fetchLeaveTypes()
    return () => { cancelled = true }
  }, [open])

  useEffect(() => {
    if (leave && open) {
      setType(leave.type as string)
      const sd = new Date(leave.startDate)
      setStartDate(sd.toISOString().split('T')[0])
      const ed = new Date(leave.endDate)
      setEndDate(ed.toISOString().split('T')[0])
      setReason(leave.reason)
      setCurrentAttachment(leave.attachment || null)
      setAttachmentFile(null)
      setAttachmentName('')
    }
  }, [leave, open])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB')
      return
    }
    setAttachmentFile(file)
    setAttachmentName(file.name)
  }

  const removeAttachment = () => {
    setAttachmentFile(null)
    setAttachmentName('')
  }

  const removeCurrentAttachment = () => {
    setCurrentAttachment(null)
  }

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal mengupload file')
      }
      const data = await res.json()
      return data.url
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengupload file')
      return null
    }
  }

  const handleSubmit = async () => {
    if (!leave) return
    if (!startDate || !endDate) {
      toast.error('Tanggal mulai dan selesai wajib diisi')
      return
    }
    if (!reason.trim()) {
      toast.error('Alasan wajib diisi')
      return
    }
    if (new Date(endDate) < new Date(startDate)) {
      toast.error('Tanggal selesai tidak boleh sebelum tanggal mulai')
      return
    }

    try {
      setSubmitting(true)

      // Handle attachment
      let attachmentUrl = currentAttachment
      if (attachmentFile) {
        const uploaded = await uploadFile(attachmentFile)
        if (!uploaded) {
          setSubmitting(false)
          return
        }
        attachmentUrl = uploaded
      }

      const res = await fetch('/api/leaves', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: leave.id,
          type,
          startDate,
          endDate,
          reason: reason.trim(),
          attachment: attachmentUrl,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Gagal memperbarui data')
      }

      toast.success('Data berhasil diperbarui')
      onClose()
      onSuccess()
    } catch (err: any) {
      toast.error('Gagal memperbarui', { description: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#1e40af] dark:text-blue-300 flex items-center gap-2">
            <Pencil className="size-5" />
            Edit Pengajuan
          </DialogTitle>
          <DialogDescription>
            Perbarui data pengajuan {leave ? typeLabel(leave.type as string).toLowerCase() : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Pegawai info (read-only) */}
          {leave?.user && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-900/30">
              <div className="size-8 rounded-full bg-[#1e40af]/10 dark:bg-blue-900/30 flex items-center justify-center text-xs font-bold text-[#1e40af] dark:text-blue-400">
                {leave.user.nama.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">{leave.user.nama}</p>
                <p className="text-xs text-muted-foreground">{leave.user.nip}</p>
              </div>
            </div>
          )}

          {/* Tipe */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tipe</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="border-blue-200 dark:border-blue-800">
                <SelectValue placeholder="Pilih tipe" />
              </SelectTrigger>
              <SelectContent>
                {defaultTypes.map((dt) => (
                  <SelectItem key={dt.code} value={dt.code}>
                    <span className="flex items-center gap-2">
                      <span className="size-2 rounded-full" style={{ backgroundColor: dt.color }} /> {dt.label}
                    </span>
                  </SelectItem>
                ))}
                {leaveTypeList.filter((lt) => lt.isActive && !defaultTypes.some(d => d.code === lt.code)).map((lt) => (
                  <SelectItem key={lt.code} value={lt.code}>
                    <span className="flex items-center gap-2">
                      <span className="size-2 rounded-full" style={{ backgroundColor: lt.color }} /> {lt.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tanggal Mulai & Selesai */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tanggal Mulai</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border-blue-200 dark:border-blue-800"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tanggal Selesai</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border-blue-200 dark:border-blue-800"
              />
            </div>
          </div>

          {/* Alasan */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Alasan</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Masukkan alasan..."
              rows={3}
              className="border-blue-200 dark:border-blue-800 resize-none"
            />
          </div>

          {/* Bukti Dukung */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Bukti Dukung (Opsional)</Label>
              {/* Current attachment */}
              {currentAttachment && !attachmentFile && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 mb-2">
                  <Paperclip className="size-4 text-[#1e40af] dark:text-blue-400" />
                  <a href={currentAttachment} target="_blank" rel="noopener noreferrer" className="text-sm text-[#1e40af] dark:text-blue-400 hover:underline flex-1 truncate">
                    File saat ini
                  </a>
                  <Button variant="ghost" size="sm" className="size-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={removeCurrentAttachment}>
                    <X className="size-3.5" />
                  </Button>
                </div>
              )}
              {/* New attachment upload */}
              {!attachmentFile ? (
                <div className="relative">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex items-center gap-2 p-3 rounded-xl border-2 border-dashed border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer">
                    <Upload className="size-5 text-[#1e40af] dark:text-blue-400" />
                    <div>
                      <p className="text-sm font-medium text-[#1e40af] dark:text-blue-400">{currentAttachment ? 'Ganti file' : 'Klik untuk upload'}</p>
                      <p className="text-[10px] text-muted-foreground">JPG, PNG, PDF, DOC/DOCX (Maks. 5MB)</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                  <Paperclip className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm text-emerald-700 dark:text-emerald-300 flex-1 truncate">{attachmentName}</span>
                  <Button variant="ghost" size="sm" className="size-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={removeAttachment}>
                    <X className="size-3.5" />
                  </Button>
                </div>
              )}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            className="border-blue-200 dark:border-blue-800"
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-[#1e40af] hover:bg-[#1e3a8a] text-white"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin mr-1.5" />
                Menyimpan...
              </>
            ) : (
              <>
                <Pencil className="size-4 mr-1.5" />
                Simpan
              </>
            )}
          </Button>
        </DialogFooter>
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
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Confirmation dialog (approve/reject)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'APPROVED' | 'REJECTED' | null>(null)
  const [confirmLeave, setConfirmLeave] = useState<LeaveRequest | null>(null)

  // Delete confirmation
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteLeave, setDeleteLeave] = useState<LeaveRequest | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLeave, setDetailLeave] = useState<LeaveRequest | null>(null)

  // Add manual dialog
  const [addOpen, setAddOpen] = useState(false)

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false)
  const [editLeave, setEditLeave] = useState<LeaveRequest | null>(null)

  const [activeMainTab, setActiveMainTab] = useState<string>('leaves')

  const limit = 20

  const fetchLeaves = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))
      if (activeTab !== 'ALL') params.set('status', activeTab)

      const res = await fetch(`/api/leaves?${params.toString()}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Gagal memuat data pengajuan')
      }

      const data = await res.json()
      setLeaves(data.leaves ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
      toast.error('Gagal memuat data', {
        description: err.message || 'Terjadi kesalahan saat memuat pengajuan',
      })
    } finally {
      setIsLoading(false)
    }
  }, [activeTab, page])

  useEffect(() => {
    fetchLeaves()
  }, [fetchLeaves])

  // Reset page when tab changes
  useEffect(() => {
    setPage(1)
  }, [activeTab])

  // Approve / Reject
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
          description: `Pengajuan ${typeLabel(confirmLeave.type as string).toLowerCase()} dari ${confirmLeave.user?.nama ?? 'pegawai'} telah ${confirmAction === 'APPROVED' ? 'disetujui' : 'ditolak'}.`,
        }
      )

      await fetchLeaves()

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

  // Delete
  const handleDelete = async () => {
    if (!deleteLeave) return

    try {
      setDeleteLoading(true)
      const res = await fetch(`/api/leaves?id=${deleteLeave.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Gagal menghapus data')
      }

      toast.success('Data berhasil dihapus', {
        description: `Pengajuan ${typeLabel(deleteLeave.type as string).toLowerCase()} dari ${deleteLeave.user?.nama ?? 'pegawai'} telah dihapus.`,
      })

      await fetchLeaves()

      if (detailOpen && detailLeave?.id === deleteLeave.id) {
        setDetailOpen(false)
      }
    } catch (err: any) {
      toast.error('Gagal menghapus', { description: err.message })
    } finally {
      setDeleteLoading(false)
      setDeleteOpen(false)
      setDeleteLeave(null)
    }
  }

  // Edit
  const openEdit = (leave: LeaveRequest) => {
    setEditLeave(leave)
    setEditOpen(true)
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
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1e40af] dark:text-blue-300 tracking-tight flex items-center gap-2.5">
            <ClipboardCheck className="size-8" />
            Manajemen Izin / Cuti / Dinas
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kelola pengajuan izin, cuti, sakit, dan dinas pegawai
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeMainTab === 'leaves' && (
            <Button
              onClick={() => setAddOpen(true)}
              className="bg-[#1e40af] hover:bg-[#1e3a8a] text-white shadow-lg shadow-blue-500/20"
            >
              <Plus className="size-4 mr-1.5" />
              Tambah Manual
            </Button>
          )}
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
        </div>
      </motion.div>

      {/* ================================================================= */}
      {/* Main Tabs: Pengajuan | Tipe Cuti/Izin                            */}
      {/* ================================================================= */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeMainTab} onValueChange={setActiveMainTab}>
          <TabsList className="bg-blue-50/50 dark:bg-blue-900/20">
            <TabsTrigger value="leaves" className="data-[state=active]:bg-[#1e40af] data-[state=active]:text-white">
              <ClipboardCheck className="size-3.5 mr-1.5" />
              Pengajuan
            </TabsTrigger>
            <TabsTrigger value="types" className="data-[state=active]:bg-[#1e40af] data-[state=active]:text-white">
              <Tag className="size-3.5 mr-1.5" />
              Tipe Cuti / Izin
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leaves" className="mt-4">
            {/* ============================================================= */}
            {/* Leave Status Tabs + Table                                     */}
            {/* ============================================================= */}
            <Card className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30 shadow-lg shadow-blue-500/5">
              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-4 bg-blue-50/50 dark:bg-blue-900/20">
                    <TabsTrigger value="PENDING" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700 dark:data-[state=active]:bg-amber-900/40 dark:data-[state=active]:text-amber-300">
                      <Clock className="size-3.5 mr-1" />
                      Menunggu
                      {pendingCount > 0 && (
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
                          onEdit={openEdit}
                          onDelete={(l) => { setDeleteLeave(l); setDeleteOpen(true) }}
                          actionLoading={actionLoading}
                        />
                      </TabsContent>
                      <TabsContent value="APPROVED">
                        <LeaveTable
                          leaves={leaves}
                          onApprove={(l) => handleAction(l, 'APPROVED')}
                          onReject={(l) => handleAction(l, 'REJECTED')}
                          onViewDetail={openDetail}
                          onEdit={openEdit}
                          onDelete={(l) => { setDeleteLeave(l); setDeleteOpen(true) }}
                          actionLoading={actionLoading}
                        />
                      </TabsContent>
                      <TabsContent value="REJECTED">
                        <LeaveTable
                          leaves={leaves}
                          onApprove={(l) => handleAction(l, 'APPROVED')}
                          onReject={(l) => handleAction(l, 'REJECTED')}
                          onViewDetail={openDetail}
                          onEdit={openEdit}
                          onDelete={(l) => { setDeleteLeave(l); setDeleteOpen(true) }}
                          actionLoading={actionLoading}
                        />
                      </TabsContent>
                      <TabsContent value="ALL">
                        <LeaveTable
                          leaves={leaves}
                          onApprove={(l) => handleAction(l, 'APPROVED')}
                          onReject={(l) => handleAction(l, 'REJECTED')}
                          onViewDetail={openDetail}
                          onEdit={openEdit}
                          onDelete={(l) => { setDeleteLeave(l); setDeleteOpen(true) }}
                          actionLoading={actionLoading}
                        />
                      </TabsContent>
                    </>
                  )}
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="types" className="mt-4">
            <LeaveTypeManagement />
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* ================================================================= */}
      {/* Approve/Reject Confirmation Dialog                                 */}
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
                  <strong>{typeLabel(confirmLeave.type as string).toLowerCase()}</strong> dari{' '}
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
      {/* Delete Confirmation Dialog                                        */}
      {/* ================================================================= */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="size-5 text-red-500" />
              Hapus Pengajuan?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteLeave && (
                <span>
                  Apakah Anda yakin ingin menghapus pengajuan{' '}
                  <strong>{typeLabel(deleteLeave.type as string).toLowerCase()}</strong> dari{' '}
                  <strong>{deleteLeave.user?.nama ?? 'pegawai'}</strong> pada tanggal{' '}
                  {formatDate(deleteLeave.startDate)} &ndash; {formatDate(deleteLeave.endDate)}?
                  <br />
                  <span className="text-red-500 font-medium">Tindakan ini tidak dapat dibatalkan.</span>
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                  Menghapus...
                </>
              ) : (
                'Ya, Hapus'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ================================================================= */}
      {/* Detail Dialog                                                     */}
      {/* ================================================================= */}
      {/* ================================================================= */}
      {/* Pagination                                                        */}
      {/* ================================================================= */}
      {activeMainTab === 'leaves' && totalPages > 1 && (
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Halaman {page} dari {totalPages} ({total} data)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="border-blue-200 dark:border-blue-800 text-[#2563eb] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <ChevronLeft className="size-4 mr-1" />
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="border-blue-200 dark:border-blue-800 text-[#2563eb] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              Selanjutnya
              <ChevronRight className="size-4 ml-1" />
            </Button>
          </div>
        </motion.div>
      )}

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

      {/* ================================================================= */}
      {/* Add Manual Dialog                                                 */}
      {/* ================================================================= */}
      <AddManualDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={fetchLeaves}
      />

      {/* ================================================================= */}
      {/* Edit Dialog                                                       */}
      {/* ================================================================= */}
      <EditDialog
        leave={editLeave}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={fetchLeaves}
      />
    </motion.div>
  )
}
