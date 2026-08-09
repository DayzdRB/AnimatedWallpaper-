/**
 * Aircraft as physical objects rather than sprite sizes.
 *
 * Every entry carries a real length and a plausible operating profile, and the
 * renderer derives on-screen size, screen height and crossing duration from
 * those. The previous version specified a sprite width in rem and an altitude
 * as a percentage of the frame, which is how you end up with a 40 metre
 * airliner apparently parked 400 metres from the Eiffel Tower.
 *
 * Light positions are normalised sprite coordinates, origin top left. The
 * sprites are all nose-right and viewed from slightly below and ahead of the
 * port side, so the near wingtip carries the red navigation light and the far
 * one, partly hidden by the fuselage, carries the green.
 */

export type AircraftCategory = 'airliner' | 'business' | 'ga' | 'helicopter'

export type LightAnchors = {
  /** Port wingtip: red navigation light, plus a strobe on transport aircraft. */
  portTip: [number, number]
  /** Starboard wingtip: green navigation light. */
  starboardTip: [number, number]
  /** Tail: white position light, and the logo light at night. */
  tail: [number, number]
  /** Upper fuselage anti-collision beacon. */
  beacon: [number, number]
  /** Landing and taxi lights, wing root or nose gear. */
  landing: [number, number]
}

export type FlightProfile = {
  /**
   * Elevation above the horizon, degrees. Specified directly because the frame
   * only reaches 9.94 degrees, so this is what decides whether an aircraft is
   * in shot at all.
   */
  elevation: [number, number]
  /**
   * Slant range in metres. This alone decides apparent size, so it is specified
   * rather than derived, and altitude and ground distance fall out of the two.
   */
  slant: [number, number]
  /** True airspeed in metres per second. */
  speed: [number, number]
  /** Relative likelihood of this profile being chosen. */
  weight: number
  /** Contrails only form in the cold, dry air of the upper troposphere. */
  contrail?: boolean
  /** Landing lights are conventionally on below ten thousand feet. */
  terminalArea?: boolean
}

export type AircraftType = {
  id: string
  label: string
  category: AircraftCategory
  asset: string
  /** Overall length in metres. Drives apparent size directly. */
  length: number
  wingspan: number
  /** Sprite aspect ratio, width over height, used to size the element. */
  spriteAspect: number
  lights: LightAnchors
  /** Anti-collision beacon flashes per minute. Regulation allows 40 to 100. */
  beaconRate: number
  /** White strobe flashes per minute. */
  strobeRate: number
  hasStrobes: boolean
  hasBeacon: boolean
  hasLandingLight: boolean
  /** Helicopters have a slow pulsing light rather than airline style strobes. */
  rotorcraft?: boolean
  profiles: FlightProfile[]
}

const TRANSPORT_LIGHTS: LightAnchors = {
  portTip: [0.11, 0.63],
  starboardTip: [0.80, 0.86],
  tail: [0.02, 0.42],
  beacon: [0.46, 0.29],
  landing: [0.71, 0.71],
}

const LIGHT_AIRCRAFT_LIGHTS: LightAnchors = {
  portTip: [0.14, 0.58],
  starboardTip: [0.74, 0.82],
  tail: [0.03, 0.5],
  beacon: [0.44, 0.26],
  landing: [0.8, 0.62],
}

/**
 * Paris tightly restricts low overflight of the city centre, so airliners and
 * light aircraft are placed well out and reasonably high. Rotorcraft on police,
 * medical and press work genuinely do operate low over the city, which is why
 * they are the only category allowed close enough to look large.
 */
const AIRLINER_PROFILES: FlightProfile[] = [
  // Approach or departure, close enough to read as an aircraft. At four to nine
  // kilometres and these elevations the altitudes work out at roughly five
  // hundred to three thousand feet, which is where Orly and Le Bourget traffic
  // actually is when seen from a rooftop in the centre.
  { elevation: [1.8, 6.5], slant: [4_000, 9_000], speed: [105, 150], weight: 5, terminalArea: true },
  // Climbing out or descending, further off and correspondingly smaller.
  { elevation: [3.5, 9], slant: [13_000, 26_000], speed: [150, 200], weight: 3 },
  // Cruise. Effectively a contrail with a speck at the front, which is exactly
  // what an airliner at eleven kilometres looks like.
  { elevation: [6, 9.5], slant: [45_000, 95_000], speed: [230, 255], weight: 2, contrail: true },
]

const BUSINESS_PROFILES: FlightProfile[] = [
  { elevation: [1.8, 6.5], slant: [3_200, 8_000], speed: [110, 165], weight: 5, terminalArea: true },
  { elevation: [5, 9.4], slant: [40_000, 85_000], speed: [225, 250], weight: 2, contrail: true },
]

const GA_PROFILES: FlightProfile[] = [
  { elevation: [1.4, 5], slant: [1_900, 5_000], speed: [42, 68], weight: 5, terminalArea: true },
]

const HELICOPTER_PROFILES: FlightProfile[] = [
  // The only category that genuinely operates low over the city, so the only
  // one allowed close enough to look large.
  { elevation: [2, 8], slant: [900, 3_000], speed: [38, 62], weight: 5, terminalArea: true },
]

export const AIRCRAFT: AircraftType[] = [
  {
    id: 'a220',
    label: 'Airbus A220-300',
    category: 'airliner',
    asset: '/assets/aircraft-a220.webp',
    length: 38.7,
    wingspan: 35.1,
    spriteAspect: 900 / 218,
    lights: TRANSPORT_LIGHTS,
    beaconRate: 45,
    strobeRate: 60,
    hasStrobes: true,
    hasBeacon: true,
    hasLandingLight: true,
    profiles: AIRLINER_PROFILES,
  },
  {
    id: 'a320',
    label: 'Airbus A320',
    category: 'airliner',
    asset: '/assets/aircraft-a320.webp',
    length: 37.57,
    wingspan: 35.8,
    spriteAspect: 900 / 245,
    lights: TRANSPORT_LIGHTS,
    beaconRate: 45,
    strobeRate: 60,
    hasStrobes: true,
    hasBeacon: true,
    hasLandingLight: true,
    profiles: AIRLINER_PROFILES,
  },
  {
    id: 'b737',
    label: 'Boeing 737-800',
    category: 'airliner',
    asset: '/assets/aircraft-b737.webp',
    length: 39.5,
    wingspan: 35.8,
    spriteAspect: 900 / 233,
    lights: TRANSPORT_LIGHTS,
    beaconRate: 48,
    strobeRate: 62,
    hasStrobes: true,
    hasBeacon: true,
    hasLandingLight: true,
    profiles: AIRLINER_PROFILES,
  },
  {
    id: 'crj700',
    label: 'Bombardier CRJ700',
    category: 'airliner',
    asset: '/assets/aircraft-crj700.webp',
    length: 32.3,
    wingspan: 23.2,
    spriteAspect: 850 / 205,
    lights: TRANSPORT_LIGHTS,
    beaconRate: 50,
    strobeRate: 65,
    hasStrobes: true,
    hasBeacon: true,
    hasLandingLight: true,
    profiles: AIRLINER_PROFILES,
  },
  {
    id: 'falcon8x',
    label: 'Dassault Falcon 8X',
    category: 'business',
    asset: '/assets/aircraft-falcon8x.webp',
    length: 24.46,
    wingspan: 26.29,
    spriteAspect: 850 / 284,
    lights: TRANSPORT_LIGHTS,
    beaconRate: 52,
    strobeRate: 68,
    hasStrobes: true,
    hasBeacon: true,
    hasLandingLight: true,
    profiles: BUSINESS_PROFILES,
  },
  {
    id: 'vision',
    label: 'Cirrus Vision SF50',
    category: 'business',
    asset: '/assets/aircraft-vision.webp',
    length: 9.42,
    wingspan: 11.46,
    spriteAspect: 760 / 224,
    lights: LIGHT_AIRCRAFT_LIGHTS,
    beaconRate: 55,
    strobeRate: 70,
    hasStrobes: true,
    hasBeacon: true,
    hasLandingLight: true,
    profiles: [
      { elevation: [1.6, 6], slant: [2_600, 7_000], speed: [95, 135], weight: 5, terminalArea: true },
    ],
  },
  {
    id: 'c172',
    label: 'Cessna 172 Skyhawk',
    category: 'ga',
    asset: '/assets/aircraft-c172.webp',
    length: 8.28,
    wingspan: 11.0,
    spriteAspect: 700 / 234,
    lights: LIGHT_AIRCRAFT_LIGHTS,
    beaconRate: 45,
    strobeRate: 55,
    hasStrobes: true,
    hasBeacon: false,
    hasLandingLight: true,
    profiles: GA_PROFILES,
  },
  {
    id: 'piper-cub',
    label: 'Piper J-3 Cub',
    category: 'ga',
    asset: '/assets/aircraft-piper-cub.webp',
    length: 6.83,
    wingspan: 10.74,
    spriteAspect: 700 / 267,
    lights: LIGHT_AIRCRAFT_LIGHTS,
    beaconRate: 40,
    strobeRate: 0,
    hasStrobes: false,
    hasBeacon: false,
    hasLandingLight: false,
    profiles: [
      { elevation: [1.2, 4.2], slant: [1_500, 4_000], speed: [30, 44], weight: 5 },
    ],
  },
  {
    id: 'da40',
    label: 'Diamond DA40',
    category: 'ga',
    asset: '/assets/aircraft-da40.webp',
    length: 8.06,
    wingspan: 11.94,
    spriteAspect: 720 / 222,
    lights: LIGHT_AIRCRAFT_LIGHTS,
    beaconRate: 48,
    strobeRate: 58,
    hasStrobes: true,
    hasBeacon: false,
    hasLandingLight: true,
    profiles: GA_PROFILES,
  },
  {
    id: 'h135',
    label: 'Airbus H135',
    category: 'helicopter',
    asset: '/assets/aircraft-h135.webp',
    length: 12.16,
    wingspan: 10.2,
    spriteAspect: 700 / 283,
    lights: {
      portTip: [0.33, 0.62],
      starboardTip: [0.62, 0.7],
      tail: [0.05, 0.55],
      beacon: [0.47, 0.3],
      landing: [0.82, 0.55],
    },
    beaconRate: 42,
    strobeRate: 40,
    hasStrobes: true,
    hasBeacon: true,
    hasLandingLight: true,
    rotorcraft: true,
    profiles: HELICOPTER_PROFILES,
  },
]

/** Mean seconds between arrivals, before the crossing time itself. */
export const TRAFFIC_GAP: Record<string, [number, number]> = {
  quiet: [240, 420],
  low: [120, 240],
  medium: [45, 120],
  high: [8, 40],
}

export function pickProfile(type: AircraftType, random: () => number): FlightProfile {
  const total = type.profiles.reduce((sum, profile) => sum + profile.weight, 0)
  let target = random() * total
  for (const profile of type.profiles) {
    target -= profile.weight
    if (target <= 0) return profile
  }
  return type.profiles[type.profiles.length - 1]
}
