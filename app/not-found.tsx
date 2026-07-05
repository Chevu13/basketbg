import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-court-card border border-court-border flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-court-text2">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 2C9 5.5 9 18.5 12 22" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M12 2C15 5.5 15 18.5 12 22" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <line x1="2.2" y1="12" x2="21.8" y2="12" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
      <div>
        <p className="font-display font-black text-3xl uppercase text-white">404</p>
        <p className="text-court-text text-sm mt-1">Ova stranica ne postoji</p>
      </div>
      <Link href="/" className="btn-orange mt-2">Nazad na početnu</Link>
    </div>
  )
}
