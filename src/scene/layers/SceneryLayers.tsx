import type { CSSProperties } from 'react'
import type { LightingState, SceneEnvironment } from '../../types/scene'
import { parisAssets } from '../assetRegistry'

function filterFor(lighting: LightingState, kind: 'city' | 'monument') {
  const brightness = kind === 'city' ? lighting.cityBrightness : lighting.monumentBrightness
  const contrast = kind === 'city' ? lighting.cityContrast : lighting.monumentContrast
  const sepia = Math.max(0, lighting.warmth) * 0.22
  const hue = lighting.warmth < 0 ? -6 : 0
  return `brightness(${brightness}) contrast(${contrast}) saturate(${lighting.saturation}) sepia(${sepia}) hue-rotate(${hue}deg)`
}

export function CityLayer({ environment, lighting }: { environment: SceneEnvironment; lighting: LightingState }) {
  const goldenWeight = environment.timeOfDay === 'goldenHour' ? 0.34 : environment.timeOfDay === 'dusk' ? 0.1 : 0
  const cityStyle: CSSProperties = { filter: filterFor(lighting, 'city') }
  return (
    <>
      <div className="scene-layer scenery-city" style={cityStyle}>
        <img src={parisAssets.proxy.cityGround} alt="" draggable={false} />
      </div>
      {goldenWeight > 0 && (
        <div className="scene-layer golden-proxy" style={{ opacity: goldenWeight * lighting.ambientIntensity }}>
          <img src={parisAssets.proxy.anchorGolden} alt="" draggable={false} />
        </div>
      )}
    </>
  )
}

export function LandmarkLayers({ lighting }: { lighting: LightingState }) {
  const monumentStyle: CSSProperties = { filter: filterFor(lighting, 'monument') }
  return (
    <>
      <div className="scene-layer monument-layer monument-eiffel" style={monumentStyle}>
        <img src={parisAssets.proxy.eiffel} alt="" draggable={false} />
      </div>
      <div className="scene-layer monument-layer monument-arc" style={monumentStyle}>
        <img src={parisAssets.proxy.arc} alt="" draggable={false} />
      </div>
    </>
  )
}
