'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Mail, Lock, User, AtSign, Eye, EyeOff, MailCheck } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const [fullName, setFullName]   = useState('')
  const [username, setUsername]   = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [usernameErr, setUsernameErr] = useState('')
  const [loading, setLoading]     = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const router   = useRouter()
  const supabase = createClient()

  const validateUsername = (v: string) => {
    if (v.length < 3) return 'Min. 3 karaktera'
    if (!/^[a-z0-9_]+$/.test(v)) return 'Samo mala slova, brojevi i _'
    return ''
  }

  const handleUsername = (v: string) => {
    setUsername(v.toLowerCase())
    setUsernameErr(validateUsername(v.toLowerCase()))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validateUsername(username)
    if (err) { setUsernameErr(err); return }
    if (password.length < 6) { toast.error('Lozinka min. 6 karaktera'); return }

    setLoading(true)

    const { data: existing } = await supabase
      .from('profiles').select('id').eq('username', username).maybeSingle()
    if (existing) { setUsernameErr('Zauzeto'); setLoading(false); return }

    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName, username } },
    })

    if (error) {
      console.error('[CrossCourt] signup error:', error)
      toast.error(error.message === 'User already registered' ? 'Email već registrovan' : `Greška: ${error.message}`)
      setLoading(false)
      return
    }

    // If the Supabase project requires email confirmation, signUp() succeeds
    // but returns no active session — the person isn't actually logged in yet.
    // Previously the app claimed success and redirected as if authenticated,
    // which produced a confusing "logged out on home page" state.
    if (!data.session) {
      setNeedsConfirmation(true)
      setLoading(false)
      return
    }

    toast.success('Dobrodošao u CrossCourt! 🏀')
    router.push('/')
  }

  const inputClass = "w-full bg-court-card border border-court-border rounded-xl px-4 py-3 text-white placeholder-court-text2 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/20 transition-all"

  if (needsConfirmation) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-5 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-5">
          <MailCheck className="w-8 h-8 text-orange-500" />
        </div>
        <h2 className="font-display font-black text-2xl uppercase text-white">Proveri email</h2>
        <p className="text-court-text text-sm mt-2 max-w-xs">
          Poslali smo link za potvrdu na <strong className="text-white">{email}</strong>. Klikni ga da aktiviraš nalog.
        </p>
        <Link href="/auth/login" className="mt-6 text-orange-500 text-sm font-semibold">Nazad na prijavu</Link>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col px-5 pt-8 pb-6 animate-fade-in">
      <div className="mb-7">
        <h1 className="font-display font-black text-3xl uppercase tracking-tight leading-none">
          Napravi <span className="text-orange-500">nalog</span>
        </h1>
        <p className="text-court-text text-sm mt-1.5">Pridruži se basket zajednici Beograda</p>
      </div>

      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        <div>
          <label className="text-xs text-court-text uppercase tracking-widest font-semibold mb-2 block">Ime i prezime</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-court-text2" />
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
              placeholder="Nikola Jokić" required className={inputClass + ' pl-10'} />
          </div>
        </div>

        <div>
          <label className="text-xs text-court-text uppercase tracking-widest font-semibold mb-2 block">Username</label>
          <div className="relative">
            <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-court-text2" />
            <input type="text" value={username} onChange={e => handleUsername(e.target.value)}
              placeholder="nikola_bg" required maxLength={30}
              className={inputClass + ' pl-10' + (usernameErr ? ' border-red-500/50' : '')} />
          </div>
          {usernameErr && <p className="text-red-400 text-xs mt-1">{usernameErr}</p>}
        </div>

        <div>
          <label className="text-xs text-court-text uppercase tracking-widest font-semibold mb-2 block">Email</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-court-text2" />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="tvoj@email.com" required autoComplete="email"
              className={inputClass + ' pl-10'} />
          </div>
        </div>

        <div>
          <label className="text-xs text-court-text uppercase tracking-widest font-semibold mb-2 block">Lozinka</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-court-text2" />
            <input type={showPass ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min. 6 karaktera" required autoComplete="new-password"
              className={inputClass + ' pl-10 pr-11'} />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-court-text2 hover:text-white transition-colors">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading || !!usernameErr}
          className="mt-2 h-12 w-full bg-orange-500 hover:bg-orange-400 active:scale-95 text-white font-semibold rounded-xl transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ boxShadow: '0 3px 14px rgba(255,107,0,.3)' }}>
          {loading
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Kreiram nalog...</>
            : 'Registruj se'}
        </button>
      </form>

      <div className="flex items-center gap-3 my-7">
        <div className="flex-1 h-px bg-court-border" />
        <span className="text-court-text2 text-xs">već imaš nalog?</span>
        <div className="flex-1 h-px bg-court-border" />
      </div>

      <Link href="/auth/login"
        className="w-full h-12 flex items-center justify-center border border-court-border rounded-xl text-sm font-medium text-court-text hover:text-white hover:border-white/20 transition-all">
        Prijavi se
      </Link>
    </div>
  )
}
