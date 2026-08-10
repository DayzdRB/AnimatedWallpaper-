import { useMemo, useState } from 'react'
import { WallpaperUI } from './components/wallpaper/WallpaperUI'
import { SettingsPanel } from './components/settings/SettingsPanel'
import { useParisClock } from './hooks/useParisClock'
import { resolveEnvironment, weatherPreset } from './scene/environment'
import { calculateLighting } from './scene/lightingEngine'
import { SceneRenderer } from './scene/SceneRenderer'
import { DemoWeatherProvider } from './scene/weather/demoWeatherProvider'
import type { SceneSettings } from './types/scene'

const partlyCloudy = weatherPreset('partlyCloudy')
const initialSettings: SceneSettings = {
  timeMode: 'auto',
  manualMinutes: 12 * 60,
  seasonMode: 'auto',
  season: 'summer',
  weatherMode: 'auto',
  weather: 'partlyCloudy',
  ...partlyCloudy,
  aircraftDensity: 0.46,
  reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
}

const weatherProvider = new DemoWeatherProvider()

export default function App() {
  const now = useParisClock()
  const [settings, setSettings] = useState<SceneSettings>(initialSettings)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [specialEventId, setSpecialEventId] = useState(0)
  const autoWeather = useMemo(() => weatherProvider.getSnapshot(now), [Math.floor(now.getTime() / 300000)])
  const environment = resolveEnvironment(now, settings, autoWeather)
  const lighting = calculateLighting(environment)

  async function enterFullscreen() {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen()
      else await document.exitFullscreen()
    } catch {
      // Browsers may deny fullscreen when embedded. The UI remains functional.
    }
  }

  return (
    <div className="wallpaper-app">
      <SceneRenderer
        environment={environment}
        lighting={lighting}
        aircraftDensity={settings.aircraftDensity}
        reducedMotion={settings.reducedMotion}
        specialEventId={specialEventId}
      />
      <WallpaperUI now={now} minuteOfDay={environment.minuteOfDay} onSettings={() => setSettingsOpen(true)} onFullscreen={enterFullscreen} />
      <div className={`settings-scrim ${settingsOpen ? 'settings-scrim--open' : ''}`} onClick={() => setSettingsOpen(false)} />
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        setSettings={setSettings}
        environment={environment}
        onNuke={() => setSpecialEventId((value) => value + 1)}
      />
    </div>
  )
}
