import { useEffect, useRef } from 'react'
import type { LightingState, SceneEnvironment } from '../../types/scene'

type Cloud = { x: number; y: number; r: number; depth: number; speed: number; seed: number }

function seeded(seed: number) {
  const x = Math.sin(seed * 917.31) * 43758.5453
  return x - Math.floor(x)
}

function createClouds(count: number): Cloud[] {
  return Array.from({ length: count }, (_, index) => ({
    x: seeded(index + 1) * 1900 - 120,
    y: 70 + seeded(index + 80) * 430,
    r: 54 + seeded(index + 220) * 105,
    depth: 0.45 + seeded(index + 310) * 0.55,
    speed: 5 + seeded(index + 490) * 11,
    seed: index * 9.17 + 2,
  }))
}

export function CloudLayer({ environment, lighting }: { environment: SceneEnvironment; lighting: LightingState }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const clouds = useRef(createClouds(34))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    let frame = 0
    let start = performance.now()
    let animation = 0
    const width = 1672
    const height = 941
    canvas.width = width
    canvas.height = height

    const draw = (now: number) => {
      frame++
      const t = (now - start) / 1000
      context.clearRect(0, 0, width, height)
      const coverage = Math.max(0, Math.min(1, environment.cloudCover))
      const visibleCount = Math.ceil(clouds.current.length * Math.max(0.08, coverage))
      const weatherWeight = environment.weather === 'storm' ? 1.45 : environment.weather === 'overcast' ? 1.2 : 1
      const windSpeed = 0.45 + environment.wind * 2.5
      const luma = Math.round(255 * lighting.cloudLuminance)

      for (let i = 0; i < visibleCount; i++) {
        const cloud = clouds.current[i]
        const x = ((cloud.x + t * cloud.speed * windSpeed) % 2050) - 150
        const y = cloud.y + Math.sin(t * 0.035 + cloud.seed) * 7
        const radius = cloud.r * (0.72 + coverage * 0.42) * weatherWeight
        const alpha = (0.08 + coverage * 0.33) * cloud.depth
        const stormTint = environment.weather === 'storm' ? 0.55 : environment.weather === 'overcast' ? 0.76 : 1
        const c = Math.round(luma * stormTint)

        const gradient = context.createRadialGradient(x, y, radius * 0.08, x, y, radius)
        gradient.addColorStop(0, `rgba(${c},${Math.min(255, c + 3)},${Math.min(255, c + 9)},${alpha})`)
        gradient.addColorStop(0.55, `rgba(${c},${Math.min(255, c + 2)},${Math.min(255, c + 7)},${alpha * 0.74})`)
        gradient.addColorStop(1, `rgba(${c},${Math.min(255, c + 2)},${Math.min(255, c + 8)},0)`)
        context.fillStyle = gradient
        context.beginPath()
        context.ellipse(x, y, radius * 1.45, radius * 0.58, 0, 0, Math.PI * 2)
        context.fill()

        // small billboard puffs create the slightly stylized environment-art shape.
        for (let p = 0; p < 4; p++) {
          const ox = (seeded(i * 11 + p + 700) - 0.5) * radius * 1.35
          const oy = (seeded(i * 17 + p + 900) - 0.5) * radius * 0.45
          const pr = radius * (0.25 + seeded(i * 23 + p + 1100) * 0.25)
          context.beginPath()
          context.fillStyle = `rgba(${Math.min(255, c + 12)},${Math.min(255, c + 13)},${Math.min(255, c + 18)},${alpha * 0.72})`
          context.arc(x + ox, y + oy, pr, 0, Math.PI * 2)
          context.fill()
        }
      }
      animation = requestAnimationFrame(draw)
    }
    animation = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animation)
  }, [environment.cloudCover, environment.wind, environment.weather, lighting.cloudLuminance])

  return <canvas className="scene-layer cloud-layer" ref={canvasRef} aria-hidden="true" />
}
