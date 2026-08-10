import React, { memo, type CSSProperties } from 'react'

interface AuroraTextProps {
  children: React.ReactNode
  className?: string
  colors?: string[]
  speed?: number
}

export const AuroraText = memo(({
  children,
  className = '',
  colors = ['#fff9f2', '#eaded5', '#d8e3ef', '#ffffff'],
  speed = 1,
}: AuroraTextProps) => {
  const gradientStyle: CSSProperties = {
    backgroundImage: `linear-gradient(135deg, ${colors.join(', ')}, ${colors[0]})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animationDuration: `${10 / Math.max(speed, 0.1)}s`,
  }

  return (
    <span className={`aurora-text relative inline-block ${className}`.trim()}>
      <span className="sr-only">{children}</span>
      <span className="aurora-text__visual" style={gradientStyle} aria-hidden="true">{children}</span>
    </span>
  )
})
;(AuroraText as any).displayName = 'AuroraText'
