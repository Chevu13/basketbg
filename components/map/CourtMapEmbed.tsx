'use client'

import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ExternalLink } from 'lucide-react'

type Props = {
  lat: number
  lng: number
  name: string
}

function pinIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:28px;height:28px;">
             <div style="position:absolute;inset:0;border-radius:9999px;background:rgba(255,107,0,.18);"></div>
             <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:14px;height:14px;border-radius:9999px;background:#FF6B00;box-shadow:0 0 0 3px rgba(255,107,0,.25),0 2px 8px rgba(255,107,0,.4);"></div>
           </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

export default function CourtMapEmbed({ lat, lng, name }: Props) {
  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`

  return (
    <div className="relative rounded-xl overflow-hidden border border-court-border" style={{ height: 160 }}>
      <MapContainer
        center={[lat, lng]}
        zoom={16}
        scrollWheelZoom={false}
        zoomControl={true}
        attributionControl={false}
        style={{ width: '100%', height: '100%', background: '#1A1A2E' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap &copy; CARTO'
        />
        <Marker position={[lat, lng]} icon={pinIcon()} />
      </MapContainer>

      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-2 right-2 z-[1000] bg-[#161618]/90 backdrop-blur-sm border border-[rgba(255,255,255,.09)] rounded-lg px-2.5 py-1.5 text-xs text-[#888] flex items-center gap-1.5 hover:text-white transition-colors"
      >
        <ExternalLink className="w-3 h-3" />
        Otvori mapu
      </a>
    </div>
  )
}
