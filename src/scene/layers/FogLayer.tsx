import type { LightingState, SceneEnvironment } from '../../types/scene'

export function FogBackLayer({ environment, lighting }: { environment: SceneEnvironment; lighting: LightingState }) {
  const opacity = Math.max(lighting.hazeOpacity, environment.weather === 'fog' ? 0.32 + (1 - environment.visibility) * 0.36 : 0)
  return <div className="scene-layer fog-back" style={{ opacity }} aria-hidden="true" />
}

export function FogFrontLayer({ environment, lighting }: { environment: SceneEnvironment; lighting: LightingState }) {
  const opacity = environment.weather === 'fog'
    ? Math.min(0.48, (1 - environment.visibility) * 0.55)
    : environment.weather === 'rain' || environment.weather === 'storm'
      ? environment.precipitation * 0.12
      : 0
  return <div className="scene-layer fog-front" style={{ opacity, filter: `brightness(${0.72 + lighting.ambientIntensity * 0.28})` }} aria-hidden="true" />
}
