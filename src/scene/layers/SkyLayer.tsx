import type { LightingState, SceneEnvironment } from '../../types/scene'

export function SkyLayer({ lighting, environment }: { lighting: LightingState; environment: SceneEnvironment }) {
  const starOpacity = environment.isNight ? Math.min(0.7, 0.22 + (1 - environment.cloudCover) * 0.58) : 0
  return (
    <div className="scene-layer sky-layer" aria-hidden="true" style={{
      background: `linear-gradient(180deg, ${lighting.skyTop} 0%, ${lighting.skyHorizon} 56%, ${lighting.skyLower} 100%)`,
    }}>
      <div className="star-field" style={{ opacity: starOpacity }} />
    </div>
  )
}
