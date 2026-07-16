'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/layout/AuthProvider'
import { Lock, Eye, EyeOff, ChevronLeft, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ChangePasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const { user } = useAuth()

  const [current, setCurrent] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-5 text-center">
        <p className="text-court-text">Moraš biti prijavljen</p>
        <Link href="/auth/login" className="bg-orange-500 text-white font-semibold px-6 py-3 rounded-xl">Prijavi se</Link>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!current) { toast.error('Unesi trenutnu lozinku'); return }
    if (password.length < 6) { toast.error('Nova lozinka mora imati bar 6 karaktera'); return }
    if (password === current) { toast.error('Nova lozinka mora biti drugačija od trenutne'); return }
    if (password !== confirm) { toast.error('Lozinke se ne poklapaju'); return }

    setLoading(true)

    // 1) Proveri trenutnu lozinku (re-login sa istim emailom)
    const { error: verifyErr } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: current,
    })
    if (verifyErr) {
      setLoading(false)
      toast.error('Trenutna lozinka nije tačna')
      return
    }

    // 2) Postavi novu
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      toast.error(error.message || 'Greška pri promeni lozinke')
      return
    }
    setDone(true)
    toast.success('Lozinka je promenjena! 🏀')
    setTimeout(() => router.push('/profile'), 1500)
  }

  if (done) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-5 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-5">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="font-display font-black text-2xl uppercase text-white">Gotovo!</h2>
        <p className="text-court-text text-sm mt-2">Lozinka je uspešno promenjena.</p>
      </div>
    )
  }

  const inputWrap = 'relative'
  const inputCls = 'w-full bg-court-card border border-court-border rounded-xl px-4 py-3 pl-10 pr-10 text-white placeholder-court-text2 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/20 transition-all'

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col px-5 pt-6 pb-6 animate-fade-in">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-court-text text-sm mb-6 w-fit hover:text-white transition-colors">
        <ChevronLeft className="w-4 h-4" /> Nazad
      </button>

      <div className="mb-8">
        <h1 className="font-display font-black text-2xl uppercase tracking-wide text-white">Promeni lozinku</h1>
        <p className="text-court-text text-sm mt-1">Prvo potvrdi trenutnu, pa unesi novu</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-xs text-court-text uppercase tracking-widest font-semibold mb-2 block">Trenutna lozinka</label>
          <div className={inputWrap}>
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-court-text2" />
            <input type={showPass ? 'text' : 'password'} value={current}
              onChange={(e) => setCurrent(e.target.value)} placeholder="••••••••"
              required autoComplete="current-password" className={inputCls} />
          </div>
        </div>

        <div>
          <label className="text-xs text-court-text uppercase tracking-widest font-semibold mb-2 block">Nova lozinka</label>
          <div className={inputWrap}>
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-court-text2" />
            <input type={showPass ? 'text' : 'password'} value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="Bar 6 karaktera"
              required autoComplete="new-password" className={inputCls} />
            <button type="button" onClick={() => setShowPass(s => !s)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-court-text2">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs text-court-text uppercase tracking-widest font-semibold mb-2 block">Potvrdi novu lozinku</label>
          <div className={inputWrap}>
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-court-text2" />
            <input type={showPass ? 'text' : 'password'} value={confirm}
              onChange={(e) => setConfirm(e.target.value)} placeholder="Ponovi novu lozinku"
              required autoComplete="new-password" className={inputCls} />
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl text-sm mt-2 transition-all active:scale-95 disabled:opacity-50">
          {loading ? 'Čuvam...' : 'Promeni lozinku'}
        </button>
      </form>
    </div>
  )
}
