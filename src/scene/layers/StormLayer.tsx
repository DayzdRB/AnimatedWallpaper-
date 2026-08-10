import type { LightingState, SceneEnvironment } from '../../types/scene'

export function StormLayer({ environment, lighting }: { environment: SceneEnvironment; lighting: LightingState }) {
  if (environment.weather !== 'storm') return null
  return (
    <div className="scene-layer storm-layer" aria-hidden="true">
      <div className="storm-lightning" style={{ ['--storm-strength' as string]: Math.max(0.35, environment.precipitation), opacity: 0.28 + lighting.ambientIntensity * 0.12 }} />
    </div>
  )
}
