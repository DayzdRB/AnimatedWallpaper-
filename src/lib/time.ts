export const PARIS_TIME_ZONE = 'Europe/Paris'

export type TimeOfDay = 'dawn' | 'day' | 'golden' | 'evening' | 'night'

const parisHourFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: PARIS_TIME_ZONE,
  hour: '2-digit',
  hourCycle: 'h23',
})

const parisClockFormatter = new Intl.DateTimeFormat('fr-FR', {
  timeZone: PARIS_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

const localClockFormatter = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

export function getParisHour(date: Date): number {
  return Number(parisHourFormatter.format(date))
}

export function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 8) return 'dawn'
  if (hour >= 8 && hour < 17) return 'day'
  if (hour >= 17 && hour < 20) return 'golden'
  if (hour >= 20 && hour < 23) return 'evening'
  return 'night'
}

export function formatParisTime(date: Date): string {
  return parisClockFormatter.format(date)
}

export function formatLocalTime(date: Date): string {
  return localClockFormatter.format(date)
}

