import type { SceneEnvironment } from '../lib/scene-environment'

/**
 * Relighting the painted plates.
 *
 * The artwork was painted under a warm, low sun, so at midday it is too warm
 * and at midnight it is far too bright. Three passes fix that, all of them
 * taking their colour from the same atmosphere model that produced the sky:
 *
 *  1. a directional sunlight pass, anchored to the sun's screen position, so
 *     the side of the city facing the sun is the side that brightens
 *  2. an ambient pass in the sky's own colour, which fills what the sun does
 *     not reach and carries almost all of the work after sunset
 *  3. aerial perspective, concentrated at the horizon, so the distant city
 *     recedes into the same haze the sky is made of
 *
 * Without these the plates are a separate photograph sitting in front of a
 * separate sky, which is the core complaint this whole rebuild addresses.
 */

export function GradeLayer({
  environment,
  amount,
}: {
  environment: SceneEnvironment
  amount: number
}) {
  const { sunlight, ambient, haze, daylight, night, gradeStrength, sunPlacement } = environment
  const strength = gradeStrength * amount

  const sunX = Math.max(-0.4, Math.min(1.4, sunPlacement.x)) * 100
  const sunY = Math.max(-0.4, Math.min(1.4, sunPlacement.y)) * 100

  return (
    <div className="grade-layer" aria-hidden="true">
      {/* Directional sunlight, warm and falling off away from the sun. */}
      <div
        className="grade-layer__sun"
        style={{
          background: `radial-gradient(120% 90% at ${sunX}% ${sunY}%, ${sunlight} 0%, transparent 68%)`,
          opacity: 0.42 * daylight * amount,
        }}
      />
      {/* Ambient skylight. Dominates once the sun is down. */}
      <div
        className="grade-layer__ambient"
        style={{
          backgroundColor: ambient,
          opacity: 0.2 + 0.62 * night * amount,
        }}
      />
      {/* Aerial perspective, densest at the horizon. */}
      <div
        className="grade-layer__haze"
        style={{
          background: `linear-gradient(to bottom, transparent 0%, ${haze} 47%, ${haze} 54%, transparent 78%)`,
          opacity: 0.5 * amount * (0.35 + daylight * 0.65),
        }}
      />
      {/* Overall exposure trim, so night is genuinely dark. */}
      <div
        className="grade-layer__exposure"
        style={{ opacity: Math.min(0.78, strength * 0.78) }}
      />
    </div>
  )
}
