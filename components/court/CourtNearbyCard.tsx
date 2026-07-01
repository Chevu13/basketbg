import Link from 'next/link'
import { MapPin, Zap } from 'lucide-react'
import type { Court } from '@/types'
import { cn } from '@/lib/utils'

type Props = {
  court: Court
  distance?: number
}

export default function CourtNearbyCard({ court, distance }: Props) {
  return (
    <Link href={`/courts/${court.id}`}>
      <div className="card-dark p-4 flex items-center gap-3 hover:border-orange-500/30 transition-all duration-200 active:scale-[0.99]">
        {/* Icon */}
        <div className="w-12 h-12 bg-court-muted rounded-xl flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-orange-500">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M12 2 C7 6, 7 18, 12 22" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M12 2 C17 6, 17 18, 12 22" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M2 12 L22 12" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm truncate">{court.name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-court-text flex-shrink-0" />
            <span className="text-court-text text-xs truncate">{court.address}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn(
              'text-[10px] px-2 py-0.5 rounded-full font-medium',
              court.is_outdoor
                ? 'bg-sky-500/10 text-sky-400'
                : 'bg-purple-500/10 text-purple-400'
            )}>
              {court.is_outdoor ? 'Otvoreni' : 'Zatvoreni'}
            </span>
            <span className="text-[10px] bg-court-muted text-court-text px-2 py-0.5 rounded-full">
              {court.surface}
            </span>
            {court.active_gatherings && court.active_gatherings > 0 && (
              <span className="text-[10px] bg-orange-500/15 text-orange-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Zap className="w-2.5 h-2.5" />
                Aktivan
              </span>
            )}
          </div>
        </div>

        {/* Distance */}
        {distance !== undefined && (
          <div className="text-right flex-shrink-0">
            <span className="text-orange-500 font-bold text-sm">
              {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}
