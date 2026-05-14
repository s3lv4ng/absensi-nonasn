'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  PenLine,
  Search,
  User,
  Clock,
  CalendarDays,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Upload,
  X,
} from 'lucide-react'

import type { User as UserType } from '@/types'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ManualAttendanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface EmployeeSearchResult {
  id: string
  nip: string
  nama: string
  email: string
  photo: string | null
  unitKerja: string | null
  jabatan: string | null
  shiftId: string | null
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ManualAttendanceDialog({
  open,
  onOpenChange,
  onSuccess,
}: ManualAttendanceDialogProps) {
  // Form state
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')
  const [type, setType] = useState<string>('')
  const [date, setDate] = useState<string>(() => {
    const now = new Date()
    return now.toISOString().split('T')[0]
  })
  const [time, setTime] = useState<string>('08:00')
  const [status, setStatus] = useState<string>('')
  const [note, setNote] = useState<string>('')
  const [buktiDukung, setBuktiDukung] = useState<string | null>(null)
  const [buktiPreview, setBuktiPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Employee search
  const [employees, setEmployees] = useState<EmployeeSearchResult[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false)
  const [showEmployeeList, setShowEmployeeList] = useState(false)

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId)

  // Fetch employees for search
  const fetchEmployees = useCallback(async (query: string) => {
    try {
      setIsLoadingEmployees(true)
      const params = new URLSearchParams()
      params.set('role', 'PEGAWAI')
      params.set('isActive', 'true')
      if (query) {
        params.set('search', query)
      }
      params.set('limit', '20')

      const res = await fetch(`/api/users?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        const users = data.users || []
        // Map to EmployeeSearchResult format
        const mapped: EmployeeSearchResult[] = users.map((u: any) => ({
          id: u.id,
          nip: u.nip,
          nama: u.nama,
          email: u.email,
          photo: u.photo,
          unitKerja: u.unitKerjaRef?.name || u.unitKerja || null,
          jabatan: u.jabatanRef?.name || u.jabatan || null,
          shiftId: u.shiftId || null,
        }))
        setEmployees(mapped)
      }
    } catch {
      // Silent fail
    } finally {
      setIsLoadingEmployees(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (open) {
        fetchEmployees(searchQuery)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, open, fetchEmployees])

  // Initial fetch when dialog opens
  useEffect(() => {
    if (open) {
      fetchEmployees('')
    }
  }, [open, fetchEmployees])

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedEmployeeId('')
      setType('')
      setDate(new Date().toISOString().split('T')[0])
      setTime('08:00')
      setStatus('')
      setNote('')
      setBuktiDukung(null)
      setBuktiPreview(null)
      setSearchQuery('')
      setShowEmployeeList(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [open])

  const handleSubmit = async () => {
    // Validation
    if (!selectedEmployeeId) {
      toast.error('Pilih pegawai terlebih dahulu')
      return
    }
    if (!type) {
      toast.error('Pilih tipe absensi (Masuk/Pulang)')
      return
    }
    if (!date) {
      toast.error('Pilih tanggal absensi')
      return
    }
    if (!time) {
      toast.error('Pilih waktu absensi')
      return
    }
    if (!status) {
      toast.error('Pilih status absensi')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/attendance/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedEmployeeId,
          type,
          date,
          time,
          status,
          note: note.trim() || undefined,
          buktiDukung: buktiDukung || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal membuat absensi manual')
      }

      toast.success('Absensi manual berhasil ditambahkan', {
        description: data.message,
        icon: <CheckCircle2 className="size-4 text-emerald-500" />,
      })

      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (err: any) {
      toast.error('Gagal menambahkan absensi', {
        description: err.message || 'Terjadi kesalahan',
        icon: <AlertCircle className="size-4 text-red-500" />,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const statusOptions = [
    { value: 'HADIR', label: 'Hadir', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
    { value: 'TELAT', label: 'Telat', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
    { value: 'IZIN', label: 'Izin', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
    { value: 'CUTI', label: 'Cuti', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
    { value: 'ALPHA', label: 'Alpha', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800' },
    { value: 'DINAS', label: 'Dinas', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200 dark:border-teal-800' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg bg-white dark:bg-gray-900 border-blue-100/50 dark:border-blue-900/30"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-[#1e40af] dark:text-blue-300 flex items-center gap-2">
            <PenLine className="size-5" />
            Absensi Manual
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Tambahkan record absensi untuk pegawai yang lupa clock in/out atau mengalami kendala teknis.
          </DialogDescription>
        </DialogHeader>

        <form id="manual-attendance-form" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
          {/* Employee Selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <User className="size-3.5" />
              Pegawai <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau NIP pegawai..."
                value={selectedEmployee ? `${selectedEmployee.nama} (${selectedEmployee.nip})` : searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setSelectedEmployeeId('')
                  setShowEmployeeList(true)
                }}
                onFocus={() => setShowEmployeeList(true)}
                className="pl-9 bg-white/70 dark:bg-gray-900/60 border-blue-100/50 dark:border-blue-900/30"
              />
            </div>

            {/* Employee Search Results */}
            <AnimatePresence>
              {showEmployeeList && !selectedEmployeeId && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="relative"
                >
                  <ScrollArea className="max-h-48 rounded-lg border border-blue-100/50 dark:border-blue-900/30 bg-white dark:bg-gray-900 shadow-lg">
                    {isLoadingEmployees ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        <span className="text-sm text-muted-foreground ml-2">Mencari...</span>
                      </div>
                    ) : employees.length === 0 ? (
                      <div className="py-4 text-center text-sm text-muted-foreground">
                        Pegawai tidak ditemukan
                      </div>
                    ) : (
                      employees.map((emp) => (
                        <button
                          key={emp.id}
                          onClick={() => {
                            setSelectedEmployeeId(emp.id)
                            setSearchQuery('')
                            setShowEmployeeList(false)
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left border-b border-blue-50 dark:border-blue-900/20 last:border-b-0"
                        >
                          <Avatar className="size-8 ring-1 ring-blue-100 dark:ring-blue-900/40 shrink-0">
                            <AvatarImage src={emp.photo ?? undefined} alt={emp.nama} />
                            <AvatarFallback className="bg-[#1e40af]/10 text-[#1e40af] dark:bg-blue-900/30 dark:text-blue-400 text-[10px] font-bold">
                              {getInitials(emp.nama)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">{emp.nama}</p>
                            <p className="text-xs text-muted-foreground font-mono">{emp.nip}</p>
                          </div>
                          {emp.unitKerja && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                              {emp.unitKerja}
                            </Badge>
                          )}
                        </button>
                      ))
                    )}
                  </ScrollArea>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Selected Employee Badge */}
            {selectedEmployee && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100/50 dark:border-blue-900/30"
              >
                <Avatar className="size-9 ring-2 ring-blue-200 dark:ring-blue-800">
                  <AvatarImage src={selectedEmployee.photo ?? undefined} alt={selectedEmployee.nama} />
                  <AvatarFallback className="bg-[#1e40af]/10 text-[#1e40af] dark:bg-blue-900/30 dark:text-blue-400 text-xs font-bold">
                    {getInitials(selectedEmployee.nama)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{selectedEmployee.nama}</p>
                  <p className="text-xs text-muted-foreground font-mono">{selectedEmployee.nip}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="size-7 p-0 text-muted-foreground hover:text-red-500"
                  onClick={() => {
                    setSelectedEmployeeId('')
                    setSearchQuery('')
                    setShowEmployeeList(true)
                  }}
                >
                  ×
                </Button>
              </motion.div>
            )}
          </div>

          <Separator className="bg-blue-50 dark:bg-blue-900/20" />

          {/* Attendance Type & Status Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Clock className="size-3.5" />
                Tipe <span className="text-red-500">*</span>
              </Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-white/70 dark:bg-gray-900/60 border-blue-100/50 dark:border-blue-900/30">
                  <SelectValue placeholder="Pilih tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MASUK">
                    <span className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-emerald-500" />
                      Masuk
                    </span>
                  </SelectItem>
                  <SelectItem value="PULANG">
                    <span className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-orange-500" />
                      Pulang
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Status <span className="text-red-500">*</span>
              </Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="bg-white/70 dark:bg-gray-900/60 border-blue-100/50 dark:border-blue-900/30">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="flex items-center gap-2">
                        <span className={`size-2 rounded-full ${
                          opt.value === 'HADIR' ? 'bg-emerald-500' :
                          opt.value === 'TELAT' ? 'bg-amber-500' :
                          opt.value === 'IZIN' ? 'bg-blue-500' :
                          opt.value === 'CUTI' ? 'bg-purple-500' :
                          opt.value === 'ALPHA' ? 'bg-red-500' :
                          'bg-teal-500'
                        }`} />
                        {opt.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date & Time Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <CalendarDays className="size-3.5" />
                Tanggal <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-white/70 dark:bg-gray-900/60 border-blue-100/50 dark:border-blue-900/30"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Clock className="size-3.5" />
                Waktu <span className="text-red-500">*</span>
              </Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-white/70 dark:bg-gray-900/60 border-blue-100/50 dark:border-blue-900/30"
              />
            </div>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <FileText className="size-3.5" />
              Catatan <span className="text-xs text-muted-foreground font-normal">(opsional)</span>
            </Label>
            <Input
              placeholder="Alasan absensi manual, misal: Lupa clock in, kendala teknis..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="bg-white/70 dark:bg-gray-900/60 border-blue-100/50 dark:border-blue-900/30"
            />
          </div>

          {/* Bukti Dukung Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Upload className="size-3.5" />
              Upload Bukti Dukung <span className="text-xs text-muted-foreground font-normal">(opsional)</span>
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
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
                  setBuktiDukung(reader.result as string)
                  setBuktiPreview(reader.result as string)
                }
                reader.readAsDataURL(file)
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-dashed border-2 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 h-16"
            >
              <div className="flex flex-col items-center gap-1">
                <Upload className="size-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Klik untuk upload gambar</span>
              </div>
            </Button>
            {buktiPreview && (
              <div className="relative rounded-lg overflow-hidden border border-blue-100/50 dark:border-blue-900/30">
                <img src={buktiPreview} alt="Preview bukti" className="w-full max-h-32 object-cover" />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1 size-6 p-0"
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
            <AlertCircle className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Absensi manual tidak memerlukan verifikasi GPS dan face recognition. Record akan ditandai sebagai &quot;Manual&quot; oleh admin.
            </p>
          </div>
        </form>

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
            type="submit"
            form="manual-attendance-form"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-[#1e40af] hover:bg-[#1e3a8a] text-white shadow-lg shadow-blue-500/25"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 mr-1.5 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <PenLine className="size-4 mr-1.5" />
                Simpan Absensi
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
