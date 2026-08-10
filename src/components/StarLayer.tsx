import { useMemo } from 'react'
import { project } from '../lib/camera'
import type { SceneEnvironment } from '../lib/scene-environment'

/**
 * Stars at fixed sky coordinates, drifting with the Earth's rotation.
 *
 * Deliberately sparse. Central Paris runs a Bortle 8 or 9 sky and the camera
 * only sees the first ten degrees above the rooftops, where extinction is
 * heaviest. A dense glittering starfield would be the least realistic thing in
 * the picture, so the limiting magnitude is tied to the light pollution slider
 * and most of the catalogue never becomes visible at all.
 */

type Star = { azimuth: number; elevation: number; magnitude: number; twinkle: number }

function seeded(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0
    return state / 4_294_967_296
  }
}

const CATALOGUE: Star[] = (() => {
  const random = seeded(0x5eed)
  return Array.from({ length: 220 }, () => ({
    azimuth: random() * 360,
    elevation: Math.pow(random(), 0.55) * 60,
    // Roughly the real magnitude distribution: faint stars vastly outnumber
    // bright ones.
    magnitude: 1.2 + Math.pow(random(), 0.42) * 4.6,
    twinkle: random(),
  }))
})()

export function StarLayer({
  environment,
  aspect,
  enabled,
}: {
  environment: SceneEnvironment
  aspect: number
  enabled: boolean
}) {
  const { night, atmosphere, date } = environment

  // Sidereal drift. Fifteen degrees an hour is close enough over one session.
  const rotation = ((date.getTime() / 3_600_000) * 15.041) % 360

  const visible = useMemo(() => {
    if (!enabled || night < 0.02) return []
    const limiting = 6.2 - 4.4 * atmosphere.lightPollution
    return CATALOGUE.map((star) => {
      const point = project(star.azimuth + rotation, star.elevation, aspect)
      if (!point.visible) return null
      // Atmospheric extinction: about 0.28 magnitudes per airmass, and airmass
      // climbs steeply in the low elevations this camera looks at.
      const extinction = 0.28 * (1 / Math.max(Math.sin((star.elevation * Math.PI) / 180), 0.05))
      const apparent = star.magnitude + Math.min(extinction, 3.2)
      if (apparent > limiting) return null
      const brightness = Math.pow(10, (limiting - apparent) / 5) - 1
      return {
        star,
        x: point.x,
        y: point.y,
        opacity: Math.min(brightness * 0.5, 1) * night,
        size: 1 + Math.min(brightness * 0.35, 1.4),
      }
    }).filter(Boolean) as Array<{
      star: Star
      x: number
      y: number
      opacity: number
      size: number
    }>
  }, [enabled, night, atmosphere.lightPollution, rotation, aspect])

  if (!visible.length) return null

  return (
    <div className="star-layer" aria-hidden="true">
      {visible.map((entry) => (
        <i
          key={`${entry.star.azimuth}-${entry.star.elevation}`}
          style={{
            left: `${entry.x * 100}%`,
            top: `${entry.y * 100}%`,
            width: `${entry.size}px`,
            height: `${entry.size}px`,
            opacity: entry.opacity,
            animationDelay: `${entry.star.twinkle * -6}s`,
          }}
        />
      ))}
    </div>
  )
}
