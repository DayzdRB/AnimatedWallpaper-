import type { SceneEnvironment } from '../../types/scene'

export function AutumnLeavesLayer({ environment, reducedMotion }: { environment: SceneEnvironment; reducedMotion: boolean }) {
  if (environment.season !== 'autumn' || reducedMotion || environment.wind < 0.16) return null
  return (
    <div className="scene-layer leaves-layer" aria-hidden="true">
      {Array.from({ length: 12 }, (_, index) => (
        <i key={index} className="falling-leaf" style={{
          left: `${(index * 11 + 5) % 100}%`,
          animationDelay: `${-index * 1.7}s`,
          animationDuration: `${8 + (index % 5) * 1.6}s`,
          opacity: 0.22 + environment.wind * 0.42,
        }} />
      ))}
    </div>
  )
}
