import type { TimeOfDay } from '../lib/time'

type EiffelSceneProps = {
  timeOfDay: TimeOfDay
  ambientMotion: boolean
}

const stars = Array.from({ length: 36 }, (_, index) => ({
  id: index,
  left: `${(index * 37 + 11) % 97}%`,
  top: `${(index * 19 + 5) % 59}%`,
  delay: `${(index % 9) * -0.57}s`,
  size: `${1 + (index % 3) * 0.55}px`,
}))

export function EiffelScene({ timeOfDay, ambientMotion }: EiffelSceneProps) {
  return (
    <div
      className={`scene scene--${timeOfDay}${ambientMotion ? '' : ' scene--still'}`}
      aria-hidden="true"
    >
      <div className="scene__artwork scene__artwork--day" />
      <div className="scene__artwork scene__artwork--night" />
      <div className="scene__time-tint" />
      <div className="scene__stars">
        {stars.map((star) => (
          <i
            className="scene__star"
            key={star.id}
            style={{
              animationDelay: star.delay,
              height: star.size,
              left: star.left,
              top: star.top,
              width: star.size,
            }}
          />
        ))}
      </div>
      <div className="scene__haze scene__haze--one" />
      <div className="scene__haze scene__haze--two" />
      <div className="scene__grain" />
    </div>
  )
}
