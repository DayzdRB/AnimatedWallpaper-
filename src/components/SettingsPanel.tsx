import type { ReactNode } from 'react'
import type { SceneEnvironment } from '../lib/scene-environment'
import type {
  AircraftDensity,
  CloudCoverage,
  LightningLevel,
  SceneTimeMode,
  SeasonMode,
  SunTracking,
  WallpaperSettings,
  WeatherMode,
} from '../lib/settings'
import { RippleButton } from './ui/RippleButton'

type Props = {
  isOpen: boolean
  settings: WallpaperSettings
  environment: SceneEnvironment
  onChange: (settings: WallpaperSettings) => void
  onClose: () => void
  onReset: () => void
  onStartDestruction: () => void
  onResetDestruction: () => void
  destructionActive: boolean
}

function Group({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="settings-group">
      <h3>{title}</h3>
      {note && <p className="settings-group__note">{note}</p>}
      {children}
    </section>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="settings-toggle">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  )
}

function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: Array<[T, string]>
  onChange: (value: T) => void
}) {
  return (
    <label className="settings-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value as T)}>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  format?: (value: number) => string
  onChange: (value: number) => void
}) {
  return (
    <label className="settings-field settings-field--slider">
      <span>
        {label}
        <em>{format ? format(value) : value.toFixed(2)}</em>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  )
}

export function SettingsPanel({
  isOpen,
  settings,
  environment,
  onChange,
  onClose,
  onReset,
  onStartDestruction,
  onResetDestruction,
  destructionActive,
}: Props) {
  if (!isOpen) return null

  const update = <K extends keyof WallpaperSettings>(key: K, value: WallpaperSettings[K]) =>
    onChange({ ...settings, [key]: value })

  return (
    <div className="settings" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div className="settings__panel">
        <header className="settings__header">
          <h2 id="settings-title">Wallpaper settings</h2>
          <button className="settings__close" type="button" onClick={onClose} aria-label="Close settings">
            ✕
          </button>
        </header>

        {/* A readout of what the physics is currently doing, which makes the
            whole scene debuggable without opening a console. */}
        <div className="settings__readout">
          <span>
            Sun <strong>{environment.sun.apparentAltitude.toFixed(1)}°</strong> alt
          </span>
          <span>
            <strong>{environment.sun.azimuth.toFixed(0)}°</strong> az
          </span>
          <span>{environment.band}</span>
          <span>
            Moon <strong>{Math.round(environment.moon.illumination * 100)}%</strong>
          </span>
          <span>{environment.season}</span>
        </div>

        <div className="settings__body">
          <Group title="Time">
            <Choice<SceneTimeMode>
              label="Clock source"
              value={settings.timeMode}
              options={[
                ['paris', 'Paris time'],
                ['local', 'Your local time'],
                ['custom', 'Custom time'],
              ]}
              onChange={(value) => update('timeMode', value)}
            />
            {settings.timeMode === 'custom' && (
              <label className="settings-field">
                <span>Paris wall clock</span>
                <input
                  type="time"
                  value={settings.customTime}
                  onChange={(event) => update('customTime', event.target.value)}
                />
              </label>
            )}
            <Toggle
              label="Ambient motion"
              checked={settings.ambientMotion}
              onChange={(value) => update('ambientMotion', value)}
            />
          </Group>

          <Group
            title="Sky and light"
            note="Sun position is computed from the real ephemeris for Paris. In a 33 degree frame that puts it out of shot for most of the day, so framed mode remaps the arc to keep it visible."
          >
            <Choice<SunTracking>
              label="Sun tracking"
              value={settings.sunTracking}
              options={[
                ['framed', 'Framed, always in shot'],
                ['realistic', 'Realistic, true azimuth'],
              ]}
              onChange={(value) => update('sunTracking', value)}
            />
            <Slider
              label="Light pollution"
              value={settings.lightPollution}
              min={0}
              max={1}
              step={0.05}
              format={(value) => (value > 0.7 ? 'city centre' : value > 0.35 ? 'suburban' : 'dark sky')}
              onChange={(value) => update('lightPollution', value)}
            />
            <Slider
              label="Relight strength"
              value={settings.gradeAmount}
              min={0}
              max={1.4}
              step={0.05}
              format={(value) => `${Math.round(value * 100)}%`}
              onChange={(value) => update('gradeAmount', value)}
            />
            <Toggle
              label="Stars"
              checked={settings.showStars}
              onChange={(value) => update('showStars', value)}
            />
          </Group>

          <Group title="Weather and season">
            <Choice<WeatherMode>
              label="Weather"
              value={settings.weatherMode}
              options={[
                ['clear', 'Clear'],
                ['fair', 'Fair weather cumulus'],
                ['overcast', 'Overcast'],
                ['rain', 'Rain'],
                ['storm', 'Thunderstorm'],
                ['snow', 'Snow'],
              ]}
              onChange={(value) => update('weatherMode', value)}
            />
            <Choice<CloudCoverage>
              label="Coverage"
              value={settings.cloudCoverage}
              options={[
                ['clear', 'Sky clear'],
                ['few', 'Few, 1 to 2 oktas'],
                ['scattered', 'Scattered, 3 to 4'],
                ['broken', 'Broken, 5 to 7'],
                ['overcast', 'Overcast, 8'],
              ]}
              onChange={(value) => update('cloudCoverage', value)}
            />
            <Choice<LightningLevel>
              label="Lightning"
              value={settings.lightningLevel}
              options={[
                ['off', 'Off'],
                ['low', 'Occasional'],
                ['medium', 'Moderate'],
                ['high', 'Frequent'],
                ['severe', 'Severe'],
              ]}
              onChange={(value) => update('lightningLevel', value)}
            />
            <Choice<SeasonMode>
              label="Season"
              value={settings.seasonMode}
              options={[
                ['auto', 'Follow the date'],
                ['spring', 'Spring'],
                ['summer', 'Summer'],
                ['autumn', 'Autumn'],
                ['winter', 'Winter'],
              ]}
              onChange={(value) => update('seasonMode', value)}
            />
          </Group>

          <Group
            title="Air traffic"
            note="Aircraft are sized from real dimensions and real distances, which makes them small. Scale above 100 per cent is a deliberate cheat."
          >
            <Toggle
              label="Show aircraft"
              checked={settings.showAircraft}
              onChange={(value) => update('showAircraft', value)}
            />
            <Choice<AircraftDensity>
              label="Traffic density"
              value={settings.aircraftDensity}
              options={[
                ['quiet', 'Quiet'],
                ['low', 'Light'],
                ['medium', 'Moderate'],
                ['high', 'Busy'],
              ]}
              onChange={(value) => update('aircraftDensity', value)}
            />
            <Slider
              label="Size cheat"
              value={settings.aircraftScale}
              min={1}
              max={4}
              step={0.1}
              format={(value) => (value === 1 ? 'true scale' : `${value.toFixed(1)}x`)}
              onChange={(value) => update('aircraftScale', value)}
            />
            <Toggle
              label="Contrails"
              checked={settings.showContrails}
              onChange={(value) => update('showContrails', value)}
            />
            <Toggle
              label="Airliners"
              checked={settings.showAirliners}
              onChange={(value) => update('showAirliners', value)}
            />
            <Toggle
              label="Business jets"
              checked={settings.showBusinessJets}
              onChange={(value) => update('showBusinessJets', value)}
            />
            <Toggle
              label="General aviation"
              checked={settings.showGeneralAviation}
              onChange={(value) => update('showGeneralAviation', value)}
            />
            <Toggle
              label="Helicopters"
              checked={settings.showHelicopters}
              onChange={(value) => update('showHelicopters', value)}
            />
          </Group>

          <Group title="Overlay">
            <Toggle
              label="Greeting"
              checked={settings.showGreeting}
              onChange={(value) => update('showGreeting', value)}
            />
            <Toggle
              label="Paris time"
              checked={settings.showParisTime}
              onChange={(value) => update('showParisTime', value)}
            />
            <Toggle
              label="Local time"
              checked={settings.showLocalTime}
              onChange={(value) => update('showLocalTime', value)}
            />
            <Toggle
              label="Date"
              checked={settings.showDate}
              onChange={(value) => update('showDate', value)}
            />
            <Toggle
              label="24 hour clock"
              checked={settings.use24Hour}
              onChange={(value) => update('use24Hour', value)}
            />
          </Group>

          <Group
            title="Cinematic sequence"
            note="Fictional. Aircraft are grounded for the duration and the city is relit by the blast."
          >
            <div className="settings__actions">
              <RippleButton
                className="control-button"
                onClick={onStartDestruction}
                disabled={destructionActive}
              >
                Run sequence
              </RippleButton>
              <RippleButton className="control-button" onClick={onResetDestruction}>
                Reset
              </RippleButton>
            </div>
          </Group>
        </div>

        <footer className="settings__footer">
          <RippleButton className="control-button" onClick={onReset}>
            Restore defaults
          </RippleButton>
        </footer>
      </div>
      <button className="settings__scrim" type="button" onClick={onClose} aria-label="Close settings" />
    </div>
  )
}
