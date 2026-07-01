'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MapPin, Home, PlusCircle, User, Shield } from 'lucide-react'
import { useAuth } from './AuthProvider'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', icon: Home, label: 'Početna' },
  { href: '/courts', icon: MapPin, label: 'Tereni' },
  { href: '/gatherings/new', icon: PlusCircle, label: 'Novo', highlight: true },
  { href: '/profile', icon: User, label: 'Profil' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const { profile } = useAuth()

  const items = profile?.is_admin
    ? [...navItems, { href: '/admin', icon: Shield, label: 'Admin' }]
    : navItems

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto safe-bottom">
      <div className="flex items-center justify-around bg-court-card/95 backdrop-blur-md border-t border-court-border px-2 pt-2 pb-safe">
        {items.map(({ href, icon: Icon, label, highlight }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-150 min-w-[52px]',
                highlight
                  ? 'bg-orange-500 -mt-3 shadow-lg shadow-orange-500/30 glow-orange px-4'
                  : active
                  ? 'text-orange-500'
                  : 'text-court-text hover:text-white'
              )}
            >
              <Icon className={cn('w-5 h-5', highlight && 'text-white')} strokeWidth={active && !highlight ? 2.5 : 2} />
              <span className={cn('text-[10px] font-medium', highlight && 'text-white')}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
