'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/layout/AuthProvider'
import { Shield, Check, X, Trash2, MapPin, Plus } from 'lucide-react'
import { formatGatheringTime, formatRelativeTime, cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
const LocationPicker = dynamic(() => import('@/components/map/LocationPicker'), { ssr: false })

type AdminTab = 'suggestions' | 'courts' | 'gatherings' | 'users'

const inputClass = "w-full bg-court-bg border border-court-border rounded-xl px-4 py-2.5 text-white placeholder-court-text2 text-sm focus:outline-none focus:border-orange-500/60 transition-all"

const SURFACES = ['asfalt', 'beton', 'parket', 'guma', 'zemlja']

const emptyNewCourt = { name: '', address: '', lat: '', lng: '', surface: 'asfalt', hoops_count: '2', is_outdoor: true }

export default function AdminPage() {
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<AdminTab>('suggestions')
  const [data, setData] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newCourt, setNewCourt] = useState(emptyNewCourt)
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null)
  const [editingLatLng, setEditingLatLng] = useState<{ lat: number; lng: number } | null>(null)
  const [editingAddress, setEditingAddress] = useState('')

  useEffect(() => {
    if (!authLoading && profile && !profile.is_admin) { router.push('/'); return }
    if (profile?.is_admin) fetchAll()
  }, [profile, authLoading])

  const fetchAll = async () => {
    setLoading(true)
    const res = await fetch('/api/admin')
    const json = await res.json()
    setData(json)
    setLoading(false)
  }

  const handleSuggestion = async (id: string, action: 'approve' | 'reject') => {
    const res = await fetch('/api/admin/suggestions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    })
    if (res.ok) { toast.success(action === 'approve' ? 'Teren odobren!' : 'Predlog odbijen'); fetchAll() }
    else toast.error('Greška')
  }

  const handleDeleteGathering = async (id: string) => {
    if (!confirm('Obrisati okupljanje?')) return
    const res = await fetch('/api/admin/gatherings', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) { toast.success('Obrisano'); fetchAll() }
    else toast.error('Greška')
  }

  const handleUpdateCourtLocation = async (id: string) => {
    if (!editingLatLng) { toast.error('Klikni na mapi da izabereš lokaciju'); return }
    const res = await fetch('/api/admin/courts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, lat: editingLatLng.lat, lng: editingLatLng.lng, address: editingAddress.trim() }),
    })
    if (res.ok) {
      toast.success('Teren ažuriran!')
      setEditingLocationId(null)
      setEditingLatLng(null)
      setEditingAddress('')
      fetchAll()
    } else toast.error('Greška')
  }

  const handleDeleteCourt = async (id: string) => {
    if (!confirm('Obrisati teren?')) return
    const res = await fetch('/api/admin/courts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) { toast.success('Teren obrisan'); fetchAll() }
    else toast.error('Greška')
  }

  const handleAddCourt = async () => {
    if (!newCourt.name.trim() || !newCourt.address.trim()) { toast.error('Unesi naziv i adresu'); return }
    const lat = parseFloat(newCourt.lat)
    const lng = parseFloat(newCourt.lng)
    if (Number.isNaN(lat) || Number.isNaN(lng)) { toast.error('Nevalidne koordinate'); return }

    const res = await fetch('/api/admin/courts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newCourt.name.trim(),
        address: newCourt.address.trim(),
        lat, lng,
        surface: newCourt.surface,
        hoops_count: parseInt(newCourt.hoops_count) || 2,
        is_outdoor: newCourt.is_outdoor,
      }),
    })
    if (res.ok) {
      toast.success('Teren dodat!')
      setShowAdd(false)
      setNewCourt(emptyNewCourt)
      fetchAll()
    } else {
      const json = await res.json().catch(() => ({}))
      toast.error(json.error || 'Greška')
    }
  }

  // Wait for auth to resolve before judging admin status — otherwise a
  // legitimate admin sees a flash of "Pristup zabranjen" on every refresh
  // while their profile is still loading.
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-court-muted border-t-orange-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile?.is_admin) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-5 text-center gap-4">
      <Shield className="w-12 h-12 text-court-text2" />
      <p className="text-white font-bold text-lg">Pristup zabranjen</p>
    </div>
  )

  const pending = (data.suggestions ?? []).filter((s: any) => s.status === 'pending').length

  const TABS: { key: AdminTab; label: string; count?: number }[] = [
    { key: 'suggestions', label: 'Predlozi', count: pending },
    { key: 'courts', label: 'Tereni', count: data.courts?.length },
    { key: 'gatherings', label: 'Igre', count: data.gatherings?.length },
    { key: 'users', label: 'Korisnici', count: data.users?.length },
  ]

  return (
    <div className="flex flex-col animate-fade-in">
      <div className="px-5 pt-6 pb-4 border-b border-court-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-500/10 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-orange-500" />
          </div>
          <h1 className="font-display font-black text-3xl uppercase tracking-tight">Admin Panel</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-court-border overflow-x-auto no-scrollbar">
        {TABS.map(({ key, label, count }) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn('flex-1 min-w-[80px] py-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all whitespace-nowrap px-2',
              tab === key ? 'border-orange-500 text-orange-500' : 'border-transparent text-court-text')}>
            {label}
            {count !== undefined && count > 0 && (
              <span className={cn('w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold',
                tab === key ? 'bg-orange-500 text-white' : 'bg-court-muted text-court-text')}>
                {count > 9 ? '9+' : count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="px-5 py-4 flex flex-col gap-3">
        {loading && <div className="py-8 flex justify-center"><div className="w-6 h-6 border-2 border-court-muted border-t-orange-500 rounded-full animate-spin" /></div>}

        {/* SUGGESTIONS */}
        {!loading && tab === 'suggestions' && (
          <>
            {(data.suggestions ?? []).length === 0 && <Empty text="Nema predloga" />}
            {(data.suggestions ?? []).map((s: any) => (
              <div key={s.id} className={cn('bg-court-card border border-court-border rounded-xl p-4', s.status !== 'pending' && 'opacity-50')}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-white text-sm">{s.name}</p>
                    <p className="text-court-text text-xs">{s.address}</p>
                    <p className="text-court-text2 text-xs">📍 {s.lat?.toFixed(4)}, {s.lng?.toFixed(4)}</p>
                    <p className="text-court-text2 text-xs">{s.is_outdoor ? '☀️ Otvoreni' : '🏢 Zatvoreni'} · {s.surface}</p>
                    {s.description && <p className="text-court-text text-xs mt-1">{s.description}</p>}
                    <p className="text-court-text2 text-[10px] mt-1">od @{s.profile?.username} · {formatRelativeTime(s.created_at)}</p>
                  </div>
                  <span className={cn('text-[10px] px-2 py-1 rounded-full font-semibold flex-shrink-0',
                    s.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' : s.status === 'approved' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400')}>
                    {s.status === 'pending' ? 'Na čekanju' : s.status === 'approved' ? 'Odobren' : 'Odbijen'}
                  </span>
                </div>
                {s.status === 'pending' && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => handleSuggestion(s.id, 'approve')}
                      className="flex-1 py-2 bg-green-500/10 border border-green-500/25 text-green-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-green-500/20 transition-all">
                      <Check className="w-3.5 h-3.5" /> Odobri
                    </button>
                    <button onClick={() => handleSuggestion(s.id, 'reject')}
                      className="flex-1 py-2 bg-red-500/10 border border-red-500/25 text-red-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-red-500/20 transition-all">
                      <X className="w-3.5 h-3.5" /> Odbij
                    </button>
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {/* COURTS */}
        {!loading && tab === 'courts' && (
          <>
            <button onClick={() => setShowAdd(!showAdd)}
              className="w-full py-3 bg-orange-500/10 border border-orange-500/25 text-orange-500 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-orange-500/20 transition-all">
              {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showAdd ? 'Zatvori' : 'Dodaj novi teren'}
            </button>
            {showAdd && (
              <div className="bg-court-card border border-court-border rounded-xl p-4 flex flex-col gap-3">
                <p className="text-xs text-court-text uppercase tracking-widest font-semibold">Novi teren</p>
                <input type="text" placeholder="Naziv" value={newCourt.name}
                  onChange={e => setNewCourt(prev => ({ ...prev, name: e.target.value }))} className={inputClass} />
                <input type="text" placeholder="Adresa" value={newCourt.address}
                  onChange={e => setNewCourt(prev => ({ ...prev, address: e.target.value }))} className={inputClass} />
                <LocationPicker
                  lat={newCourt.lat ? parseFloat(newCourt.lat) : null}
                  lng={newCourt.lng ? parseFloat(newCourt.lng) : null}
                  onChange={(lat, lng) => setNewCourt(prev => ({ ...prev, lat: lat.toString(), lng: lng.toString() }))}
                />

                {/* Outdoor/Indoor toggle — previously missing, defaults silently applied */}
                <div className="grid grid-cols-2 gap-2">
                  {[{ v: true, l: '☀️ Otvoreni' }, { v: false, l: '🏢 Zatvoreni' }].map(({ v, l }) => (
                    <button key={String(v)} type="button" onClick={() => setNewCourt(prev => ({ ...prev, is_outdoor: v }))}
                      className={cn('py-2.5 rounded-xl border text-sm font-medium transition-all',
                        newCourt.is_outdoor === v ? 'border-orange-500 bg-orange-500/10 text-orange-500' : 'border-court-border text-court-text')}>
                      {l}
                    </button>
                  ))}
                </div>

                {/* Surface selector — previously missing */}
                <div className="grid grid-cols-3 gap-1.5">
                  {SURFACES.map(s => (
                    <button key={s} type="button" onClick={() => setNewCourt(prev => ({ ...prev, surface: s }))}
                      className={cn('py-2 rounded-lg border text-xs font-medium transition-all capitalize',
                        newCourt.surface === s ? 'border-orange-500 bg-orange-500/10 text-orange-500' : 'border-court-border text-court-text')}>
                      {s}
                    </button>
                  ))}
                </div>

                <input type="text" placeholder="Broj koševa" value={newCourt.hoops_count}
                  onChange={e => setNewCourt(prev => ({ ...prev, hoops_count: e.target.value }))} className={inputClass} />

                <button onClick={handleAddCourt} className="h-10 bg-orange-500 text-white font-semibold rounded-xl text-sm">Sačuvaj teren</button>
              </div>
            )}
            {(data.courts ?? []).length === 0 && <Empty text="Nema terena" />}
            {(data.courts ?? []).map((c: any) => (
              <div key={c.id} className="bg-court-card border border-court-border rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm">{c.name}</p>
                    <p className="text-court-text text-xs truncate">{c.address}</p>
                    <p className="text-court-text2 text-[10px] mt-0.5">{c.surface} · {c.hoops_count} koša · {c.is_outdoor ? 'Outdoor' : 'Indoor'}</p>
                    <p className="text-court-text2 text-[10px] mt-0.5">📍 {c.lat?.toFixed(5)}, {c.lng?.toFixed(5)}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (editingLocationId === c.id) { setEditingLocationId(null); setEditingLatLng(null) }
                      else { setEditingLocationId(c.id); setEditingLatLng({ lat: c.lat, lng: c.lng }); setEditingAddress(c.address ?? '') }
                    }}
                    className={cn('w-8 h-8 flex items-center justify-center rounded-lg transition-all flex-shrink-0',
                      editingLocationId === c.id ? 'text-orange-500 bg-orange-500/10' : 'text-court-text2 hover:text-orange-500 hover:bg-orange-500/10')}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDeleteCourt(c.id)} className="w-8 h-8 flex items-center justify-center text-court-text2 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {editingLocationId === c.id && (
                  <div className="flex flex-col gap-2 pt-1 border-t border-court-border">
                    <input
                      type="text"
                      placeholder="Tačna adresa (npr. Medak park, Beograd)"
                      value={editingAddress}
                      onChange={(e) => setEditingAddress(e.target.value)}
                      className={inputClass}
                    />
                    <LocationPicker
                      lat={editingLatLng?.lat ?? c.lat}
                      lng={editingLatLng?.lng ?? c.lng}
                      onChange={(lat, lng) => setEditingLatLng({ lat, lng })}
                    />
                    <button onClick={() => handleUpdateCourtLocation(c.id)} className="h-9 bg-orange-500 text-white font-semibold rounded-xl text-sm">
                      Sačuvaj izmene
                    </button>
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {/* GATHERINGS */}
        {!loading && tab === 'gatherings' && (
          <>
            {(data.gatherings ?? []).length === 0 && <Empty text="Nema okupljenosti" />}
            {(data.gatherings ?? []).map((g: any) => (
              <div key={g.id} className="bg-court-card border border-court-border rounded-xl p-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm line-clamp-1">{g.title}</p>
                  <p className="text-court-text text-xs">{g.court?.name}</p>
                  <p className="text-court-text text-xs">{formatGatheringTime(g.gathering_time)}</p>
                  <p className="text-court-text2 text-[10px] mt-0.5">od @{g.creator?.username}</p>
                </div>
                <button onClick={() => handleDeleteGathering(g.id)} className="w-8 h-8 flex items-center justify-center text-court-text2 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </>
        )}

        {/* USERS */}
        {!loading && tab === 'users' && (
          <>
            {(data.users ?? []).length === 0 && <Empty text="Nema korisnika" />}
            {(data.users ?? []).map((u: any) => (
              <div key={u.id} className="bg-court-card border border-court-border rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center font-display font-black text-orange-500 text-lg flex-shrink-0">
                  {(u.username?.[0] ?? '?').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm">@{u.username}</p>
                  <p className="text-court-text text-xs">{u.full_name}</p>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-[10px] text-green-400">✓ {u.reputation?.[0]?.arrivals_count ?? 0}</span>
                    <span className="text-[10px] text-red-400">✗ {u.reputation?.[0]?.no_show_count ?? 0}</span>
                    <span className="text-[10px] text-court-text">⭐ {u.reputation?.[0]?.reputation_score ?? 100}%</span>
                    {u.is_admin && <span className="text-[10px] bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded-full flex items-center gap-1"><Shield className="w-2.5 h-2.5" /> Admin</span>}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <div className="py-8 text-center text-court-text text-sm">{text}</div>
}
