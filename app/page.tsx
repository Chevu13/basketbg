'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import type { Gathering, Court } from '@/types'
import { getDistanceKm } from '@/lib/utils'
import Link from 'next/link'

// ─── Court photos (real Belgrade courts, base64-embedded for Netlify/Vercel) ───
// In production replace with Supabase Storage URLs from courts.image_url
const COURT_IMAGES: Record<string, string> = {
  default: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80',
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('sr-Latn', { hour: '2-digit', minute: '2-digit' })
}
function fmtCountdown(iso: string): string {
  const diff = Math.round((new Date(iso).getTime() - Date.now()) / 60000)
  if (diff <= 0) return 'Igra u toku'
  if (diff < 60) return `Za ${diff} min`
  const h = Math.floor(diff / 60), m = diff % 60
  return `Za ${h}h ${m > 0 ? m + 'min' : ''}`
}
function plural(n: number) {
  if (n === 1) return '1 igrač'
  if (n < 5) return `${n} igrača`
  return `${n} igrača`
}
function getInitials(username: string) {
  return username?.slice(0, 2).toUpperCase() ?? '??'
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

const AVATAR_COLORS = ['#2C6BED','#6E40C9','#E6474A','#0E9E71','#B05A11','#7A6500','#1A7FBF','#9B2335']

// ─── Pill components ──────────────────────────────────────────────────────────

function LivePip() {
  return (
    <span style={{
      width: 7, height: 7, background: '#34C759', borderRadius: '50%',
      display: 'inline-block', position: 'relative', flexShrink: 0,
    }}>
      <span style={{
        position: 'absolute', inset: -4, borderRadius: '50%',
        background: 'rgba(52,199,89,.22)',
        animation: 'pip 2s ease-in-out infinite',
      }} />
    </span>
  )
}

function StatusBadge({ gathering }: { gathering: Gathering }) {
  const now = Date.now()
  const time = new Date(gathering.gathering_time).getTime()
  const diffMin = Math.round((time - now) / 60000)
  const pct = ((gathering.attendees_count ?? 0) / (gathering.max_players ?? 10)) * 100

  if (pct >= 100) return (
    <span style={{ background: 'rgba(255,59,48,.3)', border: '1px solid rgba(255,59,48,.45)', color: '#FF6B6B', borderRadius: 100, padding: '4px 10px', fontSize: 11, fontWeight: 700, letterSpacing: '.05em' }}>
      FULL
    </span>
  )
  if (diffMin <= 0) return (
    <span style={{ background: 'rgba(52,199,89,.25)', border: '1px solid rgba(52,199,89,.38)', color: '#4ADE80', borderRadius: 100, padding: '4px 10px', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
      <LivePip /> Igra se
    </span>
  )
  if (diffMin <= 30) return (
    <span style={{ background: 'rgba(255,107,0,.25)', border: '1px solid rgba(255,107,0,.38)', color: '#FF8C42', borderRadius: 100, padding: '4px 10px', fontSize: 11, fontWeight: 700 }}>
      Za {diffMin} min
    </span>
  )
  return (
    <span style={{ background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.18)', color: '#fff', borderRadius: 100, padding: '4px 10px', fontSize: 11, fontWeight: 600 }}>
      {fmtTime(gathering.gathering_time)}
    </span>
  )
}

// ─── GatheringCard ────────────────────────────────────────────────────────────

function GatheringCard({ gathering, onUpdate }: { gathering: Gathering; onUpdate: () => void }) {
  const [attending, setAttending] = useState(gathering.is_attending ?? false)
  const [count, setCount] = useState(gathering.attendees_count ?? 0)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const max = gathering.max_players ?? 10
  const pct = Math.min(100, (count / max) * 100)
  const isFull = pct >= 100
  const barColor = getBarColor(pct)
  const fillLabel = getFillLabel(count, gathering.max_players)
  const court = gathering.court as any
  const creator = gathering.creator as any
  const attendees = (gathering as any).attendees ?? []
  const photoUrl = court?.image_url ?? COURT_IMAGES.default

  const now = Date.now()
  const time = new Date(gathering.gathering_time).getTime()
  const diffMin = Math.round((time - now) / 60000)
  const isLive = diffMin <= 0
  const isSoon = diffMin > 0 && diffMin <= 30
  const isNearlyFull = pct >= 70 && !isFull

  const handleAttend = async (e: React.MouseEvent) => {
    e.preventDefault()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href = '/auth/login'; return }
    setLoading(true)
    if (attending) {
      await fetch(`/api/gatherings/${gathering.id}/attend`, { method: 'DELETE' })
      setAttending(false)
      setCount(c => Math.max(0, c - 1))
    } else {
      await fetch(`/api/gatherings/${gathering.id}/attend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dolazim' }),
      })
      setAttending(true)
      setCount(c => c + 1)
    }
    setLoading(false)
    onUpdate()
  }

  return (
    <div style={{
      background: '#161618',
      border: `1px solid ${isNearlyFull && !isFull ? 'rgba(255,107,0,.28)' : isLive ? 'rgba(52,199,89,.2)' : 'rgba(255,255,255,.07)'}`,
      borderRadius: 20,
      overflow: 'hidden',
      boxShadow: isNearlyFull && !isFull ? '0 0 0 1px rgba(255,107,0,.1),0 8px 32px rgba(255,107,0,.1)' : undefined,
      opacity: isFull ? 0.6 : 1,
      pointerEvents: isFull ? 'none' as any : undefined,
    }}>

      {/* Hero photo */}
      <div style={{ height: 186, position: 'relative', overflow: 'hidden', background: '#111' }}>
        <img
          src={photoUrl}
          alt={court?.name ?? 'Teren'}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            filter: isFull ? 'brightness(.5) saturate(.5)' : 'brightness(.82) saturate(1.08)',
            display: 'block',
          }}
        />
        {/* gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,.0) 0%, rgba(0,0,0,.08) 30%, rgba(0,0,0,.55) 68%, rgba(0,0,0,.88) 100%)',
        }} />
        {/* top-left: distance */}
        <div style={{ position: 'absolute', top: 12, left: 14 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,.14)', borderRadius: 100,
            padding: '4px 10px', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.9)',
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="2.5"/></svg>
            {court ? `${getDistanceKm ? '' : ''}${(gathering as any).distance ? `${(gathering as any).distance.toFixed(1)} km` : '— km'}` : '— km'}
          </span>
        </div>
        {/* top-right: status badge */}
        <div style={{ position: 'absolute', top: 12, right: 14 }}>
          <StatusBadge gathering={{ ...gathering, attendees_count: count }} />
        </div>
        {/* bottom: court name */}
        <div style={{ position: 'absolute', bottom: 0, left: 14, right: 14, paddingBottom: 14 }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 22, color: '#fff', letterSpacing: '-.01em', lineHeight: 1.05, textShadow: '0 1px 12px rgba(0,0,0,.6)' }}>
            {court?.name ?? 'Teren'}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', fontWeight: 500, marginTop: 3 }}>
            Organizator: {creator?.full_name || creator?.username || 'Nepoznat'}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: 16 }}>
        {/* Detail badges */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: '#1C1C1F', border: '1px solid rgba(255,255,255,.07)', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,.55)' }}>
            ⏱ {fmtTime(gathering.gathering_time)}–{/* end time */}
            {(() => {
              const end = new Date(gathering.gathering_time)
              end.setHours(end.getHours() + 2)
              return end.toLocaleTimeString('sr-Latn', { hour: '2-digit', minute: '2-digit' })
            })()}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: (gathering as any).game_type === '3x3' ? 'rgba(100,210,255,.07)' : '#1C1C1F', border: `1px solid ${(gathering as any).game_type === '3x3' ? 'rgba(100,210,255,.2)' : 'rgba(255,255,255,.07)'}`, borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 500, color: (gathering as any).game_type === '3x3' ? '#64D2FF' : 'rgba(255,255,255,.55)' }}>
            {(gathering as any).game_type ?? '5×5'}
          </span>
          {(gathering as any).level && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: '#1C1C1F', border: '1px solid rgba(255,255,255,.07)', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,.55)' }}>
              {(gathering as any).level === 'jak' ? '🔥 Napredni' : (gathering as any).level === 'srednji' ? '⭐ Srednji' : '🏀 Rekreativci'}
            </span>
          )}
        </div>

        {/* Player count + fill bar */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 0, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 42, lineHeight: 1, letterSpacing: '-.02em', color: '#fff' }}>
              {count}
            </span>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontSize: 20, color: 'rgba(255,255,255,.28)', letterSpacing: '-.01em', marginBottom: 2 }}>
              /{max}
            </span>
          </div>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.28)', fontWeight: 500, marginLeft: 8, marginBottom: 6 }}>igrača</span>
          <div style={{ flex: 1, paddingBottom: 8, paddingLeft: 14 }}>
            <div style={{ height: 4, background: '#242428', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 100, transition: 'width .65s cubic-bezier(.25,.1,.25,1)' }} />
            </div>
            <div style={{ fontSize: 11, marginTop: 5, color: pct >= 90 ? '#FF3B30' : pct >= 70 ? '#FF6B00' : 'rgba(255,255,255,.28)', fontWeight: pct >= 70 ? 600 : 400 }}>
              {fillLabel}
            </div>
          </div>
        </div>

        {/* Avatars + tags */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {attendees.slice(0, 4).map((a: any, i: number) => (
              <div key={a.user_id ?? i} style={{
                width: 28, height: 28, borderRadius: '50%',
                background: a.profile?.avatar_url ? undefined : AVATAR_COLORS[i % AVATAR_COLORS.length],
                border: '2.5px solid #161618',
                marginLeft: i === 0 ? 0 : -8,
                overflow: 'hidden',
                display: 'grid', placeItems: 'center',
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 10, color: '#fff',
                flexShrink: 0,
              }}>
                {a.profile?.avatar_url
                  ? <img src={a.profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : getInitials(a.profile?.username ?? '?')}
              </div>
            ))}
            {attendees.length > 4 && (
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#242428', border: '2.5px solid #161618', marginLeft: -8, display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,.28)', flexShrink: 0 }}>
                +{attendees.length - 4}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {court?.is_outdoor !== undefined && (
              <span style={{ display: 'inline-flex', alignItems: 'center', background: '#1C1C1F', border: '1px solid rgba(255,255,255,.07)', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,.55)' }}>
                {court.is_outdoor ? 'Outdoor' : 'Indoor'}
              </span>
            )}
          </div>
        </div>

        {/* Footer CTA */}
        <div style={{ paddingTop: 13, borderTop: '1px solid rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.55)', fontWeight: 500, lineHeight: 1.4 }}>
            <strong style={{ color: isLive ? '#34C759' : isSoon ? '#FF6B00' : '#fff', fontWeight: 600, display: 'block' }}>
              {isLive ? 'Igra u toku' : isSoon ? `${fmtTime(gathering.gathering_time)} — žuri!` : fmtTime(gathering.gathering_time)}
            </strong>
            {fmtCountdown(gathering.gathering_time)}
          </div>
          {isFull ? (
            <div style={{ flexShrink: 0, background: '#1C1C1F', color: 'rgba(255,255,255,.28)', fontSize: 13, fontWeight: 500, padding: '10px 14px', borderRadius: 10 }}>Popunjeno</div>
          ) : attending ? (
            <button
              onClick={handleAttend}
              disabled={loading}
              style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6, background: '#1C1C1F', color: '#34C759', border: '1px solid rgba(52,199,89,.22)', fontSize: 14, fontWeight: 600, padding: '10px 16px', borderRadius: 10, cursor: 'pointer', opacity: loading ? .5 : 1, transition: 'all .15s' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Idem
            </button>
          ) : (
            <button
              onClick={handleAttend}
              disabled={loading}
              style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FF6B00', color: '#fff', fontSize: 14, fontWeight: 600, padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', opacity: loading ? .5 : 1, boxShadow: '0 3px 14px rgba(255,107,0,.28)', transition: 'all .15s' }}
            >
              {isLive ? 'Pridruži se' : 'Dolazim'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── CourtCard (nearby) ───────────────────────────────────────────────────────

function CourtCard({ court, distance }: { court: Court; distance?: number }) {
  return (
    <Link href={`/courts/${court.id}`}>
      <div style={{
        flexShrink: 0, width: 170,
        background: '#161618', border: '1px solid rgba(255,255,255,.07)',
        borderRadius: 14, padding: 14, cursor: 'pointer',
        transition: 'border-color .18s',
        scrollSnapAlign: 'start',
      }}>
        {/* mini court icon */}
        <div style={{ width: 36, height: 36, background: '#242428', borderRadius: 9, display: 'grid', placeItems: 'center', marginBottom: 10 }}>
          <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="9.5" stroke="rgba(255,107,0,.6)" strokeWidth="1.3"/>
            <path d="M11 1.5C8.5 4.5 8.5 17.5 11 20.5" stroke="rgba(255,107,0,.6)" strokeWidth="1.3" fill="none"/>
            <path d="M11 1.5C13.5 4.5 13.5 17.5 11 20.5" stroke="rgba(255,107,0,.6)" strokeWidth="1.3" fill="none"/>
            <line x1="1.5" y1="11" x2="20.5" y2="11" stroke="rgba(255,107,0,.6)" strokeWidth="1.3"/>
          </svg>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', lineHeight: 1.3, letterSpacing: '-.01em', marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {court.name}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.28)', fontWeight: 500 }}>
          {court.is_outdoor ? 'Outdoor' : 'Indoor'} · {court.surface}
        </div>
        {distance !== undefined && (
          <div style={{ fontSize: 12, fontWeight: 700, color: '#FF6B00', marginTop: 8 }}>
            {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)} km`}
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 7 }}>
          <span style={{ display: 'inline-flex', fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,.28)', background: '#242428', borderRadius: 5, padding: '3px 6px' }}>
            🏀 {court.hoops_count} koša
          </span>
          {court.is_outdoor && (
            <span style={{ display: 'inline-flex', fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,.28)', background: '#242428', borderRadius: 5, padding: '3px 6px' }}>
              💡 Osvetljenje
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function GatheringCardSkeleton() {
  return (
    <div style={{ background: '#161618', border: '1px solid rgba(255,255,255,.07)', borderRadius: 20, overflow: 'hidden' }}>
      <div style={{ height: 186, background: 'linear-gradient(90deg,#1c1c1f 25%,#242428 50%,#1c1c1f 75%)', backgroundSize: '800px 100%', animation: 'shimmer 1.4s infinite' }} />
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[30,25,20].map(w => (
            <div key={w} style={{ height: 22, width: `${w}%`, background: '#242428', borderRadius: 6, animation: 'shimmer 1.4s infinite' }} />
          ))}
        </div>
        <div style={{ height: 42, width: '45%', background: '#242428', borderRadius: 6, animation: 'shimmer 1.4s infinite' }} />
        <div style={{ height: 4, background: '#242428', borderRadius: 100, animation: 'shimmer 1.4s infinite' }} />
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const FILTERS = ['Danas', 'Sutra', '3×3', '5×5', 'Outdoor', 'Indoor', 'Besplatno'] as const
type Filter = typeof FILTERS[number]

export default function HomePage() {
  const [gatherings, setGatherings]     = useState<Gathering[]>([])
  const [courts, setCourts]             = useState<Court[]>([])
  const [nearbyCourts, setNearby]       = useState<(Court & { distance: number })[]>([])
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading]           = useState(true)
  const [activeFilters, setActiveFilters] = useState<Filter[]>(['Danas'])
  const [searchQuery, setSearchQuery]   = useState('')
  const supabase = createClient()

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      ()  => setUserLocation({ lat: 44.8125, lng: 20.4731 })
    )
    fetchData()
  }, [])

  useEffect(() => {
    if (userLocation && courts.length > 0) {
      const sorted = courts
        .map(c => ({ ...c, distance: getDistanceKm(userLocation.lat, userLocation.lng, c.lat, c.lng) }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5)
      setNearby(sorted)
    }
  }, [userLocation, courts])

  const fetchData = async () => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)

    const [{ data: gData }, { data: cData }] = await Promise.all([
      supabase
        .from('gatherings')
        .select(`*, creator:profiles!created_by(id,username,full_name,avatar_url), court:courts(*), attendees:gathering_attendees(id,user_id,status,profile:profiles(id,username,avatar_url))`)
        .gte('gathering_time', today.toISOString())
        .eq('is_active', true)
        .order('gathering_time', { ascending: true }),
      supabase.from('courts').select('*').eq('is_approved', true).order('name'),
    ])

    if (gData) {
      const { data: { session } } = await supabase.auth.getSession()
      setGatherings(gData.map((g: any) => ({
        ...g,
        attendees_count: g.attendees?.filter((a: any) => a.status === 'dolazim').length ?? 0,
        is_attending: session ? g.attendees?.some((a: any) => a.user_id === session.user.id && a.status === 'dolazim') : false,
      })))
    }
    if (cData) setCourts(cData)
    setLoading(false)
  }

  const toggleFilter = (f: Filter) => {
    setActiveFilters(prev =>
      prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
    )
  }

  const filteredGatherings = gatherings.filter(g => {
    const court = g.court as any
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!court?.name?.toLowerCase().includes(q) && !g.title?.toLowerCase().includes(q)) return false
    }
    if (activeFilters.includes('3×3') && (g as any).game_type !== '3x3') return false
    if (activeFilters.includes('5×5') && (g as any).game_type !== '5x5') return false
    if (activeFilters.includes('Outdoor') && !court?.is_outdoor) return false
    if (activeFilters.includes('Indoor') && court?.is_outdoor) return false
    return true
  })

  const todayCount = gatherings.length
  const playerCount = gatherings.reduce((acc, g) => acc + (g.attendees_count ?? 0), 0)

  return (
    <>
      {/* Inject keyframes */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&display=swap');
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        @keyframes pip { 0%,100%{transform:scale(1);opacity:.8} 60%{transform:scale(2.2);opacity:0} }
        .filter-chip { flex-shrink:0; height:34px; padding:0 13px; background:#161618; border:1px solid rgba(255,255,255,.07); border-radius:100px; font-size:13px; font-weight:500; color:rgba(255,255,255,.55); white-space:nowrap; cursor:pointer; transition:all .15s; display:inline-flex; align-items:center; gap:5px; }
        .filter-chip:hover { background:#1C1C1F; border-color:rgba(255,255,255,.11); color:#fff; }
        .filter-chip.active { background:#fff; border-color:#fff; color:#000; font-weight:600; }
        .filter-chip:active { transform:scale(.94); }
        .search-input::placeholder { color:rgba(255,255,255,.28); }
        .search-input:focus { border-color:rgba(255,255,255,.2); background:#1C1C1F; box-shadow:0 0 0 3px rgba(255,255,255,.04); outline:none; }
        .court-scroll::-webkit-scrollbar { display:none; }
      `}</style>

      <div style={{ background: '#0C0C0E', minHeight: '100vh', color: '#fff', fontFamily: "'Inter',system-ui,sans-serif" }}>

        {/* ── Greeting ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 18px 0', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,.28)', marginBottom: 3 }}>
              {new Date().toLocaleDateString('sr-Latn', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 32, lineHeight: .95, letterSpacing: '-.01em' }}>
              Ko igra<br /><span style={{ color: '#FF6B00' }}>večeras?</span>
            </div>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#161618', border: '1px solid rgba(255,255,255,.07)', borderRadius: 100, padding: '5px 10px 5px 8px', flexShrink: 0, marginTop: 2, cursor: 'pointer' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FF6B00" strokeWidth="2.2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="2.8"/></svg>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,.55)' }}>Beograd</span>
          </button>
        </div>

        {/* ── Search ── */}
        <div style={{ padding: '14px 18px 0', position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 30, top: '50%', transform: 'translateY(-4px)', width: 16, height: 16, color: 'rgba(255,255,255,.28)', pointerEvents: 'none' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="search"
            className="search-input"
            placeholder="Pretraži teren ili lokaciju..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', height: 44,
              background: '#161618', border: '1px solid rgba(255,255,255,.07)',
              borderRadius: 12, padding: '0 40px 0 40px',
              fontSize: 14, fontFamily: 'inherit', color: '#fff',
              WebkitAppearance: 'none', transition: 'border-color .2s,background .15s,box-shadow .2s',
            }}
          />
        </div>

        {/* ── Filter chips ── */}
        <div className="court-scroll" style={{ display: 'flex', gap: 8, padding: '10px 18px 0', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          {FILTERS.map(f => (
            <button key={f} className={`filter-chip ${activeFilters.includes(f) ? 'active' : ''}`} onClick={() => toggleFilter(f)}>
              {f === 'Danas' && '📅 '}{f === 'Sutra' && '📆 '}{f === 'Outdoor' && '☀️ '}{f === 'Indoor' && '🏢 '}{f === 'Besplatno' && '🟢 '}
              {f}
            </button>
          ))}
        </div>

        {/* ── Live bar ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 16px 0', padding: '11px 14px', background: '#161618', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14 }}>
          <LivePip />
          <span style={{ fontSize: 11, fontWeight: 600, color: '#34C759', letterSpacing: '.04em', textTransform: 'uppercase' }}>Uživo</span>
          <div style={{ width: 1, height: 13, background: 'rgba(255,255,255,.11)', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,.55)' }}>
            <strong style={{ color: '#fff', fontWeight: 600 }}>{todayCount} {todayCount === 1 ? 'igra' : 'igara'}</strong> večeras · <strong style={{ color: '#fff', fontWeight: 600 }}>{playerCount} igrača</strong> potvrđeno
          </span>
        </div>

        {/* ── Games section ── */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '22px 18px 12px' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', letterSpacing: '-.01em' }}>Igre večeras</span>
          <Link href="/courts" style={{ fontSize: 13, fontWeight: 500, color: '#FF6B00' }}>Sve igre</Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 16px' }}>
          {loading ? (
            <>
              <GatheringCardSkeleton />
              <GatheringCardSkeleton />
            </>
          ) : filteredGatherings.length > 0 ? (
            filteredGatherings.map(g => (
              <GatheringCard key={g.id} gathering={g} onUpdate={fetchData} />
            ))
          ) : (
            <div style={{ background: '#161618', border: '1px solid rgba(255,255,255,.07)', borderRadius: 20, padding: '32px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 40 }}>🏀</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Nema igara za ovaj filter</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.28)', lineHeight: 1.5 }}>
                {searchQuery ? `Nema terena koji odgovaraju "${searchQuery}"` : 'Pokušaj drugi filter ili zakažи prvu igru.'}
              </div>
              <Link href="/gatherings/new" style={{ marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FF6B00', color: '#fff', fontSize: 13, fontWeight: 600, padding: '10px 20px', borderRadius: 10, boxShadow: '0 3px 12px rgba(255,107,0,.28)' }}>
                Zakažи igru
              </Link>
            </div>
          )}
        </div>

        {/* ── Nearby courts ── */}
        {nearbyCourts.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '22px 18px 12px' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Tereni blizu tebe</span>
              <Link href="/courts" style={{ fontSize: 13, fontWeight: 500, color: '#FF6B00' }}>Svi tereni</Link>
            </div>
            <div className="court-scroll" style={{ display: 'flex', gap: 10, padding: '0 16px', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', scrollSnapType: 'x mandatory' }}>
              {nearbyCourts.map(c => (
                <CourtCard key={c.id} court={c} distance={c.distance} />
              ))}
            </div>
          </>
        )}

        <div style={{ height: 16 }} />
      </div>
    </>
  )
}
