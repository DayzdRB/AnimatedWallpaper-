import type { WeatherSnapshot } from '../../types/scene'

export interface WeatherProvider {
  getSnapshot(date: Date): WeatherSnapshot
}
