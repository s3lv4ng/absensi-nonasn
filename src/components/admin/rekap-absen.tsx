'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  CalendarDays,
  RefreshCw,
  Printer,
  Download,
  TableProperties,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
  const years = []
  for (let y = currentYear; y >= currentYear - 5; y--) {
    years.push({ value: String(y), label: String(y) })
  }
  return years
}

// ---------------------------------------------------------------------------
// Animation
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
// Status cell renderer
// ---------------------------------------------------------------------------

function StatusCell({ day }: { day: DayData }) {
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

  // Leave / status codes
  const statusDisplay: Record<string, { text: string; bg: string; textClass: string }> = {
    DL: { text: 'DL', bg: 'bg-sky-50 dark:bg-sky-900/20', textClass: 'text-sky-700 dark:text-sky-400' },
    DD: { text: 'DD', bg: 'bg-indigo-50 dark:bg-indigo-900/20', textClass: 'text-indigo-700 dark:text-indigo-400' },
    I: { text: 'I', bg: 'bg-blue-50 dark:bg-blue-900/20', textClass: 'text-blue-700 dark:text-blue-400' },
    C: { text: 'C', bg: 'bg-purple-50 dark:bg-purple-900/20', textClass: 'text-purple-700 dark:text-purple-400' },
    S: { text: 'S', bg: 'bg-green-50 dark:bg-green-900/20', textClass: 'text-green-700 dark:text-green-400' },
    ALPHA: { text: 'A', bg: 'bg-red-50 dark:bg-red-900/20', textClass: 'text-red-700 dark:text-red-400' },
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

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const res = await fetch(`/api/rekap-absen?month=${month}&year=${year}`)
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
  }, [month, year])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    setCurrentPage(1)
  }, [month, year])

  const totalPages = Math.max(1, Math.ceil((data?.employees.length || 0) / pageSize))
  const paginatedEmployees = data?.employees.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  ) || []

  const monthLabel = MONTHS.find((m) => m.value === month)?.label ?? month

  // Print handler
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
          if (day.isWeekend || day.isHoliday) {
            tableHtml += `<td class="weekend">-</td>`
          } else if (day.status === 'HADIR') {
            tableHtml += `<td>${day.masuk || '-'}<br/>${day.pulang || '-'}</td>`
          } else if (day.status === 'TELAT') {
            tableHtml += `<td class="telat">${day.masuk || '-'}<br/>${day.pulang || '-'}</td>`
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
        <h4>Bulan: ${monthLabel} ${year}</h4>
        ${tablesHtml}
        <div class="legend">
          <div class="legend-item"><span class="legend-box" style="background:#e0f2fe;"></span> DL = Dinas Luar</div>
          <div class="legend-item"><span class="legend-box" style="background:#e0e7ff;"></span> DD = Dinas Dalam</div>
          <div class="legend-item"><span class="legend-box" style="background:#dbeafe;"></span> I = Izin</div>
          <div class="legend-item"><span class="legend-box" style="background:#f3e8ff;"></span> C = Cuti</div>
          <div class="legend-item"><span class="legend-box" style="background:#dcfce7;"></span> S = Sakit</div>
          <div class="legend-item"><span class="legend-box" style="background:#fee2e2;"></span> A = Alpha</div>
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

  // Export PDF handler (generates and downloads)
  const handleExportPDF = async () => {
    try {
      toast.info('Mempersiapkan PDF...')
      // Use the print method which can save as PDF
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
      {/* Legend                                                             */}
      {/* ================================================================= */}
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
                <span className="inline-block size-3 rounded-sm bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600" />
                <span className="text-muted-foreground">- = Libur / Weekend</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ================================================================= */}
      {/* Rekap Table                                                       */}
      {/* ================================================================= */}
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
    </motion.div>
  )
}
