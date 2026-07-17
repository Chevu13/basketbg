'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Mail, MailCheck, ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) { toast.error('Unesi svoj email'); return }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/reset-password` : undefined,
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-5 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-5">
          <MailCheck className="w-8 h-8 text-orange-500" />
        </div>
        <h2 className="font-display font-black text-2xl uppercase text-white">Proveri email</h2>
        <p className="text-court-text text-sm mt-2 max-w-xs">
          Poslali smo link za reset lozinke na <strong className="text-white">{email}</strong>.
          Klikni ga odmah — link važi ograničeno vreme.
        </p>
        <p className="text-court-text2 text-xs mt-3 max-w-xs">
          Ne vidiš mejl? Proveri spam folder ili pokušaj ponovo za minut.
        </p>
        <Link href="/auth/login" className="mt-6 text-orange-500 text-sm font-semibold">
          Nazad na prijavu
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col px-5 pt-10 pb-6 animate-fade-in">
      <div className="flex flex-col items-center mb-10">
        <div className="w-14 h-14 flex items-center justify-center mb-4">
          <img src="/brand/crosscourt-mark-dark.png" alt="CrossCourt" className="w-14 h-14 object-contain" />
        </div>
        <h1 className="font-display font-black text-2xl uppercase tracking-wide">Zaboravljena lozinka</h1>
        <p className="text-court-text text-sm mt-1 text-center max-w-xs">
          Unesi email sa kojim si se registrovao i poslaćemo ti link za novu lozinku
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-xs text-court-text uppercase tracking-widest font-semibold mb-2 block">Email</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-court-text2" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tvoj@email.com"
              required
              autoComplete="email"
              className="w-full bg-court-card border border-court-border rounded-xl px-4 py-3 pl-10 text-white placeholder-court-text2 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/20 transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl text-sm mt-2 transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Šaljem...' : 'Pošalji link za reset'}
        </button>
      </form>

      <Link href="/auth/login" className="flex items-center gap-1.5 text-court-text text-sm mt-8 mx-auto hover:text-white transition-colors">
        <ChevronLeft className="w-4 h-4" /> Nazad na prijavu
      </Link>
    </div>
  )
}
