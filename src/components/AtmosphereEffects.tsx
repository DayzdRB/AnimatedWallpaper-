import { useEffect, useState, type CSSProperties } from 'react'
import type { CloudCoverage, LightningLevel, ResolvedSeason, WeatherMode } from '../lib/settings'

type EffectStyle = CSSProperties & Record<`--${string}`, string | number>

type AtmosphereProps = {
  weather: WeatherMode
  season: ResolvedSeason
  ambientMotion: boolean
  cloudCoverage: CloudCoverage
  lightningLevel: LightningLevel
  lightningKey: number
}

const rainDrops = Array.from({ length: 86 }, (_, index) => ({
  id: index,
  left: (index * 37 + 11) % 103,
  delay: -((index * 0.137) % 1.8),
  duration: 0.62 + (index % 6) * 0.07,
  opacity: 0.22 + (index % 5) * 0.1,
}))

const snowflakes = Array.from({ length: 64 }, (_, index) => ({
  id: index,
  left: (index * 43 + 7) % 101,
  delay: -((index * 0.83) % 12),
  duration: 8 + (index % 8) * 1.1,
  size: 2 + (index % 5) * 0.9,
  drift: -45 + (index % 10) * 10,
}))

const leaves = Array.from({ length: 24 }, (_, index) => ({
  id: index,
  left: (index * 47 + 9) % 98,
  delay: -((index * 1.17) % 18),
  duration: 13 + (index % 7) * 1.8,
  drift: -75 + (index % 9) * 18,
}))

const lightningTiming: Record<Exclude<LightningLevel, 'off'>, [number, number]> = {
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
    const [minimum, maximum] = lightningTiming[level]
    function schedule() {
      timer = window.setTimeout(() => {
        setKey((value) => value + 1)
        schedule()
      }, minimum + Math.random() * (maximum - minimum))
    }
    schedule()
    return () => window.clearTimeout(timer)
  }, [weather, level, ambientMotion])
  return key
}

export function AtmosphereBackground({ weather, cloudCoverage, lightningLevel, lightningKey, ambientMotion }: AtmosphereProps) {
  const cloudAsset = weather === 'storm'
    ? '/assets/clouds-storm-base.png'
    : weather === 'rain' || weather === 'snow'
      ? '/assets/clouds-rain.png'
      : '/assets/clouds-fair.png'

  return (
    <div className={`weather-back weather-back--${weather} weather-back--${cloudCoverage}${ambientMotion ? '' : ' weather-back--still'}`}>
      <img className="weather-cloud weather-cloud--far" src={cloudAsset} alt="" />
      <img className="weather-cloud weather-cloud--near" src={cloudAsset} alt="" />
      {weather === 'storm' && lightningLevel !== 'off' && lightningKey > 0 && (
        <img key={lightningKey} className="weather-cloud weather-cloud--flash" src="/assets/clouds-storm-flash.png" alt="" />
      )}
    </div>
  )
}

export function AtmosphereForeground({ weather, season, ambientMotion, lightningLevel, lightningKey }: AtmosphereProps) {
  const showRain = weather === 'rain' || weather === 'storm'
  const showSnow = weather === 'snow'

  useEffect(() => {
    if (weather !== 'storm' || lightningLevel === 'off' || lightningKey < 1 || !ambientMotion) return
    const delay = 520 + (lightningKey % 4) * 360
    const timer = window.setTimeout(() => {
      const thunder = new Audio('/assets/thunder.ogg')
      thunder.volume = lightningLevel === 'severe' ? 0.78 : lightningLevel === 'high' ? 0.62 : 0.45
      void thunder.play().catch(() => undefined)
    }, delay)
    return () => window.clearTimeout(timer)
  }, [ambientMotion, lightningKey, lightningLevel, weather])

  return (
    <div className={`atmosphere-front atmosphere-front--${weather}${ambientMotion ? '' : ' atmosphere-front--still'}`}>
      {showRain && <div className="rain-mist" />}
      {showRain && (
        <div className="weather-layer weather-layer--rain">
          {rainDrops.map((drop) => <i key={drop.id} style={{
            '--drop-left': `${drop.left}%`, '--drop-delay': `${drop.delay}s`, '--drop-duration': `${drop.duration}s`, '--drop-opacity': drop.opacity,
          } as EffectStyle} />)}
        </div>
      )}
      {showSnow && (
        <div className="weather-layer weather-layer--snow">
          {snowflakes.map((flake) => <i key={flake.id} style={{
            '--flake-left': `${flake.left}%`, '--flake-delay': `${flake.delay}s`, '--flake-duration': `${flake.duration}s`, '--flake-size': `${flake.size}px`, '--flake-drift': `${flake.drift}px`,
          } as EffectStyle} />)}
        </div>
      )}
      {weather === 'storm' && lightningLevel !== 'off' && lightningKey > 0 && (
        <div className={`lightning-bolt lightning-bolt--${lightningLevel}`} key={lightningKey}>
          <svg viewBox="0 0 600 900"><path d="M348 0 225 326l92-20-137 270 87-25-103 349 251-432-103 27 154-306-96 25L448 0Z" /></svg>
        </div>
      )}
      {weather === 'clear' && season === 'autumn' && (
        <div className="season-particles season-particles--autumn">
          {leaves.map((leaf) => <i key={leaf.id} style={{
            '--particle-left': `${leaf.left}%`, '--particle-delay': `${leaf.delay}s`, '--particle-duration': `${leaf.duration}s`, '--particle-drift': `${leaf.drift}px`,
          } as EffectStyle} />)}
        </div>
      )}
    </div>
  )
}
