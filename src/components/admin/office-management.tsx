'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  AlertCircle,
  Building2,
  Power,
  PowerOff,
  Navigation,
  MapPinned,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

import type { Office } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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

interface OfficeFormData {
  name: string
  address: string
  latitude: number
  longitude: number
  radiusMeter: number
}

const emptyForm: OfficeFormData = {
  name: '',
  address: '',
  latitude: -6.2088,
  longitude: 106.8456,
  radiusMeter: 100,
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function OfficeSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <Card className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl">
        <CardContent className="p-0">
          <div className="space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-blue-50 dark:border-blue-900/20">
                <Skeleton className="size-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
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
// Map Preview SVG
// ---------------------------------------------------------------------------

function MapPreview({ latitude, longitude, radius }: { latitude: number; longitude: number; radius: number }) {
  const mapCenter = { x: 200, y: 140 }
  const visualRadius = Math.min(Math.max(radius * 0.5, 20), 120)

  return (
    <div className="rounded-xl overflow-hidden border border-blue-100/50 dark:border-blue-900/30 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20">
      <svg viewBox="0 0 400 280" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="office-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e40af" strokeWidth="0.3" opacity="0.12" />
          </pattern>
          <radialGradient id="radius-fill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.04" />
          </radialGradient>
        </defs>
        <rect width="400" height="280" fill="url(#office-grid)" />

        {/* Decorative roads */}
        <line x1="0" y1={mapCenter.y} x2="400" y2={mapCenter.y} stroke="#1e40af" strokeWidth="0.5" opacity="0.08" />
        <line x1={mapCenter.x} y1="0" x2={mapCenter.x} y2="280" stroke="#1e40af" strokeWidth="0.5" opacity="0.08" />

        {/* Radius circle fill */}
        <circle
          cx={mapCenter.x}
          cy={mapCenter.y}
          r={visualRadius}
          fill="url(#radius-fill)"
        />

        {/* Radius circle stroke */}
        <circle
          cx={mapCenter.x}
          cy={mapCenter.y}
          r={visualRadius}
          fill="none"
          stroke="#2563eb"
          strokeWidth="1.5"
          strokeDasharray="6 3"
          opacity="0.5"
        />

        {/* Pulse animation */}
        <circle
          cx={mapCenter.x}
          cy={mapCenter.y}
          r="6"
          fill="none"
          stroke="#1e40af"
          strokeWidth="1.5"
          opacity="0.4"
        >
          <animate attributeName="r" from="6" to={Math.min(visualRadius * 0.4, 30)} dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite" />
        </circle>

        {/* Center pin */}
        <circle cx={mapCenter.x} cy={mapCenter.y} r="8" fill="#1e40af" opacity="0.9" />
        <circle cx={mapCenter.x} cy={mapCenter.y} r="4" fill="white" />
        <circle cx={mapCenter.x} cy={mapCenter.y} r="2" fill="#1e40af" />

        {/* Labels */}
        <text x={mapCenter.x + 14} y={mapCenter.y - 6} fontSize="9" fill="#1e40af" fontWeight="600" opacity="0.8">
          Kantor
        </text>
        <text x={mapCenter.x + 14} y={mapCenter.y + 6} fontSize="7" fill="#1e40af" opacity="0.5">
          {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </text>

        {/* Radius label */}
        <line
          x1={mapCenter.x}
          y1={mapCenter.y}
          x2={mapCenter.x + visualRadius}
          y2={mapCenter.y}
          stroke="#2563eb"
          strokeWidth="0.8"
          strokeDasharray="3 2"
          opacity="0.4"
        />
        <text
          x={mapCenter.x + visualRadius / 2}
          y={mapCenter.y - 8}
          fontSize="8"
          fill="#2563eb"
          fontWeight="500"
          textAnchor="middle"
          opacity="0.7"
        >
          {radius}m
        </text>

        {/* Decorative dots */}
        {[
          { x: 60, y: 70 },
          { x: 330, y: 60 },
          { x: 50, y: 200 },
          { x: 350, y: 210 },
          { x: 130, y: 50 },
          { x: 280, y: 230 },
        ].map((dot, i) => (
          <circle key={i} cx={dot.x} cy={dot.y} r="2" fill="#1e40af" opacity="0.15" />
        ))}
      </svg>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Office Card (mobile view)
// ---------------------------------------------------------------------------

function OfficeCard({
  office,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  office: Office
  onEdit: (office: Office) => void
  onToggleActive: (office: Office) => void
  onDelete: (office: Office) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-xl border border-blue-100/50 dark:border-blue-900/30 bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl p-4 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className="size-11 rounded-xl bg-[#1e40af]/10 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
          <Building2 className="size-5 text-[#1e40af] dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground truncate">{office.name}</p>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 shrink-0 ${
                office.isActive
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
                  : 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
              }`}
            >
              {office.isActive ? 'Aktif' : 'Nonaktif'}
            </Badge>
          </div>
          {office.address && (
            <p className="text-xs text-muted-foreground truncate">{office.address}</p>
          )}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Navigation className="size-3 text-[#2563eb]" />
            <span className="tabular-nums">{office.latitude.toFixed(6)}, {office.longitude.toFixed(6)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPinned className="size-3 text-[#2563eb]" />
            <span>Radius: {office.radiusMeter}m</span>
          </div>
        </div>
      </div>
      <Separator className="my-3 bg-blue-50 dark:bg-blue-900/20" />
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-8 text-xs border-blue-200 dark:border-blue-800 text-[#2563eb] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          onClick={() => onEdit(office)}
        >
          <Pencil className="size-3 mr-1" /> Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={`h-8 px-3 text-xs ${
            office.isActive
              ? 'border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
              : 'border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
          }`}
          onClick={() => onToggleActive(office)}
        >
          {office.isActive ? <PowerOff className="size-3" /> : <Power className="size-3" />}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 text-xs border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          onClick={() => onDelete(office)}
        >
          <Trash2 className="size-3" />
        </Button>
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function OfficeManagement() {
  // Data state
  const [offices, setOffices] = useState<Office[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pagination state
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingOffice, setEditingOffice] = useState<Office | null>(null)
  const [formData, setFormData] = useState<OfficeFormData>(emptyForm)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Office | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // ---- Fetch offices ----
  const fetchOffices = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))

      const res = await fetch(`/api/offices?${params.toString()}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Gagal memuat data lokasi kantor')
      }

      const data = await res.json()
      setOffices(data.offices || [])
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
    fetchOffices()
  }, [fetchOffices])

  // ---- Create / Update office ----
  const handleOpenCreate = () => {
    setEditingOffice(null)
    setFormData(emptyForm)
    setDialogOpen(true)
  }

  const handleOpenEdit = (office: Office) => {
    setEditingOffice(office)
    setFormData({
      name: office.name,
      address: office.address || '',
      latitude: office.latitude,
      longitude: office.longitude,
      radiusMeter: office.radiusMeter,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error('Data tidak lengkap', {
        description: 'Nama lokasi wajib diisi',
      })
      return
    }

    try {
      setIsSubmitting(true)

      if (editingOffice) {
        // Update
        const res = await fetch('/api/offices', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingOffice.id,
            name: formData.name,
            address: formData.address || null,
            latitude: formData.latitude,
            longitude: formData.longitude,
            radiusMeter: formData.radiusMeter,
          }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || 'Gagal mengupdate lokasi kantor')
        }

        toast.success('Berhasil diperbarui', {
          description: `Lokasi "${formData.name}" berhasil diperbarui`,
        })
      } else {
        // Create
        const res = await fetch('/api/offices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            address: formData.address || null,
            latitude: formData.latitude,
            longitude: formData.longitude,
            radiusMeter: formData.radiusMeter,
          }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || 'Gagal menambah lokasi kantor')
        }

        toast.success('Berhasil ditambahkan', {
          description: `Lokasi "${formData.name}" berhasil ditambahkan`,
        })
      }

      setDialogOpen(false)
      fetchOffices()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan'
      toast.error('Gagal menyimpan', {
        description: message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ---- Delete office ----
  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setIsDeleting(true)
      const res = await fetch(`/api/offices?id=${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Gagal menghapus lokasi kantor')
      }
      toast.success('Berhasil dihapus', {
        description: `Lokasi "${deleteTarget.name}" telah dihapus`,
      })
      setDeleteTarget(null)
      fetchOffices()
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
  const handleToggleActive = async (office: Office) => {
    try {
      const res = await fetch('/api/offices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: office.id,
          isActive: !office.isActive,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Gagal mengubah status')
      }
      toast.success('Status diubah', {
        description: `"${office.name}" ${!office.isActive ? 'diaktifkan' : 'dinonaktifkan'}`,
      })
      fetchOffices()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan'
      toast.error('Gagal mengubah status', {
        description: message,
      })
    }
  }

  // ---- Loading state ----
  if (isLoading && offices.length === 0) return <OfficeSkeleton />

  // ---- Error state ----
  if (error && offices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="size-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <AlertCircle className="size-8 text-red-500" />
        </div>
        <p className="text-lg font-semibold text-foreground">Gagal Memuat Data</p>
        <p className="text-sm text-muted-foreground max-w-md text-center">{error}</p>
        <Button onClick={fetchOffices} className="bg-[#1e40af] hover:bg-[#1e3a8a]">
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
      {/* ================================================================= */}
      {/* Header                                                            */}
      {/* ================================================================= */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1e40af] dark:text-blue-300 tracking-tight flex items-center gap-2">
            <MapPin className="size-7" />
            Lokasi Kantor
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {offices.length} lokasi kantor terdaftar
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-[#1e40af] hover:bg-[#1e3a8a] text-white shadow-lg shadow-blue-500/25"
        >
          <Plus className="size-4 mr-1.5" />
          Tambah Lokasi
        </Button>
      </motion.div>

      {/* ================================================================= */}
      {/* Desktop Table                                                     */}
      {/* ================================================================= */}
      <motion.div variants={itemVariants} className="hidden md:block">
        <Card className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30 shadow-lg shadow-blue-500/5 overflow-hidden">
          <ScrollArea className="max-h-[calc(100vh-300px)]">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-blue-50/50 dark:bg-blue-900/10">
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead className="hidden lg:table-cell">Alamat</TableHead>
                  <TableHead>Latitude</TableHead>
                  <TableHead>Longitude</TableHead>
                  <TableHead className="text-center">Radius (m)</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {offices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Building2 className="size-10 text-muted-foreground/30" />
                          <p className="text-sm text-muted-foreground">
                            Belum ada lokasi kantor terdaftar
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleOpenCreate}
                            className="mt-2 border-blue-200 dark:border-blue-800 text-[#2563eb] dark:text-blue-400"
                          >
                            <Plus className="size-3.5 mr-1" /> Tambah Lokasi
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    offices.map((office, idx) => (
                      <motion.tr
                        key={office.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ delay: idx * 0.03, duration: 0.25 }}
                        className="border-b border-blue-50 dark:border-blue-900/20 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors"
                      >
                        {/* Icon */}
                        <TableCell>
                          <div className="size-9 rounded-xl bg-[#1e40af]/10 dark:bg-blue-900/30 flex items-center justify-center">
                            <Building2 className="size-4 text-[#1e40af] dark:text-blue-400" />
                          </div>
                        </TableCell>

                        {/* Nama */}
                        <TableCell>
                          <span className="text-sm font-medium text-foreground">{office.name}</span>
                        </TableCell>

                        {/* Alamat */}
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-xs text-muted-foreground truncate max-w-[200px] block">
                            {office.address || '-'}
                          </span>
                        </TableCell>

                        {/* Latitude */}
                        <TableCell>
                          <span className="text-xs font-mono text-muted-foreground tabular-nums">
                            {office.latitude.toFixed(6)}
                          </span>
                        </TableCell>

                        {/* Longitude */}
                        <TableCell>
                          <span className="text-xs font-mono text-muted-foreground tabular-nums">
                            {office.longitude.toFixed(6)}
                          </span>
                        </TableCell>

                        {/* Radius */}
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-[10px] px-2 py-0 bg-[#1e40af]/10 text-[#1e40af] dark:bg-blue-900/30 dark:text-blue-300 border-[#1e40af]/20">
                            {office.radiusMeter}m
                          </Badge>
                        </TableCell>

                        {/* Status */}
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-2 py-0 ${
                              office.isActive
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
                                : 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                            }`}
                          >
                            {office.isActive ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              >
                                <span className="sr-only">Buka menu</span>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-muted-foreground">
                                  <circle cx="8" cy="3" r="1.5" />
                                  <circle cx="8" cy="8" r="1.5" />
                                  <circle cx="8" cy="13" r="1.5" />
                                </svg>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() => handleOpenEdit(office)}
                                className="cursor-pointer text-[#2563eb] dark:text-blue-400"
                              >
                                <Pencil className="size-3.5 mr-2" />
                                Edit Lokasi
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleToggleActive(office)}
                                className="cursor-pointer"
                              >
                                {office.isActive ? (
                                  <>
                                    <PowerOff className="size-3.5 mr-2 text-amber-500" />
                                    <span className="text-amber-600 dark:text-amber-400">Nonaktifkan</span>
                                  </>
                                ) : (
                                  <>
                                    <Power className="size-3.5 mr-2 text-emerald-500" />
                                    <span className="text-emerald-600 dark:text-emerald-400">Aktifkan</span>
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeleteTarget(office)}
                                className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                              >
                                <Trash2 className="size-3.5 mr-2" />
                                Hapus Lokasi
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    ))
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
        {offices.length === 0 ? (
          <Card className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30">
            <CardContent className="py-16 flex flex-col items-center space-y-2">
              <Building2 className="size-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Belum ada lokasi kantor terdaftar</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenCreate}
                className="mt-2 border-blue-200 dark:border-blue-800 text-[#2563eb] dark:text-blue-400"
              >
                <Plus className="size-3.5 mr-1" /> Tambah Lokasi
              </Button>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence mode="popLayout">
            {offices.map((office) => (
              <OfficeCard
                key={office.id}
                office={office}
                onEdit={handleOpenEdit}
                onToggleActive={handleToggleActive}
                onDelete={setDeleteTarget}
              />
            ))}
          </AnimatePresence>
        )}
      </motion.div>

      {/* ================================================================= */}
      {/* Pagination                                                        */}
      {/* ================================================================= */}
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

      {/* ================================================================= */}
      {/* Add / Edit Dialog                                                 */}
      {/* ================================================================= */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl bg-white dark:bg-gray-900 border-blue-100/50 dark:border-blue-900/30">
          <DialogHeader>
            <DialogTitle className="text-[#1e40af] dark:text-blue-300 flex items-center gap-2">
              <MapPin className="size-5" />
              {editingOffice ? 'Edit Lokasi Kantor' : 'Tambah Lokasi Kantor'}
            </DialogTitle>
            <DialogDescription>
              {editingOffice
                ? 'Perbarui informasi lokasi kantor di bawah ini.'
                : 'Isi data lokasi kantor baru untuk mendaftarkan ke sistem.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-4 max-h-[65vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Form */}
              <div className="space-y-4">
                {/* Nama */}
                <div className="grid gap-2">
                  <Label htmlFor="officeName" className="text-sm font-medium">
                    Nama Lokasi <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="officeName"
                    value={formData.name}
                    onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                    placeholder="contoh: Kantor Pusat"
                    className="bg-white dark:bg-gray-800 border-blue-100/50 dark:border-blue-900/30"
                  />
                </div>

                {/* Alamat */}
                <div className="grid gap-2">
                  <Label htmlFor="officeAddress" className="text-sm font-medium">
                    Alamat
                  </Label>
                  <Textarea
                    id="officeAddress"
                    value={formData.address}
                    onChange={(e) => setFormData((f) => ({ ...f, address: e.target.value }))}
                    placeholder="contoh: Jl. Merdeka No. 1, Jakarta"
                    rows={2}
                    className="bg-white dark:bg-gray-800 border-blue-100/50 dark:border-blue-900/30 resize-none"
                  />
                </div>

                {/* Latitude */}
                <div className="grid gap-2">
                  <Label htmlFor="officeLat" className="text-sm font-medium">
                    Latitude <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="officeLat"
                    type="number"
                    step="0.000001"
                    value={formData.latitude}
                    onChange={(e) => setFormData((f) => ({ ...f, latitude: parseFloat(e.target.value) || 0 }))}
                    className="bg-white dark:bg-gray-800 border-blue-100/50 dark:border-blue-900/30 tabular-nums"
                  />
                </div>

                {/* Longitude */}
                <div className="grid gap-2">
                  <Label htmlFor="officeLng" className="text-sm font-medium">
                    Longitude <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="officeLng"
                    type="number"
                    step="0.000001"
                    value={formData.longitude}
                    onChange={(e) => setFormData((f) => ({ ...f, longitude: parseFloat(e.target.value) || 0 }))}
                    className="bg-white dark:bg-gray-800 border-blue-100/50 dark:border-blue-900/30 tabular-nums"
                  />
                </div>

                {/* Radius */}
                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Radius (meter)</Label>
                    <Badge variant="outline" className="text-xs px-2 py-0.5 bg-[#1e40af]/10 text-[#1e40af] dark:bg-blue-900/30 dark:text-blue-300 border-[#1e40af]/20">
                      {formData.radiusMeter}m
                    </Badge>
                  </div>
                  <Slider
                    value={[formData.radiusMeter]}
                    onValueChange={([val]) => setFormData((f) => ({ ...f, radiusMeter: val }))}
                    min={10}
                    max={1000}
                    step={10}
                    className="[&_[role=slider]]:bg-[#1e40af] [&_[role=slider]]:border-[#1e40af]"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>10m</span>
                    <span>500m</span>
                    <span>1000m</span>
                  </div>
                  <Input
                    type="number"
                    value={formData.radiusMeter}
                    onChange={(e) => {
                      const val = parseInt(e.target.value)
                      if (!isNaN(val) && val >= 10 && val <= 2000) {
                        setFormData((f) => ({ ...f, radiusMeter: val }))
                      }
                    }}
                    min={10}
                    max={2000}
                    className="bg-white dark:bg-gray-800 border-blue-100/50 dark:border-blue-900/30 tabular-nums w-32"
                  />
                </div>
              </div>

              {/* Map Preview */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Pratinjau Lokasi
                </p>
                <MapPreview
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  radius={formData.radiusMeter}
                />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="size-3 text-[#1e40af]" />
                  <span className="tabular-nums">
                    {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)} &bull; Radius: {formData.radiusMeter}m
                  </span>
                </div>
              </div>
            </div>
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
                  <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Menyimpan...
                </span>
              ) : (
                <>
                  <MapPin className="size-4 mr-1.5" />
                  {editingOffice ? 'Simpan Perubahan' : 'Tambah Lokasi'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================= */}
      {/* Delete Confirmation                                               */}
      {/* ================================================================= */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-white dark:bg-gray-900 border-blue-100/50 dark:border-blue-900/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="size-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <Trash2 className="size-5 text-red-500" />
              </div>
              Hapus Lokasi Kantor
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus lokasi <strong>&quot;{deleteTarget?.name}&quot;</strong>?
              Tindakan ini tidak dapat dibatalkan.
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
                  <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
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
