import type { CSSProperties } from 'react'
import type { LightingState, SceneEnvironment } from '../../types/scene'
import { parisAssets } from '../assetRegistry'

export function SeasonLayer({ environment, lighting }: { environment: SceneEnvironment; lighting: LightingState }) {
  const seasonStyle: Record<SceneEnvironment['season'], { color: string; opacity: number }> = {
    spring: { color: '#86ad69', opacity: 0.18 },
    summer: { color: '#557d45', opacity: 0.08 },
    autumn: { color: '#c56d2f', opacity: 0.72 },
    winter: { color: '#8c918b', opacity: 0.62 },
  }
  const foliage = seasonStyle[environment.season]
  const mask = `url(${parisAssets.masks.foliage})`
  const foliageStyle = {
    backgroundColor: foliage.color,
    opacity: foliage.opacity,
    WebkitMaskImage: mask,
    maskImage: mask,
    WebkitMaskSize: '100% 100%',
    maskSize: '100% 100%',
  } as CSSProperties

  const snowOpacity = environment.snowAccumulation * lighting.snowBrightness
  const snowColor = environment.isNight ? '#9eabb9' : '#eef4f6'
  const snowStyle = {
    backgroundColor: snowColor,
    opacity: snowOpacity,
    WebkitMaskImage: `url(${parisAssets.masks.snowAccumulation})`,
    maskImage: `url(${parisAssets.masks.snowAccumulation})`,
    WebkitMaskSize: '100% 100%',
    maskSize: '100% 100%',
  } as CSSProperties

  return (
    <>
      <div className={`scene-layer foliage-season foliage-season--${environment.season}`} style={foliageStyle} aria-hidden="true" />
      {snowOpacity > 0.015 && <div className="scene-layer snow-accumulation" style={snowStyle} aria-hidden="true" />}
      {snowOpacity > 0.04 && lighting.lampIntensity > 0.35 && (
        <div className="scene-layer snow-lamp-response" style={{ opacity: snowOpacity * lighting.lampIntensity * 0.38 }} aria-hidden="true" />
      )}
    </>
  )
}
