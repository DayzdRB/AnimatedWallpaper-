/**
 * A small single-scattering atmosphere.
 *
 * This replaces the five hand-painted sky SVGs. Rather than five fixed looks
 * with hard cuts between them, the sky is a continuous function of solar
 * altitude, so dawn, noon, the golden hour, civil twilight and night are all
 * the same equation evaluated at different sun positions. It is also what
 * produces the sun and ambient colours used to relight the painted plates,
 * which is what makes the separately authored layers agree with each other.
 *
 * The model is deliberately cheap: Rayleigh and Mie single scattering with
 * Kasten-Young airmass, a twilight ramp standing in for multiple scattering
 * once the sun is down, plus a sodium-tinted light pollution dome because
 * Paris does not have a dark sky.
 */

const DEG = Math.PI / 180

/** Kept local so the atmosphere stays independent of the camera module. */
const CAMERA_HEADING_HINT = 264

export type Rgb = [number, number, number]

/** Rayleigh optical depth at the zenith, per channel (680 / 550 / 440 nm). */
const TAU_RAYLEIGH: Rgb = [0.046_42, 0.108_46, 0.264_8]

/** Mie optical depth at the zenith for clean air. Scaled by haze. */
const TAU_MIE_BASE = 0.006_2

/** Mie asymmetry. Higher values tighten the glow around the sun. */
const MIE_G = 0.76

export type AtmosphereParams = {
  /** Solar altitude, degrees. Negative below the horizon. */
  sunAltitude: number
  /** Solar azimuth, degrees from north. */
  sunAzimuth: number
  /** Aerosol load. 1 is alpine, 3 is a clear Paris day, 8 is summer smog. */
  haze: number
  /** Sodium and LED skyglow, 0 to 1. Paris sits near 0.85. */
  lightPollution: number
  /** Lunar altitude, degrees. */
  moonAltitude: number
  /** Lunar illuminated fraction, 0 to 1. */
  moonIllumination: number
}

function clamp(value: number, min: number, max: number) {
  return value < min ? min : value > max ? max : value
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

/**
 * Kasten and Young 1989. Returns relative airmass for an apparent altitude.
 * At the zenith this is 1; at the horizon it approaches 38.
 */
export function airmass(altitudeDeg: number) {
  const h = Math.max(altitudeDeg, -1.5)
  return 1 / (Math.sin(h * DEG) + 0.505_72 * Math.pow(h + 6.079_95, -1.636_4))
}

function rayleighPhase(cosGamma: number) {
  return (3 / (16 * Math.PI)) * (1 + cosGamma * cosGamma)
}

function miePhase(cosGamma: number) {
  const g = MIE_G
  const denominator = Math.pow(1 + g * g - 2 * g * cosGamma, 1.5)
  return ((1 - g * g) / (4 * Math.PI)) / Math.max(denominator, 1e-4)
}

function tauMie(haze: number) {
  return TAU_MIE_BASE * haze
}

/**
 * Fraction of the solar beam surviving to the scattering volume, per channel.
 * Once the sun is below the horizon the geometric airmass diverges, so the
 * effective path length is capped and reddened instead, which is a stand-in
 * for the fact that late twilight is lit by sunlight grazing the upper
 * atmosphere rather than the air at eye level.
 */
function sunTransmittance(params: AtmosphereParams, altitudeOverride?: number): Rgb {
  const { haze } = params
  const sunAltitude = altitudeOverride ?? params.sunAltitude
  const effective = sunAltitude > 0 ? sunAltitude : sunAltitude * 0.25
  const m = Math.min(airmass(effective), 42)
  const tm = tauMie(haze)
  return [
    Math.exp(-(TAU_RAYLEIGH[0] + tm) * m),
    Math.exp(-(TAU_RAYLEIGH[1] + tm) * m),
    Math.exp(-(TAU_RAYLEIGH[2] + tm) * m),
  ]
}

/**
 * How much direct sunlight still reaches the scene at all. Real civil twilight
 * is roughly 400 times dimmer than daylight, and night is another factor of a
 * thousand below that, so this falls away steeply.
 */
export function daylightFactor(sunAltitude: number) {
  if (sunAltitude > 3) return 1
  return Math.pow(smoothstep(-7, 3, sunAltitude), 1.6)
}

export function twilightFactor(sunAltitude: number) {
  return Math.pow(smoothstep(-14, 1.5, sunAltitude), 2.6)
}

/**
 * Strength of the multiply-scattered component. This keeps its own, much
 * slower falloff than direct sunlight: the blue hour exists precisely because
 * multiple scattering from the upper atmosphere outlives the direct beam.
 */
export function multiScatterFactor(sunAltitude: number) {
  return Math.pow(smoothstep(-13, 2, sunAltitude), 1.15)
}

/** 0 in full daylight, 1 once the sky is fully dark. */
export function nightFactor(sunAltitude: number) {
  return 1 - smoothstep(-17, -3.5, sunAltitude)
}

/**
 * Colour of the solar disc itself. Near the horizon the beam crosses enough
 * air to lose most of its blue, which is why a low sun is orange and a high
 * sun is essentially white. This is measured extinction, not a colour ramp.
 */
export function sunDiscColor(params: AtmosphereParams): Rgb {
  const t = sunTransmittance(params)
  const peak = Math.max(t[0], t[1], t[2], 1e-4)
  return [t[0] / peak, t[1] / peak, t[2] / peak]
}

/**
 * Brightness of the solar disc relative to a high sun, 0 to 1. A setting sun
 * is genuinely dimmer as well as redder, and forgetting that is why cartoon
 * suns read as stickers.
 */
export function sunDiscIntensity(params: AtmosphereParams) {
  const t = sunTransmittance(params)
  const luminance = 0.2126 * t[0] + 0.7152 * t[1] + 0.0722 * t[2]
  return clamp(luminance, 0, 1) * smoothstep(-2.2, 0.4, params.sunAltitude)
}

/**
 * Sky radiance for one view direction, in linear units before exposure.
 */
export function skyRadiance(
  viewAzimuth: number,
  viewElevation: number,
  params: AtmosphereParams,
): Rgb {
  const { sunAltitude, sunAzimuth, haze, lightPollution } = params

  const ve = viewElevation * DEG
  const se = sunAltitude * DEG
  const cosGamma = clamp(
    Math.sin(ve) * Math.sin(se) +
      Math.cos(ve) * Math.cos(se) * Math.cos((viewAzimuth - sunAzimuth) * DEG),
    -1,
    1,
  )

  const pR = rayleighPhase(cosGamma)
  const pM = miePhase(cosGamma)

  const mView = Math.min(airmass(viewElevation), 38)
  const tm = tauMie(haze)
  const twilight = twilightFactor(sunAltitude)
  const gamma = Math.acos(cosGamma) / DEG

  /**
   * Light scattered toward the eye from near the sun has travelled the full
   * grazing path and is heavily reddened. Light arriving from the opposite side
   * of the sky was scattered higher up, on a shorter path, and stays much
   * cooler. Blending the two by angular distance from the sun keeps a sunset
   * fiery where it should be and blue where it should be, instead of dyeing
   * the whole dome one colour.
   */
  const nearSun = sunTransmittance(params)
  const farFromSun = sunTransmittance(params, Math.max(sunAltitude, 9))
  const pathBlend = smoothstep(12, 92, gamma)
  const transmit: Rgb = [
    nearSun[0] + (farFromSun[0] - nearSun[0]) * pathBlend,
    nearSun[1] + (farFromSun[1] - nearSun[1]) * pathBlend,
    nearSun[2] + (farFromSun[2] - nearSun[2]) * pathBlend,
  ]

  const multiPath = Math.min(airmass(Math.max(sunAltitude, 14)), 4)
  const multiple: Rgb = [
    Math.exp(-(TAU_RAYLEIGH[0] + tm) * multiPath),
    Math.exp(-(TAU_RAYLEIGH[1] + tm) * multiPath),
    Math.exp(-(TAU_RAYLEIGH[2] + tm) * multiPath),
  ]
  const multipleStrength = 0.46 * multiScatterFactor(sunAltitude)

  const scattered: Rgb = [0, 0, 0]
  for (let channel = 0; channel < 3; channel += 1) {
    const tauTotal = TAU_RAYLEIGH[channel] + tm
    const inscatter = (TAU_RAYLEIGH[channel] * pR + tm * pM) / tauTotal
    const pathFactor = 1 - Math.exp(-tauTotal * mView)
    const single = transmit[channel] * inscatter * pathFactor * 5.6 * twilight
    const multi =
      multiple[channel] *
      (TAU_RAYLEIGH[channel] / (TAU_RAYLEIGH[1] + tm)) *
      pathFactor *
      multipleStrength
    scattered[channel] = single + multi
  }

  // Night floor: airglow plus the scattered moonlight that survives it.
  const night = nightFactor(sunAltitude)
  if (night > 0) {
    const airglow: Rgb = [0.001_3, 0.001_9, 0.004_4]
    const moonUp = smoothstep(-4, 8, params.moonAltitude)
    const moonScatter =
      0.012 * moonUp * Math.pow(params.moonIllumination, 1.4) * (1 - Math.exp(-0.35 * mView))
    for (let channel = 0; channel < 3; channel += 1) {
      scattered[channel] += night * (airglow[channel] + moonScatter * [0.72, 0.82, 1][channel])
    }

    // Paris skyglow: brightest just above the rooftops, sodium and LED tinted.
    const dome = Math.exp(-Math.max(viewElevation, 0) / 7.5)
    const glow = 0.009 * lightPollution * night * dome
    scattered[0] += glow * 1
    scattered[1] += glow * 0.78
    scattered[2] += glow * 0.62
  }

  return scattered
}

/**
 * Direct sunlight colour and strength used to relight the painted plates.
 * The plates were painted under a warm low sun, so at midday the grade pushes
 * them cooler and at dusk it pushes them warmer, and both come from here.
 */
export function sunlightColor(params: AtmosphereParams): Rgb {
  const disc = sunDiscColor(params)
  const strength = daylightFactor(params.sunAltitude)
  return [disc[0] * strength, disc[1] * strength, disc[2] * strength]
}

/**
 * Ambient skylight: the average of the sky hemisphere, which is what fills
 * shadows. Sampled rather than integrated properly, which is plenty.
 */
export function ambientColor(params: AtmosphereParams): Rgb {
  const samples: Array<[number, number]> = [
    [params.sunAzimuth, 60],
    [params.sunAzimuth, 20],
    [params.sunAzimuth + 90, 35],
    [params.sunAzimuth + 180, 45],
    [params.sunAzimuth + 180, 12],
    [params.sunAzimuth + 270, 35],
  ]
  const total: Rgb = [0, 0, 0]
  for (const [azimuth, elevation] of samples) {
    const radiance = skyRadiance(azimuth, elevation, params)
    total[0] += radiance[0]
    total[1] += radiance[1]
    total[2] += radiance[2]
  }
  return [total[0] / samples.length, total[1] / samples.length, total[2] / samples.length]
}

/**
 * Auto exposure. Daylight and starlight differ by six orders of magnitude and
 * a wallpaper has to be legible at both, so the scene is metered rather than
 * shown at absolute brightness. A human eye adapting does much the same thing.
 */
export function exposureFor(params: AtmosphereParams) {
  // Meter the band the camera can actually see. The frame tops out under 10
  // degrees of elevation, so metering the zenith blows the picture out.
  let luminance = 0
  const azimuths = [-24, 0, 24]
  for (const offset of azimuths) {
    const sample = skyRadiance(CAMERA_HEADING_HINT + offset, 4.5, params)
    luminance += 0.2126 * sample[0] + 0.7152 * sample[1] + 0.0722 * sample[2]
  }
  luminance /= azimuths.length
  // Deliberately incomplete adaptation. A fully compensating meter makes dusk
  // brighter than sunset, which is the opposite of what the sky does.
  const target = 0.3
  return clamp(Math.pow(target / Math.max(luminance, 1e-5), 0.62), 0.45, 3.4)
}

/** Filmic-ish shoulder so bright skies roll off instead of clipping flat. */
export function tonemap(value: number) {
  const x = Math.max(value, 0)
  return (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14)
}

export function linearToSrgb(value: number) {
  const v = clamp(value, 0, 1)
  return v <= 0.003_130_8 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055
}

export function encode(linear: Rgb, exposure: number): [number, number, number] {
  return [
    Math.round(255 * linearToSrgb(tonemap(linear[0] * exposure))),
    Math.round(255 * linearToSrgb(tonemap(linear[1] * exposure))),
    Math.round(255 * linearToSrgb(tonemap(linear[2] * exposure))),
  ]
}

/**
 * Encode an already normalised colour without the tone map.
 *
 * The tone map exists to roll off scene radiance, so applying it to a colour
 * that has already been scaled to peak at 1 just crushes white to 232.
 */
export function toCssHue(colour: Rgb, alpha = 1) {
  const r = Math.round(255 * linearToSrgb(colour[0]))
  const g = Math.round(255 * linearToSrgb(colour[1]))
  const b = Math.round(255 * linearToSrgb(colour[2]))
  return alpha >= 1 ? `rgb(${r} ${g} ${b})` : `rgb(${r} ${g} ${b} / ${alpha})`
}

export function toCss(linear: Rgb, exposure: number, alpha = 1) {
  const [r, g, b] = encode(linear, exposure)
  return alpha >= 1 ? `rgb(${r} ${g} ${b})` : `rgb(${r} ${g} ${b} / ${alpha})`
}

/** Haze appropriate to the season and weather, feeding the aerial perspective. */
export function hazeFor(season: string, weather: string) {
  const base =
    season === 'summer' ? 3.4 : season === 'spring' ? 2.6 : season === 'autumn' ? 3.0 : 1.9
  const weatherScale =
    weather === 'storm' ? 2.1 : weather === 'rain' ? 1.7 : weather === 'snow' ? 1.5 : 1
  return clamp(base * weatherScale, 1, 10)
}
