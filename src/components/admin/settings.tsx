'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Settings,
  MapPin,
  Clock,
  CalendarDays,
  Save,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  Image as ImageIcon,
  Upload,
  ImagePlus,
  X,
} from 'lucide-react'

import { useAppStore } from '@/store'
import type { OfficeSetting, Holiday, HolidayType } from '@/types'
import { OfficeManagement } from '@/components/admin/office-management'
import { ShiftManagement } from '@/components/admin/shift-management'
import { updateAppMeta, forceRefreshIcons } from '@/lib/favicon'

// Re-import setAppIdentity from store
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
// Types
// ---------------------------------------------------------------------------

interface HolidayFormData {
  name: string
  date: string
  type: HolidayType
}

interface IdentityFormData {
  appName: string
  logoPath: string | null
  faviconPath: string | null
}

const emptyHolidayForm: HolidayFormData = {
  name: '',
  date: '',
  type: 'NASIONAL',
}

const emptyIdentityForm: IdentityFormData = {
  appName: 'Sistem Absensi Pegawai',
  logoPath: null,
  faviconPath: null,
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>
      <Skeleton className="h-10 w-80" />
      <Card className="bg-white/70 dark:bg-gray-900/60">
        <CardContent className="p-6 space-y-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function AdminSettings() {
  // Settings state
  const [settings, setSettings] = useState<OfficeSetting | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)


  // Holidays
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [holidayForm, setHolidayForm] = useState<HolidayFormData>(emptyHolidayForm)
  const [isAddingHoliday, setIsAddingHoliday] = useState(false)
  const [deleteHolidayTarget, setDeleteHolidayTarget] = useState<Holiday | null>(null)
  const [isDeletingHoliday, setIsDeletingHoliday] = useState(false)

  // Identity form
  const [identityForm, setIdentityForm] = useState<IdentityFormData>(emptyIdentityForm)
  const [isSavingIdentity, setIsSavingIdentity] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [faviconFile, setFaviconFile] = useState<File | null>(null)

  // ---- Fetch settings ----
  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const res = await fetch('/api/settings')
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Gagal memuat pengaturan')
      }

      const data = await res.json()
      const setting: OfficeSetting = data.setting
      setSettings(setting)

      // Populate identity form
      setIdentityForm({
        appName: (setting as any).appName || 'Sistem Absensi Pegawai',
        logoPath: (setting as any).logoPath || null,
        faviconPath: (setting as any).faviconPath || null,
      })
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
      toast.error('Gagal memuat pengaturan', {
        description: err.message || 'Terjadi kesalahan',
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ---- Fetch holidays ----
  const fetchHolidays = useCallback(async () => {
    try {
      const res = await fetch('/api/holidays')
      if (!res.ok) return
      const data = await res.json()
      setHolidays(data.holidays || [])
    } catch {
      // Silent fail
    }
  }, [])

  useEffect(() => {
    fetchSettings()
    fetchHolidays()
  }, [fetchSettings, fetchHolidays])

  // ---- Add holiday ----
  const handleAddHoliday = async () => {
    if (!holidayForm.name || !holidayForm.date) {
      toast.error('Nama dan tanggal wajib diisi')
      return
    }
    try {
      setIsAddingHoliday(true)
      const res = await fetch('/api/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(holidayForm),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Gagal menambah hari libur')
      }
      toast.success('Hari libur ditambahkan', {
        description: `${holidayForm.name} berhasil ditambahkan`,
      })
      setHolidayForm(emptyHolidayForm)
      fetchHolidays()
    } catch (err: any) {
      toast.error('Gagal menambah hari libur', {
        description: err.message || 'Terjadi kesalahan',
      })
    } finally {
      setIsAddingHoliday(false)
    }
  }

  // ---- Delete holiday ----
  const handleDeleteHoliday = async () => {
    if (!deleteHolidayTarget) return
    try {
      setIsDeletingHoliday(true)
      const res = await fetch(`/api/holidays?id=${deleteHolidayTarget.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Gagal menghapus hari libur')
      }
      toast.success('Hari libur dihapus', {
        description: `${deleteHolidayTarget.name} telah dihapus`,
      })
      setDeleteHolidayTarget(null)
      fetchHolidays()
    } catch (err: any) {
      toast.error('Gagal menghapus', {
        description: err.message || 'Terjadi kesalahan',
      })
    } finally {
      setIsDeletingHoliday(false)
    }
  }

  // ---- Save identity settings ----
  const handleSaveIdentity = async () => {
    if (!identityForm.appName) {
      toast.error('Nama aplikasi wajib diisi')
      return
    }
    try {
      setIsSavingIdentity(true)
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appName: identityForm.appName,
          logoPath: identityForm.logoPath,
          faviconPath: identityForm.faviconPath,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Gagal menyimpan pengaturan')
      }
      const data = await res.json()
      setSettings(data.setting)
      // Update the global app identity store so all components update immediately
      const { setAppIdentity } = useAppStore.getState()
      setAppIdentity({
        appName: identityForm.appName,
        logoPath: identityForm.logoPath,
        faviconPath: identityForm.faviconPath,
      })
      // Update browser favicon, meta tags, and force refresh all icons
      updateAppMeta(identityForm.appName)
      forceRefreshIcons()
      toast.success('Identitas aplikasi disimpan', {
        description: 'Nama dan logo aplikasi berhasil diperbarui',
      })
    } catch (err: any) {
      toast.error('Gagal menyimpan', {
        description: err.message || 'Terjadi kesalahan',
      })
    } finally {
      setIsSavingIdentity(false)
    }
  }

  // ---- Upload logo ----
  const handleUploadLogo = async () => {
    if (!logoFile) return
    try {
      setIsUploadingLogo(true)
      const formData = new FormData()
      formData.append('file', logoFile)
      formData.append('type', 'logo')
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Gagal mengunggah logo')
      }
      const data = await res.json()
      const newLogoPath = data.path || data.filePath || null
      setIdentityForm((f) => ({ ...f, logoPath: newLogoPath }))
      setLogoFile(null)
      if (logoInputRef.current) logoInputRef.current.value = ''
      // Save settings with the new logo path
      const saveRes = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appName: identityForm.appName,
          logoPath: newLogoPath,
          faviconPath: identityForm.faviconPath,
        }),
      })
      if (saveRes.ok) {
        const saveData = await saveRes.json()
        setSettings(saveData.setting)
        // Update the global app identity store so logo updates immediately
        const { setAppIdentity } = useAppStore.getState()
        setAppIdentity({
          appName: identityForm.appName,
          logoPath: newLogoPath,
          faviconPath: identityForm.faviconPath,
          pwaIcon192Path: data.pwaIcon192 || null,
          pwaIcon512Path: data.pwaIcon512 || null,
        })
        // Update browser favicon, manifest, and meta tags immediately
        updateAppMeta(identityForm.appName)
        forceRefreshIcons()
        toast.success('Logo berhasil diunggah', {
          description: 'Logo aplikasi telah diperbarui',
        })
      }
    } catch (err: any) {
      toast.error('Gagal mengunggah logo', {
        description: err.message || 'Terjadi kesalahan',
      })
    } finally {
      setIsUploadingLogo(false)
    }
  }

  // ---- Upload favicon ----
  const handleUploadFavicon = async () => {
    if (!faviconFile) return
    try {
      setIsUploadingFavicon(true)
      const formData = new FormData()
      formData.append('file', faviconFile)
      formData.append('type', 'favicon')
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Gagal mengunggah favicon')
      }
      const data = await res.json()
      const newFaviconPath = data.path || data.filePath || null
      setIdentityForm((f) => ({ ...f, faviconPath: newFaviconPath }))
      setFaviconFile(null)
      if (faviconInputRef.current) faviconInputRef.current.value = ''
      // Save settings with the new favicon path
      const saveRes = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appName: identityForm.appName,
          logoPath: identityForm.logoPath,
          faviconPath: newFaviconPath,
        }),
      })
      if (saveRes.ok) {
        const saveData = await saveRes.json()
        setSettings(saveData.setting)
        // Update the global app identity store so favicon updates immediately
        const { setAppIdentity } = useAppStore.getState()
        setAppIdentity({
          appName: identityForm.appName,
          logoPath: identityForm.logoPath,
          faviconPath: newFaviconPath,
          pwaIcon192Path: data.pwaIcon192 || null,
          pwaIcon512Path: data.pwaIcon512 || null,
        })
        // Update browser favicon, manifest, and meta tags immediately
        updateAppMeta(identityForm.appName)
        forceRefreshIcons()
        toast.success('Favicon berhasil diunggah', {
          description: 'Favicon aplikasi telah diperbarui',
        })
      }
    } catch (err: any) {
      toast.error('Gagal mengunggah favicon', {
        description: err.message || 'Terjadi kesalahan',
      })
    } finally {
      setIsUploadingFavicon(false)
    }
  }

  // ---- Remove logo ----
  const handleRemoveLogo = async () => {
    setIdentityForm((f) => ({ ...f, logoPath: null }))
    setLogoFile(null)
    if (logoInputRef.current) logoInputRef.current.value = ''
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appName: identityForm.appName,
          logoPath: null,
          faviconPath: identityForm.faviconPath,
        }),
      })
      // Update global store
      const { setAppIdentity } = useAppStore.getState()
      setAppIdentity({
        appName: identityForm.appName,
        logoPath: null,
        faviconPath: identityForm.faviconPath,
      })
      // Update browser favicon, manifest, and meta tags
      forceRefreshIcons()
      toast.success('Logo dihapus')
    } catch {
      toast.error('Gagal menghapus logo')
    }
  }

  // ---- Remove favicon ----
  const handleRemoveFavicon = async () => {
    setIdentityForm((f) => ({ ...f, faviconPath: null }))
    setFaviconFile(null)
    if (faviconInputRef.current) faviconInputRef.current.value = ''
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appName: identityForm.appName,
          logoPath: identityForm.logoPath,
          faviconPath: null,
        }),
      })
      // Update global store
      const { setAppIdentity } = useAppStore.getState()
      setAppIdentity({
        appName: identityForm.appName,
        logoPath: identityForm.logoPath,
        faviconPath: null,
      })
      // Update browser favicon, manifest, and meta tags
      forceRefreshIcons()
      toast.success('Favicon dihapus')
    } catch {
      toast.error('Gagal menghapus favicon')
    }
  }

  // ---- Loading state ----
  if (isLoading) return <SettingsSkeleton />

  // ---- Error state ----
  if (error && !settings) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="size-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <AlertCircle className="size-8 text-red-500" />
        </div>
        <p className="text-lg font-semibold text-foreground">Gagal Memuat Pengaturan</p>
        <p className="text-sm text-muted-foreground max-w-md text-center">{error}</p>
        <Button onClick={fetchSettings} className="bg-[#1e40af] hover:bg-[#1e3a8a]">
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
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#1e40af] dark:text-blue-300 tracking-tight">
          Pengaturan
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Kelola identitas, lokasi kantor, jam kerja, dan hari libur
        </p>
      </motion.div>

      {/* ================================================================= */}
      {/* Tabs                                                              */}
      {/* ================================================================= */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="identity" className="space-y-6">
          <TabsList className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-blue-100/50 dark:border-blue-900/30 p-1 h-auto flex-wrap">
            <TabsTrigger
              value="identity"
              className="data-[state=active]:bg-[#1e40af] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 text-sm px-4 py-2"
            >
              <ImageIcon className="size-4 mr-1.5" />
              Identitas Aplikasi
            </TabsTrigger>
            <TabsTrigger
              value="location"
              className="data-[state=active]:bg-[#1e40af] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 text-sm px-4 py-2"
            >
              <MapPin className="size-4 mr-1.5" />
              Lokasi Kantor
            </TabsTrigger>
            <TabsTrigger
              value="workhours"
              className="data-[state=active]:bg-[#1e40af] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 text-sm px-4 py-2"
            >
              <Clock className="size-4 mr-1.5" />
              Jam Kerja
            </TabsTrigger>
            <TabsTrigger
              value="holidays"
              className="data-[state=active]:bg-[#1e40af] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 text-sm px-4 py-2"
            >
              <CalendarDays className="size-4 mr-1.5" />
              Hari Libur
            </TabsTrigger>
          </TabsList>

          {/* =============================================================== */}
          {/* Tab: Identitas Aplikasi                                         */}
          {/* =============================================================== */}
          <TabsContent value="identity">
            <Card className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30 shadow-lg shadow-blue-500/5">
              <CardHeader>
                <CardTitle className="text-[#1e40af] dark:text-blue-300 flex items-center gap-2">
                  <ImageIcon className="size-5" />
                  Identitas Aplikasi
                </CardTitle>
                <CardDescription>
                  Atur nama aplikasi, logo, dan favicon
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: App Name + Save */}
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="appName" className="text-sm font-medium">
                        Nama Aplikasi
                      </Label>
                      <Input
                        id="appName"
                        value={identityForm.appName}
                        onChange={(e) => setIdentityForm((f) => ({ ...f, appName: e.target.value }))}
                        placeholder="Nama Aplikasi"
                        className="bg-white dark:bg-gray-800 border-blue-100/50 dark:border-blue-900/30"
                      />
                      <p className="text-xs text-muted-foreground">
                        Nama ini akan ditampilkan di header dan judul halaman
                      </p>
                    </div>

                    {/* Save */}
                    <Button
                      onClick={handleSaveIdentity}
                      disabled={isSavingIdentity}
                      className="w-full bg-[#1e40af] hover:bg-[#1e3a8a] text-white shadow-lg shadow-blue-500/25"
                    >
                      {isSavingIdentity ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Menyimpan...
                        </span>
                      ) : (
                        <>
                          <Save className="size-4 mr-1.5" />
                          Simpan Identitas
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Right: Logo & Favicon upload cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Logo Upload Card */}
                    <Card className="border-dashed border-2 border-blue-100/50 dark:border-blue-900/30 bg-white/40 dark:bg-gray-800/20">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Logo</Label>
                          {identityForm.logoPath && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onClick={handleRemoveLogo}
                            >
                              <X className="size-3.5" />
                            </Button>
                          )}
                        </div>
                        {/* Preview */}
                        <div className="rounded-xl border border-blue-100/50 dark:border-blue-900/30 bg-white dark:bg-gray-800 h-28 flex items-center justify-center overflow-hidden">
                          {identityForm.logoPath ? (
                            <img
                              src={identityForm.logoPath}
                              alt="Logo Preview"
                              className="max-h-24 max-w-full object-contain"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-1 text-muted-foreground/40">
                              <ImageIcon className="size-8" />
                              <span className="text-[10px]">Belum ada logo</span>
                            </div>
                          )}
                        </div>
                        {/* File picker */}
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) setLogoFile(file)
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-blue-100/50 dark:border-blue-900/30 text-xs"
                          onClick={() => logoInputRef.current?.click()}
                        >
                          <ImagePlus className="size-3.5 mr-1.5" />
                          {logoFile ? logoFile.name.slice(0, 20) : 'Pilih File'}
                        </Button>
                        <Button
                          size="sm"
                          className="w-full bg-[#1e40af] hover:bg-[#1e3a8a] text-white text-xs"
                          disabled={!logoFile || isUploadingLogo}
                          onClick={handleUploadLogo}
                        >
                          {isUploadingLogo ? (
                            <span className="flex items-center gap-1.5">
                              <svg className="animate-spin size-3.5" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Mengunggah...
                            </span>
                          ) : (
                            <>
                              <Upload className="size-3.5 mr-1.5" />
                              Unggah Logo
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Favicon Upload Card */}
                    <Card className="border-dashed border-2 border-blue-100/50 dark:border-blue-900/30 bg-white/40 dark:bg-gray-800/20">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Favicon</Label>
                          {identityForm.faviconPath && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onClick={handleRemoveFavicon}
                            >
                              <X className="size-3.5" />
                            </Button>
                          )}
                        </div>
                        {/* Preview */}
                        <div className="rounded-xl border border-blue-100/50 dark:border-blue-900/30 bg-white dark:bg-gray-800 h-28 flex items-center justify-center overflow-hidden">
                          {identityForm.faviconPath ? (
                            <img
                              src={identityForm.faviconPath}
                              alt="Favicon Preview"
                              className="max-h-16 max-w-16 object-contain"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-1 text-muted-foreground/40">
                              <ImageIcon className="size-8" />
                              <span className="text-[10px]">Belum ada favicon</span>
                            </div>
                          )}
                        </div>
                        {/* File picker */}
                        <input
                          ref={faviconInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) setFaviconFile(file)
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-blue-100/50 dark:border-blue-900/30 text-xs"
                          onClick={() => faviconInputRef.current?.click()}
                        >
                          <ImagePlus className="size-3.5 mr-1.5" />
                          {faviconFile ? faviconFile.name.slice(0, 20) : 'Pilih File'}
                        </Button>
                        <Button
                          size="sm"
                          className="w-full bg-[#1e40af] hover:bg-[#1e3a8a] text-white text-xs"
                          disabled={!faviconFile || isUploadingFavicon}
                          onClick={handleUploadFavicon}
                        >
                          {isUploadingFavicon ? (
                            <span className="flex items-center gap-1.5">
                              <svg className="animate-spin size-3.5" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Mengunggah...
                            </span>
                          ) : (
                            <>
                              <Upload className="size-3.5 mr-1.5" />
                              Unggah Favicon
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* =============================================================== */}
          {/* Tab: Lokasi Kantor (Full CRUD)                                  */}
          {/* =============================================================== */}
          <TabsContent value="location">
            <OfficeManagement />
          </TabsContent>

          {/* =============================================================== */}
          {/* Tab: Jam Kerja (Full CRUD)                                      */}
          {/* =============================================================== */}
          <TabsContent value="workhours">
            <ShiftManagement />
          </TabsContent>

          {/* =============================================================== */}
          {/* Tab: Hari Libur                                                 */}
          {/* =============================================================== */}
          <TabsContent value="holidays">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Add Holiday Form */}
              <Card className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30 shadow-lg shadow-blue-500/5 lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-[#1e40af] dark:text-blue-300 flex items-center gap-2 text-lg">
                    <Plus className="size-5" />
                    Tambah Hari Libur
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="holidayName" className="text-sm font-medium">
                      Nama Hari Libur
                    </Label>
                    <Input
                      id="holidayName"
                      value={holidayForm.name}
                      onChange={(e) => setHolidayForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="contoh: Hari Kemerdekaan"
                      className="bg-white dark:bg-gray-800 border-blue-100/50 dark:border-blue-900/30"
                    />
                  </div>

                  {/* Date */}
                  <div className="space-y-2">
                    <Label htmlFor="holidayDate" className="text-sm font-medium">
                      Tanggal
                    </Label>
                    <Input
                      id="holidayDate"
                      type="date"
                      value={holidayForm.date}
                      onChange={(e) => setHolidayForm((f) => ({ ...f, date: e.target.value }))}
                      className="bg-white dark:bg-gray-800 border-blue-100/50 dark:border-blue-900/30"
                    />
                  </div>

                  {/* Type */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tipe</Label>
                    <Select
                      value={holidayForm.type}
                      onValueChange={(val) => setHolidayForm((f) => ({ ...f, type: val as HolidayType }))}
                    >
                      <SelectTrigger className="bg-white dark:bg-gray-800 border-blue-100/50 dark:border-blue-900/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NASIONAL">Nasional</SelectItem>
                        <SelectItem value="KEAGAMAAN">Keagamaan</SelectItem>
                        <SelectItem value="KHUSUS">Khusus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleAddHoliday}
                    disabled={isAddingHoliday}
                    className="w-full bg-[#1e40af] hover:bg-[#1e3a8a] text-white shadow-lg shadow-blue-500/25"
                  >
                    {isAddingHoliday ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Menambahkan...
                      </span>
                    ) : (
                      <>
                        <Plus className="size-4 mr-1.5" />
                        Tambah Hari Libur
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Holiday List */}
              <Card className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-blue-100/50 dark:border-blue-900/30 shadow-lg shadow-blue-500/5 lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-[#1e40af] dark:text-blue-300 flex items-center gap-2 text-lg">
                        <CalendarDays className="size-5" />
                        Daftar Hari Libur
                      </CardTitle>
                      <CardDescription>{holidays.length} hari libur terdaftar</CardDescription>
                    </div>
                    <Badge className="bg-[#1e40af]/10 text-[#1e40af] dark:bg-blue-900/30 dark:text-blue-300 border-[#1e40af]/20">
                      {holidays.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {holidays.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-2">
                      <CalendarDays className="size-10 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">Belum ada hari libur terdaftar</p>
                    </div>
                  ) : (
                    <ScrollArea className="max-h-[500px]">
                      <div className="space-y-2 pr-2">
                        <AnimatePresence mode="popLayout">
                          {holidays.map((holiday) => (
                            <motion.div
                              key={holiday.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="flex items-center justify-between rounded-xl border border-blue-100/50 dark:border-blue-900/30 bg-white/50 dark:bg-gray-800/30 p-3 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                                  holiday.type === 'NASIONAL'
                                    ? 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400'
                                    : holiday.type === 'KEAGAMAAN'
                                    ? 'bg-purple-50 text-purple-500 dark:bg-purple-900/30 dark:text-purple-400'
                                    : 'bg-amber-50 text-amber-500 dark:bg-amber-900/30 dark:text-amber-400'
                                }`}>
                                  <CalendarDays className="size-5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {holiday.name}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(holiday.date).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                      })}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className={`text-[10px] px-1.5 py-0 ${
                                        holiday.type === 'NASIONAL'
                                          ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                                          : holiday.type === 'KEAGAMAAN'
                                          ? 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800'
                                          : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
                                      }`}
                                    >
                                      {holiday.type === 'NASIONAL' ? 'Nasional' : holiday.type === 'KEAGAMAAN' ? 'Keagamaan' : 'Khusus'}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="shrink-0 h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={() => setDeleteHolidayTarget(holiday)}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* ================================================================= */}
      {/* Delete Holiday Confirmation                                       */}
      {/* ================================================================= */}
      <AlertDialog open={!!deleteHolidayTarget} onOpenChange={(open) => !open && setDeleteHolidayTarget(null)}>
        <AlertDialogContent className="bg-white dark:bg-gray-900 border-red-200/50 dark:border-red-900/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <Trash2 className="size-5" />
              Hapus Hari Libur
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus hari libur{' '}
              <strong>{deleteHolidayTarget?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingHoliday}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteHoliday}
              disabled={isDeletingHoliday}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeletingHoliday ? 'Menghapus...' : 'Ya, Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
