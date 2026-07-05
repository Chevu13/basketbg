'use client'

import { useState } from 'react'
import { useAuth } from '@/components/layout/AuthProvider'
import { Clock, Users, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { GameType } from '@/types'

type Props = {
  courtId: string
  onSuccess: () => void
}

const QUICK_TIMES = ['16:00', '17:00', '18:00', '19:00', '20:00', '21:00']
const QUICK_TEXTS = [
  'Basket danas, svi dobrodošli!',
  'Pikap, dolazite!',
  'Igra se, ekipa se skuplja',
  'Treba nam još igrača',
]
const GAME_TYPES: { v: GameType; l: string }[] = [
  { v: '3x3', l: '3×3' },
  { v: '5x5', l: '5×5' },
  { v: 'slobodan', l: 'Slobodno' },
]

export default function CreateGatheringInline({ courtId, onSuccess }: Props) {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [maxPlayers, setMaxPlayers] = useState('')
  const [gameType, setGameType] = useState<GameType>('5x5')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!title || !time || !user) { toast.error('Popuni sva obavezna polja'); return }
    setLoading(true)
    const gatheringTime = new Date(`${date}T${time}:00`)

    try {
      const res = await fetch('/api/gatherings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          court_id: courtId,
          title,
          gathering_time: gatheringTime.toISOString(),
          max_players: maxPlayers ? parseInt(maxPlayers) : null,
          game_type: gameType,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Greška pri kreiranju')
      toast.success('Okupljanje zakazano! 🏀')
      onSuccess()
    } catch (e: any) {
      toast.error(e.message || 'Greška, pokušaj ponovo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card-dark p-4 border-orange-500/30 flex flex-col gap-4 animate-slide-up">
      {/* Quick texts */}
      <div>
        <p className="text-xs text-court-text mb-2 uppercase tracking-wide font-semibold">Brzi tekst</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_TEXTS.map((t) => (
            <button
              key={t}
              onClick={() => setTitle(t)}
              className={cn(
                'text-xs px-2.5 py-1.5 rounded-lg border transition-all',
                title === t ? 'border-orange-500/50 bg-orange-500/10 text-orange-500' : 'border-court-border text-court-text hover:border-orange-500/30'
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Custom title */}
      <div>
        <p className="text-xs text-court-text mb-1.5 uppercase tracking-wide font-semibold">Ili napiši</p>
        <div className="relative">
          <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-court-text" />
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Basket danas u 18:00..."
            className="input-dark pl-10"
            maxLength={100}
          />
        </div>
      </div>

      {/* Date + Time */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-court-text mb-1.5 uppercase tracking-wide font-semibold">Datum</p>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input-dark"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
        <div>
          <p className="text-xs text-court-text mb-1.5 uppercase tracking-wide font-semibold">Vreme</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TIMES.map((t) => (
              <button
                key={t}
                onClick={() => setTime(t)}
                className={cn(
                  'flex-1 text-xs py-1.5 rounded-lg border transition-all min-w-[44px]',
                  time === t ? 'border-orange-500 bg-orange-500 text-white' : 'border-court-border text-court-text hover:border-orange-500/30'
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Game type */}
      <div>
        <p className="text-xs text-court-text mb-1.5 uppercase tracking-wide font-semibold">Tip igre</p>
        <div className="grid grid-cols-3 gap-1.5">
          {GAME_TYPES.map(({ v, l }) => (
            <button
              key={v}
              onClick={() => setGameType(v)}
              className={cn(
                'text-xs py-1.5 rounded-lg border transition-all font-medium',
                gameType === v ? 'border-orange-500 bg-orange-500/10 text-orange-500' : 'border-court-border text-court-text hover:border-orange-500/30'
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Max players */}
      <div>
        <p className="text-xs text-court-text mb-1.5 uppercase tracking-wide font-semibold">Maks igrača (opciono)</p>
        <div className="relative">
          <Users className="absolute left-3 top-3 w-4 h-4 text-court-text" />
          <input
            type="number"
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(e.target.value)}
            placeholder="10"
            className="input-dark pl-10"
            min={2}
            max={50}
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!title || !time || loading}
        className="btn-orange w-full"
      >
        {loading ? 'Zakazujem...' : '🏀 Zakaži i dolazim'}
      </button>
    </div>
  )
}
