import { useMemo } from 'react'
import type { SceneEnvironment } from '../../types/scene'
import { parisAssets } from '../assetRegistry'

type AircraftLane = 'far' | 'near'

type AircraftLayerProps = {
  environment: SceneEnvironment
  density: number
  lane: AircraftLane
  reducedMotion: boolean
}

const configs = [
  { top: 24, duration: 46, delay: -8, width: 8.4, direction: 1, asset: 0 },
  { top: 33, duration: 58, delay: -33, width: 6.7, direction: -1, asset: 3 },
  { top: 18, duration: 65, delay: -20, width: 5.8, direction: 1, asset: 4 },
  { top: 39, duration: 52, delay: -45, width: 7.4, direction: -1, asset: 1 },
  { top: 28, duration: 49, delay: -26, width: 7.9, direction: 1, asset: 2 },
]

export function AircraftLayer({ environment, density, lane, reducedMotion }: AircraftLayerProps) {
  const count = reducedMotion ? 0 : Math.max(0, Math.min(configs.length, Math.ceil(density * configs.length)))
  const selected = useMemo(() => {
    if (lane === 'far') return configs.slice(0, Math.min(2, count))
    return configs.slice(2, 2 + Math.max(0, count - 1))
  }, [count, lane])
  if (!selected.length) return null

  return (
    <div className={`scene-layer aircraft-layer aircraft-layer--${lane}`} aria-hidden="true">
      {selected.map((config, index) => {
        const opacity = lane === 'far' ? 0.44 * environment.visibility : 0.78 * environment.visibility
        return (
          <div
            className={`aircraft-track ${config.direction < 0 ? 'aircraft-track--reverse' : ''}`}
            key={`${lane}-${index}`}
            style={{
              top: `${config.top}%`,
              ['--flight-duration' as string]: `${config.duration}s`,
              ['--flight-delay' as string]: `${config.delay}s`,
            }}
          >
            <span className="aircraft-sprite" style={{ width: `${config.width}vw`, opacity }}>
              <img src={parisAssets.aircraft[config.asset % parisAssets.aircraft.length]} alt="" draggable={false} />
              {environment.isNight && <i className="aircraft-nav-light" />}
            </span>
          </div>
        )
      })}
    </div>
  )
}
