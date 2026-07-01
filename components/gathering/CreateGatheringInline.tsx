'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/layout/AuthProvider'
import { Clock, Users, MessageSquare } from 'lucide-react'

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

export default function CreateGatheringInline({ courtId, onSuccess }: Props) {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [maxPlayers, setMaxPlayers] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async () => {
    if (!title || !time || !user) return
    setLoading(true)
    const gatheringTime = new Date(`${date}T${time}:00`)
    await supabase.from('gatherings').insert({
      court_id: courtId,
      created_by: user.id,
      title,
      gathering_time: gatheringTime.toISOString(),
      max_players: maxPlayers ? parseInt(maxPlayers) : null,
    })
    // Auto-attend
    const { data: g } = await supabase
      .from('gatherings')
      .select('id')
      .eq('court_id', courtId)
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    if (g) {
      await supabase.from('gathering_attendees').insert({
        gathering_id: g.id,
        user_id: user.id,
        status: 'dolazim',
      })
      await supabase.rpc('increment_arrivals', { uid: user.id }).catch(() => {})
    }
    setLoading(false)
    onSuccess()
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
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                title === t
                  ? 'border-orange-500/50 bg-orange-500/10 text-orange-500'
                  : 'border-court-border text-court-text hover:border-orange-500/30'
              }`}
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
                className={`flex-1 text-xs py-1.5 rounded-lg border transition-all min-w-[44px] ${
                  time === t
                    ? 'border-orange-500 bg-orange-500 text-white'
                    : 'border-court-border text-court-text hover:border-orange-500/30'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
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
