import type { Dispatch, SetStateAction } from 'react'
import type { SceneEnvironment, SceneSettings, Season, WeatherType } from '../../types/scene'
import { formatMinutes, weatherPreset } from '../../scene/environment'
import { RippleButton } from '../ui/RippleButton'
import { ModePill } from '../ui/ModePill'

const seasons: Season[] = ['spring', 'summer', 'autumn', 'winter']
const weathers: WeatherType[] = ['clear', 'partlyCloudy', 'overcast', 'fog', 'rain', 'storm', 'snow']
const weatherLabels: Record<WeatherType, string> = {
  clear: 'Clear', partlyCloudy: 'Partly cloudy', overcast: 'Overcast', fog: 'Fog', rain: 'Rain', storm: 'Storm', snow: 'Snow',
}

function Slider({ label, value, onChange, valueLabel }: { label: string; value: number; onChange: (value: number) => void; valueLabel?: string }) {
  return (
    <label className="setting-slider">
      <span><b>{label}</b><em>{valueLabel ?? `${Math.round(value * 100)}%`}</em></span>
      <input type="range" min="0" max="1" step="0.01" value={value} onChange={(event: React.ChangeEvent<HTMLInputElement>) => onChange(Number(event.target.value))} />
    </label>
  )
}

export function SettingsPanel({
  open,
  onClose,
  settings,
  setSettings,
  environment,
  onNuke,
}: {
  open: boolean
  onClose: () => void
  settings: SceneSettings
  setSettings: Dispatch<SetStateAction<SceneSettings>>
  environment: SceneEnvironment
  onNuke: () => void
}) {
  const patch = (next: Partial<SceneSettings>) => setSettings((current) => ({ ...current, ...next }))
  const setWeather = (weather: WeatherType) => patch({ weather, ...weatherPreset(weather) })

  return (
    <aside className={`settings-panel ${open ? 'settings-panel--open' : ''}`} aria-hidden={!open}>
      <div className="settings-panel__header">
        <div><span>SCENE CONTROL</span><h2>Paris environment</h2></div>
        <RippleButton className="icon-button" onClick={onClose} aria-label="Close settings">×</RippleButton>
      </div>

      <div className="settings-panel__scroll">
        <section className="settings-section">
          <div className="settings-section__title"><span>Displayed time</span><ModePill auto={settings.timeMode === 'auto'} onToggle={() => patch({ timeMode: settings.timeMode === 'auto' ? 'manual' : 'auto' })} /></div>
          <label className={`time-control ${settings.timeMode === 'auto' ? 'time-control--disabled' : ''}`}>
            <span>{formatMinutes(settings.manualMinutes)}</span>
            <input disabled={settings.timeMode === 'auto'} type="range" min="0" max="1439" step="1" value={settings.manualMinutes} onChange={(event: React.ChangeEvent<HTMLInputElement>) => patch({ manualMinutes: Number(event.target.value) })} />
          </label>
          <p className="settings-note">Scene lighting and the French greeting follow this displayed Paris time.</p>
        </section>

        <section className="settings-section">
          <div className="settings-section__title"><span>Season</span><ModePill auto={settings.seasonMode === 'auto'} onToggle={() => patch({ seasonMode: settings.seasonMode === 'auto' ? 'manual' : 'auto' })} /></div>
          <div className="segmented-grid segmented-grid--4">
            {seasons.map((season) => <RippleButton key={season} disabled={settings.seasonMode === 'auto'} className={settings.season === season && settings.seasonMode === 'manual' ? 'is-active' : ''} onClick={() => patch({ season })}>{season}</RippleButton>)}
          </div>
        </section>

        <section className="settings-section">
          <div className="settings-section__title"><span>Weather</span><ModePill auto={settings.weatherMode === 'auto'} onToggle={() => patch({ weatherMode: settings.weatherMode === 'auto' ? 'manual' : 'auto' })} /></div>
          <div className="weather-grid">
            {weathers.map((weather) => <RippleButton key={weather} disabled={settings.weatherMode === 'auto'} className={settings.weather === weather && settings.weatherMode === 'manual' ? 'is-active' : ''} onClick={() => setWeather(weather)}>{weatherLabels[weather]}</RippleButton>)}
          </div>
          <div className={settings.weatherMode === 'auto' ? 'controls-disabled' : ''}>
            <Slider label="Cloud cover" value={settings.cloudCover} onChange={(cloudCover) => patch({ cloudCover })} />
            <Slider label="Precipitation" value={settings.precipitation} onChange={(precipitation) => patch({ precipitation })} />
            <Slider label="Wind" value={settings.wind} onChange={(wind) => patch({ wind })} />
            <Slider label="Visibility" value={settings.visibility} onChange={(visibility) => patch({ visibility })} />
            <Slider label="Road wetness" value={settings.wetness} onChange={(wetness) => patch({ wetness })} />
            <Slider label="Snow accumulation" value={settings.snowAccumulation} onChange={(snowAccumulation) => patch({ snowAccumulation })} />
          </div>
        </section>

        <section className="settings-section">
          <div className="settings-section__title"><span>Ambient activity</span></div>
          <Slider label="Aircraft density" value={settings.aircraftDensity} onChange={(aircraftDensity) => patch({ aircraftDensity })} />
          <label className="toggle-row"><span><b>Reduced motion</b><small>Stops high-frequency ambient animation.</small></span><input type="checkbox" checked={settings.reducedMotion} onChange={(event: React.ChangeEvent<HTMLInputElement>) => patch({ reducedMotion: event.target.checked })} /></label>
        </section>

        <section className="settings-section settings-section--danger">
          <div className="settings-section__title"><span>Special event test</span></div>
          <p className="settings-note">Independent from weather. This is the architecture test for the rebuilt destruction sequence.</p>
          <RippleButton className="danger-button" onClick={onNuke}>Trigger event</RippleButton>
        </section>

        <section className="settings-section settings-diagnostics">
          <span>RESOLVED ENVIRONMENT</span>
          <dl>
            <div><dt>Time</dt><dd>{formatMinutes(environment.minuteOfDay)} · {environment.timeOfDay}</dd></div>
            <div><dt>Season</dt><dd>{environment.season}</dd></div>
            <div><dt>Weather</dt><dd>{weatherLabels[environment.weather]}</dd></div>
            <div><dt>Snow</dt><dd>{Math.round(environment.snowAccumulation * 100)}%</dd></div>
          </dl>
        </section>
      </div>
    </aside>
  )
}
