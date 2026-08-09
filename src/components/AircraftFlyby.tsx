import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { AircraftDensity } from '../lib/settings'
import type { TimeOfDay } from '../lib/time'

type AircraftCategory = 'airliner' | 'business' | 'ga' | 'helicopter'
type AircraftDefinition = {
  id: string
  label: string
  category: AircraftCategory
  asset: string
  duration: [number, number]
  width: [number, number]
  altitude: [number, number]
}

type AircraftStyle = CSSProperties & Record<`--${string}`, string | number>
type Categories = Record<AircraftCategory, boolean>

type AircraftFlybyProps = {
  enabled: boolean
  isNight: boolean
  timeOfDay: TimeOfDay
  density: AircraftDensity
  categories: Categories
}

const AIRCRAFT: AircraftDefinition[] = [
  { id: 'a220', label: 'Air France Airbus A220-300', category: 'airliner', asset: '/assets/aircraft-a220.webp', duration: [32, 42], width: [9.2, 11.8], altitude: [13, 26] },
  { id: 'a320', label: 'Air France Airbus A320', category: 'airliner', asset: '/assets/aircraft-a320.webp', duration: [31, 41], width: [9.5, 12.2], altitude: [12, 25] },
  { id: 'b737', label: 'Ryanair Boeing 737-800', category: 'airliner', asset: '/assets/aircraft-b737.webp', duration: [30, 40], width: [9.6, 12.3], altitude: [12, 25] },
  { id: 'crj700', label: 'Air France HOP CRJ700', category: 'airliner', asset: '/assets/aircraft-crj700.webp', duration: [34, 45], width: [8.5, 10.7], altitude: [14, 28] },
  { id: 'falcon8x', label: 'Dassault Falcon 8X', category: 'business', asset: '/assets/aircraft-falcon8x.webp', duration: [36, 48], width: [7.8, 9.8], altitude: [15, 30] },
  { id: 'vision', label: 'Cirrus Vision Jet', category: 'business', asset: '/assets/aircraft-vision.webp', duration: [40, 52], width: [6.3, 8.2], altitude: [18, 32] },
  { id: 'c172', label: 'Cessna 172 Skyhawk', category: 'ga', asset: '/assets/aircraft-c172.webp', duration: [50, 66], width: [5.6, 7.1], altitude: [22, 36] },
  { id: 'piper-cub', label: 'Piper J-3 Cub', category: 'ga', asset: '/assets/aircraft-piper-cub.webp', duration: [54, 70], width: [5.5, 6.9], altitude: [23, 37] },
  { id: 'da40', label: 'Diamond DA40', category: 'ga', asset: '/assets/aircraft-da40.webp', duration: [48, 62], width: [5.8, 7.3], altitude: [21, 35] },
  { id: 'h135', label: 'Gendarmerie Airbus H135', category: 'helicopter', asset: '/assets/aircraft-h135.webp', duration: [58, 76], width: [5.7, 7.2], altitude: [25, 39] },
]

const gaps: Record<AircraftDensity, [number, number]> = {
  low: [220_000, 360_000],
  medium: [105_000, 210_000],
  high: [38_000, 90_000],
}

function randomBetween(min: number, max: number) { return min + Math.random() * (max - min) }

export function AircraftFlyby({ enabled, isNight, timeOfDay, density, categories }: AircraftFlybyProps) {
  const [flyby, setFlyby] = useState<{ aircraft: AircraftDefinition; duration: number; top: number; width: number; id: number } | null>(null)
  const previous = useRef('')
  const preview = new URLSearchParams(window.location.search).has('aircraftPreview')

  useEffect(() => {
    if (!enabled) { setFlyby(null); return }
    let launchTimer = 0
    let completionTimer = 0
    let previewIndex = 0

    function scheduleLaunch(delay: number) {
      launchTimer = window.setTimeout(() => {
        const eligible = AIRCRAFT.filter((aircraft) => categories[aircraft.category] && aircraft.id !== previous.current)
        if (!eligible.length) { scheduleLaunch(20_000); return }
        const aircraft = preview ? eligible[previewIndex++ % eligible.length] : eligible[Math.floor(Math.random() * eligible.length)]
        previous.current = aircraft.id
        const duration = preview ? 8 : randomBetween(...aircraft.duration)
        setFlyby({ aircraft, duration, top: randomBetween(...aircraft.altitude), width: randomBetween(...aircraft.width), id: Date.now() })
        completionTimer = window.setTimeout(() => setFlyby(null), duration * 1_000)
        const [minimum, maximum] = gaps[density]
        scheduleLaunch(duration * 1_000 + (preview ? 1_000 : randomBetween(minimum, maximum)))
      }, delay)
    }

    scheduleLaunch(preview ? 800 : randomBetween(8_000, 16_000))
    return () => { window.clearTimeout(launchTimer); window.clearTimeout(completionTimer) }
  }, [enabled, density, categories.airliner, categories.business, categories.ga, categories.helicopter, preview])

  if (!flyby) return null
  const style: AircraftStyle = {
    '--aircraft-duration': `${flyby.duration}s`,
    '--aircraft-top': `${flyby.top}%`,
    '--aircraft-width': `${flyby.width}rem`,
  }

  return (
    <div className={`aircraft-sprite aircraft-sprite--${flyby.aircraft.category} aircraft-sprite--${timeOfDay}${isNight ? ' aircraft-sprite--night' : ''}`} style={style} title={flyby.aircraft.label}>
      <span className="aircraft-sprite__body"><img src={flyby.aircraft.asset} alt="" /></span>
      <i className="aircraft-nav aircraft-nav--red" />
      <i className="aircraft-nav aircraft-nav--green" />
      <i className="aircraft-nav aircraft-nav--beacon" />
      <i className="aircraft-nav aircraft-nav--strobe" />
      {isNight && <i className="aircraft-landing-light" />}
    </div>
  )
}
