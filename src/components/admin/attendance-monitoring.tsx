'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Monitor,
  Search,
  MapPin,
  ExternalLink,
  RefreshCw,
  Clock,
  Activity,
  CalendarDays,
  Fingerprint,
  X,
  ImageIcon,
  Navigation,
  PenLine,
  Pencil,
  Trash2,
  Upload,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  Eye,
  EyeOff,
  ChevronDown,
} from 'lucide-react'

import { useAppStore } from '@/store'
import type { Attendance, AttendanceStatus, AttendanceType, OfficeSetting } from '@/types'
import { DataPagination } from '@/components/shared/data-pagination'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ManualAttendanceDialog } from '@/components/admin/manual-attendance-dialog'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AttendanceResponse {
  attendances: Attendance[]
  total: number
  page: number
  totalPages: number
}

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

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function statusColor(status: AttendanceStatus) {
  switch (status) {
    case 'HADIR':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
    case 'TELAT':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800'
    case 'PULANG_CEPAT':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-800'
    case 'IZIN':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800'
    case 'CUTI':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800'
    case 'ALPHA':
      return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-300 border-gray-200 dark:border-gray-700'
  }
}

function typeBadgeClass(type: AttendanceType) {
  return type === 'MASUK'
    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
    : 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800'
}

function confidenceColor(confidence: number) {
  if (confidence >= 0.8) return '#10b981'
  if (confidence >= 0.5) return '#f59e0b'
  return '#ef4444'
}

function haversineDistanceSimple(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const φ1 = toRad(lat1)
  const φ2 = toRad(lat2)
  const Δφ = toRad(lat2 - lat1)
  const Δλ = toRad(lon2 - lon1)
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function MonitoringSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
      </div>
      <Card className="bg-white/70 dark:bg-gray-900/60">
        <CardContent className="p-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-blue-50 dark:border-blue-900/20">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-12 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Admin Marker Badge
// ---------------------------------------------------------------------------

function AdminMarkerBadges({ attendance }: { attendance: Attendance }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {attendance.isManual && (
        <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200 dark:border-teal-800 text-[9px] px-1.5 py-0 gap-0.5">
          <PenLine className="size-2.5" />
          Manual
          {attendance.manualByUser && (
            <span className="font-normal">by {attendance.manualByUser.nama}</span>
          )}
        </Badge>
      )}
      {attendance.editedBy && (
        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800 text-[9px] px-1.5 py-0 gap-0.5">
          <Pencil className="size-2.5" />
          Diedit
          {attendance.editedByUser && (
            <span className="font-normal">by {attendance.editedByUser.nama}</span>
          )}
        </Badge>
      )}
      {attendance.isDeleted && (
        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800 text-[9px] px-1.5 py-0 gap-0.5">
          <Trash2 className="size-2.5" />
          Dihapus
          {attendance.deletedByUser && (
            <span className="font-normal">by {attendance.deletedByUser.nama}</span>
          )}
        </Badge>
      )}
      {attendance.buktiDukung && (
        <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 text-[9px] px-1.5 py-0 gap-0.5">
          <FileCheck className="size-2.5" />
          Bukti
        </Badge>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Attendance Detail Dialog
// ---------------------------------------------------------------------------

function AttendanceDetailDialog({
  attendance,
  open,
  onOpenChange,
  officeSetting,
}: {
  attendance: Attendance | null
  open: boolean
  onOpenChange: (open: boolean) => void
  officeSetting: OfficeSetting | null
}) {
  if (!attendance) return null

  const mapsUrl = `https://www.google.com/maps?q=${attendance.latitude},${attendance.longitude}`
  const distance = officeSetting
    ? haversineDistanceSimple(
        officeSetting.latitude,
        officeSetting.longitude,
        attendance.latitude,
        attendance.longitude
      )
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-900 border-blue-100/50 dark:border-blue-900/30 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#1e40af] dark:text-blue-300 flex items-center gap-2">
            <Activity className="size-5" />
            Detail Absensi
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Admin Markers */}
          <AdminMarkerBadges attendance={attendance} />

          {/* Employee Info */}
          <div className="flex items-center gap-3">
            <Avatar className="size-14 ring-2 ring-blue-100 dark:ring-blue-900/40">
              <AvatarImage src={attendance.user?.photo ?? undefined} alt={attendance.user?.nama ?? ''} />
              <AvatarFallback className="bg-[#1e40af]/10 text-[#1e40af] dark:bg-blue-900/30 dark:text-blue-400 font-bold text-lg">
                {getInitials(attendance.user?.nama ?? '??')}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-foreground">{attendance.user?.nama ?? 'Unknown'}</p>
              <p className="text-sm text-muted-foreground font-mono">{attendance.user?.nip ?? '-'}</p>
              {attendance.user?.unitKerja && (
                <p className="text-xs text-muted-foreground">{attendance.user.unitKerja}</p>
              )}
            </div>
          </div>

          <Separator className="bg-blue-50 dark:bg-blue-900/20" />

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <DetailItem label="Tipe" value={
              <Badge variant="outline" className={`text-[10px] px-2 py-0 ${typeBadgeClass(attendance.type)}`}>
                {attendance.type === 'MASUK' ? 'Masuk' : 'Pulang'}
              </Badge>
            } />
            <DetailItem label="Status" value={
              <Badge variant="outline" className={`text-[10px] px-2 py-0 ${statusColor(attendance.status)}`}>
                {attendance.status}
              </Badge>
            } />
            <DetailItem label="Waktu" value={formatTime(attendance.createdAt)} />
            <DetailItem label="Tanggal" value={formatShortDate(attendance.createdAt)} />
            <DetailItem
              label="Confidence"
              value={
                <div className="flex items-center gap-2">
                  <div className="w-14 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.round(attendance.confidence * 100)}%`,
                        backgroundColor: confidenceColor(attendance.confidence),
                      }}
                    />
                  </div>
                  <span className="text-xs tabular-nums">{Math.round(attendance.confidence * 100)}%</span>
                </div>
              }
            />
            {distance !== null && (
              <DetailItem label="Jarak dari Kantor" value={`${Math.round(distance)}m`} />
            )}
          </div>

          {/* Edited info */}
          {attendance.editedBy && (
            <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30">
              <div className="flex items-center gap-2 mb-1">
                <Pencil className="size-3.5 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Diedit oleh Admin</span>
              </div>
              {attendance.editedByUser && (
                <p className="text-xs text-amber-600 dark:text-amber-400">{attendance.editedByUser.nama}</p>
              )}
              {attendance.editedAt && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {new Date(attendance.editedAt).toLocaleString('id-ID')}
                </p>
              )}
              {attendance.editReason && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Alasan: {attendance.editReason}</p>
              )}
            </div>
          )}

          {/* Bukti Dukung */}
          {attendance.buktiDukung && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Bukti Dukung</p>
              <div className="rounded-xl overflow-hidden border border-indigo-100/50 dark:border-indigo-900/30 bg-gray-50 dark:bg-gray-800">
                <img
                  src={attendance.buktiDukung}
                  alt="Bukti dukung"
                  className="w-full max-h-64 object-cover"
                />
              </div>
            </div>
          )}

          {/* Photo */}
          {attendance.photo && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Foto Absensi</p>
              <div className="rounded-xl overflow-hidden border border-blue-100/50 dark:border-blue-900/30 bg-gray-50 dark:bg-gray-800">
                <img
                  src={attendance.photo}
                  alt="Foto absensi"
                  className="w-full max-h-64 object-cover"
                />
              </div>
            </div>
          )}

          {/* Location / Map */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Lokasi GPS</p>
            <div className="rounded-xl border border-blue-100/50 dark:border-blue-900/30 p-3 bg-blue-50/30 dark:bg-blue-900/10">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  <p>Lat: {attendance.latitude.toFixed(6)}</p>
                  <p>Lng: {attendance.longitude.toFixed(6)}</p>
                </div>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e40af] hover:bg-[#1e3a8a] text-white text-xs font-medium transition-colors shadow-md shadow-blue-500/20"
                >
                  <Navigation className="size-3" />
                  Buka Maps
                </a>
              </div>
            </div>
          </div>

          {attendance.note && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Catatan</p>
              <p className="text-sm text-foreground rounded-lg border border-blue-100/50 dark:border-blue-900/30 p-3 bg-blue-50/20 dark:bg-blue-900/5">
                {attendance.note}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <div className="text-sm">{value}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Edit Attendance Dialog
// ---------------------------------------------------------------------------

function EditAttendanceDialog({
  attendance,
  open,
  onOpenChange,
  onSuccess,
}: {
  attendance: Attendance | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [status, setStatus] = useState<string>('')
  const [type, setType] = useState<string>('')
  const [note, setNote] = useState<string>('')
  const [editReason, setEditReason] = useState<string>('')
  const [buktiDukung, setBuktiDukung] = useState<string | null>(null)
  const [buktiPreview, setBuktiPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset when attendance changes or dialog opens
  useEffect(() => {
    if (attendance && open) {
      setStatus(attendance.status)
      setType(attendance.type)
      setNote(attendance.note || '')
      setEditReason('')
      setBuktiDukung(null)
      setBuktiPreview(attendance.buktiDukung || null)
    }
  }, [attendance, open])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Hanya file gambar yang diizinkan')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      setBuktiDukung(result)
      setBuktiPreview(result)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!attendance) return

    if (!editReason.trim()) {
      toast.error('Alasan edit wajib diisi')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/attendance/${attendance.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          type,
          note: note.trim() || null,
          editReason: editReason.trim(),
          buktiDukung: buktiDukung || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengedit absensi')
      }

      toast.success('Absensi berhasil diperbarui', {
        description: data.message,
      })

      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      toast.error('Gagal mengedit absensi', {
        description: err.message || 'Terjadi kesalahan',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!attendance) return null

  const statusOptions = [
    { value: 'HADIR', label: 'Hadir' },
    { value: 'TELAT', label: 'Telat' },
    { value: 'IZIN', label: 'Izin' },
    { value: 'CUTI', label: 'Cuti' },
    { value: 'ALPHA', label: 'Alpha' },
    { value: 'DINAS', label: 'Dinas' },
    { value: 'PULANG_CEPAT', label: 'Pulang Cepat' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-900 border-blue-100/50 dark:border-blue-900/30 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#1e40af] dark:text-blue-300 flex items-center gap-2">
            <Pencil className="size-5" />
            Edit Absensi
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Edit absensi {attendance.user?.nama ?? ''} — {formatShortDate(attendance.createdAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Employee info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-900/30">
            <Avatar className="size-10 ring-2 ring-blue-100 dark:ring-blue-900/40">
              <AvatarImage src={attendance.user?.photo ?? undefined} alt={attendance.user?.nama ?? ''} />
              <AvatarFallback className="bg-[#1e40af]/10 text-[#1e40af] dark:bg-blue-900/30 dark:text-blue-400 font-bold text-xs">
                {getInitials(attendance.user?.nama ?? '??')}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-foreground">{attendance.user?.nama ?? 'Unknown'}</p>
              <p className="text-xs text-muted-foreground font-mono">{attendance.user?.nip ?? '-'}</p>
            </div>
          </div>

          <Separator className="bg-blue-50 dark:bg-blue-900/20" />

          {/* Type & Status Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tipe</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-white/70 dark:bg-gray-900/60 border-blue-100/50 dark:border-blue-900/30">
                  <SelectValue placeholder="Pilih tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MASUK">Masuk</SelectItem>
                  <SelectItem value="PULANG">Pulang</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="bg-white/70 dark:bg-gray-900/60 border-blue-100/50 dark:border-blue-900/30">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Catatan</Label>
            <Textarea
              placeholder="Catatan tambahan..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="bg-white/70 dark:bg-gray-900/60 border-blue-100/50 dark:border-blue-900/30 min-h-[60px]"
            />
          </div>

          <Separator className="bg-blue-50 dark:bg-blue-900/20" />

          {/* Edit Reason - REQUIRED */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <AlertTriangle className="size-3.5 text-amber-500" />
              Alasan Edit <span className="text-red-500">*</span>
            </Label>
            <Textarea
              placeholder="Wajib isi alasan perubahan absensi ini..."
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              className="bg-white/70 dark:bg-gray-900/60 border-amber-200/50 dark:border-amber-800/30 min-h-[60px] focus:border-amber-400"
            />
          </div>

          {/* Bukti Dukung Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Upload className="size-3.5" />
              Upload Bukti Dukung <span className="text-xs text-muted-foreground font-normal">(opsional)</span>
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-dashed border-2 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 h-20"
            >
              <div className="flex flex-col items-center gap-1">
                <Upload className="size-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Klik untuk upload gambar</span>
              </div>
            </Button>
            {buktiPreview && (
              <div className="relative rounded-lg overflow-hidden border border-blue-100/50 dark:border-blue-900/30">
                <img
                  src={buktiPreview}
                  alt="Preview bukti dukung"
                  className="w-full max-h-40 object-cover"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 size-7 p-0"
                  onClick={() => {
                    setBuktiDukung(null)
                    setBuktiPreview(null)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                >
                  <X className="size-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Info banner */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30">
            <ShieldCheck className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Perubahan akan dicatat dengan nama admin sebagai penanggung jawab edit. Alasan edit wajib diisi.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-blue-200 dark:border-blue-800"
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !editReason.trim()}
            className="bg-[#1e40af] hover:bg-[#1e3a8a] text-white shadow-lg shadow-blue-500/25"
          >
            {isSubmitting ? 'Menyimpan...' : (
              <>
                <Pencil className="size-4 mr-1.5" />
                Simpan Perubahan
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Mobile Attendance Card
// ---------------------------------------------------------------------------

function AttendanceCard({
  attendance,
  onClick,
  officeSetting,
  onEdit,
  onDelete,
}: {
  attendance: Attendance
  onClick: () => void
  officeSetting: OfficeSetting | null
  onEdit: (e: React.MouseEvent) => void
  onDelete: (e: React.MouseEvent) => void
}) {
  const distance = officeSetting
    ? haversineDistanceSimple(
        officeSetting.latitude,
        officeSetting.longitude,
        attendance.latitude,
        attendance.longitude
      )
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`rounded-xl border bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl shadow-sm transition-all ${
        attendance.isDeleted
          ? 'border-red-200/50 dark:border-red-900/30 opacity-60'
          : 'border-blue-100/50 dark:border-blue-900/30 hover:shadow-md hover:bg-blue-50/30 dark:hover:bg-blue-900/10'
      }`}
    >
      <div className="p-4 cursor-pointer" onClick={onClick}>
        <div className="flex items-start gap-3">
          <Avatar className="size-11 ring-2 ring-blue-100 dark:ring-blue-900/40 shrink-0">
            <AvatarImage src={attendance.user?.photo ?? undefined} alt={attendance.user?.nama ?? ''} />
            <AvatarFallback className="bg-[#1e40af]/10 text-[#1e40af] dark:bg-blue-900/30 dark:text-blue-400 font-bold text-xs">
              {getInitials(attendance.user?.nama ?? '??')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground truncate">
                {attendance.user?.nama ?? 'Unknown'}
              </p>
              <div className="flex items-center gap-1 shrink-0">
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${typeBadgeClass(attendance.type)}`}>
                  {attendance.type === 'MASUK' ? 'Masuk' : 'Pulang'}
                </Badge>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusColor(attendance.status)}`}>
                  {attendance.status}
                </Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground font-mono">{attendance.user?.nip ?? '-'}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {formatTime(attendance.createdAt)}
              </span>
              {distance !== null && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3" />
                  {Math.round(distance)}m
                </span>
              )}
              <span className="flex items-center gap-1">
                <Fingerprint className="size-3" />
                {Math.round(attendance.confidence * 100)}%
              </span>
            </div>
            {/* Late/Early minutes indicators */}
            {(attendance.lateMinutes && attendance.lateMinutes > 0) || (attendance.earlyMinutes && attendance.earlyMinutes > 0) ? (
              <div className="flex items-center gap-2 mt-1">
                {attendance.lateMinutes && attendance.lateMinutes > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    Terlambat {attendance.lateMinutes}m
                  </span>
                )}
                {attendance.earlyMinutes && attendance.earlyMinutes > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                    Pulang Cepat {attendance.earlyMinutes}m
                  </span>
                )}
              </div>
            ) : null}
            {/* Admin Markers */}
            <AdminMarkerBadges attendance={attendance} />
            {/* Thumbnail photo */}
            {attendance.photo && (
              <div className="mt-2">
                <img
                  src={attendance.photo}
                  alt="Foto"
                  className="size-14 rounded-lg object-cover border border-blue-100/50 dark:border-blue-900/30"
                />
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Action buttons */}
      {!attendance.isDeleted && (
        <div className="flex items-center justify-end gap-2 px-4 pb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 h-7 px-2"
          >
            <Pencil className="size-3 mr-1" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-7 px-2"
          >
            <Trash2 className="size-3 mr-1" />
            Hapus
          </Button>
        </div>
      )}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function AttendanceMonitoring() {
  // Data state
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [officeSetting, setOfficeSetting] = useState<OfficeSetting | null>(null)

  // Filter state — date range
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

  const [startDate, setStartDate] = useState<string>(firstDayOfMonth)
  const [endDate, setEndDate] = useState<string>(lastDayOfMonth)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [searchName, setSearchName] = useState<string>('')
  const [showDeleted, setShowDeleted] = useState(false)

  // Detail dialog
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null)

  // Edit dialog
  const [editAttendance, setEditAttendance] = useState<Attendance | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  // Delete confirmation
  const [deleteAttendance, setDeleteAttendance] = useState<Attendance | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Manual attendance dialog
  const [manualDialogOpen, setManualDialogOpen] = useState(false)

  // Auto refresh
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const [limit, setLimit] = useState(10)

  // ---- Fetch office settings ----
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings')
        if (res.ok) {
          const data = await res.json()
          setOfficeSetting(data.setting)
        }
      } catch {
        // Silent fail for settings
      }
    }
    fetchSettings()
  }, [])

  // ---- Fetch attendances ----
  const fetchAttendances = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      if (typeFilter && typeFilter !== 'all') params.set('type', typeFilter)
      if (searchName.trim()) params.set('searchName', searchName.trim())
      if (showDeleted) params.set('showDeleted', 'true')

      const res = await fetch(`/api/attendance?${params.toString()}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Gagal memuat data absensi')
      }

      const data: AttendanceResponse = await res.json()

      setAttendances(data.attendances)
      setTotal(data.total)
      setTotalPages(data.totalPages)
      setLastRefresh(new Date())
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
      toast.error('Gagal memuat data', {
        description: err.message || 'Terjadi kesalahan saat memuat data absensi',
      })
    } finally {
      setIsLoading(false)
    }
  }, [page, startDate, endDate, statusFilter, typeFilter, searchName, showDeleted, limit])

  useEffect(() => {
    fetchAttendances()
  }, [fetchAttendances])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [startDate, endDate, statusFilter, typeFilter, searchName, showDeleted, limit])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      fetchAttendances()
    }, 30000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchAttendances])

  // ---- Delete handler ----
  const handleDelete = async () => {
    if (!deleteAttendance) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/attendance/${deleteAttendance.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal menghapus absensi')
      }

      toast.success('Absensi berhasil dihapus', {
        description: `Admin menghapus absensi ${deleteAttendance.user?.nama ?? ''}`,
      })

      setDeleteDialogOpen(false)
      setDeleteAttendance(null)
      fetchAttendances()
    } catch (err: any) {
      toast.error('Gagal menghapus absensi', {
        description: err.message || 'Terjadi kesalahan',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // ---- Loading state ----
  if (isLoading && attendances.length === 0) return <MonitoringSkeleton />

  // ---- Error state ----
  if (error && attendances.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="size-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <Activity className="size-8 text-red-500" />
        </div>
        <p className="text-lg font-semibold text-foreground">Gagal Memuat Data</p>
        <p className="text-sm text-muted-foreground max-w-md text-center">{error}</p>
        <Button onClick={fetchAttendances} className="bg-[#1e40af] hover:bg-[#1e3a8a]">
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
            Monitoring Absensi
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {formatShortDate(startDate + 'T00:00:00')} — {formatShortDate(endDate + 'T00:00:00')} &bull; Terakhir diperbarui:{' '}
            {lastRefresh.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => setManualDialogOpen(true)}
            size="sm"
            className="bg-[#1e40af] hover:bg-[#1e3a8a] text-white shadow-lg shadow-blue-500/25"
          >
            <PenLine className="size-3.5 mr-1" />
            Absensi Manual
          </Button>
          <Badge className="bg-[#1e40af] hover:bg-[#1e3a8a] text-white px-3 py-1 text-xs shadow-lg shadow-blue-500/25">
            <Activity className="size-3 mr-1" />
            Auto-refresh 30s
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAttendances}
            disabled={isLoading}
            className="border-blue-200 dark:border-blue-800 text-[#2563eb] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            <RefreshCw className={`size-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* ================================================================= */}
      {/* Filters                                                           */}
      {/* ================================================================= */}
      <motion.div variants={itemVariants} className="space-y-3">
        {/* Row 1: Date range + name search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama pegawai..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="pl-9 bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30 focus:border-[#2563eb] dark:focus:border-blue-600"
            />
            {searchName && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 size-7 p-0"
                onClick={() => setSearchName('')}
              >
                <X className="size-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Row 2: Date range + status + type + show deleted */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-9 bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30 focus:border-[#2563eb] dark:focus:border-blue-600 w-full sm:w-auto"
              />
            </div>
            <span className="text-sm text-muted-foreground">s/d</span>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-9 bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30 focus:border-[#2563eb] dark:focus:border-blue-600 w-full sm:w-auto"
              />
            </div>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="HADIR">Hadir</SelectItem>
              <SelectItem value="TELAT">Telat</SelectItem>
              <SelectItem value="PULANG_CEPAT">Pulang Cepat</SelectItem>
              <SelectItem value="IZIN">Izin</SelectItem>
              <SelectItem value="CUTI">Cuti</SelectItem>
              <SelectItem value="ALPHA">Alpha</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-36 bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30">
              <SelectValue placeholder="Semua Tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tipe</SelectItem>
              <SelectItem value="MASUK">Masuk</SelectItem>
              <SelectItem value="PULANG">Pulang</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={showDeleted ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowDeleted(!showDeleted)}
            className={`gap-1.5 ${
              showDeleted
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
            }`}
          >
            {showDeleted ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
            {showDeleted ? 'Sembunyikan Dihapus' : 'Tampilkan Dihapus'}
          </Button>
        </div>
      </motion.div>

      {/* ================================================================= */}
      {/* Desktop Table                                                     */}
      {/* ================================================================= */}
      <motion.div variants={itemVariants} className="hidden md:block">
        <Card className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30 shadow-lg shadow-blue-500/5 overflow-hidden">
          <ScrollArea className="max-h-[calc(100vh-400px)]">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-blue-50/50 dark:bg-blue-900/10">
                  <TableHead>Pegawai</TableHead>
                  <TableHead>NIP</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Terlambat</TableHead>
                  <TableHead className="text-center">P. Cepat</TableHead>
                  <TableHead>Penanda</TableHead>
                  <TableHead className="hidden xl:table-cell">Foto</TableHead>
                  <TableHead className="hidden xl:table-cell">Jarak</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {attendances.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Monitor className="size-10 text-muted-foreground/30" />
                          <p className="text-sm text-muted-foreground">
                            Tidak ada data absensi untuk filter ini
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    attendances.map((att, idx) => {
                      const distance = officeSetting
                        ? haversineDistanceSimple(
                            officeSetting.latitude,
                            officeSetting.longitude,
                            att.latitude,
                            att.longitude
                          )
                        : null

                      return (
                        <motion.tr
                          key={att.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ delay: idx * 0.03, duration: 0.25 }}
                          className={`border-b transition-colors cursor-pointer ${
                            att.isDeleted
                              ? 'border-red-100 dark:border-red-900/20 bg-red-50/20 dark:bg-red-900/5 hover:bg-red-50/40 dark:hover:bg-red-900/10'
                              : 'border-blue-50 dark:border-blue-900/20 hover:bg-blue-50/30 dark:hover:bg-blue-900/10'
                          }`}
                          onClick={() => setSelectedAttendance(att)}
                        >
                          {/* Pegawai */}
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="size-8 ring-1 ring-blue-100 dark:ring-blue-900/40 shrink-0">
                                <AvatarImage src={att.user?.photo ?? undefined} alt={att.user?.nama ?? ''} />
                                <AvatarFallback className="bg-[#1e40af]/10 text-[#1e40af] dark:bg-blue-900/30 dark:text-blue-400 text-[10px] font-bold">
                                  {getInitials(att.user?.nama ?? '??')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium truncate max-w-[140px]">
                                {att.user?.nama ?? 'Unknown'}
                              </span>
                            </div>
                          </TableCell>

                          {/* NIP */}
                          <TableCell>
                            <span className="text-xs font-mono text-muted-foreground">
                              {att.user?.nip ?? '-'}
                            </span>
                          </TableCell>

                          {/* Tipe */}
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] px-2 py-0 ${typeBadgeClass(att.type)}`}>
                              {att.type === 'MASUK' ? 'Masuk' : 'Pulang'}
                            </Badge>
                          </TableCell>

                          {/* Waktu */}
                          <TableCell>
                            <span className="text-sm tabular-nums">{formatTime(att.createdAt)}</span>
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] px-2 py-0 ${statusColor(att.status)}`}>
                              {att.status}
                            </Badge>
                          </TableCell>

                          {/* Terlambat (Late Minutes) */}
                          <TableCell className="text-center">
                            {att.lateMinutes && att.lateMinutes > 0 ? (
                              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                                {att.lateMinutes}m
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>

                          {/* Pulang Cepat (Early Minutes) */}
                          <TableCell className="text-center">
                            {att.earlyMinutes && att.earlyMinutes > 0 ? (
                              <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                                {att.earlyMinutes}m
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>

                          {/* Penanda / Admin markers */}
                          <TableCell>
                            <div className="flex items-center gap-1 flex-wrap">
                              {att.isManual && (
                                <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200 dark:border-teal-800 text-[9px] px-1.5 py-0">
                                  <PenLine className="size-2.5 mr-0.5" />
                                  Manual
                                </Badge>
                              )}
                              {att.editedBy && (
                                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800 text-[9px] px-1.5 py-0">
                                  <Pencil className="size-2.5 mr-0.5" />
                                  Diedit
                                </Badge>
                              )}
                              {att.isDeleted && (
                                <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800 text-[9px] px-1.5 py-0">
                                  <Trash2 className="size-2.5 mr-0.5" />
                                  Dihapus
                                </Badge>
                              )}
                              {att.buktiDukung && (
                                <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 text-[9px] px-1.5 py-0">
                                  <FileCheck className="size-2.5 mr-0.5" />
                                  Bukti
                                </Badge>
                              )}
                            </div>
                          </TableCell>

                          {/* Foto thumbnail */}
                          <TableCell className="hidden xl:table-cell">
                            {att.photo ? (
                              <img
                                src={att.photo}
                                alt="Foto"
                                className="size-9 rounded-lg object-cover border border-blue-100/50 dark:border-blue-900/30"
                              />
                            ) : (
                              <div className="size-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                <ImageIcon className="size-4 text-muted-foreground/40" />
                              </div>
                            )}
                          </TableCell>

                          {/* Jarak */}
                          <TableCell className="hidden xl:table-cell">
                            {distance !== null ? (
                              <span className="text-xs text-muted-foreground tabular-nums">
                                {Math.round(distance)}m
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>

                          {/* Aksi */}
                          <TableCell className="text-center">
                            {!att.isDeleted ? (
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEditAttendance(att)
                                    setEditDialogOpen(true)
                                  }}
                                  className="size-7 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                  title="Edit absensi"
                                >
                                  <Pencil className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setDeleteAttendance(att)
                                    setDeleteDialogOpen(true)
                                  }}
                                  className="size-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  title="Hapus absensi"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <Badge className="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-[9px] px-2 py-0">
                                Dihapus
                              </Badge>
                            )}
                          </TableCell>
                        </motion.tr>
                      )
                    })
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>
      </motion.div>

      {/* ================================================================= */}
      {/* Mobile Cards                                                      */}
      {/* ================================================================= */}
      <motion.div variants={itemVariants} className="md:hidden space-y-3">
        {attendances.length === 0 ? (
          <Card className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30">
            <CardContent className="py-16 flex flex-col items-center space-y-2">
              <Monitor className="size-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Tidak ada data absensi untuk filter ini
              </p>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence mode="popLayout">
            {attendances.map((att) => (
              <AttendanceCard
                key={att.id}
                attendance={att}
                onClick={() => setSelectedAttendance(att)}
                officeSetting={officeSetting}
                onEdit={(e) => {
                  e.stopPropagation()
                  setEditAttendance(att)
                  setEditDialogOpen(true)
                }}
                onDelete={(e) => {
                  e.stopPropagation()
                  setDeleteAttendance(att)
                  setDeleteDialogOpen(true)
                }}
              />
            ))}
          </AnimatePresence>
        )}
      </motion.div>

      {/* ================================================================= */}
      {/* Pagination                                                        */}
      {/* ================================================================= */}
      <motion.div variants={itemVariants}>
        <DataPagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit)
            setPage(1)
          }}
          isLoading={isLoading}
          itemLabel="absensi"
        />
      </motion.div>

      {/* ================================================================= */}
      {/* Detail Dialog                                                     */}
      {/* ================================================================= */}
      <AttendanceDetailDialog
        attendance={selectedAttendance}
        open={!!selectedAttendance}
        onOpenChange={(open) => !open && setSelectedAttendance(null)}
        officeSetting={officeSetting}
      />

      {/* ================================================================= */}
      {/* Edit Dialog                                                       */}
      {/* ================================================================= */}
      <EditAttendanceDialog
        attendance={editAttendance}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={fetchAttendances}
      />

      {/* ================================================================= */}
      {/* Delete Confirmation Dialog                                        */}
      {/* ================================================================= */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white dark:bg-gray-900 border-blue-100/50 dark:border-blue-900/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1e40af] dark:text-blue-300 flex items-center gap-2">
              <Trash2 className="size-5" />
              Hapus Absensi
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              {deleteAttendance && (
                <>
                  Anda akan menghapus absensi <strong>{deleteAttendance.user?.nama ?? ''}</strong> pada{' '}
                  <strong>{formatShortDate(deleteAttendance.createdAt)}</strong> ({deleteAttendance.type === 'MASUK' ? 'Masuk' : 'Pulang'} — {deleteAttendance.status}).
                  <br />
                  <br />
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    Data akan ditandai sebagai &quot;dihapus&quot; dan tercatat atas nama admin yang menghapus.
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-blue-200 dark:border-blue-800">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Menghapus...' : (
                <>
                  <Trash2 className="size-4 mr-1.5" />
                  Ya, Hapus
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ================================================================= */}
      {/* Manual Attendance Dialog                                          */}
      {/* ================================================================= */}
      <ManualAttendanceDialog
        open={manualDialogOpen}
        onOpenChange={setManualDialogOpen}
        onSuccess={fetchAttendances}
      />
    </motion.div>
  )
}
