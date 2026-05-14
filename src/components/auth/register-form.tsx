'use client'

import { useState } from 'react'
import { useAuthStore, useAppStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Fingerprint,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  User,
  Briefcase,
  Building2,
  Hash,
} from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import type { User as UserType } from '@/types'

interface FormErrors {
  nip?: string
  nama?: string
  email?: string
  unitKerja?: string
  jabatan?: string
  password?: string
  confirmPassword?: string
}

export function RegisterForm() {
  const { login } = useAuthStore()
  const { setCurrentView } = useAppStore()

  const [nip, setNip] = useState('')
  const [nama, setNama] = useState('')
  const [email, setEmail] = useState('')
  const [unitKerja, setUnitKerja] = useState('')
  const [jabatan, setJabatan] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!nip.trim()) {
      newErrors.nip = 'NIP wajib diisi'
    }

    if (!nama.trim()) {
      newErrors.nama = 'Nama lengkap wajib diisi'
    }

    if (!email.trim()) {
      newErrors.email = 'Email wajib diisi'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Format email tidak valid'
    }

    if (!unitKerja.trim()) {
      newErrors.unitKerja = 'Unit kerja wajib diisi'
    }

    if (!jabatan.trim()) {
      newErrors.jabatan = 'Jabatan wajib diisi'
    }

    if (!password) {
      newErrors.password = 'Password wajib diisi'
    } else if (password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter'
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Konfirmasi password wajib diisi'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Password tidak cocok'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      toast.error('Mohon lengkapi semua field dengan benar')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nip: nip.trim(),
          nama: nama.trim(),
          email: email.trim(),
          password,
          unitKerja: unitKerja.trim(),
          jabatan: jabatan.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Registrasi gagal')
        return
      }

      login(data.user as UserType)
      toast.success('Registrasi berhasil! Selamat datang.')
      setCurrentView('employee-dashboard')
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setIsLoading(false)
    }
  }

  const clearError = (field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const fieldVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { delay: 0.1 + i * 0.06, duration: 0.3, ease: 'easeOut' },
    }),
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-[#1e40af]/5 dark:bg-blue-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-[#2563eb]/5 dark:bg-blue-400/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#1e40af]/3 dark:bg-blue-600/3 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        {/* Glassmorphism Card */}
        <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-gray-700/50 shadow-2xl shadow-blue-500/10 p-8">
          {/* Logo & Title */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="flex flex-col items-center mb-8"
          >
            <div className="flex items-center justify-center size-14 rounded-2xl bg-gradient-to-br from-[#1e40af] to-[#2563eb] text-white shadow-xl shadow-blue-500/30 mb-4">
              <Fingerprint className="size-7" />
            </div>
            <h1 className="text-xl font-bold text-[#1e3a8a] dark:text-blue-200">
              Sistem Absensi Pegawai
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Buat akun baru</p>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* NIP */}
            <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
              <Label htmlFor="nip" className="text-[#1e3a8a] dark:text-blue-300">
                NIP
              </Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="nip"
                  type="text"
                  placeholder="Nomor Induk Pegawai"
                  value={nip}
                  onChange={(e) => { setNip(e.target.value); clearError('nip') }}
                  className={`pl-10 h-11 bg-white/50 dark:bg-gray-800/50 border-blue-100 dark:border-blue-900/50 focus-visible:border-[#2563eb] focus-visible:ring-[#2563eb]/20 ${errors.nip ? 'border-red-400 dark:border-red-500' : ''}`}
                  disabled={isLoading}
                />
              </div>
              {errors.nip && <p className="text-xs text-red-500 mt-1">{errors.nip}</p>}
            </motion.div>

            {/* Nama Lengkap */}
            <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
              <Label htmlFor="nama" className="text-[#1e3a8a] dark:text-blue-300">
                Nama Lengkap
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="nama"
                  type="text"
                  placeholder="Masukkan nama lengkap"
                  value={nama}
                  onChange={(e) => { setNama(e.target.value); clearError('nama') }}
                  className={`pl-10 h-11 bg-white/50 dark:bg-gray-800/50 border-blue-100 dark:border-blue-900/50 focus-visible:border-[#2563eb] focus-visible:ring-[#2563eb]/20 ${errors.nama ? 'border-red-400 dark:border-red-500' : ''}`}
                  disabled={isLoading}
                />
              </div>
              {errors.nama && <p className="text-xs text-red-500 mt-1">{errors.nama}</p>}
            </motion.div>

            {/* Email */}
            <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
              <Label htmlFor="reg-email" className="text-[#1e3a8a] dark:text-blue-300">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="nama@contoh.go.id"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearError('email') }}
                  className={`pl-10 h-11 bg-white/50 dark:bg-gray-800/50 border-blue-100 dark:border-blue-900/50 focus-visible:border-[#2563eb] focus-visible:ring-[#2563eb]/20 ${errors.email ? 'border-red-400 dark:border-red-500' : ''}`}
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </motion.div>

            {/* Unit Kerja & Jabatan */}
            <div className="grid grid-cols-2 gap-3">
              <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
                <Label htmlFor="unitKerja" className="text-[#1e3a8a] dark:text-blue-300">
                  Unit Kerja
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="unitKerja"
                    type="text"
                    placeholder="Unit kerja"
                    value={unitKerja}
                    onChange={(e) => { setUnitKerja(e.target.value); clearError('unitKerja') }}
                    className={`pl-10 h-11 bg-white/50 dark:bg-gray-800/50 border-blue-100 dark:border-blue-900/50 focus-visible:border-[#2563eb] focus-visible:ring-[#2563eb]/20 ${errors.unitKerja ? 'border-red-400 dark:border-red-500' : ''}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.unitKerja && <p className="text-xs text-red-500 mt-1">{errors.unitKerja}</p>}
              </motion.div>

              <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
                <Label htmlFor="jabatan" className="text-[#1e3a8a] dark:text-blue-300">
                  Jabatan
                </Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="jabatan"
                    type="text"
                    placeholder="Jabatan"
                    value={jabatan}
                    onChange={(e) => { setJabatan(e.target.value); clearError('jabatan') }}
                    className={`pl-10 h-11 bg-white/50 dark:bg-gray-800/50 border-blue-100 dark:border-blue-900/50 focus-visible:border-[#2563eb] focus-visible:ring-[#2563eb]/20 ${errors.jabatan ? 'border-red-400 dark:border-red-500' : ''}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.jabatan && <p className="text-xs text-red-500 mt-1">{errors.jabatan}</p>}
              </motion.div>
            </div>

            {/* Password */}
            <motion.div custom={5} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
              <Label htmlFor="reg-password" className="text-[#1e3a8a] dark:text-blue-300">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError('password') }}
                  className={`pl-10 pr-10 h-11 bg-white/50 dark:bg-gray-800/50 border-blue-100 dark:border-blue-900/50 focus-visible:border-[#2563eb] focus-visible:ring-[#2563eb]/20 ${errors.password ? 'border-red-400 dark:border-red-500' : ''}`}
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#1e40af] dark:hover:text-blue-400 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </motion.div>

            {/* Konfirmasi Password */}
            <motion.div custom={6} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-[#1e3a8a] dark:text-blue-300">
                Konfirmasi Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Ulangi password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); clearError('confirmPassword') }}
                  className={`pl-10 pr-10 h-11 bg-white/50 dark:bg-gray-800/50 border-blue-100 dark:border-blue-900/50 focus-visible:border-[#2563eb] focus-visible:ring-[#2563eb]/20 ${errors.confirmPassword ? 'border-red-400 dark:border-red-500' : ''}`}
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#1e40af] dark:hover:text-blue-400 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
            </motion.div>

            {/* Submit */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className="pt-2"
            >
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-gradient-to-r from-[#1e40af] to-[#2563eb] hover:from-[#1e3a8a] hover:to-[#1e40af] text-white shadow-lg shadow-blue-500/25 transition-all duration-200 text-sm font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    Daftar
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </motion.div>
          </form>

          {/* Login link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.3 }}
            className="mt-6 text-center"
          >
            <p className="text-sm text-muted-foreground">
              Sudah punya akun?{' '}
              <button
                type="button"
                onClick={() => setCurrentView('login')}
                className="text-[#2563eb] dark:text-blue-400 hover:text-[#1e40af] dark:hover:text-blue-300 font-semibold hover:underline transition-colors"
              >
                Masuk
              </button>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
