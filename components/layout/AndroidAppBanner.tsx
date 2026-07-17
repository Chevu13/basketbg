'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

// TODO: zameni sa tačnim GitHub owner/repo kad podesiš "latest-build" release
// (videćeš instrukcije u chat-u — link uvek pokazuje na najnoviji APK).
const APK_DOWNLOAD_URL = 'https://github.com/Chevu13/crosscourt-android/releases/latest/download/CrossCourt.apk'

const DISMISS_KEY = 'cc_android_banner_dismissed'

export default function AndroidAppBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent || ''
    const isOurApp = ua.includes('CrossCourtApp')
    const isAndroid = /Android/i.test(ua)
    const dismissed = sessionStorage.getItem(DISMISS_KEY) === '1'
    setVisible(isAndroid && !isOurApp && !dismissed)
  }, [])

  if (!visible) return null

  return (
    <div className="mx-[18px] mt-3 bg-gradient-to-r from-orange-500/15 to-orange-500/5 border border-orange-500/25 rounded-2xl px-4 py-3 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0">
        <Download className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-[13px] font-semibold leading-tight">Preuzmi CrossCourt aplikaciju</p>
        <p className="text-court-text2 text-[11px] mt-0.5">Brže je i bez browsera</p>
      </div>
      <a
        href={APK_DOWNLOAD_URL}
        className="flex-shrink-0 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors"
      >
        Preuzmi
      </a>
      <button
        onClick={() => { sessionStorage.setItem(DISMISS_KEY, '1'); setVisible(false) }}
        className="flex-shrink-0 text-court-text2 hover:text-white transition-colors -mr-1 -my-1 p-1"
        aria-label="Zatvori"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
