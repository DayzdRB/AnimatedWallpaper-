import type { LightingState, SceneEnvironment } from '../types/scene'

type ColorStop = { minute: number; top: [number, number, number]; horizon: [number, number, number]; lower: [number, number, number] }

const skyStops: ColorStop[] = [
  { minute: 0, top: [7, 18, 35], horizon: [22, 38, 63], lower: [31, 44, 67] },
  { minute: 300, top: [33, 54, 87], horizon: [183, 123, 116], lower: [217, 171, 139] },
  { minute: 420, top: [75, 132, 187], horizon: [212, 183, 143], lower: [229, 209, 174] },
  { minute: 720, top: [55, 148, 215], horizon: [164, 207, 231], lower: [214, 227, 235] },
  { minute: 960, top: [65, 132, 194], horizon: [226, 164, 95], lower: [236, 190, 128] },
  { minute: 1080, top: [61, 91, 139], horizon: [193, 112, 97], lower: [207, 137, 112] },
  { minute: 1320, top: [10, 25, 48], horizon: [26, 43, 68], lower: [34, 50, 73] },
  { minute: 1440, top: [7, 18, 35], horizon: [22, 38, 63], lower: [31, 44, 67] },
]

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }
function color(a: [number, number, number], b: [number, number, number], t: number) {
  const v = a.map((n, i) => Math.round(lerp(n, b[i], t)))
  return `rgb(${v[0]} ${v[1]} ${v[2]})`
}
function skyColor(minutes: number) {
  const m = ((minutes % 1440) + 1440) % 1440
  let left = skyStops[0]
  let right = skyStops[skyStops.length - 1]
  for (let i = 0; i < skyStops.length - 1; i++) {
    if (m >= skyStops[i].minute && m <= skyStops[i + 1].minute) {
      left = skyStops[i]
      right = skyStops[i + 1]
      break
    }
  }
  const span = Math.max(1, right.minute - left.minute)
  const t = (m - left.minute) / span
  return {
    top: color(left.top, right.top, t),
    horizon: color(left.horizon, right.horizon, t),
    lower: color(left.lower, right.lower, t),
  }
}

export function calculateLighting(env: SceneEnvironment): LightingState {
  const baseByTime = {
    dawn: { ambient: 0.64, city: 0.67, monument: 0.72, saturation: 0.88, warmth: 0.18, lamps: 0.55 },
    morning: { ambient: 0.9, city: 0.91, monument: 0.94, saturation: 0.98, warmth: 0.05, lamps: 0.12 },
    midday: { ambient: 1, city: 1, monument: 1, saturation: 1, warmth: 0, lamps: 0.02 },
    goldenHour: { ambient: 0.88, city: 0.92, monument: 0.96, saturation: 1.04, warmth: 0.24, lamps: 0.12 },
    dusk: { ambient: 0.56, city: 0.58, monument: 0.63, saturation: 0.86, warmth: 0.12, lamps: 0.72 },
    night: { ambient: 0.28, city: 0.32, monument: 0.36, saturation: 0.7, warmth: -0.06, lamps: 1 },
  }[env.timeOfDay]

  const weatherDarkening = {
    clear: 1,
    partlyCloudy: 0.96,
    overcast: 0.82,
    fog: 0.78,
    rain: 0.74,
    storm: 0.6,
    snow: env.isNight ? 0.82 : 0.88,
  }[env.weather]

  const weatherSaturation = {
    clear: 1,
    partlyCloudy: 0.98,
    overcast: 0.86,
    fog: 0.78,
    rain: 0.82,
    storm: 0.7,
    snow: 0.84,
  }[env.weather]

  const sky = skyColor(env.minuteOfDay)
  const cloudPenalty = 1 - env.cloudCover * 0.12
  const visibilityHaze = 1 - env.visibility
  const cityBrightness = baseByTime.city * weatherDarkening * cloudPenalty
  const monumentBrightness = Math.min(1.04, baseByTime.monument * weatherDarkening * (1 - env.cloudCover * 0.08))
  const lampIntensity = Math.min(1, baseByTime.lamps + Math.max(0, 0.48 - cityBrightness) * 0.62)
  const snowBrightness = env.isNight
    ? 0.28 + lampIntensity * 0.16
    : 0.78 + baseByTime.ambient * 0.18

  return {
    ambientIntensity: baseByTime.ambient * weatherDarkening,
    cityBrightness,
    monumentBrightness,
    cityContrast: env.weather === 'fog' ? 0.88 : env.weather === 'storm' ? 0.96 : 1.02,
    monumentContrast: env.weather === 'fog' ? 0.94 : 1.06,
    saturation: baseByTime.saturation * weatherSaturation,
    warmth: baseByTime.warmth,
    lampIntensity,
    monumentLightIntensity: lampIntensity * (env.isNight ? 1 : env.timeOfDay === 'dusk' ? 0.72 : 0.16),
    buildingLightIntensity: lampIntensity * (env.isNight ? 0.9 : env.timeOfDay === 'dusk' ? 0.62 : 0.08),
    hazeOpacity: Math.min(0.72, visibilityHaze * 0.88 + env.cloudCover * 0.06),
    snowBrightness,
    cloudLuminance: env.isNight ? 0.28 : env.timeOfDay === 'dusk' ? 0.6 : 0.92,
    skyTop: sky.top,
    skyHorizon: sky.horizon,
    skyLower: sky.lower,
  }
}
