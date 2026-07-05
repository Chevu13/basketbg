'use client'

import { useRouter } from 'next/navigation'
import type { Court, Gathering } from '@/types'
import { projectToPercent } from '@/lib/utils'

type Props = {
  courts: Court[]
  gatherings: Gathering[]
  userLocation: { lat: number; lng: number } | null
}

export default function HomeMap({ courts, gatherings, userLocation }: Props) {
  const router = useRouter()
  const activeCourts = new Set(gatherings.map(g => g.court_id))

  // Compute a bounding box from every point that needs to appear on the map
  // (all courts + the user's own location), then project each real lat/lng
  // onto a 0–100% canvas. This keeps relative positions truthful instead of
  // using arbitrary fixed coordinates that don't reflect real geography.
  const points = [
    ...courts.map(c => ({ lat: c.lat, lng: c.lng })),
    ...(userLocation ? [userLocation] : []),
  ]
  const bounds = points.length
    ? {
        minLat: Math.min(...points.map(p => p.lat)),
        maxLat: Math.max(...points.map(p => p.lat)),
        minLng: Math.min(...points.map(p => p.lng)),
        maxLng: Math.max(...points.map(p => p.lng)),
      }
    : { minLat: 44.75, maxLat: 44.85, minLng: 20.35, maxLng: 20.55 }

  const activeCount = courts.filter(c => activeCourts.has(c.id)).length

  return (
    <div className="w-full h-52 rounded-2xl overflow-hidden border border-court-border bg-court-card relative">
      {/* Stylized dark map background (in-house SVG, no external map tiles) */}
      <svg viewBox="0 0 430 208" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <rect width="430" height="208" fill="#1A1A2E" />
        <path d="M0 155 Q60 148 120 158 Q180 170 240 162 Q300 154 360 164 Q400 172 430 158 L430 208 L0 208Z" fill="#0D1B2A" opacity=".9" />
        <path d="M0 145 Q70 137 120 150 Q180 164 240 156 Q300 148 360 160 Q410 170 430 152" stroke="#122030" strokeWidth="20" fill="none" />
        <ellipse cx="108" cy="88" rx="32" ry="22" fill="#14231A" />
        <ellipse cx="268" cy="82" rx="24" ry="16" fill="#14231A" />
        <path d="M178 35 Q210 22 238 38 Q226 64 196 68 Q170 60 178 35Z" fill="#14231A" />
        <line x1="0" y1="100" x2="430" y2="100" stroke="#252540" strokeWidth="3.5" />
        <line x1="215" y1="0" x2="215" y2="208" stroke="#252540" strokeWidth="3.5" />
        <line x1="0" y1="58" x2="430" y2="74" stroke="#1E1E34" strokeWidth="2" />
        <line x1="82" y1="0" x2="108" y2="208" stroke="#1E1E34" strokeWidth="2" />
        <line x1="322" y1="0" x2="344" y2="208" stroke="#1E1E34" strokeWidth="2" />
        <line x1="0" y1="78" x2="430" y2="78" stroke="#1C1C30" strokeWidth="1" />
        <line x1="0" y1="120" x2="430" y2="120" stroke="#1C1C30" strokeWidth="1" />
        <rect x="118" y="70" width="16" height="11" rx="1.5" fill="#1E1E34" />
        <rect x="152" y="68" width="18" height="13" rx="1.5" fill="#1E1E34" />
        <rect x="232" y="62" width="14" height="10" rx="1.5" fill="#1E1E34" />
        <rect x="297" y="75" width="16" height="12" rx="1.5" fill="#1E1E34" />
        <rect x="142" y="112" width="20" height="13" rx="1.5" fill="#1E1E34" />
        <rect x="262" y="112" width="18" height="13" rx="1.5" fill="#1E1E34" />
      </svg>

      {/* Court pins — real positions derived from actual lat/lng */}
      {courts.map(court => {
        const hasActive = activeCourts.has(court.id)
        const { top, left } = projectToPercent(court.lat, court.lng, bounds)
        return (
          <button
            key={court.id}
            onClick={() => router.push(`/courts/${court.id}`)}
            style={{ position: 'absolute', top: `${top}%`, left: `${left}%`, transform: 'translate(-50%,-100%)', zIndex: 2 }}
            title={court.name}
            aria-label={court.name}
          >
            {hasActive ? (
              <div className="relative">
                <div className="absolute w-8 h-8 rounded-full bg-orange-500/[.18] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-map-pulse" />
                <div className="w-3.5 h-3.5 bg-orange-500 rounded-full relative z-[1]" style={{ boxShadow: '0 0 0 3px rgba(255,107,0,.25), 0 2px 8px rgba(255,107,0,.4)' }} />
              </div>
            ) : (
              <div className="w-2.5 h-2.5 bg-court-muted border-[1.5px] border-white/18 rounded-full" />
            )}
          </button>
        )
      })}

      {/* User location */}
      {userLocation && (() => {
        const { top, left } = projectToPercent(userLocation.lat, userLocation.lng, bounds)
        return (
          <div style={{ position: 'absolute', top: `${top}%`, left: `${left}%`, transform: 'translate(-50%,-50%)', zIndex: 3 }}>
            <div className="w-3.5 h-3.5 bg-blue-500 rounded-full border-[2.5px] border-white" style={{ boxShadow: '0 0 0 5px rgba(10,132,255,.18)' }} />
          </div>
        )
      })()}

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 px-3.5 pb-3 pt-10" style={{ background: 'linear-gradient(to bottom, transparent, rgba(12,12,14,.92))' }}>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-white text-[13px] font-semibold">
              {activeCount > 0 ? `${activeCount} aktivn${activeCount === 1 ? 'a igra' : 'e igre'} u blizini` : 'Nema aktivnih igara sada'}
            </p>
            <p className="text-court-text2 text-[11px] mt-px">🟠 Igra se · ⚫ Slobodan teren</p>
          </div>
          <a
            href="https://www.google.com/maps/search/basketball+court+belgrade"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-white/[.09] backdrop-blur-md border border-white/10 rounded-full px-3.5 py-[7px] text-xs font-semibold text-white"
          >
            Otvori
          </a>
        </div>
      </div>
    </div>
  )
}
