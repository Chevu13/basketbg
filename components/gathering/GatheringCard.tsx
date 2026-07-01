'use client'

import Link from 'next/link'
import { Users, Clock, MapPin, Check } from 'lucide-react'
import type { Gathering } from '@/types'
import { formatGatheringTime, formatRelativeTime } from '@/lib/utils'
import { useAuth } from '@/components/layout/AuthProvider'
import { createClient } from '@/lib/supabase'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

type Props = {
  gathering: Gathering
  onUpdate?: () => void
  showCourt?: boolean
}

export default function GatheringCard({ gathering, onUpdate, showCourt = true }: Props) {
  const { user } = useAuth()
  const [attending, setAttending] = useState(gathering.is_attending ?? false)
  const [count, setCount] = useState(gathering.attendees_count ?? 0)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleAttend = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error('Moraš biti prijavljen da bi kliknuo Dolazim')
      return
    }
    setLoading(true)
    if (attending) {
      await supabase
        .from('gathering_attendees')
        .delete()
        .eq('gathering_id', gathering.id)
        .eq('user_id', user.id)
      setAttending(false)
      setCount((c) => Math.max(0, c - 1))
      toast.success('Uklonjen si sa spiska')
    } else {
      const { error } = await supabase.from('gathering_attendees').upsert({
        gathering_id: gathering.id,
        user_id: user.id,
        status: 'dolazim',
      })
      if (!error) {
        setAttending(true)
        setCount((c) => c + 1)
        toast.success('Super! Vidimo se na terenu 🏀')
      }
    }
    setLoading(false)
    onUpdate?.()
  }

  const gatheringTime = new Date(gathering.gathering_time)
  const isPast = gatheringTime < new Date()

  return (
    <Link href={`/courts/${gathering.court_id}?gathering=${gathering.id}`}>
      <div className="card-dark p-4 hover:border-orange-500/30 transition-all duration-200 active:scale-[0.99]">
        <div className="flex items-start gap-3">
          {/* Time block */}
          <div className="flex-shrink-0 w-14 h-14 bg-orange-500/10 border border-orange-500/20 rounded-xl flex flex-col items-center justify-center">
            <span className="font-display font-black text-orange-500 text-lg leading-none">
              {new Date(gathering.gathering_time).toLocaleTimeString('sr', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-[10px] text-orange-500/70 font-medium uppercase tracking-wide">
              {new Date(gathering.gathering_time).toLocaleDateString('sr', { weekday: 'short' })}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm leading-snug line-clamp-2">
              {gathering.title}
            </p>
            {showCourt && gathering.court && (
              <div className="flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3 text-court-text flex-shrink-0" />
                <span className="text-court-text text-xs truncate">{gathering.court.name}</span>
              </div>
            )}
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 text-court-text" />
                <span className="text-court-text text-xs">
                  <span className="text-white font-semibold">{count}</span> dolaze
                </span>
              </div>
              {gathering.max_players && (
                <span className="text-court-text text-xs">
                  / {gathering.max_players} max
                </span>
              )}
              <span className="text-court-text text-xs ml-auto">
                {formatRelativeTime(gathering.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Attend button */}
        {!isPast && (
          <button
            onClick={handleAttend}
            disabled={loading}
            className={cn(
              'mt-3 w-full py-2.5 rounded-xl text-sm font-bold uppercase tracking-wide transition-all duration-150 active:scale-95',
              attending
                ? 'bg-green-500/15 border border-green-500/30 text-green-400 flex items-center justify-center gap-2'
                : 'bg-orange-500/10 border border-orange-500/30 text-orange-500 hover:bg-orange-500 hover:text-white'
            )}
          >
            {attending ? (
              <>
                <Check className="w-4 h-4" />
                Dolazim ✓
              </>
            ) : (
              'Dolazim'
            )}
          </button>
        )}
      </div>
    </Link>
  )
}
