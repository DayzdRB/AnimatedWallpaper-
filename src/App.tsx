import { useEffect, useMemo, useState } from 'react'
import { EiffelScene } from './components/EiffelScene'
import { AircraftFlyby } from './components/AircraftFlyby'
import { AtmosphereEffects } from './components/AtmosphereEffects'
import { ParisClock } from './components/ParisClock'
import { SettingsPanel } from './components/SettingsPanel'
import { AuroraText } from './components/ui/AuroraText'
import { RippleButton } from './components/ui/RippleButton'
import { getFrenchGreeting } from './lib/greeting'
import {
  DEFAULT_SETTINGS,
  getSceneTime,
  loadSettings,
  resolveSeason,
  saveSettings,
  type WallpaperSettings,
} from './lib/settings'
import { getParisTimeParts, getTimeOfDay } from './lib/time'
import { isSceneNight } from './lib/lighting'

const VIEWER_NAME = 'Trevor'

function App() {
  const [now, setNow] = useState(() => new Date())
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement))
  const [fullscreenMessage, setFullscreenMessage] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settings, setSettings] = useState<WallpaperSettings>(loadSettings)

  useEffect(() => {
    const tick = window.setInterval(() => setNow(new Date()), 1_000)
    return () => window.clearInterval(tick)
  }, [])

  useEffect(() => saveSettings(settings), [settings])

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement))
      setFullscreenMessage('')
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const parisTime = useMemo(() => getParisTimeParts(now), [now])
  const sceneTime = getSceneTime(now, settings, parisTime)
  const sceneHour = Math.floor(sceneTime)
  const timeOfDay = getTimeOfDay(sceneHour)
  const greeting = getFrenchGreeting(sceneHour)
  const season = resolveSeason(now, settings.seasonMode)
  const fullscreenSupported = Boolean(document.documentElement.requestFullscreen)

  async function toggleFullscreen() {
    if (!fullscreenSupported) {
      setFullscreenMessage('Fullscreen is not supported in this browser.')
      return
    }

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await document.documentElement.requestFullscreen()
      }
    } catch {
      setFullscreenMessage('Fullscreen could not be opened. Check your browser permissions.')
    }
  }

  return (
    <main
      className={`wallpaper wallpaper--${timeOfDay} wallpaper--season-${season}${settings.ambientMotion ? '' : ' wallpaper--still'}`}
    >
      <EiffelScene
        timeOfDay={timeOfDay}
        ambientMotion={settings.ambientMotion}
        sceneTime={sceneTime}
        season={season}
        weather={settings.weatherMode}
      />
      <AtmosphereEffects
        weather={settings.weatherMode}
        season={season}
        ambientMotion={settings.ambientMotion}
      />
      <AircraftFlyby
        enabled={settings.showAircraft && settings.ambientMotion}
        isNight={isSceneNight(sceneTime)}
      />

      <header className="wallpaper__masthead">
        <div>
          <p className="eyebrow">Paris / France</p>
          <p className="edition">Animated study no. 01</p>
        </div>
        <p className="version">v0.3.0</p>
      </header>

      {settings.showGreeting && (
        <section className="wallpaper__greeting" aria-label={`${greeting}, ${VIEWER_NAME}`}>
          <p className="greeting__salutation">{greeting},</p>
          <h1 className="greeting__name">
            <AuroraText colors={['#f6e7df', '#ddcce2', '#bdd2e4']} speed={14}>
              {VIEWER_NAME}
            </AuroraText>
          </h1>
          <p className="greeting__caption">La ville lumière · 48°51′N / 2°21′E</p>
        </section>
      )}

      <div className="wallpaper__footer">
        <ParisClock
          now={now}
          showParisTime={settings.showParisTime}
          showLocalTime={settings.showLocalTime}
          showDate={settings.showDate}
          use24Hour={settings.use24Hour}
        />

        <div className="wallpaper-controls">
          <RippleButton
            className="control-button settings-launcher"
            onClick={() => setSettingsOpen(true)}
            aria-expanded={settingsOpen}
            aria-controls="settings-title"
          >
            <span className="control-button__icon" aria-hidden="true">◇</span>
            Settings
          </RippleButton>
          <RippleButton
            className="control-button fullscreen-button"
            onClick={toggleFullscreen}
            aria-pressed={isFullscreen}
          >
            <span className="fullscreen-button__icon" aria-hidden="true">
              {isFullscreen ? '↙' : '↗'}
            </span>
            {isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          </RippleButton>
          <p className="wallpaper-controls__status" aria-live="polite">
            {fullscreenMessage}
          </p>
        </div>
      </div>

      <SettingsPanel
        isOpen={settingsOpen}
        settings={settings}
        onChange={setSettings}
        onClose={() => setSettingsOpen(false)}
        onReset={() => setSettings(DEFAULT_SETTINGS)}
      />
    </main>
  )
}

export default App
