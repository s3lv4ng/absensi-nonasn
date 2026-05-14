'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Users,
  Search,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  Fingerprint,
  AlertTriangle,
  X,
  Clock,
} from 'lucide-react'

import { useAppStore } from '@/store'
import type { User, Role, WorkShift } from '@/types'
import { DataPagination } from '@/components/shared/data-pagination'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UsersResponse {
  users: User[]
  total: number
  page: number
  totalPages: number
}

interface EmployeeFormData {
  nip: string
  nama: string
  email: string
  password: string
  role: Role
  unitKerja: string
  jabatan: string
  shiftId: string
  isActive: boolean
}

const emptyForm: EmployeeFormData = {
  nip: '',
  nama: '',
  email: '',
  password: '',
  role: 'PEGAWAI',
  unitKerja: '',
  jabatan: '',
  shiftId: '',
  isActive: true,
}

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

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function EmployeeSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-40" />
      </div>
      <Card className="bg-white/70 dark:bg-gray-900/60">
        <CardContent className="p-0">
          <div className="space-y-0">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-blue-50 dark:border-blue-900/20">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Employee Card (mobile view)
// ---------------------------------------------------------------------------

function EmployeeCard({
  user,
  onEdit,
  onResetFace,
  onToggleActive,
  onDelete,
}: {
  user: User
  onEdit: (user: User) => void
  onResetFace: (user: User) => void
  onToggleActive: (user: User) => void
  onDelete: (user: User) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-xl border border-blue-100/50 dark:border-blue-900/30 bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl p-4 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <Avatar className="size-12 ring-2 ring-blue-100 dark:ring-blue-900/40 shrink-0">
          <AvatarImage src={user.photo ?? undefined} alt={user.nama} />
          <AvatarFallback className="bg-[#1e40af]/10 text-[#1e40af] dark:bg-blue-900/30 dark:text-blue-400 font-bold text-sm">
            {getInitials(user.nama)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground truncate">{user.nama}</p>
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 ${
                  user.role === 'ADMIN'
                    ? 'bg-[#1e40af]/10 text-[#1e40af] dark:bg-blue-900/30 dark:text-blue-300 border-[#1e40af]/20'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                }`}
              >
                {user.role}
              </Badge>
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 ${
                  user.isActive
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
                    : 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                }`}
              >
                {user.isActive ? 'Aktif' : 'Nonaktif'}
              </Badge>
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-mono">{user.nip}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
            {user.unitKerja && <span>{user.unitKerja}</span>}
            {user.jabatan && <span>• {user.jabatan}</span>}
          </div>
          {user.shift && (
            <div className="flex items-center gap-1.5 pt-1">
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800"
              >
                <Clock className="size-2.5 mr-0.5" />
                {user.shift.name} ({user.shift.startTime} - {user.shift.endTime})
              </Badge>
            </div>
          )}
          <div className="flex items-center gap-1.5 pt-1">
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 ${
                user.faceDescriptor
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
                  : 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700'
              }`}
            >
              <Fingerprint className="size-2.5 mr-0.5" />
              {user.faceDescriptor ? 'Terdaftar' : 'Belum'}
            </Badge>
          </div>
        </div>
      </div>
      <Separator className="my-3 bg-blue-50 dark:bg-blue-900/20" />
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-8 text-xs border-blue-200 dark:border-blue-800 text-[#2563eb] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          onClick={() => onEdit(user)}
        >
          <Pencil className="size-3 mr-1" /> Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-8 text-xs border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
          onClick={() => onResetFace(user)}
          disabled={!user.faceDescriptor}
        >
          <RefreshCw className="size-3 mr-1" /> Reset Wajah
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={`h-8 px-2 text-xs ${
            user.isActive
              ? 'border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
              : 'border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
          }`}
          onClick={() => onToggleActive(user)}
        >
          {user.isActive ? <UserX className="size-3" /> : <UserCheck className="size-3" />}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2 text-xs border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          onClick={() => onDelete(user)}
        >
          <Trash2 className="size-3" />
        </Button>
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function EmployeeManagement() {
  const setCurrentView = useAppStore((s) => s.setCurrentView)

  // Data state
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<EmployeeFormData>(emptyForm)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Shifts state
  const [shifts, setShifts] = useState<WorkShift[]>([])

  // Reset face confirmation
  const [resetFaceTarget, setResetFaceTarget] = useState<User | null>(null)
  const [isResettingFace, setIsResettingFace] = useState(false)

  const [limit, setLimit] = useState(10)

  // ---- Fetch users ----
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))
      if (search) params.set('search', search)
      if (roleFilter && roleFilter !== 'all') params.set('role', roleFilter)

      const res = await fetch(`/api/users?${params.toString()}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Gagal memuat data pegawai')
      }

      const data: UsersResponse = await res.json()
      setUsers(data.users)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
      toast.error('Gagal memuat data', {
        description: err.message || 'Terjadi kesalahan saat memuat data pegawai',
      })
    } finally {
      setIsLoading(false)
    }
  }, [page, search, roleFilter, limit])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [search, roleFilter, limit])

  // Load shifts when dialog opens
  useEffect(() => {
    if (dialogOpen) {
      fetch('/api/shifts?includeUsers=true')
        .then((res) => res.json())
        .then((data) => setShifts(data.shifts || []))
        .catch(() => {})
    }
  }, [dialogOpen])

  // ---- Create / Update user ----
  const handleOpenCreate = () => {
    setEditingUser(null)
    setFormData(emptyForm)
    setShowPassword(false)
    setDialogOpen(true)
  }

  const handleOpenEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      nip: user.nip,
      nama: user.nama,
      email: user.email,
      password: '',
      role: user.role as Role,
      unitKerja: user.unitKerja ?? '',
      jabatan: user.jabatan ?? '',
      shiftId: user.shiftId ?? '',
      isActive: user.isActive,
    })
    setShowPassword(false)
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.nip || !formData.nama || !formData.email) {
      toast.error('Data tidak lengkap', {
        description: 'NIP, Nama, dan Email wajib diisi',
      })
      return
    }
    if (!editingUser && !formData.password) {
      toast.error('Password wajib diisi', {
        description: 'Password wajib diisi untuk pegawai baru',
      })
      return
    }

    try {
      setIsSubmitting(true)

      if (editingUser) {
        // Update
        const payload: Record<string, unknown> = {
          id: editingUser.id,
          nip: formData.nip,
          nama: formData.nama,
          email: formData.email,
          role: formData.role,
          unitKerja: formData.unitKerja || null,
          jabatan: formData.jabatan || null,
          shiftId: formData.shiftId || null,
          isActive: formData.isActive,
        }
        if (formData.password) {
          payload.password = formData.password
        }

        const res = await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || 'Gagal mengupdate pegawai')
        }

        toast.success('Berhasil', {
          description: `Data ${formData.nama} berhasil diperbarui`,
        })
      } else {
        // Create
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nip: formData.nip,
            nama: formData.nama,
            email: formData.email,
            password: formData.password,
            role: formData.role,
            unitKerja: formData.unitKerja || null,
            jabatan: formData.jabatan || null,
            shiftId: formData.shiftId || null,
          }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || 'Gagal membuat pegawai')
        }

        toast.success('Berhasil', {
          description: `${formData.nama} berhasil ditambahkan`,
        })
      }

      setDialogOpen(false)
      fetchUsers()
    } catch (err: any) {
      toast.error('Gagal menyimpan', {
        description: err.message || 'Terjadi kesalahan',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ---- Delete user ----
  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setIsDeleting(true)
      const res = await fetch(`/api/users?id=${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Gagal menghapus pegawai')
      }
      toast.success('Berhasil dihapus', {
        description: `${deleteTarget.nama} telah dihapus dari sistem`,
      })
      setDeleteTarget(null)
      fetchUsers()
    } catch (err: any) {
      toast.error('Gagal menghapus', {
        description: err.message || 'Terjadi kesalahan',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // ---- Reset face ----
  const handleResetFace = async () => {
    if (!resetFaceTarget) return
    try {
      setIsResettingFace(true)
      const res = await fetch(`/api/users/face?userId=${resetFaceTarget.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Gagal mereset wajah')
      }
      toast.success('Wajah direset', {
        description: `Data wajah ${resetFaceTarget.nama} berhasil direset`,
      })
      setResetFaceTarget(null)
      fetchUsers()
    } catch (err: any) {
      toast.error('Gagal mereset wajah', {
        description: err.message || 'Terjadi kesalahan',
      })
    } finally {
      setIsResettingFace(false)
    }
  }

  // ---- Toggle active ----
  const handleToggleActive = async (user: User) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          isActive: !user.isActive,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Gagal mengubah status')
      }
      toast.success('Status diubah', {
        description: `${user.nama} ${!user.isActive ? 'diaktifkan' : 'dinonaktifkan'}`,
      })
      fetchUsers()
    } catch (err: any) {
      toast.error('Gagal mengubah status', {
        description: err.message || 'Terjadi kesalahan',
      })
    }
  }

  // ---- Loading state ----
  if (isLoading && users.length === 0) return <EmployeeSkeleton />

  // ---- Error state ----
  if (error && users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="size-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <UserX className="size-8 text-red-500" />
        </div>
        <p className="text-lg font-semibold text-foreground">Gagal Memuat Data</p>
        <p className="text-sm text-muted-foreground max-w-md text-center">{error}</p>
        <Button onClick={fetchUsers} className="bg-[#1e40af] hover:bg-[#1e3a8a]">
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
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1e40af] dark:text-blue-300 tracking-tight">
            Kelola Pegawai
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total} pegawai terdaftar
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-[#1e40af] hover:bg-[#1e3a8a] text-white shadow-lg shadow-blue-500/25"
        >
          <Plus className="size-4 mr-1.5" />
          Tambah Pegawai
        </Button>
      </motion.div>

      {/* ================================================================= */}
      {/* Filters                                                           */}
      {/* ================================================================= */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, NIP, atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30 focus:border-[#2563eb] dark:focus:border-blue-600"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-44 bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30">
            <SelectValue placeholder="Semua Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Role</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="PEGAWAI">Pegawai</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* ================================================================= */}
      {/* Desktop Table                                                     */}
      {/* ================================================================= */}
      <motion.div variants={itemVariants} className="hidden md:block">
        <Card className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30 shadow-lg shadow-blue-500/5 overflow-hidden">
          <ScrollArea className="max-h-[calc(100vh-340px)]">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-blue-50/50 dark:bg-blue-900/10">
                  <TableHead className="w-12">Foto</TableHead>
                  <TableHead>NIP</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead className="hidden lg:table-cell">Email</TableHead>
                  <TableHead className="hidden xl:table-cell">Unit Kerja</TableHead>
                  <TableHead className="hidden xl:table-cell">Jabatan</TableHead>
                  <TableHead className="hidden xl:table-cell">Jam Kerja</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-center">Wajah</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Users className="size-10 text-muted-foreground/30" />
                          <p className="text-sm text-muted-foreground">
                            {search || roleFilter !== 'all'
                              ? 'Tidak ada pegawai yang cocok dengan filter'
                              : 'Belum ada data pegawai'}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user, idx) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ delay: idx * 0.03, duration: 0.25 }}
                        className="border-b border-blue-50 dark:border-blue-900/20 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors"
                      >
                        {/* Foto */}
                        <TableCell>
                          <Avatar className="size-9 ring-1 ring-blue-100 dark:ring-blue-900/40">
                            <AvatarImage src={user.photo ?? undefined} alt={user.nama} />
                            <AvatarFallback className="bg-[#1e40af]/10 text-[#1e40af] dark:bg-blue-900/30 dark:text-blue-400 text-xs font-bold">
                              {getInitials(user.nama)}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>

                        {/* NIP */}
                        <TableCell>
                          <span className="text-xs font-mono text-muted-foreground">{user.nip}</span>
                        </TableCell>

                        {/* Nama */}
                        <TableCell>
                          <span className="text-sm font-medium text-foreground">{user.nama}</span>
                        </TableCell>

                        {/* Email */}
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-xs text-muted-foreground truncate max-w-[180px] block">
                            {user.email}
                          </span>
                        </TableCell>

                        {/* Unit Kerja */}
                        <TableCell className="hidden xl:table-cell">
                          <span className="text-xs text-muted-foreground">
                            {user.unitKerja || '-'}
                          </span>
                        </TableCell>

                        {/* Jabatan */}
                        <TableCell className="hidden xl:table-cell">
                          <span className="text-xs text-muted-foreground">
                            {user.jabatan || '-'}
                          </span>
                        </TableCell>

                        {/* Jam Kerja */}
                        <TableCell className="hidden xl:table-cell">
                          {user.shift ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-2 py-0 bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800"
                            >
                              <Clock className="size-2.5 mr-0.5" />
                              {user.shift.name}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        {/* Role */}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-2 py-0 ${
                              user.role === 'ADMIN'
                                ? 'bg-[#1e40af]/10 text-[#1e40af] dark:bg-blue-900/30 dark:text-blue-300 border-[#1e40af]/20'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            {user.role}
                          </Badge>
                        </TableCell>

                        {/* Wajah */}
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-2 py-0 ${
                              user.faceDescriptor
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
                                : 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700'
                            }`}
                          >
                            <Fingerprint className="size-2.5 mr-0.5" />
                            {user.faceDescriptor ? 'Terdaftar' : 'Belum'}
                          </Badge>
                        </TableCell>

                        {/* Status */}
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-2 py-0 ${
                              user.isActive
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
                                : 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                            }`}
                          >
                            {user.isActive ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              >
                                <span className="sr-only">Buka menu</span>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-muted-foreground">
                                  <circle cx="8" cy="3" r="1.5" />
                                  <circle cx="8" cy="8" r="1.5" />
                                  <circle cx="8" cy="13" r="1.5" />
                                </svg>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() => handleOpenEdit(user)}
                                className="cursor-pointer text-[#2563eb] dark:text-blue-400"
                              >
                                <Pencil className="size-3.5 mr-2" />
                                Edit Pegawai
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setResetFaceTarget(user)}
                                disabled={!user.faceDescriptor}
                                className="cursor-pointer text-amber-600 dark:text-amber-400"
                              >
                                <RefreshCw className="size-3.5 mr-2" />
                                Reset Wajah
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleToggleActive(user)}
                                className="cursor-pointer"
                              >
                                {user.isActive ? (
                                  <>
                                    <UserX className="size-3.5 mr-2 text-red-500" />
                                    <span className="text-red-600 dark:text-red-400">Nonaktifkan</span>
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="size-3.5 mr-2 text-emerald-500" />
                                    <span className="text-emerald-600 dark:text-emerald-400">Aktifkan</span>
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeleteTarget(user)}
                                className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                              >
                                <Trash2 className="size-3.5 mr-2" />
                                Hapus Pegawai
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    ))
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
        {users.length === 0 ? (
          <Card className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30">
            <CardContent className="py-16 flex flex-col items-center space-y-2">
              <Users className="size-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                {search || roleFilter !== 'all'
                  ? 'Tidak ada pegawai yang cocok dengan filter'
                  : 'Belum ada data pegawai'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence mode="popLayout">
            {users.map((user) => (
              <EmployeeCard
                key={user.id}
                user={user}
                onEdit={handleOpenEdit}
                onResetFace={setResetFaceTarget}
                onToggleActive={handleToggleActive}
                onDelete={setDeleteTarget}
              />
            ))}
          </AnimatePresence>
        )}
      </motion.div>

      {/* ================================================================= */}
      {/* Pagination                                                        */}
      {/* ================================================================= */}
      <motion.div variants={itemVariants}>
        <DataPagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit)
            setPage(1)
          }}
          isLoading={isLoading}
          itemLabel="pegawai"
        />
      </motion.div>

      {/* ================================================================= */}
      {/* Add / Edit Dialog                                                 */}
      {/* ================================================================= */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-900 border-blue-100/50 dark:border-blue-900/30">
          <DialogHeader>
            <DialogTitle className="text-[#1e40af] dark:text-blue-300">
              {editingUser ? 'Edit Pegawai' : 'Tambah Pegawai Baru'}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? 'Perbarui informasi pegawai di bawah ini.'
                : 'Isi data pegawai baru untuk mendaftarkan ke sistem.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            {/* NIP */}
            <div className="grid gap-2">
              <Label htmlFor="nip" className="text-sm font-medium">
                NIP <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nip"
                value={formData.nip}
                onChange={(e) => setFormData((f) => ({ ...f, nip: e.target.value }))}
                placeholder="Masukkan NIP"
                className="bg-white dark:bg-gray-800 border-blue-100/50 dark:border-blue-900/30"
              />
            </div>

            {/* Nama */}
            <div className="grid gap-2">
              <Label htmlFor="nama" className="text-sm font-medium">
                Nama Lengkap <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nama"
                value={formData.nama}
                onChange={(e) => setFormData((f) => ({ ...f, nama: e.target.value }))}
                placeholder="Masukkan nama lengkap"
                className="bg-white dark:bg-gray-800 border-blue-100/50 dark:border-blue-900/30"
              />
            </div>

            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
                placeholder="contoh@email.com"
                className="bg-white dark:bg-gray-800 border-blue-100/50 dark:border-blue-900/30"
              />
            </div>

            {/* Password */}
            <div className="grid gap-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password {!editingUser && <span className="text-red-500">*</span>}
                {editingUser && <span className="text-xs text-muted-foreground font-normal ml-1">(kosongkan jika tidak diubah)</span>}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData((f) => ({ ...f, password: e.target.value }))}
                  placeholder={editingUser ? 'Kosongkan jika tidak diubah' : 'Masukkan password'}
                  className="bg-white dark:bg-gray-800 border-blue-100/50 dark:border-blue-900/30 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Role */}
            <div className="grid gap-2">
              <Label className="text-sm font-medium">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(val) => setFormData((f) => ({ ...f, role: val as Role }))}
              >
                <SelectTrigger className="bg-white dark:bg-gray-800 border-blue-100/50 dark:border-blue-900/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PEGAWAI">Pegawai</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Unit Kerja */}
            <div className="grid gap-2">
              <Label htmlFor="unitKerja" className="text-sm font-medium">
                Unit Kerja
              </Label>
              <Input
                id="unitKerja"
                value={formData.unitKerja}
                onChange={(e) => setFormData((f) => ({ ...f, unitKerja: e.target.value }))}
                placeholder="Masukkan unit kerja"
                className="bg-white dark:bg-gray-800 border-blue-100/50 dark:border-blue-900/30"
              />
            </div>

            {/* Jabatan */}
            <div className="grid gap-2">
              <Label htmlFor="jabatan" className="text-sm font-medium">
                Jabatan
              </Label>
              <Input
                id="jabatan"
                value={formData.jabatan}
                onChange={(e) => setFormData((f) => ({ ...f, jabatan: e.target.value }))}
                placeholder="Masukkan jabatan"
                className="bg-white dark:bg-gray-800 border-blue-100/50 dark:border-blue-900/30"
              />
            </div>

            {/* Jam Kerja */}
            <div className="grid gap-2">
              <Label className="text-sm font-medium">Jam Kerja</Label>
              <Select
                value={formData.shiftId || '__none__'}
                onValueChange={(val) => setFormData((f) => ({ ...f, shiftId: val === '__none__' ? '' : val }))}
              >
                <SelectTrigger className="bg-white dark:bg-gray-800 border-blue-100/50 dark:border-blue-900/30">
                  <SelectValue placeholder="Pilih jam kerja" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Tanpa Jam Kerja</SelectItem>
                  {shifts.map((shift) => (
                    <SelectItem key={shift.id} value={shift.id}>
                      {shift.name} ({shift.startTime} - {shift.endTime})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active Switch */}
            {editingUser && (
              <div className="flex items-center justify-between rounded-lg border border-blue-100/50 dark:border-blue-900/30 p-3 bg-blue-50/30 dark:bg-blue-900/10">
                <div>
                  <Label className="text-sm font-medium">Status Aktif</Label>
                  <p className="text-xs text-muted-foreground">
                    {formData.isActive ? 'Pegawai dapat login dan melakukan absensi' : 'Pegawai tidak dapat login'}
                  </p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData((f) => ({ ...f, isActive: checked }))}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-blue-200 dark:border-blue-800"
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-[#1e40af] hover:bg-[#1e3a8a] text-white shadow-lg shadow-blue-500/25"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Menyimpan...
                </span>
              ) : editingUser ? (
                'Simpan Perubahan'
              ) : (
                'Tambah Pegawai'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================= */}
      {/* Delete Confirmation                                               */}
      {/* ================================================================= */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-white dark:bg-gray-900 border-red-200/50 dark:border-red-900/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="size-5" />
              Hapus Pegawai
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus <strong>{deleteTarget?.nama}</strong>? Semua data
              absensi dan izin yang terkait juga akan dihapus. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ================================================================= */}
      {/* Reset Face Confirmation                                           */}
      {/* ================================================================= */}
      <AlertDialog open={!!resetFaceTarget} onOpenChange={(open) => !open && setResetFaceTarget(null)}>
        <AlertDialogContent className="bg-white dark:bg-gray-900 border-amber-200/50 dark:border-amber-900/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <RefreshCw className="size-5" />
              Reset Data Wajah
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin mereset data wajah <strong>{resetFaceTarget?.nama}</strong>?
              Pegawai akan perlu mendaftarkan ulang wajahnya untuk melakukan absensi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResettingFace}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetFace}
              disabled={isResettingFace}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isResettingFace ? 'Merest...' : 'Ya, Reset Wajah'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
