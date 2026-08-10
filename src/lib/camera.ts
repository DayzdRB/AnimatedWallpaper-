/**
 * The camera that the painted Paris plates were composited under.
 *
 * These constants are measured, not invented. In `paris-city-day.png`
 * (1672 x 941) the Eiffel Tower's antenna tip sits at y = 78 and its ground
 * line solves to y = 576, so 330 m of tower spans 497 px. Taking a viewpoint
 * 1.9 km from the tower, that tower subtends 9.93 deg, which pins the focal
 * length and therefore every angular measurement in the scene.
 *
 * Consequence worth knowing: the top of the frame is only 9.9 deg above the
 * horizon. Anything higher than that is out of shot. That is why correctly
 * scaled aircraft sit low in the frame and why the sun spends most of the day
 * outside the picture unless it is deliberately reframed.
 */

const DEG = Math.PI / 180

/** Reference plate size that every measurement below was taken from. */
export const PLATE = { width: 1672, height: 941 }

/** True horizon as a fraction of frame height, measured from the top. */
export const HORIZON = 0.531

/** Focal length expressed in frame heights. Solved from the tower. */
export const FOCAL_LENGTH = 3.03

/** Eiffel Tower centreline as a fraction of frame width. */
export const TOWER_X = 1417 / PLATE.width

/** Distance from the viewpoint to the tower, metres. */
export const TOWER_DISTANCE = 1_900

/**
 * Compass bearing the camera faces, degrees from true north. 264 puts the
 * equinox sunset just off the tower's shoulder, which is the composition the
 * plates were painted for.
 */
export const CAMERA_HEADING = 264

export type Aspect = number

export type ScreenPoint = {
  /** Fraction of frame width, 0 at the left edge. May fall outside 0..1. */
  x: number
  /** Fraction of frame height, 0 at the top. May fall outside 0..1. */
  y: number
  /** True when the point lies inside the frame. */
  visible: boolean
  /** True when the point is behind the camera. */
  behind: boolean
}

export function verticalFov() {
  return (Math.atan(HORIZON / FOCAL_LENGTH) + Math.atan((1 - HORIZON) / FOCAL_LENGTH)) / DEG
}

export function horizontalFov(aspect: Aspect) {
  return (2 * Math.atan(aspect / 2 / FOCAL_LENGTH)) / DEG
}

/** Highest elevation angle still inside the frame, degrees. */
export function frameTopElevation() {
  return Math.atan(HORIZON / FOCAL_LENGTH) / DEG
}

function wrapSigned(degrees: number) {
  let value = degrees % 360
  if (value > 180) value -= 360
  if (value < -180) value += 360
  return value
}

/**
 * Rectilinear projection with the principal point on the horizon line.
 * Azimuth is absolute (degrees from north); elevation is degrees above the
 * true horizon.
 */
export function project(azimuth: number, elevation: number, aspect: Aspect): ScreenPoint {
  const azRel = wrapSigned(azimuth - CAMERA_HEADING) * DEG
  const el = elevation * DEG
  const behind = Math.abs(azRel) > Math.PI / 2

  const x = 0.5 + (FOCAL_LENGTH * Math.tan(azRel)) / aspect
  const y = HORIZON - FOCAL_LENGTH * Math.tan(el) / Math.cos(azRel)

  return {
    x,
    y,
    behind,
    visible: !behind && x >= -0.1 && x <= 1.1 && y >= -0.1 && y <= 1.1,
  }
}

/** Inverse of `project`, used to evaluate the sky per pixel. */
export function unproject(x: number, y: number, aspect: Aspect) {
  const planeX = (x - 0.5) * aspect
  const planeY = HORIZON - y
  const azRel = Math.atan2(planeX, FOCAL_LENGTH) / DEG
  const elevation =
    Math.atan2(planeY, Math.hypot(FOCAL_LENGTH, planeX)) / DEG
  return { azimuthRelative: azRel, azimuth: CAMERA_HEADING + azRel, elevation }
}

/**
 * Screen height, as a fraction of frame height, of an object `metres` long at
 * `rangeMetres`. This is the function that decides how big an aircraft is, and
 * it is the reason the previous sprites looked wrong: they were roughly five
 * times larger than this returns.
 */
export function projectedSize(metres: number, rangeMetres: number) {
  return FOCAL_LENGTH * (metres / Math.max(rangeMetres, 1))
}

/** Screen height, as a fraction of frame height, of an angular diameter. */
export function angularSize(degrees: number) {
  return FOCAL_LENGTH * 2 * Math.tan((degrees / 2) * DEG)
}

/**
 * Angular separation between two directions, degrees. Used for the solar
 * aureole and the Mie phase function.
 */
export function angularSeparation(
  azimuthA: number,
  elevationA: number,
  azimuthB: number,
  elevationB: number,
) {
  const a1 = elevationA * DEG
  const a2 = elevationB * DEG
  const dAz = (azimuthA - azimuthB) * DEG
  const cosine =
    Math.sin(a1) * Math.sin(a2) + Math.cos(a1) * Math.cos(a2) * Math.cos(dAz)
  return Math.acos(Math.max(-1, Math.min(1, cosine))) / DEG
}

/**
 * Elevation and slant range for an object at a given altitude and ground
 * distance. Used by the traffic system so that height and size stay coupled:
 * you cannot make an aircraft bigger without also bringing it lower or nearer.
 */
export function elevationFor(altitudeMetres: number, groundDistanceMetres: number) {
  return Math.atan2(altitudeMetres, groundDistanceMetres) / DEG
}

export function slantRange(altitudeMetres: number, groundDistanceMetres: number) {
  return Math.hypot(altitudeMetres, groundDistanceMetres)
}
