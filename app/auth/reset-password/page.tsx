'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [ready, setReady] = useState(false)      // da li Supabase klijent ima recovery sesiju
  const [expired, setExpired] = useState(false)  // link istekao/nevažeći
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    // 1) Ako je Supabase vratio grešku u URL-u (istekao/iskorišćen link),
    //    odmah prikaži jasno stanje umesto spinera.
    const params = new URLSearchParams(window.location.search || window.location.hash.replace('#', '?'))
    if (params.get('error') || params.get('error_code')) {
      setExpired(true)
      return
    }

    // 2) Kad korisnik stigne sa ispravnog linka, supabase-js iz URL-a
    //    sam uspostavi privremenu sesiju. Sačekamo taj event.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setReady(true)
    })

    // 3) Ako se sesija ne pojavi za 6s, link je gotovo sigurno nevažeći.
    const timeout = setTimeout(() => {
      setReady(r => { if (!r) setExpired(true); return r })
    }, 6000)

    return () => { subscription.unsubscribe(); clearTimeout(timeout) }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) { toast.error('Lozinka mora imati bar 6 karaktera'); return }
    if (password !== confirm) { toast.error('Lozinke se ne poklapaju'); return }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      toast.error(error.message || 'Greška pri promeni lozinke')
      return
    }
    setDone(true)
    toast.success('Lozinka je promenjena! 🏀')
    setTimeout(() => router.push('/'), 1500)
  }

  if (done) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-5 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-5">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="font-display font-black text-2xl uppercase text-white">Gotovo!</h2>
        <p className="text-court-text text-sm mt-2">Lozinka je uspešno promenjena. Prebacujemo te...</p>
      </div>
    )
  }

  if (expired) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-5 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
          <Lock className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="font-display font-black text-2xl uppercase text-white">Link je istekao</h2>
        <p className="text-court-text text-sm mt-2 max-w-xs">
          Link za reset lozinke je istekao ili je već iskorišćen. Zatraži nov — stiže za par sekundi.
        </p>
        <Link
          href="/auth/forgot-password"
          className="mt-6 h-12 px-8 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl text-sm flex items-center transition-all active:scale-95"
        >
          Pošalji mi nov link
        </Link>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-5 text-center">
        <div className="w-6 h-6 border-2 border-court-muted border-t-orange-500 rounded-full animate-spin mb-4" />
        <p className="text-court-text text-sm max-w-xs">Proveravamo link za resetovanje lozinke...</p>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col px-5 pt-10 pb-6 animate-fade-in">
      <div className="flex flex-col items-center mb-10">
        <div className="w-14 h-14 flex items-center justify-center mb-4">
          <img src="/brand/crosscourt-mark-dark.png" alt="CrossCourt" className="w-14 h-14 object-contain" />
        </div>
        <h1 className="font-display font-black text-2xl uppercase tracking-wide">Nova lozinka</h1>
        <p className="text-court-text text-sm mt-1">Unesi novu lozinku za svoj nalog</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-xs text-court-text uppercase tracking-widest font-semibold mb-2 block">Nova lozinka</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-court-text2" />
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Bar 6 karaktera"
              required
              className="w-full bg-court-card border border-court-border rounded-xl px-4 py-3 pl-10 pr-10 text-white placeholder-court-text2 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/20 transition-all"
            />
            <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-court-text2">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs text-court-text uppercase tracking-widest font-semibold mb-2 block">Potvrdi lozinku</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-court-text2" />
            <input
              type={showPass ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Ponovi lozinku"
              required
              className="w-full bg-court-card border border-court-border rounded-xl px-4 py-3 pl-10 text-white placeholder-court-text2 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/20 transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl text-sm mt-2 transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Čuvam...' : 'Sačuvaj novu lozinku'}
        </button>
      </form>
    </div>
  )
}
