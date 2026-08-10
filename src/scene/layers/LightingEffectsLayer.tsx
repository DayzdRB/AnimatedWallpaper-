import type { LightingState } from '../../types/scene'

const lampPoints = [
  [7, 75], [11, 80], [16, 72], [22, 77], [31, 77], [69, 75], [76, 76], [83, 72], [90, 79], [95, 73],
  [42, 72], [54, 73], [62, 70],
]

export function LightingEffectsLayer({ lighting }: { lighting: LightingState }) {
  return (
    <div className="scene-layer lighting-effects" aria-hidden="true">
      <div className="monument-warmth monument-warmth--eiffel" style={{ opacity: lighting.monumentLightIntensity * 0.68 }} />
      <div className="monument-warmth monument-warmth--arc" style={{ opacity: lighting.monumentLightIntensity * 0.72 }} />
      <div className="city-window-glow" style={{ opacity: lighting.buildingLightIntensity * 0.54 }} />
      {lampPoints.map(([x, y], index) => (
        <span
          className="lamp-glow"
          key={`${x}-${y}-${index}`}
          style={{ left: `${x}%`, top: `${y}%`, opacity: lighting.lampIntensity * (0.34 + (index % 3) * 0.08) }}
        />
      ))}
    </div>
  )
}
