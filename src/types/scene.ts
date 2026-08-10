export type TimeOfDay = 'dawn' | 'morning' | 'midday' | 'goldenHour' | 'dusk' | 'night'
export type Season = 'spring' | 'summer' | 'autumn' | 'winter'
export type WeatherType = 'clear' | 'partlyCloudy' | 'overcast' | 'fog' | 'rain' | 'storm' | 'snow'

export interface WeatherSnapshot {
  weather: WeatherType
  cloudCover: number
  precipitation: number
  wind: number
  visibility: number
  wetness: number
  snowAccumulation: number
}

export interface SceneSettings {
  timeMode: 'auto' | 'manual'
  manualMinutes: number
  seasonMode: 'auto' | 'manual'
  season: Season
  weatherMode: 'auto' | 'manual'
  weather: WeatherType
  cloudCover: number
  precipitation: number
  wind: number
  visibility: number
  wetness: number
  snowAccumulation: number
  aircraftDensity: number
  reducedMotion: boolean
}

export interface SceneEnvironment extends WeatherSnapshot {
  minuteOfDay: number
  timeOfDay: TimeOfDay
  season: Season
  isNight: boolean
}

export interface LightingState {
  ambientIntensity: number
  cityBrightness: number
  monumentBrightness: number
  cityContrast: number
  monumentContrast: number
  saturation: number
  warmth: number
  lampIntensity: number
  monumentLightIntensity: number
  buildingLightIntensity: number
  hazeOpacity: number
  snowBrightness: number
  cloudLuminance: number
  skyTop: string
  skyHorizon: string
  skyLower: string
}
