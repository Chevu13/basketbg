'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/layout/AuthProvider'
import { getReputationColor, getReputationLabel, getInitials, formatGatheringTime } from '@/lib/utils'
import { ChevronLeft, Star, Calendar, UserX, CalendarPlus } from 'lucide-react'
import Link from 'next/link'
import type { Gathering, UserReputation } from '@/types'

type PublicProfile = {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

export default function PublicPlayerPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()
  const username = decodeURIComponent(params.username as string)

  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [reputation, setReputation] = useState<UserReputation | null>(null)
  const [upcoming, setUpcoming] = useState<Gathering[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data: p } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, created_at')
        .eq('username', username)
        .maybeSingle()

      if (!p) { setNotFound(true); setLoading(false); return }
      setProfile(p)

      const { data: rep } = await supabase
        .from('user_reputation')
        .select('*')
        .eq('user_id', p.id)
        .maybeSingle()
      setReputation(rep)

      // Igre na koje je ovaj igrač potvrdio dolazak, a još nisu prošle
      const { data: attending } = await supabase
        .from('gathering_attendees')
        .select('gathering:gatherings(*, court:courts(name))')
        .eq('user_id', p.id)
        .eq('status', 'dolazim')
        .gte('gathering.gathering_time', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())

      const gatherings = (attending ?? [])
        .map((r: any) => r.gathering)
        .filter(Boolean)
        .sort((a: any, b: any) => new Date(a.gathering_time).getTime() - new Date(b.gathering_time).getTime())
      setUpcoming(gatherings)

      setLoading(false)
    }
    load()
  }, [username])

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-court-muted border-t-orange-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center gap-3">
        <p className="text-white font-semibold">Igrač nije pronađen</p>
        <button onClick={() => router.back()} className="text-orange-500 text-sm">Nazad</button>
      </div>
    )
  }

  const isMe = user?.id === profile.id
  const score = reputation?.reputation_score ?? 100
  const initials = getInitials(profile.full_name, profile.username)

  return (
    <div className="pb-8">
      <div className="px-4 pt-4 pb-2">
        <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-court-card transition-colors -ml-1.5">
          <ChevronLeft className="w-5 h-5 text-court-text" />
        </button>
      </div>

      <div className="px-5 flex flex-col items-center text-center pt-2 pb-6">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-orange-500/15 border border-orange-500/30 flex items-center justify-center mb-3">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="font-display font-black text-4xl text-orange-500">{initials}</span>
          )}
        </div>
        <h1 className="font-display font-black text-2xl uppercase text-white leading-tight">
          {profile.full_name || profile.username}
        </h1>
        <p className="text-court-text text-sm">@{profile.username}</p>

        <div className="flex items-center gap-1.5 mt-2">
          <Star className={`w-4 h-4 ${getReputationColor(score)}`} fill="currentColor" />
          <span className={`font-bold text-sm ${getReputationColor(score)}`}>{score}%</span>
          <span className="text-court-text text-sm">— {getReputationLabel(score)}</span>
        </div>

        {isMe && (
          <Link href="/profile" className="mt-4 text-xs text-orange-500 font-semibold">
            Ovo si ti — idi na svoj profil za izmene →
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5 px-5 mb-6">
        <StatBox icon={<Calendar className="w-4 h-4" />} value={reputation?.arrivals_count ?? 0} label="Dolazaka" />
        <StatBox icon={<UserX className="w-4 h-4" />} value={reputation?.no_show_count ?? 0} label="No-show" tone="red" />
        <StatBox icon={<CalendarPlus className="w-4 h-4" />} value={reputation?.gatherings_created ?? 0} label="Zakazao" />
      </div>

      {/* Upcoming games */}
      <div className="px-5">
        <p className="text-xs text-court-text uppercase tracking-widest font-semibold mb-3">
          Predstojeće igre
        </p>
        {upcoming.length === 0 ? (
          <div className="bg-court-card border border-court-border rounded-xl p-5 text-center text-court-text text-sm">
            Nema predstojećih igara
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {upcoming.map((g: any) => (
              <Link
                key={g.id}
                href={`/courts/${g.court_id}?gathering=${g.id}`}
                className="bg-court-card border border-court-border rounded-xl p-3.5 flex items-center justify-between gap-3 hover:border-orange-500/40 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{g.title}</p>
                  <p className="text-court-text2 text-xs truncate">{g.court?.name}</p>
                </div>
                <span className="text-orange-500 text-xs font-semibold flex-shrink-0">
                  {formatGatheringTime(g.gathering_time)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatBox({ icon, value, label, tone }: { icon: React.ReactNode; value: number; label: string; tone?: 'red' }) {
  return (
    <div className="bg-court-card border border-court-border rounded-xl py-3 flex flex-col items-center gap-1">
      <div className={tone === 'red' ? 'text-red-500' : 'text-orange-500'}>{icon}</div>
      <span className={`font-display font-black text-lg ${tone === 'red' ? 'text-red-500' : 'text-white'}`}>{value}</span>
      <span className="text-court-text2 text-[10px]">{label}</span>
    </div>
  )
}
