import { AuroraText } from '../ui/AuroraText'
import { RippleButton } from '../ui/RippleButton'
import { formatMinutes, getParisParts, greetingForMinutes } from '../../scene/environment'

export function WallpaperUI({
  now,
  minuteOfDay,
  onSettings,
  onFullscreen,
}: {
  now: Date
  minuteOfDay: number
  onSettings: () => void
  onFullscreen: () => void
}) {
  const paris = getParisParts(now)
  const parisDate = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now)
  const localTime = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(now)

  return (
    <div className="wallpaper-ui">
      <header className="study-mark">
        <strong>PARIS / FRANCE</strong>
        <span>ANIMATED STUDY NO. 01</span>
      </header>

      <main className="hero-copy">
        <span className="hero-greeting">{greetingForMinutes(minuteOfDay).replace(' Trevor', ',')}</span>
        <AuroraText className="hero-name" speed={0.82}>Trevor</AuroraText>
        <span className="hero-coordinate">LA VILLE LUMIÈRE · 48°51'N / 2°21'E</span>
      </main>

      <footer className="wallpaper-footer">
        <div className="clock-block">
          <div><span>Paris</span><b>{formatMinutes(minuteOfDay)}</b></div>
          <div><span>Local</span><b>{localTime}</b></div>
          <p>Date à Paris <strong>{parisDate}</strong></p>
          <i aria-hidden="true">{String(paris.hour).padStart(2,'0')}:{String(paris.minute).padStart(2,'0')}</i>
        </div>
        <div className="wallpaper-actions">
          <RippleButton className="glass-button" onClick={onSettings}><span className="button-glyph">⌘</span> Settings</RippleButton>
          <RippleButton className="glass-button" onClick={onFullscreen}><span className="button-glyph">↗</span> Enter fullscreen</RippleButton>
        </div>
      </footer>

      <span className="version-mark">v0.7.0</span>
    </div>
  )
}
