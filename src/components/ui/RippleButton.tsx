import {
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type MouseEvent,
} from 'react'

type Ripple = {
  id: number
  size: number
  x: number
  y: number
}

type RippleButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  rippleColor?: string
  duration?: number
}

export function RippleButton({
  children,
  className = '',
  rippleColor = 'rgba(255, 255, 255, 0.42)',
  duration = 650,
  onClick,
  ...buttonProps
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([])
  const timeouts = useRef<number[]>([])
  const nextId = useRef(0)

  useEffect(
    () => () => timeouts.current.forEach((timeout) => window.clearTimeout(timeout)),
    [],
  )

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    const button = event.currentTarget
    const rect = button.getBoundingClientRect()
    const size = Math.hypot(rect.width, rect.height) * 1.25
    const clickX = event.detail === 0 ? rect.width / 2 : event.clientX - rect.left
    const clickY = event.detail === 0 ? rect.height / 2 : event.clientY - rect.top
    const id = nextId.current++

    setRipples((current) => [
      ...current,
      { id, size, x: clickX - size / 2, y: clickY - size / 2 },
    ])

    const timeout = window.setTimeout(() => {
      setRipples((current) => current.filter((ripple) => ripple.id !== id))
    }, duration)
    timeouts.current.push(timeout)

    onClick?.(event)
  }

  return (
    <button
      {...buttonProps}
      className={`ripple-button ${className}`.trim()}
      onClick={handleClick}
      style={{
        ...buttonProps.style,
        '--ripple-color': rippleColor,
        '--ripple-duration': `${duration}ms`,
      } as React.CSSProperties}
    >
      <span className="ripple-button__label">{children}</span>
      <span className="ripple-button__canvas" aria-hidden="true">
        {ripples.map((ripple) => (
          <span
            className="ripple-button__wave"
            key={ripple.id}
            style={{
              height: ripple.size,
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
            }}
          />
        ))}
      </span>
    </button>
  )
}

