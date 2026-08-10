import type { LightingState, SceneEnvironment } from '../types/scene'
import { AircraftLayer } from './layers/AircraftLayer'
import { AutumnLeavesLayer } from './layers/AutumnLeavesLayer'
import { CloudLayer } from './layers/CloudLayer'
import { FogBackLayer, FogFrontLayer } from './layers/FogLayer'
import { LightingEffectsLayer } from './layers/LightingEffectsLayer'
import { PrecipitationLayer } from './layers/PrecipitationLayer'
import { CityLayer, LandmarkLayers } from './layers/SceneryLayers'
import { SeasonLayer } from './layers/SeasonLayer'
import { SkyLayer } from './layers/SkyLayer'
import { StormLayer } from './layers/StormLayer'
import { WetnessLayer } from './layers/WetnessLayer'
import { SpecialEventLayer } from './fx/SpecialEventLayer'

export function SceneRenderer({
  environment,
  lighting,
  aircraftDensity,
  reducedMotion,
  specialEventId,
}: {
  environment: SceneEnvironment
  lighting: LightingState
  aircraftDensity: number
  reducedMotion: boolean
  specialEventId: number
}) {
  return (
    <div className={`scene-stage scene-stage--${environment.timeOfDay} scene-stage--${environment.weather} scene-stage--${environment.season}`}>
      <SkyLayer lighting={lighting} environment={environment} />
      <CloudLayer environment={environment} lighting={lighting} />
      <FogBackLayer environment={environment} lighting={lighting} />
      <AircraftLayer environment={environment} density={aircraftDensity * 0.65} lane="far" reducedMotion={reducedMotion} />
      <CityLayer environment={environment} lighting={lighting} />
      <SeasonLayer environment={environment} lighting={lighting} />
      <WetnessLayer environment={environment} lighting={lighting} />
      <AircraftLayer environment={environment} density={aircraftDensity} lane="near" reducedMotion={reducedMotion} />
      <LandmarkLayers lighting={lighting} />
      <LightingEffectsLayer lighting={lighting} />
      <FogFrontLayer environment={environment} lighting={lighting} />
      <AutumnLeavesLayer environment={environment} reducedMotion={reducedMotion} />
      <PrecipitationLayer environment={environment} lighting={lighting} reducedMotion={reducedMotion} />
      <StormLayer environment={environment} lighting={lighting} />
      <SpecialEventLayer eventId={specialEventId} />
    </div>
  )
}
