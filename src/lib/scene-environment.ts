/**
 * One object, recomputed as the clock moves, that every layer reads.
 *
 * This is the piece that makes separately authored layers agree with each
 * other. The sky, the sun, the clouds, the aircraft lights, the snow tint and
 * the grade applied to the painted plates all take their colour and intensity
 * from here, so none of them can drift out of step with the others. Previously
 * each layer had its own hand-tuned time-of-day table, which is exactly why
 * they looked like separate pictures stacked on top of each other.
 */

import {
  moonPosition,
  solarEvents,
  sunPosition,
  twilightBand,
  refraction,
  type Horizontal,
  type MoonState,
  type TwilightBand,
} from './ephemeris'
import {
  ambientColor,
  daylightFactor,
  exposureFor,
  hazeFor,
  nightFactor,
  sunDiscColor,
  sunDiscIntensity,
  sunlightColor,
  toCss,
  toCssHue,
  type AtmosphereParams,
  type Rgb,
} from './atmosphere'
import { HORIZON, angularSize, project, type ScreenPoint } from './camera'
import type { ResolvedSeason, SunTracking, WallpaperSettings, WeatherMode } from './settings'

export type CelestialPlacement = ScreenPoint & {
  /** Screen height of the disc as a fraction of frame height. */
  size: number
  /** Vertical squash from atmospheric refraction, 1 is round. */
  flattening: number
}

export type SceneEnvironment = {
  /** The instant being depicted, which is not always the current instant. */
  date: Date
  season: ResolvedSeason
  weather: WeatherMode

  sun: Horizontal
  moon: MoonState
  band: TwilightBand
  atmosphere: AtmosphereParams
  exposure: number

  /** 0 in daylight, 1 once the sky is fully dark. */
  night: number
  /** 0 with no direct sun, 1 in full daylight. */
  daylight: number

  sunPlacement: CelestialPlacement
  moonPlacement: CelestialPlacement

  /** Colour of the solar disc itself. */
  sunDisc: string
  sunDiscIntensity: number
  /** Warm directional light used to relight the plates. */
  sunlight: string
  /** Sky fill light used for the shadow side of the plates. */
  ambient: string
  /** Aerial perspective colour, what distant things fade toward. */
  haze: string

  /** How hard the relight pushes, 0 to 1. */
  gradeStrength: number
  /** Horizontal direction the sun light comes from, -1 left to 1 right. */
  lightDirection: number
}

const HAZE_LIFT = 1.25

function clamp(value: number, min: number, max: number) {
  return value < min ? min : value > max ? max : value
}

function normaliseForDisplay(colour: Rgb, floor = 0.06): Rgb {
  const peak = Math.max(colour[0], colour[1], colour[2], floor)
  return [colour[0] / peak, colour[1] / peak, colour[2] / peak]
}

/**
 * Where to draw a celestial body.
 *
 * In `realistic` mode the body goes exactly where it is, which means it spends
 * most of the day outside a 33 degree frame. In `framed` mode the day's arc is
 * remapped so the body crosses the picture, keeping the seasonal difference in
 * arc height but abandoning true azimuth. Realism and a visible sun are not
 * both available in this composition; this is the knob that chooses.
 */
function placeBody(
  body: Horizontal,
  date: Date,
  aspect: number,
  tracking: SunTracking,
  arcReference: number,
): CelestialPlacement {
  const diameter = body.angularDiameter
  const radius = diameter / 2
  const flattening = clamp(
    1 -
      (refraction(body.apparentAltitude - radius) - refraction(body.apparentAltitude + radius)) /
        Math.max(diameter, 0.01),
    0.62,
    1,
  )
  const size = angularSize(diameter)

  if (tracking === 'realistic') {
    const point = project(body.azimuth, body.apparentAltitude, aspect)
    return { ...point, size, flattening }
  }

  const events = solarEvents(date)
  /**
   * Normalising against a fixed reference rather than the day's own peak is
   * what preserves the seasonal difference. Against the day's peak, every
   * solar noon lands at the same height and December looks like June.
   */
  const peak = Math.max(arcReference, 4)

  let progress = 0.5
  if (events.sunrise && events.sunset) {
    const span = events.sunset.getTime() - events.sunrise.getTime()
    if (span > 0) progress = (date.getTime() - events.sunrise.getTime()) / span
  }

  // Sweep wider than the frame so the body enters and leaves rather than
  // appearing and vanishing at the edges.
  // Sweep only a little wider than the frame, so the body is in shot for most
  // of the day rather than only around the middle of it.
  const sweep = 1.24
  const x = 0.5 + (progress - 0.5) * sweep
  const arcHeight = clamp(body.apparentAltitude / peak, -0.35, 1)
  const y = HORIZON - arcHeight * (HORIZON - 0.12)

  return {
    x,
    y,
    behind: false,
    visible: x > -0.15 && x < 1.15 && y < 1.1,
    size,
    flattening,
  }
}

export function resolveSeasonFor(date: Date, mode: WallpaperSettings['seasonMode']): ResolvedSeason {
  if (mode !== 'auto') return mode
  // Astronomical rather than calendar seasons, keyed to the solstices.
  const month = date.getMonth() + 1
  const day = date.getDate()
  const ordinal = month * 100 + day
  if (ordinal >= 320 && ordinal < 621) return 'spring'
  if (ordinal >= 621 && ordinal < 922) return 'summer'
  if (ordinal >= 922 && ordinal < 1221) return 'autumn'
  return 'winter'
}

/**
 * The instant to depict. Paris time is the default; local and custom modes
 * shift the instant rather than faking a separate lighting path, so a custom
 * time of 05:30 in December produces a genuine December dawn.
 */
export function resolveSceneDate(now: Date, settings: WallpaperSettings): Date {
  if (settings.timeMode === 'custom') {
    const [hours, minutes] = settings.customTime.split(':').map(Number)
    if (Number.isFinite(hours) && Number.isFinite(minutes)) {
      const shifted = new Date(now)
      // The custom time is read as Paris wall clock time.
      const parisOffset = parisUtcOffsetHours(now)
      shifted.setUTCHours(hours - parisOffset, minutes, 0, 0)
      return shifted
    }
  }
  return now
}

function parisUtcOffsetHours(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Paris',
    hour: 'numeric',
    hourCycle: 'h23',
    day: 'numeric',
  }).formatToParts(date)
  const parisHour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0)
  const parisDay = Number(parts.find((part) => part.type === 'day')?.value ?? 0)
  let offset = parisHour - date.getUTCHours()
  if (parisDay !== date.getUTCDate()) offset += parisDay > date.getUTCDate() ? 24 : -24
  if (offset > 12) offset -= 24
  if (offset < -12) offset += 24
  return offset
}

export function buildEnvironment(
  now: Date,
  settings: WallpaperSettings,
  aspect: number,
): SceneEnvironment {
  const date = resolveSceneDate(now, settings)
  const season = resolveSeasonFor(date, settings.seasonMode)
  const sun = sunPosition(date)
  const moon = moonPosition(date)

  const atmosphere: AtmosphereParams = {
    sunAltitude: sun.apparentAltitude,
    sunAzimuth: sun.azimuth,
    haze: hazeFor(season, settings.weatherMode),
    lightPollution: settings.lightPollution,
    moonAltitude: moon.apparentAltitude,
    moonIllumination: moon.illumination,
  }

  const exposure = exposureFor(atmosphere)
  const night = nightFactor(sun.apparentAltitude)
  const daylight = daylightFactor(sun.apparentAltitude)
  // 64.6 degrees is the Paris midsummer maximum, so the framed arc reaches the
  // top of its travel in June and stays visibly low in December.
  const sunPlacement = placeBody(sun, date, aspect, settings.sunTracking, 64.6)
  const moonPlacement = placeBody(moon, date, aspect, settings.sunTracking, 60)

  const sunlightRaw = sunlightColor(atmosphere)
  const ambientRaw = ambientColor(atmosphere)

  return {
    date,
    season,
    weather: settings.weatherMode,
    sun,
    moon,
    band: twilightBand(sun.apparentAltitude),
    atmosphere,
    exposure,
    night,
    daylight,
    sunPlacement,
    moonPlacement,
    sunDisc: toCssHue(normaliseForDisplay(sunDiscColor(atmosphere))),
    sunDiscIntensity: sunDiscIntensity(atmosphere),
    sunlight: toCssHue(normaliseForDisplay(sunlightRaw)),
    ambient: toCssHue(normaliseForDisplay(ambientRaw, 0.02)),
    haze: toCss(ambientRaw, exposure * HAZE_LIFT),
    gradeStrength: clamp(0.22 + 0.5 * (1 - daylight) + 0.3 * night, 0, 0.92),
    lightDirection: clamp((sunPlacement.x - 0.5) * 2, -1.4, 1.4),
  }
}
