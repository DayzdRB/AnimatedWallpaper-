import { useEffect, useState, type CSSProperties } from 'react'
import type { SceneEnvironment } from '../lib/scene-environment'
import type { LightningLevel, ResolvedSeason, WeatherMode } from '../lib/settings'

type EffectStyle = CSSProperties & Record<`--${string}`, string | number>

/**
 * Precipitation and falling foliage.
 *
 * Drop and flake colour comes from the environment rather than being fixed
 * white, because rain seen against a sunset is orange and snow at night is
 * whatever the streetlights are.
 */

const RAIN = Array.from({ length: 96 }, (_, index) => ({
  id: index,
  left: (index * 37 + 11) % 103,
  delay: -((index * 0.137) % 1.8),
  duration: 0.55 + (index % 6) * 0.07,
  opacity: 0.2 + (index % 5) * 0.1,
  length: 9 + (index % 7) * 3,
}))

const SNOW = Array.from({ length: 76 }, (_, index) => ({
  id: index,
  left: (index * 43 + 7) % 101,
  delay: -((index * 0.83) % 12),
  duration: 7.5 + (index % 8) * 1.2,
  size: 1.8 + (index % 5) * 0.9,
  drift: -50 + (index % 10) * 11,
}))

const LEAVES = Array.from({ length: 22 }, (_, index) => ({
  id: index,
  left: (index * 47 + 9) % 98,
  delay: -((index * 1.17) % 18),
  duration: 12 + (index % 7) * 1.9,
  drift: -80 + (index % 9) * 19,
}))

const LIGHTNING_TIMING: Record<Exclude<LightningLevel, 'off'>, [number, number]> = {
  low: [14_000, 28_000],
  medium: [7_000, 16_000],
  high: [3_200, 8_000],
  severe: [1_100, 4_200],
}

export function useLightning(weather: WeatherMode, level: LightningLevel, ambientMotion: boolean) {
  const [key, setKey] = useState(0)
  useEffect(() => {
    if (weather !== 'storm' || level === 'off' || !ambientMotion) return
    let timer = 0
    const [minimum, maximum] = LIGHTNING_TIMING[level]
    function schedule() {
      timer = window.setTimeout(
        () => {
          setKey((value) => value + 1)
          schedule()
        },
        minimum + Math.random() * (maximum - minimum),
      )
    }
    schedule()
    return () => window.clearTimeout(timer)
  }, [weather, level, ambientMotion])
  return key
}

export function PrecipitationLayer({
  environment,
  season,
  ambientMotion,
  lightningLevel,
  lightningKey,
}: {
  environment: SceneEnvironment
  season: ResolvedSeason
  ambientMotion: boolean
  lightningLevel: LightningLevel
  lightningKey: number
}) {
  const weather = environment.weather
  const showRain = weather === 'rain' || weather === 'storm'
  const showSnow = weather === 'snow'

  useEffect(() => {
    if (weather !== 'storm' || lightningLevel === 'off' || lightningKey < 1 || !ambientMotion) return
    // Sound arrives after the flash. Roughly three seconds per kilometre.
    const delay = 520 + (lightningKey % 4) * 380
    const timer = window.setTimeout(() => {
      const thunder = new Audio('/assets/thunder.ogg')
      thunder.volume = lightningLevel === 'severe' ? 0.78 : lightningLevel === 'high' ? 0.62 : 0.45
      void thunder.play().catch(() => undefined)
    }, delay)
    return () => window.clearTimeout(timer)
  }, [ambientMotion, lightningKey, lightningLevel, weather])

  const wet: EffectStyle = { '--precip-tint': environment.ambient }

  return (
    <div
      className={`precipitation precipitation--${weather}${ambientMotion ? '' : ' precipitation--still'}`}
      style={wet}
      aria-hidden="true"
    >
      {showRain && <div className="precipitation__mist" />}
      {showRain && (
        <div className="precipitation__rain">
          {RAIN.map((drop) => (
            <i
              key={drop.id}
              style={{
                '--drop-left': `${drop.left}%`,
                '--drop-delay': `${drop.delay}s`,
                '--drop-duration': `${drop.duration}s`,
                '--drop-opacity': drop.opacity,
                '--drop-length': `${drop.length}px`,
              } as EffectStyle}
            />
          ))}
        </div>
      )}
      {showSnow && (
        <div className="precipitation__snow">
          {SNOW.map((flake) => (
            <i
              key={flake.id}
              style={{
                '--flake-left': `${flake.left}%`,
                '--flake-delay': `${flake.delay}s`,
                '--flake-duration': `${flake.duration}s`,
                '--flake-size': `${flake.size}px`,
                '--flake-drift': `${flake.drift}px`,
              } as EffectStyle}
            />
          ))}
        </div>
      )}
      {weather === 'storm' && lightningLevel !== 'off' && lightningKey > 0 && (
        <div className={`lightning lightning--${lightningLevel}`} key={lightningKey}>
          <svg viewBox="0 0 600 900" aria-hidden="true">
            <path d="M348 0 225 326l92-20-137 270 87-25-103 349 251-432-103 27 154-306-96 25L448 0Z" />
          </svg>
        </div>
      )}
      {season === 'autumn' && weather !== 'snow' && (
        <div className="precipitation__leaves">
          {LEAVES.map((leaf) => (
            <i
              key={leaf.id}
              style={{
                '--particle-left': `${leaf.left}%`,
                '--particle-delay': `${leaf.delay}s`,
                '--particle-duration': `${leaf.duration}s`,
                '--particle-drift': `${leaf.drift}px`,
              } as EffectStyle}
            />
          ))}
        </div>
      )}
    </div>
  )
}
