export type SceneTimeMode = 'paris' | 'local' | 'custom'
export type WeatherMode = 'clear' | 'fair' | 'overcast' | 'rain' | 'storm' | 'snow'
export type LightningLevel = 'off' | 'low' | 'medium' | 'high' | 'severe'
export type CloudCoverage = 'clear' | 'few' | 'scattered' | 'broken' | 'overcast'
export type AircraftDensity = 'quiet' | 'low' | 'medium' | 'high'
export type SeasonMode = 'auto' | 'spring' | 'summer' | 'autumn' | 'winter'
export type ResolvedSeason = Exclude<SeasonMode, 'auto'>

/**
 * `realistic` puts the sun exactly where it is, which in a 33 degree frame
 * means it is out of shot for most of the day. `framed` remaps the day's arc
 * so it crosses the picture. Both are defensible; only one shows you a sunset.
 */
export type SunTracking = 'realistic' | 'framed'

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
  /**
   * Multiplier on physically correct aircraft size. 1 is truthful and small.
   * Anything above 1 is a deliberate cheat, exposed rather than hidden.
   */
  aircraftScale: number
  showContrails: boolean

  weatherMode: WeatherMode
  cloudCoverage: CloudCoverage
  lightningLevel: LightningLevel
  seasonMode: SeasonMode

  sunTracking: SunTracking
  /** Urban skyglow, 0 for a dark sky and 1 for central Paris. */
  lightPollution: number
  /** Strength of the relight applied to the painted plates. */
  gradeAmount: number
  showStars: boolean
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
  aircraftScale: 1,
  showContrails: true,

  weatherMode: 'clear',
  cloudCoverage: 'scattered',
  lightningLevel: 'medium',
  seasonMode: 'auto',

  sunTracking: 'framed',
  lightPollution: 0.85,
  gradeAmount: 1,
  showStars: true,
}

const STORAGE_KEY = 'animated-wallpaper-settings-v2'

export function loadSettings(): WallpaperSettings {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (!saved) return DEFAULT_SETTINGS
    const parsed = JSON.parse(saved) as Partial<WallpaperSettings>
    return { ...DEFAULT_SETTINGS, ...parsed }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: WallpaperSettings): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // The wallpaper stays fully usable without persistence.
  }
}

/** Cloud coverage in eighths, the way an aerodrome report would put it. */
export const COVERAGE_OKTAS: Record<CloudCoverage, number> = {
  clear: 0,
  few: 1.5,
  scattered: 3.5,
  broken: 6,
  overcast: 8,
}

/** Coverage forced by the weather, since rain does not fall from a clear sky. */
export function effectiveCoverage(weather: WeatherMode, requested: CloudCoverage): number {
  const requestedOktas = COVERAGE_OKTAS[requested]
  const floor =
    weather === 'storm'
      ? 7
      : weather === 'rain'
        ? 7
        : weather === 'snow'
          ? 6.5
          : weather === 'overcast'
            ? 7.5
            : 0
  return Math.max(requestedOktas, floor)
}
