import { formatLocalTime, formatParisDate, formatParisTime } from '../lib/time'

type ParisClockProps = {
  now: Date
  showParisTime: boolean
  showLocalTime: boolean
  showDate: boolean
  use24Hour: boolean
}

export function ParisClock({
  now,
  showParisTime,
  showLocalTime,
  showDate,
  use24Hour,
}: ParisClockProps) {
  if (!showParisTime && !showLocalTime && !showDate) return null

  return (
    <section className="clock-panel" aria-label="Current time">
      {showParisTime && (
        <div className="clock-panel__item">
          <span className="clock-panel__city">Paris</span>
          <time className="clock-panel__time" dateTime={now.toISOString()}>
            {formatParisTime(now, use24Hour)}
          </time>
        </div>
      )}
      {showParisTime && showLocalTime && <span className="clock-panel__rule" aria-hidden="true" />}
      {showLocalTime && (
        <div className="clock-panel__item">
          <span className="clock-panel__city">Local</span>
          <time className="clock-panel__time" dateTime={now.toISOString()}>
            {formatLocalTime(now, use24Hour)}
          </time>
        </div>
      )}
      {showDate && (showParisTime || showLocalTime) && (
        <span className="clock-panel__rule clock-panel__rule--date" aria-hidden="true" />
      )}
      {showDate && (
        <div className="clock-panel__item clock-panel__item--date">
          <span className="clock-panel__city">Date à Paris</span>
          <time className="clock-panel__date" dateTime={now.toISOString()}>
            {formatParisDate(now)}
          </time>
        </div>
      )}
    </section>
  )
}
