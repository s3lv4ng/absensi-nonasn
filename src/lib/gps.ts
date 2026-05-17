import type { GPSValidationResult, LocationData } from '@/types'

/**
 * Haversine formula to calculate distance between two GPS coordinates
 * d = 2r * arcsin(√(sin²((φ₂-φ₁)/2) + cos(φ₁)cos(φ₂)sin²((λ₂-λ₁)/2)))
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000 // Earth's radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180

  const φ1 = toRad(lat1)
  const φ2 = toRad(lat2)
  const Δφ = toRad(lat2 - lat1)
  const Δλ = toRad(lon2 - lon1)

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

/**
 * Validate if a location is within office radius
 */
export function validateGPSLocation(
  userLocation: LocationData,
  officeLat: number,
  officeLon: number,
  radiusMeter: number
): GPSValidationResult {
  const distance = haversineDistance(
    userLocation.latitude,
    userLocation.longitude,
    officeLat,
    officeLon
  )

  return {
    isValid: distance <= radiusMeter,
    distance: Math.round(distance * 100) / 100,
    maxRadius: radiusMeter,
    message:
      distance <= radiusMeter
        ? `Anda berada dalam radius kantor (${Math.round(distance)}m dari kantor)`
        : `Anda berada di luar radius kantor (${Math.round(distance)}m dari kantor, max ${radiusMeter}m)`,
  }
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  }
  return `${(meters / 1000).toFixed(1)}km`
}

/**
 * Get current GPS position as a promise
 */
export function getCurrentPosition(): Promise<LocationData> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation tidak didukung oleh browser Anda'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        })
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('Akses lokasi ditolak. Silakan izinkan akses GPS.'))
            break
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Informasi lokasi tidak tersedia.'))
            break
          case error.TIMEOUT:
            reject(new Error('Waktu habis saat mendapatkan lokasi.'))
            break
          default:
            reject(new Error('Terjadi kesalahan saat mendapatkan lokasi.'))
            break
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    )
  })
}
