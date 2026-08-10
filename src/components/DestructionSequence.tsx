import { useEffect, useRef, useState } from 'react'
import { SmokeField, heatColour, type Particle } from '../lib/smoke-field'

/**
 * The fictional destruction sequence, animated.
 *
 * Previously this was two static images cross fading, which is why it read as a
 * slideshow. It is now staged the way the event actually unfolds:
 *
 *   flash    a few frames of overexposure, not a gradual fade up
 *   fireball rapid decelerating expansion, cooling white to red as it grows
 *   rise     buoyant ascent drawing a stem, cap spreading as the rise stalls
 *   shock    the front reaches the camera, so the picture shakes and dust
 *            sweeps through the foreground
 *   settle   smoke drifts, fires glow, everything hangs in the dust
 *   rebuild  the whole thing runs backwards and clears
 *
 * Two separate canvases are used because smoke has to be on both sides of the
 * city: the column sits behind the skyline, while dust blows across in front of
 * it. That was the missing foreground layer.
 */

export type DestructionPhase =
  | 'idle'
  | 'warning'
  | 'flash'
  | 'fireball'
  | 'rise'
  | 'shock'
  | 'settle'
  | 'rebuild'

type Props = {
  runId: number
  onPhaseChange: (phase: DestructionPhase) => void
  onIlluminationChange: (value: number) => void
  onComplete: () => void
  ambientMotion: boolean
}

/** Ground zero, chosen to sit behind the skyline and left of the tower. */
const ORIGIN_X = 0.36
const ORIGIN_Y = 0.545

const SCHEDULE: Array<[DestructionPhase, number]> = [
  ['warning', 0],
  ['flash', 3_000],
  ['fireball', 3_120],
  ['rise', 5_200],
  ['shock', 5_600],
  ['settle', 12_000],
  ['rebuild', 34_000],
]

export function DestructionSequence({
  runId,
  onPhaseChange,
  onIlluminationChange,
  onComplete,
  ambientMotion,
}: Props) {
  const [phase, setPhase] = useState<DestructionPhase>('idle')
  const [countdown, setCountdown] = useState(3)
  const backRef = useRef<HTMLCanvasElement | null>(null)
  const frontRef = useRef<HTMLCanvasElement | null>(null)
  const fieldRef = useRef<SmokeField | null>(null)
  const spriteRef = useRef<HTMLImageElement | null>(null)
  const phaseRef = useRef<DestructionPhase>('idle')
  phaseRef.current = phase

  useEffect(() => {
    const sprite = new Image()
    sprite.src = '/assets/smoke-puff.png'
    spriteRef.current = sprite
  }, [])

  useEffect(() => {
    if (!runId) {
      setPhase('idle')
      onPhaseChange('idle')
      onIlluminationChange(0)
      return
    }

    const timers: number[] = []
    for (const [next, delay] of SCHEDULE) {
      timers.push(
        window.setTimeout(() => {
          setPhase(next)
          onPhaseChange(next)
        }, delay),
      )
    }
    setCountdown(3)
    timers.push(window.setTimeout(() => setCountdown(2), 1_000))
    timers.push(window.setTimeout(() => setCountdown(1), 2_000))
    timers.push(
      window.setTimeout(() => {
        setPhase('idle')
        onPhaseChange('idle')
        onIlluminationChange(0)
        onComplete()
      }, 46_000),
    )
    return () => timers.forEach(window.clearTimeout)
  }, [runId, onPhaseChange, onComplete, onIlluminationChange])

  // Particle simulation and drawing.
  useEffect(() => {
    const detonated =
      phase === 'flash' || phase === 'fireball' || phase === 'rise' ||
      phase === 'shock' || phase === 'settle' || phase === 'rebuild'
    if (!detonated) {
      fieldRef.current = null
      return
    }

    const back = backRef.current
    const front = frontRef.current
    if (!back || !front) return
    const backContext = back.getContext('2d')
    const frontContext = front.getContext('2d')
    if (!backContext || !frontContext) return

    let frame = 0
    let last = performance.now()

    function resize(canvas: HTMLCanvasElement) {
      const parent = canvas.parentElement
      if (!parent) return
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5)
      const width = Math.round(parent.clientWidth * ratio * 0.7)
      const height = Math.round(parent.clientHeight * ratio * 0.7)
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = Math.max(2, width)
        canvas.height = Math.max(2, height)
      }
    }

    resize(back)
    resize(front)

    if (!fieldRef.current) {
      fieldRef.current = new SmokeField({
        originX: ORIGIN_X,
        originY: ORIGIN_Y,
        aspect: back.width / Math.max(back.height, 1),
      })
    }

    function drawParticle(
      context: CanvasRenderingContext2D,
      particle: Particle,
      width: number,
      height: number,
      fade: number,
    ) {
      const sprite = spriteRef.current
      if (!sprite || !sprite.complete) return

      const fraction = particle.age / particle.life
      // Fade in quickly, out slowly, so nothing pops into existence.
      const envelope = Math.min(1, fraction * 8) * Math.pow(1 - fraction, 0.7)
      const alpha = envelope * fade * (particle.kind === 'foreground' ? 0.5 : 0.62)
      if (alpha <= 0.004) return

      const [r, g, b] = heatColour(particle.heat)
      const size = particle.size * height * 2

      context.save()
      context.globalAlpha = alpha
      // Hot material adds light; cold smoke simply occludes.
      context.globalCompositeOperation = particle.heat > 0.12 ? 'lighter' : 'source-over'
      context.translate(particle.x * width, particle.y * height)
      context.rotate(particle.rotation)

      if (particle.kind === 'ember') {
        context.fillStyle = `rgb(${r} ${g} ${b})`
        context.beginPath()
        context.arc(0, 0, Math.max(0.6, particle.size * height), 0, Math.PI * 2)
        context.fill()
      } else {
        // Tint the neutral sprite by drawing it as a mask over a colour fill.
        const tintCanvas = getTintCanvas(sprite, r, g, b)
        context.drawImage(tintCanvas, -size / 2, -size / 2, size, size)
      }
      context.restore()
    }

    function render(now: number) {
      frame = requestAnimationFrame(render)
      const field = fieldRef.current
      const backTarget = backRef.current
      const frontTarget = frontRef.current
      if (!backTarget || !frontTarget || !field) return
      const backCtx = backTarget.getContext('2d')
      const frontCtx = frontTarget.getContext('2d')
      if (!backCtx || !frontCtx) return

      resize(backTarget)
      resize(frontTarget)

      const delta = Math.min(0.05, (now - last) / 1_000)
      last = now
      if (ambientMotion) field.update(delta)

      onIlluminationChange(field.illumination())

      // The whole field fades away during the rebuild.
      const fade = phaseRef.current === 'rebuild' ? Math.max(0, 1 - (field.time - 31) / 11) : 1

      backCtx.clearRect(0, 0, backTarget.width, backTarget.height)
      frontCtx.clearRect(0, 0, frontTarget.width, frontTarget.height)

      // Painter's order: distant material first so nearer smoke covers it.
      const sorted = [...field.particles].sort((a, b) => a.size - b.size)
      for (const particle of sorted) {
        if (particle.kind === 'foreground') {
          drawParticle(frontCtx, particle, frontTarget.width, frontTarget.height, fade)
        } else {
          drawParticle(backCtx, particle, backTarget.width, backTarget.height, fade)
        }
      }
    }

    frame = requestAnimationFrame(render)
    return () => cancelAnimationFrame(frame)
  }, [phase, ambientMotion, onIlluminationChange])

  if (phase === 'idle') return null

  return (
    <div className={`destruction destruction--${phase}`} aria-live="polite">
      {phase === 'warning' && (
        <div className="destruction__warning">
          <span>Fictional cinematic sequence armed</span>
          <strong>{countdown}</strong>
          <small>Reconstruction follows automatically</small>
        </div>
      )}

      {/* Column and dust behind the skyline. */}
      <canvas className="destruction__canvas destruction__canvas--back" ref={backRef} aria-hidden="true" />
      {/* Dust sweeping across in front of the city. */}
      <canvas className="destruction__canvas destruction__canvas--front" ref={frontRef} aria-hidden="true" />

      {phase === 'flash' && <div className="destruction__flash" aria-hidden="true" />}
      {(phase === 'shock' || phase === 'fireball') && (
        <div className="destruction__shock" aria-hidden="true" />
      )}
      {phase === 'rebuild' && <p className="destruction__label">Reconstruction in progress</p>}
    </div>
  )
}

/**
 * Small cache of tinted copies of the smoke sprite.
 *
 * Tinting per particle per frame would mean thousands of composite operations,
 * so colours are quantised into buckets and each bucket is rendered once.
 */
const tintCache = new Map<string, HTMLCanvasElement>()

function getTintCanvas(sprite: HTMLImageElement, r: number, g: number, b: number) {
  const key = `${r >> 4}:${g >> 4}:${b >> 4}`
  const cached = tintCache.get(key)
  if (cached) return cached

  const canvas = document.createElement('canvas')
  canvas.width = sprite.naturalWidth || 256
  canvas.height = sprite.naturalHeight || 256
  const context = canvas.getContext('2d')
  if (context) {
    context.drawImage(sprite, 0, 0, canvas.width, canvas.height)
    context.globalCompositeOperation = 'source-in'
    context.fillStyle = `rgb(${r} ${g} ${b})`
    context.fillRect(0, 0, canvas.width, canvas.height)
  }
  tintCache.set(key, canvas)
  return canvas
}
