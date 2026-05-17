'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Upload,
  File,
  FileText,
  Image as ImageIcon,
  Film,
  Archive,
  FolderOpen,
  Trash2,
  Download,
  Search,
  Grid3X3,
  List,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Cloud,
  MoreVertical,
  Plus,
  FileUp,
  FileType2,
  Music,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

import { useAuthStore } from '@/store'
import type { FileUploadItem } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
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
// Types
// ---------------------------------------------------------------------------

type CategoryFilter = 'all' | 'documents' | 'images' | 'media' | 'archive' | 'other'
type ViewMode = 'grid' | 'list'

interface BlobStats {
  categories: Record<string, { count: number; totalSize: number }>
  total: { count: number; size: number }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getFileIcon(mimeType: string, size: number = 20) {
  if (mimeType.startsWith('image/')) return <ImageIcon size={size} className="text-emerald-500" />
  if (mimeType.startsWith('video/')) return <Film size={size} className="text-purple-500" />
  if (mimeType.startsWith('audio/')) return <Music size={size} className="text-pink-500" />
  if (mimeType === 'application/pdf') return <FileText size={size} className="text-red-500" />
  if (mimeType.includes('word') || mimeType.includes('document'))
    return <FileText size={size} className="text-blue-500" />
  if (mimeType.includes('sheet') || mimeType.includes('excel'))
    return <FileText size={size} className="text-green-600" />
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint'))
    return <FileText size={size} className="text-orange-500" />
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z') || mimeType.includes('tar') || mimeType.includes('gzip'))
    return <Archive size={size} className="text-amber-600" />
  return <File size={size} className="text-gray-500" />
}

function getCategoryIcon(category: string) {
  switch (category) {
    case 'documents': return <FileText className="size-4" />
    case 'images': return <ImageIcon className="size-4" />
    case 'media': return <Film className="size-4" />
    case 'archive': return <Archive className="size-4" />
    default: return <FileType2 className="size-4" />
  }
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case 'documents': return 'Dokumen'
    case 'images': return 'Gambar'
    case 'media': return 'Media'
    case 'archive': return 'Arsip'
    case 'other': return 'Lainnya'
    default: return category
  }
}

function getCategoryColor(category: string): string {
  switch (category) {
    case 'documents': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
    case 'images': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
    case 'media': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
    case 'archive': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
    case 'other': return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
  }
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function FileManagementSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-40 rounded-xl" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Drop Zone Component
// ---------------------------------------------------------------------------

function DropZone({
  onFilesSelected,
  isUploading,
  maxFileSize,
}: {
  onFilesSelected: (files: File[]) => void
  isUploading: boolean
  maxFileSize: number
}) {
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragOver(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)
      dragCounter.current = 0

      if (isUploading) return

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        // Validate file sizes
        const oversized = files.filter((f) => f.size > maxFileSize)
        if (oversized.length > 0) {
          toast.error(`${oversized.length} file melebihi batas ukuran ${formatBytes(maxFileSize)}`)
        }
        const validFiles = files.filter((f) => f.size <= maxFileSize)
        if (validFiles.length > 0) {
          onFilesSelected(validFiles)
        }
      }
    },
    [isUploading, maxFileSize, onFilesSelected]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      if (files.length > 0) {
        const oversized = files.filter((f) => f.size > maxFileSize)
        if (oversized.length > 0) {
          toast.error(`${oversized.length} file melebihi batas ukuran ${formatBytes(maxFileSize)}`)
        }
        const validFiles = files.filter((f) => f.size <= maxFileSize)
        if (validFiles.length > 0) {
          onFilesSelected(validFiles)
        }
      }
      // Reset input
      if (inputRef.current) inputRef.current.value = ''
    },
    [maxFileSize, onFilesSelected]
  )

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`
        relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer
        ${
          isDragOver
            ? 'border-[#1e40af] bg-blue-50/80 dark:bg-blue-950/30 scale-[1.01]'
            : 'border-blue-200/60 dark:border-blue-800/40 bg-white/40 dark:bg-gray-900/20 hover:border-[#1e40af]/50 hover:bg-blue-50/30 dark:hover:bg-blue-950/10'
        }
        ${isUploading ? 'opacity-60 pointer-events-none' : ''}
      `}
      onClick={() => !isUploading && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileInput}
      />
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <motion.div
          animate={isDragOver ? { scale: 1.15, y: -4 } : { scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className={`
            size-16 rounded-2xl flex items-center justify-center mb-3 transition-colors
            ${isDragOver ? 'bg-[#1e40af] text-white' : 'bg-blue-100 dark:bg-blue-900/30 text-[#1e40af] dark:text-blue-300'}
          `}
        >
          {isUploading ? (
            <svg className="animate-spin size-7" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <FileUp className="size-7" />
          )}
        </motion.div>
        <p className="text-sm font-semibold text-foreground">
          {isUploading ? 'Mengunggah file...' : isDragOver ? 'Lepaskan file di sini' : 'Seret & lepas file di sini'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          atau klik untuk memilih file
        </p>
        <p className="text-[10px] text-muted-foreground mt-2">
          Maks {formatBytes(maxFileSize)} per file • Dokumen, Gambar, Video, Arsip
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// File Card (Grid View)
// ---------------------------------------------------------------------------

function FileCard({
  file,
  isSelected,
  onToggleSelect,
  onDelete,
  isDeleting,
}: {
  file: FileUploadItem
  isSelected: boolean
  onToggleSelect: () => void
  onDelete: () => void
  isDeleting: boolean
}) {
  const isImage = file.mimeType.startsWith('image/')

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`
        group relative rounded-xl border transition-all duration-200 overflow-hidden
        ${
          isSelected
            ? 'border-[#1e40af] bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-[#1e40af]/30'
            : 'border-blue-100/50 dark:border-blue-900/30 bg-white/70 dark:bg-gray-900/40 hover:shadow-lg hover:shadow-blue-500/5 hover:border-[#1e40af]/30'
        }
        ${isDeleting ? 'opacity-50' : ''}
      `}
    >
      {/* Selection checkbox */}
      <div className="absolute top-2 left-2 z-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelect}
          className="bg-white/90 dark:bg-gray-800/90 border-blue-200 dark:border-blue-700"
        />
      </div>

      {/* Actions */}
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800">
              <MoreVertical className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem asChild>
              <a href={`${file.url}?download=true&filename=${encodeURIComponent(file.filename)}`} rel="noopener noreferrer" className="cursor-pointer">
                <Download className="size-3.5 mr-2" />
                Unduh
              </a>
            </DropdownMenuItem>
            {isImage && (
              <DropdownMenuItem asChild>
                <a href={file.url} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                  <ImageIcon className="size-3.5 mr-2" />
                  Lihat
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
            >
              <Trash2 className="size-3.5 mr-2" />
              Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Preview area */}
      <div className="h-32 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 overflow-hidden">
        {isImage ? (
          <img
            src={file.url}
            alt={file.filename}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            {getFileIcon(file.mimeType, 36)}
            <span className="text-[10px] text-muted-foreground uppercase font-medium">
              {file.filename.split('.').pop()}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-1.5">
        <p className="text-xs font-medium truncate text-foreground" title={file.filename}>
          {file.filename}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">{formatBytes(file.size)}</span>
          <Badge
            variant="secondary"
            className={`text-[9px] px-1.5 py-0 h-4 ${getCategoryColor(file.category)}`}
          >
            {getCategoryLabel(file.category)}
          </Badge>
        </div>
        {file.uploader && (
          <p className="text-[10px] text-muted-foreground truncate">
            {file.uploader.nama}
          </p>
        )}
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// File Row (List View)
// ---------------------------------------------------------------------------

function FileRow({
  file,
  isSelected,
  onToggleSelect,
  onDelete,
  isDeleting,
}: {
  file: FileUploadItem
  isSelected: boolean
  onToggleSelect: () => void
  onDelete: () => void
  isDeleting: boolean
}) {
  const isImage = file.mimeType.startsWith('image/')

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={`
        flex items-center gap-3 p-3 rounded-xl border transition-all duration-200
        ${
          isSelected
            ? 'border-[#1e40af] bg-blue-50/50 dark:bg-blue-950/20'
            : 'border-blue-100/50 dark:border-blue-900/30 bg-white/50 dark:bg-gray-900/30 hover:bg-blue-50/30 dark:hover:bg-blue-950/10'
        }
        ${isDeleting ? 'opacity-50' : ''}
      `}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={onToggleSelect}
      />

      {/* Thumbnail / icon */}
      <div className="size-10 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
        {isImage ? (
          <img src={file.url} alt={file.filename} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          getFileIcon(file.mimeType, 20)
        )}
      </div>

      {/* Filename & info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate text-foreground" title={file.filename}>
          {file.filename}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-muted-foreground">{formatBytes(file.size)}</span>
          <span className="text-[10px] text-muted-foreground">•</span>
          <span className="text-[10px] text-muted-foreground">{formatDate(file.createdAt)}</span>
          {file.uploader && (
            <>
              <span className="text-[10px] text-muted-foreground">•</span>
              <span className="text-[10px] text-muted-foreground truncate">{file.uploader.nama}</span>
            </>
          )}
        </div>
      </div>

      {/* Category badge */}
      <Badge
        variant="secondary"
        className={`text-[10px] px-2 py-0.5 h-5 hidden sm:flex ${getCategoryColor(file.category)}`}
      >
        {getCategoryIcon(file.category)}
        <span className="ml-1">{getCategoryLabel(file.category)}</span>
      </Badge>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          asChild
        >
          <a href={`${file.url}?download=true&filename=${encodeURIComponent(file.filename)}`} rel="noopener noreferrer">
            <Download className="size-3.5" />
          </a>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          onClick={onDelete}
          disabled={isDeleting}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function FileManagement() {
  const { user } = useAuthStore()

  // File list state
  const [files, setFiles] = useState<FileUploadItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter & view state
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Upload state
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<FileUploadItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [bulkDeleteTargets, setBulkDeleteTargets] = useState<string[]>([])
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  // Blob stats
  const [blobStats, setBlobStats] = useState<BlobStats | null>(null)

  // Max file size for upload (50MB for largest category)
  const maxFileSize = 50 * 1024 * 1024

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // Reset page on filter change
  useEffect(() => {
    setPage(1)
    setSelectedIds(new Set())
  }, [category, debouncedSearch])

  // ---- Fetch files ----
  const fetchFiles = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', limit.toString())
      if (category !== 'all') params.set('category', category)
      if (debouncedSearch) params.set('search', debouncedSearch)

      const res = await fetch(`/api/file-uploads?${params}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Gagal memuat file')
      }

      const data = await res.json()
      setFiles(data.files || [])
      setTotal(data.pagination?.total || 0)
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (err: any) {
      setError(err.message)
      toast.error('Gagal memuat file', { description: err.message })
    } finally {
      setIsLoading(false)
    }
  }, [page, category, debouncedSearch])

  // ---- Fetch blob stats ----
  const fetchBlobStats = useCallback(async () => {
    try {
      const res = await fetch('/api/blob-stats')
      if (res.ok) {
        const data = await res.json()
        setBlobStats(data)
      }
    } catch {
      // Silent
    }
  }, [])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  useEffect(() => {
    fetchBlobStats()
  }, [fetchBlobStats])

  // ---- Upload files ----
  const handleUpload = useCallback(
    async (fileList: File[]) => {
      if (fileList.length === 0) return

      try {
        setIsUploading(true)
        setUploadProgress(0)

        const formData = new FormData()
        for (const file of fileList) {
          formData.append('files', file)
        }

        const res = await fetch('/api/file-uploads', {
          method: 'POST',
          body: formData,
        })

        setUploadProgress(100)

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || 'Gagal mengunggah file')
        }

        const data = await res.json()
        toast.success(`${data.files.length} file berhasil diunggah`, {
          description: 'File telah disimpan ke Blob Store',
        })

        // Refresh list and stats
        fetchFiles()
        fetchBlobStats()
      } catch (err: any) {
        toast.error('Gagal mengunggah file', {
          description: err.message || 'Terjadi kesalahan',
        })
      } finally {
        setIsUploading(false)
        setUploadProgress(0)
      }
    },
    [fetchFiles, fetchBlobStats]
  )

  // ---- Delete single file ----
  const handleDeleteFile = useCallback(
    async (file: FileUploadItem) => {
      try {
        setIsDeleting(true)
        const res = await fetch('/api/file-uploads', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: file.id }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || 'Gagal menghapus file')
        }
        toast.success('File dihapus', { description: file.filename })
        setDeleteTarget(null)
        setSelectedIds((prev) => {
          const next = new Set(prev)
          next.delete(file.id)
          return next
        })
        fetchFiles()
        fetchBlobStats()
      } catch (err: any) {
        toast.error('Gagal menghapus', { description: err.message })
      } finally {
        setIsDeleting(false)
      }
    },
    [fetchFiles, fetchBlobStats]
  )

  // ---- Bulk delete ----
  const handleBulkDelete = useCallback(async () => {
    if (bulkDeleteTargets.length === 0) return

    try {
      setIsBulkDeleting(true)
      const res = await fetch('/api/file-uploads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: bulkDeleteTargets }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Gagal menghapus file')
      }
      toast.success(`${bulkDeleteTargets.length} file berhasil dihapus`)
      setBulkDeleteTargets([])
      setSelectedIds(new Set())
      fetchFiles()
      fetchBlobStats()
    } catch (err: any) {
      toast.error('Gagal menghapus', { description: err.message })
    } finally {
      setIsBulkDeleting(false)
    }
  }, [bulkDeleteTargets, fetchFiles, fetchBlobStats])

  // ---- Selection handlers ----
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === files.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(files.map((f) => f.id)))
    }
  }, [selectedIds.size, files])

  // ---- Category stats from blobStats ----
  const userCategories = useMemo(() => {
    if (!blobStats) return []
    return [
      { key: 'documents' as const, label: 'Dokumen', icon: FileText, count: blobStats.categories.documents?.count || 0, size: blobStats.categories.documents?.totalSize || 0, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200/60 dark:border-blue-800/40' },
      { key: 'images' as const, label: 'Gambar', icon: ImageIcon, count: blobStats.categories.images?.count || 0, size: blobStats.categories.images?.totalSize || 0, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200/60 dark:border-emerald-800/40' },
      { key: 'media' as const, label: 'Media', icon: Film, count: blobStats.categories.media?.count || 0, size: blobStats.categories.media?.totalSize || 0, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200/60 dark:border-purple-800/40' },
      { key: 'archive' as const, label: 'Arsip', icon: Archive, count: blobStats.categories.archive?.count || 0, size: blobStats.categories.archive?.totalSize || 0, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200/60 dark:border-amber-800/40' },
      { key: 'other' as const, label: 'Lainnya', icon: FileType2, count: blobStats.categories.other?.count || 0, size: blobStats.categories.other?.totalSize || 0, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-900/20', border: 'border-gray-200/60 dark:border-gray-800/40' },
    ]
  }, [blobStats])

  // ---- Loading state ----
  if (isLoading && files.length === 0 && !error) return <FileManagementSkeleton />

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
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1e40af] dark:text-blue-300 tracking-tight flex items-center gap-2">
            <Cloud className="size-7" />
            Kelola File & Blob Store
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Unggah, kelola, dan organisir file dengan Blob Store tanpa konfigurasi
          </p>
        </div>
        <Badge
          variant="outline"
          className="w-fit text-xs border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20"
        >
          <Cloud className="size-3 mr-1" />
          Zero-Config Storage
        </Badge>
      </motion.div>

      {/* ================================================================= */}
      {/* Storage Stats Cards                                               */}
      {/* ================================================================= */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {userCategories.map((cat) => {
          const Icon = cat.icon
          const isActive = category === cat.key
          return (
            <button
              key={cat.key}
              onClick={() => setCategory(isActive ? 'all' : cat.key)}
              className={`
                rounded-xl border p-3 text-left transition-all duration-200
                ${isActive
                  ? `${cat.bg} ${cat.border} ring-2 ring-current ${cat.color}`
                  : `${cat.bg} ${cat.border} hover:shadow-md`
                }
              `}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className={`size-4 ${cat.color}`} />
                <span className={`text-xs font-semibold ${isActive ? cat.color : 'text-foreground'}`}>
                  {cat.label}
                </span>
              </div>
              <p className={`text-lg font-bold ${cat.color}`}>{cat.count}</p>
              <p className="text-[10px] text-muted-foreground">{formatBytes(cat.size)}</p>
            </button>
          )
        })}
      </motion.div>

      {/* ================================================================= */}
      {/* Total Storage Usage                                               */}
      {/* ================================================================= */}
      {blobStats && (
        <motion.div variants={itemVariants}>
          <Card className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30 shadow-lg shadow-blue-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <HardDrive className="size-4 text-[#1e40af] dark:text-blue-400" />
                  <span className="text-sm font-semibold">Total Penggunaan Penyimpanan</span>
                </div>
                <span className="text-sm font-bold text-[#1e40af] dark:text-blue-300">
                  {formatBytes(blobStats.total.size)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{blobStats.total.count} file</span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  {userCategories.reduce((sum, c) => sum + c.count, 0)} file terorganisir
                </span>
              </div>
              {/* Visual breakdown bar */}
              <div className="flex h-2 rounded-full overflow-hidden mt-2 bg-gray-100 dark:bg-gray-800">
                {userCategories.map((cat) => {
                  const pct = blobStats.total.size > 0
                    ? (blobStats.categories[cat.key]?.totalSize || 0) / blobStats.total.size * 100
                    : 0
                  if (pct < 0.5) return null
                  const colorMap: Record<string, string> = {
                    documents: 'bg-blue-500',
                    images: 'bg-emerald-500',
                    media: 'bg-purple-500',
                    archive: 'bg-amber-500',
                    other: 'bg-gray-500',
                  }
                  return (
                    <div
                      key={cat.key}
                      className={`${colorMap[cat.key]} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                      title={`${cat.label}: ${formatBytes(blobStats.categories[cat.key]?.totalSize || 0)}`}
                    />
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ================================================================= */}
      {/* Upload Zone                                                       */}
      {/* ================================================================= */}
      <motion.div variants={itemVariants}>
        <DropZone
          onFilesSelected={handleUpload}
          isUploading={isUploading}
          maxFileSize={maxFileSize}
        />
        {isUploading && uploadProgress > 0 && (
          <Progress value={uploadProgress} className="mt-2 h-1.5" />
        )}
      </motion.div>

      {/* ================================================================= */}
      {/* Toolbar: Search, Filters, View Mode, Actions                      */}
      {/* ================================================================= */}
      <motion.div variants={itemVariants}>
        <Card className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Cari file..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-white dark:bg-gray-800 border-blue-100/50 dark:border-blue-900/30"
                />
              </div>

              {/* Category filter */}
              <Select value={category} onValueChange={(v) => setCategory(v as CategoryFilter)}>
                <SelectTrigger className="w-[140px] bg-white dark:bg-gray-800 border-blue-100/50 dark:border-blue-900/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="documents">Dokumen</SelectItem>
                  <SelectItem value="images">Gambar</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="archive">Arsip</SelectItem>
                  <SelectItem value="other">Lainnya</SelectItem>
                </SelectContent>
              </Select>

              {/* View mode toggle */}
              <div className="flex items-center border rounded-lg overflow-hidden border-blue-100/50 dark:border-blue-900/30">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  className={`rounded-none ${viewMode === 'grid' ? 'bg-[#1e40af] text-white' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="size-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  className={`rounded-none ${viewMode === 'list' ? 'bg-[#1e40af] text-white' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  <List className="size-4" />
                </Button>
              </div>

              {/* Refresh */}
              <Button
                variant="outline"
                size="sm"
                className="border-blue-100/50 dark:border-blue-900/30"
                onClick={() => { fetchFiles(); fetchBlobStats() }}
              >
                <RefreshCw className="size-4" />
              </Button>

              {/* Bulk delete */}
              {selectedIds.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setBulkDeleteTargets(Array.from(selectedIds))}
                >
                  <Trash2 className="size-4 mr-1.5" />
                  Hapus ({selectedIds.size})
                </Button>
              )}
            </div>

            {/* Selection bar */}
            {files.length > 0 && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-blue-100/30 dark:border-blue-900/20">
                <Checkbox
                  checked={selectedIds.size === files.length && files.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-xs text-muted-foreground">
                  {selectedIds.size > 0
                    ? `${selectedIds.size} dipilih`
                    : 'Pilih semua'
                  }
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {total} file total
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ================================================================= */}
      {/* File List / Grid                                                  */}
      {/* ================================================================= */}
      <motion.div variants={itemVariants}>
        {error && files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="size-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertCircle className="size-8 text-red-500" />
            </div>
            <p className="text-lg font-semibold text-foreground">Gagal Memuat File</p>
            <p className="text-sm text-muted-foreground max-w-md text-center">{error}</p>
            <Button onClick={fetchFiles} className="bg-[#1e40af] hover:bg-[#1e3a8a]">
              Coba Lagi
            </Button>
          </div>
        ) : files.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="size-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <FolderOpen className="size-8 text-[#1e40af] dark:text-blue-400" />
            </div>
            <p className="text-lg font-semibold text-foreground">Belum Ada File</p>
            <p className="text-sm text-muted-foreground max-w-md text-center">
              {debouncedSearch || category !== 'all'
                ? 'Tidak ada file yang sesuai dengan filter. Coba ubah filter pencarian.'
                : 'Unggah file pertama Anda dengan menyeret file ke area unggah di atas.'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <AnimatePresence mode="popLayout">
              {files.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  isSelected={selectedIds.has(file.id)}
                  onToggleSelect={() => toggleSelect(file.id)}
                  onDelete={() => setDeleteTarget(file)}
                  isDeleting={isDeleting && deleteTarget?.id === file.id}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {files.map((file) => (
                <FileRow
                  key={file.id}
                  file={file}
                  isSelected={selectedIds.has(file.id)}
                  onToggleSelect={() => toggleSelect(file.id)}
                  onDelete={() => setDeleteTarget(file)}
                  isDeleting={isDeleting && deleteTarget?.id === file.id}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Loading more */}
        {isLoading && files.length > 0 && (
          <div className="flex justify-center py-4">
            <svg className="animate-spin size-6 text-[#1e40af]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}
      </motion.div>

      {/* ================================================================= */}
      {/* Pagination                                                        */}
      {/* ================================================================= */}
      {totalPages > 1 && (
        <motion.div variants={itemVariants} className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="border-blue-100/50 dark:border-blue-900/30"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Halaman {page} dari {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="border-blue-100/50 dark:border-blue-900/30"
          >
            <ChevronRight className="size-4" />
          </Button>
        </motion.div>
      )}

      {/* ================================================================= */}
      {/* Delete Confirmation Dialog                                        */}
      {/* ================================================================= */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus File</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus file <strong>&quot;{deleteTarget?.filename}&quot;</strong>? File akan dihapus secara permanen dari Blob Store dan tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDeleteFile(deleteTarget)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Menghapus...
                </span>
              ) : (
                'Hapus File'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ================================================================= */}
      {/* Bulk Delete Confirmation Dialog                                    */}
      {/* ================================================================= */}
      <AlertDialog
        open={bulkDeleteTargets.length > 0}
        onOpenChange={(open) => !open && setBulkDeleteTargets([])}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {bulkDeleteTargets.length} File</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus {bulkDeleteTargets.length} file yang dipilih? Semua file akan dihapus secara permanen dari Blob Store dan tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isBulkDeleting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Menghapus...
                </span>
              ) : (
                `Hapus ${bulkDeleteTargets.length} File`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
