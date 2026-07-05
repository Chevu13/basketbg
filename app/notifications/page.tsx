'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/layout/AuthProvider'
import type { Notification } from '@/types'
import { Bell, Calendar, MessageSquare, Users, UserX, MapPin, Trash2 } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const ICON_MAP: Record<string, React.ReactNode> = {
  new_gathering: <Calendar className="w-4 h-4 text-orange-500"/>,
  new_comment:   <MessageSquare className="w-4 h-4 text-blue-400"/>,
  new_attendee:  <Users className="w-4 h-4 text-green-400"/>,
  no_show:       <UserX className="w-4 h-4 text-red-400"/>,
  court_approved:<MapPin className="w-4 h-4 text-orange-500"/>,
}
const BG_MAP: Record<string, string> = {
  new_gathering: 'bg-orange-500/10 border-orange-500/15',
  new_comment:   'bg-blue-500/10 border-blue-500/15',
  new_attendee:  'bg-green-500/10 border-green-500/15',
  no_show:       'bg-red-500/10 border-red-500/15',
  court_approved:'bg-orange-500/10 border-orange-500/15',
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const router   = useRouter()
  const [notifs, setNotifs]   = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return }
    fetchNotifs()
    // Mark all read
    fetch('/api/notifications', { method: 'PATCH' }).catch(() => {})
  }, [user])

  const fetchNotifs = async () => {
    const res = await fetch('/api/notifications')
    const json = await res.json()
    if (json.data) setNotifs(json.data)
    setLoading(false)
  }

  const deleteNotif = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' }).catch(() => {})
    setNotifs(prev => prev.filter(n => n.id !== id))
  }

  const clearAll = async () => {
    await fetch('/api/notifications', { method: 'DELETE' })
    setNotifs([])
    toast.success('Sve obrisano')
  }

  const getLink = (n: Notification) => {
    if (n.related_gathering_id && n.related_court_id) return `/courts/${n.related_court_id}?gathering=${n.related_gathering_id}`
    if (n.related_court_id) return `/courts/${n.related_court_id}`
    return '#'
  }

  const unread = notifs.filter(n => !n.is_read).length

  return (
    <div className="flex flex-col animate-fade-in">
      <div className="px-5 pt-6 pb-4 border-b border-[#1a1a1a]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-black text-3xl uppercase tracking-tight leading-none">
              Obave<span className="text-orange-500">štenja</span>
            </h1>
            {unread > 0 && <p className="text-[#555] text-sm mt-1">{unread} nepročitano{unread !== 1 ? 'h' : ''}</p>}
          </div>
          {notifs.length > 0 && (
            <button onClick={clearAll} className="text-[#555] hover:text-red-400 transition-colors text-xs flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5"/> Obriši sve
            </button>
          )}
        </div>
      </div>

      <div className="px-5 py-4 flex flex-col gap-2">
        {loading ? (
          Array(4).fill(0).map((_,i) => (
            <div key={i} className="h-20 bg-[#161618] rounded-xl animate-pulse"/>
          ))
        ) : notifs.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#161618] border border-[rgba(255,255,255,.07)] flex items-center justify-center">
              <Bell className="w-7 h-7 text-[#444]"/>
            </div>
            <div>
              <p className="font-display font-bold text-xl uppercase text-white">Nema obaveštenja</p>
              <p className="text-[#555] text-sm mt-1">Prati terene da primaš obaveštenja</p>
            </div>
            <Link href="/courts" className="bg-orange-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl" style={{boxShadow:'0 3px 14px rgba(255,107,0,.3)'}}>
              Pronađi terene
            </Link>
          </div>
        ) : notifs.map(n => (
          <div key={n.id} className={cn('relative bg-[#161618] border rounded-xl overflow-hidden transition-all', !n.is_read && 'border-l-2 border-l-orange-500 border-[rgba(255,255,255,.07)]', n.is_read && 'border-[rgba(255,255,255,.07)]')}>
            <Link href={getLink(n)}>
              <div className="flex items-start gap-3 p-4 pr-12">
                <div className={cn('w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 mt-0.5', BG_MAP[n.type] ?? 'bg-[#242428] border-[rgba(255,255,255,.07)]')}>
                  {ICON_MAP[n.type] ?? <Bell className="w-4 h-4 text-[#555]"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm leading-snug', n.is_read ? 'text-[#888]' : 'text-white font-semibold')}>
                    {n.title}
                  </p>
                  {n.body && <p className="text-[#555] text-xs mt-0.5 line-clamp-2">{n.body}</p>}
                  <p className="text-[#444] text-[10px] mt-1.5">{formatRelativeTime(n.created_at)}</p>
                </div>
              </div>
            </Link>
            <button onClick={e => deleteNotif(n.id, e)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-[#444] hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10">
              <Trash2 className="w-3.5 h-3.5"/>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
