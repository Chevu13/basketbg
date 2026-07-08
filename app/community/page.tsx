'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import PlayerAvatar from '@/components/ui/PlayerAvatar'
import { Search, Trophy, Flame, CalendarPlus } from 'lucide-react'
import { getReputationColor, getReputationLabel, cn } from '@/lib/utils'

type Row = {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  arrivals_count: number
  no_show_count: number
  gatherings_created: number
  reputation_score: number
}

type SortKey = 'arrivals' | 'created' | 'reputation'

const SORTS: { key: SortKey; label: string; icon: React.ReactNode }[] = [
  { key: 'arrivals', label: 'Najviše igra', icon: <Flame className="w-3.5 h-3.5" /> },
  { key: 'created', label: 'Najviše zakazuje', icon: <CalendarPlus className="w-3.5 h-3.5" /> },
  { key: 'reputation', label: 'Najpouzdaniji', icon: <Trophy className="w-3.5 h-3.5" /> },
]

export default function CommunityPage() {
  const supabase = createClient()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('arrivals')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, reputation:user_reputation(arrivals_count, no_show_count, gatherings_created, reputation_score)')
        .eq('is_admin', false)
        .limit(200)

      const mapped: Row[] = (data ?? []).map((p: any) => ({
        id: p.id,
        username: p.username,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        arrivals_count: p.reputation?.arrivals_count ?? 0,
        no_show_count: p.reputation?.no_show_count ?? 0,
        gatherings_created: p.reputation?.gatherings_created ?? 0,
        reputation_score: p.reputation?.reputation_score ?? 100,
      }))
      setRows(mapped)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    let list = rows
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter(r =>
        r.username?.toLowerCase().includes(q) || r.full_name?.toLowerCase().includes(q)
      )
    }
    const sorted = [...list].sort((a, b) => {
      if (sortKey === 'arrivals') return b.arrivals_count - a.arrivals_count
      if (sortKey === 'created') return b.gatherings_created - a.gatherings_created
      return b.reputation_score - a.reputation_score
    })
    return sorted
  }, [rows, query, sortKey])

  const medal = (rank: number) => {
    if (rank === 0) return { bg: '#F5C518', text: '#1a1a1a' }
    if (rank === 1) return { bg: '#C0C0C0', text: '#1a1a1a' }
    if (rank === 2) return { bg: '#B0703A', text: '#fff' }
    return null
  }

  return (
    <div className="pb-8">
      <div className="px-5 pt-5 pb-3">
        <h1 className="font-display font-black text-2xl uppercase text-white leading-none">
          Zajednica
        </h1>
        <p className="text-court-text text-sm mt-1.5">Igrači koji dele teren sa tobom</p>
      </div>

      {/* Search */}
      <div className="px-5 mb-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-court-text" />
          <input
            type="text"
            placeholder="Pretraži igrača po imenu..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input-dark pl-10"
          />
        </div>
      </div>

      {/* Sort chips */}
      <div className="flex gap-2 px-5 pb-4 overflow-x-auto no-scrollbar">
        {SORTS.map(s => (
          <button
            key={s.key}
            onClick={() => setSortKey(s.key)}
            className={cn(
              'flex-shrink-0 flex items-center gap-1.5 h-[34px] px-3.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-all active:scale-95',
              sortKey === s.key ? 'bg-white text-black font-semibold' : 'bg-court-card border border-court-border text-court-text hover:text-white'
            )}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="px-5 flex flex-col gap-2">
        {loading ? (
          <div className="py-10 flex justify-center">
            <div className="w-6 h-6 border-2 border-court-muted border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-court-card border border-court-border rounded-xl p-6 text-center text-court-text text-sm">
            {query ? 'Nema igrača sa tim imenom' : 'Nema još igrača'}
          </div>
        ) : (
          filtered.map((r, i) => {
            const m = !query ? medal(i) : null
            const metricValue = sortKey === 'arrivals' ? r.arrivals_count : sortKey === 'created' ? r.gatherings_created : r.reputation_score
            const metricLabel = sortKey === 'arrivals' ? 'dolazaka' : sortKey === 'created' ? 'zakazano' : '% pouzdanosti'
            return (
              <Link
                key={r.id}
                href={`/players/${r.username}`}
                className="bg-court-card border border-court-border rounded-xl p-3 flex items-center gap-3 hover:border-orange-500/40 transition-colors"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center font-display font-black text-xs flex-shrink-0"
                  style={{ background: m ? m.bg : 'transparent', color: m ? m.text : '#666' }}
                >
                  {i + 1}
                </div>
                <PlayerAvatar url={r.avatar_url} fullName={r.full_name} username={r.username} size={40} colorSeed={i} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{r.full_name || r.username}</p>
                  <p className="text-court-text2 text-xs truncate">@{r.username}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-display font-black text-lg text-white leading-none">{metricValue}</p>
                  <p className="text-court-text2 text-[10px] mt-0.5">{metricLabel}</p>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
