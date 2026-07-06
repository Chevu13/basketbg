import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isToday, isTomorrow } from 'date-fns'
import { sr } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatGatheringTime(dateStr: string): string {
  const date = new Date(dateStr)
  const time = format(date, 'HH:mm')
  if (isToday(date)) return `Danas u ${time}`
  if (isTomorrow(date)) return `Sutra u ${time}`
  return format(date, "d. MMM 'u' HH:mm", { locale: sr })
}

export function formatRelativeTime(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: sr })
}

export function formatChatTime(dateStr: string): string {
  return format(new Date(dateStr), 'HH:mm')
}

/** Fiksna pretpostavljena dužina igre (2h) — koristi se svuda: konflikti termina, status "Završeno", itd. */
export const GATHERING_DURATION_MIN = 120

/** Minutes until (positive) or since (negative) the given ISO datetime. */
export function minutesUntil(dateStr: string): number {
  return Math.round((new Date(dateStr).getTime() - Date.now()) / 60000)
}

/** Da li je igra već završena (prošlo je 2h od početka). */
export function isGatheringEnded(dateStr: string): boolean {
  return minutesUntil(dateStr) <= -GATHERING_DURATION_MIN
}

/** Da li igra počinje u narednih N minuta (za "uskoro počinje" isticanje na mapi i sl). */
export function isStartingWithin(dateStr: string, minutes: number): boolean {
  const diff = minutesUntil(dateStr)
  return diff > 0 && diff <= minutes
}

/** Short countdown label used on gathering cards, e.g. "Za 18 min", "Igra u toku", "Završeno". */
export function formatCountdown(dateStr: string): string {
  const diff = minutesUntil(dateStr)
  if (diff <= -GATHERING_DURATION_MIN) return 'Završeno'
  if (diff <= 0) return 'Igra u toku'
  if (diff < 60) return `Za ${diff} min`
  const h = Math.floor(diff / 60)
  const m = diff % 60
  return `Za ${h}h${m > 0 ? ` ${m}min` : ''}`
}

export function formatDistance(km: number | undefined): string {
  if (km === undefined || Number.isNaN(km)) return ''
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
}

export function getReputationColor(score: number): string {
  if (score >= 80) return 'text-green-400'
  if (score >= 50) return 'text-yellow-400'
  return 'text-red-400'
}

export function getReputationLabel(score: number): string {
  if (score >= 90) return 'Legenda'
  if (score >= 75) return 'Pouzdan'
  if (score >= 50) return 'Solidan'
  if (score >= 25) return 'Neizvestan'
  return 'Ne baš pouzdan'
}

export function getInitials(name: string | null | undefined, username: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name[0].toUpperCase()
  }
  return username ? username[0].toUpperCase() : '?'
}

export function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Projects a lat/lng pair onto a 0–100 percentage box, given the bounding
 * box of all points that need to fit on the same mock map canvas.
 * Used by the in-house SVG map (no external maps tiles needed for the demo view).
 */
export function projectToPercent(
  lat: number,
  lng: number,
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number },
  padding = 15
): { top: number; left: number } {
  const latRange = bounds.maxLat - bounds.minLat || 0.001
  const lngRange = bounds.maxLng - bounds.minLng || 0.001
  const usable = 100 - padding * 2
  const left = padding + ((lng - bounds.minLng) / lngRange) * usable
  // lat is inverted: higher lat = further north = higher on screen = smaller top%
  const top = padding + (1 - (lat - bounds.minLat) / latRange) * usable
  return { top, left }
}
