'use client'

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

type Props = {
  lat: number | null
  lng: number | null
  onChange: (lat: number, lng: number) => void
}

function pinIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:30px;height:42px;transform:translateY(-21px);">
             <svg width="30" height="42" viewBox="0 0 30 42" fill="none">
               <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 27 15 27s15-16.5 15-27C30 6.7 23.3 0 15 0z" fill="#FF6B00"/>
               <circle cx="15" cy="15" r="6" fill="white"/>
             </svg>
           </div>`,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
  })
}

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

// Beograd centar — fallback kad još nema izabrane tačke
const BG_CENTER: [number, number] = [44.7866, 20.4489]

export default function LocationPicker({ lat, lng, onChange }: Props) {
  const hasPoint = lat !== null && lng !== null && !Number.isNaN(lat) && !Number.isNaN(lng)
  const center: [number, number] = hasPoint ? [lat!, lng!] : BG_CENTER

  return (
    <div className="flex flex-col gap-1.5">
      <div className="rounded-xl overflow-hidden border border-court-border isolate" style={{ height: 220 }}>
        <MapContainer
          center={center}
          zoom={hasPoint ? 16 : 12}
          scrollWheelZoom={true}
          zoomControl={true}
          attributionControl={false}
          style={{ width: '100%', height: '100%', background: '#1A1A2E' }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap &copy; CARTO'
          />
          <ClickHandler onPick={onChange} />
          {hasPoint && (
            <Marker
              position={[lat!, lng!]}
              icon={pinIcon()}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target as L.Marker
                  const pos = marker.getLatLng()
                  onChange(pos.lat, pos.lng)
                },
              }}
            />
          )}
        </MapContainer>
      </div>
      <p className="text-court-text2 text-[11px]">
        Klikni na tačno mesto terena na mapi (ili prevuci pin da doteraš) —
        {hasPoint ? ` ${lat!.toFixed(5)}, ${lng!.toFixed(5)}` : ' još nije izabrana lokacija'}
      </p>
    </div>
  )
}
