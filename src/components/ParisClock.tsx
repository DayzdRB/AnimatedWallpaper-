import { formatLocalTime, formatParisTime } from '../lib/time'

type ParisClockProps = {
  now: Date
}

export function ParisClock({ now }: ParisClockProps) {
  return (
    <section className="clock-panel" aria-label="Current time">
      <div className="clock-panel__item">
        <span className="clock-panel__city">Paris</span>
        <time className="clock-panel__time" dateTime={now.toISOString()}>
          {formatParisTime(now)}
        </time>
      </div>
      <span className="clock-panel__rule" aria-hidden="true" />
      <div className="clock-panel__item">
        <span className="clock-panel__city">Local</span>
        <time className="clock-panel__time" dateTime={now.toISOString()}>
          {formatLocalTime(now)}
        </time>
      </div>
    </section>
  )
}

