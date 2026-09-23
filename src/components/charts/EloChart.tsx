import { motion, useInView } from 'framer-motion'
import { useMemo, useRef } from 'react'
import { formatDate } from '../../lib/format'

interface EloChartProps {
  points: { date: string; elo: number; matchId: string | null }[]
  height?: number
  variant?: 'sparkline' | 'full'
  color?: string
  gradientId: string
}

const VIEW_W = 400

function buildPath(points: { elo: number }[], viewH: number, min: number, max: number) {
  if (points.length < 2) return { line: '', area: '' }
  const range = max - min || 1
  const step = VIEW_W / (points.length - 1)
  const coords = points.map((p, i) => {
    const x = i * step
    const y = viewH - ((p.elo - min) / range) * viewH
    return [x, y] as const
  })
  const line = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
  const area = `${line} L${VIEW_W},${viewH} L0,${viewH} Z`
  return { line, area }
}

export function EloChart({ points, height = 64, variant = 'sparkline', color, gradientId }: EloChartProps) {
  const ref = useRef<SVGSVGElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })
  const stroke = color ?? 'var(--color-clay)'

  const { line, area, min, max } = useMemo(() => {
    const elos = points.map((p) => p.elo)
    const min = Math.min(...elos)
    const max = Math.max(...elos)
    const { line, area } = buildPath(points, height, min, max)
    return { line, area, min, max }
  }, [points, height])

  if (points.length < 2) {
    return (
      <div className="flex items-center justify-center text-xs text-paper-faint" style={{ height }}>
        Noch keine Elo-Historie
      </div>
    )
  }

  return (
    <div className="w-full">
      <svg
        ref={ref}
        viewBox={`0 0 ${VIEW_W} ${height}`}
        preserveAspectRatio="none"
        className="w-full overflow-visible"
        style={{ height }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d={area}
          fill={`url(#${gradientId})`}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
        />
        <motion.path
          d={line}
          fill="none"
          stroke={stroke}
          strokeWidth={variant === 'full' ? 2 : 1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }}
          animate={inView ? { pathLength: 1 } : {}}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      {variant === 'full' && (
        <div className="mt-3 flex items-center justify-between font-sans text-[11px] text-paper-faint">
          <span>{formatDate(points[0].date)}</span>
          <span className="tabular text-paper-dim">
            {Math.round(min)} – {Math.round(max)} Elo
          </span>
          <span>{formatDate(points[points.length - 1].date)}</span>
        </div>
      )}
    </div>
  )
}
