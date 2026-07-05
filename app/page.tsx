'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Gathering, Court } from '@/types'
import { getDistanceKm } from '@/lib/utils'
import Link from 'next/link'
import GatheringCard from '@/components/gathering/GatheringCard'
import GatheringCardSkeleton from '@/components/gathering/GatheringCardSkeleton'
import CourtCard from '@/components/court/CourtCard'
import HomeMap from '@/components/map/HomeMap'
import { Search, X } from 'lucide-react'

// Type filters are mutually exclusive within their own group (date, court-type),
// so "Outdoor" + "Indoor" (or "Danas" + "Sutra") can never both be active —
// that would always produce zero results, which was a bug in the previous version.
const DATE_FILTERS = ['Danas', 'Sutra'] as const
const TYPE_FILTERS = ['3×3', '5×5'] as const
const PLACE_FILTERS = ['Outdoor', 'Indoor'] as const
type DateFilter = typeof DATE_FILTERS[number]
type TypeFilter = typeof TYPE_FILTERS[number]
type PlaceFilter = typeof PLACE_FILTERS[number]

function LivePip() {
  return (
    <span className="relative inline-block w-[7px] h-[7px] rounded-full bg-green-500 flex-shrink-0">
      <span className="absolute -inset-1 rounded-full bg-green-500/25 animate-live-pip" />
    </span>
  )
}

export default function HomePage() {
  const [gatherings, setGatherings]     = useState<Gathering[]>([])
  const [courts, setCourts]             = useState<Court[]>([])
  const [nearbyCourts, setNearby]       = useState<Court[]>([])
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading]           = useState(true)
  const [fetchError, setFetchError]     = useState<string | null>(null)

  const [dateFilter, setDateFilter]   = useState<DateFilter>('Danas')
  const [typeFilter, setTypeFilter]   = useState<TypeFilter | null>(null)
  const [placeFilter, setPlaceFilter] = useState<PlaceFilter | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const supabase = createClient()

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLocation({ lat: 44.8125, lng: 20.4731 }) // fallback: central Belgrade
    )
    fetchData()
  }, [])

  useEffect(() => {
    if (!userLocation || courts.length === 0) return
    const withDistance = courts
      .map(c => ({ ...c, distance: getDistanceKm(userLocation.lat, userLocation.lng, c.lat, c.lng) }))
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
    setNearby(withDistance.slice(0, 6))
  }, [userLocation, courts])

  const fetchData = async () => {
    const today = new Date(); today.setHours(0, 0, 0, 0)

    const [{ data: gData, error: gErr }, { data: cData, error: cErr }] = await Promise.all([
      supabase
        .from('gatherings')
        .select('*, creator:profiles!created_by(id,username,full_name,avatar_url), court:courts(*), attendees:gathering_attendees(id,user_id,status,profile:profiles(id,username,avatar_url))')
        .gte('gathering_time', today.toISOString())
        .eq('is_active', true)
        .order('gathering_time', { ascending: true }),
      supabase.from('courts').select('*').eq('is_approved', true).order('name'),
    ])

    if (gErr) console.error('[BasketBG] gatherings fetch error:', gErr.message)
    if (cErr) console.error('[BasketBG] courts fetch error:', cErr.message)
    setFetchError(gErr?.message || cErr?.message || null)

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

  // Attach real distance to each gathering (via its court's coordinates) once
  // we know where the user is — previously this always showed "— km".
  const gatheringsWithDistance: Gathering[] = gatherings.map(g => ({
    ...g,
    distance: userLocation && g.court
      ? getDistanceKm(userLocation.lat, userLocation.lng, g.court.lat, g.court.lng)
      : undefined,
  }))

  const filteredGatherings = gatheringsWithDistance.filter(g => {
    const gTime = new Date(g.gathering_time)
    const now = new Date()
    const isToday = gTime.toDateString() === now.toDateString()
    const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1)
    const isTomorrow = gTime.toDateString() === tomorrow.toDateString()

    if (dateFilter === 'Danas' && !isToday) return false
    if (dateFilter === 'Sutra' && !isTomorrow) return false
    if (typeFilter === '3×3' && g.game_type !== '3x3') return false
    if (typeFilter === '5×5' && g.game_type !== '5x5') return false
    if (placeFilter === 'Outdoor' && !g.court?.is_outdoor) return false
    if (placeFilter === 'Indoor' && g.court?.is_outdoor) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchesCourt = g.court?.name?.toLowerCase().includes(q) || g.court?.address?.toLowerCase().includes(q)
      const matchesTitle = g.title?.toLowerCase().includes(q)
      if (!matchesCourt && !matchesTitle) return false
    }
    return true
  })

  const todayCount = gatheringsWithDistance.filter(g => new Date(g.gathering_time).toDateString() === new Date().toDateString()).length
  const playerCount = gatheringsWithDistance
    .filter(g => new Date(g.gathering_time).toDateString() === new Date().toDateString())
    .reduce((acc, g) => acc + (g.attendees_count ?? 0), 0)

  const resetFilters = () => {
    setDateFilter('Danas')
    setTypeFilter(null)
    setPlaceFilter(null)
    setSearchQuery('')
  }

  const hasActiveFilters = typeFilter !== null || placeFilter !== null || searchQuery.length > 0 || dateFilter !== 'Danas'

  return (
    <div className="min-h-screen bg-court-bg text-white">
      {/* Greeting */}
      <div className="flex items-start justify-between gap-3 px-[18px] pt-5">
        <div>
          <div className="text-xs font-medium text-court-text2 mb-0.5 capitalize">
            {new Date().toLocaleDateString('sr-Latn', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <div className="font-display font-black text-[32px] leading-[.95] tracking-tight">
            Ko igra<br /><span className="text-orange-500">večeras?</span>
          </div>
        </div>
        <button className="flex items-center gap-1.5 bg-court-card border border-court-border rounded-full pl-2 pr-2.5 py-1.5 flex-shrink-0 mt-0.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FF6B00" strokeWidth="2.2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="2.8" /></svg>
          <span className="text-xs font-medium text-court-text">Beograd</span>
        </button>
      </div>

      {fetchError && (
        <div className="mx-[18px] mt-3 p-3 bg-red-500/10 border border-red-500/25 rounded-xl">
          <div className="text-xs font-semibold text-red-400 mb-0.5">⚠️ Greška pri učitavanju</div>
          <div className="text-[11px] text-court-text font-mono">{fetchError}</div>
        </div>
      )}

      {/* Search */}
      <div className="px-[18px] pt-3.5 relative">
        <Search className="absolute left-[30px] top-1/2 -translate-y-1/2 w-4 h-4 text-court-text2 pointer-events-none" />
        <input
          type="search"
          placeholder="Pretraži teren ili lokaciju..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full h-11 bg-court-card border border-court-border rounded-xl pl-10 pr-10 text-sm text-white placeholder-court-text2 focus:outline-none focus:border-white/20 focus:bg-court-card2 focus:ring-[3px] focus:ring-white/[.04] transition-all"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-[30px] top-1/2 -translate-y-1/2 w-[18px] h-[18px] rounded-full bg-court-muted flex items-center justify-center text-court-text2">
            <X className="w-2.5 h-2.5" />
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 px-[18px] pt-2.5 overflow-x-auto no-scrollbar">
        {DATE_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setDateFilter(f)}
            className={`flex-shrink-0 h-[34px] px-3.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-all active:scale-95 ${
              dateFilter === f ? 'bg-white text-black font-semibold' : 'bg-court-card border border-court-border text-court-text hover:border-court-border/[.6] hover:text-white'
            }`}
          >
            {f === 'Danas' ? '📅 Danas' : '📆 Sutra'}
          </button>
        ))}
        {TYPE_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setTypeFilter(prev => prev === f ? null : f)}
            className={`flex-shrink-0 h-[34px] px-3.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-all active:scale-95 ${
              typeFilter === f ? 'bg-white text-black font-semibold' : 'bg-court-card border border-court-border text-court-text hover:border-court-border/[.6] hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
        {PLACE_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setPlaceFilter(prev => prev === f ? null : f)}
            className={`flex-shrink-0 h-[34px] px-3.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-all active:scale-95 ${
              placeFilter === f ? 'bg-white text-black font-semibold' : 'bg-court-card border border-court-border text-court-text hover:border-court-border/[.6] hover:text-white'
            }`}
          >
            {f === 'Outdoor' ? '☀️ Outdoor' : '🏢 Indoor'}
          </button>
        ))}
      </div>

      {/* Live bar */}
      <div className="flex items-center gap-2.5 mx-4 mt-3.5 px-3.5 py-[11px] bg-court-card border border-court-border rounded-2xl">
        <LivePip />
        <span className="text-[11px] font-semibold text-green-500 tracking-wide uppercase">Uživo</span>
        <div className="w-px h-[13px] bg-white/10 flex-shrink-0" />
        <span className="text-[13px] text-court-text">
          <strong className="text-white font-semibold">{todayCount} {todayCount === 1 ? 'igra' : 'igara'}</strong> večeras · <strong className="text-white font-semibold">{playerCount} igrača</strong> potvrđeno
        </span>
      </div>

      {/* Games section */}
      <div className="flex items-baseline justify-between px-[18px] pt-[22px] pb-3">
        <span className="text-[13px] font-semibold text-white">Igre {dateFilter === 'Danas' ? 'večeras' : 'sutra'}</span>
        {hasActiveFilters && (
          <button onClick={resetFilters} className="text-[13px] font-medium text-orange-500">
            Resetuj filtere
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2.5 px-4">
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
          <div className="bg-court-card border border-court-border rounded-[20px] p-8 text-center flex flex-col items-center gap-3">
            <div className="text-4xl">🏀</div>
            <div className="text-base font-semibold text-white">Nema igara za ovaj filter</div>
            <div className="text-[13px] text-court-text2 leading-relaxed">
              {searchQuery
                ? `Nema terena koji odgovaraju "${searchQuery}"`
                : `Budi prvi koji zakazuje ${dateFilter === 'Danas' ? 'večeras' : 'sutra'}.`}
            </div>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="text-sm font-semibold text-orange-500 mt-1">
                Prikaži sve igre
              </button>
            )}
            <Link href="/gatherings/new" className="mt-1 inline-flex items-center gap-1.5 bg-orange-500 text-white text-sm font-semibold px-5 py-2.5 rounded-[10px]" style={{ boxShadow: '0 3px 12px rgba(255,107,0,.28)' }}>
              Zakaži igru
            </Link>
          </div>
        )}
      </div>

      {/* Nearby courts */}
      {nearbyCourts.length > 0 && (
        <>
          <div className="flex items-baseline justify-between px-[18px] pt-[22px] pb-3">
            <span className="text-[13px] font-semibold text-white">Tereni blizu tebe</span>
            <Link href="/courts" className="text-[13px] font-medium text-orange-500">Svi tereni</Link>
          </div>
          <div className="flex gap-2.5 px-4 overflow-x-auto no-scrollbar" style={{ scrollSnapType: 'x mandatory' }}>
            {nearbyCourts.map(c => (
              <CourtCard key={c.id} court={c} distance={c.distance} layout="rail" />
            ))}
          </div>
        </>
      )}

      {/* Map */}
      <div className="px-[18px] pt-[22px] pb-3">
        <span className="text-[13px] font-semibold text-white">Mapa igara</span>
      </div>
      <div className="px-4">
        <HomeMap courts={courts} gatherings={gatherings} userLocation={userLocation} />
      </div>

      <div className="h-6" />
    </div>
  )
}
