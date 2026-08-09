import { useEffect, useRef, useState } from 'react'
import {
  drawBillboards,
  drawDeck,
  separateTexture,
  type Billboard,
  type DeckPalette,
  type DeckSpec,
  type SeparatedTexture,
} from '../lib/cloud-render'
import type { SceneEnvironment } from '../lib/scene-environment'
import { effectiveCoverage, type WeatherMode } from '../lib/settings'
import { CAMERA_HEADING } from '../lib/camera'

/**
 * Weather driven cloud decks.
 *
 * Cloud base altitudes are the ones the types actually occur at, because base
 * altitude is what decides how a deck converges toward the horizon. A stratus
 * sheet at six hundred metres and cirrus at nine thousand behave completely
 * differently in perspective, and that difference is most of what makes a sky
 * read as overcast rather than fine.
 */

const DECK_SOURCES = {
  cirrus: '/assets/deck-cirrus.png',
  stratocumulus: '/assets/deck-stratocumulus.png',
  stratus: '/assets/deck-stratus.png',
  storm: '/assets/deck-storm.png',
} as const

const BILLBOARD_SOURCE = '/assets/cumulus-billboards.png'
const BILLBOARD_CELLS = 4

type DeckName = keyof typeof DECK_SOURCES
type Loaded = { decks: Partial<Record<DeckName, SeparatedTexture>>; billboards: SeparatedTexture | null }

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`failed to load ${source}`))
    image.src = source
  })
}

function seeded(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0
    return state / 4_294_967_296
  }
}

/**
 * Cloud base heights in metres, plus the horizontal scale each texture tiles
 * over. Larger scales mean bigger individual features.
 */
const DECK_GEOMETRY: Record<DeckName, { altitude: number; scale: number; maxRange: number }> = {
  cirrus: { altitude: 9_000, scale: 26_000, maxRange: 190_000 },
  stratocumulus: { altitude: 1_800, scale: 9_000, maxRange: 55_000 },
  stratus: { altitude: 850, scale: 14_000, maxRange: 42_000 },
  storm: { altitude: 700, scale: 11_000, maxRange: 38_000 },
}

function planFor(weather: WeatherMode, oktas: number) {
  const decks: Array<{ name: DeckName; opacity: number }> = []
  let cumulus = 0

  if (weather === 'storm') {
    decks.push({ name: 'storm', opacity: 1 })
    decks.push({ name: 'stratocumulus', opacity: 0.5 })
  } else if (weather === 'rain' || weather === 'overcast') {
    decks.push({ name: 'stratus', opacity: 0.98 })
    decks.push({ name: 'stratocumulus', opacity: 0.45 })
  } else if (weather === 'snow') {
    decks.push({ name: 'stratus', opacity: 0.92 })
  } else {
    // Clear and fair: cirrus high up, and convective cells if there is coverage.
    if (oktas > 0.4) decks.push({ name: 'cirrus', opacity: Math.min(0.7, 0.25 + oktas * 0.09) })
    if (oktas > 4.6) decks.push({ name: 'stratocumulus', opacity: (oktas - 4.6) * 0.22 })
    cumulus = Math.round(oktas * 5)
  }
  return { decks, cumulus }
}

function buildBillboards(count: number, seed: number): Billboard[] {
  const random = seeded(seed)
  return Array.from({ length: count }, () => {
    const range = 9_000 + Math.pow(random(), 0.7) * 46_000
    return {
      azimuth: (random() - 0.5) * 76,
      altitude: 1_150 + random() * 900,
      range,
      // Fair weather cells run roughly half a kilometre to two kilometres wide.
      size: 500 + random() * 1_500,
      cell: Math.floor(random() * BILLBOARD_CELLS),
      drift: 9 + random() * 9,
    }
  })
}

export function CloudLayer({
  environment,
  coverage,
  ambientMotion,
}: {
  environment: SceneEnvironment
  coverage: number
  ambientMotion: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [loaded, setLoaded] = useState<Loaded>({ decks: {}, billboards: null })
  const environmentRef = useRef(environment)
  environmentRef.current = environment

  useEffect(() => {
    let cancelled = false
    async function load() {
      const decks: Partial<Record<DeckName, SeparatedTexture>> = {}
      for (const [name, source] of Object.entries(DECK_SOURCES) as Array<[DeckName, string]>) {
        try {
          decks[name] = separateTexture(await loadImage(source), 'deck')
        } catch {
          // A missing deck simply does not draw.
        }
      }
      let billboards: SeparatedTexture | null = null
      try {
        billboards = separateTexture(await loadImage(BILLBOARD_SOURCE), 'billboard')
      } catch {
        billboards = null
      }
      if (!cancelled) setLoaded({ decks, billboards })
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const plan = planFor(environment.weather, coverage)
  const cumulusCells = useRef<Billboard[]>([])
  if (cumulusCells.current.length !== plan.cumulus) {
    cumulusCells.current = buildBillboards(plan.cumulus, 0xc10d)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return

    let frame = 0
    let start = performance.now()

    function resize() {
      const parent = canvas?.parentElement
      if (!canvas || !parent) return
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5)
      const width = Math.round(parent.clientWidth * ratio * 0.7)
      const height = Math.round(parent.clientHeight * ratio * 0.7)
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = Math.max(2, width)
        canvas.height = Math.max(2, height)
      }
    }

    function paletteFor(environmentValue: SceneEnvironment, weather: WeatherMode): DeckPalette {
      const stormy = weather === 'storm' || weather === 'rain' || weather === 'overcast'
      // Cloud bodies are lit by the sky, not by the sun, so they follow ambient.
      // Their sunlit tops follow the sun, which is why a sunset underlights the
      // bases orange while the sky above stays blue.
      return {
        body: environmentValue.ambient,
        lit: environmentValue.sunlight,
        shade: environmentValue.ambient,
        haze: environmentValue.haze,
        litOffset: -environmentValue.lightDirection * 0.02,
        litStrength: (stormy ? 0.3 : 0.85) * (0.12 + environmentValue.daylight * 0.9),
      }
    }

    function render(now: number) {
      frame = requestAnimationFrame(render)
      if (!canvas) return
      const context2d = canvas.getContext('2d')
      if (!context2d) return
      resize()
      const width = canvas.width
      const height = canvas.height
      context2d.clearRect(0, 0, width, height)

      const environmentValue = environmentRef.current
      const elapsed = ambientMotion ? (now - start) / 1_000 : 0
      const palette = paletteFor(environmentValue, environmentValue.weather)
      const activePlan = planFor(environmentValue.weather, coverage)

      for (const entry of activePlan.decks) {
        const texture = loaded.decks[entry.name]
        if (!texture) continue
        const geometry = DECK_GEOMETRY[entry.name]
        const spec: DeckSpec = {
          texture,
          altitude: geometry.altitude,
          scale: geometry.scale,
          maxRange: geometry.maxRange,
          opacity: entry.opacity,
          drift: entry.name === 'cirrus' ? 34 : 13,
        }
        drawDeck(context2d, spec, palette, elapsed, width, height)
      }

      if (loaded.billboards && cumulusCells.current.length) {
        drawBillboards(
          context2d,
          loaded.billboards,
          cumulusCells.current,
          palette,
          elapsed,
          width,
          height,
          BILLBOARD_CELLS,
        )
      }
    }

    frame = requestAnimationFrame(render)
    return () => cancelAnimationFrame(frame)
  }, [loaded, coverage, ambientMotion])

  return <canvas className="cloud-layer" ref={canvasRef} aria-hidden="true" data-heading={CAMERA_HEADING} />
}
