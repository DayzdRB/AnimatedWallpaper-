import type { ResolvedSeason } from '../lib/settings'

type SeasonSurfaceProps = { season: ResolvedSeason }

const treeClusters = [
  { cx: 132, cy: 702, rx: 122, ry: 45 },
  { cx: 505, cy: 735, rx: 98, ry: 50 },
  { cx: 679, cy: 670, rx: 72, ry: 50 },
  { cx: 1105, cy: 661, rx: 86, ry: 45 },
  { cx: 1310, cy: 700, rx: 112, ry: 51 },
  { cx: 1542, cy: 722, rx: 104, ry: 49 },
  { cx: 382, cy: 858, rx: 148, ry: 70 },
  { cx: 842, cy: 890, rx: 114, ry: 58 },
  { cx: 1461, cy: 885, rx: 142, ry: 67 },
]

export function SeasonSurface({ season }: SeasonSurfaceProps) {
  if (season !== 'winter' && season !== 'autumn') return null

  return (
    <svg
      className={`season-surface season-surface--${season}`}
      viewBox="0 0 1672 941"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="snow-sheen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".92" />
          <stop offset="1" stopColor="#cadceb" stopOpacity=".48" />
        </linearGradient>
        <linearGradient id="autumn-canopy" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#eab34b" />
          <stop offset=".5" stopColor="#c65b2e" />
          <stop offset="1" stopColor="#7e3825" />
        </linearGradient>
        <filter id="surface-soft"><feGaussianBlur stdDeviation="5" /></filter>
      </defs>

      {season === 'winter' ? (
        <g className="season-surface__winter">
          <path className="season-surface__ground" d="M0 650C180 620 302 690 455 676c183-16 246 22 373 8 151-17 285-66 431-36 143 30 275-9 413-13v306H0Z" />
          <g className="season-surface__roofs">
            <path d="M0 672l158-27 153 21 138-42 154 29-10 20-140-18-140 42-155-18L0 704Z" />
            <path d="M741 780l238-31 189 15 187-43 221 19 96 31v31l-111-29-199-16-184 40-195-18-242 34Z" />
            <path d="M23 842l245-43 216 30 140-20 23 31-167 23-210-28-247 45Z" />
          </g>
          <g className="season-surface__trees" filter="url(#surface-soft)">
            {treeClusters.map((tree, index) => <ellipse key={index} {...tree} />)}
          </g>
        </g>
      ) : (
        <g className="season-surface__autumn" filter="url(#surface-soft)">
          {treeClusters.map((tree, index) => <ellipse key={index} {...tree} />)}
        </g>
      )}
    </svg>
  )
}
