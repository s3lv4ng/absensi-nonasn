'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useClock } from '@/hooks'
import { useAuthStore, useAppStore } from '@/store'
import { CameraView } from '@/components/face-recognition/camera-view'
import { LocationValidator } from '@/components/gps/location-validator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Clock,
  LogIn,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  CalendarDays,
  TrendingUp,
  Users,
  Timer,
  Fingerprint,
  MapPin,
  Building2,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Attendance, Office, AttendanceType } from '@/types'

interface TodayAttendance {
  masuk: Attendance | null
  pulang: Attendance | null
  hasClockedIn: boolean
  hasClockedOut: boolean
  allToday: Attendance[]
}

interface MonthStats {
  totalHadir: number
  totalTelat: number
  persentaseKehadiran: number
  totalRecords: number
}

export function EmployeeDashboard() {
  const { user } = useAuthStore()
  const clock = useClock()

  const [todayData, setTodayData] = useState<TodayAttendance | null>(null)
  const [monthStats, setMonthStats] = useState<MonthStats>({
    totalHadir: 0,
    totalTelat: 0,
    persentaseKehadiran: 0,
    totalRecords: 0,
  })
  const [offices, setOffices] = useState<Office[]>([])
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>('')
  const [isLoadingToday, setIsLoadingToday] = useState(true)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [isLoadingOffices, setIsLoadingOffices] = useState(true)

  // Attendance dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [attendanceType, setAttendanceType] = useState<AttendanceType>('MASUK')
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [capturedConfidence, setCapturedConfidence] = useState<number>(0)
  const [validatedLocation, setValidatedLocation] = useState<{
    latitude: number
    longitude: number
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get selected office data
  const selectedOffice = offices.find((o) => o.id === selectedOfficeId) || null

  // Fetch today's attendance
  const fetchTodayAttendance = useCallback(async () => {
    try {
      setIsLoadingToday(true)
      const res = await fetch('/api/attendance/today')
      if (res.ok) {
        const data = await res.json()
        setTodayData(data)
      }
    } catch {
      toast.error('Gagal memuat data absensi hari ini')
    } finally {
      setIsLoadingToday(false)
    }
  }, [])

  // Fetch month stats
  const fetchMonthStats = useCallback(async () => {
    try {
      setIsLoadingStats(true)
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split('T')[0]
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0]

      const res = await fetch(
        `/api/attendance?startDate=${startOfMonth}&endDate=${endOfMonth}&limit=100`
      )
      if (res.ok) {
        const data = await res.json()
        const attendances: Attendance[] = data.attendances || []

        // Count unique days with MASUK attendance
        const masukDays = new Set(
          attendances
            .filter((a) => a.type === 'MASUK')
            .map((a) => new Date(a.createdAt).toDateString())
        )
        const telatCount = attendances.filter(
          (a) => a.type === 'MASUK' && a.status === 'TELAT'
        ).length

        // Calculate working days so far this month
        const today = new Date()
        const workDaysSoFar = getWorkingDaysSoFar(
          today.getFullYear(),
          today.getMonth()
        )

        setMonthStats({
          totalHadir: masukDays.size,
          totalTelat: telatCount,
          persentaseKehadiran:
            workDaysSoFar > 0
              ? Math.round((masukDays.size / workDaysSoFar) * 100)
              : 0,
          totalRecords: attendances.length,
        })
      }
    } catch {
      toast.error('Gagal memuat statistik kehadiran')
    } finally {
      setIsLoadingStats(false)
    }
  }, [])

  // Fetch office locations
  const fetchOffices = useCallback(async () => {
    try {
      setIsLoadingOffices(true)
      const res = await fetch('/api/offices')
      if (res.ok) {
        const data = await res.json()
        const officeList: Office[] = data.offices || []
        setOffices(officeList)
        // Auto-select first office if only one exists
        if (officeList.length === 1) {
          setSelectedOfficeId(officeList[0].id)
        }
      }
    } catch {
      // Offices might not be available, silently fail
    } finally {
      setIsLoadingOffices(false)
    }
  }, [])

  useEffect(() => {
    fetchTodayAttendance()
    fetchMonthStats()
    fetchOffices()
  }, [fetchTodayAttendance, fetchMonthStats, fetchOffices])

  // Helper to calculate working days so far
  function getWorkingDaysSoFar(year: number, month: number): number {
    const today = new Date()
    const lastDay = Math.min(
      today.getDate(),
      new Date(year, month + 1, 0).getDate()
    )
    let workDays = 0
    for (let d = 1; d <= lastDay; d++) {
      const date = new Date(year, month, d)
      const dayOfWeek = date.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && date <= today) {
        workDays++
      }
    }
    return workDays
  }

  const handleOpenAttendanceDialog = (type: AttendanceType) => {
    setAttendanceType(type)
    setCapturedPhoto(null)
    setCapturedConfidence(0)
    setValidatedLocation(null)
    setDialogOpen(true)
  }

  const handleCapture = (photo: string, confidence: number) => {
    setCapturedPhoto(photo)
    setCapturedConfidence(confidence)
  }

  const handleLocationValid = (location: {
    latitude: number
    longitude: number
  }) => {
    setValidatedLocation(location)
  }

  const canSubmit = capturedPhoto && validatedLocation && selectedOffice

  const handleSubmitAttendance = async () => {
    if (!canSubmit) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: attendanceType,
          latitude: validatedLocation!.latitude,
          longitude: validatedLocation!.longitude,
          photo: capturedPhoto,
          confidence: capturedConfidence,
          officeId: selectedOfficeId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan absensi')
      }

      toast.success(
        attendanceType === 'MASUK'
          ? 'Absen masuk berhasil!'
          : 'Absen pulang berhasil!',
        {
          description:
            attendanceType === 'MASUK' && data.attendance?.status === 'TELAT'
              ? 'Anda tercatat terlambat hari ini'
              : undefined,
        }
      )

      setDialogOpen(false)
      fetchTodayAttendance()
      fetchMonthStats()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Gagal menyimpan absensi'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#1e3a8a] dark:text-blue-300">
              Selamat Datang, {user?.nama?.split(' ')[0]}
            </h2>
            <p className="text-sm text-muted-foreground">
              Status kehadiran Anda hari ini
            </p>
          </div>
          <Badge
            className="bg-[#1e40af] text-white px-3 py-1 text-xs"
          >
            <span className="mr-1.5 inline-block size-2 animate-pulse rounded-full bg-white" />
            Live
          </Badge>
        </div>
      </motion.div>

      {/* Clock & Date */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="bg-gradient-to-br from-[#1e40af] to-[#2563eb] text-white border-0 shadow-xl shadow-blue-500/25 overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdjJILTEweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')] opacity-50" />
          <CardContent className="p-6 sm:p-8 relative z-10">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="flex items-center gap-2 text-blue-200">
                <Clock className="h-5 w-5" />
                <span className="text-sm font-medium uppercase tracking-wider">
                  Waktu Sekarang
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl sm:text-7xl font-bold tabular-nums tracking-tight">
                  {clock.hours}
                </span>
                <span className="text-5xl sm:text-7xl font-bold animate-pulse">:</span>
                <span className="text-5xl sm:text-7xl font-bold tabular-nums tracking-tight">
                  {clock.minutes}
                </span>
                <span className="text-5xl sm:text-7xl font-bold animate-pulse">:</span>
                <span className="text-5xl sm:text-7xl font-bold tabular-nums tracking-tight">
                  {clock.seconds}
                </span>
              </div>
              <div className="flex items-center gap-2 text-blue-100">
                <CalendarDays className="h-4 w-4" />
                <span className="text-sm font-medium">{clock.dateFormatted}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Attendance Status & Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Clock In Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card
            className={`overflow-hidden border-blue-100/50 dark:border-blue-900/30 ${
              todayData?.hasClockedIn
                ? 'bg-gradient-to-br from-[#1e40af] to-blue-600 text-white border-0 shadow-xl shadow-blue-500/20'
                : 'bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm'
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`size-11 rounded-xl flex items-center justify-center ${
                    todayData?.hasClockedIn
                      ? 'bg-white/20'
                      : 'bg-[#1e40af]/10 dark:bg-blue-900/30'
                  }`}
                >
                  <LogIn
                    className={`size-5 ${
                      todayData?.hasClockedIn
                        ? 'text-white'
                        : 'text-[#1e40af] dark:text-blue-400'
                    }`}
                  />
                </div>
                <div>
                  <p
                    className={`text-sm font-medium ${
                      todayData?.hasClockedIn
                        ? 'text-blue-100'
                        : 'text-muted-foreground'
                    }`}
                  >
                    Absen Masuk
                  </p>
                  {isLoadingToday ? (
                    <Skeleton className="h-7 w-20 mt-1" />
                  ) : (
                    <p
                      className={`text-2xl font-bold ${
                        todayData?.hasClockedIn ? '' : 'text-muted-foreground'
                      }`}
                    >
                      {todayData?.masuk
                        ? formatTime(todayData.masuk.createdAt)
                        : '--:--'}
                    </p>
                  )}
                </div>
              </div>
              {todayData?.masuk && (
                <div className="flex items-center gap-2">
                  {todayData.masuk.status === 'TELAT' ? (
                    <Badge className="bg-amber-500/90 text-white text-[10px] border-0">
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      Terlambat
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-500/90 text-white text-[10px] border-0">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Tepat Waktu
                    </Badge>
                  )}
                </div>
              )}
              {!todayData?.hasClockedIn && !isLoadingToday && (
                <Button
                  onClick={() => handleOpenAttendanceDialog('MASUK')}
                  className="mt-4 w-full bg-[#1e40af] hover:bg-[#1e3a8a] text-white shadow-lg shadow-blue-500/25 h-12 text-base font-semibold"
                  size="lg"
                >
                  <Fingerprint className="mr-2 h-5 w-5" />
                  Absen Masuk
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Clock Out Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card
            className={`overflow-hidden border-blue-100/50 dark:border-blue-900/30 ${
              todayData?.hasClockedOut
                ? 'bg-gradient-to-br from-emerald-600 to-emerald-500 text-white border-0 shadow-xl shadow-emerald-500/20'
                : 'bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm'
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`size-11 rounded-xl flex items-center justify-center ${
                    todayData?.hasClockedOut
                      ? 'bg-white/20'
                      : todayData?.hasClockedIn
                        ? 'bg-emerald-100 dark:bg-emerald-900/30'
                        : 'bg-slate-100 dark:bg-slate-800'
                  }`}
                >
                  <LogOut
                    className={`size-5 ${
                      todayData?.hasClockedOut
                        ? 'text-white'
                        : todayData?.hasClockedIn
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-400'
                    }`}
                  />
                </div>
                <div>
                  <p
                    className={`text-sm font-medium ${
                      todayData?.hasClockedOut
                        ? 'text-emerald-100'
                        : 'text-muted-foreground'
                    }`}
                  >
                    Absen Pulang
                  </p>
                  {isLoadingToday ? (
                    <Skeleton className="h-7 w-20 mt-1" />
                  ) : (
                    <p
                      className={`text-2xl font-bold ${
                        todayData?.hasClockedOut
                          ? ''
                          : 'text-muted-foreground'
                      }`}
                    >
                      {todayData?.pulang
                        ? formatTime(todayData.pulang.createdAt)
                        : '--:--'}
                    </p>
                  )}
                </div>
              </div>
              {todayData?.hasClockedOut && (
                <Badge className="bg-white/20 text-white text-[10px] border-0">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Selesai
                </Badge>
              )}
              {todayData?.hasClockedIn &&
                !todayData?.hasClockedOut &&
                !isLoadingToday && (
                  <Button
                    onClick={() => handleOpenAttendanceDialog('PULANG')}
                    className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/25 h-12 text-base font-semibold"
                    size="lg"
                  >
                    <LogOut className="mr-2 h-5 w-5" />
                    Absen Pulang
                  </Button>
                )}
              {!todayData?.hasClockedIn && !isLoadingToday && (
                <p className="text-xs text-muted-foreground mt-4 italic">
                  Absen masuk terlebih dahulu
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Statistics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-blue-100/50 dark:border-blue-900/30">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="size-11 rounded-xl flex items-center justify-center bg-[#1e40af]/10 text-[#1e40af] dark:bg-blue-900/30 dark:text-blue-400">
                <Users className="size-5" />
              </div>
              <div>
                {isLoadingStats ? (
                  <Skeleton className="h-7 w-10" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">
                    {monthStats.totalHadir}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Total Hadir Bulan Ini
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-blue-100/50 dark:border-blue-900/30">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="size-11 rounded-xl flex items-center justify-center bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                <Timer className="size-5" />
              </div>
              <div>
                {isLoadingStats ? (
                  <Skeleton className="h-7 w-10" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">
                    {monthStats.totalTelat}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Total Terlambat
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-blue-100/50 dark:border-blue-900/30">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="size-11 rounded-xl flex items-center justify-center bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <TrendingUp className="size-5" />
              </div>
              <div>
                {isLoadingStats ? (
                  <Skeleton className="h-7 w-14" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">
                    {monthStats.persentaseKehadiran}%
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Persentase Kehadiran
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Attendance Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1e3a8a] dark:text-blue-300">
              {attendanceType === 'MASUK' ? (
                <LogIn className="h-5 w-5" />
              ) : (
                <LogOut className="h-5 w-5" />
              )}
              {attendanceType === 'MASUK' ? 'Absen Masuk' : 'Absen Pulang'}
            </DialogTitle>
            <DialogDescription>
              Verifikasi wajah dan lokasi Anda untuk melakukan absensi{' '}
              {attendanceType === 'MASUK' ? 'masuk' : 'pulang'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Office Location Selector */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-[#1e40af] dark:text-blue-400">
                <Building2 className="h-4 w-4" />
                Pilih Lokasi Kantor
              </div>
              {isLoadingOffices ? (
                <Skeleton className="h-10 w-full" />
              ) : offices.length === 0 ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Belum ada lokasi kantor yang dikonfigurasi. Hubungi administrator.
                  </p>
                </div>
              ) : (
                <Select
                  value={selectedOfficeId}
                  onValueChange={(value) => {
                    setSelectedOfficeId(value)
                    // Reset location validation when office changes
                    setValidatedLocation(null)
                  }}
                >
                  <SelectTrigger className="border-blue-200 focus:border-[#1e40af] dark:border-blue-800">
                    <SelectValue placeholder="Pilih lokasi kantor Anda..." />
                  </SelectTrigger>
                  <SelectContent>
                    {offices.map((office) => (
                      <SelectItem key={office.id} value={office.id}>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-[#1e40af] dark:text-blue-400" />
                          <span>{office.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({office.radiusMeter}m radius)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {selectedOffice && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground p-2 rounded-lg bg-blue-50/50 dark:bg-blue-950/20">
                  <MapPin className="h-3.5 w-3.5 text-[#1e40af] dark:text-blue-400 shrink-0" />
                  <span>
                    {selectedOffice.address || selectedOffice.name}
                    {' — '}
                    {selectedOffice.latitude.toFixed(4)}, {selectedOffice.longitude.toFixed(4)}
                    {' — '}
                    Radius: {selectedOffice.radiusMeter}m
                  </span>
                </div>
              )}
            </div>

            {/* Validation checklist */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm">
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full ${
                    selectedOfficeId
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                  }`}
                >
                  {selectedOfficeId ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <span className="text-[10px] font-bold">0</span>
                  )}
                </div>
                <span
                  className={
                    selectedOfficeId
                      ? 'text-emerald-700 dark:text-emerald-300 font-medium'
                      : 'text-muted-foreground'
                  }
                >
                  Pilih Lokasi Kantor
                </span>
                {selectedOfficeId && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  >
                    {selectedOffice?.name}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full ${
                    capturedPhoto
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                  }`}
                >
                  {capturedPhoto ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <span className="text-[10px] font-bold">1</span>
                  )}
                </div>
                <span
                  className={
                    capturedPhoto
                      ? 'text-emerald-700 dark:text-emerald-300 font-medium'
                      : 'text-muted-foreground'
                  }
                >
                  Verifikasi Wajah
                </span>
                {capturedPhoto && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  >
                    {(capturedConfidence * 100).toFixed(0)}%
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full ${
                    validatedLocation
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                  }`}
                >
                  {validatedLocation ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <span className="text-[10px] font-bold">2</span>
                  )}
                </div>
                <span
                  className={
                    validatedLocation
                      ? 'text-emerald-700 dark:text-emerald-300 font-medium'
                      : 'text-muted-foreground'
                  }
                >
                  Validasi Lokasi GPS
                </span>
                {validatedLocation && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  >
                    Terverifikasi
                  </Badge>
                )}
              </div>
            </div>

            {/* Camera & Location validators side by side on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <CameraView onCapture={handleCapture} />
              {selectedOffice ? (
                <LocationValidator
                  onLocationValid={handleLocationValid}
                  officeLat={selectedOffice.latitude}
                  officeLon={selectedOffice.longitude}
                  radiusMeter={selectedOffice.radiusMeter}
                />
              ) : (
                <Card className="border-amber-200 bg-amber-50/80 dark:border-amber-800 dark:bg-amber-950/30">
                  <CardContent className="p-6 flex flex-col items-center justify-center gap-3 min-h-[200px]">
                    <Building2 className="h-8 w-8 text-amber-500" />
                    <p className="text-sm text-center text-amber-700 dark:text-amber-300">
                      Pilih lokasi kantor terlebih dahulu
                    </p>
                    <p className="text-xs text-center text-muted-foreground">
                      Validasi GPS akan aktif setelah memilih lokasi
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Submit button */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                onClick={handleSubmitAttendance}
                disabled={!canSubmit || isSubmitting}
                className={`min-w-[140px] ${
                  attendanceType === 'MASUK'
                    ? 'bg-[#1e40af] hover:bg-[#1e3a8a]'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    {attendanceType === 'MASUK' ? (
                      <LogIn className="mr-2 h-4 w-4" />
                    ) : (
                      <LogOut className="mr-2 h-4 w-4" />
                    )}
                    Submit Absensi
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
