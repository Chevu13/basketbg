'use client'

import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps'
import { useRouter } from 'next/navigation'
import type { Court, Gathering } from '@/types'

type Props = {
  courts: Court[]
  gatherings: Gathering[]
  userLocation: { lat: number; lng: number } | null
}

const BELGRADE_CENTER = { lat: 44.8125, lng: 20.4731 }

export default function HomeMap({ courts, gatherings, userLocation }: Props) {
  const router = useRouter()
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!

  const activeCourts = new Set(gatherings.map((g) => g.court_id))

  return (
    <APIProvider apiKey={apiKey}>
      <div className="w-full h-52 rounded-2xl overflow-hidden border border-court-border">
        <Map
          defaultCenter={userLocation ?? BELGRADE_CENTER}
          defaultZoom={12}
          mapId="basketbg-map"
          disableDefaultUI
          gestureHandling="greedy"
          colorScheme="DARK"
          style={{ width: '100%', height: '100%' }}
        >
          {/* User location marker */}
          {userLocation && (
            <AdvancedMarker position={userLocation}>
              <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg shadow-blue-500/50" />
            </AdvancedMarker>
          )}

          {/* Court markers */}
          {courts.map((court) => {
            const hasActive = activeCourts.has(court.id)
            return (
              <AdvancedMarker
                key={court.id}
                position={{ lat: court.lat, lng: court.lng }}
                onClick={() => router.push(`/courts/${court.id}`)}
              >
                {hasActive ? (
                  <div className="flex flex-col items-center gap-0.5 cursor-pointer">
                    <div className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-lg shadow-orange-500/40 animate-bounce-subtle">
                      🏀 IGRA SE
                    </div>
                    <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" />
                  </div>
                ) : (
                  <Pin
                    background="#1E1E1E"
                    borderColor="#F97316"
                    glyphColor="#F97316"
                    scale={0.9}
                  />
                )}
              </AdvancedMarker>
            )
          })}
        </Map>
      </div>
    </APIProvider>
  )
}
