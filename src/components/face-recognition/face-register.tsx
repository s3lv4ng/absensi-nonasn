'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCamera } from '@/hooks'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Camera,
  CameraOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  User,
  ScanFace,
  Save,
  Fingerprint,
} from 'lucide-react'

interface FaceRegisterProps {
  userId?: string
  onRegistered?: () => void
}

type RegistrationStatus = 'idle' | 'camera' | 'captured' | 'registering' | 'success' | 'error'

export function FaceRegister({ userId, onRegistered }: FaceRegisterProps) {
  const {
    videoRef,
    canvasRef,
    isActive,
    error: cameraError,
    capturedPhoto,
    startCamera,
    stopCamera,
    capturePhoto,
    setCapturedPhoto,
  } = useCamera()

  const [status, setStatus] = useState<RegistrationStatus>('idle')
  const [apiError, setApiError] = useState<string | null>(null)
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null)

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  const generateFaceDescriptor = useCallback((): number[] => {
    // Simulate a 128-dimensional face descriptor (like face-api.js)
    const descriptor: number[] = []
    for (let i = 0; i < 128; i++) {
      descriptor.push(parseFloat((Math.random() * 2 - 1).toFixed(6)))
    }
    return descriptor
  }, [])

  const handleStartCamera = useCallback(async () => {
    setApiError(null)
    setCapturedPhoto(null)
    setFaceDescriptor(null)
    setStatus('camera')
    await startCamera()
  }, [startCamera, setCapturedPhoto])

  const handleCapture = useCallback(() => {
    const photo = capturePhoto()
    if (photo) {
      stopCamera()
      setStatus('captured')
    }
  }, [capturePhoto, stopCamera])

  const handleRetake = useCallback(async () => {
    setCapturedPhoto(null)
    setFaceDescriptor(null)
    setApiError(null)
    setStatus('camera')
    await startCamera()
  }, [startCamera, setCapturedPhoto])

  const handleRegister = useCallback(async () => {
    if (!capturedPhoto) return

    setStatus('registering')
    setApiError(null)

    // Generate the face descriptor
    const descriptor = generateFaceDescriptor()
    setFaceDescriptor(descriptor)

    try {
      const response = await fetch('/api/users/face', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId || undefined,
          faceDescriptor: JSON.stringify(descriptor),
          photo: capturedPhoto,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Gagal mendaftarkan data wajah')
      }

      setStatus('success')
      onRegistered?.()
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : 'Terjadi kesalahan saat mendaftarkan wajah'
      )
      setStatus('error')
    }
  }, [capturedPhoto, userId, generateFaceDescriptor, onRegistered])

  const getStepStatus = (step: number) => {
    if (status === 'success') return 'complete'
    if (status === 'error') {
      if (step < 3) return 'complete'
      return 'error'
    }
    const stepMap: Record<RegistrationStatus, number> = {
      idle: 0,
      camera: 1,
      captured: 2,
      registering: 3,
      success: 3,
      error: 3,
    }
    const currentStep = stepMap[status]
    if (step < currentStep) return 'complete'
    if (step === currentStep) return 'active'
    return 'pending'
  }

  return (
    <Card className="overflow-hidden border-blue-200 bg-gradient-to-br from-blue-50/80 to-white dark:from-blue-950/30 dark:to-background">
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
              <ScanFace className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                Registrasi Wajah
              </h3>
              <p className="text-xs text-blue-600/70 dark:text-blue-400/70">
                Daftarkan data wajah untuk verifikasi absensi
              </p>
            </div>
          </div>

          {/* Steps Indicator */}
          <div className="flex items-center gap-2">
            {[
              { step: 1, label: 'Kamera', icon: Camera },
              { step: 2, label: 'Foto', icon: User },
              { step: 3, label: 'Simpan', icon: Save },
            ].map(({ step, label, icon: Icon }) => {
              const stepStatus = getStepStatus(step)
              return (
                <div key={step} className="flex flex-1 items-center gap-2">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                      stepStatus === 'complete'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : stepStatus === 'active'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                          : stepStatus === 'error'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                            : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                    }`}
                  >
                    {stepStatus === 'complete' ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : stepStatus === 'error' ? (
                      <AlertTriangle className="h-3.5 w-3.5" />
                    ) : (
                      <Icon className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      stepStatus === 'active'
                        ? 'text-blue-700 dark:text-blue-300'
                        : stepStatus === 'complete'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : stepStatus === 'error'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {label}
                  </span>
                  {step < 3 && (
                    <div
                      className={`h-px flex-1 ${
                        stepStatus === 'complete'
                          ? 'bg-emerald-300 dark:bg-emerald-700'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>

          {/* Instruction */}
          {status === 'camera' && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-3 dark:border-blue-800 dark:bg-blue-950/40">
              <p className="text-center text-sm font-medium text-blue-700 dark:text-blue-300">
                Posisikan wajah Anda di dalam area oval
              </p>
              <p className="mt-1 text-center text-xs text-blue-600/60 dark:text-blue-400/60">
                Pastikan pencahayaan cukup dan wajah terlihat jelas
              </p>
            </div>
          )}

          {/* Camera / Preview Area */}
          <div className="relative mx-auto aspect-[4/3] w-full max-w-md overflow-hidden rounded-2xl border-2 border-blue-200 bg-gradient-to-b from-slate-900 to-slate-800 shadow-lg shadow-blue-500/10 dark:border-blue-800">
            {status === 'idle' && (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-500/10">
                  <ScanFace className="h-10 w-10 text-blue-400/60" />
                </div>
                <p className="text-center text-sm text-slate-400">
                  Klik &ldquo;Mulai Kamera&rdquo; untuk memulai registrasi
                </p>
              </div>
            )}

            {/* Live camera feed */}
            {isActive && (
              <div className="relative h-full w-full">
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  playsInline
                  muted
                  style={{ transform: 'scaleX(-1)' }}
                />

                {/* Face detection oval overlay */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div
                    className="relative"
                    style={{
                      width: '55%',
                      height: '72%',
                    }}
                  >
                    <div
                      className="absolute inset-0 rounded-[50%] border-2 border-blue-400/70 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                      style={{
                        animation: 'pulse-oval 2s ease-in-out infinite',
                      }}
                    />
                    {/* Corner brackets */}
                    <div className="absolute -left-1 -top-1 h-5 w-5 border-l-2 border-t-2 border-blue-400" />
                    <div className="absolute -right-1 -top-1 h-5 w-5 border-r-2 border-t-2 border-blue-400" />
                    <div className="absolute -bottom-1 -left-1 h-5 w-5 border-b-2 border-l-2 border-blue-400" />
                    <div className="absolute -bottom-1 -right-1 h-5 w-5 border-b-2 border-r-2 border-blue-400" />
                  </div>
                  {/* Scanning line effect */}
                  <div
                    className="absolute left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-transparent via-blue-400/60 to-transparent"
                    style={{
                      animation: 'scan-line 2.5s ease-in-out infinite',
                    }}
                  />
                </div>

                {/* Active indicator */}
                <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 backdrop-blur-sm">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                  <span className="text-xs font-medium text-white">LIVE</span>
                </div>
              </div>
            )}

            {/* Captured photo preview */}
            {capturedPhoto && (status === 'captured' || status === 'registering' || status === 'success' || status === 'error') && (
              <div className="relative h-full w-full">
                <img
                  src={capturedPhoto}
                  alt="Foto yang diambil"
                  className="h-full w-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-emerald-500/80 px-2.5 py-1 backdrop-blur-sm">
                  <CheckCircle2 className="h-3 w-3 text-white" />
                  <span className="text-xs font-medium text-white">Tertangkap</span>
                </div>
              </div>
            )}

            {/* Hidden canvas for photo capture */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Face Descriptor Preview */}
          {faceDescriptor && (status === 'success' || status === 'error') && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <Fingerprint className="h-4 w-4 text-blue-500" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Face Descriptor (128 dimensi)
                </p>
              </div>
              <div className="mt-2 max-h-16 overflow-y-auto rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
                <p className="font-mono text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                  [{faceDescriptor.slice(0, 16).map((v) => v.toFixed(4)).join(', ')}, ...]
                </p>
              </div>
              <div className="mt-1 flex items-center gap-1">
                <Badge variant="secondary" className="text-[10px]">
                  128 values
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  Float32
                </Badge>
              </div>
            </div>
          )}

          {/* Success state */}
          {status === 'success' && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                    Data Wajah Berhasil Disimpan
                  </p>
                  <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                    Wajah Anda telah terdaftar dan dapat digunakan untuk verifikasi absensi
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error states */}
          {(cameraError || apiError) && (
            <Alert variant="destructive" className="border-red-200 bg-red-50/80 dark:bg-red-950/30">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {cameraError || apiError}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {status === 'idle' && (
              <Button
                onClick={handleStartCamera}
                className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25"
                size="lg"
              >
                <Camera className="mr-2 h-4 w-4" />
                Mulai Kamera
              </Button>
            )}

            {status === 'camera' && (
              <>
                <Button
                  onClick={handleCapture}
                  className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25"
                  size="lg"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Ambil Foto
                </Button>
                <Button
                  onClick={() => {
                    stopCamera()
                    setStatus('idle')
                  }}
                  variant="outline"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/50"
                  size="lg"
                >
                  <CameraOff className="mr-2 h-4 w-4" />
                  Batal
                </Button>
              </>
            )}

            {status === 'captured' && (
              <>
                <Button
                  onClick={handleRegister}
                  className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25"
                  size="lg"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Simpan Data Wajah
                </Button>
                <Button
                  onClick={handleRetake}
                  variant="outline"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/50"
                  size="lg"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Ulangi
                </Button>
              </>
            )}

            {status === 'registering' && (
              <Button disabled className="bg-blue-600" size="lg">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </Button>
            )}

            {(status === 'success' || status === 'error') && (
              <Button
                onClick={handleStartCamera}
                className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25"
                size="lg"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Registrasi Ulang
              </Button>
            )}
          </div>
        </div>

        {/* CSS animations */}
        <style jsx>{`
          @keyframes pulse-oval {
            0%, 100% { opacity: 0.7; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.02); }
          }
          @keyframes scan-line {
            0% { top: 20%; }
            50% { top: 70%; }
            100% { top: 20%; }
          }
        `}</style>
      </CardContent>
    </Card>
  )
}
