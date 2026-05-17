'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default marker icon issue in Leaflet + bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl

interface AvatarMapProps {
  lat: number
  lng: number
  photo: string | null
  name: string
  label: string
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function AvatarMap({ lat, lng, photo, name, label }: AvatarMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current) return

    // Destroy previous map instance if it exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }

    const initials = getInitials(name)

    const avatarIcon = L.divIcon({
      html: photo
        ? `<div style="width:44px;height:44px;border-radius:50%;border:3px solid #1e40af;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.3)"><img src="${photo}" style="width:100%;height:100%;object-fit:cover" alt="${name}" /></div>`
        : `<div style="width:44px;height:44px;border-radius:50%;border:3px solid #1e40af;background:#1e40af;color:white;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${initials}</div>`,
      className: '',
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    })

    const map = L.map(mapRef.current, {
      center: [lat, lng],
      zoom: 16,
      zoomControl: true,
      attributionControl: false,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map)

    L.marker([lat, lng], { icon: avatarIcon })
      .addTo(map)
      .bindPopup(`<strong>${name}</strong><br/>${label}`)

    mapInstanceRef.current = map

    // Force a resize check after mount
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 100)

    return () => {
      clearTimeout(timer)
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [lat, lng, photo, name, label])

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <div className="rounded-xl overflow-hidden border border-blue-100/50 dark:border-blue-900/30 shadow-sm">
        <div ref={mapRef} style={{ height: 250, width: '100%' }} />
      </div>
    </div>
  )
}
