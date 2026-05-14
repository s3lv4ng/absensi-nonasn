'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  ClipboardCheck,
  Plus,
  CalendarDays,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Send,
  Trash2,
  Briefcase,
  Plane,
  Heart,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  Filter,
  Upload,
  Paperclip,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import type { LeaveRequest, LeaveType, LeaveStatus } from '@/types'

// Default leave type config for the 4 built-in types
const defaultLeaveTypeConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string; desc: string }> = {
  IZIN: {
    label: 'Izin',
    icon: FileText,
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-100 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800',
    desc: 'Izin keperluan pribadi',
  },
  CUTI: {
    label: 'Cuti',
    icon: Plane,
    color: 'text-purple-700 dark:text-purple-300',
    bgColor: 'bg-purple-100 dark:bg-purple-900/40 border-purple-200 dark:border-purple-800',
    desc: 'Cuti tahunan / cuti khusus',
  },
  SAKIT: {
    label: 'Sakit',
    icon: Stethoscope,
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-900/40 border-red-200 dark:border-red-800',
    desc: 'Izin sakit (dengan surat keterangan)',
  },
  DINAS: {
    label: 'Dinas',
    icon: Briefcase,
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-100 dark:bg-amber-900/40 border-amber-200 dark:border-amber-800',
    desc: 'Perjalanan dinas luar kantor',
  },
}

// Helper to get config for any leave type (default or custom)
function getLeaveTypeConfig(typeCode: string, customTypes: LeaveTypeCategory[]) {
  if (defaultLeaveTypeConfig[typeCode]) {
    return defaultLeaveTypeConfig[typeCode]
  }
  // Look for custom type
  const custom = customTypes.find(t => t.code === typeCode)
  if (custom) {
    return {
      label: custom.name,
      icon: FileText,
      color: 'text-slate-700 dark:text-slate-300',
      bgColor: 'bg-slate-100 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700',
      desc: custom.description || '',
    }
  }
  // Fallback
  return {
    label: typeCode,
    icon: FileText,
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-100 dark:bg-gray-900/40 border-gray-200 dark:border-gray-700',
    desc: '',
  }
}

interface LeaveTypeCategory {
  id: string
  name: string
  code: string
  description: string | null
  color: string
  isActive: boolean
}

const statusConfig: Record<LeaveStatus, { label: string; color: string; bgColor: string; icon: React.ComponentType<{ className?: string }> }> = {
  PENDING: {
    label: 'Menunggu',
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-100 dark:bg-amber-900/40 border-amber-200 dark:border-amber-800',
    icon: Clock,
  },
  APPROVED: {
    label: 'Disetujui',
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800',
    icon: CheckCircle2,
  },
  REJECTED: {
    label: 'Ditolak',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-900/40 border-red-200 dark:border-red-800',
    icon: XCircle,
  },
}

export function LeaveSubmission() {
  const { user } = useAuthStore()

  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [customLeaveTypes, setCustomLeaveTypes] = useState<LeaveTypeCategory[]>([])

  // New leave form state
  const [formType, setFormType] = useState<string>('IZIN')
  const [formStartDate, setFormStartDate] = useState('')
  const [formEndDate, setFormEndDate] = useState('')
  const [formReason, setFormReason] = useState('')
  const [formAttachment, setFormAttachment] = useState<File | null>(null)
  const [formAttachmentName, setFormAttachmentName] = useState('')

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  })

  const fetchLeaves = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/leaves')
      if (res.ok) {
        const data = await res.json()
        const leavesData: LeaveRequest[] = data.leaves || []
        setLeaves(leavesData)
        setStats({
          total: leavesData.length,
          pending: leavesData.filter((l) => l.status === 'PENDING').length,
          approved: leavesData.filter((l) => l.status === 'APPROVED').length,
          rejected: leavesData.filter((l) => l.status === 'REJECTED').length,
        })
      }
    } catch {
      toast.error('Gagal memuat data pengajuan')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchCustomLeaveTypes = useCallback(async () => {
    try {
      const res = await fetch('/api/leave-types')
      if (res.ok) {
        const data = await res.json()
        setCustomLeaveTypes(data.leaveTypes || [])
      }
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    fetchLeaves()
    fetchCustomLeaveTypes()
  }, [fetchLeaves, fetchCustomLeaveTypes])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB')
      return
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format file tidak didukung. Gunakan JPG, PNG, PDF, atau DOC/DOCX')
      return
    }

    setFormAttachment(file)
    setFormAttachmentName(file.name)
  }

  const removeAttachment = () => {
    setFormAttachment(null)
    setFormAttachmentName('')
  }

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal mengupload file')
      }
      const data = await res.json()
      return data.url
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengupload file')
      return null
    }
  }

  const handleSubmit = async () => {
    if (!formType || !formStartDate || !formEndDate || !formReason.trim()) {
      toast.error('Semua field wajib diisi')
      return
    }

    if (new Date(formEndDate) < new Date(formStartDate)) {
      toast.error('Tanggal akhir harus setelah tanggal awal')
      return
    }

    setIsSubmitting(true)
    try {
      // Upload attachment if present
      let attachmentUrl: string | null = null
      if (formAttachment) {
        attachmentUrl = await uploadFile(formAttachment)
        if (formAttachment && !attachmentUrl) {
          // Upload failed, error already shown by uploadFile
          setIsSubmitting(false)
          return
        }
      }

      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formType,
          startDate: formStartDate,
          endDate: formEndDate,
          reason: formReason.trim(),
          attachment: attachmentUrl,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengajukan')
      }

      toast.success('Pengajuan berhasil dikirim!', {
        description: 'Menunggu persetujuan admin',
      })

      // Reset form
      setFormType('IZIN')
      setFormStartDate('')
      setFormEndDate('')
      setFormReason('')
      setFormAttachment(null)
      setFormAttachmentName('')
      setShowNewDialog(false)
      fetchLeaves()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengajukan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/leaves?id=${deleteId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal membatalkan')
      }

      toast.success('Pengajuan berhasil dibatalkan')
      setDeleteId(null)
      fetchLeaves()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal membatalkan')
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const getDayCount = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diff = endDate.getTime() - startDate.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1
  }

  // Filtered leaves
  const filteredLeaves = filterStatus === 'ALL'
    ? leaves
    : leaves.filter((l) => l.status === filterStatus)

  // Get today's date string for min date validation
  const today = new Date().toISOString().split('T')[0]

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
              Pengajuan Dinas / Cuti / Izin
            </h2>
            <p className="text-sm text-muted-foreground">
              Ajukan permohonan izin, cuti, sakit, atau dinas
            </p>
          </div>
          <Button
            onClick={() => setShowNewDialog(true)}
            className="bg-[#1e40af] hover:bg-[#1e3a8a] text-white shadow-lg shadow-blue-500/25"
          >
            <Plus className="mr-2 h-4 w-4" />
            Buat Pengajuan
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-blue-100/50 dark:border-blue-900/30">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="size-10 rounded-xl flex items-center justify-center bg-[#1e40af]/10 text-[#1e40af] dark:bg-blue-900/30 dark:text-blue-400">
                <ClipboardCheck className="size-5" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-7 w-8" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                )}
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-amber-100/50 dark:border-amber-900/30">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="size-10 rounded-xl flex items-center justify-center bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                <Clock className="size-5" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-7 w-8" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                )}
                <p className="text-xs text-muted-foreground">Menunggu</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-emerald-100/50 dark:border-emerald-900/30">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="size-10 rounded-xl flex items-center justify-center bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-7 w-8" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{stats.approved}</p>
                )}
                <p className="text-xs text-muted-foreground">Disetujui</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-red-100/50 dark:border-red-900/30">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="size-10 rounded-xl flex items-center justify-center bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                <XCircle className="size-5" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-7 w-8" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{stats.rejected}</p>
                )}
                <p className="text-xs text-muted-foreground">Ditolak</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Filter */}
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filter:</span>
          <div className="flex gap-1.5 flex-wrap">
            {[
              { key: 'ALL', label: 'Semua' },
              { key: 'PENDING', label: 'Menunggu' },
              { key: 'APPROVED', label: 'Disetujui' },
              { key: 'REJECTED', label: 'Ditolak' },
            ].map((f) => (
              <Button
                key={f.key}
                variant={filterStatus === f.key ? 'default' : 'outline'}
                size="sm"
                className={`h-7 text-xs ${
                  filterStatus === f.key
                    ? 'bg-[#1e40af] hover:bg-[#1e3a8a] text-white'
                    : 'border-blue-200 dark:border-blue-800 text-[#1e40af] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50'
                }`}
                onClick={() => setFilterStatus(f.key)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Leave Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="space-y-3"
      >
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-blue-100/50 dark:border-blue-900/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredLeaves.length === 0 ? (
          <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-blue-100/50 dark:border-blue-900/30">
            <CardContent className="p-8 flex flex-col items-center justify-center gap-4">
              <div className="flex size-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <FileText className="h-8 w-8 text-[#1e40af] dark:text-blue-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">
                  Belum Ada Pengajuan
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Klik &quot;Buat Pengajuan&quot; untuk mengajukan izin, cuti, sakit, atau dinas
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence>
            {filteredLeaves.map((leave) => {
              const typeConf = getLeaveTypeConfig(leave.type, customLeaveTypes)
              const statusConf = statusConfig[leave.status]
              const TypeIcon = typeConf.icon
              const StatusIcon = statusConf.icon
              const dayCount = getDayCount(leave.startDate, leave.endDate)
              const isExpanded = expandedId === leave.id
              const canCancel = leave.status === 'PENDING' && !leave.isManualEntry

              return (
                <motion.div
                  key={leave.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className={`bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-blue-100/50 dark:border-blue-900/30 overflow-hidden transition-all ${isExpanded ? 'shadow-md' : ''}`}>
                    <CardContent className="p-4">
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${typeConf.bgColor} border`}>
                            <TypeIcon className={`size-5 ${typeConf.color}`} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-foreground">
                                {typeConf.label}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 h-4 ${statusConf.bgColor} ${statusConf.color}`}
                              >
                                <StatusIcon className="mr-1 h-3 w-3" />
                                {statusConf.label}
                              </Badge>
                              {leave.isManualEntry && (
                                <Badge className="text-[10px] px-1.5 py-0 h-4 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-0">
                                  Manual
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
                              <span className="ml-1 font-medium text-[#1e40af] dark:text-blue-400">
                                ({dayCount} hari)
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {canCancel && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
                              onClick={() => setDeleteId(leave.id)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground"
                            onClick={() => setExpandedId(isExpanded ? null : leave.id)}
                          >
                            {isExpanded ? (
                              <ChevronUp className="size-4" />
                            ) : (
                              <ChevronDown className="size-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 pt-3 border-t border-blue-100 dark:border-blue-900/30 space-y-2">
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">Alasan:</p>
                                <p className="text-sm text-foreground">{leave.reason}</p>
                              </div>
                              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <CalendarDays className="h-3 w-3" />
                                  Diajukan: {formatDate(leave.createdAt)}
                                </div>
                                {leave.approvedAt && (
                                  <div className="flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Diproses: {formatDate(leave.approvedAt)}
                                  </div>
                                )}
                              </div>
                              {leave.attachment && (
                                <div className="flex items-center gap-2 mt-1">
                                  <Paperclip className="size-3 text-[#1e40af] dark:text-blue-400" />
                                  <a
                                    href={leave.attachment}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-[#1e40af] dark:text-blue-400 hover:underline"
                                  >
                                    Lihat Bukti Dukung
                                  </a>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </motion.div>

      {/* New Leave Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1e3a8a] dark:text-blue-300">
              <Send className="h-5 w-5" />
              Buat Pengajuan Baru
            </DialogTitle>
            <DialogDescription>
              Isi form berikut untuk mengajukan izin, cuti, sakit, atau dinas
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Leave Type Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#1e40af] dark:text-blue-400">
                Jenis Pengajuan
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {/* Default types */}
                {(Object.entries(defaultLeaveTypeConfig) as [string, typeof defaultLeaveTypeConfig.IZIN][]).map(([key, conf]) => {
                  const Icon = conf.icon
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormType(key)}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${
                        formType === key
                          ? 'border-[#1e40af] bg-blue-50 dark:bg-blue-950/50 shadow-md'
                          : 'border-blue-100 dark:border-blue-900/30 bg-white/60 dark:bg-gray-900/60 hover:border-blue-200 dark:hover:border-blue-800'
                      }`}
                    >
                      <div className={`flex size-8 items-center justify-center rounded-lg ${conf.bgColor} border`}>
                        <Icon className={`size-4 ${conf.color}`} />
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${formType === key ? 'text-[#1e40af] dark:text-blue-300' : 'text-foreground'}`}>
                          {conf.label}
                        </p>
                        <p className="text-[10px] text-muted-foreground leading-tight">
                          {conf.desc}
                        </p>
                      </div>
                    </button>
                  )
                })}
                {/* Custom leave types */}
                {customLeaveTypes.filter(t => t.isActive).map((ct) => (
                  <button
                    key={ct.code}
                    type="button"
                    onClick={() => setFormType(ct.code)}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${
                      formType === ct.code
                        ? 'border-[#1e40af] bg-blue-50 dark:bg-blue-950/50 shadow-md'
                        : 'border-blue-100 dark:border-blue-900/30 bg-white/60 dark:bg-gray-900/60 hover:border-blue-200 dark:hover:border-blue-800'
                    }`}
                  >
                    <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700">
                      <FileText className="size-4" style={{ color: ct.color }} />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${formType === ct.code ? 'text-[#1e40af] dark:text-blue-300' : 'text-foreground'}`}>
                        {ct.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground leading-tight">
                        {ct.description || ct.code}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1e40af] dark:text-blue-400">
                  Tanggal Mulai
                </Label>
                <Input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  min={today}
                  className="border-blue-200 focus:border-[#1e40af] dark:border-blue-800"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1e40af] dark:text-blue-400">
                  Tanggal Akhir
                </Label>
                <Input
                  type="date"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                  min={formStartDate || today}
                  className="border-blue-200 focus:border-[#1e40af] dark:border-blue-800"
                />
              </div>
            </div>

            {/* Day count indicator */}
            {formStartDate && formEndDate && (
              <div className="flex items-center gap-2 text-sm">
                <CalendarDays className="h-4 w-4 text-[#1e40af] dark:text-blue-400" />
                <span className="text-muted-foreground">
                  Total:{' '}
                  <span className="font-semibold text-[#1e40af] dark:text-blue-400">
                    {getDayCount(formStartDate, formEndDate)} hari
                  </span>
                </span>
              </div>
            )}

            {/* Reason */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#1e40af] dark:text-blue-400">
                Alasan
              </Label>
              <Textarea
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                placeholder="Jelaskan alasan pengajuan Anda..."
                rows={3}
                className="border-blue-200 focus:border-[#1e40af] dark:border-blue-800 resize-none"
              />
            </div>

            {/* Bukti Dukung */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#1e40af] dark:text-blue-400">
                Bukti Dukung (Opsional)
              </Label>
              {!formAttachment ? (
                <div className="relative">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex items-center gap-2 p-3 rounded-xl border-2 border-dashed border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer">
                    <Upload className="size-5 text-[#1e40af] dark:text-blue-400" />
                    <div>
                      <p className="text-sm font-medium text-[#1e40af] dark:text-blue-400">Klik untuk upload</p>
                      <p className="text-[10px] text-muted-foreground">JPG, PNG, PDF, DOC/DOCX (Maks. 5MB)</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                  <Paperclip className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm text-emerald-700 dark:text-emerald-300 flex-1 truncate">{formAttachmentName}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={removeAttachment}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              )}
            </div>

            {/* Info note */}
            <div className="flex items-start gap-2 rounded-lg bg-blue-50/80 dark:bg-blue-950/30 p-3 border border-blue-100 dark:border-blue-900/40">
              <AlertCircle className="h-4 w-4 text-[#1e40af] dark:text-blue-400 mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Pengajuan Anda akan dikirim ke admin untuk diproses. Anda akan mendapat notifikasi setelah admin menyetujui atau menolak pengajuan.
              </p>
            </div>

            {/* Submit button */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowNewDialog(false)}
                disabled={isSubmitting}
                className="border-blue-200 dark:border-blue-800"
              >
                Batal
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !formType || !formStartDate || !formEndDate || !formReason.trim()}
                className="bg-[#1e40af] hover:bg-[#1e3a8a] text-white shadow-lg shadow-blue-500/25 min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Kirim
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Batalkan Pengajuan?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Pengajuan yang sudah dibatalkan tidak dapat dikembalikan. Anda perlu membuat pengajuan baru jika ingin mengajukan kembali.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Tidak</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Membatalkan...
                </>
              ) : (
                'Ya, Batalkan'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
