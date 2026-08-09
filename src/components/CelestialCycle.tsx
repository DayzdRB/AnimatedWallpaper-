import type { CSSProperties } from 'react'
import type { WeatherMode } from '../lib/settings'

type CelestialStyle = CSSProperties & Record<`--${string}`, string | number>

type CelestialCycleProps = {
  sceneTime: number
  weather: WeatherMode
}

function arcPosition(progress: number) {
  return {
    x: 5 + progress * 90,
    y: 70 - Math.sin(progress * Math.PI) * 58,
  }
}

export function CelestialCycle({ sceneTime, weather }: CelestialCycleProps) {
  const sunProgress = Math.min(1, Math.max(0, (sceneTime - 5.5) / 15))
  const moonHour = sceneTime < 6.5 ? sceneTime + 24 : sceneTime
  const moonProgress = Math.min(1, Math.max(0, (moonHour - 19.5) / 11))
  const sun = arcPosition(sunProgress)
  const moon = arcPosition(moonProgress)
  const sunVisible = sceneTime >= 5.35 && sceneTime <= 20.65
  const moonVisible = sceneTime >= 19.25 || sceneTime <= 6.75
  const obscured = weather === 'storm' ? 0.22 : weather === 'rain' ? 0.46 : 1

  return (
    <div className="celestial-cycle" aria-hidden="true">
      <div
        className={`celestial celestial--sun${sunVisible ? ' celestial--visible' : ''}`}
        style={{ '--celestial-x': `${sun.x}%`, '--celestial-y': `${sun.y}%`, '--weather-visibility': obscured } as CelestialStyle}
      >
        <span />
      </div>
      <div
        className={`celestial celestial--moon${moonVisible ? ' celestial--visible' : ''}`}
        style={{ '--celestial-x': `${moon.x}%`, '--celestial-y': `${moon.y}%`, '--weather-visibility': obscured } as CelestialStyle}
      >
        <span><i /><i /><i /></span>
      </div>
    </div>
  )
}
