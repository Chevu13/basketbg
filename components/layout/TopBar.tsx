'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, BellDot } from 'lucide-react'
import { useAuth } from './AuthProvider'
import { createClient } from '@/lib/supabase'
import { getInitials } from '@/lib/utils'

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
    <header className="fixed top-0 left-0 right-0 z-50 max-w-md mx-auto">
      <div className="flex items-center justify-between px-4 h-14 bg-court-bg/95 backdrop-blur-sm border-b border-court-border">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
              <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5" />
              <path d="M12 2C9 5.5 9 18.5 12 22" stroke="white" strokeWidth="1.5" fill="none" />
              <path d="M12 2C15 5.5 15 18.5 12 22" stroke="white" strokeWidth="1.5" fill="none" />
              <line x1="2.2" y1="12" x2="21.8" y2="12" stroke="white" strokeWidth="1.5" />
            </svg>
          </div>
          <span className="font-display font-black text-xl tracking-wider uppercase">
            Basket<span className="text-orange-500">BG</span>
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
              <Link href="/profile" className="w-8 h-8 rounded-full bg-court-card2 border border-white/10 flex items-center justify-center flex-shrink-0">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span className="font-display font-bold text-[11px] text-court-text">
                    {getInitials(profile?.full_name, profile?.username ?? '?')}
                  </span>
                )}
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
