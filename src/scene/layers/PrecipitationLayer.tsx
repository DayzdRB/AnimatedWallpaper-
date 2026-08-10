import { useEffect, useRef } from 'react'
import type { LightingState, SceneEnvironment } from '../../types/scene'

type Particle = { x: number; y: number; z: number; drift: number; speed: number; size: number }

function randomParticle(index: number): Particle {
  const rnd = (n: number) => (Math.sin((index + 1) * n) * 43758.5453) % 1
  const a = Math.abs(rnd(12.9898)); const b = Math.abs(rnd(78.233)); const c = Math.abs(rnd(39.425));
  return { x: a * 1672, y: b * 941, z: 0.35 + c * 0.65, drift: -18 + a * 36, speed: 110 + b * 260, size: 1 + c * 2.6 }
}

const particles = Array.from({ length: 290 }, (_, index) => randomParticle(index))

export function PrecipitationLayer({ environment, lighting, reducedMotion }: { environment: SceneEnvironment; lighting: LightingState; reducedMotion: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || reducedMotion) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = 1672; canvas.height = 941
    let animation = 0
    let start = performance.now()

    const draw = (now: number) => {
      const t = (now - start) / 1000
      ctx.clearRect(0, 0, 1672, 941)
      const snowing = environment.weather === 'snow'
      const raining = environment.weather === 'rain' || environment.weather === 'storm'
      if (!snowing && !raining) {
        animation = requestAnimationFrame(draw)
        return
      }
      const intensity = Math.max(0.06, environment.precipitation)
      const count = Math.floor(particles.length * intensity)
      const wind = (environment.wind - 0.18) * 90

      if (snowing) {
        const luma = Math.round(255 * lighting.snowBrightness)
        for (let i = 0; i < count; i++) {
          const p = particles[i]
          const y = (p.y + t * p.speed * 0.24 * p.z) % 990 - 30
          const x = (p.x + t * (p.drift + wind) * p.z + Math.sin(t * 0.8 + i) * 12) % 1740 - 30
          ctx.fillStyle = `rgba(${luma},${Math.min(255, luma + 4)},${Math.min(255, luma + 11)},${0.22 + p.z * 0.42})`
          ctx.beginPath(); ctx.arc(x, y, p.size * (0.8 + p.z), 0, Math.PI * 2); ctx.fill()
        }
      } else {
        for (let i = 0; i < count; i++) {
          const p = particles[i]
          const y = (p.y + t * p.speed * 1.8 * p.z) % 1000 - 40
          const x = (p.x + t * (wind + 35) * p.z) % 1740 - 30
          ctx.strokeStyle = `rgba(206,220,232,${0.12 + p.z * 0.28})`
          ctx.lineWidth = 0.8 + p.z * 1.1
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + wind * 0.045, y + 15 + p.z * 18); ctx.stroke()
        }
      }
      animation = requestAnimationFrame(draw)
    }
    animation = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animation)
  }, [environment.precipitation, environment.weather, environment.wind, lighting.snowBrightness, reducedMotion])

  if (reducedMotion) return null
  return <canvas ref={canvasRef} className="scene-layer precipitation-layer" aria-hidden="true" />
}
