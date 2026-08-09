import { useEffect, useState } from 'react'

type Phase = 'idle' | 'warning' | 'blast' | 'aftermath' | 'rebuild'

type DestructionSequenceProps = {
  runId: number
  onPhaseChange: (phase: Phase) => void
  onComplete: () => void
}

export function DestructionSequence({ runId, onPhaseChange, onComplete }: DestructionSequenceProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    if (!runId) { setPhase('idle'); onPhaseChange('idle'); return }
    const timers: number[] = []
    function enter(next: Phase) { setPhase(next); onPhaseChange(next) }
    enter('warning')
    setCountdown(3)
    timers.push(window.setTimeout(() => setCountdown(2), 1_000))
    timers.push(window.setTimeout(() => setCountdown(1), 2_000))
    timers.push(window.setTimeout(() => enter('blast'), 3_000))
    timers.push(window.setTimeout(() => enter('aftermath'), 10_500))
    timers.push(window.setTimeout(() => enter('rebuild'), 26_000))
    timers.push(window.setTimeout(() => { enter('idle'); onComplete() }, 43_000))
    return () => timers.forEach(window.clearTimeout)
  }, [runId, onComplete, onPhaseChange])

  if (phase === 'idle') return null
  return (
    <div className={`destruction destruction--${phase}`} aria-live="assertive">
      {phase === 'warning' && (
        <div className="destruction__warning">
          <span>Fictional cinematic sequence armed</span>
          <strong>{countdown}</strong>
          <small>Paris restoration protocol standing by</small>
        </div>
      )}
      <div className="destruction__scene">
        <picture>
          <source media="(max-width: 760px)" srcSet="/assets/paris-aftermath-mobile.png" />
          <img className="destruction__aftermath" src="/assets/paris-aftermath.png" alt="" />
        </picture>
        <img className="destruction__fireball" src="/assets/destruction-fireball.png" alt="" />
        <img className="destruction__mushroom" src="/assets/destruction-mushroom.png" alt="" />
        <div className="destruction__shockwave" />
        <div className="destruction__camera-flash" />
        <div className="destruction__ash" />
      </div>
      {phase === 'rebuild' && <p className="destruction__rebuild-label">Reconstruction in progress</p>}
    </div>
  )
}
