export type SceneTimeMode = 'paris' | 'local' | 'custom'
export type WeatherMode = 'clear' | 'rain' | 'storm' | 'snow'
export type LightningLevel = 'off' | 'low' | 'medium' | 'high' | 'severe'
export type CloudCoverage = 'light' | 'medium' | 'heavy'
export type AircraftDensity = 'low' | 'medium' | 'high'
export type SeasonMode = 'auto' | 'spring' | 'summer' | 'autumn' | 'winter'
export type ResolvedSeason = Exclude<SeasonMode, 'auto'>

export type WallpaperSettings = {
  timeMode: SceneTimeMode
  customTime: string
  showParisTime: boolean
  showLocalTime: boolean
  showDate: boolean
  showGreeting: boolean
  use24Hour: boolean
  ambientMotion: boolean
  showAircraft: boolean
  showAirliners: boolean
  showGeneralAviation: boolean
  showBusinessJets: boolean
  showHelicopters: boolean
  aircraftDensity: AircraftDensity
  weatherMode: WeatherMode
  cloudCoverage: CloudCoverage
  lightningLevel: LightningLevel
  seasonMode: SeasonMode
}

export const DEFAULT_SETTINGS: WallpaperSettings = {
  timeMode: 'paris',
  customTime: '21:00',
  showParisTime: true,
  showLocalTime: true,
  showDate: true,
  showGreeting: true,
  use24Hour: true,
  ambientMotion: true,
  showAircraft: true,
  showAirliners: true,
  showGeneralAviation: true,
  showBusinessJets: true,
  showHelicopters: true,
  aircraftDensity: 'medium',
  weatherMode: 'clear',
  cloudCoverage: 'medium',
  lightningLevel: 'medium',
  seasonMode: 'auto',
}

const STORAGE_KEY = 'animated-wallpaper-settings-v1'

export function loadSettings(): WallpaperSettings {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (!saved) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: WallpaperSettings): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // The wallpaper remains fully usable when storage is unavailable.
  }
}

export function getSceneHour(date: Date, settings: WallpaperSettings, parisHour: number): number {
  if (settings.timeMode === 'local') return date.getHours()
  if (settings.timeMode === 'custom') {
    const hour = Number(settings.customTime.split(':')[0])
    return Number.isFinite(hour) ? hour : parisHour
  }
  return parisHour
}

export function getSceneTime(
  date: Date,
  settings: WallpaperSettings,
  parisTime: { hour: number; minute: number },
): number {
  if (settings.timeMode === 'local') return date.getHours() + date.getMinutes() / 60
  if (settings.timeMode === 'custom') {
    const [hour, minute] = settings.customTime.split(':').map(Number)
    if (Number.isFinite(hour) && Number.isFinite(minute)) return hour + minute / 60
  }
  return parisTime.hour + parisTime.minute / 60
}

export function resolveSeason(date: Date, seasonMode: SeasonMode): ResolvedSeason {
  if (seasonMode !== 'auto') return seasonMode
  const month = date.getMonth() + 1
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter'
}
