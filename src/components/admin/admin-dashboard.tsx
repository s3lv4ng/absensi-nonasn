'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  CalendarDays,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Settings,
  FileBarChart,
  ClipboardCheck,
  TableProperties,
  TrendingUp,
  Activity,
  Eye,
  PenLine,
} from 'lucide-react'

import { useAppStore } from '@/store'
import type { DashboardStats, AttendanceChart, Attendance } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { ManualAttendanceDialog } from '@/components/admin/manual-attendance-dialog'

// ---------------------------------------------------------------------------
// Types for API response
// ---------------------------------------------------------------------------

interface ReportsResponse {
  stats: DashboardStats & { pendingLeaves?: number }
  chartData: AttendanceChart[]
  recentAttendances: Attendance[]
  todayAttendances: Attendance[]
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
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
  })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function statusColor(status: string) {
  switch (status) {
    case 'HADIR':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
    case 'TELAT':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800'
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

function typeBadge(type: string) {
  return type === 'MASUK'
    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
    : 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800'
}

// ---------------------------------------------------------------------------
// Custom chart tooltip
// ---------------------------------------------------------------------------

function ChartTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-3 py-2 shadow-xl text-xs">
      <p className="font-semibold mb-1 text-foreground">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span
            className="inline-block size-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium text-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  value,
  label,
  colorClass,
  delay = 0,
}: {
  icon: React.ElementType
  value: number | string
  label: string
  colorClass: string
  delay?: number
}) {
  return (
    <motion.div variants={itemVariants} custom={delay}>
      <Card className="relative overflow-hidden bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30 shadow-lg shadow-blue-500/5 hover:shadow-xl hover:shadow-blue-500/10 transition-shadow duration-300">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-3xl font-bold tracking-tight text-foreground">
                {value}
              </p>
              <p className="text-sm text-muted-foreground font-medium">{label}</p>
            </div>
            <div
              className={`size-14 rounded-2xl flex items-center justify-center ${colorClass} shadow-lg`}
            >
              <Icon className="size-7" />
            </div>
          </div>
          {/* Decorative circle */}
          <div
            className={`absolute -right-4 -top-4 size-24 rounded-full opacity-[0.06] ${colorClass}`}
          />
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="bg-white/70 dark:bg-gray-900/60">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="size-14 rounded-2xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart skeleton */}
      <Card className="bg-white/70 dark:bg-gray-900/60">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-72 w-full" />
        </CardContent>
      </Card>

      {/* Table skeleton */}
      <Card className="bg-white/70 dark:bg-gray-900/60">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function AdminDashboard() {
  const setCurrentView = useAppStore((s) => s.setCurrentView)

  const [stats, setStats] = useState<DashboardStats & { pendingLeaves?: number } | null>(null)
  const [chartData, setChartData] = useState<AttendanceChart[]>([])
  const [recentAttendances, setRecentAttendances] = useState<Attendance[]>([])
  const [todayAttendances, setTodayAttendances] = useState<Attendance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [manualDialogOpen, setManualDialogOpen] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const res = await fetch('/api/reports')
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Gagal memuat data dashboard')
      }

      const data: ReportsResponse = await res.json()
      setStats(data.stats)
      setChartData(data.chartData)
      setRecentAttendances(data.recentAttendances)
      setTodayAttendances(data.todayAttendances)
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
      toast.error('Gagal memuat data', {
        description: err.message || 'Terjadi kesalahan saat memuat data dashboard',
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ---- Loading state ----
  if (isLoading) return <DashboardSkeleton />

  // ---- Error state ----
  if (error && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="size-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <UserX className="size-8 text-red-500" />
        </div>
        <p className="text-lg font-semibold text-foreground">Gagal Memuat Data</p>
        <p className="text-sm text-muted-foreground max-w-md text-center">{error}</p>
        <Button onClick={fetchData} className="bg-[#1e40af] hover:bg-[#1e3a8a]">
          Coba Lagi
        </Button>
      </div>
    )
  }

  const safeStats = stats ?? {
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    onLeave: 0,
    pendingLeaves: 0,
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
            Dashboard Admin
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Ringkasan kehadiran pegawai &mdash; {formatDate(new Date().toISOString())}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-[#1e40af] hover:bg-[#1e3a8a] text-white px-3 py-1 text-xs shadow-lg shadow-blue-500/25">
            <Activity className="size-3 mr-1" />
            Live
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="border-blue-200 dark:border-blue-800 text-[#2563eb] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            <TrendingUp className="size-3.5 mr-1" />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* ================================================================= */}
      {/* Stat Cards                                                        */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={Users}
          value={safeStats.totalEmployees}
          label="Total Pegawai"
          colorClass="bg-[#1e40af]/10 text-[#1e40af] dark:bg-blue-900/30 dark:text-blue-400"
        />
        <StatCard
          icon={UserCheck}
          value={safeStats.presentToday}
          label="Hadir Hari Ini"
          colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
        />
        <StatCard
          icon={UserX}
          value={safeStats.absentToday}
          label="Tidak Hadir"
          colorClass="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
        />
        <StatCard
          icon={Clock}
          value={safeStats.lateToday}
          label="Terlambat"
          colorClass="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
        />
        <StatCard
          icon={CalendarDays}
          value={safeStats.onLeave}
          label="Izin / Cuti"
          colorClass="bg-blue-100 text-[#2563eb] dark:bg-blue-900/30 dark:text-blue-400"
        />
      </div>

      {/* ================================================================= */}
      {/* Chart + Map Row                                                   */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ---- Attendance Bar Chart ---- */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30 shadow-lg shadow-blue-500/5 h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-[#1e40af] dark:text-blue-300 flex items-center gap-2">
                    <TrendingUp className="size-5" />
                    Tren Kehadiran
                  </CardTitle>
                  <CardDescription>7 hari terakhir</CardDescription>
                </div>
                <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="inline-block size-2.5 rounded-full bg-emerald-500" />
                    Hadir
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block size-2.5 rounded-full bg-amber-500" />
                    Telat
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block size-2.5 rounded-full bg-[#2563eb]" />
                    Izin
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block size-2.5 rounded-full bg-red-500" />
                    Alpha
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    barCategoryGap="20%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend
                      wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                      iconType="circle"
                      iconSize={8}
                    />
                    <Bar
                      dataKey="hadir"
                      name="Hadir"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={32}
                    />
                    <Bar
                      dataKey="telat"
                      name="Telat"
                      fill="#f59e0b"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={32}
                    />
                    <Bar
                      dataKey="izin"
                      name="Izin"
                      fill="#2563eb"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={32}
                    />
                    <Bar
                      dataKey="alpha"
                      name="Alpha"
                      fill="#ef4444"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={32}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ---- Today's Attendance Map Placeholder ---- */}
        <motion.div variants={itemVariants}>
          <Card className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30 shadow-lg shadow-blue-500/5 h-full flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-[#1e40af] dark:text-blue-300 flex items-center gap-2">
                <MapPin className="size-5" />
                Lokasi Hari Ini
              </CardTitle>
              <CardDescription>
                {todayAttendances.length} absensi tercatat
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pt-0">
              {/* Map visual placeholder */}
              <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/20 border border-blue-200/50 dark:border-blue-800/30 h-32 mb-3 flex items-center justify-center">
                <div className="absolute inset-0 opacity-10">
                  {/* Grid pattern */}
                  <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e40af" strokeWidth="0.5" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>
                <div className="relative flex flex-col items-center gap-1.5 text-[#1e40af]/60 dark:text-blue-400/60">
                  <MapPin className="size-8" />
                  <span className="text-xs font-medium">Peta Lokasi GPS</span>
                </div>
                {/* Floating dots for employees */}
                {todayAttendances.slice(0, 6).map((att, i) => (
                  <motion.div
                    key={att.id}
                    className="absolute"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.1, type: 'spring' }}
                    style={{
                      top: `${20 + ((i * 17) % 60)}%`,
                      left: `${15 + ((i * 23) % 70)}%`,
                    }}
                  >
                    <span
                      className={`flex size-3 rounded-full ring-2 ring-white dark:ring-gray-900 shadow-md ${
                        att.status === 'HADIR'
                          ? 'bg-emerald-500'
                          : att.status === 'TELAT'
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Attendance location list */}
              <ScrollArea className="max-h-44">
                <div className="space-y-2 pr-2">
                  {todayAttendances.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Belum ada absensi hari ini
                    </p>
                  ) : (
                    todayAttendances.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between rounded-lg px-3 py-2 bg-white/50 dark:bg-gray-800/50 border border-blue-50 dark:border-blue-900/20"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`inline-block size-2 rounded-full shrink-0 ${
                              att.status === 'HADIR'
                                ? 'bg-emerald-500'
                                : att.status === 'TELAT'
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                          />
                          <span className="text-sm font-medium truncate">
                            {att.user?.nama ?? 'Unknown'}
                          </span>
                        </div>
                        {att.latitude && att.longitude ? (
                          <a
                            href={`https://www.google.com/maps?q=${att.latitude},${att.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#2563eb] dark:text-blue-400 hover:text-[#1e40af] dark:hover:text-blue-300 shrink-0"
                          >
                            <ExternalLink className="size-3.5" />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">--</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ================================================================= */}
      {/* Recent Attendance Table                                           */}
      {/* ================================================================= */}
      <motion.div variants={itemVariants}>
        <Card className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30 shadow-lg shadow-blue-500/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[#1e40af] dark:text-blue-300 flex items-center gap-2">
                  <Activity className="size-5" />
                  Aktivitas Terkini
                </CardTitle>
                <CardDescription>Absensi terbaru pegawai</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-[#2563eb] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                onClick={() => setCurrentView('admin-attendance')}
              >
                <Eye className="size-4 mr-1" />
                Lihat Semua
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentAttendances.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-2">
                <UserX className="size-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Belum ada data absensi</p>
              </div>
            ) : (
              <ScrollArea className="max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Pegawai</TableHead>
                      <TableHead className="hidden sm:table-cell">NIP</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Waktu</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Confidence</TableHead>
                      <TableHead className="hidden lg:table-cell">Lokasi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentAttendances.map((att, idx) => (
                      <motion.tr
                        key={att.id}
                        className="border-b border-blue-50 dark:border-blue-900/20 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04, duration: 0.3 }}
                      >
                        {/* Pegawai */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-[#1e40af]/10 dark:bg-blue-900/30 flex items-center justify-center text-xs font-bold text-[#1e40af] dark:text-blue-400 shrink-0">
                              {(att.user?.nama ?? '??')
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {att.user?.nama ?? 'Unknown'}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* NIP */}
                        <TableCell className="hidden sm:table-cell">
                          <span className="text-xs text-muted-foreground font-mono">
                            {att.user?.nip ?? '-'}
                          </span>
                        </TableCell>

                        {/* Tipe */}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-2 py-0 ${typeBadge(att.type)}`}
                          >
                            {att.type === 'MASUK' ? 'Masuk' : 'Pulang'}
                          </Badge>
                        </TableCell>

                        {/* Waktu */}
                        <TableCell>
                          <span className="text-sm tabular-nums">
                            {formatTime(att.createdAt)}
                          </span>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-2 py-0 ${statusColor(att.status)}`}
                          >
                            {att.status}
                          </Badge>
                        </TableCell>

                        {/* Confidence */}
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="w-14 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${Math.round(att.confidence * 100)}%`,
                                  backgroundColor:
                                    att.confidence >= 0.8
                                      ? '#10b981'
                                      : att.confidence >= 0.5
                                      ? '#f59e0b'
                                      : '#ef4444',
                                }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {Math.round(att.confidence * 100)}%
                            </span>
                          </div>
                        </TableCell>

                        {/* Lokasi */}
                        <TableCell className="hidden lg:table-cell">
                          {att.latitude && att.longitude ? (
                            <a
                              href={`https://www.google.com/maps?q=${att.latitude},${att.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-[#2563eb] dark:text-blue-400 hover:text-[#1e40af] dark:hover:text-blue-300 hover:underline transition-colors"
                            >
                              <MapPin className="size-3" />
                              GPS
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ================================================================= */}
      {/* Quick Actions                                                     */}
      {/* ================================================================= */}
      <motion.div variants={itemVariants}>
        <Card className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30 shadow-lg shadow-blue-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-[#1e40af] dark:text-blue-300 text-lg">
              Aksi Cepat
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <QuickActionButton
                icon={PenLine}
                label="Absensi Manual"
                description="Input manual"
                onClick={() => setManualDialogOpen(true)}
                colorClass="bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400"
                hoverClass="hover:bg-teal-200 dark:hover:bg-teal-900/40"
              />
              <QuickActionButton
                icon={Users}
                label="Kelola Pegawai"
                description="Data & face ID"
                onClick={() => setCurrentView('admin-employees')}
                colorClass="bg-[#1e40af]/10 text-[#1e40af] dark:bg-blue-900/30 dark:text-blue-400"
                hoverClass="hover:bg-[#1e40af]/20 dark:hover:bg-blue-900/40"
              />
              <QuickActionButton
                icon={Settings}
                label="Pengaturan"
                description="Jam & lokasi"
                onClick={() => setCurrentView('admin-settings')}
                colorClass="bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400"
                hoverClass="hover:bg-gray-200 dark:hover:bg-gray-700/50"
              />
              <QuickActionButton
                icon={TableProperties}
                label="Rekap Absen"
                description="Cetak rekap"
                onClick={() => setCurrentView('admin-rekap-absen')}
                colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                hoverClass="hover:bg-emerald-200 dark:hover:bg-emerald-900/40"
              />
              <QuickActionButton
                icon={ClipboardCheck}
                label="Persetujuan Izin"
                description={`${safeStats.pendingLeaves ?? 0} menunggu`}
                onClick={() => setCurrentView('admin-leaves')}
                colorClass="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                hoverClass="hover:bg-amber-200 dark:hover:bg-amber-900/40"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ================================================================= */}
      {/* Manual Attendance Dialog                                          */}
      {/* ================================================================= */}
      <ManualAttendanceDialog
        open={manualDialogOpen}
        onOpenChange={setManualDialogOpen}
        onSuccess={fetchData}
      />
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Quick Action Button
// ---------------------------------------------------------------------------

function QuickActionButton({
  icon: Icon,
  label,
  description,
  onClick,
  colorClass,
  hoverClass,
}: {
  icon: React.ElementType
  label: string
  description: string
  onClick: () => void
  colorClass: string
  hoverClass: string
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`flex flex-col items-center gap-2.5 rounded-xl border border-blue-100/50 dark:border-blue-900/30 bg-white/50 dark:bg-gray-800/30 p-4 cursor-pointer transition-colors ${hoverClass}`}
    >
      <div className={`size-11 rounded-xl flex items-center justify-center ${colorClass}`}>
        <Icon className="size-5" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
      </div>
    </motion.button>
  )
}
