'use client'

import { useState, useCallback, useRef } from 'react'
import { useAuthStore, useAppStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import {
  Building2,
  User,
  MapPin,
  Clock,
  Check,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Eye,
  EyeOff,
  Hash,
  Mail,
  Lock,
  Crosshair,
  Settings,
  Fingerprint,
  Image as ImageIcon,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import type { User as UserType } from '@/types'

// ─── Types ───────────────────────────────────────────────────────────────────

interface AdminData {
  nip: string
  nama: string
  email: string
  password: string
  confirmPassword: string
}

interface OfficeData {
  namaKantor: string
  latitude: number
  longitude: number
  radius: number
}

interface ShiftData {
  namaShift: string
  jamMasuk: string
  jamPulang: string
  toleransiKeterlambatan: number
  workDays: string[]
}

interface AppIdentityData {
  namaAplikasi: string
  logoPath: string | null
  faviconPath: string | null
}

interface FormErrors {
  [key: string]: string | undefined
}

const DAYS_OF_WEEK = [
  { value: '1', label: 'Senin' },
  { value: '2', label: 'Selasa' },
  { value: '3', label: 'Rabu' },
  { value: '4', label: 'Kamis' },
  { value: '5', label: 'Jumat' },
  { value: '6', label: 'Sabtu' },
  { value: '0', label: 'Minggu' },
]

const STEPS = [
  { icon: Settings, label: 'Welcome' },
  { icon: User, label: 'Admin' },
  { icon: MapPin, label: 'Lokasi' },
  { icon: Clock, label: 'Jam Kerja' },
  { icon: ImageIcon, label: 'Identitas' },
  { icon: Check, label: 'Selesai' },
]

// ─── Slide transition variants ──────────────────────────────────────────────

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SetupWizard() {
  const { login } = useAuthStore()
  const { setCurrentView, appIdentity, fetchAppIdentity } = useAppStore()

  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  // Form state
  const [adminData, setAdminData] = useState<AdminData>({
    nip: '',
    nama: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [officeData, setOfficeData] = useState<OfficeData>({
    namaKantor: 'Kantor Pusat',
    latitude: -6.2088,
    longitude: 106.8456,
    radius: 100,
  })
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)

  const [shiftData, setShiftData] = useState<ShiftData>({
    namaShift: 'Reguler',
    jamMasuk: '08:00',
    jamPulang: '17:00',
    toleransiKeterlambatan: 15,
    workDays: ['1', '2', '3', '4', '5'],
  })

  const [appData, setAppData] = useState<AppIdentityData>({
    namaAplikasi: 'Sistem Absensi Pegawai',
    logoPath: null,
    faviconPath: null,
  })

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const clearError = useCallback((field: string) => {
    setErrors((prev) => {
      if (prev[field]) {
        const next = { ...prev }
        delete next[field]
        return next
      }
      return prev
    })
  }, [])

  const goNext = useCallback(() => {
    setDirection(1)
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1))
  }, [])

  const goBack = useCallback(() => {
    setDirection(-1)
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }, [])

  // ─── Validation ──────────────────────────────────────────────────────────

  const validateStep = useCallback(
    (step: number): boolean => {
      const newErrors: FormErrors = {}

      if (step === 1) {
        if (!adminData.nip.trim()) newErrors.nip = 'NIP wajib diisi'
        if (!adminData.nama.trim()) newErrors.nama = 'Nama lengkap wajib diisi'
        if (!adminData.email.trim()) {
          newErrors.email = 'Email wajib diisi'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminData.email)) {
          newErrors.email = 'Format email tidak valid'
        }
        if (!adminData.password) {
          newErrors.password = 'Password wajib diisi'
        } else if (adminData.password.length < 6) {
          newErrors.password = 'Password minimal 6 karakter'
        }
        if (!adminData.confirmPassword) {
          newErrors.confirmPassword = 'Konfirmasi password wajib diisi'
        } else if (adminData.password !== adminData.confirmPassword) {
          newErrors.confirmPassword = 'Password tidak cocok'
        }
      }

      if (step === 2) {
        if (!officeData.namaKantor.trim()) newErrors.namaKantor = 'Nama kantor wajib diisi'
        if (isNaN(officeData.latitude) || officeData.latitude === 0)
          newErrors.latitude = 'Latitude tidak valid'
        if (isNaN(officeData.longitude) || officeData.longitude === 0)
          newErrors.longitude = 'Longitude tidak valid'
        if (officeData.radius <= 0) newErrors.radius = 'Radius harus lebih dari 0'
      }

      if (step === 3) {
        if (!shiftData.namaShift.trim()) newErrors.namaShift = 'Nama shift wajib diisi'
        if (!shiftData.jamMasuk) newErrors.jamMasuk = 'Jam masuk wajib diisi'
        if (!shiftData.jamPulang) newErrors.jamPulang = 'Jam pulang wajib diisi'
        if (shiftData.workDays.length === 0) newErrors.workDays = 'Pilih minimal 1 hari kerja'
      }

      setErrors(newErrors)

      if (Object.keys(newErrors).length > 0) {
        toast.error('Mohon lengkapi semua field dengan benar')
        return false
      }
      return true
    },
    [adminData, officeData, shiftData]
  )

  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      goNext()
    }
  }, [currentStep, validateStep, goNext])

  // ─── Geolocation ─────────────────────────────────────────────────────────

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Browser Anda tidak mendukung GPS')
      return
    }

    setIsDetectingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOfficeData((prev) => ({
          ...prev,
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        }))
        toast.success('Lokasi berhasil dideteksi!')
        setIsDetectingLocation(false)
      },
      (error) => {
        setIsDetectingLocation(false)
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error('Izin lokasi ditolak. Aktifkan GPS di pengaturan browser.')
            break
          case error.POSITION_UNAVAILABLE:
            toast.error('Lokasi tidak tersedia. Coba lagi nanti.')
            break
          case error.TIMEOUT:
            toast.error('Permintaan lokasi timeout. Coba lagi.')
            break
          default:
            toast.error('Gagal mendeteksi lokasi.')
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }, [])

  // ─── Submit ──────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin: {
            nip: adminData.nip.trim(),
            nama: adminData.nama.trim(),
            email: adminData.email.trim(),
            password: adminData.password,
          },
          office: {
            name: officeData.namaKantor.trim(),
            latitude: officeData.latitude,
            longitude: officeData.longitude,
            radiusMeter: officeData.radius,
          },
          shift: {
            name: shiftData.namaShift.trim(),
            startTime: shiftData.jamMasuk,
            endTime: shiftData.jamPulang,
            lateTolerance: shiftData.toleransiKeterlambatan,
            workDays: shiftData.workDays.join(','),
          },
          appIdentity: {
            appName: appData.namaAplikasi.trim() || 'Sistem Absensi Pegawai',
            logoPath: appData.logoPath,
            faviconPath: appData.faviconPath,
          },
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Setup gagal. Silakan coba lagi.')
        return
      }

      login(data.user as UserType)
      toast.success('Setup berhasil! Selamat datang, Administrator.')
      // Refresh app identity to reflect the new app name
      await fetchAppIdentity()
      setCurrentView('admin-dashboard')
    } catch {
      toast.error('Terjadi kesalahan jaringan. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }, [adminData, officeData, shiftData, appData, login, setCurrentView, fetchAppIdentity])

  // ─── Render ──────────────────────────────────────────────────────────────

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
        className="relative w-full max-w-lg"
      >
        {/* Glassmorphism Card */}
        <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-gray-700/50 shadow-2xl shadow-blue-500/10 p-6 sm:p-8">
          {/* Logo & Step Indicator */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="flex flex-col items-center mb-6"
          >
            <div className="flex items-center justify-center size-12 rounded-2xl bg-gradient-to-br from-[#1e40af] to-[#2563eb] text-white shadow-xl shadow-blue-500/30 mb-4 overflow-hidden">
              {appIdentity.logoPath ? (
                <img src={appIdentity.logoPath} alt="Logo" className="size-12 object-contain rounded-2xl" />
              ) : (
                <Fingerprint className="size-6" />
              )}
            </div>

            {/* Step Indicator */}
            <div className="flex items-center gap-0 w-full max-w-xs mb-2">
              {STEPS.map((step, index) => {
                const StepIcon = step.icon
                const isCompleted = index < currentStep
                const isCurrent = index === currentStep

                return (
                  <div key={step.label} className="flex items-center flex-1 last:flex-none">
                    {/* Circle */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex items-center justify-center size-8 rounded-full border-2 transition-all duration-300 ${
                          isCompleted
                            ? 'bg-[#1e40af] border-[#1e40af] text-white'
                            : isCurrent
                              ? 'bg-[#1e40af]/10 border-[#1e40af] text-[#1e40af] dark:bg-blue-900/30 dark:border-blue-400 dark:text-blue-400'
                              : 'bg-white/50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500'
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="size-4" />
                        ) : (
                          <StepIcon className="size-3.5" />
                        )}
                      </div>
                    </div>

                    {/* Connector line */}
                    {index < STEPS.length - 1 && (
                      <div
                        className={`h-0.5 flex-1 mx-1 transition-all duration-300 ${
                          index < currentStep
                            ? 'bg-[#1e40af] dark:bg-blue-400'
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      />
                    )}
                  </div>
                )
              })}
            </div>

            <p className="text-xs text-muted-foreground mt-1">
              Langkah {currentStep + 1} dari {STEPS.length}
            </p>
          </motion.div>

          {/* Step Content */}
          <div className="relative overflow-hidden min-h-[320px] sm:min-h-[300px]">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentStep}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                {currentStep === 0 && (
                  <StepWelcome onNext={goNext} />
                )}
                {currentStep === 1 && (
                  <StepAdmin
                    data={adminData}
                    onChange={setAdminData}
                    errors={errors}
                    clearError={clearError}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    showConfirmPassword={showConfirmPassword}
                    setShowConfirmPassword={setShowConfirmPassword}
                  />
                )}
                {currentStep === 2 && (
                  <StepOffice
                    data={officeData}
                    onChange={setOfficeData}
                    errors={errors}
                    clearError={clearError}
                    isDetectingLocation={isDetectingLocation}
                    onDetectLocation={detectLocation}
                  />
                )}
                {currentStep === 3 && (
                  <StepWorkHours
                    data={shiftData}
                    onChange={setShiftData}
                    errors={errors}
                    clearError={clearError}
                  />
                )}
                {currentStep === 4 && (
                  <StepIdentity
                    appData={appData}
                    onChangeAppData={setAppData}
                    errors={errors}
                    clearError={clearError}
                  />
                )}
                {currentStep === 5 && (
                  <StepComplete
                    adminData={adminData}
                    officeData={officeData}
                    shiftData={shiftData}
                    appData={appData}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          {currentStep > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="flex items-center justify-between mt-6 pt-4 border-t border-blue-100/50 dark:border-blue-900/30"
            >
              <Button
                type="button"
                variant="outline"
                onClick={goBack}
                disabled={isSubmitting}
                className="border-blue-100 dark:border-blue-900/50 text-[#1e40af] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50"
              >
                <ArrowLeft className="size-4" />
                Kembali
              </Button>

              {currentStep < 5 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="bg-gradient-to-r from-[#1e40af] to-[#2563eb] hover:from-[#1e3a8a] hover:to-[#1e40af] text-white shadow-lg shadow-blue-500/25"
                >
                  Lanjutkan
                  <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      Selesai &amp; Masuk
                      <Check className="size-4" />
                    </>
                  )}
                </Button>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// ─── Step 1: Welcome ─────────────────────────────────────────────────────────

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center text-center py-4">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        className="flex items-center justify-center size-20 rounded-3xl bg-gradient-to-br from-[#1e40af] to-[#2563eb] text-white shadow-2xl shadow-blue-500/30 mb-6"
      >
        <Building2 className="size-10" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="text-2xl font-bold text-[#1e3a8a] dark:text-blue-200 mb-2"
      >
        Selamat Datang
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="text-sm text-[#2563eb] dark:text-blue-400 font-medium mb-4"
      >
        Mari kita setup aplikasi absensi Anda
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="space-y-3 mb-8 text-left w-full max-w-xs"
      >
        {[
          { icon: User, text: 'Buat akun administrator', color: 'text-[#1e40af] dark:text-blue-400 bg-[#1e40af]/10 dark:bg-blue-900/30' },
          { icon: MapPin, text: 'Atur lokasi kantor', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-900/30' },
          { icon: Clock, text: 'Konfigurasi jam kerja', color: 'text-violet-600 dark:text-violet-400 bg-violet-500/10 dark:bg-violet-900/30' },
          { icon: Settings, text: 'Personalisasi aplikasi', color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-900/30' },
        ].map((item, i) => (
          <motion.div
            key={item.text}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.1, duration: 0.3 }}
            className="flex items-center gap-3"
          >
            <div className={`flex items-center justify-center size-8 rounded-lg ${item.color}`}>
              <item.icon className="size-4" />
            </div>
            <span className="text-sm text-foreground">{item.text}</span>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.4 }}
      >
        <Button
          type="button"
          onClick={onNext}
          size="lg"
          className="bg-gradient-to-r from-[#1e40af] to-[#2563eb] hover:from-[#1e3a8a] hover:to-[#1e40af] text-white shadow-xl shadow-blue-500/25 px-8 h-12 text-base font-semibold"
        >
          Mulai Setup
          <ArrowRight className="size-4 ml-1" />
        </Button>
      </motion.div>
    </div>
  )
}

// ─── Step 2: Admin Account ───────────────────────────────────────────────────

function StepAdmin({
  data,
  onChange,
  errors,
  clearError,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
}: {
  data: AdminData
  onChange: (data: AdminData) => void
  errors: FormErrors
  clearError: (field: string) => void
  showPassword: boolean
  setShowPassword: (v: boolean) => void
  showConfirmPassword: boolean
  setShowConfirmPassword: (v: boolean) => void
}) {
  const update = (field: keyof AdminData, value: string) => {
    onChange({ ...data, [field]: value })
    clearError(field)
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="flex items-center justify-center size-10 rounded-xl bg-[#1e40af]/10 dark:bg-blue-900/30 text-[#1e40af] dark:text-blue-400 mx-auto mb-3">
          <User className="size-5" />
        </div>
        <h3 className="text-lg font-bold text-[#1e3a8a] dark:text-blue-200">
          Buat Akun Administrator
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Akun ini akan memiliki akses penuh ke sistem
        </p>
      </div>

      {/* NIP */}
      <div className="space-y-1.5">
        <Label htmlFor="setup-nip" className="text-[#1e3a8a] dark:text-blue-300 text-xs font-medium">
          NIP
        </Label>
        <div className="relative">
          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            id="setup-nip"
            type="text"
            placeholder="Nomor Induk Pegawai"
            value={data.nip}
            onChange={(e) => update('nip', e.target.value)}
            className={`pl-10 h-10 bg-white/50 dark:bg-gray-800/50 border-blue-100 dark:border-blue-900/50 focus-visible:border-[#2563eb] focus-visible:ring-[#2563eb]/20 text-sm ${errors.nip ? 'border-red-400 dark:border-red-500' : ''}`}
          />
        </div>
        {errors.nip && <p className="text-xs text-red-500">{errors.nip}</p>}
      </div>

      {/* Nama Lengkap */}
      <div className="space-y-1.5">
        <Label htmlFor="setup-nama" className="text-[#1e3a8a] dark:text-blue-300 text-xs font-medium">
          Nama Lengkap
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            id="setup-nama"
            type="text"
            placeholder="Masukkan nama lengkap"
            value={data.nama}
            onChange={(e) => update('nama', e.target.value)}
            className={`pl-10 h-10 bg-white/50 dark:bg-gray-800/50 border-blue-100 dark:border-blue-900/50 focus-visible:border-[#2563eb] focus-visible:ring-[#2563eb]/20 text-sm ${errors.nama ? 'border-red-400 dark:border-red-500' : ''}`}
          />
        </div>
        {errors.nama && <p className="text-xs text-red-500">{errors.nama}</p>}
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="setup-email" className="text-[#1e3a8a] dark:text-blue-300 text-xs font-medium">
          Email
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            id="setup-email"
            type="email"
            placeholder="admin@contoh.go.id"
            value={data.email}
            onChange={(e) => update('email', e.target.value)}
            className={`pl-10 h-10 bg-white/50 dark:bg-gray-800/50 border-blue-100 dark:border-blue-900/50 focus-visible:border-[#2563eb] focus-visible:ring-[#2563eb]/20 text-sm ${errors.email ? 'border-red-400 dark:border-red-500' : ''}`}
          />
        </div>
        {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <Label htmlFor="setup-password" className="text-[#1e3a8a] dark:text-blue-300 text-xs font-medium">
          Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            id="setup-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Minimal 6 karakter"
            value={data.password}
            onChange={(e) => update('password', e.target.value)}
            className={`pl-10 pr-10 h-10 bg-white/50 dark:bg-gray-800/50 border-blue-100 dark:border-blue-900/50 focus-visible:border-[#2563eb] focus-visible:ring-[#2563eb]/20 text-sm ${errors.password ? 'border-red-400 dark:border-red-500' : ''}`}
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
        {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
      </div>

      {/* Konfirmasi Password */}
      <div className="space-y-1.5">
        <Label htmlFor="setup-confirm-password" className="text-[#1e3a8a] dark:text-blue-300 text-xs font-medium">
          Konfirmasi Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            id="setup-confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Ulangi password"
            value={data.confirmPassword}
            onChange={(e) => update('confirmPassword', e.target.value)}
            className={`pl-10 pr-10 h-10 bg-white/50 dark:bg-gray-800/50 border-blue-100 dark:border-blue-900/50 focus-visible:border-[#2563eb] focus-visible:ring-[#2563eb]/20 text-sm ${errors.confirmPassword ? 'border-red-400 dark:border-red-500' : ''}`}
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
        {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
      </div>
    </div>
  )
}

// ─── Step 3: Office Location ─────────────────────────────────────────────────

function StepOffice({
  data,
  onChange,
  errors,
  clearError,
  isDetectingLocation,
  onDetectLocation,
}: {
  data: OfficeData
  onChange: (data: OfficeData) => void
  errors: FormErrors
  clearError: (field: string) => void
  isDetectingLocation: boolean
  onDetectLocation: () => void
}) {
  const update = <K extends keyof OfficeData>(field: K, value: OfficeData[K]) => {
    onChange({ ...data, [field]: value })
    clearError(field)
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="flex items-center justify-center size-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mx-auto mb-3">
          <MapPin className="size-5" />
        </div>
        <h3 className="text-lg font-bold text-[#1e3a8a] dark:text-blue-200">
          Lokasi Kantor
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Atur lokasi untuk validasi absensi GPS
        </p>
      </div>

      {/* Nama Kantor */}
      <div className="space-y-1.5">
        <Label htmlFor="office-name" className="text-[#1e3a8a] dark:text-blue-300 text-xs font-medium">
          Nama Kantor
        </Label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            id="office-name"
            type="text"
            placeholder="Nama kantor"
            value={data.namaKantor}
            onChange={(e) => update('namaKantor', e.target.value)}
            className={`pl-10 h-10 bg-white/50 dark:bg-gray-800/50 border-blue-100 dark:border-blue-900/50 focus-visible:border-[#2563eb] focus-visible:ring-[#2563eb]/20 text-sm ${errors.namaKantor ? 'border-red-400 dark:border-red-500' : ''}`}
          />
        </div>
        {errors.namaKantor && <p className="text-xs text-red-500">{errors.namaKantor}</p>}
      </div>

      {/* Latitude & Longitude */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="office-lat" className="text-[#1e3a8a] dark:text-blue-300 text-xs font-medium">
            Latitude
          </Label>
          <Input
            id="office-lat"
            type="number"
            step="0.000001"
            placeholder="-6.2088"
            value={data.latitude}
            onChange={(e) => update('latitude', parseFloat(e.target.value) || 0)}
            className={`h-10 bg-white/50 dark:bg-gray-800/50 border-blue-100 dark:border-blue-900/50 focus-visible:border-[#2563eb] focus-visible:ring-[#2563eb]/20 text-sm ${errors.latitude ? 'border-red-400 dark:border-red-500' : ''}`}
          />
          {errors.latitude && <p className="text-xs text-red-500">{errors.latitude}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="office-lng" className="text-[#1e3a8a] dark:text-blue-300 text-xs font-medium">
            Longitude
          </Label>
          <Input
            id="office-lng"
            type="number"
            step="0.000001"
            placeholder="106.8456"
            value={data.longitude}
            onChange={(e) => update('longitude', parseFloat(e.target.value) || 0)}
            className={`h-10 bg-white/50 dark:bg-gray-800/50 border-blue-100 dark:border-blue-900/50 focus-visible:border-[#2563eb] focus-visible:ring-[#2563eb]/20 text-sm ${errors.longitude ? 'border-red-400 dark:border-red-500' : ''}`}
          />
          {errors.longitude && <p className="text-xs text-red-500">{errors.longitude}</p>}
        </div>
      </div>

      {/* Radius */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-[#1e3a8a] dark:text-blue-300 text-xs font-medium">
            Radius (meter)
          </Label>
          <span className="text-sm font-semibold text-[#1e40af] dark:text-blue-400">
            {data.radius}m
          </span>
        </div>
        <Slider
          value={[data.radius]}
          min={10}
          max={500}
          step={10}
          onValueChange={(val) => update('radius', val[0])}
          className="w-full"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>10m</span>
          <span>500m</span>
        </div>
        {errors.radius && <p className="text-xs text-red-500">{errors.radius}</p>}
      </div>

      {/* Detect Location Button */}
      <Button
        type="button"
        variant="outline"
        onClick={onDetectLocation}
        disabled={isDetectingLocation}
        className="w-full border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
      >
        {isDetectingLocation ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Mendeteksi lokasi...
          </>
        ) : (
          <>
            <Crosshair className="size-4" />
            Deteksi Lokasi Saat Ini
          </>
        )}
      </Button>

      {/* Coordinate preview */}
      <div className="p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50">
        <p className="text-xs text-muted-foreground mb-1">Koordinat yang dipilih:</p>
        <p className="text-xs font-mono text-[#1e3a8a] dark:text-blue-300">
          {data.latitude.toFixed(6)}, {data.longitude.toFixed(6)}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">
          Radius {data.radius}m sekitar{' '}
          {data.radius <= 50
            ? 'gedung kecil'
            : data.radius <= 100
              ? '1 gedung'
              : data.radius <= 200
                ? 'komplek kantor'
                : 'area yang luas'}
        </p>
      </div>
    </div>
  )
}

// ─── Step 4: Work Hours ──────────────────────────────────────────────────────

function StepWorkHours({
  data,
  onChange,
  errors,
  clearError,
}: {
  data: ShiftData
  onChange: (data: ShiftData) => void
  errors: FormErrors
  clearError: (field: string) => void
}) {
  const update = <K extends keyof ShiftData>(field: K, value: ShiftData[K]) => {
    onChange({ ...data, [field]: value })
    clearError(field)
  }

  const toggleDay = (day: string) => {
    const newDays = data.workDays.includes(day)
      ? data.workDays.filter((d) => d !== day)
      : [...data.workDays, day]
    update('workDays', newDays)
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="flex items-center justify-center size-10 rounded-xl bg-violet-500/10 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 mx-auto mb-3">
          <Clock className="size-5" />
        </div>
        <h3 className="text-lg font-bold text-[#1e3a8a] dark:text-blue-200">
          Jam Kerja
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Atur jadwal kerja default untuk pegawai
        </p>
      </div>

      {/* Nama Shift */}
      <div className="space-y-1.5">
        <Label htmlFor="shift-name" className="text-[#1e3a8a] dark:text-blue-300 text-xs font-medium">
          Nama Shift
        </Label>
        <Input
          id="shift-name"
          type="text"
          value={data.namaShift}
          onChange={(e) => update('namaShift', e.target.value)}
          className={`h-10 bg-white/50 dark:bg-gray-800/50 border-blue-100 dark:border-blue-900/50 focus-visible:border-[#2563eb] focus-visible:ring-[#2563eb]/20 text-sm ${errors.namaShift ? 'border-red-400 dark:border-red-500' : ''}`}
        />
        {errors.namaShift && <p className="text-xs text-red-500">{errors.namaShift}</p>}
      </div>

      {/* Jam Masuk & Jam Pulang */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="shift-start" className="text-[#1e3a8a] dark:text-blue-300 text-xs font-medium">
            Jam Masuk
          </Label>
          <Input
            id="shift-start"
            type="time"
            value={data.jamMasuk}
            onChange={(e) => update('jamMasuk', e.target.value)}
            className={`h-10 bg-white/50 dark:bg-gray-800/50 border-blue-100 dark:border-blue-900/50 focus-visible:border-[#2563eb] focus-visible:ring-[#2563eb]/20 text-sm ${errors.jamMasuk ? 'border-red-400 dark:border-red-500' : ''}`}
          />
          {errors.jamMasuk && <p className="text-xs text-red-500">{errors.jamMasuk}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="shift-end" className="text-[#1e3a8a] dark:text-blue-300 text-xs font-medium">
            Jam Pulang
          </Label>
          <Input
            id="shift-end"
            type="time"
            value={data.jamPulang}
            onChange={(e) => update('jamPulang', e.target.value)}
            className={`h-10 bg-white/50 dark:bg-gray-800/50 border-blue-100 dark:border-blue-900/50 focus-visible:border-[#2563eb] focus-visible:ring-[#2563eb]/20 text-sm ${errors.jamPulang ? 'border-red-400 dark:border-red-500' : ''}`}
          />
          {errors.jamPulang && <p className="text-xs text-red-500">{errors.jamPulang}</p>}
        </div>
      </div>

      {/* Toleransi Keterlambatan */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-[#1e3a8a] dark:text-blue-300 text-xs font-medium">
            Toleransi Keterlambatan
          </Label>
          <span className="text-sm font-semibold text-[#1e40af] dark:text-blue-400">
            {data.toleransiKeterlambatan} menit
          </span>
        </div>
        <Slider
          value={[data.toleransiKeterlambatan]}
          min={0}
          max={60}
          step={5}
          onValueChange={(val) => update('toleransiKeterlambatan', val[0])}
          className="w-full"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>0 menit</span>
          <span>60 menit</span>
        </div>
      </div>

      {/* Hari Kerja */}
      <div className="space-y-2">
        <Label className="text-[#1e3a8a] dark:text-blue-300 text-xs font-medium">
          Hari Kerja
        </Label>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {DAYS_OF_WEEK.map((day) => {
            const isChecked = data.workDays.includes(day.value)
            return (
              <label
                key={day.value}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg cursor-pointer transition-all duration-200 border ${
                  isChecked
                    ? 'bg-[#1e40af]/10 dark:bg-blue-900/30 border-[#1e40af]/30 dark:border-blue-700/50 text-[#1e40af] dark:text-blue-400'
                    : 'bg-white/30 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700 text-muted-foreground hover:bg-white/50 dark:hover:bg-gray-800/50'
                }`}
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => toggleDay(day.value)}
                  className="sr-only"
                />
                <span className="text-[10px] font-semibold uppercase">{day.label.slice(0, 3)}</span>
                <div
                  className={`size-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    isChecked
                      ? 'bg-[#1e40af] border-[#1e40af] dark:bg-blue-500 dark:border-blue-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {isChecked && <Check className="size-3 text-white" />}
                </div>
              </label>
            )
          })}
        </div>
        {errors.workDays && <p className="text-xs text-red-500">{errors.workDays}</p>}
      </div>
    </div>
  )
}

// ─── Step 5: App Identity (Logo & Favicon) ─────────────────────────────────

function StepIdentity({
  appData,
  onChangeAppData,
  errors,
  clearError,
}: {
  appData: AppIdentityData
  onChangeAppData: (data: AppIdentityData) => void
  errors: FormErrors
  clearError: (field: string) => void
}) {
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'logo')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Gagal mengunggah logo')
      }

      const data = await res.json()
      onChangeAppData({ ...appData, logoPath: data.path })
      toast.success('Logo berhasil diunggah')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengunggah logo')
    } finally {
      setIsUploadingLogo(false)
      if (logoInputRef.current) logoInputRef.current.value = ''
    }
  }

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingFavicon(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'favicon')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Gagal mengunggah favicon')
      }

      const data = await res.json()
      onChangeAppData({ ...appData, faviconPath: data.path })
      toast.success('Favicon berhasil diunggah')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengunggah favicon')
    } finally {
      setIsUploadingFavicon(false)
      if (faviconInputRef.current) faviconInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="flex items-center justify-center size-10 rounded-xl bg-amber-500/10 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mx-auto mb-3">
          <ImageIcon className="size-5" />
        </div>
        <h3 className="text-lg font-bold text-[#1e3a8a] dark:text-blue-200">
          Identitas Aplikasi
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Personalisasi aplikasi dengan logo dan favicon
        </p>
      </div>

      {/* Nama Aplikasi */}
      <div className="space-y-1.5">
        <Label htmlFor="setup-app-name" className="text-[#1e3a8a] dark:text-blue-300 text-xs font-medium">
          Nama Aplikasi
        </Label>
        <Input
          id="setup-app-name"
          type="text"
          value={appData.namaAplikasi}
          onChange={(e) => {
            onChangeAppData({ ...appData, namaAplikasi: e.target.value })
            clearError('namaAplikasi')
          }}
          placeholder="Sistem Absensi Pegawai"
          className="h-10 bg-white/50 dark:bg-gray-800/50 border-blue-100 dark:border-blue-900/50 focus-visible:border-[#2563eb] focus-visible:ring-[#2563eb]/20 text-sm"
        />
      </div>

      {/* Logo Upload */}
      <div className="space-y-1.5">
        <Label className="text-[#1e3a8a] dark:text-blue-300 text-xs font-medium">
          Logo Aplikasi
        </Label>
        <div className="flex items-center gap-3">
          <div className="size-14 rounded-xl border-2 border-dashed border-blue-200 dark:border-blue-800/50 flex items-center justify-center bg-white/50 dark:bg-gray-800/50 overflow-hidden shrink-0">
            {appData.logoPath ? (
              <img src={appData.logoPath} alt="Logo" className="size-14 object-contain rounded-xl" />
            ) : (
              <ImageIcon className="size-6 text-muted-foreground/40" />
            )}
          </div>
          <div className="flex-1 space-y-1.5">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => logoInputRef.current?.click()}
              disabled={isUploadingLogo}
              className="w-full border-blue-200 dark:border-blue-800/50 text-[#1e40af] dark:text-blue-400 text-xs"
            >
              {isUploadingLogo ? (
                <>
                  <Loader2 className="size-3 animate-spin" />
                  Mengunggah...
                </>
              ) : (
                <>
                  <Upload className="size-3" />
                  {appData.logoPath ? 'Ganti Logo' : 'Unggah Logo'}
                </>
              )}
            </Button>
            {appData.logoPath && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChangeAppData({ ...appData, logoPath: null })}
                className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs h-7"
              >
                Hapus Logo
              </Button>
            )}
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground">PNG, JPG, SVG, atau WebP. Maks 2MB.</p>
      </div>

      {/* Favicon Upload */}
      <div className="space-y-1.5">
        <Label className="text-[#1e3a8a] dark:text-blue-300 text-xs font-medium">
          Favicon
        </Label>
        <div className="flex items-center gap-3">
          <div className="size-14 rounded-xl border-2 border-dashed border-blue-200 dark:border-blue-800/50 flex items-center justify-center bg-white/50 dark:bg-gray-800/50 overflow-hidden shrink-0">
            {appData.faviconPath ? (
              <img src={appData.faviconPath} alt="Favicon" className="size-8 object-contain" />
            ) : (
              <Fingerprint className="size-5 text-muted-foreground/40" />
            )}
          </div>
          <div className="flex-1 space-y-1.5">
            <input
              ref={faviconInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/x-icon,image/vnd.microsoft.icon,image/webp"
              onChange={handleFaviconUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => faviconInputRef.current?.click()}
              disabled={isUploadingFavicon}
              className="w-full border-blue-200 dark:border-blue-800/50 text-[#1e40af] dark:text-blue-400 text-xs"
            >
              {isUploadingFavicon ? (
                <>
                  <Loader2 className="size-3 animate-spin" />
                  Mengunggah...
                </>
              ) : (
                <>
                  <Upload className="size-3" />
                  {appData.faviconPath ? 'Ganti Favicon' : 'Unggah Favicon'}
                </>
              )}
            </Button>
            {appData.faviconPath && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChangeAppData({ ...appData, faviconPath: null })}
                className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs h-7"
              >
                Hapus Favicon
              </Button>
            )}
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground">PNG, JPG, SVG, ICO, atau WebP. Maks 2MB. Disarankan 32x32 atau 64x64.</p>
      </div>
    </div>
  )
}

// ─── Step 6: Complete (Summary) ─────────────────────────────────────────────

function StepComplete({
  adminData,
  officeData,
  shiftData,
  appData,
}: {
  adminData: AdminData
  officeData: OfficeData
  shiftData: ShiftData
  appData: AppIdentityData
}) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="flex items-center justify-center size-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mx-auto mb-3">
          <Check className="size-5" />
        </div>
        <h3 className="text-lg font-bold text-[#1e3a8a] dark:text-blue-200">
          Siap Menyimpan
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Konfigurasi Anda sudah siap. Klik &quot;Selesai &amp; Masuk&quot; untuk menyimpan.
        </p>
      </div>

      {/* Summary */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-[#1e3a8a] dark:text-blue-300 uppercase tracking-wider">
          Ringkasan Konfigurasi
        </h4>

        {/* App Identity Summary */}
        <div className="p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-2 mb-2">
            <ImageIcon className="size-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-semibold text-[#1e3a8a] dark:text-blue-300">Identitas Aplikasi</span>
          </div>
          <div className="space-y-1 ml-5.5">
            <p className="text-xs text-foreground">
              <span className="text-muted-foreground">Nama:</span> {appData.namaAplikasi || 'Sistem Absensi Pegawai'}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {appData.logoPath && (
                <div className="flex items-center gap-1">
                  <img src={appData.logoPath} alt="Logo" className="size-5 object-contain rounded" />
                  <span className="text-[10px] text-muted-foreground">Logo</span>
                </div>
              )}
              {appData.faviconPath && (
                <div className="flex items-center gap-1">
                  <img src={appData.faviconPath} alt="Favicon" className="size-4 object-contain" />
                  <span className="text-[10px] text-muted-foreground">Favicon</span>
                </div>
              )}
              {!appData.logoPath && !appData.faviconPath && (
                <span className="text-[10px] text-muted-foreground">Tanpa logo/favicon</span>
              )}
            </div>
          </div>
        </div>

        {/* Admin Summary */}
        <div className="p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-2 mb-2">
            <User className="size-3.5 text-[#1e40af] dark:text-blue-400" />
            <span className="text-xs font-semibold text-[#1e3a8a] dark:text-blue-300">Administrator</span>
          </div>
          <div className="space-y-1 ml-5.5">
            <p className="text-xs text-foreground">
              <span className="text-muted-foreground">NIP:</span> {adminData.nip}
            </p>
            <p className="text-xs text-foreground">
              <span className="text-muted-foreground">Nama:</span> {adminData.nama}
            </p>
            <p className="text-xs text-foreground">
              <span className="text-muted-foreground">Email:</span> {adminData.email}
            </p>
          </div>
        </div>

        {/* Office Summary */}
        <div className="p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-semibold text-[#1e3a8a] dark:text-blue-300">Lokasi Kantor</span>
          </div>
          <div className="space-y-1 ml-5.5">
            <p className="text-xs text-foreground">
              <span className="text-muted-foreground">Nama:</span> {officeData.namaKantor}
            </p>
            <p className="text-xs text-foreground">
              <span className="text-muted-foreground">Koordinat:</span>{' '}
              {officeData.latitude.toFixed(6)}, {officeData.longitude.toFixed(6)}
            </p>
            <p className="text-xs text-foreground">
              <span className="text-muted-foreground">Radius:</span> {officeData.radius} meter
            </p>
          </div>
        </div>

        {/* Shift Summary */}
        <div className="p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="size-3.5 text-violet-600 dark:text-violet-400" />
            <span className="text-xs font-semibold text-[#1e3a8a] dark:text-blue-300">Jam Kerja</span>
          </div>
          <div className="space-y-1 ml-5.5">
            <p className="text-xs text-foreground">
              <span className="text-muted-foreground">Shift:</span> {shiftData.namaShift}
            </p>
            <p className="text-xs text-foreground">
              <span className="text-muted-foreground">Jam:</span> {shiftData.jamMasuk} - {shiftData.jamPulang}
            </p>
            <p className="text-xs text-foreground">
              <span className="text-muted-foreground">Toleransi:</span> {shiftData.toleransiKeterlambatan} menit
            </p>
            <p className="text-xs text-foreground">
              <span className="text-muted-foreground">Hari:</span>{' '}
              {shiftData.workDays
                .sort((a, b) => parseInt(a) - parseInt(b))
                .map((d) => DAYS_OF_WEEK.find((day) => day.value === d)?.label || d)
                .join(', ')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
