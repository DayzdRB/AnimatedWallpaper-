import { useEffect, useState, type CSSProperties } from 'react'
import type { ResolvedSeason, WeatherMode } from '../lib/settings'

type EffectStyle = CSSProperties & Record<`--${string}`, string | number>

type AtmosphereEffectsProps = {
  weather: WeatherMode
  season: ResolvedSeason
  ambientMotion: boolean
}

const rainDrops = Array.from({ length: 72 }, (_, index) => ({
  id: index,
  left: (index * 37 + 11) % 103,
  delay: -((index * 0.137) % 1.8),
  duration: 0.7 + (index % 6) * 0.08,
  opacity: 0.22 + (index % 5) * 0.1,
}))

const snowflakes = Array.from({ length: 54 }, (_, index) => ({
  id: index,
  left: (index * 43 + 7) % 101,
  delay: -((index * 0.83) % 12),
  duration: 8 + (index % 8) * 1.1,
  size: 2 + (index % 5) * 0.9,
  drift: -45 + (index % 10) * 10,
}))

const seasonalParticles = Array.from({ length: 16 }, (_, index) => ({
  id: index,
  left: (index * 47 + 9) % 98,
  delay: -((index * 1.17) % 18),
  duration: 13 + (index % 7) * 1.8,
  drift: -75 + (index % 9) * 18,
}))

export function AtmosphereEffects({
  weather,
  season,
  ambientMotion,
}: AtmosphereEffectsProps) {
  const [lightningKey, setLightningKey] = useState(0)

  useEffect(() => {
    if (weather !== 'storm' || !ambientMotion) return
    let timer = 0
    function scheduleFlash() {
      timer = window.setTimeout(() => {
        setLightningKey((key) => key + 1)
        scheduleFlash()
      }, 7_000 + Math.random() * 15_000)
    }
    scheduleFlash()
    return () => window.clearTimeout(timer)
  }, [weather, ambientMotion])

  const showRain = weather === 'rain' || weather === 'storm'
  const showSnow = weather === 'snow'
  const showSeasonParticles = weather === 'clear' && (season === 'spring' || season === 'autumn')

  return (
    <div
      className={`atmosphere atmosphere--${weather}${ambientMotion ? '' : ' atmosphere--still'}`}
      aria-hidden="true"
    >
      {showRain && (
        <div className="weather-layer weather-layer--rain">
          {rainDrops.map((drop) => (
            <i
              key={drop.id}
              style={{
                '--drop-left': `${drop.left}%`,
                '--drop-delay': `${drop.delay}s`,
                '--drop-duration': `${drop.duration}s`,
                '--drop-opacity': drop.opacity,
              } as EffectStyle}
            />
          ))}
        </div>
      )}

      {showSnow && (
        <div className="weather-layer weather-layer--snow">
          {snowflakes.map((flake) => (
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

      {weather === 'storm' && (
        <div className="weather-layer weather-layer--lightning" key={lightningKey} />
      )}

      {showSeasonParticles && (
        <div className={`season-particles season-particles--${season}`}>
          {seasonalParticles.map((particle) => (
            <i
              key={particle.id}
              style={{
                '--particle-left': `${particle.left}%`,
                '--particle-delay': `${particle.delay}s`,
                '--particle-duration': `${particle.duration}s`,
                '--particle-drift': `${particle.drift}px`,
              } as EffectStyle}
            />
          ))}
        </div>
      )}
    </div>
  )
}

