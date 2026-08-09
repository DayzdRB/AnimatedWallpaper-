import type { CSSProperties } from 'react'
import type { ResolvedSeason, WeatherMode } from '../lib/settings'

type CelestialStyle = CSSProperties & Record<`--${string}`, string | number>

type CelestialCycleProps = {
  sceneTime: number
  season: ResolvedSeason
  weather: WeatherMode
}

const ARC_HEIGHT: Record<ResolvedSeason, number> = {
  spring: 53,
  summer: 61,
  autumn: 49,
  winter: 39,
}

function arcPosition(progress: number, height: number) {
  return {
    x: 2 + progress * 96,
    y: 74 - Math.sin(progress * Math.PI) * height,
  }
}

export function CelestialCycle({ sceneTime, season, weather }: CelestialCycleProps) {
  const daylight = sceneTime >= 5.5 && sceneTime < 20.5
  const moonHour = sceneTime < 6 ? sceneTime + 24 : sceneTime
  const progress = daylight
    ? Math.min(1, Math.max(0, (sceneTime - 5.5) / 15))
    : Math.min(1, Math.max(0, (moonHour - 19.5) / 11))
  const position = arcPosition(progress, daylight ? ARC_HEIGHT[season] : ARC_HEIGHT[season] * 0.84)
  const visibility = weather === 'storm' ? 0.08 : weather === 'rain' ? 0.28 : 1

  let asset = '/assets/celestial-moon.png'
  let kind = 'moon'
  if (daylight && sceneTime < 8.25) { asset = '/assets/celestial-sunrise.png'; kind = 'sunrise' }
  else if (daylight && sceneTime < 17) { asset = '/assets/celestial-day.png'; kind = 'day' }
  else if (daylight) { asset = '/assets/celestial-sunset.png'; kind = 'sunset' }

  return (
    <div className="celestial-cycle" aria-hidden="true">
      <img
        className={`celestial-asset celestial-asset--${kind}`}
        src={asset}
        alt=""
        style={{
          '--celestial-x': `${position.x}%`,
          '--celestial-y': `${position.y}%`,
          '--weather-visibility': visibility,
        } as CelestialStyle}
      />
    </div>
  )
}
