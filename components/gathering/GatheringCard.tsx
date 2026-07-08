'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MapPin, Check } from 'lucide-react'
import type { Gathering } from '@/types'
import { formatCountdown, minutesUntil, isGatheringEnded, getInitials, formatDistance } from '@/lib/utils'
import PlayerAvatar from '@/components/ui/PlayerAvatar'
import { useAuth } from '@/components/layout/AuthProvider'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

type Props = {
  gathering: Gathering
  onUpdate?: () => void
  /** 'full' shows the hero court photo (home feed). 'compact' omits it
   *  (used on a court's own page, where the photo is already shown above). */
  variant?: 'full' | 'compact'
}


const LEVEL_LABEL: Record<string, string> = {
  jak: '🔥 Napredni',
  srednji: '⭐ Srednji',
  rekreativno: '🏀 Rekreativci',
}

function getBarColor(pct: number) {
  if (pct >= 90) return '#FF3B30'
  if (pct >= 60) return '#FF6B00'
  return '#34C759'
}

function getFillLabel(count: number, max: number | null): string {
  if (!max) return `${count} potvrđenih`
  const left = max - count
  if (left <= 0) return 'Popunjeno'
  if (left === 1) return 'Nedostaje još 1 igrač!'
  if (left <= 3) return `Nedostaju još ${left} igrača!`
  return `Tražimo još ${left} igrača`
}

function LivePip({ size = 7 }: { size?: number }) {
  return (
    <span
      className="relative inline-block rounded-full bg-green-500 flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <span
        className="absolute rounded-full bg-green-500/25 animate-live-pip"
        style={{ inset: -size / 1.75 }}
      />
    </span>
  )
}

function StatusBadge({ gathering, onPhoto }: { gathering: Gathering; onPhoto?: boolean }) {
  const diffMin = minutesUntil(gathering.gathering_time)
  const max = gathering.max_players ?? 10
  const pct = ((gathering.attendees_count ?? 0) / max) * 100
  const base = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold'

  if (isGatheringEnded(gathering.gathering_time)) {
    return (
      <span className={cn(base, onPhoto ? 'bg-black/40 border border-white/15 text-white/70 backdrop-blur-sm' : 'bg-court-muted border border-court-border text-court-text2')}>
        Završeno
      </span>
    )
  }
  if (pct >= 100) {
    return (
      <span className={cn(base, onPhoto ? 'bg-red-500/30 border border-red-500/45 text-red-200 backdrop-blur-sm' : 'bg-red-500/15 border border-red-500/30 text-red-400')}>
        FULL
      </span>
    )
  }
  if (diffMin <= 0) {
    return (
      <span className={cn(base, onPhoto ? 'bg-green-500/25 border border-green-500/40 text-green-200 backdrop-blur-sm' : 'bg-green-500/15 border border-green-500/30 text-green-400')}>
        <LivePip /> Igra se
      </span>
    )
  }
  if (diffMin <= 30) {
    return (
      <span className={cn(base, onPhoto ? 'bg-orange-500/30 border border-orange-500/45 text-orange-100 backdrop-blur-sm' : 'bg-orange-500/15 border border-orange-500/30 text-orange-400')}>
        Za {diffMin} min
      </span>
    )
  }
  return (
    <span className={cn(base, onPhoto ? 'bg-white/12 border border-white/18 text-white backdrop-blur-sm' : 'bg-court-muted border border-court-border text-court-text')}>
      {new Date(gathering.gathering_time).toLocaleTimeString('sr-Latn', { hour: '2-digit', minute: '2-digit' })}
    </span>
  )
}

function CourtPhotoFallback({ name }: { name: string }) {
  return (
    <div className="court-photo-fallback w-full h-full flex items-center justify-center">
      <svg viewBox="0 0 24 24" fill="none" className="w-14 h-14 opacity-[0.18]">
        <circle cx="12" cy="12" r="10" stroke="#FF6B00" strokeWidth="1.4" />
        <path d="M12 2C9 5.5 9 18.5 12 22" stroke="#FF6B00" strokeWidth="1.4" fill="none" />
        <path d="M12 2C15 5.5 15 18.5 12 22" stroke="#FF6B00" strokeWidth="1.4" fill="none" />
        <line x1="2.2" y1="12" x2="21.8" y2="12" stroke="#FF6B00" strokeWidth="1.4" />
      </svg>
    </div>
  )
}

export default function GatheringCard({ gathering, onUpdate, variant = 'full' }: Props) {
  const router = useRouter()
  const goToOrganizer = (e: React.MouseEvent, username?: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (username) router.push(`/players/${username}`)
  }
  const { user } = useAuth()
  const [attending, setAttending] = useState(gathering.is_attending ?? false)
  const [count, setCount] = useState(gathering.attendees_count ?? 0)
  const [loading, setLoading] = useState(false)
  const [showAttendees, setShowAttendees] = useState(false)

  const max = gathering.max_players ?? 10
  const pct = Math.min(100, (count / max) * 100)
  const isFull = pct >= 100
  const barColor = getBarColor(pct)
  const fillLabel = getFillLabel(count, gathering.max_players)
  const court = gathering.court
  const creator = gathering.creator
  const attendees = (gathering.attendees ?? []).filter(a => a.status === 'dolazim')
  const diffMin = minutesUntil(gathering.gathering_time)
  const isLive = diffMin <= 0
  const isSoon = diffMin > 0 && diffMin <= 30
  const isEnded = isGatheringEnded(gathering.gathering_time)
  const isNearlyFull = pct >= 70 && !isFull

  const handleAttend = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!user) { window.location.href = '/auth/login'; return }
    setLoading(true)
    try {
      if (attending) {
        const res = await fetch(`/api/gatherings/${gathering.id}/attend`, { method: 'DELETE' })
        if (!res.ok) throw new Error()
        setAttending(false)
        setCount(c => Math.max(0, c - 1))
        toast.success('Odjavio si se')
      } else {
        const res = await fetch(`/api/gatherings/${gathering.id}/attend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'dolazim' }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || 'attend-failed')
        }
        setAttending(true)
        setCount(c => c + 1)
        toast.success('Prijavljen si! 🏀')
        if (navigator.vibrate) navigator.vibrate(10)
      }
      onUpdate?.()
    } catch (err: any) {
      toast.error(err?.message && err.message !== 'attend-failed' ? err.message : 'Greška, pokušaj ponovo')
    } finally {
      setLoading(false)
    }
  }

  const endTime = new Date(gathering.gathering_time)
  endTime.setHours(endTime.getHours() + 2)
  const timeRange = `${new Date(gathering.gathering_time).toLocaleTimeString('sr-Latn', { hour: '2-digit', minute: '2-digit' })}–${endTime.toLocaleTimeString('sr-Latn', { hour: '2-digit', minute: '2-digit' })}`

  return (
    <>
    <Link href={`/courts/${gathering.court_id}?gathering=${gathering.id}`}>
      <div
        className={cn(
          'bg-court-card border rounded-[20px] overflow-hidden transition-all duration-150 active:scale-[0.983]',
          isNearlyFull && !isFull && 'border-orange-500/28 shadow-[0_0_0_1px_rgba(255,107,0,.1),0_8px_32px_rgba(255,107,0,.1)]',
          isLive && !isNearlyFull && 'border-green-500/20',
          !isNearlyFull && !isLive && 'border-court-border hover:border-court-border/[.9]',
          isFull && 'opacity-60'
        )}
      >
        {/* Hero photo (full variant only) */}
        {variant === 'full' && (
          <div className="h-[186px] relative overflow-hidden bg-court-card2">
            {court?.image_url ? (
              <img
                src={court.image_url}
                alt={court.name}
                className="w-full h-full object-cover"
                style={{ filter: isFull ? 'brightness(.5) saturate(.5)' : 'brightness(.82) saturate(1.08)' }}
              />
            ) : (
              <CourtPhotoFallback name={court?.name ?? 'Teren'} />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/[.08] to-black/[.88]" style={{ backgroundImage: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.08) 30%, rgba(0,0,0,.55) 68%, rgba(0,0,0,.88) 100%)' }} />
            <div className="absolute top-3 left-3.5">
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white/90 bg-black/50 border border-white/15 backdrop-blur-sm">
                <MapPin className="w-2.5 h-2.5 opacity-80" />
                {gathering.distance !== undefined ? formatDistance(gathering.distance) : court?.address?.split(',')[0]}
              </span>
            </div>
            <div className="absolute top-3 right-3.5">
              <StatusBadge gathering={{ ...gathering, attendees_count: count }} onPhoto />
            </div>
            <div className="absolute bottom-0 left-3.5 right-3.5 pb-3.5">
              <div className="font-display font-black text-[22px] text-white leading-[1.05] tracking-tight" style={{ textShadow: '0 1px 12px rgba(0,0,0,.6)' }}>
                {court?.name ?? 'Teren'}
              </div>
              <div className="text-xs text-white/60 font-medium mt-0.5">
                Organizator:{' '}
                <span
                  onClick={(e) => goToOrganizer(e, creator?.username)}
                  className="hover:underline hover:text-white/90"
                >
                  {creator?.full_name || creator?.username || 'Nepoznat'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="p-4">
          {/* Compact header (only when no photo shown) */}
          {variant === 'compact' && (
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm leading-snug line-clamp-1">{gathering.title}</p>
                <p className="text-court-text text-xs mt-0.5">
                  Organizator:{' '}
                  <span onClick={(e) => goToOrganizer(e, creator?.username)} className="hover:underline hover:text-white">
                    {creator?.full_name || creator?.username || 'Nepoznat'}
                  </span>
                </p>
              </div>
              <StatusBadge gathering={{ ...gathering, attendees_count: count }} />
            </div>
          )}

          {/* Detail badges */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="inline-flex items-center gap-1 bg-court-card2 border border-court-border rounded-md px-2 py-1 text-[11px] font-medium text-court-text">
              ⏱ {timeRange}
            </span>
            <span className={cn(
              'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium border',
              (gathering.game_type === '3x3' || gathering.game_type === '3na3')
                ? 'bg-sky-400/10 border-sky-400/25 text-sky-300'
                : 'bg-court-card2 border-court-border text-court-text'
            )}>
              {gathering.game_type === 'slobodan' ? 'Slobodno' : gathering.game_type === '3na3' ? '3 na 3' : (gathering.game_type ?? '5x5')}
            </span>
            {gathering.level && (
              <span className="inline-flex items-center gap-1 bg-court-card2 border border-court-border rounded-md px-2 py-1 text-[11px] font-medium text-court-text">
                {LEVEL_LABEL[gathering.level] ?? gathering.level}
              </span>
            )}
          </div>

          {/* Player count + fill bar */}
          <div className="flex items-end gap-0 mb-3">
            <div className="flex items-baseline gap-0.5">
              <span className="font-display font-black text-[42px] leading-none tracking-tight text-white">{count}</span>
              <span className="font-display font-semibold text-xl text-court-text2">/{max}</span>
            </div>
            <span className="text-xs text-court-text2 font-medium ml-2 mb-1.5">igrača</span>
            <div className="flex-1 pb-2 pl-3.5">
              <div className="h-1 bg-court-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-700 ease-out"
                  style={{ width: `${pct}%`, background: barColor }}
                />
              </div>
              <div className={cn('text-[11px] mt-1.5', pct >= 90 ? 'text-red-400 font-bold' : pct >= 70 ? 'text-orange-500 font-semibold' : 'text-court-text2')}>
                {fillLabel}
              </div>
            </div>
          </div>

          {/* Avatars + court type */}
          <div className="flex items-center justify-between gap-2.5 mb-3">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (attendees.length > 0) setShowAttendees(true)
              }}
              className="flex items-center"
              disabled={attendees.length === 0}
            >
              {attendees.slice(0, 4).map((a, i) => (
                <div key={a.user_id ?? i} style={{ marginLeft: i === 0 ? 0 : -8, zIndex: 4 - i, position: 'relative' }}>
                  <PlayerAvatar
                    url={a.profile?.avatar_url}
                    fullName={a.profile?.full_name}
                    username={a.profile?.username}
                    size={28}
                    colorSeed={i}
                    ring
                  />
                </div>
              ))}
              {attendees.length > 4 && (
                <div className="w-7 h-7 rounded-full bg-court-muted border-[2.5px] border-court-card flex items-center justify-center text-[9px] font-semibold text-court-text2 flex-shrink-0" style={{ marginLeft: -8 }}>
                  +{attendees.length - 4}
                </div>
              )}
              {attendees.length === 0 && (
                <span className="text-court-text2 text-xs">Budi prvi</span>
              )}
            </button>
            {court && (
              <span className="inline-flex items-center bg-court-card2 border border-court-border rounded-md px-2 py-1 text-[11px] font-medium text-court-text">
                {court.is_outdoor ? 'Outdoor' : 'Indoor'}
              </span>
            )}
          </div>

          {/* Footer CTA */}
          <div className="pt-3 border-t border-court-border flex items-center justify-between gap-2.5">
            <div className="text-[13px] text-court-text font-medium leading-tight">
              <strong className={cn('block font-semibold', isEnded ? 'text-court-text2' : isLive ? 'text-green-500' : isSoon ? 'text-orange-500' : 'text-white')}>
                {isEnded ? 'Završeno' : isLive ? 'Igra u toku' : isSoon ? `${new Date(gathering.gathering_time).toLocaleTimeString('sr-Latn', { hour: '2-digit', minute: '2-digit' })} — žuri!` : new Date(gathering.gathering_time).toLocaleTimeString('sr-Latn', { hour: '2-digit', minute: '2-digit' })}
              </strong>
              {isEnded ? 'Igra je gotova' : formatCountdown(gathering.gathering_time)}
            </div>
            {isEnded ? (
              <div className="flex-shrink-0 bg-court-card2 text-court-text2 text-sm font-medium py-2.5 px-3.5 rounded-[10px]">
                Završeno
              </div>
            ) : isFull ? (
              <div className="flex-shrink-0 bg-court-card2 text-court-text2 text-sm font-medium py-2.5 px-3.5 rounded-[10px]">
                Popunjeno
              </div>
            ) : attending ? (
              <button
                onClick={handleAttend}
                disabled={loading}
                className="flex-shrink-0 inline-flex items-center gap-1.5 bg-court-card2 text-green-500 border border-green-500/25 text-sm font-semibold py-2.5 px-4 rounded-[10px] transition-all disabled:opacity-50 active:scale-95"
              >
                <Check className="w-3.5 h-3.5" />
                Idem
              </button>
            ) : (
              <button
                onClick={handleAttend}
                disabled={loading}
                className="flex-shrink-0 inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold py-2.5 px-5 rounded-[10px] transition-all disabled:opacity-50 active:scale-95"
                style={{ boxShadow: '0 3px 14px rgba(255,107,0,.28)' }}
              >
                {isLive ? 'Pridruži se' : 'Dolazim'}
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>

    {showAttendees && (
      <div
        className="fixed inset-0 z-[2000] bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAttendees(false) }}
      >
        <div
          className="bg-court-card border border-court-border rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm max-h-[70vh] overflow-y-auto p-5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-black text-lg text-white uppercase">
              Potvrđeni igrači ({attendees.length})
            </h3>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAttendees(false) }}
              className="w-8 h-8 rounded-full bg-court-card2 flex items-center justify-center text-court-text hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="flex flex-col gap-1">
            {attendees.map((a, i) => (
              <Link
                key={a.user_id ?? i}
                href={a.profile?.username ? `/players/${a.profile.username}` : '#'}
                onClick={(e) => { e.stopPropagation(); if (!a.profile?.username) e.preventDefault() }}
                className="flex items-center gap-3 py-2 -mx-1 px-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <PlayerAvatar
                  url={a.profile?.avatar_url}
                  fullName={a.profile?.full_name}
                  username={a.profile?.username}
                  size={40}
                  colorSeed={i}
                />
                <span className="text-white text-sm font-medium">
                  {a.profile?.full_name || a.profile?.username || 'Igrač'}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    )}
    </>
  )
}