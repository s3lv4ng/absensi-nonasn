'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useCamera } from '@/hooks'
import {
  loadFaceModels,
  verifyFace,
  areModelsLoaded,
  checkFaceDetected,
} from '@/lib/face-recognition'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  Camera,
  CameraOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  User,
  ShieldCheck,
  ShieldX,
} from 'lucide-react'

interface CameraViewProps {
  onCapture: (photo: string, confidence: number, isVerified: boolean) => void
  /** The stored face descriptor JSON string for matching against */
  storedFaceDescriptor?: string | null
}

type VerifyStatus = 'idle' | 'loading-models' | 'camera' | 'captured' | 'verifying' | 'verified' | 'rejected' | 'error'

export function CameraView({ onCapture, storedFaceDescriptor }: CameraViewProps) {
  const {
    videoRef,
    canvasRef,
    isActive,
    isReady,
    error,
    capturedPhoto,
    startCamera,
    stopCamera,
    capturePhoto,
    setCapturedPhoto,
  } = useCamera()

  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>('idle')
  const [faceDetected, setFaceDetected] = useState(false)
  const [modelsReady, setModelsReady] = useState(() => areModelsLoaded())
  const [modelsProgress, setModelsProgress] = useState(0)
  const [verifiedData, setVerifiedData] = useState<{
    photo: string
    confidence: number
    isVerified: boolean
    label: string
    distance: number
  } | null>(null)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const faceCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load face-api models on mount if not already loaded
  useEffect(() => {
    if (areModelsLoaded()) return

    let cancelled = false
    const loadModelsAsync = async () => {
      try {
        setModelsProgress(30)
        await loadFaceModels()
        if (!cancelled) {
          setModelsProgress(100)
          setModelsReady(true)
        }
      } catch (err) {
        console.error('Failed to load face models:', err)
      }
    }

    loadModelsAsync()
    return () => { cancelled = true }
  }, [])

  // Periodically check for face in camera feed
  useEffect(() => {
    if (isActive && isReady && modelsReady && !capturedPhoto) {
      faceCheckIntervalRef.current = setInterval(async () => {
        if (videoRef.current && videoRef.current.readyState >= 2) {
          const result = await checkFaceDetected(videoRef.current)
          setFaceDetected(result.detected)
        }
      }, 500)

      return () => {
        if (faceCheckIntervalRef.current) {
          clearInterval(faceCheckIntervalRef.current)
          faceCheckIntervalRef.current = null
        }
      }
    }
  }, [isActive, isReady, modelsReady, capturedPhoto, videoRef])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
      if (faceCheckIntervalRef.current) {
        clearInterval(faceCheckIntervalRef.current)
      }
    }
  }, [stopCamera])

  const handleStartCamera = useCallback(async () => {
    setCapturedPhoto(null)
    setVerifiedData(null)
    setVerifyError(null)
    setFaceDetected(false)

    if (!modelsReady) {
      setVerifyStatus('loading-models')
      try {
        setModelsProgress(50)
        await loadFaceModels()
        setModelsProgress(100)
        setModelsReady(true)
      } catch {
        setVerifyError('Gagal memuat model AI pengenalan wajah.')
        setVerifyStatus('error')
        return
      }
    }

    setVerifyStatus('camera')
    await startCamera()
  }, [startCamera, setCapturedPhoto, modelsReady])

  const handleCapture = useCallback(() => {
    if (!faceDetected) {
      setVerifyError('Wajah tidak terdeteksi. Pastikan wajah terlihat jelas di kamera.')
      return
    }

    const photo = capturePhoto()
    if (photo) {
      stopCamera()
      setFaceDetected(false)
      setVerifyStatus('captured')
    }
  }, [capturePhoto, stopCamera, faceDetected])

  const handleRetake = useCallback(async () => {
    setCapturedPhoto(null)
    setVerifiedData(null)
    setVerifyError(null)
    setFaceDetected(false)
    setVerifyStatus('camera')
    await startCamera()
  }, [startCamera, setCapturedPhoto])

  const handleConfirm = useCallback(async () => {
    if (!capturedPhoto) return
    setVerifyStatus('verifying')
    setVerifyError(null)

    try {
      // Create an image element from captured photo
      const img = new Image()
      img.crossOrigin = 'anonymous'

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Gagal memuat gambar'))
        img.src = capturedPhoto
      })

      if (!storedFaceDescriptor) {
        // No stored descriptor - face must be registered first
        setVerifyError('Data wajah belum terdaftar. Silakan daftarkan wajah Anda di halaman Profil terlebih dahulu.')
        setVerifiedData({
          photo: capturedPhoto,
          confidence: 0,
          isVerified: false,
          label: 'Wajah Belum Terdaftar',
          distance: Infinity,
        })
        setVerifyStatus('rejected')
        return
      }

      // Verify face against stored descriptor
      const result = await verifyFace(img, storedFaceDescriptor)

      if (!result.faceDetected) {
        setVerifyError(result.error || 'Wajah tidak terdeteksi dalam foto.')
        setVerifyStatus('rejected')
        return
      }

      if (!result.isVerified) {
        setVerifiedData({
          photo: capturedPhoto,
          confidence: result.confidence,
          isVerified: false,
          label: result.label,
          distance: result.distance,
        })
        setVerifyError(result.error || 'Wajah tidak cocok dengan data yang terdaftar.')
        setVerifyStatus('rejected')
        return
      }

      // Face verified successfully
      setVerifiedData({
        photo: capturedPhoto,
        confidence: result.confidence,
        isVerified: true,
        label: result.label,
        distance: result.distance,
      })
      setVerifyStatus('verified')
      onCapture(capturedPhoto, result.confidence, true)
    } catch (err) {
      console.error('[CameraView] Verification error:', err)
      setVerifyError('Terjadi kesalahan saat verifikasi wajah. Silakan coba lagi.')
      setVerifyStatus('error')
    }
  }, [capturedPhoto, onCapture, storedFaceDescriptor])

  const getConfidenceBadgeColor = (confidence: number, isVerified: boolean) => {
    if (!isVerified) return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
    if (confidence >= 0.70) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
    if (confidence >= 0.50) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
  }

  return (
    <Card className="overflow-hidden border-blue-200 bg-gradient-to-br from-blue-50/80 to-white dark:from-blue-950/30 dark:to-background">
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
              <Camera className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                Verifikasi Wajah
              </h3>
              <p className="text-xs text-blue-600/70 dark:text-blue-400/70">
                {storedFaceDescriptor
                  ? 'Wajah akan dicocokkan dengan data terdaftar'
                  : '⚠️ Daftarkan wajah Anda di Profil terlebih dahulu'}
              </p>
            </div>
            {storedFaceDescriptor && (
              <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                <ShieldCheck className="mr-1 h-3 w-3" />
                AI Match
              </Badge>
            )}
          </div>

          {/* Models loading */}
          {verifyStatus === 'loading-models' && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-4 dark:border-blue-800 dark:bg-blue-950/40">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Memuat model AI...
                  </p>
                  <Progress value={modelsProgress} className="mt-2 h-2" />
                </div>
              </div>
            </div>
          )}

          {/* Camera / Preview Area */}
          <div className={`relative mx-auto aspect-[4/3] w-full max-w-md overflow-hidden rounded-2xl border-2 bg-gradient-to-b from-slate-900 to-slate-800 shadow-lg shadow-blue-500/10 ${
            verifyStatus === 'verified' ? 'border-emerald-400' :
            verifyStatus === 'rejected' ? 'border-red-400' :
            'border-blue-200 dark:border-blue-800'
          }`}>
            {/* Always render video element so ref is available for stream attachment */}
            <div className={`relative h-full w-full ${isActive && !capturedPhoto ? '' : 'hidden'}`}>
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                playsInline
                autoPlay
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
                    className={`absolute inset-0 rounded-[50%] border-2 transition-all duration-300 ${
                      faceDetected
                        ? 'border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                        : 'border-blue-400/70 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                    }`}
                    style={{
                      animation: faceDetected ? 'none' : 'pulse-oval 2s ease-in-out infinite',
                    }}
                  />
                  {/* Corner brackets */}
                  <div className={`absolute -left-1 -top-1 h-5 w-5 border-l-2 border-t-2 ${faceDetected ? 'border-emerald-400' : 'border-blue-400'}`} />
                  <div className={`absolute -right-1 -top-1 h-5 w-5 border-r-2 border-t-2 ${faceDetected ? 'border-emerald-400' : 'border-blue-400'}`} />
                  <div className={`absolute -bottom-1 -left-1 h-5 w-5 border-b-2 border-l-2 ${faceDetected ? 'border-emerald-400' : 'border-blue-400'}`} />
                  <div className={`absolute -bottom-1 -right-1 h-5 w-5 border-b-2 border-r-2 ${faceDetected ? 'border-emerald-400' : 'border-blue-400'}`} />
                </div>
                {/* Scanning line effect */}
                {!faceDetected && (
                  <div
                    className="absolute left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-transparent via-blue-400/60 to-transparent"
                    style={{
                      animation: 'scan-line 2.5s ease-in-out infinite',
                    }}
                  />
                )}
              </div>

              {/* Active indicator + Face status */}
              <div className="absolute left-3 top-3 flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 backdrop-blur-sm">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                  <span className="text-xs font-medium text-white">LIVE</span>
                </div>
                {faceDetected && (
                  <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/80 px-2.5 py-1 backdrop-blur-sm">
                    <CheckCircle2 className="h-3 w-3 text-white" />
                    <span className="text-xs font-medium text-white">Wajah Terdeteksi</span>
                  </div>
                )}
              </div>
            </div>

            {/* Placeholder when camera is not active */}
            {!isActive && !capturedPhoto && verifyStatus !== 'loading-models' && (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-500/10">
                  <User className="h-10 w-10 text-blue-400/60" />
                </div>
                <p className="text-center text-sm text-slate-400">
                  Klik &ldquo;Mulai Kamera&rdquo; untuk memulai
                </p>
              </div>
            )}

            {/* Captured photo preview */}
            {capturedPhoto && (
              <div className="relative h-full w-full">
                <img
                  src={capturedPhoto}
                  alt="Foto yang diambil"
                  className="h-full w-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                {/* Status overlay */}
                {verifyStatus === 'verifying' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                      <span className="text-sm font-medium text-white">Memverifikasi wajah...</span>
                    </div>
                  </div>
                )}

                {verifyStatus !== 'verifying' && (
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-emerald-500/80 px-2.5 py-1 backdrop-blur-sm">
                    <CheckCircle2 className="h-3 w-3 text-white" />
                    <span className="text-xs font-medium text-white">Tertangkap</span>
                  </div>
                )}
              </div>
            )}

            {/* Hidden canvas for photo capture */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Verified result */}
          {verifiedData && verifyStatus === 'verified' && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 backdrop-blur-sm dark:border-emerald-800 dark:bg-emerald-950/30">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                  <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                    Wajah Terverifikasi ✓
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={`text-xs ${getConfidenceBadgeColor(verifiedData.confidence, verifiedData.isVerified)}`}
                    >
                      {(verifiedData.confidence * 100).toFixed(0)}% Match
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {verifiedData.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      (distance: {verifiedData.distance.toFixed(3)})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rejected result */}
          {(verifyStatus === 'rejected' || (verifiedData && !verifiedData.isVerified)) && (
            <div className="rounded-xl border border-red-200 bg-red-50/80 p-4 backdrop-blur-sm dark:border-red-800 dark:bg-red-950/30">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
                  <ShieldX className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                    Verifikasi Gagal ✗
                  </p>
                  <p className="text-xs text-red-600/70 dark:text-red-400/70">
                    {verifyError || 'Wajah tidak cocok dengan data yang terdaftar'}
                  </p>
                  {verifiedData && (
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                        {(verifiedData.confidence * 100).toFixed(0)}% Match
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {verifiedData.label}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50/80 dark:bg-red-950/30">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {!isActive && !capturedPhoto && verifyStatus !== 'loading-models' && (
              <Button
                onClick={handleStartCamera}
                className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25"
                size="lg"
              >
                <Camera className="mr-2 h-4 w-4" />
                Mulai Kamera
              </Button>
            )}

            {isActive && !capturedPhoto && (
              <>
                <Button
                  onClick={handleCapture}
                  disabled={!faceDetected}
                  className={`shadow-lg ${
                    faceDetected
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25'
                      : 'bg-slate-400 cursor-not-allowed'
                  }`}
                  size="lg"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  {faceDetected ? 'Ambil Foto' : 'Menunggu Wajah...'}
                </Button>
                <Button
                  onClick={() => {
                    stopCamera()
                    setVerifyStatus('idle')
                    setFaceDetected(false)
                  }}
                  variant="outline"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/50"
                  size="lg"
                >
                  <CameraOff className="mr-2 h-4 w-4" />
                  Berhenti
                </Button>
              </>
            )}

            {capturedPhoto && verifyStatus === 'captured' && (
              <>
                <Button
                  onClick={handleConfirm}
                  className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/25"
                  size="lg"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Verifikasi Wajah
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

            {verifyStatus === 'verifying' && (
              <Button disabled className="bg-emerald-600" size="lg">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memverifikasi...
              </Button>
            )}

            {verifyStatus === 'verified' && verifiedData?.isVerified && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Wajah berhasil diverifikasi
              </div>
            )}

            {(verifyStatus === 'rejected' || verifyStatus === 'error') && (
              <Button
                onClick={handleRetake}
                className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25"
                size="lg"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Coba Lagi
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
