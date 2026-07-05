'use client'

import { useEffect } from 'react'
import { RefreshCw } from 'lucide-react'

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[BasketBG] Unhandled error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <span className="text-3xl">⚠️</span>
      </div>
      <div>
        <p className="font-display font-black text-2xl uppercase text-white">Nešto je pošlo naopako</p>
        <p className="text-court-text text-sm mt-1">Pokušaj ponovo ili se vrati na početnu</p>
      </div>
      <button onClick={reset} className="btn-orange flex items-center gap-2 mt-2">
        <RefreshCw className="w-4 h-4" />
        Pokušaj ponovo
      </button>
    </div>
  )
}
