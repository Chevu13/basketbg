'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Session, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import type { Profile } from '@/types'

const RECOVERY_FLAG = 'cc_pending_recovery'

type AuthContextType = {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const pathname = usePathname()
  const router = useRouter()

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) setProfile(data)
  }

  const refreshProfile = async () => {
    if (session?.user?.id) await fetchProfile(session.user.id)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) fetchProfile(session.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) fetchProfile(session.user.id)
      else setProfile(null)

      // Klik na link iz mejla za reset lozinke uloguje korisnika privremenom
      // (recovery) sesijom. Obeležimo to zastavicom — dok je ne skloni, korisnik
      // sme SAMO na formu za novu lozinku, ne sme da luta po ostatku aplikacije
      // sa tom privremenom sesijom.
      if (_event === 'PASSWORD_RECOVERY') {
        sessionStorage.setItem(RECOVERY_FLAG, '1')
        if (window.location.pathname !== '/auth/reset-password') {
          window.location.replace('/auth/reset-password')
        }
      }
      if (_event === 'SIGNED_OUT') {
        sessionStorage.removeItem(RECOVERY_FLAG)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Čuvar rute: dok "recovery" zastavica stoji, svaka navigacija van
  // /auth/reset-password se odmah vraća nazad — tek uspešna promena lozinke
  // (koja sama briše zastavicu) otvara pristup ostatku aplikacije.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const pending = sessionStorage.getItem(RECOVERY_FLAG) === '1'
    if (pending && pathname !== '/auth/reset-password') {
      router.replace('/auth/reset-password')
    }
  }, [pathname])

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}
