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

export function getReputationColor(score: number): string {
  if (score >= 80) return 'text-green-400'
  if (score >= 50) return 'text-yellow-400'
  return 'text-red-400'
}

export function getReputationLabel(score: number): string {
  if (score >= 90) return 'Legenda'
  if (score >= 75) return 'Pouzdан'
  if (score >= 50) return 'Solidан'
  if (score >= 25) return 'Neizvestan'
  return 'Ne baš pouzdan'
}

export function getInitials(name: string | null, username: string): string {
  if (name) {
    const parts = name.split(' ')
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name[0].toUpperCase()
  }
  return username[0].toUpperCase()
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
