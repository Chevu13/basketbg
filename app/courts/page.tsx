'use client'

import { useEffect, useState } from 'react'
import type { Court } from '@/types'
import CourtCard from '@/components/court/CourtCard'
import { Search, Plus, MapPin, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { getDistanceKm } from '@/lib/utils'
import { useAuth } from '@/components/layout/AuthProvider'

export default function CourtsPage() {
  const [courts, setCourts] = useState<Court[]>([])
  const [query, setQuery] = useState('')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      )
    }
    fetchCourts()
  }, [])

  const fetchCourts = async () => {
    setFetchError(null)
    try {
      const res = await fetch('/api/courts')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Greška pri učitavanju')
      setCourts(json.data ?? [])
    } catch (e: any) {
      console.error('[CrossCourt] courts fetch error:', e.message)
      setFetchError(e.message)
    }
    setLoading(false)
  }

  const q = query.toLowerCase()
  const filtered = courts.filter(c => c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q))

  const courtsWithDistance = filtered
    .map(c => ({
      ...c,
      distance: userLocation ? getDistanceKm(userLocation.lat, userLocation.lng, c.lat, c.lng) : undefined,
    }))
    .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))

  return (
    <div className="flex flex-col animate-fade-in">
      {/* Header */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display font-black text-3xl uppercase tracking-tight">
            Tereni u <span className="text-orange-500">Beogradu</span>
          </h1>
          {user && (
            <Link
              href="/courts/suggest"
              className="flex items-center gap-1.5 bg-court-card border border-court-border rounded-xl px-3 py-2 text-xs text-court-text hover:text-orange-500 hover:border-orange-500/40 transition-all flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Predloži
            </Link>
          )}
        </div>

        {fetchError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/25 rounded-xl flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 text-xs font-semibold mb-0.5">Greška pri učitavanju terena</p>
              <p className="text-court-text text-[11px] font-mono">{fetchError}</p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-court-text" />
          <input
            type="text"
            placeholder="Pretraži terene..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input-dark pl-10"
          />
        </div>
      </div>

      {/* Courts list */}
      <div className="px-4 flex flex-col gap-3 pb-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="card-dark h-20 animate-pulse" />
          ))
        ) : courtsWithDistance.length > 0 ? (
          courtsWithDistance.map((c) => (
            <CourtCard key={c.id} court={c} distance={c.distance} layout="row" />
          ))
        ) : (
          <div className="py-12 flex flex-col items-center gap-3 text-center">
            <MapPin className="w-10 h-10 text-court-text" />
            <p className="text-court-text">
              {query ? <>Nema rezultata za &quot;{query}&quot;</> : 'Trenutno nema terena'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
