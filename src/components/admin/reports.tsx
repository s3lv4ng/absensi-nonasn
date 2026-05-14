'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import {
  CalendarDays,
  TrendingUp,
  Users,
  Clock,
  FileBarChart,
  FileSpreadsheet,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  AlertTriangle,
  UserX,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EmployeeSummary {
  userId: string
  nip: string
  nama: string
  unitKerja: string | null
  hadir: number
  telat: number
  izin: number
  cuti: number
  alpha: number
  persentase: number
}

interface DailyRate {
  date: string
  rate: number
  hadir: number
  telat: number
  total: number
}

interface ReportsData {
  totalWorkingDays: number
  averageAttendanceRate: number
  mostLateEmployees: string[]
  dailyRates: DailyRate[]
  employeeSummaries: EmployeeSummary[]
}

type SortField = 'nama' | 'nip' | 'unitKerja' | 'hadir' | 'telat' | 'izin' | 'cuti' | 'alpha' | 'persentase'
type SortDirection = 'asc' | 'desc'

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

const MONTHS = [
  { value: '1', label: 'Januari' },
  { value: '2', label: 'Februari' },
  { value: '3', label: 'Maret' },
  { value: '4', label: 'April' },
  { value: '5', label: 'Mei' },
  { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' },
  { value: '8', label: 'Agustus' },
  { value: '9', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
]

function getYearOptions(): { value: string; label: string }[] {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let y = currentYear; y >= currentYear - 5; y--) {
    years.push({ value: String(y), label: String(y) })
  }
  return years
}

function percentageColor(pct: number): string {
  if (pct > 90) return 'text-emerald-600 dark:text-emerald-400'
  if (pct > 75) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

function percentageBg(pct: number): string {
  if (pct > 90) return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
  if (pct > 75) return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
  return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
}

// ---------------------------------------------------------------------------
// Custom chart tooltip
// ---------------------------------------------------------------------------

function ChartTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const data = payload[0]?.payload as DailyRate | undefined
  return (
    <div className="rounded-lg border bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-3 py-2.5 shadow-xl text-xs">
      <p className="font-semibold mb-1.5 text-foreground">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="inline-block size-2.5 rounded-full bg-[#2563eb]" />
          <span className="text-muted-foreground">Tingkat Kehadiran:</span>
          <span className="font-semibold text-foreground">{data?.rate ?? 0}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block size-2.5 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">Hadir:</span>
          <span className="font-medium text-foreground">{data?.hadir ?? 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block size-2.5 rounded-full bg-amber-500" />
          <span className="text-muted-foreground">Telat:</span>
          <span className="font-medium text-foreground">{data?.telat ?? 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block size-2.5 rounded-full bg-gray-400" />
          <span className="text-muted-foreground">Total Pegawai:</span>
          <span className="font-medium text-foreground">{data?.total ?? 0}</span>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="bg-white/70 dark:bg-gray-900/60">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="size-14 rounded-2xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-white/70 dark:bg-gray-900/60">
        <CardHeader>
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-4 w-36" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-72 w-full" />
        </CardContent>
      </Card>

      <Card className="bg-white/70 dark:bg-gray-900/60">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sort Icon
// ---------------------------------------------------------------------------

function SortIcon({ field, sortField, sortDirection }: { field: SortField; sortField: SortField; sortDirection: SortDirection }) {
  if (field !== sortField) return <ArrowUpDown className="size-3 ml-1 opacity-40" />
  return sortDirection === 'asc'
    ? <ArrowUp className="size-3 ml-1 text-[#2563eb]" />
    : <ArrowDown className="size-3 ml-1 text-[#2563eb]" />
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function AdminReports() {
  const now = new Date()
  const [month, setMonth] = useState(String(now.getMonth() + 1))
  const [year, setYear] = useState(String(now.getFullYear()))
  const [data, setData] = useState<ReportsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField>('persentase')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [reportPage, setReportPage] = useState(1)
  const reportLimit = 20

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const res = await fetch(`/api/reports?month=${month}&year=${year}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Gagal memuat data laporan')
      }

      const json = await res.json()
      setData({
        totalWorkingDays: json.totalWorkingDays ?? 0,
        averageAttendanceRate: json.averageAttendanceRate ?? 0,
        mostLateEmployees: json.mostLateEmployees ?? [],
        dailyRates: json.dailyRates ?? [],
        employeeSummaries: json.employeeSummaries ?? [],
      })
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
      toast.error('Gagal memuat laporan', {
        description: err.message || 'Terjadi kesalahan saat memuat data laporan',
      })
    } finally {
      setIsLoading(false)
    }
  }, [month, year])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection(field === 'persentase' ? 'desc' : 'asc')
    }
  }

  const sortedSummaries = useMemo(() => {
    if (!data?.employeeSummaries) return []
    const summaries = [...data.employeeSummaries]
    summaries.sort((a, b) => {
      let cmp = 0
      const aVal = a[sortField]
      const bVal = b[sortField]
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        cmp = aVal.localeCompare(bVal)
      } else {
        cmp = (aVal as number) - (bVal as number)
      }
      return sortDirection === 'asc' ? cmp : -cmp
    })
    return summaries
  }, [data?.employeeSummaries, sortField, sortDirection])

  // Pagination for employee summaries
  const totalReportPages = Math.max(1, Math.ceil(sortedSummaries.length / reportLimit))
  const paginatedSummaries = useMemo(() => {
    const start = (reportPage - 1) * reportLimit
    return sortedSummaries.slice(start, start + reportLimit)
  }, [sortedSummaries, reportPage, reportLimit])

  // Reset page when sort/filter changes
  useEffect(() => {
    setReportPage(1)
  }, [sortField, sortDirection, month, year])

  const chartData = useMemo(() => {
    if (!data?.dailyRates) return []
    return data.dailyRates.map((d) => ({
      ...d,
      name: d.date,
    }))
  }, [data?.dailyRates])

  const monthLabel = MONTHS.find((m) => m.value === month)?.label ?? month

  // ---- Loading state ----
  if (isLoading && !data) return <ReportsSkeleton />

  // ---- Error state ----
  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="size-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <UserX className="size-8 text-red-500" />
        </div>
        <p className="text-lg font-semibold text-foreground">Gagal Memuat Laporan</p>
        <p className="text-sm text-muted-foreground max-w-md text-center">{error}</p>
        <Button onClick={fetchData} className="bg-[#1e40af] hover:bg-[#1e3a8a]">
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
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1e40af] dark:text-blue-300 tracking-tight">
            Laporan Kehadiran
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Rekap data kehadiran pegawai &mdash; {monthLabel} {year}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-[140px] border-blue-200 dark:border-blue-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[100px] border-blue-200 dark:border-blue-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getYearOptions().map((y) => (
                <SelectItem key={y.value} value={y.value}>
                  {y.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
      {/* Overview Stats                                                    */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div variants={itemVariants}>
          <Card className="relative overflow-hidden bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30 shadow-lg shadow-blue-500/5 hover:shadow-xl hover:shadow-blue-500/10 transition-shadow duration-300">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-3xl font-bold tracking-tight text-foreground">
                    {data?.totalWorkingDays ?? 0}
                  </p>
                  <p className="text-sm text-muted-foreground font-medium">Hari Kerja</p>
                </div>
                <div className="size-14 rounded-2xl flex items-center justify-center bg-[#1e40af]/10 text-[#1e40af] dark:bg-blue-900/30 dark:text-blue-400 shadow-lg">
                  <CalendarDays className="size-7" />
                </div>
              </div>
              <div className="absolute -right-4 -top-4 size-24 rounded-full opacity-[0.06] bg-[#1e40af]/10" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="relative overflow-hidden bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30 shadow-lg shadow-blue-500/5 hover:shadow-xl hover:shadow-blue-500/10 transition-shadow duration-300">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-3xl font-bold tracking-tight text-foreground">
                    {data?.averageAttendanceRate ?? 0}%
                  </p>
                  <p className="text-sm text-muted-foreground font-medium">Rata-rata Kehadiran</p>
                </div>
                <div className="size-14 rounded-2xl flex items-center justify-center bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 shadow-lg">
                  <TrendingUp className="size-7" />
                </div>
              </div>
              <div className="absolute -right-4 -top-4 size-24 rounded-full opacity-[0.06] bg-emerald-100" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="relative overflow-hidden bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30 shadow-lg shadow-blue-500/5 hover:shadow-xl hover:shadow-blue-500/10 transition-shadow duration-300">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-lg font-bold tracking-tight text-foreground leading-tight">
                    {data?.mostLateEmployees?.length
                      ? data.mostLateEmployees.slice(0, 2).join(', ')
                      : '-'}
                  </p>
                  <p className="text-sm text-muted-foreground font-medium">Paling Sering Telat</p>
                </div>
                <div className="size-14 rounded-2xl flex items-center justify-center bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 shadow-lg">
                  <Clock className="size-7" />
                </div>
              </div>
              <div className="absolute -right-4 -top-4 size-24 rounded-full opacity-[0.06] bg-amber-100" />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ================================================================= */}
      {/* Attendance Rate Line Chart                                        */}
      {/* ================================================================= */}
      <motion.div variants={itemVariants}>
        <Card className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30 shadow-lg shadow-blue-500/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[#1e40af] dark:text-blue-300 flex items-center gap-2">
                  <TrendingUp className="size-5" />
                  Tren Tingkat Kehadiran Harian
                </CardTitle>
                <CardDescription>Persentase kehadiran per hari &mdash; {monthLabel} {year}</CardDescription>
              </div>
              <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="inline-block size-2.5 rounded-full bg-[#2563eb]" />
                  Tingkat Kehadiran
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {chartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-2">
                <FileBarChart className="size-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Belum ada data chart untuk periode ini</p>
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => `${v}%`}
                    />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      name="Tingkat Kehadiran"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, fill: '#1e40af', strokeWidth: 2, stroke: '#fff' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ================================================================= */}
      {/* Employee Attendance Table                                         */}
      {/* ================================================================= */}
      <motion.div variants={itemVariants}>
        <Card className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30 shadow-lg shadow-blue-500/5">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-[#1e40af] dark:text-blue-300 flex items-center gap-2">
                  <Users className="size-5" />
                  Rekap Kehadiran Pegawai
                </CardTitle>
                <CardDescription>
                  {sortedSummaries.length} pegawai &mdash; {monthLabel} {year}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-200 dark:border-blue-800 text-[#2563eb] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  onClick={() => toast.info('Fitur export PDF akan segera tersedia')}
                >
                  <FileBarChart className="size-4 mr-1.5" />
                  Export PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-200 dark:border-blue-800 text-[#2563eb] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  onClick={() => toast.info('Fitur export Excel akan segera tersedia')}
                >
                  <FileSpreadsheet className="size-4 mr-1.5" />
                  Export Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {sortedSummaries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-2">
                <AlertTriangle className="size-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Belum ada data kehadiran untuk periode ini</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[480px]">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-10 text-center">No</TableHead>
                      <TableHead>
                        <button
                          className="inline-flex items-center hover:text-[#2563eb] dark:hover:text-blue-400 transition-colors"
                          onClick={() => handleSort('nip')}
                        >
                          NIP
                          <SortIcon field="nip" sortField={sortField} sortDirection={sortDirection} />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          className="inline-flex items-center hover:text-[#2563eb] dark:hover:text-blue-400 transition-colors"
                          onClick={() => handleSort('nama')}
                        >
                          Nama
                          <SortIcon field="nama" sortField={sortField} sortDirection={sortDirection} />
                        </button>
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        <button
                          className="inline-flex items-center hover:text-[#2563eb] dark:hover:text-blue-400 transition-colors"
                          onClick={() => handleSort('unitKerja')}
                        >
                          Unit Kerja
                          <SortIcon field="unitKerja" sortField={sortField} sortDirection={sortDirection} />
                        </button>
                      </TableHead>
                      <TableHead className="text-center">
                        <button
                          className="inline-flex items-center hover:text-[#2563eb] dark:hover:text-blue-400 transition-colors"
                          onClick={() => handleSort('hadir')}
                        >
                          Hadir
                          <SortIcon field="hadir" sortField={sortField} sortDirection={sortDirection} />
                        </button>
                      </TableHead>
                      <TableHead className="text-center">
                        <button
                          className="inline-flex items-center hover:text-[#2563eb] dark:hover:text-blue-400 transition-colors"
                          onClick={() => handleSort('telat')}
                        >
                          Telat
                          <SortIcon field="telat" sortField={sortField} sortDirection={sortDirection} />
                        </button>
                      </TableHead>
                      <TableHead className="text-center hidden sm:table-cell">
                        <button
                          className="inline-flex items-center hover:text-[#2563eb] dark:hover:text-blue-400 transition-colors"
                          onClick={() => handleSort('izin')}
                        >
                          Izin
                          <SortIcon field="izin" sortField={sortField} sortDirection={sortDirection} />
                        </button>
                      </TableHead>
                      <TableHead className="text-center hidden sm:table-cell">
                        <button
                          className="inline-flex items-center hover:text-[#2563eb] dark:hover:text-blue-400 transition-colors"
                          onClick={() => handleSort('cuti')}
                        >
                          Cuti
                          <SortIcon field="cuti" sortField={sortField} sortDirection={sortDirection} />
                        </button>
                      </TableHead>
                      <TableHead className="text-center hidden lg:table-cell">
                        <button
                          className="inline-flex items-center hover:text-[#2563eb] dark:hover:text-blue-400 transition-colors"
                          onClick={() => handleSort('alpha')}
                        >
                          Alpha
                          <SortIcon field="alpha" sortField={sortField} sortDirection={sortDirection} />
                        </button>
                      </TableHead>
                      <TableHead className="text-center">
                        <button
                          className="inline-flex items-center hover:text-[#2563eb] dark:hover:text-blue-400 transition-colors"
                          onClick={() => handleSort('persentase')}
                        >
                          Persentase
                          <SortIcon field="persentase" sortField={sortField} sortDirection={sortDirection} />
                        </button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSummaries.map((emp, idx) => (
                      <motion.tr
                        key={emp.userId}
                        className="border-b border-blue-50 dark:border-blue-900/20 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03, duration: 0.3 }}
                      >
                        <TableCell className="text-center text-xs text-muted-foreground">
                          {(reportPage - 1) * reportLimit + idx + 1}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-mono text-muted-foreground">{emp.nip}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="size-7 rounded-full bg-[#1e40af]/10 dark:bg-blue-900/30 flex items-center justify-center text-[10px] font-bold text-[#1e40af] dark:text-blue-400 shrink-0">
                              {emp.nama.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium truncate max-w-[140px]">{emp.nama}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-xs text-muted-foreground">{emp.unitKerja || '-'}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{emp.hadir}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-sm font-medium text-amber-600 dark:text-amber-400">{emp.telat}</span>
                        </TableCell>
                        <TableCell className="text-center hidden sm:table-cell">
                          <span className="text-sm font-medium text-[#2563eb] dark:text-blue-400">{emp.izin}</span>
                        </TableCell>
                        <TableCell className="text-center hidden sm:table-cell">
                          <span className="text-sm font-medium text-purple-600 dark:text-purple-400">{emp.cuti}</span>
                        </TableCell>
                        <TableCell className="text-center hidden lg:table-cell">
                          <span className="text-sm font-medium text-red-600 dark:text-red-400">{emp.alpha}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={`text-xs font-semibold px-2.5 py-0.5 ${percentageBg(emp.persentase)} ${percentageColor(emp.persentase)}`}
                          >
                            {emp.persentase.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}

            {/* Pagination */}
            {sortedSummaries.length > 0 && (
              <div className="flex items-center justify-between pt-4 border-t border-blue-100/50 dark:border-blue-900/20">
                <p className="text-sm text-muted-foreground">
                  Halaman {reportPage} dari {totalReportPages} ({sortedSummaries.length} pegawai)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={reportPage <= 1}
                    onClick={() => setReportPage((p) => Math.max(1, p - 1))}
                    className="border-blue-200 dark:border-blue-800 text-[#2563eb] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <ChevronLeft className="size-4 mr-1" />
                    Sebelumnya
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={reportPage >= totalReportPages}
                    onClick={() => setReportPage((p) => Math.min(totalReportPages, p + 1))}
                    className="border-blue-200 dark:border-blue-800 text-[#2563eb] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    Selanjutnya
                    <ChevronRight className="size-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
