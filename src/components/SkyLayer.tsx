import { useEffect, useRef } from 'react'
import { encode, skyRadiance } from '../lib/atmosphere'
import { unproject } from '../lib/camera'
import type { SceneEnvironment } from '../lib/scene-environment'

/**
 * The sky, evaluated per pixel from the scattering model.
 *
 * Drawn at a deliberately small resolution and stretched. The sky is entirely
 * low frequency, so a quarter megapixel of gradient upscales invisibly, and it
 * keeps a full evaluation of the model down to a couple of milliseconds. The
 * five hand-painted sky SVGs this replaces could only ever show five states
 * with hard cuts between them.
 */

const WIDTH = 256
const HEIGHT = 144

export function SkyLayer({ environment }: { environment: SceneEnvironment }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const { atmosphere, exposure } = environment

  // Redraw only when the sun has actually moved enough to matter. At fifteen
  // degrees an hour, a tenth of a degree is about twenty five seconds.
  const key = [
    Math.round(atmosphere.sunAltitude * 10),
    Math.round(atmosphere.sunAzimuth * 10),
    Math.round(atmosphere.haze * 20),
    Math.round(atmosphere.lightPollution * 50),
    Math.round(atmosphere.moonAltitude),
    Math.round(atmosphere.moonIllumination * 20),
  ].join(':')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d', { alpha: false })
    if (!context) return

    const image = context.createImageData(WIDTH, HEIGHT)
    const data = image.data
    const aspect = WIDTH / HEIGHT

    for (let y = 0; y < HEIGHT; y += 1) {
      for (let x = 0; x < WIDTH; x += 1) {
        const direction = unproject((x + 0.5) / WIDTH, (y + 0.5) / HEIGHT, aspect)
        const [r, g, b] = encode(
          skyRadiance(direction.azimuth, direction.elevation, atmosphere),
          exposure,
        )
        const offset = (y * WIDTH + x) * 4
        data[offset] = r
        data[offset + 1] = g
        data[offset + 2] = b
        data[offset + 3] = 255
      }
    }
    context.putImageData(image, 0, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return <canvas className="sky-layer" ref={canvasRef} width={WIDTH} height={HEIGHT} aria-hidden="true" />
}
