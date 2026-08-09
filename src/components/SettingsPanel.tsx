import { useEffect, useState } from 'react'
import type {
  SceneTimeMode,
  SeasonMode,
  WallpaperSettings,
  WeatherMode,
} from '../lib/settings'
import { RippleButton } from './ui/RippleButton'

type SettingsPanelProps = {
  isOpen: boolean
  settings: WallpaperSettings
  onChange: (settings: WallpaperSettings) => void
  onClose: () => void
  onReset: () => void
}

const TIME_MODES: Array<{ value: SceneTimeMode; label: string; detail: string }> = [
  { value: 'paris', label: 'Paris', detail: 'Live French time' },
  { value: 'local', label: 'Local', detail: 'Your current time' },
  { value: 'custom', label: 'Set time', detail: 'Freeze the lighting' },
]

const WEATHER_MODES: Array<{ value: WeatherMode; label: string }> = [
  { value: 'clear', label: 'Clear' },
  { value: 'rain', label: 'Rain' },
  { value: 'storm', label: 'Storm' },
  { value: 'snow', label: 'Snow' },
]

const SEASON_MODES: Array<{ value: SeasonMode; label: string }> = [
  { value: 'auto', label: 'Auto' },
  { value: 'spring', label: 'Spring' },
  { value: 'summer', label: 'Summer' },
  { value: 'autumn', label: 'Autumn' },
  { value: 'winter', label: 'Winter' },
]

export function SettingsPanel({
  isOpen,
  settings,
  onChange,
  onClose,
  onReset,
}: SettingsPanelProps) {
  const [draftTime, setDraftTime] = useState(settings.customTime)

  useEffect(() => {
    if (isOpen) setDraftTime(settings.customTime)
  }, [isOpen, settings.customTime])

  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  function patchSettings(patch: Partial<WallpaperSettings>) {
    onChange({ ...settings, ...patch })
  }

  function applyCustomTime() {
    patchSettings({ customTime: draftTime, timeMode: 'custom' })
  }

  return (
    <>
      <button
        className={`settings-backdrop${isOpen ? ' settings-backdrop--visible' : ''}`}
        aria-label="Close settings"
        onClick={onClose}
        tabIndex={isOpen ? 0 : -1}
      />
      <aside
        className={`settings-panel${isOpen ? ' settings-panel--open' : ''}`}
        aria-hidden={!isOpen}
        aria-labelledby="settings-title"
        aria-modal="true"
        inert={!isOpen}
        role="dialog"
      >
        <div className="settings-panel__topline">
          <div>
            <p className="settings-panel__coordinates">48°51′N · 2°21′E</p>
            <p className="settings-panel__kicker">Paris wallpaper control</p>
          </div>
          <RippleButton className="settings-panel__close" onClick={onClose} aria-label="Close settings">
            ×
          </RippleButton>
        </div>

        <h2 id="settings-title">Réglages</h2>

        <div className="settings-panel__scroll">
          <section className="settings-group">
            <div className="settings-group__heading">
              <span>01</span>
              <div>
                <h3>Wallpaper lighting</h3>
                <p>Choose which clock controls the Paris atmosphere.</p>
              </div>
            </div>
            <div className="time-mode-grid" role="radiogroup" aria-label="Wallpaper time source">
              {TIME_MODES.map((mode) => (
                <label className="time-mode" key={mode.value}>
                  <input
                    type="radio"
                    name="time-mode"
                    value={mode.value}
                    checked={settings.timeMode === mode.value}
                    onChange={() => patchSettings({ timeMode: mode.value })}
                  />
                  <span className="time-mode__copy">
                    <strong>{mode.label}</strong>
                    <small>{mode.detail}</small>
                  </span>
                </label>
              ))}
            </div>

            <div className={`custom-time${settings.timeMode === 'custom' ? ' custom-time--active' : ''}`}>
              <label htmlFor="custom-scene-time">Custom scene time</label>
              <div className="custom-time__controls">
                <input
                  id="custom-scene-time"
                  type="time"
                  value={draftTime}
                  onChange={(event) => setDraftTime(event.target.value)}
                />
                <RippleButton className="settings-action" onClick={applyCustomTime}>
                  Set time
                </RippleButton>
              </div>
            </div>
          </section>

          <section className="settings-group">
            <div className="settings-group__heading">
              <span>02</span>
              <div>
                <h3>Wallpaper display</h3>
                <p>Keep only the information you want on screen.</p>
              </div>
            </div>
            <SettingSwitch
              label="Paris time"
              detail="Show the current time in France"
              checked={settings.showParisTime}
              onChange={(checked) => patchSettings({ showParisTime: checked })}
            />
            <SettingSwitch
              label="Your local time"
              detail="Show the time where you are"
              checked={settings.showLocalTime}
              onChange={(checked) => patchSettings({ showLocalTime: checked })}
            />
            <SettingSwitch
              label="Date"
              detail="Show the current date in Paris"
              checked={settings.showDate}
              onChange={(checked) => patchSettings({ showDate: checked })}
            />
            <SettingSwitch
              label="Greeting"
              detail="Show Bonjour, Bonsoir, or Bonne Nuit"
              checked={settings.showGreeting}
              onChange={(checked) => patchSettings({ showGreeting: checked })}
            />
          </section>

          <section className="settings-group">
            <div className="settings-group__heading">
              <span>03</span>
              <div>
                <h3>Atmosphere</h3>
                <p>Preview weather and seasonal art without a weather API.</p>
              </div>
            </div>
            <p className="settings-field-label">Weather</p>
            <div className="atmosphere-option-grid atmosphere-option-grid--weather" role="radiogroup" aria-label="Weather effect">
              {WEATHER_MODES.map((mode) => (
                <label className="atmosphere-option" key={mode.value}>
                  <input
                    type="radio"
                    name="weather-mode"
                    value={mode.value}
                    checked={settings.weatherMode === mode.value}
                    onChange={() => patchSettings({ weatherMode: mode.value })}
                  />
                  <span>{mode.label}</span>
                </label>
              ))}
            </div>

            <p className="settings-field-label">Season</p>
            <div className="atmosphere-option-grid atmosphere-option-grid--season" role="radiogroup" aria-label="Season">
              {SEASON_MODES.map((mode) => (
                <label className="atmosphere-option" key={mode.value}>
                  <input
                    type="radio"
                    name="season-mode"
                    value={mode.value}
                    checked={settings.seasonMode === mode.value}
                    onChange={() => patchSettings({ seasonMode: mode.value })}
                  />
                  <span>{mode.label}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="settings-group">
            <div className="settings-group__heading">
              <span>04</span>
              <div>
                <h3>Experience</h3>
                <p>Fine-tune information and ambient animation.</p>
              </div>
            </div>
            <SettingSwitch
              label="24-hour clock"
              detail="Use 20:31 instead of 8:31 PM"
              checked={settings.use24Hour}
              onChange={(checked) => patchSettings({ use24Hour: checked })}
            />
            <SettingSwitch
              label="Ambient motion"
              detail="Cloud drift, weather, particles, and aurora text"
              checked={settings.ambientMotion}
              onChange={(checked) => patchSettings({ ambientMotion: checked })}
            />
            <SettingSwitch
              label="Aircraft flybys"
              detail="A distant aircraft crosses the sky every few minutes"
              checked={settings.showAircraft}
              onChange={(checked) => patchSettings({ showAircraft: checked })}
            />
          </section>
        </div>

        <div className="settings-panel__footer">
          <RippleButton className="settings-reset" onClick={onReset}>
            Reset defaults
          </RippleButton>
          <span>Saved automatically</span>
        </div>
      </aside>
    </>
  )
}

type SettingSwitchProps = {
  label: string
  detail: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function SettingSwitch({ label, detail, checked, onChange }: SettingSwitchProps) {
  return (
    <label className="setting-switch">
      <span>
        <strong>{label}</strong>
        <small>{detail}</small>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <i aria-hidden="true" />
    </label>
  )
}
