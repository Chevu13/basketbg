'use client'

import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps'
import { ExternalLink } from 'lucide-react'

type Props = {
  lat: number
  lng: number
  name: string
}

export default function CourtMapEmbed({ lat, lng, name }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!
  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`

  return (
    <div className="relative">
      <APIProvider apiKey={apiKey}>
        <div className="w-full h-40 rounded-xl overflow-hidden border border-court-border">
          <Map
            center={{ lat, lng }}
            zoom={16}
            mapId="court-detail-map"
            disableDefaultUI
            gestureHandling="none"
            colorScheme="DARK"
            style={{ width: '100%', height: '100%' }}
          >
            <AdvancedMarker position={{ lat, lng }}>
              <div className="flex flex-col items-center gap-1">
                <div className="bg-orange-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-lg max-w-[120px] truncate">
                  {name}
                </div>
                <div className="w-3 h-3 bg-orange-500 rounded-full shadow-lg shadow-orange-500/50" />
              </div>
            </AdvancedMarker>
          </Map>
        </div>
      </APIProvider>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-2 right-2 bg-court-card/90 backdrop-blur-sm border border-court-border rounded-lg px-2.5 py-1.5 text-xs text-court-text flex items-center gap-1.5 hover:text-white transition-colors"
      >
        <ExternalLink className="w-3 h-3" />
        Otvori mapu
      </a>
    </div>
  )
}
