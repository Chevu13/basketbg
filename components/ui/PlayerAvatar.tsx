'use client'

import { useState } from 'react'
import { getInitials } from '@/lib/utils'

const FALLBACK_COLORS = ['#2C6BED', '#6E40C9', '#E6474A', '#0E9E71', '#B05A11', '#7A6500', '#1A7FBF', '#9B2335']

type Props = {
  url?: string | null
  fullName?: string | null
  username?: string | null
  size?: number
  className?: string
  colorSeed?: number
  ring?: boolean
}

/**
 * Avatar sa ugrađenim fallback-om: ako slika ne postoji ili ne uspe da se učita
 * (slomljen link, obrisan fajl iz Storage-a, mrežna greška), automatski prikazuje
 * inicijale na obojenoj pozadini umesto "slomljene slike" ikonice.
 */
export default function PlayerAvatar({ url, fullName, username, size = 32, className = '', colorSeed = 0, ring }: Props) {
  const [failed, setFailed] = useState(false)
  const showImage = !!url && !failed
  const initials = getInitials(fullName, username ?? '?')
  const bg = FALLBACK_COLORS[Math.abs(colorSeed) % FALLBACK_COLORS.length]

  return (
    <div
      className={`rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 font-display font-bold text-white ${ring ? 'border-[2.5px] border-court-card' : ''} ${className}`}
      style={{ width: size, height: size, background: showImage ? undefined : bg, fontSize: Math.max(9, size * 0.36) }}
    >
      {showImage ? (
        <img
          src={url!}
          alt=""
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        initials
      )}
    </div>
  )
}
