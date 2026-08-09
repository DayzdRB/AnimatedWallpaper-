import type { CSSProperties, ReactNode } from 'react'

type AuroraTextProps = {
  children: ReactNode
  className?: string
  colors?: string[]
  speed?: number
}

type AuroraStyle = CSSProperties & {
  '--aurora-colors': string
  '--aurora-speed': string
}

const DEFAULT_COLORS = ['#FF0080', '#7928CA', '#0070F3', '#38bdf8']

export function AuroraText({
  children,
  className = '',
  colors = DEFAULT_COLORS,
  speed = 8,
}: AuroraTextProps) {
  const safeColors = colors.length > 0 ? colors : DEFAULT_COLORS
  const style: AuroraStyle = {
    '--aurora-colors': [...safeColors, safeColors[0]].join(', '),
    '--aurora-speed': `${Math.max(speed, 0.1)}s`,
  }

  return (
    <span className={`aurora-text ${className}`.trim()} style={style}>
      <span className="aurora-text__visual" aria-hidden="true">
        {children}
      </span>
      <span className="visually-hidden">{children}</span>
    </span>
  )
}

