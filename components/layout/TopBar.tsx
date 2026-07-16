'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, BellDot } from 'lucide-react'
import { useAuth } from './AuthProvider'
import { createClient } from '@/lib/supabase'
import PlayerAvatar from '@/components/ui/PlayerAvatar'

export default function TopBar() {
  const { user, profile } = useAuth()
  const [unread, setUnread] = useState(0)
  const pathname = usePathname()
  const supabase = createClient()

  // Refetch whenever the route changes (e.g. after visiting /notifications
  // and marking everything read) so the badge doesn't stay stale until a
  // full page reload — previously it only ever fetched once on mount.
  useEffect(() => {
    if (!user) { setUnread(0); return }
    const fetchUnread = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
      setUnread(count ?? 0)
    }
    fetchUnread()
  }, [user, pathname])

  return (
    <header className="fixed top-0 left-0 right-0 z-[1100] max-w-md mx-auto">
      <div className="flex items-center justify-between px-4 h-14 bg-court-bg/95 backdrop-blur-sm border-b border-court-border">
        <Link href="/" className="flex items-center gap-2">
          <img src="/brand/crosscourt-mark-dark.png" alt="CrossCourt" className="w-8 h-8 object-contain flex-shrink-0" />
          <span className="font-display font-black text-xl tracking-wider uppercase leading-none">
            Cross<span className="text-orange-500">Court</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/notifications" className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-court-card transition-colors">
                {unread > 0 ? (
                  <>
                    <BellDot className="w-5 h-5 text-orange-500" />
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-orange-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  </>
                ) : (
                  <Bell className="w-5 h-5 text-court-text" />
                )}
              </Link>
              <Link href="/profile" className="flex-shrink-0">
                <PlayerAvatar
                  url={profile?.avatar_url}
                  fullName={profile?.full_name}
                  username={profile?.username}
                  size={32}
                  className="border border-white/10"
                />
              </Link>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="text-xs font-semibold px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
            >
              Prijavi se
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
