/**
 * Cloud rendering.
 *
 * Two techniques, because clouds are not all the same kind of object:
 *
 *  - Genuinely flat cloud types (cirrus, stratus, stratocumulus, a storm base)
 *    are sheets. They get projected in perspective onto a horizontal plane at a
 *    fixed altitude, so they converge toward the horizon exactly as a real deck
 *    does, and they occupy the same space as the aircraft.
 *
 *  - Fair weather cumulus are discrete convective cells. A plan view projected
 *    onto a plane cannot show one from the side, and at a ten degree field of
 *    view the side is most of what you see, so those are billboards placed at
 *    individual distances.
 *
 * Textures arrive with lighting information packed into channels rather than
 * baked into colour, and are separated once at load. That is what lets the same
 * cloud be lit warm at sunset and cold at noon.
 */

import { FOCAL_LENGTH, HORIZON, unproject } from './camera'

export type SeparatedTexture = {
  /** Optical density, as an alpha only canvas, with mip levels. */
  density: HTMLCanvasElement[]
  /** Sunlit surface, as an alpha only canvas, with mip levels. */
  lit: HTMLCanvasElement[]
  /** Shaded surface, as an alpha only canvas, with mip levels. */
  shade: HTMLCanvasElement[]
  width: number
  height: number
}

const MIP_LEVELS = 5

function makeCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, width)
  canvas.height = Math.max(1, height)
  return canvas
}

function buildMips(base: HTMLCanvasElement) {
  const levels = [base]
  for (let level = 1; level < MIP_LEVELS; level += 1) {
    const previous = levels[level - 1]
    const next = makeCanvas(Math.max(1, previous.width >> 1), Math.max(1, previous.height >> 1))
    const context = next.getContext('2d')
    if (!context) break
    context.imageSmoothingEnabled = true
    context.drawImage(previous, 0, 0, next.width, next.height)
    levels.push(next)
  }
  return levels
}

/**
 * Split a packed cloud texture into three alpha only canvases.
 *
 * Done once per texture at load. Everything afterwards is plain compositing,
 * so no per pixel work happens on a lighting change or in a frame.
 */
export function separateTexture(image: HTMLImageElement, kind: 'deck' | 'billboard'): SeparatedTexture {
  const { naturalWidth: width, naturalHeight: height } = image
  const source = makeCanvas(width, height)
  const sourceContext = source.getContext('2d', { willReadFrequently: true })
  if (!sourceContext) throw new Error('2d context unavailable')
  sourceContext.drawImage(image, 0, 0)
  const packed = sourceContext.getImageData(0, 0, width, height)

  const densityCanvas = makeCanvas(width, height)
  const litCanvas = makeCanvas(width, height)
  const shadeCanvas = makeCanvas(width, height)
  const densityContext = densityCanvas.getContext('2d')
  const litContext = litCanvas.getContext('2d')
  const shadeContext = shadeCanvas.getContext('2d')
  if (!densityContext || !litContext || !shadeContext) throw new Error('2d context unavailable')

  const densityImage = densityContext.createImageData(width, height)
  const litImage = litContext.createImageData(width, height)
  const shadeImage = shadeContext.createImageData(width, height)

  for (let index = 0; index < packed.data.length; index += 4) {
    const red = packed.data[index]
    const green = packed.data[index + 1]
    const alpha = packed.data[index + 3]

    densityImage.data[index] = 255
    densityImage.data[index + 1] = 255
    densityImage.data[index + 2] = 255
    densityImage.data[index + 3] = alpha

    /**
     * Decks store a surface normal, so the highlight has to be derived here
     * against a nominal light direction and then displaced at draw time toward
     * wherever the sun is. Billboards already store an elevation view highlight
     * and shadow, so those channels are used directly.
     */
    let lit: number
    let shade: number
    if (kind === 'deck') {
      const normalX = (red / 255) * 2 - 1
      const normalY = (green / 255) * 2 - 1
      const slope = Math.min(1, Math.hypot(normalX, normalY) * 1.9)
      lit = slope * 255
      shade = (1 - slope) * 90
    } else {
      lit = red
      shade = green
    }

    litImage.data[index] = 255
    litImage.data[index + 1] = 255
    litImage.data[index + 2] = 255
    litImage.data[index + 3] = Math.min(255, (lit * alpha) / 255)

    shadeImage.data[index] = 255
    shadeImage.data[index + 1] = 255
    shadeImage.data[index + 2] = 255
    shadeImage.data[index + 3] = Math.min(255, (shade * alpha) / 255)
  }

  densityContext.putImageData(densityImage, 0, 0)
  litContext.putImageData(litImage, 0, 0)
  shadeContext.putImageData(shadeImage, 0, 0)

  return {
    density: buildMips(densityCanvas),
    lit: buildMips(litCanvas),
    shade: buildMips(shadeCanvas),
    width,
    height,
  }
}

export type DeckSpec = {
  texture: SeparatedTexture
  /** Cloud base above the observer, metres. */
  altitude: number
  /** Real world size the texture tiles over, metres. */
  scale: number
  opacity: number
  /** Drift in metres per second, from the prevailing wind. */
  drift: number
  /** Range beyond which the deck has faded into haze, metres. */
  maxRange: number
}

export type DeckPalette = {
  body: string
  lit: string
  shade: string
  haze: string
  /** Horizontal highlight displacement, in texture fractions, toward the sun. */
  litOffset: number
  litStrength: number
}

const STRIPS = 56

/**
 * Draw one perspective cloud deck.
 *
 * Each horizontal strip of the frame corresponds to a ring of the cloud plane
 * at ground distance altitude / tan(elevation). Sampling that plane naively
 * aliases badly near the horizon, where one screen row spans kilometres, so a
 * mip level is chosen per strip from the texel density and the whole deck fades
 * into haze well before the horizon, which is also what really happens.
 */
export function drawDeck(
  target: CanvasRenderingContext2D,
  spec: DeckSpec,
  palette: DeckPalette,
  elapsedSeconds: number,
  width: number,
  height: number,
) {
  const aspect = width / height
  const scratch = getScratch(width, height)
  const { maskContext, colourContext, maskCanvas, colourCanvas } = scratch

  maskContext.clearRect(0, 0, width, height)
  colourContext.clearRect(0, 0, width, height)

  const horizonPixel = HORIZON * height
  const topPixel = 0
  const stripHeight = Math.max(1, (horizonPixel - topPixel) / STRIPS)
  const driftOffset = (elapsedSeconds * spec.drift) / spec.scale

  for (let strip = 0; strip < STRIPS; strip += 1) {
    const y = topPixel + strip * stripHeight
    const centre = (y + stripHeight / 2) / height
    const direction = unproject(0.5, centre, aspect)
    if (direction.elevation <= 0.045) continue

    const range = spec.altitude / Math.tan((direction.elevation * Math.PI) / 180)
    if (range > spec.maxRange) continue

    const halfWidthMetres = range * (aspect / 2 / FOCAL_LENGTH)
    const metresPerPixel = (halfWidthMetres * 2) / width
    const texelsPerPixel = (metresPerPixel / spec.scale) * spec.texture.width

    // Pick the mip whose texels are about one screen pixel across.
    let level = 0
    while (level < spec.texture.density.length - 1 && texelsPerPixel > (1 << level) * 1.35) level += 1

    const densityMip = spec.texture.density[level]
    const litMip = spec.texture.lit[level]
    const textureScale = densityMip.width / spec.texture.width

    // Fade out with range so the aliased far field is never the visible part.
    const fade = Math.min(1, Math.max(0, (range - spec.altitude * 2.5) / (spec.maxRange - spec.altitude * 2.5)))
    const stripOpacity = spec.opacity * (1 - Math.pow(fade, 0.75))
    if (stripOpacity <= 0.004) continue

    const u = (-halfWidthMetres / spec.scale + driftOffset) * spec.texture.width * textureScale
    const v = (range / spec.scale) * spec.texture.width * textureScale
    const pixelScale = (spec.scale / spec.texture.width / textureScale) / metresPerPixel

    drawStrip(maskContext, densityMip, u, v, pixelScale, y, stripHeight, width, stripOpacity)
    drawStrip(
      colourContext,
      litMip,
      u - palette.litOffset * spec.texture.width * textureScale,
      v,
      pixelScale,
      y,
      stripHeight,
      width,
      stripOpacity * palette.litStrength,
    )
  }

  // Body colour inside the deck silhouette.
  maskContext.globalCompositeOperation = 'source-in'
  maskContext.fillStyle = palette.body
  maskContext.fillRect(0, 0, width, height)
  maskContext.globalCompositeOperation = 'source-over'

  // Sunlit surfaces added on top, clipped to the same silhouette.
  colourContext.globalCompositeOperation = 'source-in'
  colourContext.fillStyle = palette.lit
  colourContext.fillRect(0, 0, width, height)
  colourContext.globalCompositeOperation = 'source-over'

  target.drawImage(maskCanvas, 0, 0)
  target.save()
  target.globalCompositeOperation = 'lighter'
  target.drawImage(colourCanvas, 0, 0)
  target.restore()
}

function drawStrip(
  context: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  u: number,
  v: number,
  pixelScale: number,
  y: number,
  stripHeight: number,
  width: number,
  opacity: number,
) {
  const pattern = context.createPattern(source, 'repeat')
  if (!pattern) return
  const matrix = new DOMMatrix()
  matrix.a = pixelScale
  matrix.d = pixelScale
  matrix.e = -u * pixelScale
  matrix.f = y - v * pixelScale
  pattern.setTransform(matrix)
  context.save()
  context.globalAlpha = opacity
  context.fillStyle = pattern
  context.fillRect(0, y, width, stripHeight + 1)
  context.restore()
}

type Scratch = {
  maskCanvas: HTMLCanvasElement
  colourCanvas: HTMLCanvasElement
  maskContext: CanvasRenderingContext2D
  colourContext: CanvasRenderingContext2D
}

let scratch: Scratch | null = null

function getScratch(width: number, height: number): Scratch {
  if (!scratch || scratch.maskCanvas.width !== width || scratch.maskCanvas.height !== height) {
    const maskCanvas = makeCanvas(width, height)
    const colourCanvas = makeCanvas(width, height)
    const maskContext = maskCanvas.getContext('2d')
    const colourContext = colourCanvas.getContext('2d')
    if (!maskContext || !colourContext) throw new Error('2d context unavailable')
    scratch = { maskCanvas, colourCanvas, maskContext, colourContext }
  }
  return scratch
}

export type Billboard = {
  /** Azimuth relative to the camera heading, degrees. */
  azimuth: number
  /** Cloud base above the observer, metres. */
  altitude: number
  /** Ground distance, metres. */
  range: number
  /** Real world width of the cell, metres. */
  size: number
  /** Which cell in the sprite sheet. */
  cell: number
  drift: number
}

/**
 * Draw discrete cumulus cells. Size and screen position both come from the
 * camera model, so a cell cannot be made larger without also being brought
 * nearer, which keeps them consistent with the aircraft.
 */
export function drawBillboards(
  target: CanvasRenderingContext2D,
  texture: SeparatedTexture,
  cells: Billboard[],
  palette: DeckPalette,
  elapsedSeconds: number,
  width: number,
  height: number,
  cellCount: number,
) {
  const aspect = width / height
  const cellWidth = texture.width / cellCount
  const scratchCells = getScratch(width, height)
  const { maskContext, colourContext, maskCanvas, colourCanvas } = scratchCells

  maskContext.clearRect(0, 0, width, height)
  colourContext.clearRect(0, 0, width, height)

  const sorted = [...cells].sort((a, b) => b.range - a.range)

  for (const cell of sorted) {
    // Wind carries the cell sideways; nearer cells sweep across faster.
    const drifted =
      cell.azimuth + ((elapsedSeconds * cell.drift) / cell.range) * (180 / Math.PI)
    const azRel = ((((drifted + 180) % 360) + 360) % 360) - 180
    if (Math.abs(azRel) > 40) continue

    const slant = Math.hypot(cell.range, cell.altitude)
    const elevation = (Math.atan2(cell.altitude, cell.range) * 180) / Math.PI

    const planeX = FOCAL_LENGTH * Math.tan((azRel * Math.PI) / 180)
    const x = 0.5 + planeX / aspect
    const y = HORIZON - FOCAL_LENGTH * Math.tan((elevation * Math.PI) / 180)
    if (x < -0.4 || x > 1.4 || y > HORIZON + 0.05) continue

    const screenWidth = FOCAL_LENGTH * (cell.size / slant) * height
    const screenHeight = screenWidth * (texture.height / cellWidth)
    if (screenWidth < 2) continue

    const fade = Math.min(1, Math.max(0, (slant - 12_000) / 45_000))
    const opacity = 1 - Math.pow(fade, 0.8)
    const destX = x * width - screenWidth / 2
    const destY = y * height - screenHeight * 0.62
    const sourceX = cell.cell * cellWidth

    maskContext.save()
    maskContext.globalAlpha = opacity
    maskContext.drawImage(
      texture.density[0],
      sourceX, 0, cellWidth, texture.height,
      destX, destY, screenWidth, screenHeight,
    )
    maskContext.restore()

    colourContext.save()
    colourContext.globalAlpha = opacity * palette.litStrength
    colourContext.drawImage(
      texture.lit[0],
      sourceX, 0, cellWidth, texture.height,
      destX + screenWidth * palette.litOffset, destY, screenWidth, screenHeight,
    )
    colourContext.restore()
  }

  maskContext.globalCompositeOperation = 'source-in'
  maskContext.fillStyle = palette.body
  maskContext.fillRect(0, 0, width, height)
  maskContext.globalCompositeOperation = 'source-over'

  colourContext.globalCompositeOperation = 'source-in'
  colourContext.fillStyle = palette.lit
  colourContext.fillRect(0, 0, width, height)
  colourContext.globalCompositeOperation = 'source-over'

  target.drawImage(maskCanvas, 0, 0)
  target.save()
  target.globalCompositeOperation = 'lighter'
  target.drawImage(colourCanvas, 0, 0)
  target.restore()
}
