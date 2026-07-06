'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/layout/AuthProvider'
import type { Court } from '@/types'
import { MapPin, Clock, Users, AlignLeft, ChevronDown, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const QUICK_TEXTS = [
  'Basket večeras, svi dobrodošli!',
  'Pikap — treba nam ekipa!',
  'Igra se, dolazite!',
  '3 na 3, tražimo igrače',
  'Jutarnji basket, osvežavajuće!',
]
const QUICK_TIMES = ['08:00','10:00','16:00','17:00','18:00','19:00','20:00','21:00']

const inputClass = "w-full bg-[#161618] border border-[rgba(255,255,255,.07)] rounded-xl px-4 py-3 text-white placeholder-[#444] text-sm focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/20 transition-all"

export default function NewGatheringPage() {
  const { user } = useAuth()
  const router   = useRouter()
  const supabase = createClient()

  const [courts, setCourts]           = useState<Court[]>([])
  const [selectedCourt, setSelected]  = useState<Court | null>(null)
  const [showDropdown, setDropdown]   = useState(false)
  const [title, setTitle]             = useState('')
  const [date, setDate]               = useState(new Date().toISOString().split('T')[0])
  const [time, setTime]               = useState('18:00')
  const [maxPlayers, setMaxPlayers]   = useState('')
  const [gameType, setGameType]       = useState<'3x3'|'3na3'|'5x5'|'slobodan'>('5x5')
  const [level, setLevel]             = useState<'rekreativno'|'srednji'|'jak'>('rekreativno')
  const [loading, setLoading]         = useState(false)

  useEffect(() => {
    supabase.from('courts').select('*').eq('is_approved', true).order('name')
      .then(({ data }) => { if (data) setCourts(data) })
  }, [])

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-5 text-center">
        <p className="text-[#666]">Moraš biti prijavljen da zakažeš igru</p>
        <Link href="/auth/login" className="bg-orange-500 text-white font-semibold px-6 py-3 rounded-xl">Prijavi se</Link>
      </div>
    )
  }

  const handleSubmit = async () => {
    if (!selectedCourt || !title || !time) { toast.error('Popuni sva polja'); return }
    setLoading(true)
    const gatheringTime = new Date(`${date}T${time}:00`)

    const res = await fetch('/api/gatherings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        court_id: selectedCourt.id,
        title, gathering_time: gatheringTime.toISOString(),
        max_players: maxPlayers ? parseInt(maxPlayers) : null,
        game_type: gameType, level,
      }),
    })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error || 'Greška'); setLoading(false); return }
    toast.success('Igra zakazana! 🏀')
    router.push(`/courts/${selectedCourt.id}`)
  }

  return (
    <div className="flex flex-col animate-fade-in pb-8">
      <div className="px-5 pt-6 pb-4 border-b border-[#1a1a1a]">
        <h1 className="font-display font-black text-3xl uppercase tracking-tight leading-none">
          Zakaži <span className="text-orange-500">igru</span>
        </h1>
        <p className="text-[#555] text-sm mt-1">Objavi kad i gde se igra večeras</p>
      </div>

      <div className="px-5 py-5 flex flex-col gap-6">

        {/* Court picker */}
        <div>
          <Label icon={<MapPin className="w-4 h-4"/>} text="Teren" required/>
          <div className="relative">
            <button onClick={() => setDropdown(!showDropdown)}
              className={cn(inputClass, 'flex items-center justify-between text-left', !selectedCourt && 'text-[#444]')}>
              <span>{selectedCourt ? selectedCourt.name : 'Izaberi teren...'}</span>
              <ChevronDown className={cn('w-4 h-4 transition-transform text-[#444]', showDropdown && 'rotate-180')}/>
            </button>
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-[#1c1c1f] border border-[rgba(255,255,255,.1)] rounded-xl overflow-hidden shadow-2xl max-h-60 overflow-y-auto">
                {courts.map(c => (
                  <button key={c.id} onClick={() => { setSelected(c); setDropdown(false) }}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-[#242428] transition-colors flex items-center gap-3 border-b border-[rgba(255,255,255,.05)] last:border-0">
                    <div className={cn('w-2 h-2 rounded-full flex-shrink-0', selectedCourt?.id === c.id ? 'bg-orange-500' : 'bg-[#333]')}/>
                    <div>
                      <p className="text-white font-medium">{c.name}</p>
                      <p className="text-[#555] text-xs">{c.address}</p>
                    </div>
                    {selectedCourt?.id === c.id && <Check className="w-4 h-4 text-orange-500 ml-auto"/>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <Label icon={<AlignLeft className="w-4 h-4"/>} text="Poruka" required/>
          <div className="flex flex-wrap gap-2 mb-3">
            {QUICK_TEXTS.map(t => (
              <button key={t} onClick={() => setTitle(t)}
                className={cn('text-xs px-3 py-1.5 rounded-lg border transition-all',
                  title === t
                    ? 'border-orange-500/50 bg-orange-500/10 text-orange-500'
                    : 'border-[rgba(255,255,255,.07)] text-[#555] hover:border-[rgba(255,255,255,.15)] hover:text-white')}>
                {t}
              </button>
            ))}
          </div>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Ili napiši svoju poruku..." maxLength={120} className={inputClass}/>
        </div>

        {/* Date + Time */}
        <div>
          <Label icon={<Clock className="w-4 h-4"/>} text="Datum i vreme" required/>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]} className={inputClass + ' mb-3'}/>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {QUICK_TIMES.map(t => (
              <button key={t} onClick={() => setTime(t)}
                className={cn('py-2 rounded-xl text-sm border transition-all font-medium',
                  time === t
                    ? 'border-orange-500 bg-orange-500 text-white'
                    : 'border-[rgba(255,255,255,.07)] text-[#555] hover:border-[rgba(255,255,255,.15)]')}>
                {t}
              </button>
            ))}
          </div>
          <input type="time" value={time} onChange={e => setTime(e.target.value)} className={inputClass + ' text-sm'}/>
        </div>

        {/* Game type */}
        <div>
          <Label icon={<Users className="w-4 h-4"/>} text="Tip igre"/>
          <div className="grid grid-cols-4 gap-2">
            {(['3x3','3na3','5x5','slobodan'] as const).map(t => (
              <button key={t} onClick={() => setGameType(t)}
                className={cn('py-2.5 rounded-xl text-sm border transition-all font-medium',
                  gameType === t ? 'border-orange-500 bg-orange-500/10 text-orange-500' : 'border-[rgba(255,255,255,.07)] text-[#555]')}>
                {t === 'slobodan' ? 'Slobodno' : t === '3na3' ? '3 na 3' : t}
              </button>
            ))}
          </div>
        </div>

        {/* Level */}
        <div>
          <Label icon={<span className="text-sm">⭐</span>} text="Nivo"/>
          <div className="grid grid-cols-3 gap-2">
            {[{v:'rekreativno',l:'🏀 Rekre.'},{v:'srednji',l:'⭐ Srednji'},{v:'jak',l:'🔥 Jak'}].map(({v,l}) => (
              <button key={v} onClick={() => setLevel(v as any)}
                className={cn('py-2.5 rounded-xl text-xs border transition-all font-medium',
                  level === v ? 'border-orange-500 bg-orange-500/10 text-orange-500' : 'border-[rgba(255,255,255,.07)] text-[#555]')}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Max players */}
        <div>
          <Label icon={<Users className="w-4 h-4"/>} text="Maks. igrača (opciono)"/>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {[6,8,10,12].map(n => (
              <button key={n} onClick={() => setMaxPlayers(maxPlayers === String(n) ? '' : String(n))}
                className={cn('py-2 rounded-xl text-sm border transition-all font-medium',
                  maxPlayers === String(n) ? 'border-orange-500 bg-orange-500 text-white' : 'border-[rgba(255,255,255,.07)] text-[#555]')}>
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        {selectedCourt && title && (
          <div className="bg-[#161618] border border-[rgba(255,255,255,.07)] rounded-xl p-4">
            <p className="text-xs text-[#555] uppercase tracking-widest mb-3 font-semibold">Pregled</p>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/20 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                <span className="font-display font-black text-orange-500 text-base leading-none">{time}</span>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{title}</p>
                <p className="text-[#555] text-xs mt-0.5">{selectedCourt.name}</p>
                <div className="flex gap-1.5 mt-1.5">
                  <span className="text-[10px] bg-[#242428] text-[#888] px-2 py-0.5 rounded-full">{gameType === 'slobodan' ? 'Slobodno' : gameType === '3na3' ? '3 na 3' : gameType}</span>
                  <span className="text-[10px] bg-[#242428] text-[#888] px-2 py-0.5 rounded-full">{level}</span>
                  {maxPlayers && <span className="text-[10px] bg-[#242428] text-[#888] px-2 py-0.5 rounded-full">max {maxPlayers}</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading || !selectedCourt || !title}
          className="h-[52px] w-full bg-orange-500 hover:bg-orange-400 active:scale-95 text-white font-semibold rounded-xl transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-40"
          style={{boxShadow:'0 3px 14px rgba(255,107,0,.3)'}}>
          {loading
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Zakazujem...</>
            : '🏀 Zakaži i prisustvujem'}
        </button>
      </div>
    </div>
  )
}

function Label({ icon, text, required }: { icon: React.ReactNode; text: string; required?: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <span className="text-orange-500">{icon}</span>
      <span className="text-xs text-[#555] uppercase tracking-widest font-semibold">{text}</span>
      {required && <span className="text-orange-500 text-xs">*</span>}
    </div>
  )
}
