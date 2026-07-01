'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Court } from '@/types'
import CourtNearbyCard from '@/components/court/CourtNearbyCard'
import { Search, Plus, MapPin } from 'lucide-react'
import Link from 'next/link'
import { getDistanceKm } from '@/lib/utils'
import { useAuth } from '@/components/layout/AuthProvider'

export default function CourtsPage() {
  const [courts, setCourts] = useState<Court[]>([])
  const [filtered, setFiltered] = useState<Court[]>([])
  const [query, setQuery] = useState('')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      )
    }
    fetchCourts()
  }, [])

  useEffect(() => {
    const q = query.toLowerCase()
    setFiltered(
      courts.filter(
        (c) =>
          c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q)
      )
    )
  }, [query, courts])

  const fetchCourts = async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { data } = await supabase
      .from('courts')
      .select(`*, gatherings(id)`)
      .eq('is_approved', true)
      .order('name')

    if (data) {
      const enriched = data.map((c: any) => ({
        ...c,
        active_gatherings: c.gatherings?.length ?? 0,
      }))
      setCourts(enriched)
      setFiltered(enriched)
    }
    setLoading(false)
  }

  const courtsWithDistance = filtered.map((c) => ({
    ...c,
    distance: userLocation
      ? getDistanceKm(userLocation.lat, userLocation.lng, c.lat, c.lng)
      : undefined,
  }))

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
              className="flex items-center gap-1.5 bg-court-card border border-court-border rounded-xl px-3 py-2 text-xs text-court-text hover:text-orange-500 hover:border-orange-500/40 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Predloži
            </Link>
          )}
        </div>

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
            <CourtNearbyCard key={c.id} court={c} distance={c.distance} />
          ))
        ) : (
          <div className="py-12 flex flex-col items-center gap-3 text-center">
            <MapPin className="w-10 h-10 text-court-text" />
            <p className="text-court-text">Nema rezultata za &quot;{query}&quot;</p>
          </div>
        )}
      </div>
    </div>
  )
}
