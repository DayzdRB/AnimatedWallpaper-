import React, { forwardRef, useEffect, useState, type MouseEvent } from 'react'
import { cn } from '../../lib/cn'

interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  rippleColor?: string
  duration?: string
}

type Ripple = { x: number; y: number; size: number; key: number }

export const RippleButton = forwardRef<HTMLButtonElement, RippleButtonProps>(
  ({ className, children, rippleColor = '#ffffff', duration = '600ms', onClick, ...props }, ref) => {
    const [buttonRipples, setButtonRipples] = useState<Ripple[]>([])

    const createRipple = (event: MouseEvent<HTMLButtonElement>) => {
      const button = event.currentTarget
      const rect = button.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height)
      const x = (event.detail === 0 ? rect.width / 2 : event.clientX - rect.left) - size / 2
      const y = (event.detail === 0 ? rect.height / 2 : event.clientY - rect.top) - size / 2
      setButtonRipples((current) => [...current, { x, y, size, key: Date.now() + Math.random() }])
    }

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
      createRipple(event)
      onClick?.(event)
    }

    useEffect(() => {
      if (!buttonRipples.length) return
      const last = buttonRipples[buttonRipples.length - 1]
      const timeout = window.setTimeout(() => {
        setButtonRipples((current) => current.filter((ripple) => ripple.key !== last.key))
      }, Number.parseInt(duration, 10) || 600)
      return () => window.clearTimeout(timeout)
    }, [buttonRipples, duration])

    return (
      <button ref={ref} className={cn('ripple-button', className)} onClick={handleClick} {...props}>
        <span className="ripple-button__label">{children}</span>
        {buttonRipples.map((ripple) => (
          <span
            aria-hidden="true"
            className="ripple-button__wave"
            key={ripple.key}
            style={{
              width: ripple.size,
              height: ripple.size,
              top: ripple.y,
              left: ripple.x,
              backgroundColor: rippleColor,
              ['--duration' as string]: duration,
            }}
          />
        ))}
      </button>
    )
  },
)
RippleButton.displayName = 'RippleButton'
