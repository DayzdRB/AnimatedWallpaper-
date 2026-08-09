export const PARIS_TIME_ZONE = 'Europe/Paris'

export type TimeOfDay = 'dawn' | 'day' | 'golden' | 'evening' | 'night'

const parisTimePartsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: PARIS_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

export function getParisTimeParts(date: Date): { hour: number; minute: number } {
  const parts = parisTimePartsFormatter.formatToParts(date)
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0)
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0)
  return { hour, minute }
}

export function getParisHour(date: Date): number {
  return getParisTimeParts(date).hour
}

export function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 8) return 'dawn'
  if (hour >= 8 && hour < 17) return 'day'
  if (hour >= 17 && hour < 20) return 'golden'
  if (hour >= 20 && hour < 23) return 'evening'
  return 'night'
}

export function formatParisTime(date: Date, use24Hour = true): string {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: PARIS_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: !use24Hour,
  }).format(date)
}

export function formatLocalTime(date: Date, use24Hour = true): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: !use24Hour,
  }).format(date)
}

export function formatParisDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: PARIS_TIME_ZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}
