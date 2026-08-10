import type { CSSProperties } from 'react'
import type { ResolvedSeason } from '../lib/settings'

/**
 * Seasons applied through masks derived from the plates themselves.
 *
 * The painted Paris artwork cannot be repainted four times, so the season is
 * applied as a graded tint through two masks extracted from each plate: one
 * covering foliage, one covering upward facing surfaces where snow settles.
 * Tinting the foliage mask with a `color` blend shifts hue while keeping the
 * original luminance and detail, which is what actually reads as autumn.
 *
 * The masks are generated for every plate including the tower and the
 * foreground, which fixes the previous behaviour where the season overlay sat
 * below the tower plate and left the tower summer green in a snowstorm.
 */

type SeasonTreatment = {
  /** Colour laid over the foliage mask. */
  foliage: string | null
  /** Blend used for the foliage tint. */
  foliageBlend: 'color' | 'saturation' | 'multiply'
  foliageOpacity: number
  /** Snow accumulation on upward facing surfaces. */
  snowOpacity: number
}

const TREATMENTS: Record<ResolvedSeason, SeasonTreatment> = {
  // Fresh growth: yellow-green and bright.
  spring: { foliage: 'rgb(126 186 92)', foliageBlend: 'color', foliageOpacity: 0.5, snowOpacity: 0 },
  // Mature canopy: deeper and more saturated.
  summer: { foliage: 'rgb(58 122 52)', foliageBlend: 'color', foliageOpacity: 0.4, snowOpacity: 0 },
  // Senescence: carotenoid oranges through to brown.
  autumn: { foliage: 'rgb(196 112 38)', foliageBlend: 'color', foliageOpacity: 0.78, snowOpacity: 0 },
  // Bare branches read as desaturated grey-brown, plus lying snow.
  winter: { foliage: 'rgb(122 106 88)', foliageBlend: 'color', foliageOpacity: 0.72, snowOpacity: 0.82 },
}

const PLATES = ['paris-city-day', 'paris-tower-day', 'paris-foreground-day'] as const

function maskStyle(url: string, mobileUrl: string): CSSProperties {
  return {
    maskImage: `url(${url})`,
    WebkitMaskImage: `url(${url})`,
    maskSize: '100% 100%',
    WebkitMaskSize: '100% 100%',
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
    // The portrait masks are wired through a data attribute and a media query
    // in the stylesheet, since mask-image has no picture element equivalent.
    ['--mask-mobile' as string]: `url(${mobileUrl})`,
  }
}

export function SeasonLayer({
  season,
  snowfallDepth,
}: {
  season: ResolvedSeason
  /** Extra accumulation while it is actively snowing, 0 to 1. */
  snowfallDepth: number
}) {
  const treatment = TREATMENTS[season]
  const snow = Math.min(1, treatment.snowOpacity + snowfallDepth * 0.5)

  return (
    <div className="season-layer" aria-hidden="true">
      {PLATES.map((plate) => (
        <div className="season-layer__plate" key={plate}>
          {treatment.foliage && (
            <div
              className="season-layer__tint"
              style={{
                ...maskStyle(`/assets/${plate}-foliage.png`, `/assets/${plate}-mobile-foliage.png`),
                backgroundColor: treatment.foliage,
                mixBlendMode: treatment.foliageBlend,
                opacity: treatment.foliageOpacity,
              }}
            />
          )}
          {snow > 0.01 && (
            <div
              className="season-layer__snow"
              style={{
                ...maskStyle(`/assets/${plate}-snow.png`, `/assets/${plate}-mobile-snow.png`),
                opacity: snow,
              }}
            />
          )}
        </div>
      ))}
    </div>
  )
}
