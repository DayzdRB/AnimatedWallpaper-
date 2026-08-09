import { useEffect, useState, type CSSProperties } from 'react'

type Flyby = {
  id: number
  direction: 'ltr' | 'rtl'
  duration: number
  top: number
  scale: number
}

type AircraftStyle = CSSProperties & {
  '--aircraft-duration': string
  '--aircraft-top': string
  '--aircraft-scale': number
}

type AircraftFlybyProps = {
  enabled: boolean
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

export function AircraftFlyby({ enabled }: AircraftFlybyProps) {
  const [flyby, setFlyby] = useState<Flyby | null>(null)

  useEffect(() => {
    if (!enabled) {
      setFlyby(null)
      return
    }

    let launchTimer = 0
    let completionTimer = 0

    function scheduleLaunch(delay: number) {
      launchTimer = window.setTimeout(() => {
        const duration = randomBetween(26, 36)
        setFlyby({
          id: Date.now(),
          direction: Math.random() > 0.5 ? 'ltr' : 'rtl',
          duration,
          top: randomBetween(12, 35),
          scale: randomBetween(0.72, 1.08),
        })

        completionTimer = window.setTimeout(() => setFlyby(null), duration * 1_000)
        scheduleLaunch(duration * 1_000 + randomBetween(120_000, 240_000))
      }, delay)
    }

    // A short first delay makes the feature discoverable; later flights are intentionally rare.
    scheduleLaunch(randomBetween(12_000, 24_000))

    return () => {
      window.clearTimeout(launchTimer)
      window.clearTimeout(completionTimer)
    }
  }, [enabled])

  if (!flyby) return null

  const style: AircraftStyle = {
    '--aircraft-duration': `${flyby.duration}s`,
    '--aircraft-top': `${flyby.top}%`,
    '--aircraft-scale': flyby.scale,
  }

  return (
    <div
      className={`aircraft aircraft--${flyby.direction}`}
      style={style}
      aria-hidden="true"
      key={flyby.id}
    >
      <span className="aircraft__contrail" />
      <svg className="aircraft__shape" viewBox="0 0 180 72">
        <path d="M7 40l58-7 35-26h15l-17 25 49-3 20-14h8l-8 17c7 2 10 5 10 8s-3 6-10 8l8 17h-8l-20-14-49-3 17 25h-15L65 47 7 40z" />
        <path className="aircraft__highlight" d="M22 39l121-5M77 34l30-21M77 46l30 21" />
      </svg>
    </div>
  )
}

