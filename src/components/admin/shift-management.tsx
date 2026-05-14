'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Clock,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  AlertCircle,
  Users,
  Timer,
  Palette,
  Zap,
} from 'lucide-react'

import type { WorkShift } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
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
// Constants
// ---------------------------------------------------------------------------

const DAY_LABELS: Record<string, string> = {
  '1': 'Senin',
  '2': 'Selasa',
  '3': 'Rabu',
  '4': 'Kamis',
  '5': 'Jumat',
  '6': 'Sabtu',
  '0': 'Minggu',
}

const DAY_SHORT: Record<string, string> = {
  '1': 'Sen',
  '2': 'Sel',
  '3': 'Rab',
  '4': 'Kam',
  '5': 'Jum',
  '6': 'Sab',
  '0': 'Min',
}

const ALL_DAYS = ['1', '2', '3', '4', '5', '6', '0']

const COLOR_PRESETS = [
  { name: 'Biru', value: '#1e40af' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Amber', value: '#d97706' },
  { name: 'Merah', value: '#dc2626' },
  { name: 'Violet', value: '#7c3aed' },
  { name: 'Cyan', value: '#0891b2' },
]

const SHIFT_TEMPLATES = [
  { name: 'Reguler', startTime: '08:00', endTime: '17:00', lateTolerance: 15, workDays: '1,2,3,4,5', color: '#1e40af' },
  { name: 'Security', startTime: '06:00', endTime: '18:00', lateTolerance: 10, workDays: '1,2,3,4,5,6', color: '#059669' },
  { name: 'Jaga Malam', startTime: '22:00', endTime: '06:00', lateTolerance: 10, workDays: '0,1,2,3,4,5,6', color: '#7c3aed' },
  { name: 'Driver', startTime: '07:00', endTime: '15:00', lateTolerance: 10, workDays: '1,2,3,4,5', color: '#d97706' },
  { name: 'CS', startTime: '09:00', endTime: '21:00', lateTolerance: 15, workDays: '1,2,3,4,5', color: '#0891b2' },
]

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ShiftFormData {
  name: string
  startTime: string
  endTime: string
  lateTolerance: number
  workDays: string
  color: string
}

const emptyForm: ShiftFormData = {
  name: '',
  startTime: '08:00',
  endTime: '17:00',
  lateTolerance: 15,
  workDays: '1,2,3,4,5',
  color: '#1e40af',
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function ShiftSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <Skeleton className="h-4 w-32" />
              <div className="flex gap-2">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Skeleton key={j} className="h-6 w-8 rounded" />
                ))}
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 w-8" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shift Card
// ---------------------------------------------------------------------------

function ShiftCard({
  shift,
  onEdit,
  onDelete,
}: {
  shift: WorkShift
  onEdit: (shift: WorkShift) => void
  onDelete: (shift: WorkShift) => void
}) {
  const activeDays = shift.workDays ? shift.workDays.split(',').filter(Boolean) : []
  const userCount = shift._count?.users ?? 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="relative"
    >
      {/* Color left border */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ backgroundColor: shift.color }}
      />

      <Card className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30 shadow-sm hover:shadow-md hover:shadow-blue-500/5 transition-all pl-5">
        <CardContent className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground truncate">{shift.name}</h3>
                <div
                  className="size-3 rounded-full shrink-0 ring-2 ring-white dark:ring-gray-900"
                  style={{ backgroundColor: shift.color }}
                />
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="size-3.5" style={{ color: shift.color }} />
                <span className="font-medium tabular-nums">{shift.startTime}</span>
                <span className="text-xs">—</span>
                <span className="font-medium tabular-nums">{shift.endTime}</span>
              </div>
            </div>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 shrink-0 ${
                shift.isActive
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
                  : 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
              }`}
            >
              {shift.isActive ? 'Aktif' : 'Nonaktif'}
            </Badge>
          </div>

          {/* Tolerance */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Timer className="size-3 text-amber-500" />
            <span>Toleransi: <span className="font-medium text-foreground">{shift.lateTolerance} menit</span></span>
          </div>

          {/* Work Days */}
          <div className="flex flex-wrap gap-1.5">
            {ALL_DAYS.map((day) => {
              const isActive = activeDays.includes(day)
              return (
                <span
                  key={day}
                  className={`inline-flex items-center justify-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold transition-colors ${
                    isActive
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-400 dark:bg-gray-800/50 dark:text-gray-600'
                  }`}
                  style={isActive ? { backgroundColor: shift.color } : undefined}
                >
                  {DAY_SHORT[day]}
                </span>
              )
            })}
          </div>

          <Separator className="bg-blue-50 dark:bg-blue-900/20" />

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="size-3 text-[#2563eb]" />
              <span><span className="font-medium text-foreground">{userCount}</span> pegawai</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-xs border-blue-200 dark:border-blue-800 text-[#2563eb] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                onClick={() => onEdit(shift)}
              >
                <Pencil className="size-3 mr-1" /> Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={() => onDelete(shift)}
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ShiftManagement() {
  // Data state
  const [shifts, setShifts] = useState<WorkShift[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingShift, setEditingShift] = useState<WorkShift | null>(null)
  const [formData, setFormData] = useState<ShiftFormData>(emptyForm)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<WorkShift | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // ---- Fetch shifts ----
  const fetchShifts = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const res = await fetch('/api/shifts')
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Gagal memuat data jam kerja')
      }

      const data = await res.json()
      setShifts(data.shifts || [])
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan'
      setError(message)
      toast.error('Gagal memuat data', {
        description: message,
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchShifts()
  }, [fetchShifts])

  // ---- Create / Update shift ----
  const handleOpenCreate = () => {
    setEditingShift(null)
    setFormData(emptyForm)
    setDialogOpen(true)
  }

  const handleOpenEdit = (shift: WorkShift) => {
    setEditingShift(shift)
    setFormData({
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      lateTolerance: shift.lateTolerance,
      workDays: shift.workDays,
      color: shift.color,
    })
    setDialogOpen(true)
  }

  const handleApplyTemplate = (template: typeof SHIFT_TEMPLATES[number]) => {
    setFormData((f) => ({
      ...f,
      name: f.name || template.name,
      startTime: template.startTime,
      endTime: template.endTime,
      lateTolerance: template.lateTolerance,
      workDays: template.workDays,
      color: template.color,
    }))
    toast.info(`Template "${template.name}" diterapkan`, {
      description: `${template.startTime} - ${template.endTime}`,
    })
  }

  const toggleWorkDay = (day: string) => {
    const currentDays = formData.workDays ? formData.workDays.split(',').filter(Boolean) : []
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day].sort((a, b) => Number(a) - Number(b))
    setFormData((f) => ({ ...f, workDays: newDays.join(',') }))
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.startTime || !formData.endTime) {
      toast.error('Data tidak lengkap', {
        description: 'Nama shift, jam masuk, dan jam pulang wajib diisi',
      })
      return
    }

    if (!formData.workDays) {
      toast.error('Hari kerja belum dipilih', {
        description: 'Pilih minimal satu hari kerja',
      })
      return
    }

    try {
      setIsSubmitting(true)

      if (editingShift) {
        // Update
        const res = await fetch('/api/shifts', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingShift.id,
            name: formData.name,
            startTime: formData.startTime,
            endTime: formData.endTime,
            lateTolerance: formData.lateTolerance,
            workDays: formData.workDays,
            color: formData.color,
          }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || 'Gagal mengupdate jam kerja')
        }

        toast.success('Berhasil diperbarui', {
          description: `Jam kerja "${formData.name}" berhasil diperbarui`,
        })
      } else {
        // Create
        const res = await fetch('/api/shifts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            startTime: formData.startTime,
            endTime: formData.endTime,
            lateTolerance: formData.lateTolerance,
            workDays: formData.workDays,
            color: formData.color,
          }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || 'Gagal menambah jam kerja')
        }

        toast.success('Berhasil ditambahkan', {
          description: `Jam kerja "${formData.name}" berhasil ditambahkan`,
        })
      }

      setDialogOpen(false)
      fetchShifts()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan'
      toast.error('Gagal menyimpan', {
        description: message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ---- Delete shift ----
  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setIsDeleting(true)
      const res = await fetch(`/api/shifts?id=${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Gagal menghapus jam kerja')
      }
      toast.success('Berhasil dihapus', {
        description: `Jam kerja "${deleteTarget.name}" telah dihapus`,
      })
      setDeleteTarget(null)
      fetchShifts()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan'
      toast.error('Gagal menghapus', {
        description: message,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const activeWorkDays = formData.workDays.split(',').filter(Boolean)

  // ---- Loading state ----
  if (isLoading && shifts.length === 0) return <ShiftSkeleton />

  // ---- Error state ----
  if (error && shifts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="size-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <AlertCircle className="size-8 text-red-500" />
        </div>
        <p className="text-lg font-semibold text-foreground">Gagal Memuat Data</p>
        <p className="text-sm text-muted-foreground max-w-md text-center">{error}</p>
        <Button onClick={fetchShifts} className="bg-[#1e40af] hover:bg-[#1e3a8a]">
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
            <Clock className="size-7" />
            Jam Kerja
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {shifts.length} jam kerja terdaftar
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-[#1e40af] hover:bg-[#1e3a8a] text-white shadow-lg shadow-blue-500/25"
        >
          <Plus className="size-4 mr-1.5" />
          Tambah Jam Kerja
        </Button>
      </motion.div>

      {/* ================================================================= */}
      {/* Shift Cards Grid                                                  */}
      {/* ================================================================= */}
      <motion.div variants={itemVariants}>
        {shifts.length === 0 ? (
          <Card className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30">
            <CardContent className="py-16 flex flex-col items-center space-y-2">
              <Clock className="size-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Belum ada jam kerja terdaftar</p>
              <p className="text-xs text-muted-foreground">
                Tambahkan jam kerja untuk mengatur jadwal pegawai
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenCreate}
                className="mt-2 border-blue-200 dark:border-blue-800 text-[#2563eb] dark:text-blue-400"
              >
                <Plus className="size-3.5 mr-1" /> Tambah Jam Kerja
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {shifts.map((shift) => (
                <ShiftCard
                  key={shift.id}
                  shift={shift}
                  onEdit={handleOpenEdit}
                  onDelete={setDeleteTarget}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* ================================================================= */}
      {/* Add / Edit Dialog                                                 */}
      {/* ================================================================= */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-900 border-blue-100/50 dark:border-blue-900/30">
          <DialogHeader>
            <DialogTitle className="text-[#1e40af] dark:text-blue-300 flex items-center gap-2">
              <Clock className="size-5" />
              {editingShift ? 'Edit Jam Kerja' : 'Tambah Jam Kerja'}
            </DialogTitle>
            <DialogDescription>
              {editingShift
                ? 'Perbarui informasi jam kerja di bawah ini.'
                : 'Isi data jam kerja baru atau pilih template yang tersedia.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-4 max-h-[65vh] overflow-y-auto pr-2">
            {/* Templates (only when creating) */}
            {!editingShift && (
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Zap className="size-3.5 text-amber-500" />
                  Template Jam Kerja
                </Label>
                <ScrollArea className="w-full whitespace-nowrap">
                  <div className="flex gap-2 pb-1">
                    {SHIFT_TEMPLATES.map((template) => (
                      <button
                        key={template.name}
                        type="button"
                        onClick={() => handleApplyTemplate(template)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-100/50 dark:border-blue-900/30 bg-white/70 dark:bg-gray-800/50 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-800 transition-colors shrink-0"
                      >
                        <div
                          className="size-2 rounded-full shrink-0"
                          style={{ backgroundColor: template.color }}
                        />
                        {template.name}
                        <span className="text-muted-foreground ml-0.5">
                          {template.startTime}-{template.endTime}
                        </span>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            <Separator className="bg-blue-50 dark:bg-blue-900/20" />

            {/* Nama Shift */}
            <div className="grid gap-2">
              <Label htmlFor="shiftName" className="text-sm font-medium">
                Nama Shift <span className="text-red-500">*</span>
              </Label>
              <Input
                id="shiftName"
                value={formData.name}
                onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                placeholder="contoh: Reguler, Security, Jaga Malam"
                className="bg-white dark:bg-gray-800 border-blue-100/50 dark:border-blue-900/30"
              />
            </div>

            {/* Jam Masuk & Jam Pulang */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startTime" className="text-sm font-medium flex items-center gap-1.5">
                  <Clock className="size-3.5 text-emerald-500" />
                  Jam Masuk
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData((f) => ({ ...f, startTime: e.target.value }))}
                  className="bg-white dark:bg-gray-800 border-blue-100/50 dark:border-blue-900/30 tabular-nums"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endTime" className="text-sm font-medium flex items-center gap-1.5">
                  <Clock className="size-3.5 text-orange-500" />
                  Jam Pulang
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData((f) => ({ ...f, endTime: e.target.value }))}
                  className="bg-white dark:bg-gray-800 border-blue-100/50 dark:border-blue-900/30 tabular-nums"
                />
              </div>
            </div>

            {/* Toleransi Keterlambatan */}
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Toleransi Keterlambatan</Label>
                <Badge variant="outline" className="text-xs px-2 py-0.5 bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800">
                  {formData.lateTolerance} menit
                </Badge>
              </div>
              <Slider
                value={[formData.lateTolerance]}
                onValueChange={([val]) => setFormData((f) => ({ ...f, lateTolerance: val }))}
                min={0}
                max={60}
                step={5}
                className="[&_[role=slider]]:bg-amber-500 [&_[role=slider]]:border-amber-500"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>0 menit</span>
                <span>30 menit</span>
                <span>60 menit</span>
              </div>
              <Input
                type="number"
                value={formData.lateTolerance}
                onChange={(e) => {
                  const val = parseInt(e.target.value)
                  if (!isNaN(val) && val >= 0 && val <= 120) {
                    setFormData((f) => ({ ...f, lateTolerance: val }))
                  }
                }}
                min={0}
                max={120}
                className="bg-white dark:bg-gray-800 border-blue-100/50 dark:border-blue-900/30 tabular-nums w-32"
              />
            </div>

            {/* Hari Kerja */}
            <div className="grid gap-3">
              <Label className="text-sm font-medium">Hari Kerja</Label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {ALL_DAYS.map((day) => {
                  const isActive = activeWorkDays.includes(day)
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleWorkDay(day)}
                      className={`relative flex flex-col items-center justify-center rounded-xl border p-3 text-sm font-medium transition-all ${
                        isActive
                          ? 'text-white border-transparent shadow-md'
                          : 'bg-white dark:bg-gray-800 text-muted-foreground border-blue-100/50 dark:border-blue-900/30 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-[#1e40af] dark:hover:text-blue-300'
                      }`}
                      style={isActive ? { backgroundColor: formData.color, boxShadow: `0 4px 14px ${formData.color}33` } : undefined}
                    >
                      <span className="text-xs font-semibold">{DAY_LABELS[day]}</span>
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {activeWorkDays.length > 0
                  ? `Hari kerja: ${activeWorkDays.map((d) => DAY_LABELS[d]).join(', ')}`
                  : 'Pilih minimal satu hari kerja'}
              </p>
            </div>

            {/* Warna */}
            <div className="grid gap-3">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Palette className="size-3.5" />
                Warna
              </Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((preset) => {
                  const isSelected = formData.color.toLowerCase() === preset.value.toLowerCase()
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setFormData((f) => ({ ...f, color: preset.value }))}
                      className={`group relative size-9 rounded-xl transition-all ${
                        isSelected
                          ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{
                        backgroundColor: preset.value,
                        ringColor: preset.value,
                        boxShadow: isSelected ? `0 4px 14px ${preset.value}44` : undefined,
                      }}
                      title={preset.name}
                    >
                      {isSelected && (
                        <svg className="absolute inset-0 m-auto size-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="size-8 rounded-lg border border-blue-100/50 dark:border-blue-900/30 shrink-0"
                  style={{ backgroundColor: formData.color }}
                />
                <Input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData((f) => ({ ...f, color: e.target.value }))}
                  placeholder="#1e40af"
                  className="bg-white dark:bg-gray-800 border-blue-100/50 dark:border-blue-900/30 w-32 font-mono text-sm"
                />
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData((f) => ({ ...f, color: e.target.value }))}
                  className="size-8 p-0 border-0 rounded cursor-pointer bg-transparent"
                />
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-xl border border-blue-100/50 dark:border-blue-900/30 p-4 bg-blue-50/30 dark:bg-blue-900/10 space-y-2">
              <p className="text-sm font-semibold text-[#1e40af] dark:text-blue-300">Ringkasan Jam Kerja</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Nama Shift:</span>{' '}
                  <span className="font-medium text-foreground">{formData.name || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Jam Kerja:</span>{' '}
                  <span className="font-medium text-foreground tabular-nums">{formData.startTime} — {formData.endTime}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Toleransi:</span>{' '}
                  <span className="font-medium text-foreground">{formData.lateTolerance} menit</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Hari Kerja:</span>{' '}
                  <span className="font-medium text-foreground">{activeWorkDays.length} hari</span>
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
                  <Clock className="size-4 mr-1.5" />
                  {editingShift ? 'Simpan Perubahan' : 'Tambah Jam Kerja'}
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
              Hapus Jam Kerja
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus jam kerja <strong>&quot;{deleteTarget?.name}&quot;</strong>?
              {deleteTarget && (deleteTarget._count?.users ?? 0) > 0 && (
                <span className="block mt-1 text-amber-600 dark:text-amber-400">
                  ⚠️ {deleteTarget._count?.users} pegawai yang terhubung dengan shift ini akan dilepaskan dari shift.
                </span>
              )}
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
