import type { CSSProperties } from 'react'
import type { LightingState, SceneEnvironment } from '../../types/scene'
import { parisAssets } from '../assetRegistry'

export function WetnessLayer({ environment, lighting }: { environment: SceneEnvironment; lighting: LightingState }) {
  if (environment.wetness < 0.02) return null
  const mask = `url(${parisAssets.masks.roadWetness})`
  const style = {
    opacity: environment.wetness * 0.58,
    WebkitMaskImage: mask,
    maskImage: mask,
    WebkitMaskSize: '100% 100%',
    maskSize: '100% 100%',
  } as CSSProperties
  return (
    <div className="scene-layer wetness-layer" style={style} aria-hidden="true">
      <div className="wetness-darken" />
      <div className="wetness-reflections" style={{ opacity: 0.22 + lighting.lampIntensity * 0.72 }} />
    </div>
  )
}
