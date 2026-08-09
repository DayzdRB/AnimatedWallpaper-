import type { ReactNode } from 'react'
import type { SceneEnvironment } from '../lib/scene-environment'
import { MoonDisc, SunDisc } from './CelestialLayer'
import { GradeLayer } from './GradeLayer'
import { SeasonLayer } from './SeasonLayer'
import { SkyLayer } from './SkyLayer'
import { StarLayer } from './StarLayer'

/**
 * The layer stack, in explicit paint order.
 *
 * Ordering is the whole game here. The previous version put the season overlay
 * below the tower plate, so the tower stayed summer green in a snowstorm, and it
 * put weather in front of the sky but behind nothing else in particular. Every
 * layer below has one job and one place, and the depth each occupies is
 * physical: the sky is at infinity, the celestial bodies just in front of it,
 * clouds at their real altitudes, aircraft between the clouds and the city, the
 * city and tower where they belong, and the grade over the top of all of it so
 * that nothing escapes the lighting.
 */

export type SceneSlots = {
  clouds: ReactNode
  aircraft: ReactNode
  precipitation: ReactNode
  destruction: ReactNode
}

function Plate({ name, opacity }: { name: string; opacity?: number }) {
  return (
    <picture>
      <source media="(max-width: 760px)" srcSet={`/assets/${name}-mobile.png`} />
      <img
        className="plate"
        src={`/assets/${name}.png`}
        alt=""
        style={opacity === undefined ? undefined : { opacity }}
      />
    </picture>
  )
}

export function EiffelScene({
  environment,
  aspect,
  showStars,
  gradeAmount,
  snowfallDepth,
  shaking,
  blastLight,
  slots,
}: {
  environment: SceneEnvironment
  aspect: number
  showStars: boolean
  gradeAmount: number
  snowfallDepth: number
  shaking: boolean
  blastLight: number
  slots: SceneSlots
}) {
  const { night, season, band } = environment

  return (
    <div
      className={`scene scene--${band} scene--season-${season}${shaking ? ' scene--shaking' : ''}`}
      aria-hidden="true"
    >
      {/* 1. Sky, at infinity. */}
      <div className="layer layer--sky">
        <SkyLayer environment={environment} />
      </div>

      {/* 2. Stars and the celestial bodies, in front of the sky. */}
      <div className="layer layer--celestial">
        <StarLayer environment={environment} aspect={aspect} enabled={showStars} />
        <MoonDisc environment={environment} />
        <SunDisc environment={environment} />
      </div>

      {/* 3. Clouds, projected at their real altitudes. */}
      <div className="layer layer--clouds">{slots.clouds}</div>

      {/* 5. The distant city. */}
      <div className="layer layer--city">
        <Plate name="paris-city-day" />
        <Plate name="paris-city-night" opacity={night} />
      </div>

      {/* 6. Aircraft, in front of the distant city but behind the tower. */}
      <div className="layer layer--traffic">{slots.aircraft}</div>

      {/* 7. Tower and foreground architecture, which occlude the traffic. */}
      <div className="layer layer--tower">
        <Plate name="paris-tower-day" />
        <Plate name="paris-tower-night" opacity={night} />
      </div>
      <div className="layer layer--foreground">
        <Plate name="paris-foreground-day" />
        <Plate name="paris-foreground-night" opacity={night} />
      </div>

      {/* 8. Season treatment, over every plate so the tower is included. */}
      <div className="layer layer--season">
        <SeasonLayer season={season} snowfallDepth={snowfallDepth} />
      </div>

      {/* 9. The grade, so the painted plates share the sky's light. */}
      <div className="layer layer--grade">
        <GradeLayer environment={environment} amount={gradeAmount} />
      </div>

      {/* 10. Light thrown back onto the city by the blast. */}
      {blastLight > 0.004 && (
        <div
          className="layer layer--blast-light"
          style={{ opacity: Math.min(0.85, blastLight) }}
        />
      )}

      {/* 11. Weather in front of everything, because it falls past the camera. */}
      <div className="layer layer--precipitation">{slots.precipitation}</div>

      {/*
        The destruction sequence deliberately sits outside a layer wrapper. Its
        wrapper keeps z-index auto so it creates no stacking context, which lets
        its two canvases interleave with the layers above: the column behind the
        skyline, the dust in front of it.
      */}
      {slots.destruction}

      <div className="layer layer--grain" />
    </div>
  )
}
