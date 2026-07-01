'use client'

import { ExternalLink } from 'lucide-react'

type Props = {
  lat: number
  lng: number
  name: string
}

export default function CourtMapEmbed({ lat, lng, name }: Props) {
  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  return (
    <div className="relative">
      {apiKey && apiKey !== 'placeholder' ? (
        <iframe
          width="100%"
          height="160"
          style={{ border: 0, borderRadius: 12 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${lat},${lng}&zoom=16&maptype=roadmap`}
        />
      ) : (
        <div className="w-full h-40 rounded-xl bg-[#161618] border border-[rgba(255,255,255,.07)] flex flex-col items-center justify-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-[#333]">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
          <p className="text-[#555] text-xs">{name}</p>
          <p className="text-[#333] text-[10px]">{lat.toFixed(4)}, {lng.toFixed(4)}</p>
        </div>
      )}
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-2 right-2 bg-[#161618]/90 backdrop-blur-sm border border-[rgba(255,255,255,.09)] rounded-lg px-2.5 py-1.5 text-xs text-[#888] flex items-center gap-1.5 hover:text-white transition-colors"
      >
        <ExternalLink className="w-3 h-3" />
        Otvori mapu
      </a>
    </div>
  )
}
