'use client'

import { useState } from 'react'
import { useAuthStore, useAppStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Fingerprint, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import type { User } from '@/types'

export function LoginForm() {
  const { login } = useAuthStore()
  const { setCurrentView } = useAppStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim() || !password.trim()) {
      toast.error('Email dan password wajib diisi')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Login gagal')
        return
      }

      login(data.user as User)
      toast.success('Login berhasil!')

      const targetView = data.user.role === 'ADMIN' ? 'admin-dashboard' : 'employee-dashboard'
      setCurrentView(targetView as 'admin-dashboard' | 'employee-dashboard')
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-[#1e40af]/5 dark:bg-blue-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-[#2563eb]/5 dark:bg-blue-400/5 blur-3xl" />
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
            <p className="text-sm text-muted-foreground mt-1">Masuk ke akun Anda</p>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="space-y-2"
            >
              <Label htmlFor="email" className="text-[#1e3a8a] dark:text-blue-300">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@contoh.go.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 bg-white/50 dark:bg-gray-800/50 border-blue-100 dark:border-blue-900/50 focus-visible:border-[#2563eb] focus-visible:ring-[#2563eb]/20"
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="space-y-2"
            >
              <Label htmlFor="password" className="text-[#1e3a8a] dark:text-blue-300">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 bg-white/50 dark:bg-gray-800/50 border-blue-100 dark:border-blue-900/50 focus-visible:border-[#2563eb] focus-visible:ring-[#2563eb]/20"
                  disabled={isLoading}
                  autoComplete="current-password"
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.3 }}
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
                    Masuk
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </motion.div>
          </form>

          {/* Register link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            className="mt-6 text-center"
          >
            <p className="text-sm text-muted-foreground">
              Belum punya akun?{' '}
              <button
                type="button"
                onClick={() => setCurrentView('register')}
                className="text-[#2563eb] dark:text-blue-400 hover:text-[#1e40af] dark:hover:text-blue-300 font-semibold hover:underline transition-colors"
              >
                Daftar
              </button>
            </p>
          </motion.div>

          {/* Demo credentials hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.3 }}
            className="mt-6 p-3 rounded-xl bg-[#1e40af]/5 dark:bg-blue-900/20 border border-[#1e40af]/10 dark:border-blue-800/30"
          >
            <p className="text-xs text-muted-foreground mb-2 font-medium">Demo Credentials:</p>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@absensi.go.id')
                  setPassword('admin123')
                }}
                className="flex items-center gap-2 text-xs text-[#1e40af] dark:text-blue-400 hover:text-[#1e3a8a] dark:hover:text-blue-300 font-mono transition-colors w-full text-left px-1 py-0.5 rounded hover:bg-[#1e40af]/5 dark:hover:bg-blue-800/20"
              >
                <span className="size-1.5 rounded-full bg-[#1e40af] dark:bg-blue-400 shrink-0" />
                admin@absensi.go.id / admin123
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('ahmad@absensi.go.id')
                  setPassword('pegawai123')
                }}
                className="flex items-center gap-2 text-xs text-[#1e40af] dark:text-blue-400 hover:text-[#1e3a8a] dark:hover:text-blue-300 font-mono transition-colors w-full text-left px-1 py-0.5 rounded hover:bg-[#1e40af]/5 dark:hover:bg-blue-800/20"
              >
                <span className="size-1.5 rounded-full bg-[#2563eb] dark:bg-blue-400 shrink-0" />
                ahmad@absensi.go.id / pegawai123
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
