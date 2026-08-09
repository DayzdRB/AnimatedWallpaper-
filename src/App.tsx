import { useEffect, useMemo, useState } from 'react'
import { EiffelScene } from './components/EiffelScene'
import { ParisClock } from './components/ParisClock'
import { SettingsPanel } from './components/SettingsPanel'
import { AuroraText } from './components/ui/AuroraText'
import { RippleButton } from './components/ui/RippleButton'
import { getFrenchGreeting } from './lib/greeting'
import {
  DEFAULT_SETTINGS,
  getSceneHour,
  loadSettings,
  saveSettings,
  type WallpaperSettings,
} from './lib/settings'
import { getParisHour, getTimeOfDay } from './lib/time'

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

  const parisHour = useMemo(() => getParisHour(now), [now])
  const sceneHour = getSceneHour(now, settings, parisHour)
  const timeOfDay = getTimeOfDay(sceneHour)
  const greeting = getFrenchGreeting(parisHour)
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
    <main className={`wallpaper wallpaper--${timeOfDay}${settings.ambientMotion ? '' : ' wallpaper--still'}`}>
      <EiffelScene timeOfDay={timeOfDay} ambientMotion={settings.ambientMotion} />

      <header className="wallpaper__masthead">
        <div>
          <p className="eyebrow">Paris / France</p>
          <p className="edition">Animated study no. 01</p>
        </div>
        <div className="masthead-actions">
          <p className="version">v0.1.0</p>
          <RippleButton
            className="settings-launcher"
            onClick={() => setSettingsOpen(true)}
            aria-expanded={settingsOpen}
            aria-controls="settings-title"
          >
            <span aria-hidden="true">◇</span>
            Settings
          </RippleButton>
        </div>
      </header>

      {settings.showGreeting && (
        <section className="wallpaper__greeting" aria-label={`${greeting}, ${VIEWER_NAME}`}>
          <p className="greeting__salutation">{greeting},</p>
          <h1 className="greeting__name">
            <AuroraText speed={9}>{VIEWER_NAME}</AuroraText>
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

        <div className="fullscreen-control">
          <RippleButton
            className="fullscreen-button"
            onClick={toggleFullscreen}
            aria-pressed={isFullscreen}
          >
            <span className="fullscreen-button__icon" aria-hidden="true">
              {isFullscreen ? '↙' : '↗'}
            </span>
            {isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          </RippleButton>
          <p className="fullscreen-control__status" aria-live="polite">
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
