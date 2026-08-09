import type { ReactNode } from 'react'
import { getSceneLighting } from '../lib/lighting'
import type { ResolvedSeason, WeatherMode } from '../lib/settings'
import type { TimeOfDay } from '../lib/time'
import { CelestialCycle } from './CelestialCycle'

type EiffelSceneProps = {
  timeOfDay: TimeOfDay
  ambientMotion: boolean
  sceneTime: number
  season: ResolvedSeason
  weather: WeatherMode
  backgroundWeather: ReactNode
  aircraftLayer: ReactNode
  foregroundWeather: ReactNode
}

const stars = Array.from({ length: 52 }, (_, index) => ({
  id: index,
  left: `${(index * 37 + 11) % 97}%`,
  top: `${(index * 19 + 5) % 55}%`,
  delay: `${(index % 9) * -0.57}s`,
  size: `${1 + (index % 3) * 0.55}px`,
}))

export function EiffelScene({
  timeOfDay,
  ambientMotion,
  sceneTime,
  season,
  weather,
  backgroundWeather,
  aircraftLayer,
  foregroundWeather,
}: EiffelSceneProps) {
  const nightOpacity = Number(getSceneLighting(sceneTime)['--night-opacity'])

  return (
    <div
      className={`scene scene--layered scene--${timeOfDay}${ambientMotion ? '' : ' scene--still'}`}
      style={getSceneLighting(sceneTime)}
      aria-hidden="true"
    >
      <div className={`scene-layer scene-sky scene-sky--${timeOfDay}`} />
      <div className="scene__stars">
        {stars.map((star) => (
          <i
            className="scene__star"
            key={star.id}
            style={{ animationDelay: star.delay, height: star.size, left: star.left, top: star.top, width: star.size }}
          />
        ))}
      </div>
      <CelestialCycle sceneTime={sceneTime} season={season} weather={weather} />
      <div className="scene-depth scene-depth--weather-back">{backgroundWeather}</div>

      <div className="scene-depth scene-depth--city">
        <ScenePlate name="paris-city-day" className="scene-plate--day" />
        <ScenePlate name="paris-city-night" className="scene-plate--night" opacity={nightOpacity} />
      </div>

      {season === 'autumn' && <ScenePlate name="season-autumn" className="scene-plate--season" />}
      {season === 'winter' && <ScenePlate name="season-winter" className="scene-plate--season" />}

      <div className="scene-depth scene-depth--aircraft">{aircraftLayer}</div>

      <div className="scene-depth scene-depth--occlusion">
        <ScenePlate name="paris-tower-day" className="scene-plate--day" />
        <ScenePlate name="paris-tower-night" className="scene-plate--night" opacity={nightOpacity} />
        <ScenePlate name="paris-foreground-day" className="scene-plate--day" />
        <ScenePlate name="paris-foreground-night" className="scene-plate--night" opacity={nightOpacity} />
      </div>

      <div className="scene-depth scene-depth--weather-front">{foregroundWeather}</div>
      <div className="scene__dynamic-light" />
      <div className="scene__grain" />
    </div>
  )
}

function ScenePlate({ name, className, opacity }: { name: string; className: string; opacity?: number }) {
  return <picture>
    <source media="(max-width: 760px)" srcSet={`/assets/${name}-mobile.png`} />
    <img className={`scene-plate ${className}`} src={`/assets/${name}.png`} alt="" style={opacity === undefined ? undefined : { opacity }} />
  </picture>
}
