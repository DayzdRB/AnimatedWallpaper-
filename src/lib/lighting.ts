import type { CSSProperties } from 'react'

type LightingStop = {
  hour: number
  tint: [number, number, number]
  tintOpacity: number
  nightOpacity: number
  brightness: number
  saturation: number
  stars: number
}

export type SceneLightingStyle = CSSProperties & Record<`--${string}`, string | number>

const STOPS: LightingStop[] = [
  { hour: 0, tint: [9, 20, 48], tintOpacity: 0.36, nightOpacity: 1, brightness: 0.52, saturation: 0.72, stars: 0.78 },
  { hour: 4.5, tint: [32, 47, 82], tintOpacity: 0.3, nightOpacity: 0.9, brightness: 0.58, saturation: 0.7, stars: 0.62 },
  { hour: 6.25, tint: [207, 130, 125], tintOpacity: 0.22, nightOpacity: 0.3, brightness: 0.78, saturation: 0.78, stars: 0.16 },
  { hour: 8, tint: [121, 177, 218], tintOpacity: 0.1, nightOpacity: 0, brightness: 0.98, saturation: 0.86, stars: 0 },
  { hour: 12.5, tint: [132, 197, 230], tintOpacity: 0.06, nightOpacity: 0, brightness: 1.08, saturation: 0.9, stars: 0 },
  { hour: 16.5, tint: [255, 205, 141], tintOpacity: 0.1, nightOpacity: 0, brightness: 1.04, saturation: 0.94, stars: 0 },
  { hour: 18.75, tint: [231, 143, 94], tintOpacity: 0.2, nightOpacity: 0.08, brightness: 0.92, saturation: 0.94, stars: 0.03 },
  { hour: 20.25, tint: [111, 73, 114], tintOpacity: 0.28, nightOpacity: 0.54, brightness: 0.72, saturation: 0.82, stars: 0.24 },
  { hour: 22, tint: [20, 35, 70], tintOpacity: 0.34, nightOpacity: 1, brightness: 0.56, saturation: 0.74, stars: 0.7 },
  { hour: 24, tint: [9, 20, 48], tintOpacity: 0.36, nightOpacity: 1, brightness: 0.52, saturation: 0.72, stars: 0.78 },
]

function lerp(a: number, b: number, amount: number) {
  return a + (b - a) * amount
}

export function getSceneLighting(sceneTime: number): SceneLightingStyle {
  const hour = ((sceneTime % 24) + 24) % 24
  const nextIndex = STOPS.findIndex((stop) => stop.hour >= hour)
  const right = STOPS[Math.max(1, nextIndex)]
  const left = STOPS[Math.max(0, nextIndex - 1)]
  const amount = (hour - left.hour) / Math.max(0.001, right.hour - left.hour)
  const tint = left.tint.map((channel, index) => Math.round(lerp(channel, right.tint[index], amount)))

  return {
    '--dynamic-light-color': tint.join(' '),
    '--dynamic-light-opacity': lerp(left.tintOpacity, right.tintOpacity, amount).toFixed(3),
    '--night-opacity': lerp(left.nightOpacity, right.nightOpacity, amount).toFixed(3),
    '--scene-brightness': lerp(left.brightness, right.brightness, amount).toFixed(3),
    '--scene-saturation': lerp(left.saturation, right.saturation, amount).toFixed(3),
    '--star-opacity': lerp(left.stars, right.stars, amount).toFixed(3),
  }
}

export function isSceneNight(sceneTime: number) {
  return sceneTime >= 20 || sceneTime < 6.5
}
