'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  LogIn,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plane,
  Building2,
  Stethoscope,
  Clock,
  Sun,
  PartyPopper,
  Moon,
  Timer,
  FileText,
  UserX,
  Coffee,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────────
type StatusType =
  | 'HADIR'
  | 'TELAT'
  | 'IZIN'
  | 'CUTI'
  | 'SAKIT'
  | 'DINAS_LUAR'
  | 'DINAS_DALAM'
  | 'ALPHA'
  | 'LIBUR'
  | 'WEEKEND'
  | 'MENUNGGU'
  | 'NON_AKTIF'
  | 'PULANG_CEPAT'
  | 'SETENGAH_HARI'

interface CalendarDayData {
  day: number
  date: string
  dayOfWeek: number
  isWeekend: boolean
  isWorkDay: boolean
  status: string
  statusType: StatusType
  holidayName: string | null
  masukTime: { hours: number; minutes: number } | null
  pulangTime: { hours: number; minutes: number } | null
  masukStatus: string | null
  pulangStatus: string | null
  isManual: boolean
  leaveType: string | null
  leaveReason: string | null
  lateMinutes: number | null
  earlyMinutes: number | null
}

interface CalendarSummary {
  hadir: number
  telat: number
  izin: number
  cuti: number
  sakit: number
  dinasLuar: number
  dinasDalam: number
  alpha: number
  libur: number
  pulangCepat: number
  setengahHari: number
  totalHariKerja: number
}

interface CalendarResponse {
  calendarDays: CalendarDayData[]
  summary: CalendarSummary
  month: number
  year: number
  employee: {
    id: string
    nama: string
    nip: string
    shift: { name: string; startTime: string; endTime: string } | null
  }
}

// ─── Status Configuration ────────────────────────────────────────────
const statusConfig: Record<StatusType, {
  label: string
  shortLabel: string
  icon: React.ComponentType<{ className?: string }>
  bgColor: string
  textColor: string
  borderColor: string
  dotColor: string
  gradientBg: string
}> = {
  HADIR: {
    label: 'Hadir',
    shortLabel: 'H',
    icon: CheckCircle2,
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/40',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    borderColor: 'border-emerald-300 dark:border-emerald-800',
    dotColor: 'bg-emerald-500',
    gradientBg: 'from-emerald-500 to-emerald-600',
  },
  TELAT: {
    label: 'Terlambat',
    shortLabel: 'T',
    icon: AlertTriangle,
    bgColor: 'bg-amber-100 dark:bg-amber-900/40',
    textColor: 'text-amber-700 dark:text-amber-300',
    borderColor: 'border-amber-300 dark:border-amber-800',
    dotColor: 'bg-amber-500',
    gradientBg: 'from-amber-500 to-amber-600',
  },
  IZIN: {
    label: 'Izin',
    shortLabel: 'I',
    icon: FileText,
    bgColor: 'bg-sky-100 dark:bg-sky-900/40',
    textColor: 'text-sky-700 dark:text-sky-300',
    borderColor: 'border-sky-300 dark:border-sky-800',
    dotColor: 'bg-sky-500',
    gradientBg: 'from-sky-500 to-sky-600',
  },
  CUTI: {
    label: 'Cuti',
    shortLabel: 'C',
    icon: Plane,
    bgColor: 'bg-violet-100 dark:bg-violet-900/40',
    textColor: 'text-violet-700 dark:text-violet-300',
    borderColor: 'border-violet-300 dark:border-violet-800',
    dotColor: 'bg-violet-500',
    gradientBg: 'from-violet-500 to-violet-600',
  },
  SAKIT: {
    label: 'Sakit',
    shortLabel: 'S',
    icon: Stethoscope,
    bgColor: 'bg-rose-100 dark:bg-rose-900/40',
    textColor: 'text-rose-700 dark:text-rose-300',
    borderColor: 'border-rose-300 dark:border-rose-800',
    dotColor: 'bg-rose-500',
    gradientBg: 'from-rose-500 to-rose-600',
  },
  DINAS_LUAR: {
    label: 'Dinas Luar',
    shortLabel: 'DL',
    icon: Plane,
    bgColor: 'bg-teal-100 dark:bg-teal-900/40',
    textColor: 'text-teal-700 dark:text-teal-300',
    borderColor: 'border-teal-300 dark:border-teal-800',
    dotColor: 'bg-teal-500',
    gradientBg: 'from-teal-500 to-teal-600',
  },
  DINAS_DALAM: {
    label: 'Dinas Dalam',
    shortLabel: 'DD',
    icon: Building2,
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/40',
    textColor: 'text-cyan-700 dark:text-cyan-300',
    borderColor: 'border-cyan-300 dark:border-cyan-800',
    dotColor: 'bg-cyan-500',
    gradientBg: 'from-cyan-500 to-cyan-600',
  },
  ALPHA: {
    label: 'Alpha',
    shortLabel: 'A',
    icon: XCircle,
    bgColor: 'bg-red-100 dark:bg-red-900/40',
    textColor: 'text-red-700 dark:text-red-300',
    borderColor: 'border-red-300 dark:border-red-800',
    dotColor: 'bg-red-500',
    gradientBg: 'from-red-500 to-red-600',
  },
  LIBUR: {
    label: 'Libur',
    shortLabel: 'L',
    icon: PartyPopper,
    bgColor: 'bg-orange-100 dark:bg-orange-900/40',
    textColor: 'text-orange-700 dark:text-orange-300',
    borderColor: 'border-orange-300 dark:border-orange-800',
    dotColor: 'bg-orange-500',
    gradientBg: 'from-orange-500 to-orange-600',
  },
  WEEKEND: {
    label: 'Akhir Pekan',
    shortLabel: 'WE',
    icon: Moon,
    bgColor: 'bg-slate-100 dark:bg-slate-800/40',
    textColor: 'text-slate-500 dark:text-slate-400',
    borderColor: 'border-slate-200 dark:border-slate-700',
    dotColor: 'bg-slate-400',
    gradientBg: 'from-slate-400 to-slate-500',
  },
  MENUNGGU: {
    label: 'Menunggu',
    shortLabel: '—',
    icon: Clock,
    bgColor: 'bg-gray-50 dark:bg-gray-800/20',
    textColor: 'text-gray-400 dark:text-gray-500',
    borderColor: 'border-gray-200 dark:border-gray-700',
    dotColor: 'bg-gray-300',
    gradientBg: 'from-gray-300 to-gray-400',
  },
  NON_AKTIF: {
    label: 'Non Aktif',
    shortLabel: '—',
    icon: UserX,
    bgColor: 'bg-gray-50 dark:bg-gray-800/20',
    textColor: 'text-gray-400 dark:text-gray-500',
    borderColor: 'border-gray-200 dark:border-gray-700',
    dotColor: 'bg-gray-300',
    gradientBg: 'from-gray-300 to-gray-400',
  },
  PULANG_CEPAT: {
    label: 'Pulang Cepat',
    shortLabel: 'PC',
    icon: Timer,
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/40',
    textColor: 'text-yellow-700 dark:text-yellow-300',
    borderColor: 'border-yellow-300 dark:border-yellow-800',
    dotColor: 'bg-yellow-500',
    gradientBg: 'from-yellow-500 to-yellow-600',
  },
  SETENGAH_HARI: {
    label: 'Belum Pulang',
    shortLabel: '½',
    icon: Coffee,
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/40',
    textColor: 'text-indigo-700 dark:text-indigo-300',
    borderColor: 'border-indigo-300 dark:border-indigo-800',
    dotColor: 'bg-indigo-500',
    gradientBg: 'from-indigo-500 to-indigo-600',
  },
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

// ─── Component ───────────────────────────────────────────────────────
export function AttendanceCalendar() {
  const { user } = useAuthStore()

  const now = new Date()
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1)
  const [currentYear, setCurrentYear] = useState(now.getFullYear())
  const [calendarData, setCalendarData] = useState<CalendarResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<CalendarDayData | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const fetchCalendar = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await fetch(
        `/api/attendance/calendar?month=${currentMonth}&year=${currentYear}`
      )
      if (res.ok) {
        const data: CalendarResponse = await res.json()
        setCalendarData(data)
      } else {
        toast.error('Gagal memuat data kalender')
      }
    } catch {
      toast.error('Gagal memuat data kalender')
    } finally {
      setIsLoading(false)
    }
  }, [currentMonth, currentYear])

  useEffect(() => {
    fetchCalendar()
  }, [fetchCalendar])

  const navigateMonth = (direction: -1 | 1) => {
    let newMonth = currentMonth + direction
    let newYear = currentYear

    if (newMonth < 1) {
      newMonth = 12
      newYear--
    } else if (newMonth > 12) {
      newMonth = 1
      newYear++
    }

    setCurrentMonth(newMonth)
    setCurrentYear(newYear)
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentMonth(today.getMonth() + 1)
    setCurrentYear(today.getFullYear())
  }

  const handleDayClick = (day: CalendarDayData) => {
    if (day.statusType === 'WEEKEND' || day.statusType === 'MENUNGGU' || day.statusType === 'NON_AKTIF') return
    setSelectedDay(day)
    setDetailOpen(true)
  }

  // Calendar grid computation
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay()
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
  const today = new Date()
  const isCurrentMonth = currentMonth === today.getMonth() + 1 && currentYear === today.getFullYear()

  // Build grid cells
  const gridCells: (CalendarDayData | null)[] = []
  // Fill empty cells before the first day
  for (let i = 0; i < firstDayOfMonth; i++) {
    gridCells.push(null)
  }
  // Fill day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const dayData = calendarData?.calendarDays.find((cd) => cd.day === d) || null
    gridCells.push(dayData)
  }

  const formatTimeStr = (time: { hours: number; minutes: number } | null) => {
    if (!time) return '--:--'
    return `${String(time.hours).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')}`
  }

  const summary = calendarData?.summary

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
            <h3 className="text-lg font-bold text-[#1e3a8a] dark:text-blue-300 flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Kalender Kehadiran
            </h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="border-[#1e40af] text-[#1e40af] hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/50 w-fit"
          >
            <CalendarDays className="mr-1.5 h-4 w-4" />
            Hari Ini
          </Button>
        </div>
      </motion.div>

      {/* Month Navigation Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="bg-gradient-to-br from-[#1e40af] to-[#2563eb] text-white border-0 shadow-xl shadow-blue-500/20 overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdjJILTEweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')] opacity-50" />
          <CardContent className="p-4 sm:p-6 relative z-10">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateMonth(-1)}
                className="text-white/80 hover:text-white hover:bg-white/10 h-10 w-10"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="text-center">
                <h3 className="text-xl sm:text-2xl font-bold">
                  {MONTH_NAMES[currentMonth - 1]}
                </h3>
                <p className="text-blue-200 text-sm">{currentYear}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateMonth(1)}
                className="text-white/80 hover:text-white hover:bg-white/10 h-10 w-10"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            {/* Mini Summary */}
            {summary && (
              <div className="mt-4 grid grid-cols-4 sm:grid-cols-7 gap-2">
                <MiniStat label="Hadir" value={summary.hadir} color="bg-emerald-400" />
                <MiniStat label="Telat" value={summary.telat} color="bg-amber-400" />
                <MiniStat label="Izin" value={summary.izin} color="bg-sky-400" />
                <MiniStat label="Cuti" value={summary.cuti} color="bg-violet-400" />
                <MiniStat label="Sakit" value={summary.sakit} color="bg-rose-400" />
                <MiniStat label="DL" value={summary.dinasLuar} color="bg-teal-400" />
                <MiniStat label="Alpha" value={summary.alpha} color="bg-red-400" />
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Calendar Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-blue-100/50 dark:border-blue-900/30 shadow-lg">
          <CardContent className="p-3 sm:p-6">
            {isLoading ? (
              <div className="space-y-4">
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={`header-${i}`} className="h-8 rounded-lg" />
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 35 }).map((_, i) => (
                    <Skeleton key={`cell-${i}`} className="h-16 sm:h-20 rounded-xl" />
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {DAY_NAMES.map((name, i) => (
                    <div
                      key={name}
                      className={`text-center text-xs font-semibold py-2 ${
                        i === 0 || i === 6
                          ? 'text-red-400 dark:text-red-400'
                          : 'text-[#1e40af] dark:text-blue-400'
                      }`}
                    >
                      {name}
                    </div>
                  ))}
                </div>

                {/* Calendar days grid */}
                <div className="grid grid-cols-7 gap-1">
                  <AnimatePresence mode="popLayout">
                    {gridCells.map((cell, idx) => {
                      if (!cell) {
                        return (
                          <div
                            key={`empty-${idx}`}
                            className="h-16 sm:h-20 rounded-xl"
                          />
                        )
                      }

                      const config = statusConfig[cell.statusType]
                      const isToday = isCurrentMonth && cell.day === today.getDate()
                      const isClickable = !['WEEKEND', 'MENUNGGU', 'NON_AKTIF'].includes(cell.statusType)

                      return (
                        <motion.div
                          key={`day-${cell.day}`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2, delay: idx * 0.01 }}
                          className={`
                            relative h-16 sm:h-20 rounded-xl p-1 sm:p-1.5 transition-all duration-200
                            ${isClickable ? 'cursor-pointer hover:scale-105 hover:shadow-md active:scale-95' : ''}
                            ${isToday ? 'ring-2 ring-[#1e40af] ring-offset-1 dark:ring-offset-gray-900' : ''}
                            ${cell.isWeekend ? 'bg-slate-50/50 dark:bg-slate-800/20' : ''}
                            ${config.bgColor}
                            border ${config.borderColor}
                          `}
                          onClick={() => isClickable && handleDayClick(cell)}
                        >
                          <div className="flex flex-col items-center h-full">
                            {/* Day number */}
                            <span
                              className={`text-xs sm:text-sm font-bold leading-tight ${
                                isToday
                                  ? 'text-[#1e40af] dark:text-blue-300'
                                  : cell.isWeekend
                                    ? 'text-slate-400 dark:text-slate-500'
                                    : config.textColor
                              }`}
                            >
                              {cell.day}
                            </span>

                            {/* Status dot / indicator */}
                            <div className="flex-1 flex items-center justify-center">
                              {cell.statusType !== 'WEEKEND' && cell.statusType !== 'MENUNGGU' && cell.statusType !== 'NON_AKTIF' ? (
                                <div className="flex flex-col items-center gap-0.5">
                                  <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${config.dotColor} shadow-sm`} />
                                  <span className={`text-[8px] sm:text-[9px] font-semibold ${config.textColor} hidden sm:block`}>
                                    {config.shortLabel}
                                  </span>
                                </div>
                              ) : null}
                            </div>

                            {/* Today indicator */}
                            {isToday && (
                              <div className="absolute -top-0.5 -right-0.5">
                                <span className="flex h-3 w-3 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-[#1e40af] text-[6px] sm:text-[8px] text-white font-bold">
                                  •
                                </span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-blue-100/50 dark:border-blue-900/30">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-[#1e40af] dark:text-blue-400 mb-3 uppercase tracking-wider">
              Keterangan
            </p>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {(['HADIR', 'TELAT', 'IZIN', 'CUTI', 'SAKIT', 'DINAS_LUAR', 'DINAS_DALAM', 'ALPHA', 'LIBUR', 'PULANG_CEPAT', 'SETENGAH_HARI'] as StatusType[]).map((type) => {
                const config = statusConfig[type]
                const Icon = config.icon
                return (
                  <TooltipProvider key={type}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                          <div className={`w-2.5 h-2.5 rounded-full ${config.dotColor}`} />
                          <span className="text-[10px] sm:text-xs font-medium text-foreground">
                            {config.label}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="flex items-center gap-1.5">
                          <Icon className="h-3.5 w-3.5" />
                          <span className="text-xs">{config.label}</span>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Monthly Summary Cards */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <SummaryCard
              icon={CheckCircle2}
              label="Hadir"
              value={summary.hadir}
              gradient="from-emerald-500 to-emerald-600"
              total={summary.totalHariKerja}
            />
            <SummaryCard
              icon={AlertTriangle}
              label="Terlambat"
              value={summary.telat}
              gradient="from-amber-500 to-amber-600"
              total={summary.totalHariKerja}
            />
            <SummaryCard
              icon={Stethoscope}
              label="Sakit"
              value={summary.sakit}
              gradient="from-rose-500 to-rose-600"
              total={summary.totalHariKerja}
            />
            <SummaryCard
              icon={Plane}
              label="Dinas Luar"
              value={summary.dinasLuar}
              gradient="from-teal-500 to-teal-600"
              total={summary.totalHariKerja}
            />
            <SummaryCard
              icon={Building2}
              label="Dinas Dalam"
              value={summary.dinasDalam}
              gradient="from-cyan-500 to-cyan-600"
              total={summary.totalHariKerja}
            />
            <SummaryCard
              icon={FileText}
              label="Izin"
              value={summary.izin}
              gradient="from-sky-500 to-sky-600"
              total={summary.totalHariKerja}
            />
            <SummaryCard
              icon={Plane}
              label="Cuti"
              value={summary.cuti}
              gradient="from-violet-500 to-violet-600"
              total={summary.totalHariKerja}
            />
            <SummaryCard
              icon={XCircle}
              label="Alpha"
              value={summary.alpha}
              gradient="from-red-500 to-red-600"
              total={summary.totalHariKerja}
            />
            <SummaryCard
              icon={PartyPopper}
              label="Libur"
              value={summary.libur}
              gradient="from-orange-500 to-orange-600"
            />
            <SummaryCard
              icon={Timer}
              label="Pulang Cepat"
              value={summary.pulangCepat}
              gradient="from-yellow-500 to-yellow-600"
              total={summary.totalHariKerja}
            />
          </div>
        </motion.div>
      )}

      {/* Day Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1e3a8a] dark:text-blue-300">
              <CalendarDays className="h-5 w-5" />
              {selectedDay && (
                <>
                  {new Date(selectedDay.date).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedDay && (
            <DayDetailContent day={selectedDay} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-lg bg-white/10 backdrop-blur-sm px-2 py-1.5">
      <span className="text-base sm:text-lg font-bold text-white">{value}</span>
      <span className="text-[9px] sm:text-[10px] text-blue-200 font-medium">{label}</span>
      <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
    </div>
  )
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  gradient,
  total,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  gradient: string
  total?: number
}) {
  return (
    <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-blue-100/50 dark:border-blue-900/30 overflow-hidden">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <div className={`size-9 sm:size-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${gradient} text-white shadow-md shrink-0`}>
            <Icon className="size-4 sm:size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-xl font-bold text-foreground">{value}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{label}</p>
            {total !== undefined && total > 0 && (
              <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                <div
                  className={`h-1 rounded-full bg-gradient-to-r ${gradient}`}
                  style={{ width: `${Math.min((value / total) * 100, 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DayDetailContent({ day }: { day: CalendarDayData }) {
  const config = statusConfig[day.statusType]
  const Icon = config.icon

  const formatTimeStr = (time: { hours: number; minutes: number } | null) => {
    if (!time) return '--:--'
    return `${String(time.hours).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')}`
  }

  return (
    <div className="space-y-4">
      {/* Status Badge */}
      <div className={`flex items-center gap-3 p-4 rounded-xl ${config.bgColor} border ${config.borderColor}`}>
        <div className={`size-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${config.gradientBg} text-white shadow-md`}>
          <Icon className="size-5" />
        </div>
        <div>
          <p className={`font-bold ${config.textColor}`}>{day.status}</p>
          {day.holidayName && (
            <p className="text-xs text-muted-foreground">{day.holidayName}</p>
          )}
        </div>
      </div>

      {/* Time Details */}
      {(day.masukTime || day.pulangTime) && (
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-1.5 mb-1.5">
              <LogIn className="size-3.5 text-[#1e40af] dark:text-blue-400" />
              <span className="text-[10px] font-semibold text-[#1e40af] dark:text-blue-400 uppercase">Masuk</span>
            </div>
            <p className="text-lg font-bold text-foreground tabular-nums">
              {formatTimeStr(day.masukTime)}
            </p>
            {day.masukStatus && (
              <Badge
                variant="outline"
                className={`text-[9px] mt-1 ${
                  day.masukStatus === 'TELAT'
                    ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800'
                    : 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800'
                }`}
              >
                {day.masukStatus === 'TELAT' ? (
                  <><AlertTriangle className="mr-0.5 h-2.5 w-2.5" /> Telat {day.lateMinutes ? `${day.lateMinutes}m` : ''}</>
                ) : (
                  <><CheckCircle2 className="mr-0.5 h-2.5 w-2.5" /> Tepat Waktu</>
                )}
              </Badge>
            )}
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-1.5 mb-1.5">
              <LogOut className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase">Pulang</span>
            </div>
            <p className="text-lg font-bold text-foreground tabular-nums">
              {formatTimeStr(day.pulangTime)}
            </p>
            {day.pulangStatus && (
              <Badge
                variant="outline"
                className={`text-[9px] mt-1 ${
                  day.pulangStatus === 'PULANG_CEPAT'
                    ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800'
                    : 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800'
                }`}
              >
                {day.pulangStatus === 'PULANG_CEPAT' ? (
                  <><Timer className="mr-0.5 h-2.5 w-2.5" /> Cepat {day.earlyMinutes ? `${day.earlyMinutes}m` : ''}</>
                ) : (
                  <><CheckCircle2 className="mr-0.5 h-2.5 w-2.5" /> Normal</>
                )}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Leave Info */}
      {day.leaveType && (
        <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
          <div className="flex items-center gap-1.5 mb-1">
            <FileText className="size-3.5 text-violet-600 dark:text-violet-400" />
            <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 uppercase">
              {day.leaveType}
            </span>
          </div>
          {day.leaveReason && (
            <p className="text-xs text-muted-foreground">{day.leaveReason}</p>
          )}
        </div>
      )}

      {/* Manual entry badge */}
      {day.isManual && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <Sun className="size-3.5 text-amber-500" />
          <span className="text-[10px] font-medium text-amber-700 dark:text-amber-300">
            Diinput manual oleh Admin
          </span>
        </div>
      )}
    </div>
  )
}
