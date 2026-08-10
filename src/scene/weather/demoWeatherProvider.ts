import type { WeatherProvider } from './provider'
import type { WeatherSnapshot } from '../../types/scene'

// Development provider only. The renderer consumes normalized weather state and
// can later be wired to a live API without changing any scene-layer components.
export class DemoWeatherProvider implements WeatherProvider {
  getSnapshot(date: Date): WeatherSnapshot {
    const hour = date.getUTCHours()
    const calmer = hour % 6 < 3
    return {
      weather: calmer ? 'partlyCloudy' : 'clear',
      cloudCover: calmer ? 0.34 : 0.14,
      precipitation: 0,
      wind: calmer ? 0.22 : 0.12,
      visibility: 0.96,
      wetness: 0,
      snowAccumulation: 0,
    }
  }
}
