import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  AIRCRAFT,
  TRAFFIC_GAP,
  pickProfile,
  type AircraftCategory,
  type AircraftType,
  type FlightProfile,
} from '../lib/aircraft-catalog'
import { CAMERA_HEADING, FOCAL_LENGTH, HORIZON, horizontalFov, projectedSize } from '../lib/camera'
import type { SceneEnvironment } from '../lib/scene-environment'
import type { AircraftDensity } from '../lib/settings'

/**
 * Air traffic sized and placed by geometry rather than by taste.
 *
 * An aircraft is given a real length, a cruise altitude and a lateral distance,
 * and everything visible follows: apparent size, height in frame, how long it
 * takes to cross, and whether you can see anything of it at all beyond its
 * lights. The previous version set a sprite width in rem and a top offset in
 * per cent, which put forty metre airliners a few hundred metres from the tower.
 *
 * The honest consequence is that correctly placed aircraft are small. An A320
 * at a plausible distance is twenty to forty pixels on a 1080p display. The
 * `aircraftScale` setting exists for anyone who would rather cheat, and it is
 * labelled as a cheat.
 */

type Categories = Record<AircraftCategory, boolean>

type Flight = {
  key: number
  type: AircraftType
  profile: FlightProfile
  /** Perpendicular distance from the viewpoint to the flight path, metres. */
  distance: number
  altitude: number
  speed: number
  /** Along track extent to traverse, metres. */
  track: number
  /** True when travelling left to right across the frame. */
  leftToRight: boolean
  startedAt: number
  duration: number
}

function randomBetween(minimum: number, maximum: number) {
  return minimum + Math.random() * (maximum - minimum)
}

function pick<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)]
}

export function TrafficLayer({
  environment,
  enabled,
  density,
  categories,
  scale,
  showContrails,
  aspect,
}: {
  environment: SceneEnvironment
  enabled: boolean
  density: AircraftDensity
  categories: Categories
  scale: number
  showContrails: boolean
  aspect: number
}) {
  const [flights, setFlights] = useState<Flight[]>([])
  const [tick, setTick] = useState(0)
  const previousType = useRef('')

  const eligible = useMemo(
    () => AIRCRAFT.filter((type) => categories[type.category]),
    [categories],
  )

  // Spawn loop. One aircraft is scheduled at a time, with the gap drawn from
  // the density setting, so traffic arrives irregularly the way it really does.
  useEffect(() => {
    if (!enabled || !eligible.length) {
      setFlights([])
      return
    }

    let timer = 0
    let cancelled = false

    function schedule(delayMs: number) {
      timer = window.setTimeout(() => {
        if (cancelled) return
        const candidates = eligible.filter((type) => type.id !== previousType.current)
        const type = pick(candidates.length ? candidates : eligible)
        previousType.current = type.id
        const profile = pickProfile(type, Math.random)

        /**
         * Elevation and slant range are the authored quantities; altitude and
         * ground distance are derived from them. Doing it this way makes it
         * impossible to author an aircraft that is a good size but out of shot,
         * which was the failure mode of specifying altitude and distance
         * independently.
         */
        const elevationDegrees = randomBetween(...profile.elevation)
        const slant = randomBetween(...profile.slant)
        const elevationRadians = (elevationDegrees * Math.PI) / 180
        const altitude = slant * Math.sin(elevationRadians)
        const distance = slant * Math.cos(elevationRadians)
        const speed = randomBetween(...profile.speed)

        // Cross the frame plus a margin, so aircraft enter and leave rather
        // than materialising at the edges.
        const halfAngle = ((horizontalFov(aspect) / 2 + 6) * Math.PI) / 180
        const track = 2 * distance * Math.tan(halfAngle)
        const duration = (track / speed) * 1_000

        const flight: Flight = {
          key: Date.now() + Math.random(),
          type,
          profile,
          distance,
          altitude,
          speed,
          track,
          leftToRight: Math.random() > 0.42,
          startedAt: performance.now(),
          duration,
        }

        setFlights((current) => [...current, flight])
        window.setTimeout(() => {
          if (cancelled) return
          setFlights((current) => current.filter((entry) => entry.key !== flight.key))
        }, duration + 400)

        const [minimumGap, maximumGap] = TRAFFIC_GAP[density]
        schedule(randomBetween(minimumGap, maximumGap) * 1_000)
      }, delayMs)
    }

    schedule(randomBetween(2_000, 9_000))
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [enabled, eligible, density, aspect])

  // Animation clock. Positions are recomputed rather than handed to a CSS
  // keyframe because size and height both change along the path.
  useEffect(() => {
    if (!flights.length) return
    let frame = 0
    function step() {
      setTick((value) => value + 1)
      frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [flights.length])

  if (!enabled || !flights.length) return null

  const now = performance.now()

  return (
    <div className="traffic-layer" aria-hidden="true" data-tick={tick}>
      {flights.map((flight) => (
        <AircraftSprite
          key={flight.key}
          flight={flight}
          now={now}
          environment={environment}
          scale={scale}
          showContrails={showContrails}
          aspect={aspect}
        />
      ))}
    </div>
  )
}

function AircraftSprite({
  flight,
  now,
  environment,
  scale,
  showContrails,
  aspect,
}: {
  flight: Flight
  now: number
  environment: SceneEnvironment
  scale: number
  showContrails: boolean
  aspect: number
}) {
  const progress = Math.min(1, Math.max(0, (now - flight.startedAt) / flight.duration))

  // Along track position, signed, zero at the closest point of approach.
  const along = (progress - 0.5) * flight.track * (flight.leftToRight ? 1 : -1)
  const groundRange = Math.hypot(flight.distance, along)
  const slantRange = Math.hypot(groundRange, flight.altitude)

  const azimuthRelative = (Math.atan2(along, flight.distance) * 180) / Math.PI
  const elevation = (Math.atan2(flight.altitude, groundRange) * 180) / Math.PI

  const planeX = FOCAL_LENGTH * Math.tan((azimuthRelative * Math.PI) / 180)
  const x = 0.5 + planeX / aspect
  const y = HORIZON - FOCAL_LENGTH * Math.tan((elevation * Math.PI) / 180)

  const lengthOnScreen = projectedSize(flight.type.length, slantRange) * scale
  const widthFraction = lengthOnScreen
  const heightFraction = widthFraction / flight.type.spriteAspect

  // Aerial perspective. Anything this far away is seen through a lot of air, so
  // contrast collapses toward the haze colour long before the shape does.
  const hazeAmount = Math.min(0.85, slantRange / 70_000)
  const { night, daylight } = environment

  /**
   * At night the airframe is effectively invisible and the lights are the whole
   * aircraft. Rendering a darkened daylight photograph instead is the usual
   * mistake, and it is why the old sprites looked like stickers after sunset.
   */
  const airframeOpacity = Math.max(0.04, 1 - night * 0.94) * (1 - hazeAmount * 0.55)

  const style: CSSProperties = {
    left: `${x * 100}%`,
    top: `${y * 100}%`,
    width: `${widthFraction * 100}%`,
    height: `${heightFraction * 100}%`,
  }

  const pixelWidth = widthFraction * (typeof window === 'undefined' ? 1080 : window.innerHeight) * aspect
  // Below about eighteen pixels the individual lights are closer together than
  // one pixel, so they are drawn as a single merged cluster, which is also
  // exactly what the eye sees at that distance.
  const mergedLights = pixelWidth < 18

  const lightsOn = night > 0.08 || environment.sun.apparentAltitude < 6
  const lightScale = Math.max(1.6, Math.min(3.4, pixelWidth * 0.09))
  const terminal = Boolean(flight.profile.terminalArea)

  return (
    <div className={`aircraft aircraft--${flight.type.category}`} style={style} title={flight.type.label}>
      <div
        className="aircraft__frame"
        style={{ transform: flight.leftToRight ? 'none' : 'scaleX(-1)' }}
      >
        <img
          className="aircraft__body"
          src={flight.type.asset}
          alt=""
          style={{
            opacity: airframeOpacity,
            filter: `saturate(${1 - hazeAmount * 0.6}) brightness(${0.55 + daylight * 0.5})`,
          }}
        />

        {showContrails && flight.profile.contrail && (
          <span
            className="aircraft__contrail"
            style={{ opacity: 0.34 * (1 - night * 0.8) }}
          />
        )}

        {lightsOn && (
          <Lights
            type={flight.type}
            merged={mergedLights}
            size={lightScale}
            night={night}
            terminal={terminal}
          />
        )}
      </div>
    </div>
  )
}

/**
 * Lighting to the actual convention: red on the port wingtip, green on the
 * starboard, white at the tail, a red anti collision beacon on the fuselage at
 * forty to a hundred flashes a minute, white strobes at the tips, and landing
 * lights only in the terminal area. The previous build put red at the tail and
 * green at the nose.
 */
function Lights({
  type,
  merged,
  size,
  night,
  terminal,
}: {
  type: AircraftType
  merged: boolean
  size: number
  night: number
  terminal: boolean
}) {
  const { lights } = type
  const beaconPeriod = 60 / type.beaconRate
  const strobePeriod = type.strobeRate > 0 ? 60 / type.strobeRate : 0

  const dot = (position: [number, number], className: string, extra: CSSProperties = {}) => (
    <i
      className={`aircraft-light ${className}`}
      style={{
        left: `${position[0] * 100}%`,
        top: `${position[1] * 100}%`,
        width: `${size}px`,
        height: `${size}px`,
        ...extra,
      }}
    />
  )

  if (merged) {
    // One point source, which is all a distant aircraft is. The strobe still
    // reads because it is far brighter than the steady lights.
    return (
      <>
        {dot(lights.beacon, 'aircraft-light--merged', { opacity: 0.5 + night * 0.5 })}
        {type.hasStrobes && strobePeriod > 0 &&
          dot(lights.beacon, 'aircraft-light--strobe', {
            animationDuration: `${strobePeriod}s`,
          })}
      </>
    )
  }

  return (
    <>
      {dot(lights.portTip, 'aircraft-light--nav-red')}
      {dot(lights.starboardTip, 'aircraft-light--nav-green')}
      {dot(lights.tail, 'aircraft-light--nav-white', { opacity: 0.7 })}
      {type.hasBeacon &&
        dot(lights.beacon, 'aircraft-light--beacon', {
          animationDuration: `${beaconPeriod}s`,
        })}
      {type.hasStrobes && strobePeriod > 0 && (
        <>
          {dot(lights.portTip, 'aircraft-light--strobe', {
            animationDuration: `${strobePeriod}s`,
          })}
          {dot(lights.starboardTip, 'aircraft-light--strobe', {
            animationDuration: `${strobePeriod}s`,
          })}
        </>
      )}
      {type.hasLandingLight && terminal && night > 0.25 &&
        dot(lights.landing, 'aircraft-light--landing', {
          width: `${size * 1.5}px`,
          height: `${size * 1.5}px`,
        })}
    </>
  )
}
