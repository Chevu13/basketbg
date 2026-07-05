import Link from 'next/link'
import { MapPin, Zap } from 'lucide-react'
import type { Court } from '@/types'
import { formatDistance, cn } from '@/lib/utils'

type Props = {
  court: Court
  distance?: number
  /** 'rail' = fixed-width card for horizontal scroll rails (Home).
   *  'row'  = full-width row for vertical lists (Courts listing page). */
  layout?: 'rail' | 'row'
}

function PhotoThumb({ court, size }: { court: Court; size: number }) {
  if (court.image_url) {
    return (
      <img
        src={court.image_url}
        alt={court.name}
        className="w-full h-full object-cover"
        style={{ filter: 'brightness(.85)' }}
      />
    )
  }
  return (
    <div className="court-photo-fallback w-full h-full flex items-center justify-center">
      <svg viewBox="0 0 24 24" fill="none" style={{ width: size, height: size }} className="opacity-20">
        <circle cx="12" cy="12" r="10" stroke="#FF6B00" strokeWidth="1.4" />
        <path d="M12 2C9 5.5 9 18.5 12 22" stroke="#FF6B00" strokeWidth="1.4" fill="none" />
        <path d="M12 2C15 5.5 15 18.5 12 22" stroke="#FF6B00" strokeWidth="1.4" fill="none" />
        <line x1="2.2" y1="12" x2="21.8" y2="12" stroke="#FF6B00" strokeWidth="1.4" />
      </svg>
    </div>
  )
}

export default function CourtCard({ court, distance, layout = 'row' }: Props) {
  if (layout === 'rail') {
    return (
      <Link href={`/courts/${court.id}`}>
        <div
          className="flex-shrink-0 w-[170px] bg-court-card border border-court-border rounded-2xl overflow-hidden transition-colors hover:border-court-border/[.6] active:scale-[0.97]"
          style={{ scrollSnapAlign: 'start' }}
        >
          <div className="h-[86px] relative overflow-hidden bg-court-card2">
            <PhotoThumb court={court} size={32} />
            {distance !== undefined && (
              <span className="absolute top-2 right-2 bg-black/55 backdrop-blur-sm border border-white/10 rounded-full px-2 py-0.5 text-[11px] font-bold text-orange-400">
                {formatDistance(distance)}
              </span>
            )}
            {court.is_following && (
              <span className="absolute top-2 left-2 bg-orange-500/85 backdrop-blur-sm rounded-full px-2 py-0.5 text-[10px] font-bold text-white">
                Pratiš
              </span>
            )}
          </div>
          <div className="p-3">
            <div className="text-[13px] font-semibold text-white leading-[1.3] tracking-tight mb-1 line-clamp-2">
              {court.name}
            </div>
            <div className="text-[11px] text-court-text2 font-medium">
              {court.is_outdoor ? 'Outdoor' : 'Indoor'} · {court.surface}
            </div>
            <div className="flex flex-wrap gap-1 mt-1.5">
              <span className="inline-flex text-[10px] font-medium text-court-text2 bg-court-muted rounded px-1.5 py-0.5">
                🏀 {court.hoops_count} koša
              </span>
              {court.is_outdoor && (
                <span className="inline-flex text-[10px] font-medium text-court-text2 bg-court-muted rounded px-1.5 py-0.5">
                  💡 Osvetljenje
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // 'row' layout — full-width, used on the Courts directory listing
  return (
    <Link href={`/courts/${court.id}`}>
      <div className="bg-court-card border border-court-border rounded-2xl overflow-hidden flex items-center gap-3 pr-4 hover:border-court-border/[.6] transition-all active:scale-[0.99]">
        <div className="w-20 h-20 relative overflow-hidden flex-shrink-0 bg-court-card2">
          <PhotoThumb court={court} size={26} />
        </div>
        <div className="flex-1 min-w-0 py-3">
          <p className="font-semibold text-white text-sm truncate">{court.name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-court-text2 flex-shrink-0" />
            <span className="text-court-text2 text-xs truncate">{court.address}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className={cn(
              'text-[10px] px-2 py-0.5 rounded-full font-medium',
              court.is_outdoor ? 'bg-sky-500/10 text-sky-400' : 'bg-purple-500/10 text-purple-400'
            )}>
              {court.is_outdoor ? 'Otvoreni' : 'Zatvoreni'}
            </span>
            <span className="text-[10px] bg-court-muted text-court-text2 px-2 py-0.5 rounded-full">
              {court.surface}
            </span>
            {!!court.active_gatherings && court.active_gatherings > 0 && (
              <span className="text-[10px] bg-orange-500/15 text-orange-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Zap className="w-2.5 h-2.5" />
                Aktivan
              </span>
            )}
            {court.is_following && (
              <span className="text-[10px] bg-court-muted text-court-text2 px-2 py-0.5 rounded-full">
                🔔 Pratiš
              </span>
            )}
          </div>
        </div>
        {distance !== undefined && (
          <div className="text-right flex-shrink-0">
            <span className="text-orange-500 font-bold text-sm">{formatDistance(distance)}</span>
          </div>
        )}
      </div>
    </Link>
  )
}
