'use client'

import { useRouter } from 'next/navigation'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Court, Gathering } from '@/types'
import { useEffect, useMemo } from 'react'

type Props = {
  courts: Court[]
  gatherings: Gathering[]
  userLocation: { lat: number; lng: number } | null
}

// Custom pin ikonice (bez podrazumevanog Leaflet plavog markera)
function courtIcon(active: boolean) {
  return L.divIcon({
    className: '',
    html: active
      ? `<div style="position:relative;width:28px;height:28px;">
           <div style="position:absolute;inset:0;border-radius:9999px;background:rgba(255,107,0,.18);animation:mapPulse 2s ease-out infinite;"></div>
           <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:14px;height:14px;border-radius:9999px;background:#FF6B00;box-shadow:0 0 0 3px rgba(255,107,0,.25),0 2px 8px rgba(255,107,0,.4);"></div>
         </div>`
      : `<div style="width:10px;height:10px;border-radius:9999px;background:#3A3A3E;border:1.5px solid rgba(255,255,255,.25);"></div>`,
    iconSize: active ? [28, 28] : [10, 10],
    iconAnchor: active ? [14, 14] : [5, 5],
  })
}

function userIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:22px;height:22px;">
             <div style="position:absolute;inset:0;border-radius:9999px;background:rgba(10,132,255,.18);"></div>
             <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:14px;height:14px;border-radius:9999px;background:#0A84FF;border:2.5px solid white;"></div>
           </div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })
}

/** Uklapa mapu tako da se vide svi tereni + korisnikova lokacija */
function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return
    if (points.length === 1) {
      map.setView(points[0], 14)
    } else {
      map.fitBounds(points, { padding: [30, 30], maxZoom: 15 })
    }
  }, [map, points])
  return null
}

export default function HomeMap({ courts, gatherings, userLocation }: Props) {
  const router = useRouter()
  const activeCourts = useMemo(() => new Set(gatherings.map(g => g.court_id)), [gatherings])
  const activeCount = courts.filter(c => activeCourts.has(c.id)).length

  const points: [number, number][] = useMemo(() => [
    ...courts.map(c => [c.lat, c.lng] as [number, number]),
    ...(userLocation ? [[userLocation.lat, userLocation.lng] as [number, number]] : []),
  ], [courts, userLocation])

  const center: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : points[0] ?? [44.7866, 20.4489] // Beograd centar, fallback

  return (
    <div className="w-full h-52 rounded-2xl overflow-hidden border border-court-border bg-court-card relative">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={false}
        dragging={true}
        zoomControl={false}
        attributionControl={false}
        style={{ width: '100%', height: '100%', background: '#1A1A2E' }}
      >
        {/* Besplatni tamni map tile-ovi (CartoDB Dark Matter) — bez API ključa, bez naplate */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap &copy; CARTO'
        />

        <FitBounds points={points} />

        {courts.map(court => (
          <Marker
            key={court.id}
            position={[court.lat, court.lng]}
            icon={courtIcon(activeCourts.has(court.id))}
            eventHandlers={{ click: () => router.push(`/courts/${court.id}`) }}
          />
        ))}

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon()} />
        )}
      </MapContainer>

      {/* Bottom info overlay */}
      <div
        className="absolute bottom-0 left-0 right-0 px-3.5 pb-3 pt-10 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, rgba(12,12,14,.92))', zIndex: 1000 }}
      >
        <div className="flex items-end justify-between pointer-events-auto">
          <div>
            <p className="text-white text-[13px] font-semibold">
              {activeCount > 0 ? `${activeCount} aktivn${activeCount === 1 ? 'a igra' : 'e igre'} u blizini` : 'Nema aktivnih igara sada'}
            </p>
            <p className="text-court-text2 text-[11px] mt-px">🟠 Igra se · ⚫ Slobodan teren</p>
          </div>
          {userLocation && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${userLocation.lat},${userLocation.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-white/[.09] backdrop-blur-md border border-white/10 rounded-full px-3.5 py-[7px] text-xs font-semibold text-white"
            >
              Otvori u Google Maps
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
