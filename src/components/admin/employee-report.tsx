'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  UserCheck,
  RefreshCw,
  UserX,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  AlertTriangle,
  Loader2,
  Search,
  User,
  Briefcase,
  Building2,
  Shield,
} from 'lucide-react'

import type { EmployeeReportData, EmployeeDailyRecord, User, WorkShift } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'

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

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'HADIR':
      return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800'
    case 'TELAT':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800'
    case 'IZIN':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800'
    case 'CUTI':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
    case 'SAKIT':
      return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800'
    case 'ALPHA':
      return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800'
    case 'DINAS':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800'
    case 'LIBUR':
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400 border-gray-200 dark:border-gray-700'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-300 border-gray-200 dark:border-gray-700'
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'HADIR': return 'Hadir'
    case 'TELAT': return 'Telat'
    case 'IZIN': return 'Izin'
    case 'CUTI': return 'Cuti'
    case 'SAKIT': return 'Sakit'
    case 'ALPHA': return 'Alpha'
    case 'DINAS': return 'Dinas'
    case 'LIBUR': return 'Libur'
    default: return status
  }
}

function formatShiftTime(time: string): string {
  if (!time) return '-'
  return time.slice(0, 5)
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function ReportSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>

      <Card className="bg-white/70 dark:bg-gray-900/60">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-28" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-20 space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        variants={itemVariants}
        className="size-20 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shadow-lg"
      >
        <UserCheck className="size-10 text-[#2563eb] dark:text-blue-400" />
      </motion.div>
      <motion.h3 variants={itemVariants} className="text-lg font-semibold text-foreground">
        Laporan Pegawai
      </motion.h3>
      <motion.p variants={itemVariants} className="text-sm text-muted-foreground max-w-sm text-center">
        Pilih pegawai dan periode untuk melihat laporan kehadiran individual
      </motion.p>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Summary Stat Card
// ---------------------------------------------------------------------------

function SummaryStatCard({
  label,
  value,
  icon,
  colorClass,
  bgClass,
  delay = 0,
}: {
  label: string
  value: number
  icon: React.ReactNode
  colorClass: string
  bgClass: string
  delay?: number
}) {
  return (
    <motion.div
      variants={itemVariants}
      transition={{ delay }}
    >
      <Card className={`relative overflow-hidden ${bgClass} backdrop-blur-xl shadow-lg hover:shadow-xl transition-shadow duration-300`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">{label}</p>
            </div>
            <div className={`size-10 rounded-xl flex items-center justify-center ${colorClass} bg-white/50 dark:bg-white/10 shadow-sm`}>
              {icon}
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

export function EmployeeReport() {
  const now = new Date()
  const [employees, setEmployees] = useState<User[]>([])
  const [loadingEmployees, setLoadingEmployees] = useState(true)

  const [selectedUserId, setSelectedUserId] = useState('')
  const [month, setMonth] = useState(String(now.getMonth() + 1))
  const [year, setYear] = useState(String(now.getFullYear()))

  const [report, setReport] = useState<EmployeeReportData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  // Fetch employees list
  useEffect(() => {
    let cancelled = false
    async function fetchEmployees() {
      try {
        setLoadingEmployees(true)
        const res = await fetch('/api/users?role=PEGAWAI&limit=100')
        if (!res.ok) throw new Error('Gagal memuat data pegawai')
        const data = await res.json()
        if (!cancelled) setEmployees(data.users ?? [])
      } catch (err: any) {
        if (!cancelled) {
          toast.error('Gagal memuat pegawai', { description: err.message })
        }
      } finally {
        if (!cancelled) setLoadingEmployees(false)
      }
    }
    fetchEmployees()
    return () => { cancelled = true }
  }, [])

  const fetchReport = useCallback(async () => {
    if (!selectedUserId) {
      toast.error('Pilih pegawai terlebih dahulu')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setHasSearched(true)

      const res = await fetch(`/api/employee-report?userId=${selectedUserId}&month=${month}&year=${year}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Gagal memuat laporan')
      }

      const data = await res.json()
      setReport(data)
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
      toast.error('Gagal memuat laporan', { description: err.message })
      setReport(null)
    } finally {
      setIsLoading(false)
    }
  }, [selectedUserId, month, year])

  const monthLabel = MONTHS.find((m) => m.value === month)?.label ?? month

  // ---- Loading state (initial employee fetch) ----
  if (loadingEmployees && employees.length === 0) return <ReportSkeleton />

  // ---- No data state (no employee selected) ----
  if (!hasSearched && !report) return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1e40af] dark:text-blue-300 tracking-tight flex items-center gap-2.5">
            <UserCheck className="size-8" />
            Laporan Pegawai
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Laporan kehadiran individual pegawai per bulan
          </p>
        </div>
      </motion.div>

      {/* Filter Card */}
      <motion.div variants={itemVariants}>
        <Card className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30 shadow-lg shadow-blue-500/5">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 w-full space-y-1.5">
                <label className="text-sm font-medium text-foreground">Pilih Pegawai</label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="border-blue-200 dark:border-blue-800">
                    <SelectValue placeholder="Pilih pegawai..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.nama} — {emp.nip}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-36 space-y-1.5">
                <label className="text-sm font-medium text-foreground">Bulan</label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger className="border-blue-200 dark:border-blue-800">
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
              </div>
              <div className="w-full sm:w-28 space-y-1.5">
                <label className="text-sm font-medium text-foreground">Tahun</label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger className="border-blue-200 dark:border-blue-800">
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
              </div>
              <Button
                onClick={fetchReport}
                disabled={isLoading || !selectedUserId}
                className="bg-[#1e40af] hover:bg-[#1e3a8a] text-white shadow-lg shadow-blue-500/20 w-full sm:w-auto"
              >
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                ) : (
                  <Search className="size-4 mr-1.5" />
                )}
                Tampilkan
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <EmptyState />
    </motion.div>
  )

  // ---- Error state ----
  if (error && !report) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="size-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <UserX className="size-8 text-red-500" />
        </div>
        <p className="text-lg font-semibold text-foreground">Gagal Memuat Laporan</p>
        <p className="text-sm text-muted-foreground max-w-md text-center">{error}</p>
        <Button onClick={fetchReport} className="bg-[#1e40af] hover:bg-[#1e3a8a]">
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
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1e40af] dark:text-blue-300 tracking-tight flex items-center gap-2.5">
            <UserCheck className="size-8" />
            Laporan Pegawai
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Laporan kehadiran individual pegawai per bulan
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchReport}
          disabled={isLoading}
          className="border-blue-200 dark:border-blue-800 text-[#2563eb] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
        >
          <RefreshCw className={`size-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </motion.div>

      {/* ================================================================= */}
      {/* Filter Card                                                       */}
      {/* ================================================================= */}
      <motion.div variants={itemVariants}>
        <Card className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30 shadow-lg shadow-blue-500/5">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 w-full space-y-1.5">
                <label className="text-sm font-medium text-foreground">Pilih Pegawai</label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="border-blue-200 dark:border-blue-800">
                    <SelectValue placeholder="Pilih pegawai..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.nama} — {emp.nip}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-36 space-y-1.5">
                <label className="text-sm font-medium text-foreground">Bulan</label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger className="border-blue-200 dark:border-blue-800">
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
              </div>
              <div className="w-full sm:w-28 space-y-1.5">
                <label className="text-sm font-medium text-foreground">Tahun</label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger className="border-blue-200 dark:border-blue-800">
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
              </div>
              <Button
                onClick={fetchReport}
                disabled={isLoading || !selectedUserId}
                className="bg-[#1e40af] hover:bg-[#1e3a8a] text-white shadow-lg shadow-blue-500/20 w-full sm:w-auto"
              >
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                ) : (
                  <Search className="size-4 mr-1.5" />
                )}
                Tampilkan
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ================================================================= */}
      {/* Loading state                                                     */}
      {/* ================================================================= */}
      {isLoading && (
        <motion.div variants={itemVariants}>
          <Card className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30 shadow-lg shadow-blue-500/5">
            <CardContent className="p-12">
              <div className="flex flex-col items-center justify-center space-y-3">
                <Loader2 className="size-8 text-[#2563eb] dark:text-blue-400 animate-spin" />
                <p className="text-sm text-muted-foreground">Memuat laporan kehadiran...</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ================================================================= */}
      {/* Report Content                                                    */}
      {/* ================================================================= */}
      {!isLoading && report && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${selectedUserId}-${month}-${year}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* ============================================================= */}
            {/* Employee Info Card                                             */}
            {/* ============================================================= */}
            <motion.div variants={itemVariants}>
              <Card className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30 shadow-lg shadow-blue-500/5">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Avatar */}
                    <div className="size-16 rounded-2xl bg-[#1e40af]/10 dark:bg-blue-900/30 flex items-center justify-center text-xl font-bold text-[#1e40af] dark:text-blue-400 shrink-0 shadow-lg">
                      {report.employee.nama
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>

                    {/* Info grid */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
                      <div className="flex items-center gap-2">
                        <User className="size-4 text-[#2563eb] dark:text-blue-400 shrink-0" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Nama</p>
                          <p className="text-sm font-semibold text-foreground">{report.employee.nama}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="size-4 text-[#2563eb] dark:text-blue-400 shrink-0" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">NIP</p>
                          <p className="text-sm font-semibold text-foreground font-mono">{report.employee.nip}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="size-4 text-[#2563eb] dark:text-blue-400 shrink-0" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Unit Kerja</p>
                          <p className="text-sm font-semibold text-foreground">{report.employee.unitKerja || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase className="size-4 text-[#2563eb] dark:text-blue-400 shrink-0" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Jabatan</p>
                          <p className="text-sm font-semibold text-foreground">{report.employee.jabatan || '-'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Shift info */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50/70 dark:bg-blue-900/20 border border-blue-100/50 dark:border-blue-800/40">
                      <Shield className="size-4 text-[#2563eb] dark:text-blue-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Shift</p>
                        <p className="text-sm font-semibold text-[#1e40af] dark:text-blue-300">
                          {report.employee.shift
                            ? `${report.employee.shift.name} (${formatShiftTime(report.employee.shift.startTime)} - ${formatShiftTime(report.employee.shift.endTime)})`
                            : 'Belum ditentukan'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ============================================================= */}
            {/* Summary Stat Cards                                             */}
            {/* ============================================================= */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              <SummaryStatCard
                label="Hadir"
                value={report.summary.hadir}
                icon={<CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />}
                colorClass="text-green-600 dark:text-green-400"
                bgClass="bg-green-50/70 dark:bg-green-900/10 border-green-200/50 dark:border-green-900/30"
              />
              <SummaryStatCard
                label="Telat"
                value={report.summary.telat}
                icon={<Clock className="size-5 text-amber-600 dark:text-amber-400" />}
                colorClass="text-amber-600 dark:text-amber-400"
                bgClass="bg-amber-50/70 dark:bg-amber-900/10 border-amber-200/50 dark:border-amber-900/30"
              />
              <SummaryStatCard
                label="Izin"
                value={report.summary.izin}
                icon={<FileText className="size-5 text-blue-600 dark:text-blue-400" />}
                colorClass="text-[#2563eb] dark:text-blue-400"
                bgClass="bg-blue-50/70 dark:bg-blue-900/10 border-blue-200/50 dark:border-blue-900/30"
              />
              <SummaryStatCard
                label="Cuti"
                value={report.summary.cuti}
                icon={<Calendar className="size-5 text-emerald-600 dark:text-emerald-400" />}
                colorClass="text-emerald-600 dark:text-emerald-400"
                bgClass="bg-emerald-50/70 dark:bg-emerald-900/10 border-emerald-200/50 dark:border-emerald-900/30"
              />
              <SummaryStatCard
                label="Sakit"
                value={report.summary.sakit}
                icon={<AlertTriangle className="size-5 text-red-600 dark:text-red-400" />}
                colorClass="text-red-600 dark:text-red-400"
                bgClass="bg-red-50/70 dark:bg-red-900/10 border-red-200/50 dark:border-red-900/30"
              />
              <SummaryStatCard
                label="Alpha"
                value={report.summary.alpha}
                icon={<UserX className="size-5 text-red-600 dark:text-red-400" />}
                colorClass="text-red-600 dark:text-red-400"
                bgClass="bg-red-50/70 dark:bg-red-900/10 border-red-200/50 dark:border-red-900/30"
              />
              <SummaryStatCard
                label="Libur"
                value={report.summary.libur}
                icon={<Calendar className="size-5 text-gray-600 dark:text-gray-400" />}
                colorClass="text-gray-600 dark:text-gray-400"
                bgClass="bg-gray-50/70 dark:bg-gray-800/10 border-gray-200/50 dark:border-gray-700/30"
              />
            </div>

            {/* ============================================================= */}
            {/* Daily Attendance Table                                         */}
            {/* ============================================================= */}
            <motion.div variants={itemVariants}>
              <Card className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30 shadow-lg shadow-blue-500/5">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <CardTitle className="text-[#1e40af] dark:text-blue-300 flex items-center gap-2">
                        <Calendar className="size-5" />
                        Rekap Harian &mdash; {monthLabel} {year}
                      </CardTitle>
                      <CardDescription>
                        {report.dailyRecords.length} hari &bull; Periode {monthLabel} {year}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block size-2.5 rounded-full bg-green-500" />
                        Hadir
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block size-2.5 rounded-full bg-amber-500" />
                        Telat
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block size-2.5 rounded-full bg-red-500" />
                        Alpha/Sakit
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block size-2.5 rounded-full bg-gray-400" />
                        Libur
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {report.dailyRecords.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 space-y-2">
                      <AlertTriangle className="size-10 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">Tidak ada data untuk periode ini</p>
                    </div>
                  ) : (
                    <ScrollArea className="max-h-[520px]">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="w-16 text-center">Tgl</TableHead>
                            <TableHead className="w-24">Hari</TableHead>
                            <TableHead className="text-center">Absen Masuk</TableHead>
                            <TableHead className="text-center">Absen Pulang</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <AnimatePresence>
                            {report.dailyRecords.map((record, idx) => (
                              <motion.tr
                                key={record.day}
                                className={`
                                  border-b transition-colors
                                  ${record.isWeekend
                                    ? 'bg-gray-50/60 dark:bg-gray-800/20 border-gray-100 dark:border-gray-800/30'
                                    : 'border-blue-50 dark:border-blue-900/20 hover:bg-blue-50/20 dark:hover:bg-blue-900/5'
                                  }
                                `}
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.015, duration: 0.2 }}
                              >
                                {/* Tanggal */}
                                <TableCell className="text-center">
                                  <span className={`text-sm font-medium ${record.isWeekend ? 'text-gray-400 dark:text-gray-500 italic' : 'text-foreground'}`}>
                                    {record.day}
                                  </span>
                                </TableCell>

                                {/* Hari */}
                                <TableCell>
                                  <span className={`text-sm ${record.isWeekend ? 'text-gray-400 dark:text-gray-500 italic' : 'text-muted-foreground'}`}>
                                    {record.dayName}
                                  </span>
                                </TableCell>

                                {/* Absen Masuk */}
                                <TableCell className="text-center">
                                  {record.masukTime ? (
                                    <span className="text-sm font-mono font-medium text-foreground">
                                      {record.masukTime}
                                    </span>
                                  ) : (
                                    <span className="text-sm text-muted-foreground/50">-</span>
                                  )}
                                </TableCell>

                                {/* Absen Pulang */}
                                <TableCell className="text-center">
                                  {record.pulangTime ? (
                                    <span className="text-sm font-mono font-medium text-foreground">
                                      {record.pulangTime}
                                    </span>
                                  ) : (
                                    <span className="text-sm text-muted-foreground/50">-</span>
                                  )}
                                </TableCell>

                                {/* Status */}
                                <TableCell className="text-center">
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] px-2 py-0 ${statusBadgeClass(record.status)}`}
                                  >
                                    {statusLabel(record.status)}
                                  </Badge>
                                </TableCell>
                              </motion.tr>
                            ))}
                          </AnimatePresence>
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  )
}
