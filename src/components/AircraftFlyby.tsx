import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

type AircraftCategory = 'airliner' | 'business' | 'ga' | 'helicopter'
type AircraftModel =
  | 'a220' | 'a320' | 'b737' | 'crj700'
  | 'citation' | 'vision'
  | 'cessna172' | 'piper-cub' | 'da40'
  | 'helicopter'

type AircraftDefinition = {
  model: AircraftModel
  category: AircraftCategory
  label: string
  duration: [number, number]
  width: [number, number]
  contrail: boolean
}

type Livery = { body: string; accent: string; dark: string; metal: string }

type Flyby = {
  id: number
  aircraft: AircraftDefinition
  duration: number
  top: number
  width: number
  livery: Livery
}

type AircraftStyle = CSSProperties & Record<`--${string}`, string | number>

type AircraftFlybyProps = {
  enabled: boolean
  isNight: boolean
}

const AIRCRAFT: AircraftDefinition[] = [
  { model: 'cessna172', category: 'ga', label: 'Cessna 172', duration: [48, 62], width: [6.1, 7.2], contrail: false },
  { model: 'piper-cub', category: 'ga', label: 'Piper Cub', duration: [52, 68], width: [6, 7], contrail: false },
  { model: 'da40', category: 'ga', label: 'Diamond DA40', duration: [44, 58], width: [6.2, 7.3], contrail: false },
  { model: 'vision', category: 'business', label: 'Cirrus Vision Jet', duration: [37, 48], width: [6.6, 7.8], contrail: true },
  { model: 'citation', category: 'business', label: 'Private jet', duration: [34, 44], width: [7.4, 8.8], contrail: true },
  { model: 'a220', category: 'airliner', label: 'Airbus A220', duration: [31, 40], width: [8.2, 9.8], contrail: true },
  { model: 'a320', category: 'airliner', label: 'Airbus A320', duration: [30, 39], width: [8.5, 10.2], contrail: true },
  { model: 'b737', category: 'airliner', label: 'Boeing 737', duration: [29, 38], width: [8.5, 10.3], contrail: true },
  { model: 'crj700', category: 'airliner', label: 'Bombardier CRJ700', duration: [34, 43], width: [7.7, 9.1], contrail: true },
  { model: 'helicopter', category: 'helicopter', label: 'Helicopter', duration: [55, 72], width: [5.6, 6.8], contrail: false },
]

const LIVERIES: Livery[] = [
  { body: '#e8edf1', accent: '#285f96', dark: '#172438', metal: '#a9b5bf' },
  { body: '#f3eee5', accent: '#a8343f', dark: '#302a31', metal: '#b8b1aa' },
  { body: '#dfe7e7', accent: '#167f82', dark: '#19353b', metal: '#9eacad' },
  { body: '#dadce1', accent: '#c29a43', dark: '#1b2230', metal: '#949ca8' },
  { body: '#d9e3ef', accent: '#6c477b', dark: '#242236', metal: '#9da8b6' },
]

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function AircraftLights({ isNight }: { isNight: boolean }) {
  return (
    <g className="aircraft-lights">
      <circle className="aircraft-light aircraft-light--beacon" cx="116" cy="27" r="2.1" />
      <circle className="aircraft-light aircraft-light--strobe" cx="102" cy="67" r="2.2" />
      <circle className="aircraft-light aircraft-light--nav-red" cx="34" cy="44" r="1.6" />
      <circle className="aircraft-light aircraft-light--nav-green" cx="207" cy="44" r="1.6" />
      {isNight && <circle className="aircraft-light aircraft-light--landing" cx="207" cy="45" r="3" />}
    </g>
  )
}

function Airliner({ model }: { model: 'a220' | 'a320' | 'b737' | 'crj700' }) {
  const rearEngines = model === 'crj700'
  const shortBody = model === 'a220' || rearEngines
  return (
    <>
      <path className="aircraft-fill" d={`M18 46c9-7 24-10 43-11l${shortBody ? 112 : 127}-1 33-25h10l-12 25c16 2 27 6 30 11-4 6-16 9-31 10l10 24h-9l-30-22-105-2c-21 0-38-3-51-9Z`} />
      <path className="aircraft-wing" d={model === 'b737' ? 'M92 43l36-28h14l-22 30 40 7-3 7-53-6-31 22H61l21-27Z' : 'M87 43l43-28h12l-24 30 44 7-4 7-56-6-34 22H56l23-27Z'} />
      {!rearEngines && <><ellipse className="aircraft-engine" cx="119" cy="58" rx={model === 'a220' ? 10 : 12} ry="6" /><ellipse className="aircraft-engine" cx="151" cy="57" rx={model === 'a220' ? 9 : 11} ry="5.5" /></>}
      {rearEngines && <><ellipse className="aircraft-engine" cx="174" cy="39" rx="13" ry="6" /><path className="aircraft-tail-detail" d="M176 31h30l-3 5-28 2Z" /></>}
      <path className="aircraft-stripe" d={`M28 43c42 2 113 ${shortBody ? 0 : -1} 174-2l10 4c-71 5-137 6-183 2Z`} />
      <g className="aircraft-windows">{Array.from({ length: shortBody ? 12 : 15 }, (_, i) => <rect key={i} x={60 + i * 8} y="38" width="3.8" height="2.2" rx="1" />)}</g>
      <path className="aircraft-highlight" d="M31 40c58-4 118-3 171-2" />
    </>
  )
}

function BusinessJet({ vision = false }: { vision?: boolean }) {
  if (vision) return (
    <>
      <path className="aircraft-fill" d="M28 49c15-11 35-14 80-14h47l39-24h9l-13 26c17 3 25 7 29 12-8 8-24 10-51 9l-65-1c-32 0-58-2-75-8Z" />
      <path className="aircraft-wing" d="M94 44l40-26h11l-23 29 47 8-5 8-59-8-28 19H65Z" />
      <ellipse className="aircraft-engine" cx="145" cy="28" rx="15" ry="6" />
      <path className="aircraft-stripe" d="M42 47c45 2 94 1 157-2l8 4c-55 6-119 7-166 2Z" />
      <path className="aircraft-window-band" d="M64 39h56c-8 5-21 7-56 7Z" />
    </>
  )
  return (
    <>
      <path className="aircraft-fill" d="M24 48c17-9 38-12 78-12h66l28-27h9l-8 29c15 3 23 7 27 11-8 7-23 9-50 9H97c-32 0-57-3-73-10Z" />
      <path className="aircraft-wing" d="M98 44l42-27h10l-21 29 45 8-5 7-58-7-31 20H68Z" />
      <ellipse className="aircraft-engine" cx="169" cy="43" rx="17" ry="6.5" />
      <ellipse className="aircraft-engine" cx="170" cy="53" rx="16" ry="5.8" />
      <path className="aircraft-tail-detail" d="M170 31h35l-2 6-33 2Z" />
      <path className="aircraft-stripe" d="M37 46c54 3 111 2 172-2l7 5c-68 6-127 6-178 1Z" />
      <g className="aircraft-windows">{Array.from({ length: 8 }, (_, i) => <rect key={i} x={67 + i * 9} y="39" width="4" height="2.4" rx="1" />)}</g>
    </>
  )
}

function GeneralAviation({ model }: { model: 'cessna172' | 'piper-cub' | 'da40' }) {
  if (model === 'da40') return (
    <>
      <path className="aircraft-fill" d="M26 49c17-9 42-12 77-12h52c25 0 45 5 60 13-12 7-34 10-61 10H91c-31 0-51-4-65-11Z" />
      <path className="aircraft-window-band" d="M83 36h59l21 13H66Z" />
      <path className="aircraft-wing" d="M102 45l49-24h11l-31 28 51 8-5 8-67-9-42 18H54Z" />
      <path className="aircraft-tail-detail" d="M45 37l18-19h8l-5 24Z" />
      <path className="aircraft-stripe" d="M36 49h165l-17 6H46Z" />
      <circle className="aircraft-wheel" cx="93" cy="65" r="4" /><circle className="aircraft-wheel" cx="178" cy="63" r="3.4" />
    </>
  )
  const cub = model === 'piper-cub'
  return (
    <>
      <path className="aircraft-fill" d="M29 48c19-7 42-9 71-9h62c26 0 43 4 55 11-14 7-34 9-62 9H89c-27 0-47-4-60-11Z" />
      <path className="aircraft-wing" d="M54 29h119l17 8H48Z" />
      <path className="aircraft-strut" d="M87 37l24 24M154 37l-24 24" />
      <path className="aircraft-window-band" d="M93 39h51l14 13H82Z" />
      <path className="aircraft-tail-detail" d={cub ? 'M36 40l16-19h8l-2 25Z' : 'M39 40l18-21h8l-4 26Z'} />
      <path className="aircraft-stripe" d="M39 49h165l-14 5H47Z" />
      <path className="aircraft-gear" d={cub ? 'M105 57l-9 12m9-12 10 12' : 'M104 57l-6 12m58-12 5 12'} />
      <circle className="aircraft-wheel" cx={cub ? 95 : 98} cy="70" r="4" /><circle className="aircraft-wheel" cx={cub ? 116 : 161} cy="70" r="4" />
      <circle className="aircraft-propeller" cx="211" cy="48" r="3" /><path className="aircraft-propeller-blade" d="M211 18v60" />
    </>
  )
}

function Helicopter() {
  return (
    <>
      <path className="aircraft-fill" d="M51 50c3-18 18-29 42-29h31c23 0 37 13 40 31l58 1 8 7-69 5c-8 13-25 19-51 19H85c-22 0-36-12-34-34Z" />
      <path className="aircraft-window-band" d="M67 48c5-15 17-21 34-21h17v30H65Z" />
      <path className="aircraft-stripe" d="M57 58h101l-4 8H61Z" />
      <path className="aircraft-gear" d="M78 78h65m-56-1-9 9m55-9 10 9" />
      <g className="aircraft-rotor"><path d="M26 15h162" /><path d="M106 15v9" /></g>
      <g className="aircraft-tail-rotor"><circle cx="222" cy="55" r="12" /><path d="M222 43v24M210 55h24" /></g>
    </>
  )
}

function AircraftArtwork({ model, isNight }: { model: AircraftModel; isNight: boolean }) {
  let artwork: ReactNode
  if (model === 'a220' || model === 'a320' || model === 'b737' || model === 'crj700') artwork = <Airliner model={model} />
  else if (model === 'citation') artwork = <BusinessJet />
  else if (model === 'vision') artwork = <BusinessJet vision />
  else if (model === 'helicopter') artwork = <Helicopter />
  else artwork = <GeneralAviation model={model} />

  return <svg className="aircraft__shape" viewBox="0 0 240 90">{artwork}<AircraftLights isNight={isNight} /></svg>
}

export function AircraftFlyby({ enabled, isNight }: AircraftFlybyProps) {
  const [flyby, setFlyby] = useState<Flyby | null>(null)
  const previousModel = useRef<AircraftModel | null>(null)

  useEffect(() => {
    if (!enabled) {
      setFlyby(null)
      return
    }

    let launchTimer = 0
    let completionTimer = 0

    function scheduleLaunch(delay: number) {
      launchTimer = window.setTimeout(() => {
        const choices = AIRCRAFT.filter((item) => item.model !== previousModel.current)
        const aircraft = choices[Math.floor(Math.random() * choices.length)]
        previousModel.current = aircraft.model
        const duration = randomBetween(...aircraft.duration)
        setFlyby({
          id: Date.now(),
          aircraft,
          duration,
          top: randomBetween(aircraft.category === 'helicopter' ? 18 : 10, aircraft.category === 'ga' ? 32 : 29),
          width: randomBetween(...aircraft.width),
          livery: LIVERIES[Math.floor(Math.random() * LIVERIES.length)],
        })

        completionTimer = window.setTimeout(() => setFlyby(null), duration * 1_000)
        scheduleLaunch(duration * 1_000 + randomBetween(110_000, 230_000))
      }, delay)
    }

    scheduleLaunch(randomBetween(8_000, 16_000))
    return () => {
      window.clearTimeout(launchTimer)
      window.clearTimeout(completionTimer)
    }
  }, [enabled])

  if (!flyby) return null

  const style: AircraftStyle = {
    '--aircraft-duration': `${flyby.duration}s`,
    '--aircraft-top': `${flyby.top}%`,
    '--aircraft-width': `${flyby.width}rem`,
    '--aircraft-body': flyby.livery.body,
    '--aircraft-accent': flyby.livery.accent,
    '--aircraft-dark': flyby.livery.dark,
    '--aircraft-metal': flyby.livery.metal,
  }

  return (
    <div
      className={`aircraft aircraft--${flyby.aircraft.category} aircraft--${flyby.aircraft.model}${isNight ? ' aircraft--night' : ''}`}
      style={style}
      aria-hidden="true"
      key={flyby.id}
      title={flyby.aircraft.label}
    >
      {flyby.aircraft.contrail && <span className="aircraft__contrail" />}
      {isNight && flyby.aircraft.category !== 'helicopter' && <span className="aircraft__landing-beam" />}
      <span className="aircraft__motion"><AircraftArtwork model={flyby.aircraft.model} isNight={isNight} /></span>
    </div>
  )
}
