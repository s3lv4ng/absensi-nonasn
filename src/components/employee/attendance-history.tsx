'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
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
import {
  History,
  CalendarDays,
  Search,
  ChevronLeft,
  ChevronRight,
  LogIn,
  LogOut,
  MapPin,
  Fingerprint,
  FileX2,
  Filter,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Attendance, AttendanceStatus, AttendanceType } from '@/types'

interface AttendanceResponse {
  attendances: Attendance[]
  total: number
  page: number
  totalPages: number
}

const ITEMS_PER_PAGE = 10

const statusConfig: Record<
  AttendanceStatus,
  { label: string; color: string; bgColor: string }
> = {
  HADIR: {
    label: 'Hadir',
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor:
      'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800',
  },
  TELAT: {
    label: 'Telat',
    color: 'text-amber-700 dark:text-amber-300',
    bgColor:
      'bg-amber-100 dark:bg-amber-900/40 border-amber-200 dark:border-amber-800',
  },
  ALPHA: {
    label: 'Alpha',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-900/40 border-red-200 dark:border-red-800',
  },
  IZIN: {
    label: 'Izin',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor:
      'bg-blue-100 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800',
  },
  CUTI: {
    label: 'Cuti',
    color: 'text-purple-700 dark:text-purple-300',
    bgColor:
      'bg-purple-100 dark:bg-purple-900/40 border-purple-200 dark:border-purple-800',
  },
}

export function AttendanceHistory() {
  const { user } = useAuthStore()

  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0]
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0]

  const [startDate, setStartDate] = useState(firstDayOfMonth)
  const [endDate, setEndDate] = useState(lastDayOfMonth)

  const fetchAttendances = useCallback(
    async (page: number = 1) => {
      try {
        setIsLoading(true)
        const params = new URLSearchParams({
          startDate,
          endDate,
          page: page.toString(),
          limit: ITEMS_PER_PAGE.toString(),
        })

        const res = await fetch(`/api/attendance?${params}`)
        if (res.ok) {
          const data: AttendanceResponse = await res.json()
          setAttendances(data.attendances || [])
          setTotalPages(data.totalPages)
          setTotal(data.total)
          setCurrentPage(page)
        }
      } catch {
        toast.error('Gagal memuat riwayat absensi')
      } finally {
        setIsLoading(false)
      }
    },
    [startDate, endDate]
  )

  useEffect(() => {
    fetchAttendances(1)
  }, [fetchAttendances])

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchAttendances(page)
    }
  }

  const handleResetFilters = () => {
    setStartDate(firstDayOfMonth)
    setEndDate(lastDayOfMonth)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: AttendanceStatus) => {
    const config = statusConfig[status] || statusConfig.HADIR
    return (
      <Badge
        variant="outline"
        className={`text-[10px] px-2 py-0 h-5 ${config.color} ${config.bgColor}`}
      >
        {config.label}
      </Badge>
    )
  }

  const getTypeBadge = (type: AttendanceType) => {
    if (type === 'MASUK') {
      return (
        <Badge
          variant="outline"
          className="text-[10px] px-2 py-0 h-5 text-[#1e40af] dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800"
        >
          <LogIn className="mr-1 h-3 w-3" />
          Masuk
        </Badge>
      )
    }
    return (
      <Badge
        variant="outline"
        className="text-[10px] px-2 py-0 h-5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800"
      >
        <LogOut className="mr-1 h-3 w-3" />
        Pulang
      </Badge>
    )
  }

  // Generate page numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('...')

      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) pages.push(i)

      if (currentPage < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }

    return pages
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
              Riwayat Absensi
            </h2>
            <p className="text-sm text-muted-foreground">
              Catatan kehadiran Anda dalam rentang tanggal
            </p>
          </div>
          <Badge
            variant="outline"
            className="text-[#1e40af] dark:text-blue-400 border-blue-200 dark:border-blue-800 w-fit"
          >
            <History className="mr-1 h-3 w-3" />
            {total} Catatan
          </Badge>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-blue-100/50 dark:border-blue-900/30">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex items-center gap-2 text-sm font-medium text-[#1e40af] dark:text-blue-400 shrink-0">
                <Filter className="h-4 w-4" />
                <span>Filter</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 w-full">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Tanggal Mulai
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-9 text-sm border-blue-200 focus:border-[#1e40af] dark:border-blue-800"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Tanggal Akhir
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-9 text-sm border-blue-200 focus:border-[#1e40af] dark:border-blue-800"
                  />
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="border-blue-200 text-[#1e40af] hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/50 h-9"
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Desktop Table View */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="hidden md:block"
      >
        <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-blue-100/50 dark:border-blue-900/30">
          <CardHeader className="pb-0">
            <CardTitle className="text-base text-[#1e3a8a] dark:text-blue-300 flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Daftar Kehadiran
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            ) : attendances.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-blue-100 dark:border-blue-900/30">
                      <TableHead className="text-[#1e40af] dark:text-blue-400 font-semibold">
                        Tanggal
                      </TableHead>
                      <TableHead className="text-[#1e40af] dark:text-blue-400 font-semibold">
                        Jam
                      </TableHead>
                      <TableHead className="text-[#1e40af] dark:text-blue-400 font-semibold">
                        Tipe
                      </TableHead>
                      <TableHead className="text-[#1e40af] dark:text-blue-400 font-semibold">
                        Status
                      </TableHead>
                      <TableHead className="text-[#1e40af] dark:text-blue-400 font-semibold">
                        Lokasi
                      </TableHead>
                      <TableHead className="text-[#1e40af] dark:text-blue-400 font-semibold">
                        Confidence
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendances.map((record) => (
                      <TableRow
                        key={record.id}
                        className="border-blue-50 dark:border-blue-900/20 hover:bg-blue-50/50 dark:hover:bg-blue-950/30"
                      >
                        <TableCell className="font-medium text-sm">
                          {formatDate(record.createdAt)}
                        </TableCell>
                        <TableCell className="text-sm tabular-nums">
                          {formatTime(record.createdAt)}
                        </TableCell>
                        <TableCell>{getTypeBadge(record.type)}</TableCell>
                        <TableCell>
                          {getStatusBadge(record.status)}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="font-mono text-xs">
                              {record.latitude.toFixed(4)},{' '}
                              {record.longitude.toFixed(4)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Fingerprint className="h-3 w-3 text-muted-foreground" />
                            <span
                              className={`text-xs font-medium ${
                                record.confidence >= 0.9
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : record.confidence >= 0.8
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-red-600 dark:text-red-400'
                              }`}
                            >
                              {(record.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Halaman {currentPage} dari {totalPages} ({total} data)
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 border-blue-200 dark:border-blue-800"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      {getPageNumbers().map((page, i) =>
                        typeof page === 'string' ? (
                          <span
                            key={`ellipsis-${i}`}
                            className="px-1 text-xs text-muted-foreground"
                          >
                            ...
                          </span>
                        ) : (
                          <Button
                            key={page}
                            variant={
                              currentPage === page ? 'default' : 'outline'
                            }
                            size="icon"
                            className={`h-8 w-8 ${
                              currentPage === page
                                ? 'bg-[#1e40af] hover:bg-[#1e3a8a]'
                                : 'border-blue-200 dark:border-blue-800'
                            }`}
                            onClick={() => handlePageChange(page)}
                          >
                            <span className="text-xs">{page}</span>
                          </Button>
                        )
                      )}
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 border-blue-200 dark:border-blue-800"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Mobile Card View */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="md:hidden space-y-3"
      >
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card
                key={i}
                className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-blue-100/50 dark:border-blue-900/30"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : attendances.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {attendances.map((record) => (
              <Card
                key={record.id}
                className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-blue-100/50 dark:border-blue-900/30"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex size-8 items-center justify-center rounded-lg ${
                          record.type === 'MASUK'
                            ? 'bg-[#1e40af]/10 dark:bg-blue-900/30'
                            : 'bg-emerald-100 dark:bg-emerald-900/30'
                        }`}
                      >
                        {record.type === 'MASUK' ? (
                          <LogIn className="h-4 w-4 text-[#1e40af] dark:text-blue-400" />
                        ) : (
                          <LogOut className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          {formatDate(record.createdAt)}
                        </p>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {formatTime(record.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTypeBadge(record.type)}
                      {getStatusBadge(record.status)}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="font-mono truncate">
                        {record.latitude.toFixed(4)},{' '}
                        {record.longitude.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Fingerprint className="h-3 w-3 text-muted-foreground" />
                      <span
                        className={`font-medium ${
                          record.confidence >= 0.9
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : record.confidence >= 0.8
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {(record.confidence * 100).toFixed(0)}% confidence
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Mobile Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-200 dark:border-blue-800"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Prev
                </Button>
                <span className="text-xs text-muted-foreground px-2">
                  {currentPage}/{totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-200 dark:border-blue-800"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <div className="flex size-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
        <FileX2 className="h-8 w-8 text-[#1e40af] dark:text-blue-400" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground">
          Belum Ada Riwayat Absensi
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Tidak ditemukan catatan absensi dalam rentang tanggal yang dipilih
        </p>
      </div>
    </div>
  )
}
