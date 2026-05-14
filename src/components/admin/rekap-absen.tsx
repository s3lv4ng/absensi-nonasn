'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { motion, type Variants } from 'framer-motion'
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
  RefreshCw,
  Printer,
  Download,
  TableProperties,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  TrendingUp,
  Users,
  Clock,
  FileBarChart,
  FileSpreadsheet,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  UserX,
  Timer,
  LogOut,
  Briefcase,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DayData {
  day: number
  masuk: string | null
  pulang: string | null
  status: string
  isWeekend: boolean
  isHoliday: boolean
  isManualMasuk?: boolean
  isManualPulang?: boolean
}

interface DayInfo {
  day: number
  isWeekend: boolean
  isHoliday: boolean
  holidayName: string | null
}

interface EmployeeRow {
  userId: string
  nip: string
  nama: string
  jabatan: string | null
  unitKerja: string | null
  shift: { name: string; startTime: string; endTime: string } | null
  days: DayData[]
}

interface RekapData {
  officeName: string
  month: number
  year: number
  daysInMonth: number
  dayInfo: DayInfo[]
  employees: EmployeeRow[]
}

// Reports types
interface EmployeeSummary {
  userId: string
  nip: string
  nama: string
  unitKerja: string | null
  hadir: number
  telat: number
  izin: number
  cuti: number
  sakit: number
  dinasLuar: number
  dinasDalam: number
  alpha: number
  pulangCepat: number
  totalLateMinutes: number
  totalEarlyMinutes: number
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

type SortField = 'nama' | 'nip' | 'unitKerja' | 'hadir' | 'telat' | 'izin' | 'cuti' | 'sakit' | 'dinasLuar' | 'dinasDalam' | 'alpha' | 'pulangCepat' | 'totalLateMinutes' | 'totalEarlyMinutes' | 'persentase'
type SortDirection = 'asc' | 'desc'

// ---------------------------------------------------------------------------
// Constants
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

function getYearOptions() {
  const currentYear = new Date().getFullYear()
  const years: { value: string; label: string }[] = []
  for (let y = currentYear; y >= currentYear - 5; y--) {
    years.push({ value: String(y), label: String(y) })
  }
  return years
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatMinutes(totalMinutes: number): string {
  if (totalMinutes === 0) return '-'
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  if (hours > 0) return `${hours}j ${mins}m`
  return `${mins}m`
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
// Animation
// ---------------------------------------------------------------------------

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
}

// ---------------------------------------------------------------------------
// Status cell renderer
// ---------------------------------------------------------------------------

function StatusCell({ day }: { day: DayData }) {
  // If weekend/holiday but has a leave code, show it
  if ((day.isWeekend || day.isHoliday) && ['DL', 'DD', 'I', 'C', 'S'].includes(day.status)) {
    const statusDisplay: Record<string, { text: string; bg: string; textClass: string }> = {
      DL: { text: 'DL', bg: 'bg-sky-50 dark:bg-sky-900/20', textClass: 'text-sky-700 dark:text-sky-400' },
      DD: { text: 'DD', bg: 'bg-indigo-50 dark:bg-indigo-900/20', textClass: 'text-indigo-700 dark:text-indigo-400' },
      I: { text: 'I', bg: 'bg-blue-50 dark:bg-blue-900/20', textClass: 'text-blue-700 dark:text-blue-400' },
      C: { text: 'C', bg: 'bg-purple-50 dark:bg-purple-900/20', textClass: 'text-purple-700 dark:text-purple-400' },
      S: { text: 'S', bg: 'bg-green-50 dark:bg-green-900/20', textClass: 'text-green-700 dark:text-green-400' },
    }
    const s = statusDisplay[day.status] || statusDisplay['I']
    return (
      <td className={`border border-gray-300 dark:border-gray-600 px-0.5 py-0.5 text-center text-[9px] ${s.bg}`}>
        <div className={`font-bold ${s.textClass}`}>{s.text}</div>
        <div className={`font-bold ${s.textClass}`}>{s.text}</div>
      </td>
    )
  }

  if (day.isWeekend || day.isHoliday) {
    return (
      <td className="border border-gray-300 dark:border-gray-600 px-0.5 py-0.5 text-center text-[9px] text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50">
        -
      </td>
    )
  }

  if (day.status === 'HADIR' || day.status === 'TELAT') {
    return (
      <td
        className={`border border-gray-300 dark:border-gray-600 px-0.5 py-0.5 text-center text-[9px] leading-tight ${
          day.status === 'TELAT' ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-white dark:bg-gray-900'
        }`}
      >
        <div className={day.status === 'TELAT' ? 'text-amber-700 dark:text-amber-400 font-semibold' : 'text-gray-800 dark:text-gray-200'}>
          {day.masuk || '-'}
        </div>
        <div className={day.pulang && day.pulang !== day.masuk ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'}>
          {day.pulang || '-'}
        </div>
      </td>
    )
  }

  // TIDAK_LENGKAP: incomplete attendance (only masuk or only pulang, non-manual)
  if (day.status === 'TIDAK_LENGKAP') {
    return (
      <td className="border border-gray-300 dark:border-gray-600 px-0.5 py-0.5 text-center text-[9px] leading-tight bg-orange-50 dark:bg-orange-900/20">
        <div className="text-orange-700 dark:text-orange-400 font-semibold">
          ½
        </div>
        <div className="text-gray-600 dark:text-gray-400">
          {day.masuk || day.pulang || '-'}
        </div>
      </td>
    )
  }

  // Leave / status codes
  const statusDisplay: Record<string, { text: string; bg: string; textClass: string }> = {
    DL: { text: 'DL', bg: 'bg-sky-50 dark:bg-sky-900/20', textClass: 'text-sky-700 dark:text-sky-400' },
    DD: { text: 'DD', bg: 'bg-indigo-50 dark:bg-indigo-900/20', textClass: 'text-indigo-700 dark:text-indigo-400' },
    I: { text: 'I', bg: 'bg-blue-50 dark:bg-blue-900/20', textClass: 'text-blue-700 dark:text-blue-400' },
    C: { text: 'C', bg: 'bg-purple-50 dark:bg-purple-900/20', textClass: 'text-purple-700 dark:text-purple-400' },
    S: { text: 'S', bg: 'bg-green-50 dark:bg-green-900/20', textClass: 'text-green-700 dark:text-green-400' },
    ALPHA: { text: 'A', bg: 'bg-red-50 dark:bg-red-900/20', textClass: 'text-red-700 dark:text-red-400' },
    TIDAK_LENGKAP: { text: '½', bg: 'bg-orange-50 dark:bg-orange-900/20', textClass: 'text-orange-700 dark:text-orange-400' },
  }

  const s = statusDisplay[day.status] || statusDisplay['ALPHA']

  return (
    <td className={`border border-gray-300 dark:border-gray-600 px-0.5 py-0.5 text-center text-[9px] ${s.bg}`}>
      <div className={`font-bold ${s.textClass}`}>{s.text}</div>
      <div className={`font-bold ${s.textClass}`}>{s.text}</div>
    </td>
  )
}

// ---------------------------------------------------------------------------
// Chart Tooltip
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
// Sort Icon
// ---------------------------------------------------------------------------

function SortIcon({ field, sortField, sortDirection }: { field: SortField; sortField: SortField; sortDirection: SortDirection }) {
  if (field !== sortField) return <ArrowUpDown className="size-3 ml-1 opacity-40" />
  return sortDirection === 'asc'
    ? <ArrowUp className="size-3 ml-1 text-[#2563eb]" />
    : <ArrowDown className="size-3 ml-1 text-[#2563eb]" />
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function RekapSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function RekapAbsen() {
  const now = new Date()
  const [month, setMonth] = useState(String(now.getMonth() + 1))
  const [year, setYear] = useState(String(now.getFullYear()))
  const [data, setData] = useState<RekapData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 15
  const printRef = useRef<HTMLDivElement>(null)

  // Filter state
  const [unitKerjaFilter, setUnitKerjaFilter] = useState('all')
  const [jabatanFilter, setJabatanFilter] = useState('all')
  const [shiftFilter, setShiftFilter] = useState('all')
  const [unitKerjaList, setUnitKerjaList] = useState<{id: string, name: string}[]>([])
  const [jabatanList, setJabatanList] = useState<{id: string, name: string}[]>([])
  const [shiftList, setShiftList] = useState<{id: string, name: string}[]>([])

  // Reports state
  const [reportsData, setReportsData] = useState<ReportsData | null>(null)
  const [isReportsLoading, setIsReportsLoading] = useState(true)
  const [reportsError, setReportsError] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField>('persentase')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [reportPage, setReportPage] = useState(1)
  const reportLimit = 20
  const [activeTab, setActiveTab] = useState('rekap')

  // Fetch filter options on mount
  useEffect(() => {
    fetch('/api/unit-kerja').then(r => r.json()).then(d => setUnitKerjaList(d.data || d.unitKerja || [])).catch(() => {})
    fetch('/api/jabatan').then(r => r.json()).then(d => setJabatanList(d.data || d.jabatan || [])).catch(() => {})
    fetch('/api/shifts').then(r => r.json()).then(d => setShiftList(d.shifts || [])).catch(() => {})
  }, [])

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.set('month', month)
      params.set('year', year)
      if (unitKerjaFilter && unitKerjaFilter !== 'all') params.set('unitKerjaId', unitKerjaFilter)
      if (jabatanFilter && jabatanFilter !== 'all') params.set('jabatanId', jabatanFilter)
      if (shiftFilter && shiftFilter !== 'all') params.set('shiftId', shiftFilter)

      const res = await fetch(`/api/rekap-absen?${params.toString()}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Gagal memuat data rekap')
      }

      const json = await res.json()
      setData(json)
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
      toast.error('Gagal memuat rekap absen', {
        description: err.message,
      })
    } finally {
      setIsLoading(false)
    }
  }, [month, year, unitKerjaFilter, jabatanFilter, shiftFilter])

  const fetchReports = useCallback(async () => {
    try {
      setIsReportsLoading(true)
      setReportsError(null)

      const res = await fetch(`/api/reports?month=${month}&year=${year}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Gagal memuat data laporan')
      }

      const json = await res.json()
      setReportsData({
        totalWorkingDays: json.totalWorkingDays ?? 0,
        averageAttendanceRate: json.averageAttendanceRate ?? 0,
        mostLateEmployees: json.mostLateEmployees ?? [],
        dailyRates: json.dailyRates ?? [],
        employeeSummaries: json.employeeSummaries ?? [],
      })
    } catch (err: any) {
      setReportsError(err.message || 'Terjadi kesalahan')
      toast.error('Gagal memuat laporan', {
        description: err.message || 'Terjadi kesalahan saat memuat data laporan',
      })
    } finally {
      setIsReportsLoading(false)
    }
  }, [month, year])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  useEffect(() => {
    setCurrentPage(1)
    setReportPage(1)
  }, [month, year, unitKerjaFilter, jabatanFilter, shiftFilter])

  // ---- Rekap data ----
  const totalPages = Math.max(1, Math.ceil((data?.employees.length || 0) / pageSize))
  const paginatedEmployees = data?.employees.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  ) || []

  const monthLabel = MONTHS.find((m) => m.value === month)?.label ?? month

  // ---- Reports data ----
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection(field === 'persentase' ? 'desc' : 'asc')
    }
  }

  const sortedSummaries = useMemo(() => {
    if (!reportsData?.employeeSummaries) return []
    const summaries = [...reportsData.employeeSummaries]
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
  }, [reportsData?.employeeSummaries, sortField, sortDirection])

  const totalReportPages = Math.max(1, Math.ceil(sortedSummaries.length / reportLimit))
  const paginatedSummaries = useMemo(() => {
    const start = (reportPage - 1) * reportLimit
    return sortedSummaries.slice(start, start + reportLimit)
  }, [sortedSummaries, reportPage, reportLimit])

  const chartData = useMemo(() => {
    if (!reportsData?.dailyRates) return []
    return reportsData.dailyRates.map((d) => ({
      ...d,
      name: d.date,
    }))
  }, [reportsData?.dailyRates])

  // ---- Accumulation summary ----
  const accumulationSummary = useMemo(() => {
    if (!reportsData?.employeeSummaries) return null
    const summaries = reportsData.employeeSummaries
    const totalTelatKali = summaries.reduce((s, e) => s + e.telat, 0)
    const totalTelatMenit = summaries.reduce((s, e) => s + e.totalLateMinutes, 0)
    const totalPulangCepatKali = summaries.reduce((s, e) => s + e.pulangCepat, 0)
    const totalPulangCepatMenit = summaries.reduce((s, e) => s + e.totalEarlyMinutes, 0)
    const totalDL = summaries.reduce((s, e) => s + e.dinasLuar, 0)
    const totalDD = summaries.reduce((s, e) => s + e.dinasDalam, 0)
    const totalSakit = summaries.reduce((s, e) => s + e.sakit, 0)
    const pegawaiTelat = summaries.filter(e => e.telat > 0).length
    const pegawaiPulangCepat = summaries.filter(e => e.pulangCepat > 0).length
    const pegawaiDL = summaries.filter(e => e.dinasLuar > 0).length
    const pegawaiDD = summaries.filter(e => e.dinasDalam > 0).length
    const pegawaiSakit = summaries.filter(e => e.sakit > 0).length
    return {
      totalTelatKali,
      totalTelatMenit,
      totalPulangCepatKali,
      totalPulangCepatMenit,
      totalDL,
      totalDD,
      totalSakit,
      pegawaiTelat,
      pegawaiPulangCepat,
      pegawaiDL,
      pegawaiDD,
      pegawaiSakit,
    }
  }, [reportsData?.employeeSummaries])

  // Print handler for Rekap
  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Gagal membuka jendela cetak')
      return
    }

    const styles = `
      <style>
        @page { size: landscape; margin: 10mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 9px; color: #1a1a1a; }
        h2 { font-size: 14px; margin-bottom: 4px; }
        h3 { font-size: 11px; font-weight: normal; margin-bottom: 2px; }
        h4 { font-size: 10px; font-weight: normal; margin-bottom: 8px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #333; padding: 1px 2px; text-align: center; font-size: 8px; }
        th { background: #e5e7eb; font-weight: 600; font-size: 9px; }
        .name-cell { text-align: left; padding: 2px 4px; font-size: 8px; min-width: 120px; white-space: nowrap; }
        .day-header { writing-mode: horizontal-tb; font-size: 9px; min-width: 28px; }
        .weekend { background: #f3f4f6; color: #9ca3af; }
        .holiday { background: #fef3c7; color: #92400e; }
        .telat { background: #fef3c7; }
        .status-dl { background: #e0f2fe; color: #0369a1; font-weight: 600; }
        .status-dd { background: #e0e7ff; color: #4338ca; font-weight: 600; }
        .status-i { background: #dbeafe; color: #1d4ed8; font-weight: 600; }
        .status-c { background: #f3e8ff; color: #7e22ce; font-weight: 600; }
        .status-s { background: #dcfce7; color: #15803d; font-weight: 600; }
        .status-a { background: #fee2e2; color: #b91c1c; font-weight: 600; }
        .status-tl { background: #ffedd5; color: #c2410c; font-weight: 600; }
        .legend { margin-top: 12px; font-size: 9px; display: flex; gap: 16px; flex-wrap: wrap; }
        .legend-item { display: flex; align-items: center; gap: 4px; }
        .legend-box { width: 14px; height: 14px; border: 1px solid #999; display: inline-block; }
        .page-break { page-break-after: always; }
      </style>
    `

    // Build the full table (all employees, not just paginated)
    const employees = data?.employees || []
    const dayInfoList = data?.dayInfo || []

    let tablesHtml = ''
    const rowsPerPage = 25
    for (let page = 0; page < Math.ceil(employees.length / rowsPerPage); page++) {
      const pageEmps = employees.slice(page * rowsPerPage, (page + 1) * rowsPerPage)

      let tableHtml = `
        <table>
          <thead>
            <tr>
              <th rowspan="2" class="name-cell">Nama Pegawai</th>
              <th colspan="${data?.daysInMonth || 31}">Tanggal</th>
            </tr>
            <tr>
              ${Array.from({ length: data?.daysInMonth || 31 }, (_, i) => {
                const info = dayInfoList[i]
                const cls = info?.isWeekend ? 'weekend' : info?.isHoliday ? 'holiday' : ''
                return `<th class="day-header ${cls}">${i + 1}</th>`
              }).join('')}
            </tr>
          </thead>
          <tbody>
      `

      for (const emp of pageEmps) {
        const nameDisplay = emp.jabatan ? `${emp.nama}, ${emp.jabatan}` : emp.nama
        tableHtml += `<tr><td class="name-cell">${nameDisplay}</td>`
        for (const day of emp.days) {
          if ((day.isWeekend || day.isHoliday) && ['DL', 'DD', 'I', 'C', 'S'].includes(day.status)) {
            const cls = day.status === 'DL' ? 'status-dl' : day.status === 'DD' ? 'status-dd' : day.status === 'I' ? 'status-i' : day.status === 'C' ? 'status-c' : 'status-s'
            tableHtml += `<td class="${cls}">${day.status}<br/>${day.status}</td>`
          } else if (day.isWeekend || day.isHoliday) {
            tableHtml += `<td class="weekend">-</td>`
          } else if (day.status === 'HADIR') {
            tableHtml += `<td>${day.masuk || '-'}<br/>${day.pulang || '-'}</td>`
          } else if (day.status === 'TELAT') {
            tableHtml += `<td class="telat">${day.masuk || '-'}<br/>${day.pulang || '-'}</td>`
          } else if (day.status === 'TIDAK_LENGKAP') {
            tableHtml += `<td class="status-tl">½<br/>${day.masuk || day.pulang || '-'}</td>`
          } else if (['DL', 'DD', 'I', 'C', 'S'].includes(day.status)) {
            const cls = day.status === 'DL' ? 'status-dl' : day.status === 'DD' ? 'status-dd' : day.status === 'I' ? 'status-i' : day.status === 'C' ? 'status-c' : 'status-s'
            tableHtml += `<td class="${cls}">${day.status}<br/>${day.status}</td>`
          } else {
            tableHtml += `<td class="status-a">A<br/>A</td>`
          }
        }
        tableHtml += `</tr>`
      }

      tableHtml += `</tbody></table>`

      if (page < Math.ceil(employees.length / rowsPerPage) - 1) {
        tableHtml += `<div class="page-break"></div>`
      }

      tablesHtml += tableHtml
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        ${styles}
      </head>
      <body>
        <h2>Cetak Rekap Absen</h2>
        <h3>Nama SKPD: ${data?.officeName || '-'}</h3>
        <h4>Bulan: ${monthLabel} ${year}${
          unitKerjaFilter !== 'all' ? ` | Unit Kerja: ${unitKerjaList.find(u => u.id === unitKerjaFilter)?.name || unitKerjaFilter}` : ''
        }${
          jabatanFilter !== 'all' ? ` | Jabatan: ${jabatanList.find(j => j.id === jabatanFilter)?.name || jabatanFilter}` : ''
        }${
          shiftFilter !== 'all' ? ` | Jam Kerja: ${shiftList.find(s => s.id === shiftFilter)?.name || shiftFilter}` : ''
        }</h4>
        ${tablesHtml}
        <div class="legend">
          <div class="legend-item"><span class="legend-box" style="background:#e0f2fe;"></span> DL = Dinas Luar</div>
          <div class="legend-item"><span class="legend-box" style="background:#e0e7ff;"></span> DD = Dinas Dalam</div>
          <div class="legend-item"><span class="legend-box" style="background:#dbeafe;"></span> I = Izin</div>
          <div class="legend-item"><span class="legend-box" style="background:#f3e8ff;"></span> C = Cuti</div>
          <div class="legend-item"><span class="legend-box" style="background:#dcfce7;"></span> S = Sakit</div>
          <div class="legend-item"><span class="legend-box" style="background:#fee2e2;"></span> A = Alpha</div>
          <div class="legend-item"><span class="legend-box" style="background:#ffedd5;"></span> ½ = Tidak Lengkap (Tidak Hadir)</div>
          <div class="legend-item"><span class="legend-box" style="background:#fef3c7;"></span> Telat</div>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
    }
  }

  // Print handler for Laporan (with accumulation)
  const handlePrintLaporan = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Gagal membuka jendela cetak')
      return
    }

    if (!reportsData || !accumulationSummary) return

    const summaries = sortedSummaries

    const styles = `
      <style>
        @page { size: portrait; margin: 10mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 10px; color: #1a1a1a; }
        h2 { font-size: 16px; margin-bottom: 4px; }
        h3 { font-size: 12px; font-weight: normal; margin-bottom: 2px; }
        h4 { font-size: 11px; font-weight: normal; margin-bottom: 12px; }
        .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
        .summary-box { border: 1px solid #ccc; padding: 8px; border-radius: 4px; }
        .summary-box h5 { font-size: 10px; color: #666; margin-bottom: 4px; }
        .summary-box .value { font-size: 18px; font-weight: bold; }
        .summary-box .sub { font-size: 9px; color: #888; }
        table { border-collapse: collapse; width: 100%; margin-top: 12px; }
        th, td { border: 1px solid #333; padding: 3px 5px; text-align: center; font-size: 9px; }
        th { background: #e5e7eb; font-weight: 600; font-size: 9px; }
        .text-left { text-align: left; }
        .text-amber { color: #b45309; }
        .text-orange { color: #c2410c; }
        .text-red { color: #b91c1c; }
        .text-green { color: #15803d; }
        .page-break { page-break-after: always; }
      </style>
    `

    let tablesHtml = ''
    const rowsPerPage = 30
    for (let page = 0; page < Math.ceil(summaries.length / rowsPerPage); page++) {
      const pageEmps = summaries.slice(page * rowsPerPage, (page + 1) * rowsPerPage)

      let tableHtml = `
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>NIP</th>
              <th class="text-left">Nama</th>
              <th>Unit Kerja</th>
              <th>Hadir</th>
              <th>Telat</th>
              <th>Menit Telat</th>
              <th>P. Cepat</th>
              <th>Menit P.C.</th>
              <th>DL</th>
              <th>DD</th>
              <th>Izin</th>
              <th>Cuti</th>
              <th>Sakit</th>
              <th>Alpha</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
      `

      pageEmps.forEach((emp, idx) => {
        tableHtml += `
          <tr>
            <td>${page * rowsPerPage + idx + 1}</td>
            <td>${emp.nip}</td>
            <td class="text-left">${emp.nama}</td>
            <td>${emp.unitKerja || '-'}</td>
            <td>${emp.hadir}</td>
            <td class="text-amber">${emp.telat}</td>
            <td class="text-amber">${formatMinutes(emp.totalLateMinutes)}</td>
            <td class="text-orange">${emp.pulangCepat || '-'}</td>
            <td class="text-orange">${formatMinutes(emp.totalEarlyMinutes)}</td>
            <td>${emp.dinasLuar || '-'}</td>
            <td>${emp.dinasDalam || '-'}</td>
            <td>${emp.izin}</td>
            <td>${emp.cuti}</td>
            <td>${emp.sakit || '-'}</td>
            <td class="text-red">${emp.alpha}</td>
            <td>${emp.persentase.toFixed(1)}%</td>
          </tr>
        `
      })

      tableHtml += `</tbody></table>`

      if (page < Math.ceil(summaries.length / rowsPerPage) - 1) {
        tableHtml += `<div class="page-break"></div>`
      }

      tablesHtml += tableHtml
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        ${styles}
      </head>
      <body>
        <h2>Laporan Kehadiran Pegawai</h2>
        <h3>Nama SKPD: ${data?.officeName || '-'}</h3>
        <h4>Periode: ${monthLabel} ${year} | Hari Kerja: ${reportsData.totalWorkingDays} hari</h4>

        <div class="summary-grid">
          <div class="summary-box">
            <h5>AKUMULASI TERLAMBAT</h5>
            <div class="value text-amber">${accumulationSummary.totalTelatKali} kali</div>
            <div class="sub">Total ${formatMinutes(accumulationSummary.totalTelatMenit)} | ${accumulationSummary.pegawaiTelat} pegawai</div>
          </div>
          <div class="summary-box">
            <h5>AKUMULASI PULANG CEPAT</h5>
            <div class="value text-orange">${accumulationSummary.totalPulangCepatKali} kali</div>
            <div class="sub">Total ${formatMinutes(accumulationSummary.totalPulangCepatMenit)} | ${accumulationSummary.pegawaiPulangCepat} pegawai</div>
          </div>
          <div class="summary-box">
            <h5>DINAS LUAR (DL)</h5>
            <div class="value" style="color:#0369a1">${accumulationSummary.totalDL} hari</div>
            <div class="sub">${accumulationSummary.pegawaiDL} pegawai</div>
          </div>
          <div class="summary-box">
            <h5>DINAS DALAM (DD)</h5>
            <div class="value" style="color:#4338ca">${accumulationSummary.totalDD} hari</div>
            <div class="sub">${accumulationSummary.pegawaiDD} pegawai</div>
          </div>
          <div class="summary-box">
            <h5>SAKIT</h5>
            <div class="value text-green">${accumulationSummary.totalSakit} hari</div>
            <div class="sub">${accumulationSummary.pegawaiSakit} pegawai</div>
          </div>
          <div class="summary-box">
            <h5>Rata-rata Kehadiran</h5>
            <div class="value text-green">${reportsData.averageAttendanceRate}%</div>
          </div>
        </div>

        ${tablesHtml}
      </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
    }
  }

  // Export PDF handler
  const handleExportPDF = async () => {
    try {
      toast.info('Mempersiapkan PDF...')
      handlePrint()
    } catch (err: any) {
      toast.error('Gagal export PDF', { description: err.message })
    }
  }

  // ---- Loading state ----
  if (isLoading && !data) return <RekapSkeleton />

  // ---- Error state ----
  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="size-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <TableProperties className="size-8 text-red-500" />
        </div>
        <p className="text-lg font-semibold text-foreground">Gagal Memuat Rekap</p>
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
            Cetak Rekap Absen
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Format Rekap Kehadiran &mdash; {monthLabel} {year}
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
            onClick={() => { fetchData(); fetchReports(); }}
            disabled={isLoading || isReportsLoading}
            className="border-blue-200 dark:border-blue-800 text-[#2563eb] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            <RefreshCw className={`size-3.5 mr-1 ${(isLoading || isReportsLoading) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* ================================================================= */}
      {/* Tabs: Rekap Absen / Laporan Kehadiran                             */}
      {/* ================================================================= */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
          <TabsTrigger value="rekap" className="data-[state=active]:bg-[#1e40af] data-[state=active]:text-white">
            <TableProperties className="size-4 mr-1.5" />
            Rekap Absen
          </TabsTrigger>
          <TabsTrigger value="laporan" className="data-[state=active]:bg-[#1e40af] data-[state=active]:text-white">
            <FileBarChart className="size-4 mr-1.5" />
            Laporan Kehadiran
          </TabsTrigger>
        </TabsList>

        {/* =============================================================== */}
        {/* TAB 1: Rekap Absen Grid                                         */}
        {/* =============================================================== */}
        <TabsContent value="rekap" className="space-y-4 mt-4">
          {/* Filter Row */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center gap-3"
          >
            <div className="flex items-center gap-1.5 text-sm font-medium text-[#1e40af] dark:text-blue-300">
              <Filter className="size-4" />
              <span>Filter</span>
            </div>
            <Select value={unitKerjaFilter} onValueChange={setUnitKerjaFilter}>
              <SelectTrigger className="w-[160px] border-blue-200 dark:border-blue-800">
                <SelectValue placeholder="Unit Kerja" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Unit Kerja</SelectItem>
                {unitKerjaList.map((uk) => (
                  <SelectItem key={uk.id} value={uk.id}>
                    {uk.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={jabatanFilter} onValueChange={setJabatanFilter}>
              <SelectTrigger className="w-[160px] border-blue-200 dark:border-blue-800">
                <SelectValue placeholder="Jabatan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jabatan</SelectItem>
                {jabatanList.map((j) => (
                  <SelectItem key={j.id} value={j.id}>
                    {j.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={shiftFilter} onValueChange={setShiftFilter}>
              <SelectTrigger className="w-[160px] border-blue-200 dark:border-blue-800">
                <SelectValue placeholder="Jam Kerja" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jam Kerja</SelectItem>
                {shiftList.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(unitKerjaFilter !== 'all' || jabatanFilter !== 'all' || shiftFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setUnitKerjaFilter('all')
                  setJabatanFilter('all')
                  setShiftFilter('all')
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5 mr-1" />
                Reset Filter
              </Button>
            )}
          </motion.div>

          {/* Legend */}
          <motion.div variants={itemVariants}>
            <Card className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30 shadow-lg shadow-blue-500/5">
              <CardContent className="p-3">
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block size-3 rounded-sm bg-sky-100 dark:bg-sky-900/30 border border-sky-300 dark:border-sky-700" />
                    <span className="text-muted-foreground">DL = Dinas Luar</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block size-3 rounded-sm bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-700" />
                    <span className="text-muted-foreground">DD = Dinas Dalam</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block size-3 rounded-sm bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700" />
                    <span className="text-muted-foreground">I = Izin</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block size-3 rounded-sm bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700" />
                    <span className="text-muted-foreground">C = Cuti</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block size-3 rounded-sm bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700" />
                    <span className="text-muted-foreground">S = Sakit</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block size-3 rounded-sm bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700" />
                    <span className="text-muted-foreground">A = Alpha</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block size-3 rounded-sm bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700" />
                    <span className="text-muted-foreground">Telat</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block size-3 rounded-sm bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700" />
                    <span className="text-muted-foreground">½ = Tidak Lengkap (Tidak Hadir)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block size-3 rounded-sm bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600" />
                    <span className="text-muted-foreground">- = Libur / Weekend</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Rekap Table */}
          <motion.div variants={itemVariants}>
            <Card className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30 shadow-lg shadow-blue-500/5">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-[#1e40af] dark:text-blue-300 flex items-center gap-2">
                      <TableProperties className="size-5" />
                      Rekap Absen {monthLabel} {year}
                    </CardTitle>
                    <CardDescription>
                      {data?.employees.length || 0} pegawai &mdash; {data?.officeName || '-'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-blue-200 dark:border-blue-800 text-[#2563eb] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      onClick={handlePrint}
                    >
                      <Printer className="size-4 mr-1.5" />
                      Cetak
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-blue-200 dark:border-blue-800 text-[#2563eb] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      onClick={handleExportPDF}
                    >
                      <Download className="size-4 mr-1.5" />
                      Export PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {data?.employees.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-2">
                    <CalendarDays className="size-10 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">Belum ada data kehadiran untuk periode ini</p>
                  </div>
                ) : (
                  <>
                    <ScrollArea className="w-full" style={{ maxWidth: '100%' }}>
                      <div ref={printRef} className="min-w-[1200px]">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr>
                              <th
                                rowSpan={2}
                                className="border border-gray-300 dark:border-gray-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 text-left text-[10px] font-semibold text-[#1e40af] dark:text-blue-300 sticky left-0 z-10 bg-white dark:bg-gray-900 min-w-[140px]"
                              >
                                Nama Pegawai
                              </th>
                              <th
                                colSpan={data?.daysInMonth || 31}
                                className="border border-gray-300 dark:border-gray-600 bg-blue-50 dark:bg-blue-900/30 px-1 py-0.5 text-center text-[10px] font-semibold text-[#1e40af] dark:text-blue-300"
                              >
                                Tanggal
                              </th>
                            </tr>
                            <tr>
                              {data?.dayInfo.map((info) => (
                                <th
                                  key={info.day}
                                  className={`border border-gray-300 dark:border-gray-600 px-0.5 py-0.5 text-center text-[9px] font-semibold min-w-[32px] ${
                                    info.isWeekend
                                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                                      : info.isHoliday
                                      ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                                      : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                                  }`}
                                >
                                  {info.day}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedEmployees.map((emp, idx) => {
                              const nameDisplay = emp.jabatan
                                ? `${emp.nama}, ${emp.jabatan}`
                                : emp.nama

                              return (
                                <tr
                                  key={emp.userId}
                                  className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10"
                                >
                                  <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-[9px] font-medium text-foreground sticky left-0 z-10 bg-white dark:bg-gray-900 whitespace-nowrap">
                                    {nameDisplay}
                                  </td>
                                  {emp.days.map((day) => (
                                    <StatusCell key={day.day} day={day} />
                                  ))}
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </ScrollArea>

                    {/* Pagination */}
                    {data && data.employees.length > 0 && (
                      <div className="flex items-center justify-between pt-4 border-t border-blue-100/50 dark:border-blue-900/20">
                        <p className="text-sm text-muted-foreground">
                          Halaman {currentPage} dari {totalPages} ({data.employees.length} pegawai)
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage <= 1}
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            className="border-blue-200 dark:border-blue-800 text-[#2563eb] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          >
                            <ChevronLeft className="size-4 mr-1" />
                            Sebelumnya
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            className="border-blue-200 dark:border-blue-800 text-[#2563eb] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          >
                            Selanjutnya
                            <ChevronRight className="size-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* =============================================================== */}
        {/* TAB 2: Laporan Kehadiran                                        */}
        {/* =============================================================== */}
        <TabsContent value="laporan" className="space-y-6 mt-4">
          {isReportsLoading && !reportsData ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
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
                <CardContent className="p-6">
                  <Skeleton className="h-72 w-full" />
                </CardContent>
              </Card>
            </div>
          ) : reportsError && !reportsData ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="size-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <UserX className="size-8 text-red-500" />
              </div>
              <p className="text-lg font-semibold text-foreground">Gagal Memuat Laporan</p>
              <p className="text-sm text-muted-foreground max-w-md text-center">{reportsError}</p>
              <Button onClick={fetchReports} className="bg-[#1e40af] hover:bg-[#1e3a8a]">
                Coba Lagi
              </Button>
            </div>
          ) : (
            <>
              {/* Accumulation Summary Cards */}
              {accumulationSummary && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <motion.div variants={itemVariants}>
                    <Card className="relative overflow-hidden bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30 shadow-lg shadow-blue-500/5 hover:shadow-xl hover:shadow-blue-500/10 transition-shadow duration-300">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-3xl font-bold tracking-tight text-foreground">
                              {reportsData?.totalWorkingDays ?? 0}
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
                    <Card className="relative overflow-hidden bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-amber-100/50 dark:border-amber-900/30 shadow-lg shadow-amber-500/5 hover:shadow-xl hover:shadow-amber-500/10 transition-shadow duration-300">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                              {accumulationSummary.totalTelatKali}
                            </p>
                            <p className="text-sm text-muted-foreground font-medium">Akumulasi Terlambat</p>
                            <p className="text-xs text-amber-500 dark:text-amber-400">
                              Total {formatMinutes(accumulationSummary.totalTelatMenit)} &middot; {accumulationSummary.pegawaiTelat} pegawai
                            </p>
                          </div>
                          <div className="size-14 rounded-2xl flex items-center justify-center bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 shadow-lg">
                            <Timer className="size-7" />
                          </div>
                        </div>
                        <div className="absolute -right-4 -top-4 size-24 rounded-full opacity-[0.06] bg-amber-100" />
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Card className="relative overflow-hidden bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-orange-100/50 dark:border-orange-900/30 shadow-lg shadow-orange-500/5 hover:shadow-xl hover:shadow-orange-500/10 transition-shadow duration-300">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-3xl font-bold tracking-tight text-orange-600 dark:text-orange-400">
                              {accumulationSummary.totalPulangCepatKali}
                            </p>
                            <p className="text-sm text-muted-foreground font-medium">Akumulasi Pulang Cepat</p>
                            <p className="text-xs text-orange-500 dark:text-orange-400">
                              Total {formatMinutes(accumulationSummary.totalPulangCepatMenit)} &middot; {accumulationSummary.pegawaiPulangCepat} pegawai
                            </p>
                          </div>
                          <div className="size-14 rounded-2xl flex items-center justify-center bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 shadow-lg">
                            <LogOut className="size-7" />
                          </div>
                        </div>
                        <div className="absolute -right-4 -top-4 size-24 rounded-full opacity-[0.06] bg-orange-100" />
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Card className="relative overflow-hidden bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-sky-100/50 dark:border-sky-900/30 shadow-lg shadow-sky-500/5 hover:shadow-xl hover:shadow-sky-500/10 transition-shadow duration-300">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-3xl font-bold tracking-tight text-sky-600 dark:text-sky-400">
                              {accumulationSummary.totalDL}
                            </p>
                            <p className="text-sm text-muted-foreground font-medium">Dinas Luar (DL)</p>
                            <p className="text-xs text-sky-500 dark:text-sky-400">
                              {accumulationSummary.pegawaiDL} pegawai
                            </p>
                          </div>
                          <div className="size-14 rounded-2xl flex items-center justify-center bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400 shadow-lg">
                            <Briefcase className="size-7" />
                          </div>
                        </div>
                        <div className="absolute -right-4 -top-4 size-24 rounded-full opacity-[0.06] bg-sky-100" />
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Card className="relative overflow-hidden bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-violet-100/50 dark:border-violet-900/30 shadow-lg shadow-violet-500/5 hover:shadow-xl hover:shadow-violet-500/10 transition-shadow duration-300">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-3xl font-bold tracking-tight text-violet-600 dark:text-violet-400">
                              {accumulationSummary.totalDD}
                            </p>
                            <p className="text-sm text-muted-foreground font-medium">Dinas Dalam (DD)</p>
                            <p className="text-xs text-violet-500 dark:text-violet-400">
                              {accumulationSummary.pegawaiDD} pegawai
                            </p>
                          </div>
                          <div className="size-14 rounded-2xl flex items-center justify-center bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400 shadow-lg">
                            <Briefcase className="size-7" />
                          </div>
                        </div>
                        <div className="absolute -right-4 -top-4 size-24 rounded-full opacity-[0.06] bg-violet-100" />
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Card className="relative overflow-hidden bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-emerald-100/50 dark:border-emerald-900/30 shadow-lg shadow-emerald-500/5 hover:shadow-xl hover:shadow-emerald-500/10 transition-shadow duration-300">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                              {reportsData?.averageAttendanceRate ?? 0}%
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
                </div>
              )}

              {/* Attendance Rate Line Chart */}
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

              {/* Employee Attendance Table */}
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
                          onClick={handlePrintLaporan}
                        >
                          <Printer className="size-4 mr-1.5" />
                          Cetak Laporan
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-blue-200 dark:border-blue-800 text-[#2563eb] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          onClick={handlePrintLaporan}
                        >
                          <FileSpreadsheet className="size-4 mr-1.5" />
                          Export PDF
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {sortedSummaries.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 space-y-2">
                        <CalendarDays className="size-10 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">Belum ada data kehadiran untuk periode ini</p>
                      </div>
                    ) : (
                      <>
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
                                <TableHead className="text-center">
                                  <button
                                    className="inline-flex items-center hover:text-[#2563eb] dark:hover:text-blue-400 transition-colors"
                                    onClick={() => handleSort('totalLateMinutes')}
                                  >
                                    <span className="flex flex-col items-center leading-tight">
                                      <span>Telat</span>
                                      <span className="text-[9px] text-muted-foreground">(menit)</span>
                                    </span>
                                    <SortIcon field="totalLateMinutes" sortField={sortField} sortDirection={sortDirection} />
                                  </button>
                                </TableHead>
                                <TableHead className="text-center">
                                  <button
                                    className="inline-flex items-center hover:text-[#2563eb] dark:hover:text-blue-400 transition-colors"
                                    onClick={() => handleSort('pulangCepat')}
                                  >
                                    <span className="flex flex-col items-center leading-tight">
                                      <span>P. Cepat</span>
                                      <span className="text-[9px] text-muted-foreground">(kali)</span>
                                    </span>
                                    <SortIcon field="pulangCepat" sortField={sortField} sortDirection={sortDirection} />
                                  </button>
                                </TableHead>
                                <TableHead className="text-center">
                                  <button
                                    className="inline-flex items-center hover:text-[#2563eb] dark:hover:text-blue-400 transition-colors"
                                    onClick={() => handleSort('totalEarlyMinutes')}
                                  >
                                    <span className="flex flex-col items-center leading-tight">
                                      <span>P. Cepat</span>
                                      <span className="text-[9px] text-muted-foreground">(menit)</span>
                                    </span>
                                    <SortIcon field="totalEarlyMinutes" sortField={sortField} sortDirection={sortDirection} />
                                  </button>
                                </TableHead>
                                <TableHead className="text-center">
                                  <button
                                    className="inline-flex items-center hover:text-[#2563eb] dark:hover:text-blue-400 transition-colors"
                                    onClick={() => handleSort('dinasLuar')}
                                  >
                                    DL
                                    <SortIcon field="dinasLuar" sortField={sortField} sortDirection={sortDirection} />
                                  </button>
                                </TableHead>
                                <TableHead className="text-center">
                                  <button
                                    className="inline-flex items-center hover:text-[#2563eb] dark:hover:text-blue-400 transition-colors"
                                    onClick={() => handleSort('dinasDalam')}
                                  >
                                    DD
                                    <SortIcon field="dinasDalam" sortField={sortField} sortDirection={sortDirection} />
                                  </button>
                                </TableHead>
                                <TableHead className="text-center">
                                  <button
                                    className="inline-flex items-center hover:text-[#2563eb] dark:hover:text-blue-400 transition-colors"
                                    onClick={() => handleSort('izin')}
                                  >
                                    Izin
                                    <SortIcon field="izin" sortField={sortField} sortDirection={sortDirection} />
                                  </button>
                                </TableHead>
                                <TableHead className="text-center">
                                  <button
                                    className="inline-flex items-center hover:text-[#2563eb] dark:hover:text-blue-400 transition-colors"
                                    onClick={() => handleSort('cuti')}
                                  >
                                    Cuti
                                    <SortIcon field="cuti" sortField={sortField} sortDirection={sortDirection} />
                                  </button>
                                </TableHead>
                                <TableHead className="text-center">
                                  <button
                                    className="inline-flex items-center hover:text-[#2563eb] dark:hover:text-blue-400 transition-colors"
                                    onClick={() => handleSort('sakit')}
                                  >
                                    Sakit
                                    <SortIcon field="sakit" sortField={sortField} sortDirection={sortDirection} />
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
                                  <TableCell className="text-center">
                                    <span className={`text-sm font-medium ${emp.totalLateMinutes > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
                                      {formatMinutes(emp.totalLateMinutes)}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <span className={`text-sm font-medium ${emp.pulangCepat > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'}`}>
                                      {emp.pulangCepat || '-'}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <span className={`text-sm font-medium ${emp.totalEarlyMinutes > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'}`}>
                                      {formatMinutes(emp.totalEarlyMinutes)}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <span className={`text-sm font-medium ${emp.dinasLuar > 0 ? 'text-sky-600 dark:text-sky-400' : 'text-muted-foreground'}`}>{emp.dinasLuar || '-'}</span>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <span className={`text-sm font-medium ${emp.dinasDalam > 0 ? 'text-violet-600 dark:text-violet-400' : 'text-muted-foreground'}`}>{emp.dinasDalam || '-'}</span>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <span className="text-sm font-medium text-[#2563eb] dark:text-blue-400">{emp.izin}</span>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <span className="text-sm font-medium text-purple-600 dark:text-purple-400">{emp.cuti}</span>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <span className={`text-sm font-medium ${emp.sakit > 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>{emp.sakit || '-'}</span>
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
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
