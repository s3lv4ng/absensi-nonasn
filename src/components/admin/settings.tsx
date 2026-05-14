'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Settings,
  MapPin,
  Clock,
  CalendarDays,
  Save,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  Building2,
  Radius,
  Timer,
  DayIcon,
} from 'lucide-react'

import { useAppStore } from '@/store'
import type { OfficeSetting, Holiday, HolidayType } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
// Types
// ---------------------------------------------------------------------------

interface OfficeFormData {
  officeName: string
  latitude: number
  longitude: number
  radiusMeter: number
}

interface WorkHoursFormData {
  startTime: string
  endTime: string
  lateTolerance: number
  workDays: string
}

interface HolidayFormData {
  name: string
  date: string
  type: HolidayType
}

const DAY_LABELS: Record<string, string> = {
  '1': 'Senin',
  '2': 'Selasa',
  '3': 'Rabu',
  '4': 'Kamis',
  '5': 'Jumat',
  '6': 'Sabtu',
  '0': 'Minggu',
}

const ALL_DAYS = ['1', '2', '3', '4', '5', '6', '0']

const emptyOfficeForm: OfficeFormData = {
  officeName: 'Kantor Pusat',
  latitude: -6.2088,
  longitude: 106.8456,
  radiusMeter: 100,
}

const emptyWorkHoursForm: WorkHoursFormData = {
  startTime: '08:00',
  endTime: '17:00',
  lateTolerance: 15,
  workDays: '1,2,3,4,5',
}

const emptyHolidayForm: HolidayFormData = {
  name: '',
  date: '',
  type: 'NASIONAL',
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>
      <Skeleton className="h-10 w-80" />
      <Card className="bg-white/70 dark:bg-gray-900/60">
        <CardContent className="p-6 space-y-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Map Preview SVG
// ---------------------------------------------------------------------------

function MapPreview({ latitude, longitude, radius }: { latitude: number; longitude: number; radius: number }) {
  const mapCenter = { x: 200, y: 150 }
  // Scale radius for visualization (1m = 0.5px for small, capped at 120px)
  const visualRadius = Math.min(Math.max(radius * 0.5, 20), 120)

  return (
    <div className="rounded-xl overflow-hidden border border-blue-100/50 dark:border-blue-900/30 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20">
      <svg
        viewBox="0 0 400 300"
        className="w-full h-auto"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Grid pattern */}
        <defs>
          <pattern id="settings-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e40af" strokeWidth="0.3" opacity="0.15" />
          </pattern>
        </defs>
        <rect width="400" height="300" fill="url(#settings-grid)" />

        {/* Radius circle */}
        <circle
          cx={mapCenter.x}
          cy={mapCenter.y}
          r={visualRadius}
          fill="#2563eb"
          fillOpacity="0.08"
          stroke="#2563eb"
          strokeWidth="1.5"
          strokeDasharray="6 3"
          opacity="0.6"
        />

        {/* Center point */}
        <circle
          cx={mapCenter.x}
          cy={mapCenter.y}
          r="6"
          fill="#1e40af"
          opacity="0.9"
        />
        <circle
          cx={mapCenter.x}
          cy={mapCenter.y}
          r="3"
          fill="white"
        />

        {/* Pulse animation */}
        <circle
          cx={mapCenter.x}
          cy={mapCenter.y}
          r="6"
          fill="none"
          stroke="#1e40af"
          strokeWidth="1"
          opacity="0.4"
        >
          <animate
            attributeName="r"
            from="6"
            to="20"
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            from="0.4"
            to="0"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Labels */}
        <text x={mapCenter.x + 12} y={mapCenter.y - 4} fontSize="9" fill="#1e40af" fontWeight="600" opacity="0.7">
          Kantor
        </text>
        <text x={mapCenter.x + 12} y={mapCenter.y + 8} fontSize="7" fill="#1e40af" opacity="0.5">
          {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </text>

        {/* Radius label */}
        <text
          x={mapCenter.x + visualRadius / 2}
          y={mapCenter.y - visualRadius - 6}
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
          { x: 80, y: 90 },
          { x: 320, y: 80 },
          { x: 60, y: 220 },
          { x: 340, y: 230 },
          { x: 150, y: 60 },
        ].map((dot, i) => (
          <circle key={i} cx={dot.x} cy={dot.y} r="2.5" fill="#1e40af" opacity="0.2" />
        ))}
      </svg>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function AdminSettings() {
  // Settings state
  const [settings, setSettings] = useState<OfficeSetting | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Office form
  const [officeForm, setOfficeForm] = useState<OfficeFormData>(emptyOfficeForm)
  const [isSavingOffice, setIsSavingOffice] = useState(false)

  // Work hours form
  const [workHoursForm, setWorkHoursForm] = useState<WorkHoursFormData>(emptyWorkHoursForm)
  const [isSavingWorkHours, setIsSavingWorkHours] = useState(false)

  // Holidays
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [holidayForm, setHolidayForm] = useState<HolidayFormData>(emptyHolidayForm)
  const [isAddingHoliday, setIsAddingHoliday] = useState(false)
  const [deleteHolidayTarget, setDeleteHolidayTarget] = useState<Holiday | null>(null)
  const [isDeletingHoliday, setIsDeletingHoliday] = useState(false)

  // ---- Fetch settings ----
  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const res = await fetch('/api/settings')
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Gagal memuat pengaturan')
      }

      const data = await res.json()
      const setting: OfficeSetting = data.setting
      setSettings(setting)

      // Populate forms
      setOfficeForm({
        officeName: setting.officeName || 'Kantor Pusat',
        latitude: setting.latitude,
        longitude: setting.longitude,
        radiusMeter: setting.radiusMeter,
      })
      setWorkHoursForm({
        startTime: setting.startTime || '08:00',
        endTime: setting.endTime || '17:00',
        lateTolerance: setting.lateTolerance,
        workDays: setting.workDays || '1,2,3,4,5',
      })
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
      toast.error('Gagal memuat pengaturan', {
        description: err.message || 'Terjadi kesalahan',
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ---- Fetch holidays ----
  const fetchHolidays = useCallback(async () => {
    try {
      const res = await fetch('/api/holidays')
      if (!res.ok) return
      const data = await res.json()
      setHolidays(data.holidays || [])
    } catch {
      // Silent fail
    }
  }, [])

  useEffect(() => {
    fetchSettings()
    fetchHolidays()
  }, [fetchSettings, fetchHolidays])

  // ---- Save office settings ----
  const handleSaveOffice = async () => {
    if (!officeForm.officeName) {
      toast.error('Nama kantor wajib diisi')
      return
    }
    try {
      setIsSavingOffice(true)
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officeName: officeForm.officeName,
          latitude: officeForm.latitude,
          longitude: officeForm.longitude,
          radiusMeter: officeForm.radiusMeter,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Gagal menyimpan pengaturan')
      }
      const data = await res.json()
      setSettings(data.setting)
      toast.success('Pengaturan lokasi disimpan', {
        description: 'Lokasi kantor berhasil diperbarui',
      })
    } catch (err: any) {
      toast.error('Gagal menyimpan', {
        description: err.message || 'Terjadi kesalahan',
      })
    } finally {
      setIsSavingOffice(false)
    }
  }

  // ---- Save work hours ----
  const handleSaveWorkHours = async () => {
    try {
      setIsSavingWorkHours(true)
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: workHoursForm.startTime,
          endTime: workHoursForm.endTime,
          lateTolerance: workHoursForm.lateTolerance,
          workDays: workHoursForm.workDays,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Gagal menyimpan pengaturan')
      }
      const data = await res.json()
      setSettings(data.setting)
      toast.success('Pengaturan jam kerja disimpan', {
        description: 'Jam kerja berhasil diperbarui',
      })
    } catch (err: any) {
      toast.error('Gagal menyimpan', {
        description: err.message || 'Terjadi kesalahan',
      })
    } finally {
      setIsSavingWorkHours(false)
    }
  }

  // ---- Add holiday ----
  const handleAddHoliday = async () => {
    if (!holidayForm.name || !holidayForm.date) {
      toast.error('Nama dan tanggal wajib diisi')
      return
    }
    try {
      setIsAddingHoliday(true)
      const res = await fetch('/api/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(holidayForm),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Gagal menambah hari libur')
      }
      toast.success('Hari libur ditambahkan', {
        description: `${holidayForm.name} berhasil ditambahkan`,
      })
      setHolidayForm(emptyHolidayForm)
      fetchHolidays()
    } catch (err: any) {
      toast.error('Gagal menambah hari libur', {
        description: err.message || 'Terjadi kesalahan',
      })
    } finally {
      setIsAddingHoliday(false)
    }
  }

  // ---- Delete holiday ----
  const handleDeleteHoliday = async () => {
    if (!deleteHolidayTarget) return
    try {
      setIsDeletingHoliday(true)
      const res = await fetch(`/api/holidays?id=${deleteHolidayTarget.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Gagal menghapus hari libur')
      }
      toast.success('Hari libur dihapus', {
        description: `${deleteHolidayTarget.name} telah dihapus`,
      })
      setDeleteHolidayTarget(null)
      fetchHolidays()
    } catch (err: any) {
      toast.error('Gagal menghapus', {
        description: err.message || 'Terjadi kesalahan',
      })
    } finally {
      setIsDeletingHoliday(false)
    }
  }

  // ---- Toggle work day ----
  const toggleWorkDay = (day: string) => {
    const currentDays = workHoursForm.workDays ? workHoursForm.workDays.split(',').filter(Boolean) : []
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day].sort((a, b) => Number(a) - Number(b))
    setWorkHoursForm((f) => ({ ...f, workDays: newDays.join(',') }))
  }

  // ---- Loading state ----
  if (isLoading) return <SettingsSkeleton />

  // ---- Error state ----
  if (error && !settings) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="size-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <AlertCircle className="size-8 text-red-500" />
        </div>
        <p className="text-lg font-semibold text-foreground">Gagal Memuat Pengaturan</p>
        <p className="text-sm text-muted-foreground max-w-md text-center">{error}</p>
        <Button onClick={fetchSettings} className="bg-[#1e40af] hover:bg-[#1e3a8a]">
          Coba Lagi
        </Button>
      </div>
    )
  }

  const activeWorkDays = workHoursForm.workDays.split(',').filter(Boolean)

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
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#1e40af] dark:text-blue-300 tracking-tight">
          Pengaturan
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Kelola lokasi kantor, jam kerja, dan hari libur
        </p>
      </motion.div>

      {/* ================================================================= */}
      {/* Tabs                                                              */}
      {/* ================================================================= */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="location" className="space-y-6">
          <TabsList className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-blue-100/50 dark:border-blue-900/30 p-1 h-auto">
            <TabsTrigger
              value="location"
              className="data-[state=active]:bg-[#1e40af] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 text-sm px-4 py-2"
            >
              <MapPin className="size-4 mr-1.5" />
              Lokasi Kantor
            </TabsTrigger>
            <TabsTrigger
              value="workhours"
              className="data-[state=active]:bg-[#1e40af] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 text-sm px-4 py-2"
            >
              <Clock className="size-4 mr-1.5" />
              Jam Kerja
            </TabsTrigger>
            <TabsTrigger
              value="holidays"
              className="data-[state=active]:bg-[#1e40af] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 text-sm px-4 py-2"
            >
              <CalendarDays className="size-4 mr-1.5" />
              Hari Libur
            </TabsTrigger>
          </TabsList>

          {/* =============================================================== */}
          {/* Tab: Lokasi Kantor                                              */}
          {/* =============================================================== */}
          <TabsContent value="location">
            <Card className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30 shadow-lg shadow-blue-500/5">
              <CardHeader>
                <CardTitle className="text-[#1e40af] dark:text-blue-300 flex items-center gap-2">
                  <Building2 className="size-5" />
                  Lokasi Kantor
                </CardTitle>
                <CardDescription>
                  Atur lokasi kantor dan radius absensi GPS
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Form */}
                  <div className="space-y-5">
                    {/* Office Name */}
                    <div className="space-y-2">
                      <Label htmlFor="officeName" className="text-sm font-medium">
                        Nama Kantor
                      </Label>
                      <Input
                        id="officeName"
                        value={officeForm.officeName}
                        onChange={(e) => setOfficeForm((f) => ({ ...f, officeName: e.target.value }))}
                        placeholder="Nama kantor"
                        className="bg-white dark:bg-gray-800 border-blue-100/50 dark:border-blue-900/30"
                      />
                    </div>

                    {/* Latitude */}
                    <div className="space-y-2">
                      <Label htmlFor="latitude" className="text-sm font-medium">
                        Latitude
                      </Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="0.000001"
                        value={officeForm.latitude}
                        onChange={(e) => setOfficeForm((f) => ({ ...f, latitude: parseFloat(e.target.value) || 0 }))}
                        className="bg-white dark:bg-gray-800 border-blue-100/50 dark:border-blue-900/30 tabular-nums"
                      />
                    </div>

                    {/* Longitude */}
                    <div className="space-y-2">
                      <Label htmlFor="longitude" className="text-sm font-medium">
                        Longitude
                      </Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="0.000001"
                        value={officeForm.longitude}
                        onChange={(e) => setOfficeForm((f) => ({ ...f, longitude: parseFloat(e.target.value) || 0 }))}
                        className="bg-white dark:bg-gray-800 border-blue-100/50 dark:border-blue-900/30 tabular-nums"
                      />
                    </div>

                    {/* Radius */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Radius (meter)</Label>
                        <Badge variant="outline" className="text-xs px-2 py-0.5 bg-[#1e40af]/10 text-[#1e40af] dark:bg-blue-900/30 dark:text-blue-300 border-[#1e40af]/20">
                          {officeForm.radiusMeter}m
                        </Badge>
                      </div>
                      <Slider
                        value={[officeForm.radiusMeter]}
                        onValueChange={([val]) => setOfficeForm((f) => ({ ...f, radiusMeter: val }))}
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
                        value={officeForm.radiusMeter}
                        onChange={(e) => {
                          const val = parseInt(e.target.value)
                          if (!isNaN(val) && val >= 10 && val <= 1000) {
                            setOfficeForm((f) => ({ ...f, radiusMeter: val }))
                          }
                        }}
                        min={10}
                        max={1000}
                        className="bg-white dark:bg-gray-800 border-blue-100/50 dark:border-blue-900/30 tabular-nums"
                      />
                    </div>

                    {/* Save */}
                    <Button
                      onClick={handleSaveOffice}
                      disabled={isSavingOffice}
                      className="w-full bg-[#1e40af] hover:bg-[#1e3a8a] text-white shadow-lg shadow-blue-500/25"
                    >
                      {isSavingOffice ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Menyimpan...
                        </span>
                      ) : (
                        <>
                          <Save className="size-4 mr-1.5" />
                          Simpan Lokasi
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Map Preview */}
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Pratinjau Lokasi
                    </p>
                    <MapPreview
                      latitude={officeForm.latitude}
                      longitude={officeForm.longitude}
                      radius={officeForm.radiusMeter}
                    />
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="size-3 text-[#1e40af]" />
                      <span>
                        {officeForm.latitude.toFixed(6)}, {officeForm.longitude.toFixed(6)} &bull; Radius: {officeForm.radiusMeter}m
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* =============================================================== */}
          {/* Tab: Jam Kerja                                                  */}
          {/* =============================================================== */}
          <TabsContent value="workhours">
            <Card className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30 shadow-lg shadow-blue-500/5">
              <CardHeader>
                <CardTitle className="text-[#1e40af] dark:text-blue-300 flex items-center gap-2">
                  <Timer className="size-5" />
                  Jam Kerja
                </CardTitle>
                <CardDescription>
                  Atur jam masuk, jam pulang, toleransi keterlambatan, dan hari kerja
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Jam Masuk */}
                  <div className="space-y-2">
                    <Label htmlFor="startTime" className="text-sm font-medium flex items-center gap-1.5">
                      <Clock className="size-3.5 text-emerald-500" />
                      Jam Masuk
                    </Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={workHoursForm.startTime}
                      onChange={(e) => setWorkHoursForm((f) => ({ ...f, startTime: e.target.value }))}
                      className="bg-white dark:bg-gray-800 border-blue-100/50 dark:border-blue-900/30"
                    />
                  </div>

                  {/* Jam Pulang */}
                  <div className="space-y-2">
                    <Label htmlFor="endTime" className="text-sm font-medium flex items-center gap-1.5">
                      <Clock className="size-3.5 text-orange-500" />
                      Jam Pulang
                    </Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={workHoursForm.endTime}
                      onChange={(e) => setWorkHoursForm((f) => ({ ...f, endTime: e.target.value }))}
                      className="bg-white dark:bg-gray-800 border-blue-100/50 dark:border-blue-900/30"
                    />
                  </div>
                </div>

                {/* Toleransi Keterlambatan */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Toleransi Keterlambatan</Label>
                    <Badge variant="outline" className="text-xs px-2 py-0.5 bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800">
                      {workHoursForm.lateTolerance} menit
                    </Badge>
                  </div>
                  <Slider
                    value={[workHoursForm.lateTolerance]}
                    onValueChange={([val]) => setWorkHoursForm((f) => ({ ...f, lateTolerance: val }))}
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
                    value={workHoursForm.lateTolerance}
                    onChange={(e) => {
                      const val = parseInt(e.target.value)
                      if (!isNaN(val) && val >= 0 && val <= 60) {
                        setWorkHoursForm((f) => ({ ...f, lateTolerance: val }))
                      }
                    }}
                    min={0}
                    max={60}
                    className="bg-white dark:bg-gray-800 border-blue-100/50 dark:border-blue-900/30 tabular-nums w-32"
                  />
                </div>

                {/* Hari Kerja */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Hari Kerja</Label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {ALL_DAYS.map((day) => {
                      const isActive = activeWorkDays.includes(day)
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleWorkDay(day)}
                          className={`
                            relative flex flex-col items-center justify-center rounded-xl border p-3 text-sm font-medium transition-all
                            ${
                              isActive
                                ? 'bg-[#1e40af] text-white border-[#1e40af] shadow-md shadow-blue-500/20'
                                : 'bg-white dark:bg-gray-800 text-muted-foreground border-blue-100/50 dark:border-blue-900/30 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-[#1e40af] dark:hover:text-blue-300'
                            }
                          `}
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

                <Separator className="bg-blue-50 dark:bg-blue-900/20" />

                {/* Summary */}
                <div className="rounded-xl border border-blue-100/50 dark:border-blue-900/30 p-4 bg-blue-50/30 dark:bg-blue-900/10 space-y-2">
                  <p className="text-sm font-semibold text-[#1e40af] dark:text-blue-300">Ringkasan Jam Kerja</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Jam Masuk:</span>{' '}
                      <span className="font-medium text-foreground">{workHoursForm.startTime}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Jam Pulang:</span>{' '}
                      <span className="font-medium text-foreground">{workHoursForm.endTime}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Toleransi:</span>{' '}
                      <span className="font-medium text-foreground">{workHoursForm.lateTolerance} menit</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Hari Kerja:</span>{' '}
                      <span className="font-medium text-foreground">{activeWorkDays.length} hari</span>
                    </div>
                  </div>
                </div>

                {/* Save */}
                <Button
                  onClick={handleSaveWorkHours}
                  disabled={isSavingWorkHours}
                  className="w-full bg-[#1e40af] hover:bg-[#1e3a8a] text-white shadow-lg shadow-blue-500/25"
                >
                  {isSavingWorkHours ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Menyimpan...
                    </span>
                  ) : (
                    <>
                      <Save className="size-4 mr-1.5" />
                      Simpan Jam Kerja
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* =============================================================== */}
          {/* Tab: Hari Libur                                                 */}
          {/* =============================================================== */}
          <TabsContent value="holidays">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Add Holiday Form */}
              <Card className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30 shadow-lg shadow-blue-500/5 lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-[#1e40af] dark:text-blue-300 flex items-center gap-2 text-lg">
                    <Plus className="size-5" />
                    Tambah Hari Libur
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="holidayName" className="text-sm font-medium">
                      Nama Hari Libur
                    </Label>
                    <Input
                      id="holidayName"
                      value={holidayForm.name}
                      onChange={(e) => setHolidayForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="contoh: Hari Kemerdekaan"
                      className="bg-white dark:bg-gray-800 border-blue-100/50 dark:border-blue-900/30"
                    />
                  </div>

                  {/* Date */}
                  <div className="space-y-2">
                    <Label htmlFor="holidayDate" className="text-sm font-medium">
                      Tanggal
                    </Label>
                    <Input
                      id="holidayDate"
                      type="date"
                      value={holidayForm.date}
                      onChange={(e) => setHolidayForm((f) => ({ ...f, date: e.target.value }))}
                      className="bg-white dark:bg-gray-800 border-blue-100/50 dark:border-blue-900/30"
                    />
                  </div>

                  {/* Type */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tipe</Label>
                    <Select
                      value={holidayForm.type}
                      onValueChange={(val) => setHolidayForm((f) => ({ ...f, type: val as HolidayType }))}
                    >
                      <SelectTrigger className="bg-white dark:bg-gray-800 border-blue-100/50 dark:border-blue-900/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NASIONAL">Nasional</SelectItem>
                        <SelectItem value="KEAGAMAAN">Keagamaan</SelectItem>
                        <SelectItem value="KHUSUS">Khusus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleAddHoliday}
                    disabled={isAddingHoliday}
                    className="w-full bg-[#1e40af] hover:bg-[#1e3a8a] text-white shadow-lg shadow-blue-500/25"
                  >
                    {isAddingHoliday ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Menambahkan...
                      </span>
                    ) : (
                      <>
                        <Plus className="size-4 mr-1.5" />
                        Tambah Hari Libur
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Holiday List */}
              <Card className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30 shadow-lg shadow-blue-500/5 lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-[#1e40af] dark:text-blue-300 flex items-center gap-2 text-lg">
                        <CalendarDays className="size-5" />
                        Daftar Hari Libur
                      </CardTitle>
                      <CardDescription>{holidays.length} hari libur terdaftar</CardDescription>
                    </div>
                    <Badge className="bg-[#1e40af]/10 text-[#1e40af] dark:bg-blue-900/30 dark:text-blue-300 border-[#1e40af]/20">
                      {holidays.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {holidays.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-2">
                      <CalendarDays className="size-10 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">Belum ada hari libur terdaftar</p>
                    </div>
                  ) : (
                    <ScrollArea className="max-h-[500px]">
                      <div className="space-y-2 pr-2">
                        <AnimatePresence mode="popLayout">
                          {holidays.map((holiday) => (
                            <motion.div
                              key={holiday.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="flex items-center justify-between rounded-xl border border-blue-100/50 dark:border-blue-900/30 bg-white/50 dark:bg-gray-800/30 p-3 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                                  holiday.type === 'NASIONAL'
                                    ? 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400'
                                    : holiday.type === 'KEAGAMAAN'
                                    ? 'bg-purple-50 text-purple-500 dark:bg-purple-900/30 dark:text-purple-400'
                                    : 'bg-amber-50 text-amber-500 dark:bg-amber-900/30 dark:text-amber-400'
                                }`}>
                                  <CalendarDays className="size-5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {holiday.name}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(holiday.date).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                      })}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className={`text-[10px] px-1.5 py-0 ${
                                        holiday.type === 'NASIONAL'
                                          ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                                          : holiday.type === 'KEAGAMAAN'
                                          ? 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800'
                                          : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
                                      }`}
                                    >
                                      {holiday.type === 'NASIONAL' ? 'Nasional' : holiday.type === 'KEAGAMAAN' ? 'Keagamaan' : 'Khusus'}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="shrink-0 h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={() => setDeleteHolidayTarget(holiday)}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* ================================================================= */}
      {/* Delete Holiday Confirmation                                       */}
      {/* ================================================================= */}
      <AlertDialog open={!!deleteHolidayTarget} onOpenChange={(open) => !open && setDeleteHolidayTarget(null)}>
        <AlertDialogContent className="bg-white dark:bg-gray-900 border-red-200/50 dark:border-red-900/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <Trash2 className="size-5" />
              Hapus Hari Libur
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus hari libur{' '}
              <strong>{deleteHolidayTarget?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingHoliday}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteHoliday}
              disabled={isDeletingHoliday}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeletingHoliday ? 'Menghapus...' : 'Ya, Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
