/**
 * Real solar and lunar position for a given instant and observer.
 *
 * Solar: NOAA / Meeus low-precision algorithm. Accurate to well under a
 * tenth of a degree, which is far better than a 19-degree field of view needs.
 * Lunar: Meeus abbreviated series (~0.3 deg), plenty for a disc that is
 * half a degree wide.
 *
 * Everything else in the renderer derives from the numbers this file produces.
 * There are no hand-authored time-of-day tables anywhere downstream.
 */

export const PARIS = { latitude: 48.8584, longitude: 2.2945 }

export type Horizontal = {
  /** Geometric altitude above the true horizon, degrees. Negative below. */
  altitude: number
  /** Apparent altitude including atmospheric refraction, degrees. */
  apparentAltitude: number
  /** Azimuth measured clockwise from true north, degrees. */
  azimuth: number
  /** Distance to the body, kilometres. */
  distanceKm: number
  /** Apparent angular diameter, degrees. */
  angularDiameter: number
}

export type MoonState = Horizontal & {
  /** Illuminated fraction of the disc, 0 (new) to 1 (full). */
  illumination: number
  /** 0 new, 0.25 first quarter, 0.5 full, 0.75 last quarter. */
  phase: number
  /** True when the terminator bulges toward increasing longitude. */
  waxing: boolean
}

const DEG = Math.PI / 180
const SUN_RADIUS_KM = 695_700
const MOON_RADIUS_KM = 1_737.4

function norm360(value: number) {
  const wrapped = value % 360
  return wrapped < 0 ? wrapped + 360 : wrapped
}

export function julianDay(date: Date) {
  return date.getTime() / 86_400_000 + 2_440_587.5
}

function daysSinceJ2000(date: Date) {
  return julianDay(date) - 2_451_545
}

/**
 * Bennett's refraction formula, arcminutes, for an apparent altitude in degrees.
 * At the horizon this lifts a body by roughly 34 arcminutes, which is why the
 * sun visibly sits on the horizon while being geometrically below it.
 */
export function refraction(altitudeDeg: number) {
  if (altitudeDeg < -2) return 0
  const h = Math.max(altitudeDeg, -0.5)
  return (1.02 / Math.tan((h + 10.3 / (h + 5.11)) * DEG)) / 60
}

/** Greenwich mean sidereal time in degrees. */
function greenwichSiderealTime(date: Date) {
  const d = daysSinceJ2000(date)
  return norm360(280.460_618_37 + 360.985_647_366_29 * d)
}

function equatorialToHorizontal(
  rightAscension: number,
  declination: number,
  date: Date,
  latitude: number,
  longitude: number,
) {
  const hourAngle = norm360(greenwichSiderealTime(date) + longitude - rightAscension) * DEG
  const dec = declination * DEG
  const lat = latitude * DEG

  const sinAlt = Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(hourAngle)
  const altitude = Math.asin(Math.max(-1, Math.min(1, sinAlt))) / DEG

  const azimuth = norm360(
    180 +
      Math.atan2(
        Math.sin(hourAngle),
        Math.cos(hourAngle) * Math.sin(lat) - Math.tan(dec) * Math.cos(lat),
      ) /
        DEG,
  )

  return { altitude, azimuth }
}

export function sunPosition(date: Date, latitude = PARIS.latitude, longitude = PARIS.longitude): Horizontal {
  const t = daysSinceJ2000(date) / 36_525

  const meanLongitude = norm360(280.466_46 + t * (36_000.769_83 + t * 0.000_303_2))
  const meanAnomaly = (357.529_11 + t * (35_999.050_29 - 0.000_153_7 * t)) * DEG
  const eccentricity = 0.016_708_634 - t * (0.000_042_037 + 0.000_000_126_7 * t)

  const centre =
    Math.sin(meanAnomaly) * (1.914_602 - t * (0.004_817 + 0.000_014 * t)) +
    Math.sin(2 * meanAnomaly) * (0.019_993 - 0.000_101 * t) +
    Math.sin(3 * meanAnomaly) * 0.000_289

  const trueLongitude = meanLongitude + centre
  const trueAnomaly = meanAnomaly + centre * DEG
  const radiusVectorAu =
    (1.000_001_018 * (1 - eccentricity * eccentricity)) / (1 + eccentricity * Math.cos(trueAnomaly))

  const omega = (125.04 - 1_934.136 * t) * DEG
  const apparentLongitude = (trueLongitude - 0.005_69 - 0.004_78 * Math.sin(omega)) * DEG

  const meanObliquity =
    23 + (26 + (21.448 - t * (46.815 + t * (0.000_59 - t * 0.001_813))) / 60) / 60
  const obliquity = (meanObliquity + 0.002_56 * Math.cos(omega)) * DEG

  const declination =
    Math.asin(Math.sin(obliquity) * Math.sin(apparentLongitude)) / DEG
  const rightAscension =
    norm360(
      Math.atan2(Math.cos(obliquity) * Math.sin(apparentLongitude), Math.cos(apparentLongitude)) / DEG,
    )

  const { altitude, azimuth } = equatorialToHorizontal(rightAscension, declination, date, latitude, longitude)
  const distanceKm = radiusVectorAu * 149_597_870.7

  return {
    altitude,
    apparentAltitude: altitude + refraction(altitude),
    azimuth,
    distanceKm,
    angularDiameter: (2 * Math.atan(SUN_RADIUS_KM / distanceKm)) / DEG,
  }
}

/** Ecliptic longitude of the sun, degrees. Used for the lunar phase angle. */
function sunEclipticLongitude(date: Date) {
  const t = daysSinceJ2000(date) / 36_525
  const meanLongitude = norm360(280.466_46 + t * (36_000.769_83 + t * 0.000_303_2))
  const meanAnomaly = (357.529_11 + t * 35_999.050_29) * DEG
  return norm360(
    meanLongitude + 1.914_602 * Math.sin(meanAnomaly) + 0.019_993 * Math.sin(2 * meanAnomaly),
  )
}

export function moonPosition(date: Date, latitude = PARIS.latitude, longitude = PARIS.longitude): MoonState {
  const d = daysSinceJ2000(date)

  const meanLongitude = norm360(218.316_4 + 13.176_396_47 * d)
  const meanAnomaly = norm360(134.963_4 + 13.064_993_1 * d) * DEG
  const argumentOfLatitude = norm360(93.272_1 + 13.229_350_1 * d) * DEG
  const meanElongation = norm360(297.850_2 + 12.190_749_1 * d) * DEG

  const eclipticLongitude = norm360(
    meanLongitude +
      6.289 * Math.sin(meanAnomaly) +
      1.274 * Math.sin(2 * meanElongation - meanAnomaly) +
      0.658 * Math.sin(2 * meanElongation) +
      0.214 * Math.sin(2 * meanAnomaly) -
      0.186 * Math.sin(norm360(357.529_1 + 0.985_600_28 * d) * DEG),
  )
  const eclipticLatitude =
    5.128 * Math.sin(argumentOfLatitude) + 0.281 * Math.sin(meanAnomaly + argumentOfLatitude)
  const distanceKm =
    385_001 - 20_905 * Math.cos(meanAnomaly) - 3_699 * Math.cos(2 * meanElongation - meanAnomaly)

  const obliquity = 23.439_291 * DEG
  const lambda = eclipticLongitude * DEG
  const beta = eclipticLatitude * DEG

  const rightAscension = norm360(
    Math.atan2(
      Math.sin(lambda) * Math.cos(obliquity) - Math.tan(beta) * Math.sin(obliquity),
      Math.cos(lambda),
    ) / DEG,
  )
  const declination =
    Math.asin(
      Math.sin(beta) * Math.cos(obliquity) + Math.cos(beta) * Math.sin(obliquity) * Math.sin(lambda),
    ) / DEG

  const { altitude, azimuth } = equatorialToHorizontal(rightAscension, declination, date, latitude, longitude)

  const elongation = norm360(eclipticLongitude - sunEclipticLongitude(date))
  const phaseAngle = (180 - elongation) * DEG
  const illumination = (1 + Math.cos(phaseAngle)) / 2

  return {
    altitude,
    apparentAltitude: altitude + refraction(altitude),
    azimuth,
    distanceKm,
    angularDiameter: (2 * Math.atan(MOON_RADIUS_KM / distanceKm)) / DEG,
    illumination,
    phase: elongation / 360,
    waxing: elongation < 180,
  }
}

export type SolarEvents = {
  /** Local instant the upper limb clears the horizon. Null inside a polar day. */
  sunrise: Date | null
  sunset: Date | null
  solarNoon: Date
  /** Greatest altitude reached, degrees. Drives the framed sun's arc height. */
  maxAltitude: number
}

const eventCache = new Map<string, SolarEvents>()

/**
 * Sunrise, sunset and the day's peak altitude, found by sampling rather than
 * by closed form. Ten minute steps refined by bisection is accurate to a few
 * seconds and costs nothing once per day.
 */
export function solarEvents(
  date: Date,
  latitude = PARIS.latitude,
  longitude = PARIS.longitude,
): SolarEvents {
  const key = `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}-${latitude}-${longitude}`
  const cached = eventCache.get(key)
  if (cached) return cached

  const startOfDay = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  const altitudeAt = (offsetMs: number) =>
    sunPosition(new Date(startOfDay + offsetMs), latitude, longitude).apparentAltitude

  const step = 600_000
  let sunrise: Date | null = null
  let sunset: Date | null = null
  let peak = -90
  let peakOffset = 0

  let previous = altitudeAt(0)
  for (let offset = step; offset <= 86_400_000; offset += step) {
    const current = altitudeAt(offset)
    if (current > peak) {
      peak = current
      peakOffset = offset
    }
    const crossedUp = previous <= 0 && current > 0
    const crossedDown = previous > 0 && current <= 0
    if (crossedUp || crossedDown) {
      let low = offset - step
      let high = offset
      for (let iteration = 0; iteration < 22; iteration += 1) {
        const middle = (low + high) / 2
        if (altitudeAt(middle) > 0 === crossedUp) high = middle
        else low = middle
      }
      const crossing = new Date(startOfDay + (low + high) / 2)
      if (crossedUp && !sunrise) sunrise = crossing
      if (crossedDown && !sunset) sunset = crossing
    }
    previous = current
  }

  const events: SolarEvents = {
    sunrise,
    sunset,
    solarNoon: new Date(startOfDay + peakOffset),
    maxAltitude: peak,
  }
  eventCache.set(key, events)
  if (eventCache.size > 24) eventCache.delete(eventCache.keys().next().value as string)
  return events
}

export type TwilightBand = 'day' | 'golden' | 'civil' | 'nautical' | 'astronomical' | 'night'

/**
 * Standard twilight bands, keyed off true solar altitude rather than clock
 * hours. This is what makes a June evening and a December evening behave
 * differently without a single seasonal special case.
 */
export function twilightBand(sunAltitude: number): TwilightBand {
  if (sunAltitude > 6) return 'day'
  if (sunAltitude > -0.833) return 'golden'
  if (sunAltitude > -6) return 'civil'
  if (sunAltitude > -12) return 'nautical'
  if (sunAltitude > -18) return 'astronomical'
  return 'night'
}
