'use client'

import { useRouter } from 'next/navigation'
import type { Court, Gathering } from '@/types'

type Props = {
  courts: Court[]
  gatherings: Gathering[]
  userLocation: { lat: number; lng: number } | null
}

export default function HomeMap({ courts, gatherings, userLocation }: Props) {
  const router = useRouter()
  const activeCourts = new Set(gatherings.map((g) => g.court_id))

  const POSITIONS = [
    { top: '42%', left: '37%' }, { top: '55%', left: '62%' },
    { top: '36%', left: '74%' }, { top: '65%', left: '28%' },
    { top: '30%', left: '54%' },
  ]

  return (
    <div className="w-full h-52 rounded-2xl overflow-hidden border border-[rgba(255,255,255,.07)] bg-[#161618] relative">
      {/* Dark map SVG background */}
      <svg viewBox="0 0 430 208" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <rect width="430" height="208" fill="#1A1A2E"/>
        <path d="M0 155 Q60 148 120 158 Q180 170 240 162 Q300 154 360 164 Q400 172 430 158 L430 208 L0 208Z" fill="#0D1B2A" opacity=".9"/>
        <path d="M0 145 Q70 137 120 150 Q180 164 240 156 Q300 148 360 160 Q410 170 430 152" stroke="#122030" strokeWidth="20" fill="none"/>
        <ellipse cx="108" cy="88" rx="32" ry="22" fill="#14231A"/>
        <ellipse cx="268" cy="82" rx="24" ry="16" fill="#14231A"/>
        <path d="M178 35 Q210 22 238 38 Q226 64 196 68 Q170 60 178 35Z" fill="#14231A"/>
        <line x1="0" y1="100" x2="430" y2="100" stroke="#252540" strokeWidth="3.5"/>
        <line x1="215" y1="0" x2="215" y2="208" stroke="#252540" strokeWidth="3.5"/>
        <line x1="0" y1="58" x2="430" y2="74" stroke="#1E1E34" strokeWidth="2"/>
        <line x1="82" y1="0" x2="108" y2="208" stroke="#1E1E34" strokeWidth="2"/>
        <line x1="322" y1="0" x2="344" y2="208" stroke="#1E1E34" strokeWidth="2"/>
        <line x1="0" y1="78" x2="430" y2="78" stroke="#1C1C30" strokeWidth="1"/>
        <line x1="0" y1="120" x2="430" y2="120" stroke="#1C1C30" strokeWidth="1"/>
        <rect x="118" y="70" width="16" height="11" rx="1.5" fill="#1E1E34"/>
        <rect x="152" y="68" width="18" height="13" rx="1.5" fill="#1E1E34"/>
        <rect x="232" y="62" width="14" height="10" rx="1.5" fill="#1E1E34"/>
        <rect x="297" y="75" width="16" height="12" rx="1.5" fill="#1E1E34"/>
        <rect x="142" y="112" width="20" height="13" rx="1.5" fill="#1E1E34"/>
        <rect x="262" y="112" width="18" height="13" rx="1.5" fill="#1E1E34"/>
      </svg>

      {/* Court pins */}
      {courts.map((court, i) => {
        const hasActive = activeCourts.has(court.id)
        const pos = POSITIONS[i % POSITIONS.length]
        return (
          <button
            key={court.id}
            onClick={() => router.push(`/courts/${court.id}`)}
            style={{ position: 'absolute', top: pos.top, left: pos.left, transform: 'translate(-50%,-100%)', zIndex: 2 }}
            title={court.name}
          >
            {hasActive ? (
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,107,0,.18)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', animation: 'pulse 2s ease-in-out infinite' }} />
                <div style={{ width: 14, height: 14, background: '#FF6B00', borderRadius: '50%', boxShadow: '0 0 0 3px rgba(255,107,0,.25), 0 2px 8px rgba(255,107,0,.4)', position: 'relative', zIndex: 1 }} />
              </div>
            ) : (
              <div style={{ width: 10, height: 10, background: '#242428', border: '1.5px solid rgba(255,255,255,.18)', borderRadius: '50%' }} />
            )}
          </button>
        )
      })}

      {/* User location */}
      {userLocation && (
        <div style={{ position: 'absolute', top: '48%', left: '48%', transform: 'translate(-50%,-50%)', zIndex: 3 }}>
          <div style={{ width: 14, height: 14, background: '#0A84FF', borderRadius: '50%', border: '2.5px solid #fff', boxShadow: '0 0 0 5px rgba(10,132,255,.18)' }} />
        </div>
      )}

      {/* Bottom info */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '40px 14px 12px', background: 'linear-gradient(to bottom, transparent, rgba(12,12,14,.92))' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>
              {courts.filter(c => activeCourts.has(c.id)).length} aktivne igre u blizini
            </p>
            <p style={{ color: '#555', fontSize: 11, marginTop: 1 }}>🟠 Večeras igra · ⚫ Slobodan teren</p>
          </div>
          <a
            href={`https://www.google.com/maps/search/basketball+court/@44.8125,20.4731,13z`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,.09)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 100, padding: '7px 13px', fontSize: 12, fontWeight: 600, color: '#fff', textDecoration: 'none' }}
          >
            Otvori
          </a>
        </div>
      </div>
    </div>
  )
}
