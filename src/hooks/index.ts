'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { LocationData } from '@/types'

export function useGeolocation() {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const requestLocation = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation tidak didukung oleh browser Anda')
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        })
      })

      const loc: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      }

      setLocation(loc)
      return loc
    } catch (err) {
      const message =
        err instanceof GeolocationPositionError
          ? err.code === err.PERMISSION_DENIED
            ? 'Akses lokasi ditolak. Silakan izinkan akses GPS.'
            : err.code === err.POSITION_UNAVAILABLE
              ? 'Informasi lokasi tidak tersedia.'
              : 'Waktu habis saat mendapatkan lokasi.'
          : 'Terjadi kesalahan saat mendapatkan lokasi.'

      setError(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { location, error, isLoading, requestLocation }
}

export function useClock() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return {
    time,
    hours: time.getHours().toString().padStart(2, '0'),
    minutes: time.getMinutes().toString().padStart(2, '0'),
    seconds: time.getSeconds().toString().padStart(2, '0'),
    formatted: time.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    dateFormatted: time.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  }
}

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false) // Video is playing and ready

  // Wait for video to be ready (playing)
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleCanPlay = () => {
      setIsReady(true)
    }

    const handlePlaying = () => {
      setIsReady(true)
    }

    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('playing', handlePlaying)

    return () => {
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('playing', handlePlaying)
    }
  }, [isActive])

  const startCamera = useCallback(async () => {
    setError(null)
    setIsReady(false)

    try {
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      })

      streamRef.current = mediaStream

      // If video element is already in DOM, attach immediately
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream

        // Important: Set these attributes before playing
        videoRef.current.muted = true
        videoRef.current.playsInline = true

        try {
          await videoRef.current.play()
          setIsReady(true)
        } catch (playError) {
          // Autoplay may be blocked, try with muted
          console.warn('[Camera] Play failed, retrying with muted:', playError)
          if (videoRef.current) {
            videoRef.current.muted = true
            try {
              await videoRef.current.play()
              setIsReady(true)
            } catch {
              console.error('[Camera] Failed to play even with muted')
            }
          }
        }
      }

      setIsActive(true)
    } catch (err) {
      console.error('[Camera] Error accessing camera:', err)
      setError(
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Akses kamera ditolak. Silakan izinkan akses kamera.'
          : err instanceof DOMException && err.name === 'NotFoundError'
            ? 'Kamera tidak ditemukan. Pastikan perangkat memiliki kamera.'
            : 'Tidak dapat mengakses kamera. Pastikan kamera tersedia dan tidak digunakan aplikasi lain.'
      )
      setIsActive(false)
    }
  }, [])

  // Attach stream to video when video element mounts after stream starts
  useEffect(() => {
    if (isActive && streamRef.current && videoRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.muted = true
      videoRef.current.playsInline = true
      videoRef.current.play().then(() => {
        setIsReady(true)
      }).catch(() => {
        if (videoRef.current) {
          videoRef.current.muted = true
          videoRef.current.play().catch(() => {})
        }
      })
    }
  }, [isActive])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsActive(false)
    setIsReady(false)
  }, [])

  const capturePhoto = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) return null

    const video = videoRef.current
    const canvas = canvasRef.current

    // Use actual video dimensions (not CSS dimensions)
    const videoWidth = video.videoWidth || 640
    const videoHeight = video.videoHeight || 480

    canvas.width = videoWidth
    canvas.height = videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    // Draw current frame (not mirrored - we'll mirror in display)
    ctx.drawImage(video, 0, 0, videoWidth, videoHeight)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
    setCapturedPhoto(dataUrl)
    return dataUrl
  }, [])

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [])

  return {
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
  }
}
