'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Court, Gathering } from '@/types'
import { useAuth } from '@/components/layout/AuthProvider'
import CourtMapEmbed from '@/components/map/CourtMapEmbed'
import GatheringCard from '@/components/gathering/GatheringCard'
import GatheringCardSkeleton from '@/components/gathering/GatheringCardSkeleton'
import CourtChat from '@/components/chat/CourtChat'
import CreateGatheringInline from '@/components/gathering/CreateGatheringInline'
import { Bell, BellOff, MapPin, Calendar, MessageSquare, Plus, ChevronDown, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type Props = { params: { id: string } }
type Tab = 'wall' | 'chat'

export default function CourtPage({ params }: Props) {
  const { id } = params
  const { user } = useAuth()
  const [court, setCourt] = useState<Court | null>(null)
  const [gatherings, setGatherings] = useState<Gathering[]>([])
  const [following, setFollowing] = useState(false)
  const [followCount, setFollowCount] = useState(0)
  const [followBusy, setFollowBusy] = useState(false)
  const [tab, setTab] = useState<Tab>('wall')
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchCourt()
    fetchGatherings()
    if (user) checkFollowing()
  }, [id, user])

  const fetchCourt = async () => {
    const [{ data: courtData, error }, { count }] = await Promise.all([
      supabase.from('courts').select('*').eq('id', id).single(),
      supabase.from('court_followers').select('*', { count: 'exact', head: true }).eq('court_id', id),
    ])
    if (error) {
      // PGRST116 = no row found → genuine 404. Anything else is a real error.
      if (error.code === 'PGRST116') setNotFound(true)
      else setLoadError(error.message)
    }
    if (courtData) setCourt(courtData)
    setFollowCount(count ?? 0)
    setLoading(false)
  }

  const fetchGatherings = async () => {
    const { data } = await supabase
      .from('gatherings')
      .select('*, creator:profiles!created_by(*), court:courts(*), attendees:gathering_attendees(*, profile:profiles(id,username,avatar_url))')
      .eq('court_id', id)
      .eq('is_active', true)
      .gte('gathering_time', new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString())
      .order('gathering_time', { ascending: true })
    if (data) {
      const enriched = data.map((g: any) => ({
        ...g,
        attendees_count: g.attendees?.filter((a: any) => a.status === 'dolazim').length ?? 0,
        is_attending: user ? g.attendees?.some((a: any) => a.user_id === user.id && a.status === 'dolazim') : false,
      }))
      setGatherings(enriched)
    }
  }

  const checkFollowing = async () => {
    const { data } = await supabase
      .from('court_followers')
      .select('id')
      .eq('court_id', id)
      .eq('user_id', user!.id)
      .maybeSingle()
    setFollowing(!!data)
  }

  const handleFollow = async () => {
    if (!user) { toast.error('Moraš biti prijavljen'); return }
    setFollowBusy(true)
    try {
      const method = following ? 'DELETE' : 'POST'
      const res = await fetch(`/api/courts/${id}/follow`, { method })
      if (!res.ok) throw new Error()
      setFollowing(!following)
      setFollowCount(c => following ? Math.max(0, c - 1) : c + 1)
      toast.success(following ? 'Prestao si da pratiš ovaj teren' : 'Pratiš ovaj teren 🔔')
    } catch {
      toast.error('Greška, pokušaj ponovo')
    } finally {
      setFollowBusy(false)
    }
  }

  if (loading) return <CourtPageSkeleton />

  if (notFound) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 px-5 text-center">
      <MapPin className="w-10 h-10 text-court-text2" />
      <p className="text-white font-semibold">Teren nije pronađen</p>
      <Link href="/courts" className="text-orange-500 text-sm font-medium">Nazad na sve terene</Link>
    </div>
  )

  if (loadError || !court) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 px-5 text-center">
      <AlertTriangle className="w-10 h-10 text-red-400" />
      <p className="text-white font-semibold">Greška pri učitavanju terena</p>
      {loadError && <p className="text-court-text2 text-xs font-mono">{loadError}</p>}
      <button onClick={() => { setLoading(true); setLoadError(null); fetchCourt() }} className="text-orange-500 text-sm font-medium">
        Pokušaj ponovo
      </button>
    </div>
  )

  return (
    <div className="flex flex-col animate-fade-in">
      {/* Court hero — real photo when available, branded fallback otherwise */}
      <div className="relative h-44 overflow-hidden">
        {court.image_url ? (
          <img src={court.image_url} alt={court.name} className="w-full h-full object-cover" style={{ filter: 'brightness(.62)' }} />
        ) : (
          <div className="court-photo-fallback w-full h-full" />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(12,12,14,.1) 0%, rgba(12,12,14,.25) 50%, rgba(12,12,14,.92) 100%)' }} />
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
          <h1 className="font-display font-black text-3xl uppercase leading-tight text-white" style={{ textShadow: '0 1px 12px rgba(0,0,0,.5)' }}>
            {court.name}
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
            <span className="text-court-text text-sm">{court.address}</span>
          </div>
        </div>
      </div>

      {/* Meta + follow */}
      <div className="px-4 py-3 flex items-center gap-2 border-b border-court-border">
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', court.is_outdoor ? 'bg-sky-500/10 text-sky-400' : 'bg-purple-500/10 text-purple-400')}>
            {court.is_outdoor ? 'Otvoreni' : 'Zatvoreni'}
          </span>
          <span className="text-xs bg-court-muted text-court-text px-2.5 py-1 rounded-full">{court.surface}</span>
          <span className="text-xs bg-court-muted text-court-text px-2.5 py-1 rounded-full">{court.hoops_count} koša</span>
          <span className="text-xs text-court-text">{followCount} pratilaca</span>
        </div>
        <button
          onClick={handleFollow}
          disabled={followBusy}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 border disabled:opacity-50',
            following ? 'border-orange-500/40 bg-orange-500/10 text-orange-500' : 'border-court-border text-court-text hover:border-orange-500/40 hover:text-orange-500'
          )}
        >
          {following ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
          {following ? 'Pratiš' : 'Prati'}
        </button>
      </div>

      {/* Map */}
      <div className="px-4 py-3">
        <CourtMapEmbed lat={court.lat} lng={court.lng} name={court.name} />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-court-border mx-4">
        <button
          onClick={() => setTab('wall')}
          className={cn('flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all', tab === 'wall' ? 'border-orange-500 text-orange-500' : 'border-transparent text-court-text')}
        >
          <Calendar className="w-4 h-4" />
          Zid terena
          {gatherings.length > 0 && (
            <span className="bg-orange-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{gatherings.length}</span>
          )}
        </button>
        <button
          onClick={() => setTab('chat')}
          className={cn('flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all', tab === 'chat' ? 'border-orange-500 text-orange-500' : 'border-transparent text-court-text')}
        >
          <MessageSquare className="w-4 h-4" />
          Chat
        </button>
      </div>

      {/* Tab content */}
      <div className="px-4 py-4">
        {tab === 'wall' && (
          <div className="flex flex-col gap-3">
            {user && (
              <button
                onClick={() => setShowCreate(!showCreate)}
                className={cn(
                  'w-full py-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200',
                  showCreate ? 'border-orange-500/50 bg-orange-500/10 text-orange-500' : 'border-dashed border-court-border text-court-text hover:border-orange-500/40 hover:text-orange-500'
                )}
              >
                {showCreate ? <ChevronDown className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {showCreate ? 'Zatvori' : 'Zakaži okupljanje'}
              </button>
            )}

            {showCreate && (
              <CreateGatheringInline
                courtId={id}
                onSuccess={() => { setShowCreate(false); fetchGatherings() }}
              />
            )}

            {gatherings.length > 0 ? (
              gatherings.map(g => (
                <GatheringCard key={g.id} gathering={g} variant="compact" onUpdate={fetchGatherings} />
              ))
            ) : (
              <div className="py-10 flex flex-col items-center gap-3 text-center">
                <div className="w-14 h-14 rounded-full bg-court-card border border-court-border flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-court-text" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">Nema zakazanih igara</p>
                  <p className="text-court-text text-xs mt-0.5">Budi prvi koji zakazuje!</p>
                </div>
                {!user && (
                  <Link href="/auth/login" className="btn-orange text-xs px-4 py-2">Prijavi se</Link>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'chat' && <CourtChat courtId={id} />}
      </div>
    </div>
  )
}

function CourtPageSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4 animate-pulse">
      <div className="h-44 -mx-4 -mt-0 bg-court-card" />
      <div className="h-8 bg-court-card rounded-xl w-3/4" />
      <div className="h-40 bg-court-card rounded-2xl" />
      <GatheringCardSkeleton />
    </div>
  )
}
