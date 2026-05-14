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
} from 'lucide-react'

interface CameraViewProps {
  onCapture: (photo: string, confidence: number) => void
}

export function CameraView({ onCapture }: CameraViewProps) {
  const {
    videoRef,
    canvasRef,
    isActive,
    error,
    capturedPhoto,
    startCamera,
    stopCamera,
    capturePhoto,
    setCapturedPhoto,
  } = useCamera()

  const [isConfirming, setIsConfirming] = useState(false)
  const [confirmedData, setConfirmedData] = useState<{
    photo: string
    confidence: number
  } | null>(null)

  // Cleanup camera stream on unmount only
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  const handleStartCamera = useCallback(async () => {
    setCapturedPhoto(null)
    setConfirmedData(null)
    await startCamera()
  }, [startCamera, setCapturedPhoto])

  const handleCapture = useCallback(() => {
    const photo = capturePhoto()
    if (photo) {
      stopCamera()
    }
  }, [capturePhoto, stopCamera])

  const handleRetake = useCallback(async () => {
    setCapturedPhoto(null)
    setConfirmedData(null)
    await startCamera()
  }, [startCamera, setCapturedPhoto])

  const handleConfirm = useCallback(() => {
    if (!capturedPhoto) return
    setIsConfirming(true)

    // Simulate face recognition confidence score
    const confidence = Math.round((Math.random() * 0.14 + 0.85) * 100) / 100

    // Small delay to simulate processing
    setTimeout(() => {
      setConfirmedData({ photo: capturedPhoto, confidence })
      setIsConfirming(false)
      onCapture(capturedPhoto, confidence)
    }, 800)
  }, [capturedPhoto, onCapture])

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.95) return 'text-emerald-600'
    if (confidence >= 0.90) return 'text-blue-600'
    return 'text-amber-600'
  }

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.95) return 'Sangat Cocok'
    if (confidence >= 0.90) return 'Cocok'
    return 'Cukup Cocok'
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
            <div>
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                Verifikasi Wajah
              </h3>
              <p className="text-xs text-blue-600/70 dark:text-blue-400/70">
                Posisikan wajah di area oval
              </p>
            </div>
          </div>

          {/* Camera / Preview Area */}
          <div className="relative mx-auto aspect-[4/3] w-full max-w-md overflow-hidden rounded-2xl border-2 border-blue-200 bg-gradient-to-b from-slate-900 to-slate-800 shadow-lg shadow-blue-500/10 dark:border-blue-800">
            {!isActive && !capturedPhoto && (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-500/10">
                  <User className="h-10 w-10 text-blue-400/60" />
                </div>
                <p className="text-center text-sm text-slate-400">
                  Klik &ldquo;Mulai Kamera&rdquo; untuk memulai
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
            {capturedPhoto && (
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

          {/* Confirmed result */}
          {confirmedData && (
            <div className="rounded-xl border border-blue-200 bg-white/80 p-4 backdrop-blur-sm dark:border-blue-800 dark:bg-blue-950/30">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                    Wajah Terverifikasi
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={`text-xs ${getConfidenceColor(confirmedData.confidence)}`}
                    >
                      {(confirmedData.confidence * 100).toFixed(0)}% Confidence
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {getConfidenceLabel(confirmedData.confidence)}
                    </span>
                  </div>
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
            {!isActive && !capturedPhoto && (
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
                  className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25"
                  size="lg"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Ambil Foto
                </Button>
                <Button
                  onClick={stopCamera}
                  variant="outline"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/50"
                  size="lg"
                >
                  <CameraOff className="mr-2 h-4 w-4" />
                  Berhenti
                </Button>
              </>
            )}

            {capturedPhoto && !confirmedData && (
              <>
                <Button
                  onClick={handleConfirm}
                  disabled={isConfirming}
                  className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/25"
                  size="lg"
                >
                  {isConfirming ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memverifikasi...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Konfirmasi
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleRetake}
                  variant="outline"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/50"
                  size="lg"
                  disabled={isConfirming}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Ulangi
                </Button>
              </>
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
