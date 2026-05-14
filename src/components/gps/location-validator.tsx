'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useGeolocation } from '@/hooks'
import { validateGPSLocation, formatDistance } from '@/lib/gps'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  MapPin,
  Navigation,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Crosshair,
  Radar,
} from 'lucide-react'

interface LocationValidatorProps {
  onLocationValid: (location: { latitude: number; longitude: number }) => void
  officeLat: number
  officeLon: number
  radiusMeter: number
  autoValidate?: boolean // If true, auto-trigger GPS validation on mount
}

export function LocationValidator({
  onLocationValid,
  officeLat,
  officeLon,
  radiusMeter,
  autoValidate = false,
}: LocationValidatorProps) {
  const { location, error, isLoading, requestLocation } = useGeolocation()
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean
    distance: number
    message: string
  } | null>(null)
  const [hasAutoValidated, setHasAutoValidated] = useState(false)

  const handleRequestLocation = useCallback(async () => {
    setValidationResult(null)
    const loc = await requestLocation()

    if (loc) {
      const result = validateGPSLocation(loc, officeLat, officeLon, radiusMeter)
      setValidationResult(result)

      if (result.isValid) {
        onLocationValid({ latitude: loc.latitude, longitude: loc.longitude })
      }
    }
  }, [requestLocation, officeLat, officeLon, radiusMeter, onLocationValid])

  // Auto-validate on mount if autoValidate is true
  useEffect(() => {
    if (autoValidate && !hasAutoValidated) {
      setHasAutoValidated(true)
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        handleRequestLocation()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [autoValidate, hasAutoValidated, handleRequestLocation])

  // Calculate distance percentage for the circular indicator
  const distancePercentage = useMemo(() => {
    if (!validationResult) return 0
    const pct = (validationResult.distance / radiusMeter) * 100
    return Math.min(pct, 100)
  }, [validationResult, radiusMeter])

  // Color based on status
  const statusColor = useMemo(() => {
    if (!validationResult) return 'blue'
    if (validationResult.isValid) {
      if (distancePercentage < 50) return 'emerald'
      return 'blue'
    }
    return 'red'
  }, [validationResult, distancePercentage])

  const getColorClasses = (color: string) => {
    const map = {
      emerald: {
        ring: 'stroke-emerald-500',
        text: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-950/30',
        border: 'border-emerald-200 dark:border-emerald-800',
        badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
      },
      blue: {
        ring: 'stroke-blue-500',
        text: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-950/30',
        border: 'border-blue-200 dark:border-blue-800',
        badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
      },
      red: {
        ring: 'stroke-red-500',
        text: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-50 dark:bg-red-950/30',
        border: 'border-red-200 dark:border-red-800',
        badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
      },
    }
    return map[color as keyof typeof map] || map.blue
  }

  const colors = getColorClasses(statusColor)

  return (
    <Card className="overflow-hidden border-blue-200 bg-gradient-to-br from-blue-50/80 to-white dark:from-blue-950/30 dark:to-background">
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
              <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                Validasi Lokasi
              </h3>
              <p className="text-xs text-blue-600/70 dark:text-blue-400/70">
                Radius kantor: {formatDistance(radiusMeter)}
              </p>
            </div>
          </div>

          {/* Circular Radius Indicator */}
          <div className="flex justify-center">
            <div className="relative flex h-44 w-44 items-center justify-center">
              {/* Background circle */}
              <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 160 160">
                {/* Track circle */}
                <circle
                  cx="80"
                  cy="80"
                  r="68"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-slate-200 dark:text-slate-700"
                />
                {/* Progress circle */}
                <circle
                  cx="80"
                  cy="80"
                  r="68"
                  fill="none"
                  strokeWidth="8"
                  strokeLinecap="round"
                  className={colors.ring}
                  strokeDasharray={`${2 * Math.PI * 68}`}
                  strokeDashoffset={`${2 * Math.PI * 68 * (1 - distancePercentage / 100)}`}
                  style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
                />
              </svg>

              {/* Center content */}
              <div className="z-10 flex flex-col items-center gap-1">
                {isLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                ) : validationResult ? (
                  <>
                    {validationResult.isValid ? (
                      <CheckCircle2 className={`h-8 w-8 ${colors.text}`} />
                    ) : (
                      <XCircle className={`h-8 w-8 ${colors.text}`} />
                    )}
                    <span className={`text-lg font-bold ${colors.text}`}>
                      {formatDistance(validationResult.distance)}
                    </span>
                    <span className="text-xs text-muted-foreground">dari kantor</span>
                  </>
                ) : (
                  <>
                    <Crosshair className="h-8 w-8 text-slate-400" />
                    <span className="text-xs text-muted-foreground">Belum terdeteksi</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Validation Result */}
          {validationResult && (
            <div
              className={`rounded-xl border p-4 ${colors.bg} ${colors.border}`}
            >
              <div className="flex items-start gap-3">
                {validationResult.isValid ? (
                  <CheckCircle2 className={`mt-0.5 h-5 w-5 shrink-0 ${colors.text}`} />
                ) : (
                  <XCircle className={`mt-0.5 h-5 w-5 shrink-0 ${colors.text}`} />
                )}
                <div className="flex-1 space-y-2">
                  <p className={`text-sm font-semibold ${colors.text}`}>
                    {validationResult.isValid ? 'Dalam Radius' : 'Di Luar Radius'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {validationResult.message}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className={colors.badge}>
                      <Navigation className="mr-1 h-3 w-3" />
                      {formatDistance(validationResult.distance)}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Radar className="mr-1 h-3 w-3" />
                      Max {formatDistance(radiusMeter)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* GPS Coordinates Display */}
          {location && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/50">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Koordinat GPS
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Latitude</p>
                  <p className="font-mono text-sm font-medium">{location.latitude.toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Longitude</p>
                  <p className="font-mono text-sm font-medium">{location.longitude.toFixed(6)}</p>
                </div>
              </div>
              <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Crosshair className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Akurasi:</span>
                  <span className="text-sm font-medium">
                    {location.accuracy.toFixed(1)}m
                  </span>
                  {location.accuracy <= 10 && (
                    <Badge className="bg-emerald-100 text-emerald-700 text-[10px] dark:bg-emerald-900/40 dark:text-emerald-300">
                      Presisi Tinggi
                    </Badge>
                  )}
                  {location.accuracy > 10 && location.accuracy <= 30 && (
                    <Badge className="bg-blue-100 text-blue-700 text-[10px] dark:bg-blue-900/40 dark:text-blue-300">
                      Presisi Sedang
                    </Badge>
                  )}
                  {location.accuracy > 30 && (
                    <Badge className="bg-amber-100 text-amber-700 text-[10px] dark:bg-amber-900/40 dark:text-amber-300">
                      Presisi Rendah
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Map Placeholder */}
          {location && (
            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-blue-100/50 to-emerald-100/50 p-6 dark:border-slate-700 dark:from-blue-950/30 dark:to-emerald-950/30">
              <div className="flex flex-col items-center gap-3">
                {/* Stylized map placeholder */}
                <div className="relative h-28 w-full max-w-xs">
                  {/* Grid lines */}
                  <div className="absolute inset-0">
                    <div className="absolute left-1/4 top-0 h-full w-px bg-blue-300/40 dark:bg-blue-600/20" />
                    <div className="absolute left-1/2 top-0 h-full w-px bg-blue-300/40 dark:bg-blue-600/20" />
                    <div className="absolute left-3/4 top-0 h-full w-px bg-blue-300/40 dark:bg-blue-600/20" />
                    <div className="absolute left-0 top-1/4 h-px w-full bg-blue-300/40 dark:bg-blue-600/20" />
                    <div className="absolute left-0 top-1/2 h-px w-full bg-blue-300/40 dark:bg-blue-600/20" />
                    <div className="absolute left-0 top-3/4 h-px w-full bg-blue-300/40 dark:bg-blue-600/20" />
                  </div>

                  {/* Office location marker */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="relative">
                      <div className="absolute -inset-4 rounded-full bg-blue-200/40 dark:bg-blue-800/30" />
                      <div className="absolute -inset-8 rounded-full bg-blue-200/20 dark:bg-blue-800/15" />
                      <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 shadow-lg shadow-blue-500/30">
                        <MapPin className="h-3.5 w-3.5 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* User location indicator (offset based on distance) */}
                  {validationResult && (
                    <div
                      className="absolute transition-all duration-700"
                      style={{
                        left: `${50 + (validationResult.isValid ? 15 : 25) * (Math.random() > 0.5 ? 1 : -1)}%`,
                        top: `${50 + (validationResult.isValid ? 10 : 20) * (Math.random() > 0.5 ? 1 : -1)}%`,
                      }}
                    >
                      <div className="relative">
                        <div
                          className={`absolute -inset-2 rounded-full ${validationResult.isValid ? 'bg-emerald-300/40' : 'bg-red-300/40'}`}
                        />
                        <div
                          className={`relative flex h-5 w-5 items-center justify-center rounded-full ${validationResult.isValid ? 'bg-emerald-500' : 'bg-red-500'} shadow-lg`}
                        >
                          <Navigation className="h-2.5 w-2.5 text-white" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                    Kantor: {officeLat.toFixed(4)}, {officeLon.toFixed(4)}
                  </p>
                  {location && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Anda: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                    </p>
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

          {/* Action Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleRequestLocation}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mendapatkan Lokasi...
                </>
              ) : (
                <>
                  <Crosshair className="mr-2 h-4 w-4" />
                  {validationResult ? 'Validasi Ulang Lokasi' : 'Ambil Lokasi'}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
