export type SceneTimeMode = 'paris' | 'local' | 'custom'

export type WallpaperSettings = {
  timeMode: SceneTimeMode
  customTime: string
  showParisTime: boolean
  showLocalTime: boolean
  showDate: boolean
  showGreeting: boolean
  use24Hour: boolean
  ambientMotion: boolean
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

