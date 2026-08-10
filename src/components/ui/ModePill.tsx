import { RippleButton } from './RippleButton'

export function ModePill({ auto, onToggle }: { auto: boolean; onToggle: () => void }) {
  return (
    <RippleButton className={`mode-pill ${auto ? 'mode-pill--auto' : ''}`} onClick={onToggle}>
      {auto ? 'AUTO' : 'MANUAL'}
    </RippleButton>
  )
}
