'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Users, CheckCircle2, XCircle, Clock, AlertTriangle, LogIn, LogOut,
  Briefcase, Heart, Stethoscope, Plane, FileText, UserX, Loader2,
  Search, RefreshCw, Filter, ChevronLeft, ChevronRight, MapPin, Navigation,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import type { EmployeeMonitorEntry } from '@/types'

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

const formatTime = (dateStr: string | null) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

const statusConfig: Record<
  EmployeeMonitorEntry['status'],
  {
    label: string
    color: string
    bgColor: string
    icon: typeof CheckCircle2
  }
> = {
  HADIR: {
    label: 'Hadir',
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800',
    icon: CheckCircle2,
  },
  TELAT: {
    label: 'Terlambat',
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-100 dark:bg-amber-900/40 border-amber-200 dark:border-amber-800',
    icon: AlertTriangle,
  },
  IZIN: {
    label: 'Izin',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-100 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800',
    icon: FileText,
  },
  CUTI: {
    label: 'Cuti',
    color: 'text-purple-700 dark:text-purple-300',
    bgColor: 'bg-purple-100 dark:bg-purple-900/40 border-purple-200 dark:border-purple-800',
    icon: Plane,
  },
  SAKIT: {
    label: 'Sakit',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-900/40 border-red-200 dark:border-red-800',
    icon: Stethoscope,
  },
  DINAS: {
    label: 'Dinas',
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-100 dark:bg-amber-900/40 border-amber-200 dark:border-amber-800',
    icon: Briefcase,
  },
  ALPHA: {
    label: 'Alpha',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-900/40 border-red-200 dark:border-red-800',
    icon: UserX,
  },
  BELUM_ABSEN: {
    label: 'Belum Absen',
    color: 'text-slate-500 dark:text-slate-400',
    bgColor: 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700',
    icon: Clock,
  },
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function MonitoringSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>

      {/* Summary cards skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>

      {/* Search & filter skeleton */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Skeleton className="h-10 w-full sm:w-64 rounded-md" />
        <Skeleton className="h-10 w-full sm:w-48 rounded-md" />
      </div>

      {/* Employee list skeleton */}
      <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-blue-100/50 dark:border-blue-900/30">
        <CardContent className="p-0">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-6 py-4 border-b border-blue-50 dark:border-blue-900/20"
            >
              <Skeleton className="size-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Summary Card
// ---------------------------------------------------------------------------

interface SummaryCardProps {
  label: string
  count: number
  icon: typeof Users
  colorClass: string
  bgClass: string
  ringClass: string
}

function SummaryCard({ label, count, icon: Icon, colorClass, bgClass, ringClass }: SummaryCardProps) {
  return (
    <motion.div variants={itemVariants}>
      <Card
        className={`${bgClass} backdrop-blur-xl border-0 shadow-lg hover:shadow-xl transition-all overflow-hidden relative`}
      >
        <div className="absolute inset-0 bg-white/20 dark:bg-white/5 pointer-events-none" />
        <CardContent className="p-4 sm:p-5 relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium opacity-80 mb-1">{label}</p>
              <p className="text-2xl sm:text-3xl font-bold tabular-nums">{count}</p>
            </div>
            <div
              className={`size-11 sm:size-12 rounded-xl ${ringClass} flex items-center justify-center shadow-sm`}
            >
              <Icon className="size-5 sm:size-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Employee Card (Mobile)
// ---------------------------------------------------------------------------

function EmployeeCard({ employee, onClick }: { employee: EmployeeMonitorEntry; onClick: () => void }) {
  const config = statusConfig[employee.status]
  const StatusIcon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      onClick={onClick}
      className="rounded-xl border border-blue-100/50 dark:border-blue-900/30 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm p-4 shadow-sm hover:shadow-md hover:bg-white/80 dark:hover:bg-gray-900/80 transition-all cursor-pointer"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Avatar className="size-11 ring-2 ring-blue-100 dark:ring-blue-900/40 shrink-0">
          <AvatarImage src={employee.photo ?? undefined} alt={employee.nama} />
          <AvatarFallback className="bg-[#1e40af]/10 text-[#1e40af] dark:bg-blue-900/30 dark:text-blue-400 font-bold text-xs">
            {getInitials(employee.nama)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Name & Status */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground truncate">{employee.nama}</p>
            <Badge
              variant="outline"
              className={`text-[10px] px-2 py-0.5 shrink-0 ${config.color} ${config.bgColor}`}
            >
              <StatusIcon className="size-3 mr-1" />
              {config.label}
            </Badge>
          </div>

          {/* NIP & Unit */}
          <p className="text-xs text-muted-foreground font-mono">{employee.nip}</p>
          {employee.unitKerja && (
            <p className="text-xs text-muted-foreground truncate">{employee.unitKerja}</p>
          )}

          {/* Times */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
            {employee.masukTime && (
              <span className="flex items-center gap-1">
                <LogIn className="size-3 text-emerald-500" />
                {formatTime(employee.masukTime)}
              </span>
            )}
            {employee.pulangTime && (
              <span className="flex items-center gap-1">
                <LogOut className="size-3 text-orange-500" />
                {formatTime(employee.pulangTime)}
              </span>
            )}
            {!employee.masukTime && !employee.pulangTime && (
              <span className="text-muted-foreground/60 italic">Belum ada absensi</span>
            )}
          </div>

          {/* Leave type badge */}
          {employee.leaveType && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800"
            >
              {employee.leaveType}
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function EmployeeMonitoring() {
  const [employees, setEmployees] = useState<EmployeeMonitorEntry[]>([])
  const [summary, setSummary] = useState({
    hadir: 0,
    telat: 0,
    izin: 0,
    cuti: 0,
    sakit: 0,
    dinas: 0,
    belumAbsen: 0,
    total: 0,
  })
  const [date, setDate] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Pagination state
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Selected employee for map dialog
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeMonitorEntry | null>(null)

  // Auto refresh
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // ---- Fetch data ----
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))

      const res = await fetch(`/api/attendance/monitor?${params.toString()}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Gagal memuat data kehadiran')
      }

      const data = await res.json()
      setEmployees(data.employees ?? [])
      setSummary(data.summary ?? { hadir: 0, telat: 0, izin: 0, cuti: 0, sakit: 0, dinas: 0, belumAbsen: 0, total: 0 })
      setDate(data.date ?? new Date().toISOString().split('T')[0])
      setTotalPages(data.totalPages ?? 1)
      setTotal(data.total ?? 0)
      setLastRefresh(new Date())
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
      toast.error('Gagal memuat data', {
        description: err.message || 'Terjadi kesalahan saat memuat data kehadiran',
      })
    } finally {
      setIsLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refresh every 60 seconds
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      fetchData()
    }, 60000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchData])

  // ---- Filtered employees ----
  const filteredEmployees = employees.filter((emp) => {
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchesName = emp.nama.toLowerCase().includes(q)
      const matchesNip = emp.nip.toLowerCase().includes(q)
      if (!matchesName && !matchesNip) return false
    }

    // Status filter
    if (statusFilter !== 'all') {
      switch (statusFilter) {
        case 'hadir':
          if (emp.status !== 'HADIR') return false
          break
        case 'telat':
          if (emp.status !== 'TELAT') return false
          break
        case 'izin_cuti':
          if (!['IZIN', 'CUTI', 'SAKIT', 'DINAS'].includes(emp.status)) return false
          break
        case 'belum_absen':
          if (emp.status !== 'BELUM_ABSEN') return false
          break
      }
    }

    return true
  })

  // Sort: attended (by time asc) → on leave → belum absen (by name)
  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    const statusPriority: Record<string, number> = {
      HADIR: 0,
      TELAT: 0,
      IZIN: 1,
      CUTI: 1,
      SAKIT: 1,
      DINAS: 1,
      BELUM_ABSEN: 2,
      ALPHA: 2,
    }

    const priorityA = statusPriority[a.status] ?? 1
    const priorityB = statusPriority[b.status] ?? 1

    if (priorityA !== priorityB) return priorityA - priorityB

    // Within same priority group
    if (priorityA === 0) {
      // Sort by masukTime ascending (earliest first)
      if (a.masukTime && b.masukTime) return a.masukTime.localeCompare(b.masukTime)
      if (a.masukTime) return -1
      if (b.masukTime) return 1
      return a.nama.localeCompare(b.nama)
    }

    if (priorityA === 2) {
      // Sort belum absen alphabetically
      return a.nama.localeCompare(b.nama)
    }

    // Leave types - sort alphabetically
    return a.nama.localeCompare(b.nama)
  })

  // ---- Format date display ----
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return ''
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  // ---- Loading state ----
  if (isLoading && employees.length === 0) return <MonitoringSkeleton />

  // ---- Error state ----
  if (error && employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="size-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <XCircle className="size-8 text-red-500" />
        </div>
        <p className="text-lg font-semibold text-foreground">Gagal Memuat Data</p>
        <p className="text-sm text-muted-foreground max-w-md text-center">{error}</p>
        <Button onClick={fetchData} className="bg-[#1e40af] hover:bg-[#1e3a8a]">
          Coba Lagi
        </Button>
      </div>
    )
  }

  const izinCutiSakit = summary.izin + summary.cuti + summary.sakit

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
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1e3a8a] dark:text-blue-300 tracking-tight">
            Monitor Kehadiran
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pantau status kehadiran rekan kerja hari ini
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDateDisplay(date)} &bull; Terakhir diperbarui:{' '}
            {lastRefresh.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-[#1e40af] hover:bg-[#1e3a8a] text-white px-3 py-1 text-xs shadow-lg shadow-blue-500/25">
            <RefreshCw className="size-3 mr-1" />
            Auto-refresh 60s
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
            className="border-blue-200 dark:border-blue-800 text-[#2563eb] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            <RefreshCw className={`size-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* ================================================================= */}
      {/* Summary Cards                                                     */}
      {/* ================================================================= */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard
          label="Hadir"
          count={summary.hadir}
          icon={CheckCircle2}
          colorClass="text-emerald-700 dark:text-emerald-300"
          bgClass="bg-emerald-50/80 dark:bg-emerald-950/40"
          ringClass="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400"
        />
        <SummaryCard
          label="Terlambat"
          count={summary.telat}
          icon={AlertTriangle}
          colorClass="text-amber-700 dark:text-amber-300"
          bgClass="bg-amber-50/80 dark:bg-amber-950/40"
          ringClass="bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400"
        />
        <SummaryCard
          label="Izin / Cuti / Sakit"
          count={izinCutiSakit}
          icon={FileText}
          colorClass="text-blue-700 dark:text-blue-300"
          bgClass="bg-blue-50/80 dark:bg-blue-950/40"
          ringClass="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
        />
        <SummaryCard
          label="Belum Absen"
          count={summary.belumAbsen}
          icon={Clock}
          colorClass="text-slate-600 dark:text-slate-400"
          bgClass="bg-slate-50/80 dark:bg-slate-950/40"
          ringClass="bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400"
        />
      </motion.div>

      {/* ================================================================= */}
      {/* Search & Filter                                                   */}
      {/* ================================================================= */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama atau NIP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-blue-100/50 dark:border-blue-900/30 focus:border-[#2563eb] dark:focus:border-blue-600"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-blue-100/50 dark:border-blue-900/30">
            <Filter className="size-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="hadir">Hadir</SelectItem>
            <SelectItem value="telat">Telat</SelectItem>
            <SelectItem value="izin_cuti">Izin / Cuti / Sakit</SelectItem>
            <SelectItem value="belum_absen">Belum Absen</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* ================================================================= */}
      {/* Results count                                                     */}
      {/* ================================================================= */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Menampilkan {sortedEmployees.length} dari {summary.total} pegawai
        </p>
        {isLoading && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            Memperbarui...
          </div>
        )}
      </motion.div>

      {/* ================================================================= */}
      {/* Desktop Table                                                     */}
      {/* ================================================================= */}
      <motion.div variants={itemVariants} className="hidden md:block">
        <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-blue-100/50 dark:border-blue-900/30 shadow-lg shadow-blue-500/5 overflow-hidden">
          <ScrollArea className="max-h-[calc(100vh-460px)]">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-blue-50/50 dark:bg-blue-900/10">
                  <TableHead>Pegawai</TableHead>
                  <TableHead className="hidden lg:table-cell">NIP</TableHead>
                  <TableHead className="hidden xl:table-cell">Unit Kerja</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Masuk</TableHead>
                  <TableHead>Pulang</TableHead>
                  <TableHead className="hidden lg:table-cell">Keterangan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {sortedEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Users className="size-10 text-muted-foreground/30" />
                          <p className="text-sm text-muted-foreground">
                            {searchQuery || statusFilter !== 'all'
                              ? 'Tidak ada pegawai yang cocok dengan filter'
                              : 'Belum ada data kehadiran hari ini'}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedEmployees.map((emp, idx) => {
                      const config = statusConfig[emp.status]
                      const StatusIcon = config.icon

                      return (
                        <motion.tr
                          key={emp.userId}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ delay: idx * 0.03, duration: 0.25 }}
                          className="border-b border-blue-50 dark:border-blue-900/20 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors cursor-pointer"
                          onClick={() => setSelectedEmployee(emp)}
                        >
                          {/* Pegawai */}
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="size-8 ring-1 ring-blue-100 dark:ring-blue-900/40 shrink-0">
                                <AvatarImage src={emp.photo ?? undefined} alt={emp.nama} />
                                <AvatarFallback className="bg-[#1e40af]/10 text-[#1e40af] dark:bg-blue-900/30 dark:text-blue-400 text-[10px] font-bold">
                                  {getInitials(emp.nama)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate max-w-[160px]">
                                  {emp.nama}
                                </p>
                                {emp.jabatan && (
                                  <p className="text-[10px] text-muted-foreground truncate max-w-[160px]">
                                    {emp.jabatan}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          {/* NIP */}
                          <TableCell className="hidden lg:table-cell">
                            <span className="text-xs font-mono text-muted-foreground">
                              {emp.nip}
                            </span>
                          </TableCell>

                          {/* Unit Kerja */}
                          <TableCell className="hidden xl:table-cell">
                            <span className="text-xs text-muted-foreground truncate max-w-[160px] block">
                              {emp.unitKerja ?? '-'}
                            </span>
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-2 py-0.5 ${config.color} ${config.bgColor}`}
                            >
                              <StatusIcon className="size-3 mr-1" />
                              {config.label}
                            </Badge>
                          </TableCell>

                          {/* Masuk */}
                          <TableCell>
                            <span className="text-sm tabular-nums flex items-center gap-1">
                              {emp.masukTime ? (
                                <>
                                  <LogIn className="size-3 text-emerald-500" />
                                  {formatTime(emp.masukTime)}
                                </>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </span>
                          </TableCell>

                          {/* Pulang */}
                          <TableCell>
                            <span className="text-sm tabular-nums flex items-center gap-1">
                              {emp.pulangTime ? (
                                <>
                                  <LogOut className="size-3 text-orange-500" />
                                  {formatTime(emp.pulangTime)}
                                </>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </span>
                          </TableCell>

                          {/* Keterangan */}
                          <TableCell className="hidden lg:table-cell">
                            {emp.leaveType ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800"
                              >
                                {emp.leaveType}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
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
        {sortedEmployees.length === 0 ? (
          <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-blue-100/50 dark:border-blue-900/30">
            <CardContent className="py-16 flex flex-col items-center space-y-2">
              <Users className="size-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                {searchQuery || statusFilter !== 'all'
                  ? 'Tidak ada pegawai yang cocok dengan filter'
                  : 'Belum ada data kehadiran hari ini'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="max-h-[calc(100vh-500px)]">
            <div className="space-y-3 pr-1">
              <AnimatePresence mode="popLayout">
                {sortedEmployees.map((emp) => (
                  <EmployeeCard key={emp.userId} employee={emp} onClick={() => setSelectedEmployee(emp)} />
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
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
      {/* Total indicator - Sticky at bottom                                */}
      {/* ================================================================= */}
      <motion.div variants={itemVariants} className="sticky bottom-0 z-10">
        <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Users className="size-3.5" />
                Total {total} pegawai
              </span>
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  {summary.hadir} Hadir
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-amber-500" />
                  {summary.telat} Telat
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-blue-500" />
                  {izinCutiSakit} Izin/Cuti
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-slate-400" />
                  {summary.belumAbsen} Belum
                </span>
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ================================================================= */}
      {/* Map Dialog                                                        */}
      {/* ================================================================= */}
      <Dialog open={!!selectedEmployee} onOpenChange={(open) => !open && setSelectedEmployee(null)}>
        <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-900 border-blue-100/50 dark:border-blue-900/30">
          <DialogHeader>
            <DialogTitle className="text-[#1e40af] dark:text-blue-300 flex items-center gap-2">
              <MapPin className="size-5" />
              Lokasi Absensi - {selectedEmployee?.nama}
            </DialogTitle>
            <DialogDescription>
              Detail lokasi absensi {selectedEmployee?.nama}
            </DialogDescription>
          </DialogHeader>

          {selectedEmployee && (
            <div className="space-y-4">
              {/* Employee Info */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-900/30">
                <Avatar className="size-11 ring-2 ring-blue-100 dark:ring-blue-900/40 shrink-0">
                  <AvatarImage src={selectedEmployee.photo ?? undefined} alt={selectedEmployee.nama} />
                  <AvatarFallback className="bg-[#1e40af]/10 text-[#1e40af] dark:bg-blue-900/30 dark:text-blue-400 font-bold text-xs">
                    {getInitials(selectedEmployee.nama)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground">{selectedEmployee.nama}</p>
                  <p className="text-xs text-muted-foreground font-mono">{selectedEmployee.nip}</p>
                  <Badge variant="outline" className={`text-[10px] px-2 py-0 mt-1 ${statusConfig[selectedEmployee.status].color} ${statusConfig[selectedEmployee.status].bgColor}`}>
                    {statusConfig[selectedEmployee.status].label}
                  </Badge>
                </div>
              </div>

              {/* Absen Masuk */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Absen Masuk</p>
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100/50 dark:border-emerald-900/30">
                  <div>
                    <p className="text-sm font-semibold">{selectedEmployee.masukTime ? formatTime(selectedEmployee.masukTime) : 'Belum absen'}</p>
                    {selectedEmployee.masukLat != null && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {selectedEmployee.masukLat.toFixed(6)}, {selectedEmployee.masukLng!.toFixed(6)}
                      </p>
                    )}
                  </div>
                  {selectedEmployee.masukLat != null && (
                    <a
                      href={`https://www.google.com/maps?q=${selectedEmployee.masukLat},${selectedEmployee.masukLng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e40af] hover:bg-[#1e3a8a] text-white text-xs font-medium transition-colors"
                    >
                      <Navigation className="size-3" />
                      Maps
                    </a>
                  )}
                </div>
              </div>

              {/* Absen Pulang */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Absen Pulang</p>
                <div className="flex items-center justify-between p-3 rounded-xl bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100/50 dark:border-orange-900/30">
                  <div>
                    <p className="text-sm font-semibold">{selectedEmployee.pulangTime ? formatTime(selectedEmployee.pulangTime) : 'Belum absen'}</p>
                    {selectedEmployee.pulangLat != null && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {selectedEmployee.pulangLat.toFixed(6)}, {selectedEmployee.pulangLng!.toFixed(6)}
                      </p>
                    )}
                  </div>
                  {selectedEmployee.pulangLat != null && (
                    <a
                      href={`https://www.google.com/maps?q=${selectedEmployee.pulangLat},${selectedEmployee.pulangLng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e40af] hover:bg-[#1e3a8a] text-white text-xs font-medium transition-colors"
                    >
                      <Navigation className="size-3" />
                      Maps
                    </a>
                  )}
                </div>
              </div>

              {/* Map Preview */}
              {(() => {
                const lat = selectedEmployee.pulangLat ?? selectedEmployee.masukLat
                const lng = selectedEmployee.pulangLng ?? selectedEmployee.masukLng
                if (lat != null) {
                  return (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Peta Lokasi</p>
                      <div className="rounded-xl overflow-hidden border border-blue-100/50 dark:border-blue-900/30">
                        <iframe
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng!-0.005}%2C${lat!-0.003}%2C${lng!+0.005}%2C${lat!+0.003}&layer=mapnik&marker=${lat}%2C${lng}`}
                          width="100%"
                          height="250"
                          style={{ border: 0 }}
                          loading="lazy"
                          title="Lokasi Absensi"
                        />
                      </div>
                    </div>
                  )
                }
                return null
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
