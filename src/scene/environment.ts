import type { SceneEnvironment, SceneSettings, Season, TimeOfDay, WeatherSnapshot } from '../types/scene'

export function getParisParts(date: Date) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]))
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  }
}

export function seasonForMonth(month: number): Season {
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter'
}

export function timeOfDayForMinutes(minutes: number): TimeOfDay {
  if (minutes >= 300 && minutes < 420) return 'dawn'
  if (minutes >= 420 && minutes < 660) return 'morning'
  if (minutes >= 660 && minutes < 960) return 'midday'
  if (minutes >= 960 && minutes < 1080) return 'goldenHour'
  if (minutes >= 1080 && minutes < 1320) return 'dusk'
  return 'night'
}

export function greetingForMinutes(minutes: number) {
  if (minutes >= 300 && minutes < 1080) return 'Bonjour Trevor'
  if (minutes >= 1080 && minutes < 1320) return 'Bonsoir Trevor'
  return 'Bonne Nuit Trevor'
}

export function formatMinutes(minutes: number) {
  const normalized = ((minutes % 1440) + 1440) % 1440
  const hours = Math.floor(normalized / 60)
  const mins = normalized % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

export function weatherPreset(weather: SceneSettings['weather']): Omit<WeatherSnapshot, 'weather'> {
  switch (weather) {
    case 'clear': return { cloudCover: 0.08, precipitation: 0, wind: 0.08, visibility: 1, wetness: 0, snowAccumulation: 0 }
    case 'partlyCloudy': return { cloudCover: 0.38, precipitation: 0, wind: 0.18, visibility: 0.96, wetness: 0, snowAccumulation: 0 }
    case 'overcast': return { cloudCover: 0.88, precipitation: 0, wind: 0.2, visibility: 0.86, wetness: 0.08, snowAccumulation: 0 }
    case 'fog': return { cloudCover: 0.72, precipitation: 0, wind: 0.06, visibility: 0.34, wetness: 0.12, snowAccumulation: 0 }
    case 'rain': return { cloudCover: 0.84, precipitation: 0.66, wind: 0.36, visibility: 0.72, wetness: 0.72, snowAccumulation: 0 }
    case 'storm': return { cloudCover: 1, precipitation: 0.92, wind: 0.7, visibility: 0.54, wetness: 1, snowAccumulation: 0 }
    case 'snow': return { cloudCover: 0.9, precipitation: 0.62, wind: 0.28, visibility: 0.68, wetness: 0.26, snowAccumulation: 0.58 }
  }
}

export function resolveEnvironment(
  now: Date,
  settings: SceneSettings,
  autoWeather: WeatherSnapshot,
): SceneEnvironment {
  const paris = getParisParts(now)
  const minuteOfDay = settings.timeMode === 'auto'
    ? paris.hour * 60 + paris.minute
    : settings.manualMinutes
  const season = settings.seasonMode === 'auto' ? seasonForMonth(paris.month) : settings.season
  const weather = settings.weatherMode === 'auto'
    ? autoWeather
    : {
        weather: settings.weather,
        cloudCover: settings.cloudCover,
        precipitation: settings.precipitation,
        wind: settings.wind,
        visibility: settings.visibility,
        wetness: settings.wetness,
        snowAccumulation: settings.snowAccumulation,
      }
  const timeOfDay = timeOfDayForMinutes(minuteOfDay)
  return {
    ...weather,
    minuteOfDay,
    timeOfDay,
    season,
    isNight: timeOfDay === 'night',
  }
}
