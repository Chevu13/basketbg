'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

/**
 * Neki stariji (ili keširani) reset-lozinke mejlovi mogu da sadrže redirect_to
 * bez tačne putanje (npr. samo https://crosscourt.rs umesto .../auth/reset-password).
 * Umesto da se oslanjamo na to da je redirect_to uvek tačan, ovaj guard radi na
 * SVAKOJ stranici: ako prepozna recovery token (u URL-u ili kao aktivan
 * PASSWORD_RECOVERY event), odmah prebacuje na pravu formu za novu lozinku,
 * bez obzira gde je korisnik sleteo.
 */
export default function AuthRecoveryGuard() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (pathname === '/auth/reset-password') return // već smo tu, ništa ne radi

    const hash = window.location.hash
    const search = window.location.search
    const hasRecoveryParam =
      hash.includes('type=recovery') ||
      search.includes('type=recovery') ||
      hash.includes('error_code=otp_expired') ||
      search.includes('error_code=otp_expired')

    if (hasRecoveryParam) {
      router.replace(`/auth/reset-password${search}${hash}`)
      return
    }

    // Dodatna mreža: ako je Supabase iz nekog razloga već obradio recovery
    // token pre nego što smo stigli da proverimo URL, i dalje emituje
    // PASSWORD_RECOVERY event — uhvati i njega.
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' && pathname !== '/auth/reset-password') {
        router.replace('/auth/reset-password')
      }
    })
    return () => subscription.unsubscribe()
  }, [pathname])

  return null
}
