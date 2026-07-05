'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/layout/AuthProvider'
import type { Gathering, Court, UserReputation } from '@/types'
import { getReputationColor, getReputationLabel, formatGatheringTime } from '@/lib/utils'
import { LogOut, Edit3, Check, X, MapPin, Calendar, Star, UserX, Shield, Camera, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const [reputation, setReputation]       = useState<UserReputation | null>(null)
  const [myGatherings, setMyGatherings]   = useState<Gathering[]>([])
  const [followedCourts, setFollowed]     = useState<Court[]>([])
  const [tab, setTab]                     = useState<'gatherings'|'courts'>('gatherings')
  const [editing, setEditing]             = useState(false)
  const [editName, setEditName]           = useState('')
  const [editUsername, setEditUsername]   = useState('')
  const [editBio, setEditBio]             = useState('')
  const [saving, setSaving]               = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router   = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return }
    fetchAll()
  }, [user])

  useEffect(() => {
    if (profile) {
      setEditName(profile.full_name ?? '')
      setEditUsername(profile.username)
      setEditBio((profile as any).bio ?? '')
    }
  }, [profile])

  const fetchAll = async () => {
    const [repRes, gathRes, followRes] = await Promise.all([
      supabase.from('user_reputation').select('*').eq('user_id', user!.id).single(),
      supabase.from('gatherings')
        .select('*, court:courts(*), attendees:gathering_attendees(*)')
        .eq('created_by', user!.id)
        .order('gathering_time', { ascending: false })
        .limit(20),
      supabase.from('court_followers')
        .select('*, court:courts(*)')
        .eq('user_id', user!.id),
    ])
    if (repRes.data)   setReputation(repRes.data)
    if (gathRes.data)  setMyGatherings(gathRes.data.map((g: any) => ({
      ...g, attendees_count: g.attendees?.filter((a: any) => a.status === 'dolazim').length ?? 0,
    })))
    if (followRes.data) setFollowed(followRes.data.map((f: any) => f.court).filter(Boolean))
  }

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: editName, username: editUsername, bio: editBio }),
    })
    if (!res.ok) { toast.error('Greška pri čuvanju'); setSaving(false); return }
    await refreshProfile()
    toast.success('Profil sačuvan!')
    setEditing(false)
    setSaving(false)
  }

  const handleAvatarPick = () => fileInputRef.current?.click()

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // validacija
    if (!file.type.startsWith('image/')) {
      toast.error('Izaberi sliku')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Slika je prevelika (max 5MB)')
      return
    }

    setUploadingAvatar(true)
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      // stabilna putanja u folderu = user.id (traži RLS politika)
      const path = `${user.id}/avatar.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, cacheControl: '3600' })
      if (uploadErr) throw uploadErr

      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path)
      // cache-buster da se nova slika odmah vidi
      const publicUrl = `${pub.publicUrl}?v=${Date.now()}`

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: publicUrl }),
      })
      if (!res.ok) throw new Error('save-failed')

      await refreshProfile()
      toast.success('Slika ažurirana!')
    } catch (err) {
      console.error('[BasketBG] avatar upload error:', err)
      toast.error('Greška pri otpremanju slike')
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Odjavio si se')
    router.push('/')
    router.refresh()
  }

  if (!profile) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-[#333] border-t-orange-500 rounded-full animate-spin"/>
    </div>
  )

  const score = reputation?.reputation_score ?? 100
  const initials = (profile.full_name || profile.username)[0].toUpperCase()

  return (
    <div className="flex flex-col animate-fade-in pb-6">

      {/* Header */}
      <div className="px-5 pt-6 pb-5 border-b border-[#1a1a1a]">
        <div className="flex items-start gap-4">
          <button
            onClick={handleAvatarPick}
            disabled={uploadingAvatar}
            className="group relative w-[68px] h-[68px] rounded-2xl overflow-hidden flex-shrink-0 border border-orange-500/30 bg-orange-500/15 flex items-center justify-center"
            aria-label="Promeni sliku profila"
          >
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="font-display font-black text-3xl text-orange-500">{initials}</span>
            )}
            {/* overlay: uvek vidljiv tokom uploada, na hover inače */}
            <span className={cn(
              'absolute inset-0 bg-black/45 flex items-center justify-center transition-opacity',
              uploadingAvatar ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-active:opacity-100'
            )}>
              {uploadingAvatar
                ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                : <Camera className="w-5 h-5 text-white" />}
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex flex-col gap-2">
                <input value={editName} onChange={e => setEditName(e.target.value)}
                  placeholder="Ime i prezime"
                  className="w-full bg-[#161618] border border-[rgba(255,255,255,.07)] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/60"/>
                <input value={editUsername} onChange={e => setEditUsername(e.target.value.toLowerCase())}
                  placeholder="username"
                  className="w-full bg-[#161618] border border-[rgba(255,255,255,.07)] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/60"/>
                <textarea value={editBio} onChange={e => setEditBio(e.target.value)}
                  placeholder="Bio (opciono)" rows={2} maxLength={160}
                  className="w-full bg-[#161618] border border-[rgba(255,255,255,.07)] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/60 resize-none"/>
                <div className="flex gap-2">
                  <button onClick={handleSave} disabled={saving}
                    className="flex-1 bg-orange-500 text-white text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-1 disabled:opacity-50">
                    <Check className="w-3.5 h-3.5"/> Sačuvaj
                  </button>
                  <button onClick={() => setEditing(false)}
                    className="flex-1 border border-[rgba(255,255,255,.09)] text-[#888] text-xs py-2 rounded-lg flex items-center justify-center gap-1">
                    <X className="w-3.5 h-3.5"/> Odustani
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <h1 className="font-display font-black text-2xl uppercase tracking-tight truncate">
                      {profile.full_name || profile.username}
                    </h1>
                    <p className="text-[#555] text-sm">@{profile.username}</p>
                    {(profile as any).bio && <p className="text-[#888] text-xs mt-1">{(profile as any).bio}</p>}
                  </div>
                  <button onClick={() => setEditing(true)}
                    className="text-[#444] hover:text-orange-500 transition-colors mt-1 flex-shrink-0">
                    <Edit3 className="w-4 h-4"/>
                  </button>
                </div>
                {/* Reputation */}
                <div className="flex items-center gap-1.5 mt-2.5">
                  <Star className="w-3.5 h-3.5 text-orange-500"/>
                  <span className={cn('text-sm font-bold', getReputationColor(score))}>{score}%</span>
                  <span className="text-[#555] text-xs">— {getReputationLabel(score)}</span>
                  {profile.is_admin && (
                    <span className="ml-1 text-[10px] bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Shield className="w-2.5 h-2.5"/> Admin
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        {!editing && (
          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { label: 'Dolazaka', value: reputation?.arrivals_count ?? 0, color: 'text-orange-500' },
              { label: 'No-show', value: reputation?.no_show_count ?? 0, color: 'text-red-400' },
              { label: 'Zakazao', value: reputation?.gatherings_created ?? 0, color: 'text-white' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-[#161618] border border-[rgba(255,255,255,.07)] rounded-xl p-3 text-center">
                <p className={cn('font-display font-black text-2xl', color)}>{value}</p>
                <p className="text-[#555] text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1a1a1a] mx-5 mt-2">
        {[
          { key: 'gatherings', label: 'Moje igre', icon: <Calendar className="w-4 h-4"/> },
          { key: 'courts',     label: 'Tereni',    icon: <MapPin className="w-4 h-4"/> },
        ].map(({ key, label, icon }) => (
          <button key={key} onClick={() => setTab(key as any)}
            className={cn('flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all',
              tab === key ? 'border-orange-500 text-orange-500' : 'border-transparent text-[#555]')}>
            {icon}{label}
          </button>
        ))}
      </div>

      <div className="px-5 py-4">
        {tab === 'gatherings' && (
          <div className="flex flex-col gap-2">
            {myGatherings.length === 0 ? (
              <EmptyState icon={<Calendar className="w-7 h-7 text-[#444]"/>} text="Nisi još zakazao nijednu igru"
                ctaLabel="Zakaži igru" ctaHref="/gatherings/new"/>
            ) : myGatherings.map(g => (
              <GatheringRow key={g.id} gathering={g} onRefresh={fetchAll}/>
            ))}
          </div>
        )}
        {tab === 'courts' && (
          <div className="flex flex-col gap-2">
            {followedCourts.length === 0 ? (
              <EmptyState icon={<MapPin className="w-7 h-7 text-[#444]"/>} text="Ne pratiš nijedan teren"
                ctaLabel="Istraži terene" ctaHref="/courts"/>
            ) : followedCourts.map(c => (
              <Link key={c.id} href={`/courts/${c.id}`}>
                <div className="bg-[#161618] border border-[rgba(255,255,255,.07)] rounded-xl p-4 flex items-center gap-3 hover:border-[rgba(255,255,255,.12)] transition-all active:scale-[0.99]">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 22 22" fill="none" className="w-5 h-5">
                      <circle cx="11" cy="11" r="9.5" stroke="#FF6B00" strokeWidth="1.3"/>
                      <path d="M11 1.5C8.5 4.5 8.5 17.5 11 20.5" stroke="#FF6B00" strokeWidth="1.3" fill="none"/>
                      <path d="M11 1.5C13.5 4.5 13.5 17.5 11 20.5" stroke="#FF6B00" strokeWidth="1.3" fill="none"/>
                      <line x1="1.5" y1="11" x2="20.5" y2="11" stroke="#FF6B00" strokeWidth="1.3"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{c.name}</p>
                    <p className="text-[#555] text-xs truncate">{c.address}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Logout */}
      <div className="px-5 mt-4">
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 border border-red-500/25 rounded-xl text-red-400 hover:bg-red-500/8 transition-all text-sm font-medium">
          <LogOut className="w-4 h-4"/> Odjavi se
        </button>
      </div>
    </div>
  )
}

function GatheringRow({ gathering, onRefresh }: { gathering: Gathering; onRefresh: () => void }) {
  const isPast   = new Date(gathering.gathering_time) < new Date()
  const supabase = createClient()
  const { user } = useAuth()
  const [attendees, setAttendees] = useState<any[]>([])
  const [showNS, setShowNS]       = useState(false)

  const loadAttendees = async () => {
    const { data } = await supabase.from('gathering_attendees')
      .select('*, profile:profiles(id, username)')
      .eq('gathering_id', gathering.id)
      .eq('status', 'dolazim')
    if (data) setAttendees(data)
    setShowNS(true)
  }

  const markNoShow = async (userId: string) => {
    const res = await fetch(`/api/gatherings/${gathering.id}/no-show`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_ids: [userId] }),
    })
    if (res.ok) {
      toast.success('No-show zabeležen')
      setAttendees(prev => prev.filter(a => a.user_id !== userId))
      onRefresh()
    }
  }

  return (
    <div className="bg-[#161618] border border-[rgba(255,255,255,.07)] rounded-xl p-3">
      <Link href={`/courts/${gathering.court_id}`}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="font-display font-black text-orange-500 text-xs leading-none">
              {new Date(gathering.gathering_time).toLocaleTimeString('sr', {hour:'2-digit',minute:'2-digit'})}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold line-clamp-1">{gathering.title}</p>
            {(gathering.court as any)?.name && (
              <p className="text-[#555] text-xs">{(gathering.court as any).name}</p>
            )}
            <p className="text-[#444] text-xs mt-0.5">{formatGatheringTime(gathering.gathering_time)}</p>
          </div>
          <span className="text-[10px] bg-orange-500/10 text-orange-500 px-2 py-1 rounded-lg flex-shrink-0 font-medium">
            {(gathering.attendees_count ?? 0)} igrača
          </span>
        </div>
      </Link>
      {isPast && (
        <div className="mt-2 pt-2 border-t border-[rgba(255,255,255,.05)]">
          {!showNS ? (
            <button onClick={loadAttendees}
              className="text-xs text-[#555] hover:text-red-400 flex items-center gap-1.5 transition-colors">
              <UserX className="w-3.5 h-3.5"/> Označi no-show
            </button>
          ) : (
            <div>
              <p className="text-xs text-[#555] mb-2">Ko se nije pojavio?</p>
              {attendees.length === 0 ? (
                <p className="text-xs text-[#444]">Nema igrača za označiti</p>
              ) : attendees.map(a => (
                <div key={a.user_id} className="flex items-center justify-between py-1">
                  <span className="text-sm text-white">@{a.profile?.username}</span>
                  <button onClick={() => markNoShow(a.user_id)}
                    className="text-xs text-red-400 border border-red-500/25 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-all">
                    No-show
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EmptyState({ icon, text, ctaLabel, ctaHref }: { icon: React.ReactNode; text: string; ctaLabel: string; ctaHref: string }) {
  return (
    <div className="py-12 flex flex-col items-center gap-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#161618] border border-[rgba(255,255,255,.07)] flex items-center justify-center">{icon}</div>
      <p className="text-[#555] text-sm">{text}</p>
      <Link href={ctaHref} className="bg-orange-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl" style={{boxShadow:'0 3px 14px rgba(255,107,0,.3)'}}>
        {ctaLabel}
      </Link>
    </div>
  )
}
