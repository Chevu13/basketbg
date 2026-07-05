'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Mail, Lock, Eye, EyeOff, MailCheck } from 'lucide-react'
import toast from 'react-hot-toast'

function LoginForm() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const router       = useRouter()
  const searchParams = useSearchParams()
  const redirect     = searchParams.get('redirect') || '/'
  const supabase     = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message === 'Invalid login credentials'
        ? 'Pogrešan email ili lozinka' : error.message)
    } else {
      toast.success('Dobrodošao nazad! 🏀')
      router.push(redirect)
      router.refresh()
    }
    setLoading(false)
  }

  const handleForgotPassword = async () => {
    if (!email) { toast.error('Prvo unesi svoj email'); return }
    setResetLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/login` : undefined,
    })
    setResetLoading(false)
    if (error) { toast.error(error.message); return }
    setResetSent(true)
  }

  if (resetSent) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-5 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-5">
          <MailCheck className="w-8 h-8 text-orange-500" />
        </div>
        <h2 className="font-display font-black text-2xl uppercase text-white">Proveri email</h2>
        <p className="text-court-text text-sm mt-2 max-w-xs">
          Poslali smo link za reset lozinke na <strong className="text-white">{email}</strong>.
        </p>
        <button onClick={() => setResetSent(false)} className="mt-6 text-orange-500 text-sm font-semibold">Nazad na prijavu</button>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col px-5 pt-10 pb-6 animate-fade-in">
      {/* Logo */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center mb-4"
             style={{ boxShadow: '0 4px 20px rgba(255,107,0,.35)' }}>
          <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
            <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.7" />
            <path d="M12 2C9 5.5 9 18.5 12 22" stroke="white" strokeWidth="1.7" fill="none" />
            <path d="M12 2C15 5.5 15 18.5 12 22" stroke="white" strokeWidth="1.7" fill="none" />
            <line x1="2.2" y1="12" x2="21.8" y2="12" stroke="white" strokeWidth="1.7" />
          </svg>
        </div>
        <h1 className="font-display font-black text-2xl uppercase tracking-wide">
          Basket<span className="text-orange-500">BG</span>
        </h1>
        <p className="text-court-text text-sm mt-1">Prijavi se i pronađi igru</p>
      </div>

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div>
          <label className="text-xs text-court-text uppercase tracking-widest font-semibold mb-2 block">Email</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-court-text2" />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="tvoj@email.com" required autoComplete="email"
              className="w-full bg-court-card border border-court-border rounded-xl px-4 py-3 pl-10 text-white placeholder-court-text2 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/20 transition-all" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-court-text uppercase tracking-widest font-semibold block">Lozinka</label>
            <button type="button" onClick={handleForgotPassword} disabled={resetLoading}
              className="text-xs text-orange-500 font-medium disabled:opacity-50">
              {resetLoading ? 'Šaljem...' : 'Zaboravljena?'}
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-court-text2" />
            <input type={showPass ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required autoComplete="current-password"
              className="w-full bg-court-card border border-court-border rounded-xl px-4 py-3 pl-10 pr-11 text-white placeholder-court-text2 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/20 transition-all" />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-court-text2 hover:text-white transition-colors">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="mt-2 h-12 w-full bg-orange-500 hover:bg-orange-400 active:scale-95 text-white font-semibold rounded-xl transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ boxShadow: '0 3px 14px rgba(255,107,0,.3)' }}>
          {loading
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Prijavljujem...</>
            : 'Prijavi se'}
        </button>
      </form>

      <div className="flex items-center gap-3 my-7">
        <div className="flex-1 h-px bg-court-border" />
        <span className="text-court-text2 text-xs">nemaš nalog?</span>
        <div className="flex-1 h-px bg-court-border" />
      </div>

      <Link href="/auth/register"
        className="w-full h-12 flex items-center justify-center border border-court-border rounded-xl text-sm font-medium text-court-text hover:text-white hover:border-white/20 transition-all">
        Registruj se besplatno
      </Link>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
