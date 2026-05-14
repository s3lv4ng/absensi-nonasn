'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Tag, Plus, Pencil, Trash2, CheckCircle2, XCircle, Loader2, Palette, RefreshCw, Eye, EyeOff,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

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
// Types
// ---------------------------------------------------------------------------

interface LeaveTypeCategory {
  id: string
  name: string
  code: string
  description: string | null
  color: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface LeaveTypeFormData {
  name: string
  code: string
  description: string
  color: string
  isActive: boolean
}

const emptyForm: LeaveTypeFormData = {
  name: '',
  code: '',
  description: '',
  color: '#1e40af',
  isActive: true,
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function LeaveTypeSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30">
            <CardContent className="p-4 flex items-center gap-3">
              <Skeleton className="size-10 rounded-xl" />
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-10" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table skeleton */}
      <Card className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30">
        <CardContent className="p-0">
          <div className="space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-blue-50 dark:border-blue-900/20">
                <Skeleton className="size-9 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="size-6 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Mobile Card
// ---------------------------------------------------------------------------

function LeaveTypeMobileCard({
  leaveType,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  leaveType: LeaveTypeCategory
  onEdit: (lt: LeaveTypeCategory) => void
  onDelete: (lt: LeaveTypeCategory) => void
  onToggleActive: (lt: LeaveTypeCategory) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="relative rounded-xl border border-blue-100/50 dark:border-blue-900/30 bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl shadow-sm overflow-hidden"
    >
      {/* Color accent left border */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: leaveType.color }}
      />

      <div className="p-4 pl-5 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="size-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: leaveType.color + '1a' }}
            >
              <Tag className="size-4" style={{ color: leaveType.color }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{leaveType.name}</p>
              <p className="text-xs text-muted-foreground font-mono">{leaveType.code}</p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 shrink-0 ${
              leaveType.isActive
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
                : 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
            }`}
          >
            {leaveType.isActive ? 'Aktif' : 'Nonaktif'}
          </Badge>
        </div>

        {/* Description */}
        {leaveType.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{leaveType.description}</p>
        )}

        {/* Color indicator */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Palette className="size-3" />
          <span>Warna:</span>
          <div
            className="size-4 rounded-full border border-white dark:border-gray-800 shadow-sm ring-1 ring-black/10"
            style={{ backgroundColor: leaveType.color }}
          />
          <span className="font-mono text-[10px]">{leaveType.color}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1 border-t border-blue-50 dark:border-blue-900/20">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs border-blue-200 dark:border-blue-800 text-[#2563eb] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            onClick={() => onEdit(leaveType)}
          >
            <Pencil className="size-3 mr-1" /> Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={`h-8 px-3 text-xs ${
              leaveType.isActive
                ? 'border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                : 'border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
            }`}
            onClick={() => onToggleActive(leaveType)}
          >
            {leaveType.isActive ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={() => onDelete(leaveType)}
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function LeaveTypeManagement() {
  // Data state
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pagination state
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLeaveType, setEditingLeaveType] = useState<LeaveTypeCategory | null>(null)
  const [formData, setFormData] = useState<LeaveTypeFormData>(emptyForm)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<LeaveTypeCategory | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // ---- Fetch leave types ----
  const fetchLeaveTypes = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))

      const res = await fetch(`/api/leave-types?${params.toString()}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Gagal memuat data tipe cuti/izin')
      }

      const data = await res.json()
      setLeaveTypes(data.leaveTypes || [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan'
      setError(message)
      toast.error('Gagal memuat data', {
        description: message,
      })
    } finally {
      setIsLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchLeaveTypes()
  }, [fetchLeaveTypes])

  // ---- Computed stats ----
  const totalCount = leaveTypes.length
  const activeCount = leaveTypes.filter((lt) => lt.isActive).length
  const inactiveCount = totalCount - activeCount

  // ---- Create / Update ----
  const handleOpenCreate = () => {
    setEditingLeaveType(null)
    setFormData(emptyForm)
    setDialogOpen(true)
  }

  const handleOpenEdit = (lt: LeaveTypeCategory) => {
    setEditingLeaveType(lt)
    setFormData({
      name: lt.name,
      code: lt.code,
      description: lt.description || '',
      color: lt.color,
      isActive: lt.isActive,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Data tidak lengkap', {
        description: 'Nama tipe cuti/izin wajib diisi',
      })
      return
    }

    if (!formData.code.trim()) {
      toast.error('Data tidak lengkap', {
        description: 'Kode tipe cuti/izin wajib diisi',
      })
      return
    }

    // Validate code format (uppercase letters, numbers, underscores)
    const codePattern = /^[A-Z0-9_]+$/
    if (!codePattern.test(formData.code)) {
      toast.error('Kode tidak valid', {
        description: 'Kode hanya boleh berisi huruf besar, angka, dan underscore (_)',
      })
      return
    }

    try {
      setIsSubmitting(true)

      if (editingLeaveType) {
        // Update
        const res = await fetch('/api/leave-types', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingLeaveType.id,
            name: formData.name.trim(),
            code: formData.code.trim(),
            description: formData.description.trim() || null,
            color: formData.color,
            isActive: formData.isActive,
          }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || 'Gagal mengupdate tipe cuti/izin')
        }

        toast.success('Berhasil diperbarui', {
          description: `Tipe "${formData.name}" berhasil diperbarui`,
        })
      } else {
        // Create
        const res = await fetch('/api/leave-types', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim(),
            code: formData.code.trim(),
            description: formData.description.trim() || null,
            color: formData.color,
          }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || 'Gagal menambah tipe cuti/izin')
        }

        toast.success('Berhasil ditambahkan', {
          description: `Tipe "${formData.name}" berhasil ditambahkan`,
        })
      }

      setDialogOpen(false)
      fetchLeaveTypes()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan'
      toast.error('Gagal menyimpan', {
        description: message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ---- Delete ----
  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setIsDeleting(true)
      const res = await fetch(`/api/leave-types?id=${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Gagal menghapus tipe cuti/izin')
      }
      toast.success('Berhasil dihapus', {
        description: `Tipe "${deleteTarget.name}" telah dihapus`,
      })
      setDeleteTarget(null)
      fetchLeaveTypes()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan'
      toast.error('Gagal menghapus', {
        description: message,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // ---- Toggle active ----
  const handleToggleActive = async (lt: LeaveTypeCategory) => {
    try {
      const res = await fetch('/api/leave-types', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: lt.id,
          isActive: !lt.isActive,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Gagal mengubah status')
      }
      toast.success('Status diubah', {
        description: `"${lt.name}" ${!lt.isActive ? 'diaktifkan' : 'dinonaktifkan'}`,
      })
      fetchLeaveTypes()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan'
      toast.error('Gagal mengubah status', {
        description: message,
      })
    }
  }

  // ---- Loading state ----
  if (isLoading && leaveTypes.length === 0) return <LeaveTypeSkeleton />

  // ---- Error state ----
  if (error && leaveTypes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="size-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <XCircle className="size-8 text-red-500" />
        </div>
        <p className="text-lg font-semibold text-foreground">Gagal Memuat Data</p>
        <p className="text-sm text-muted-foreground max-w-md text-center">{error}</p>
        <Button onClick={fetchLeaveTypes} className="bg-[#1e40af] hover:bg-[#1e3a8a]">
          <RefreshCw className="size-4 mr-1.5" />
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
      {/* =================================================================== */}
      {/* Header                                                              */}
      {/* =================================================================== */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1e3a8a] dark:text-blue-300 tracking-tight flex items-center gap-2">
            <Tag className="size-7" />
            Tipe Cuti / Izin
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kelola kategori tipe pengajuan cuti, izin, dan lainnya
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLeaveTypes}
            className="border-blue-200 dark:border-blue-800 text-[#2563eb] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            <RefreshCw className={`size-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleOpenCreate}
            className="bg-[#1e40af] hover:bg-[#1e3a8a] text-white shadow-lg shadow-blue-500/25"
          >
            <Plus className="size-4 mr-1.5" />
            Tambah Tipe
          </Button>
        </div>
      </motion.div>

      {/* =================================================================== */}
      {/* Stats Row                                                           */}
      {/* =================================================================== */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total */}
        <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-blue-100/50 dark:border-blue-900/30 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-xl bg-[#1e40af]/10 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              <Tag className="size-5 text-[#1e40af] dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Tipe</p>
              <p className="text-2xl font-bold text-[#1e3a8a] dark:text-blue-300 tabular-nums">{totalCount}</p>
            </div>
          </CardContent>
        </Card>

        {/* Active */}
        <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-blue-100/50 dark:border-blue-900/30 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
              <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Aktif</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{activeCount}</p>
            </div>
          </CardContent>
        </Card>

        {/* Inactive */}
        <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-blue-100/50 dark:border-blue-900/30 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center shrink-0">
              <XCircle className="size-5 text-red-500 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Nonaktif</p>
              <p className="text-2xl font-bold text-red-500 dark:text-red-400 tabular-nums">{inactiveCount}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* =================================================================== */}
      {/* Desktop Table                                                       */}
      {/* =================================================================== */}
      <motion.div variants={itemVariants} className="hidden md:block">
        <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-blue-100/50 dark:border-blue-900/30 shadow-lg shadow-blue-500/5 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-[#1e3a8a] dark:text-blue-300 flex items-center gap-2">
              <Tag className="size-5" />
              Daftar Tipe Cuti / Izin
            </CardTitle>
            <CardDescription>
              Kategori tipe untuk pengajuan cuti, izin, sakit, dinas, dan lainnya
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[calc(100vh-420px)]">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-blue-50/50 dark:bg-blue-900/10">
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Kode</TableHead>
                    <TableHead className="hidden lg:table-cell">Deskripsi</TableHead>
                    <TableHead className="text-center">Warna</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {leaveTypes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-32 text-center">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <Tag className="size-10 text-muted-foreground/30" />
                            <p className="text-sm text-muted-foreground">
                              Belum ada tipe cuti/izin terdaftar
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Tambahkan kategori baru untuk pengajuan cuti dan izin
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleOpenCreate}
                              className="mt-2 border-blue-200 dark:border-blue-800 text-[#2563eb] dark:text-blue-400"
                            >
                              <Plus className="size-3.5 mr-1" /> Tambah Tipe
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      leaveTypes.map((lt, idx) => (
                        <motion.tr
                          key={lt.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ delay: idx * 0.03, duration: 0.25 }}
                          className="border-b border-blue-50 dark:border-blue-900/20 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors"
                        >
                          {/* Color indicator icon */}
                          <TableCell>
                            <div
                              className="size-9 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: lt.color + '1a' }}
                            >
                              <Tag className="size-4" style={{ color: lt.color }} />
                            </div>
                          </TableCell>

                          {/* Nama */}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground">{lt.name}</span>
                              {/* Color accent left bar inline */}
                              <div
                                className="w-0.5 h-4 rounded-full shrink-0"
                                style={{ backgroundColor: lt.color }}
                              />
                            </div>
                          </TableCell>

                          {/* Kode */}
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="text-[10px] font-mono px-2 py-0 bg-blue-50/50 text-[#1e40af] dark:bg-blue-900/30 dark:text-blue-300 border-blue-200/50 dark:border-blue-800/50"
                            >
                              {lt.code}
                            </Badge>
                          </TableCell>

                          {/* Deskripsi */}
                          <TableCell className="hidden lg:table-cell">
                            <span className="text-xs text-muted-foreground line-clamp-1 max-w-[250px] block">
                              {lt.description || '-'}
                            </span>
                          </TableCell>

                          {/* Warna */}
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <div
                                className="size-5 rounded-full border-2 border-white dark:border-gray-800 shadow-sm ring-1 ring-black/10"
                                style={{ backgroundColor: lt.color }}
                              />
                              <span className="text-[10px] font-mono text-muted-foreground hidden xl:inline">
                                {lt.color}
                              </span>
                            </div>
                          </TableCell>

                          {/* Status */}
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-2 py-0 ${
                                lt.isActive
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
                                  : 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                              }`}
                            >
                              {lt.isActive ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                          </TableCell>

                          {/* Aksi */}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-[#2563eb] dark:text-blue-400"
                                onClick={() => handleOpenEdit(lt)}
                                title="Edit"
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-8 w-8 p-0 ${
                                  lt.isActive
                                    ? 'hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-500'
                                    : 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-500'
                                }`}
                                onClick={() => handleToggleActive(lt)}
                                title={lt.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                              >
                                {lt.isActive ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                                onClick={() => setDeleteTarget(lt)}
                                title="Hapus"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>

      {/* =================================================================== */}
      {/* Mobile Cards                                                        */}
      {/* =================================================================== */}
      <motion.div variants={itemVariants} className="md:hidden space-y-3">
        {leaveTypes.length === 0 ? (
          <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-blue-100/50 dark:border-blue-900/30">
            <CardContent className="py-16 flex flex-col items-center space-y-2">
              <Tag className="size-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Belum ada tipe cuti/izin terdaftar</p>
              <p className="text-xs text-muted-foreground">
                Tambahkan kategori baru untuk pengajuan cuti dan izin
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenCreate}
                className="mt-2 border-blue-200 dark:border-blue-800 text-[#2563eb] dark:text-blue-400"
              >
                <Plus className="size-3.5 mr-1" /> Tambah Tipe
              </Button>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence mode="popLayout">
            {leaveTypes.map((lt) => (
              <LeaveTypeMobileCard
                key={lt.id}
                leaveType={lt}
                onEdit={handleOpenEdit}
                onDelete={setDeleteTarget}
                onToggleActive={handleToggleActive}
              />
            ))}
          </AnimatePresence>
        )}
      </motion.div>

      {/* =================================================================== */}
      {/* Pagination                                                          */}
      {/* =================================================================== */}
      {totalPages > 1 && (
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

      {/* =================================================================== */}
      {/* Add / Edit Dialog                                                   */}
      {/* =================================================================== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-900 border-blue-100/50 dark:border-blue-900/30">
          <DialogHeader>
            <DialogTitle className="text-[#1e40af] dark:text-blue-300 flex items-center gap-2">
              <Tag className="size-5" />
              {editingLeaveType ? 'Edit Tipe Cuti / Izin' : 'Tambah Tipe Cuti / Izin'}
            </DialogTitle>
            <DialogDescription>
              {editingLeaveType
                ? 'Perbarui informasi tipe cuti/izin di bawah ini.'
                : 'Isi data tipe cuti/izin baru untuk ditambahkan ke sistem.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-4 max-h-[65vh] overflow-y-auto pr-2">
            {/* Nama */}
            <div className="grid gap-2">
              <Label htmlFor="ltName" className="text-sm font-medium">
                Nama <span className="text-red-500">*</span>
              </Label>
              <Input
                id="ltName"
                value={formData.name}
                onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                placeholder="contoh: Cuti Tahunan"
                className="bg-white dark:bg-gray-800 border-blue-100/50 dark:border-blue-900/30"
              />
              <p className="text-[10px] text-muted-foreground">
                Nama tampilan yang akan terlihat oleh pengguna
              </p>
            </div>

            {/* Kode */}
            <div className="grid gap-2">
              <Label htmlFor="ltCode" className="text-sm font-medium">
                Kode <span className="text-red-500">*</span>
              </Label>
              <Input
                id="ltCode"
                value={formData.code}
                onChange={(e) => {
                  // Auto-uppercase and filter valid characters
                  const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '')
                  setFormData((f) => ({ ...f, code: raw }))
                }}
                placeholder="contoh: CUTI_TAHUNAN"
                className="bg-white dark:bg-gray-800 border-blue-100/50 dark:border-blue-900/30 font-mono uppercase"
                disabled={!!editingLeaveType}
              />
              <p className="text-[10px] text-muted-foreground">
                {editingLeaveType
                  ? 'Kode tidak dapat diubah setelah dibuat'
                  : 'Identifier unik (huruf besar, angka, underscore). Contoh: IZIN_PRIBADI, CUTI_TAHUNAN'}
              </p>
            </div>

            {/* Deskripsi */}
            <div className="grid gap-2">
              <Label htmlFor="ltDesc" className="text-sm font-medium">
                Deskripsi
              </Label>
              <Textarea
                id="ltDesc"
                value={formData.description}
                onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                placeholder="contoh: Cuti tahunan yang diberikan setiap tahun"
                rows={3}
                className="bg-white dark:bg-gray-800 border-blue-100/50 dark:border-blue-900/30 resize-none"
              />
            </div>

            {/* Warna */}
            <div className="grid gap-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Palette className="size-3.5" />
                Warna
              </Label>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData((f) => ({ ...f, color: e.target.value }))}
                    className="size-10 rounded-lg border-2 border-blue-100/50 dark:border-blue-900/30 cursor-pointer appearance-none bg-transparent [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none [&::-moz-color-swatch]:rounded-md [&::-moz-color-swatch]:border-none"
                  />
                </div>
                <div className="flex-1">
                  <Input
                    value={formData.color}
                    onChange={(e) => {
                      const val = e.target.value
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                        setFormData((f) => ({ ...f, color: val }))
                      }
                    }}
                    placeholder="#1e40af"
                    className="font-mono text-sm bg-white dark:bg-gray-800 border-blue-100/50 dark:border-blue-900/30 h-10"
                    maxLength={7}
                  />
                </div>
                {/* Preview */}
                <div className="flex items-center gap-2">
                  <div
                    className="size-8 rounded-lg shadow-sm ring-1 ring-black/10"
                    style={{ backgroundColor: formData.color }}
                  />
                </div>
              </div>
              {/* Color presets */}
              <div className="flex gap-1.5 mt-1">
                {[
                  '#1e40af', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#be185d', '#4338ca',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setFormData((f) => ({ ...f, color: preset }))}
                    className={`size-6 rounded-full border-2 transition-all hover:scale-110 ${
                      formData.color === preset
                        ? 'border-foreground scale-110 ring-2 ring-foreground/20'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: preset }}
                    title={preset}
                  />
                ))}
              </div>
            </div>

            {/* Status (only for edit) */}
            {editingLeaveType && (
              <div className="grid gap-2">
                <Label className="text-sm font-medium">Status</Label>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100/50 dark:border-blue-900/30">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData((f) => ({ ...f, isActive: checked }))}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {formData.isActive ? 'Aktif' : 'Nonaktif'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formData.isActive
                        ? 'Tipe ini dapat digunakan dalam pengajuan'
                        : 'Tipe ini tidak akan muncul di pilihan pengajuan'}
                    </p>
                  </div>
                  {formData.isActive ? (
                    <CheckCircle2 className="size-5 text-emerald-500" />
                  ) : (
                    <XCircle className="size-5 text-red-400" />
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-blue-200 dark:border-blue-800"
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-[#1e40af] hover:bg-[#1e3a8a] text-white shadow-lg shadow-blue-500/25"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Menyimpan...
                </span>
              ) : (
                <>
                  <Tag className="size-4 mr-1.5" />
                  {editingLeaveType ? 'Simpan Perubahan' : 'Tambah Tipe'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =================================================================== */}
      {/* Delete Confirmation                                                 */}
      {/* =================================================================== */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-white dark:bg-gray-900 border-blue-100/50 dark:border-blue-900/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="size-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <Trash2 className="size-5 text-red-500" />
              </div>
              Hapus Tipe Cuti / Izin
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus tipe <strong>&quot;{deleteTarget?.name}&quot;</strong>{' '}
              <span className="font-mono text-xs">({deleteTarget?.code})</span>?
              Tindakan ini tidak dapat dibatalkan dan dapat mempengaruhi pengajuan yang menggunakan tipe ini.
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
              {isDeleting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Menghapus...
                </span>
              ) : (
                'Hapus'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
