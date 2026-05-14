'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store'
import { FaceRegister } from '@/components/face-recognition/face-register'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  UserCircle,
  Camera,
  ScanFace,
  CheckCircle2,
  XCircle,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Save,
  Building2,
  Briefcase,
  Mail,
  Hash,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import type { User } from '@/types'

export function Profile() {
  const { user, setUser } = useAuthStore()

  const [showFaceRegister, setShowFaceRegister] = useState(false)

  // Password change state
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Profile edit state
  const [editNama, setEditNama] = useState(user?.nama || '')
  const [editEmail, setEditEmail] = useState(user?.email || '')
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleChangePassword = async () => {
    if (!oldPassword) {
      toast.error('Password lama wajib diisi')
      return
    }
    if (!newPassword) {
      toast.error('Password baru wajib diisi')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Password baru minimal 6 karakter')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi password tidak cocok')
      return
    }

    setIsChangingPassword(true)
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user?.id,
          password: newPassword,
          oldPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengubah password')
      }

      toast.success('Password berhasil diubah')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Gagal mengubah password'
      )
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleUpdateProfile = async () => {
    if (!editNama.trim()) {
      toast.error('Nama tidak boleh kosong')
      return
    }
    if (!editEmail.trim()) {
      toast.error('Email tidak boleh kosong')
      return
    }

    setIsUpdatingProfile(true)
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user?.id,
          nama: editNama.trim(),
          email: editEmail.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal memperbarui profil')
      }

      // Update auth store with new user data
      if (data.user) {
        setUser(data.user as User)
      }

      toast.success('Profil berhasil diperbarui')
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Gagal memperbarui profil'
      )
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleFaceRegistered = useCallback(() => {
    // Refresh user data after face registration
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user as User)
        }
      })
      .catch(() => {
        // silently fail
      })

    setTimeout(() => {
      setShowFaceRegister(false)
    }, 1500)
  }, [setUser])

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold text-[#1e3a8a] dark:text-blue-300">
          Profil Saya
        </h2>
        <p className="text-sm text-muted-foreground">
          Kelola informasi dan keamanan akun Anda
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar & Basic Info Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-1"
        >
          <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-blue-100/50 dark:border-blue-900/30 overflow-hidden">
            {/* Avatar section with gradient background */}
            <div className="bg-gradient-to-br from-[#1e40af] to-[#2563eb] p-6 flex flex-col items-center">
              <div className="relative group">
                <Avatar className="h-24 w-24 ring-4 ring-white/30 shadow-xl">
                  <AvatarImage
                    src={user?.photo ?? undefined}
                    alt={user?.nama ?? 'User'}
                  />
                  <AvatarFallback className="bg-white/20 text-white text-2xl font-bold">
                    {user?.nama ? getInitials(user.nama) : '??'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="mt-4 text-lg font-bold text-white">
                {user?.nama}
              </h3>
              <Badge className="mt-2 bg-white/20 text-white border-white/30 hover:bg-white/30">
                {user?.role === 'ADMIN' ? 'Administrator' : 'Pegawai'}
              </Badge>
            </div>

            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3 py-2">
                <div className="flex size-9 items-center justify-center rounded-lg bg-[#1e40af]/10 dark:bg-blue-900/30">
                  <Hash className="h-4 w-4 text-[#1e40af] dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">NIP</p>
                  <p className="text-sm font-semibold">{user?.nip || '-'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 py-2">
                <div className="flex size-9 items-center justify-center rounded-lg bg-[#1e40af]/10 dark:bg-blue-900/30">
                  <Mail className="h-4 w-4 text-[#1e40af] dark:text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-semibold truncate">
                    {user?.email || '-'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 py-2">
                <div className="flex size-9 items-center justify-center rounded-lg bg-[#1e40af]/10 dark:bg-blue-900/30">
                  <Building2 className="h-4 w-4 text-[#1e40af] dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Unit Kerja</p>
                  <p className="text-sm font-semibold">
                    {user?.unitKerja || '-'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 py-2">
                <div className="flex size-9 items-center justify-center rounded-lg bg-[#1e40af]/10 dark:bg-blue-900/30">
                  <Briefcase className="h-4 w-4 text-[#1e40af] dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Jabatan</p>
                  <p className="text-sm font-semibold">
                    {user?.jabatan || '-'}
                  </p>
                </div>
              </div>

              <Separator className="bg-blue-100 dark:bg-blue-900/30" />

              {/* Face Registration Status */}
              <div className="pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ScanFace className="h-4 w-4 text-[#1e40af] dark:text-blue-400" />
                    <span className="text-sm font-medium">Data Wajah</span>
                  </div>
                  {user?.faceDescriptor ? (
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-0 text-[10px]">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Terdaftar
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-0 text-[10px]">
                      <XCircle className="mr-1 h-3 w-3" />
                      Belum Terdaftar
                    </Badge>
                  )}
                </div>
                {user?.faceDescriptor && user?.faceRegisteredAt && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Terdaftar pada: {new Date(user.faceRegisteredAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
                {user?.faceDescriptor ? (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-50/80 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                      <AlertTriangle className="h-4 w-4 text-[#1e40af] dark:text-blue-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        Wajah sudah terdaftar. Jika perlu mendaftar ulang, hubungi <strong>Admin</strong> untuk mereset data wajah terlebih dahulu.
                      </p>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowFaceRegister(true)}
                    className="mt-3 w-full bg-[#1e40af] hover:bg-[#1e3a8a] text-white shadow-lg shadow-blue-500/25"
                    size="sm"
                  >
                    <ScanFace className="mr-2 h-4 w-4" />
                    Daftarkan Wajah
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right column - Edit Profile & Change Password */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Edit Profile */}
          <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-blue-100/50 dark:border-blue-900/30">
            <CardHeader>
              <CardTitle className="text-base text-[#1e3a8a] dark:text-blue-300 flex items-center gap-2">
                <UserCircle className="h-4 w-4" />
                Edit Profil
              </CardTitle>
              <CardDescription>
                Perbarui informasi profil Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="nama"
                    className="text-sm font-medium text-[#1e40af] dark:text-blue-400"
                  >
                    Nama Lengkap
                  </Label>
                  <Input
                    id="nama"
                    value={editNama}
                    onChange={(e) => setEditNama(e.target.value)}
                    className="border-blue-200 focus:border-[#1e40af] dark:border-blue-800"
                    placeholder="Masukkan nama lengkap"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-[#1e40af] dark:text-blue-400"
                  >
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="border-blue-200 focus:border-[#1e40af] dark:border-blue-800"
                    placeholder="Masukkan email"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleUpdateProfile}
                  disabled={isUpdatingProfile}
                  className="bg-[#1e40af] hover:bg-[#1e3a8a] text-white shadow-lg shadow-blue-500/25"
                >
                  {isUpdatingProfile ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Simpan Perubahan
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-blue-100/50 dark:border-blue-900/30">
            <CardHeader>
              <CardTitle className="text-base text-[#1e3a8a] dark:text-blue-300 flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Ubah Password
              </CardTitle>
              <CardDescription>
                Perbarui password akun Anda untuk keamanan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Old Password */}
              <div className="space-y-2">
                <Label
                  htmlFor="oldPassword"
                  className="text-sm font-medium text-[#1e40af] dark:text-blue-400"
                >
                  Password Lama
                </Label>
                <div className="relative">
                  <Input
                    id="oldPassword"
                    type={showOldPassword ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="pr-10 border-blue-200 focus:border-[#1e40af] dark:border-blue-800"
                    placeholder="Masukkan password lama"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={
                      showOldPassword ? 'Sembunyikan password' : 'Tampilkan password'
                    }
                  >
                    {showOldPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label
                  htmlFor="newPassword"
                  className="text-sm font-medium text-[#1e40af] dark:text-blue-400"
                >
                  Password Baru
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-10 border-blue-200 focus:border-[#1e40af] dark:border-blue-800"
                    placeholder="Masukkan password baru (min. 6 karakter)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={
                      showNewPassword ? 'Sembunyikan password' : 'Tampilkan password'
                    }
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium text-[#1e40af] dark:text-blue-400"
                >
                  Konfirmasi Password Baru
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10 border-blue-200 focus:border-[#1e40af] dark:border-blue-800"
                    placeholder="Ulangi password baru"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={
                      showConfirmPassword
                        ? 'Sembunyikan password'
                        : 'Tampilkan password'
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">
                    Password tidak cocok
                  </p>
                )}
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleChangePassword}
                  disabled={
                    isChangingPassword ||
                    !oldPassword ||
                    !newPassword ||
                    !confirmPassword
                  }
                  className="bg-[#1e40af] hover:bg-[#1e3a8a] text-white shadow-lg shadow-blue-500/25"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mengubah...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Ubah Password
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Face Registration Dialog */}
      <Dialog open={showFaceRegister} onOpenChange={setShowFaceRegister}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1e3a8a] dark:text-blue-300">
              <ScanFace className="h-5 w-5" />
              Registrasi Data Wajah
            </DialogTitle>
            <DialogDescription>
              Daftarkan data wajah Anda untuk verifikasi absensi. Pastikan
              pencahayaan cukup dan wajah terlihat jelas.
            </DialogDescription>
          </DialogHeader>
          <FaceRegister
            userId={user?.id}
            onRegistered={handleFaceRegistered}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
