import { useCallback, useEffect, useMemo, useState } from 'react'
import { CloudLayer } from './components/CloudLayer'
import { DestructionSequence, type DestructionPhase } from './components/DestructionSequence'
import { EiffelScene } from './components/EiffelScene'
import { ParisClock } from './components/ParisClock'
import { PrecipitationLayer, useLightning } from './components/PrecipitationLayer'
import { SettingsPanel } from './components/SettingsPanel'
import { TrafficLayer } from './components/TrafficLayer'
import { AuroraText } from './components/ui/AuroraText'
import { RippleButton } from './components/ui/RippleButton'
import { getFrenchGreeting } from './lib/greeting'
import { buildEnvironment } from './lib/scene-environment'
import {
  DEFAULT_SETTINGS,
  effectiveCoverage,
  loadSettings,
  saveSettings,
  type WallpaperSettings,
} from './lib/settings'

const VIEWER_NAME = 'Trevor'

function useAspect() {
  const [aspect, setAspect] = useState(() =>
    typeof window === 'undefined' ? 16 / 9 : window.innerWidth / Math.max(window.innerHeight, 1),
  )
  useEffect(() => {
    function measure() {
      setAspect(window.innerWidth / Math.max(window.innerHeight, 1))
    }
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])
  return aspect
}

function App() {
  const [now, setNow] = useState(() => new Date())
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fullscreenMessage, setFullscreenMessage] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settings, setSettings] = useState<WallpaperSettings>(loadSettings)
  const [destructionRun, setDestructionRun] = useState(0)
  const [destructionPhase, setDestructionPhase] = useState<DestructionPhase>('idle')
  const [blastLight, setBlastLight] = useState(0)

  const aspect = useAspect()

  useEffect(() => {
    const tick = window.setInterval(() => setNow(new Date()), 1_000)
    return () => window.clearInterval(tick)
  }, [])

  useEffect(() => saveSettings(settings), [settings])

  useEffect(() => {
    function handleChange() {
      setIsFullscreen(Boolean(document.fullscreenElement))
      setFullscreenMessage('')
    }
    document.addEventListener('fullscreenchange', handleChange)
    return () => document.removeEventListener('fullscreenchange', handleChange)
  }, [])

  const environment = useMemo(
    () => buildEnvironment(now, settings, aspect),
    [now, settings, aspect],
  )

  const parisHour = Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Paris',
      hour: 'numeric',
      hourCycle: 'h23',
    }).format(environment.date),
  )
  const greeting = getFrenchGreeting(parisHour)
  const coverage = effectiveCoverage(settings.weatherMode, settings.cloudCoverage)
  const lightningKey = useLightning(settings.weatherMode, settings.lightningLevel, settings.ambientMotion)

  const categories = useMemo(
    () => ({
      airliner: settings.showAirliners,
      business: settings.showBusinessJets,
      ga: settings.showGeneralAviation,
      helicopter: settings.showHelicopters,
    }),
    [
      settings.showAirliners,
      settings.showBusinessJets,
      settings.showGeneralAviation,
      settings.showHelicopters,
    ],
  )

  /**
   * Nothing flies during the sequence. Air traffic carrying on serenely through
   * a detonation was the single most obvious tell that the layers were unaware
   * of each other.
   */
  const detonating = destructionPhase !== 'idle' && destructionPhase !== 'warning'
  const trafficEnabled = settings.showAircraft && settings.ambientMotion && !detonating

  // The camera is shaken only once the blast front would have arrived.
  const shaking = destructionPhase === 'shock' || destructionPhase === 'fireball'

  // Snow accumulates on surfaces while it is actively falling.
  const snowfallDepth = settings.weatherMode === 'snow' ? 1 : 0

  const handlePhase = useCallback((phase: DestructionPhase) => setDestructionPhase(phase), [])
  const handleComplete = useCallback(() => setDestructionRun(0), [])
  const handleIllumination = useCallback((value: number) => setBlastLight(value), [])

  async function toggleFullscreen() {
    if (!document.documentElement.requestFullscreen) {
      setFullscreenMessage('Fullscreen is not supported in this browser.')
      return
    }
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await document.documentElement.requestFullscreen()
    } catch {
      setFullscreenMessage('Fullscreen could not be opened. Check your browser permissions.')
    }
  }

  return (
    <main
      className={`wallpaper wallpaper--${environment.band}${
        settings.ambientMotion ? '' : ' wallpaper--still'
      }${detonating ? ' wallpaper--detonating' : ''}`}
    >
      <EiffelScene
        environment={environment}
        aspect={aspect}
        showStars={settings.showStars}
        gradeAmount={settings.gradeAmount}
        snowfallDepth={snowfallDepth}
        shaking={shaking}
        blastLight={blastLight}
        slots={{
          clouds: (
            <CloudLayer
              environment={environment}
              coverage={coverage}
              ambientMotion={settings.ambientMotion}
            />
          ),
          aircraft: (
            <TrafficLayer
              environment={environment}
              enabled={trafficEnabled}
              density={settings.aircraftDensity}
              categories={categories}
              scale={settings.aircraftScale}
              showContrails={settings.showContrails}
              aspect={aspect}
            />
          ),
          precipitation: (
            <PrecipitationLayer
              environment={environment}
              season={environment.season}
              ambientMotion={settings.ambientMotion}
              lightningLevel={settings.lightningLevel}
              lightningKey={lightningKey}
            />
          ),
          destruction: (
            <DestructionSequence
              runId={destructionRun}
              onPhaseChange={handlePhase}
              onIlluminationChange={handleIllumination}
              onComplete={handleComplete}
              ambientMotion={settings.ambientMotion}
            />
          ),
        }}
      />

      <header className="wallpaper__masthead">
        <div>
          <p className="eyebrow">Paris / France</p>
          <p className="edition">Animated study no. 01</p>
        </div>
        <p className="version">v0.5.0</p>
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
        environment={environment}
        onChange={setSettings}
        onClose={() => setSettingsOpen(false)}
        onReset={() => setSettings(DEFAULT_SETTINGS)}
        onStartDestruction={() => setDestructionRun((run) => run + 1)}
        onResetDestruction={() => {
          setDestructionRun(0)
          setDestructionPhase('idle')
          setBlastLight(0)
        }}
        destructionActive={destructionPhase !== 'idle'}
      />
    </main>
  )
}

export default App
