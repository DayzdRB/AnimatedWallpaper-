import type { CSSProperties } from 'react'
import type { SceneEnvironment } from '../lib/scene-environment'

/**
 * The sun and moon at their true angular size.
 *
 * At 0.53 degrees across, the solar disc is 2.8 per cent of frame height in
 * this camera, which is roughly thirty pixels on a 1080p display. The previous
 * artwork rendered it at twenty to twenty five per cent with drawn rays, which
 * is the single biggest reason it read as a sticker rather than a sun. What
 * actually sells a sun is the aureole around it, so the disc stays small and
 * the glow does the work.
 *
 * Refraction squashes a low sun vertically by up to a fifth, and extinction
 * makes it both redder and dimmer. Both come from the atmosphere model rather
 * than from a keyframe.
 */

type Placement = SceneEnvironment['sunPlacement']

function discStyle(placement: Placement, extra: CSSProperties = {}): CSSProperties {
  return {
    left: `${placement.x * 100}%`,
    top: `${placement.y * 100}%`,
    height: `${placement.size * 100}%`,
    width: `${placement.size * 100}%`,
    ...extra,
  }
}

export function SunDisc({ environment }: { environment: SceneEnvironment }) {
  const { sunPlacement, sunDisc, sunDiscIntensity, sun } = environment
  if (!sunPlacement.visible || sun.apparentAltitude < -1.2) return null

  const intensity = sunDiscIntensity

  return (
    <div className="celestial celestial--sun" aria-hidden="true">
      {/* Broad aureole. Forward scattered light spread over tens of degrees. */}
      <span
        className="celestial__aureole celestial__aureole--wide"
        style={discStyle(sunPlacement, {
          background: `radial-gradient(circle, ${sunDisc} 0%, transparent 62%)`,
          opacity: 0.20 * intensity,
          transform: `translate(-50%, -50%) scale(${34 / Math.max(sunPlacement.size * 100, 0.4)})`,
        })}
      />
      {/* Tight aureole, a few degrees across. */}
      <span
        className="celestial__aureole"
        style={discStyle(sunPlacement, {
          background: `radial-gradient(circle, ${sunDisc} 0%, transparent 58%)`,
          opacity: 0.5 * intensity,
          transform: `translate(-50%, -50%) scale(${9 / Math.max(sunPlacement.size * 100, 0.4)})`,
        })}
      />
      <span
        className="celestial__disc celestial__disc--sun"
        style={discStyle(sunPlacement, {
          background: sunDisc,
          opacity: Math.min(0.35 + intensity, 1),
          transform: `translate(-50%, -50%) scaleY(${sunPlacement.flattening})`,
        })}
      />
    </div>
  )
}

export function MoonDisc({ environment }: { environment: SceneEnvironment }) {
  const { moonPlacement, moon, night, sunPlacement } = environment
  if (!moonPlacement.visible || moon.apparentAltitude < -0.8) return null
  if (moon.illumination < 0.03) return null

  const visibility = Math.min(0.25 + night * 0.9, 1)

  // The bright limb faces the sun, so pointing the terminator at the sun's
  // screen position is both correct and self consistent with wherever the sun
  // has been placed.
  const angle =
    (Math.atan2(sunPlacement.y - moonPlacement.y, sunPlacement.x - moonPlacement.x) * 180) / Math.PI

  // Terminator offset: a full moon has none, a new moon covers the disc.
  const offset = (1 - moon.illumination) * 2 - 1

  return (
    <div className="celestial celestial--moon" aria-hidden="true">
      <span
        className="celestial__aureole"
        style={discStyle(moonPlacement, {
          background: 'radial-gradient(circle, rgb(198 210 235) 0%, transparent 60%)',
          opacity: 0.16 * visibility * moon.illumination,
          transform: `translate(-50%, -50%) scale(${7 / Math.max(moonPlacement.size * 100, 0.3)})`,
        })}
      />
      <svg
        className="celestial__moon-body"
        style={discStyle(moonPlacement, { opacity: visibility })}
        viewBox="-1.1 -1.1 2.2 2.2"
      >
        <defs>
          <mask id="moon-phase">
            <circle cx="0" cy="0" r="1" fill="white" />
            <ellipse
              cx={offset > 0 ? offset : offset}
              cy="0"
              rx={Math.abs(offset) < 0.02 ? 0 : 1}
              ry="1"
              fill="black"
              transform={`rotate(${-angle})`}
            />
          </mask>
          <radialGradient id="moon-surface" cx="35%" cy="32%" r="78%">
            <stop offset="0" stopColor="#f6f2e8" />
            <stop offset="0.62" stopColor="#ddd8cc" />
            <stop offset="1" stopColor="#b9b4a8" />
          </radialGradient>
        </defs>
        <g mask="url(#moon-phase)">
          <circle cx="0" cy="0" r="1" fill="url(#moon-surface)" />
          {/* Maria, so the disc is not a featureless dot. */}
          <circle cx="-0.24" cy="-0.3" r="0.3" fill="#b6b2a6" opacity="0.55" />
          <circle cx="0.22" cy="0.12" r="0.36" fill="#b0aca0" opacity="0.4" />
          <circle cx="-0.1" cy="0.42" r="0.22" fill="#b6b2a6" opacity="0.42" />
        </g>
        {/* Earthshine on the unlit portion of a thin crescent. */}
        {moon.illumination < 0.35 && (
          <circle cx="0" cy="0" r="1" fill="#8f9db8" opacity={0.07 * (1 - moon.illumination)} />
        )}
      </svg>
    </div>
  )
}
