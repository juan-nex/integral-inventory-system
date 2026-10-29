'use client'

import { cn } from '@/lib/utils'

/* ---------- Area / line chart ---------- */
export function AreaChart({
  data,
  height = 200,
  color = 'var(--accent)',
  formatY,
}: {
  data: { label: string; value: number }[]
  height?: number
  color?: string
  formatY?: (n: number) => string
}) {
  const w = 640
  const h = height
  const pad = 28
  const max = Math.max(...data.map((d) => d.value)) * 1.15
  const min = 0
  const stepX = (w - pad * 2) / (data.length - 1)
  const scaleY = (v: number) => h - pad - ((v - min) / (max - min)) * (h - pad * 2)
  const points = data.map((d, i) => [pad + i * stepX, scaleY(d.value)] as const)
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ')
  const area = `${line} L${points[points.length - 1][0]},${h - pad} L${points[0][0]},${h - pad} Z`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line
          key={f}
          x1={pad}
          x2={w - pad}
          y1={h - pad - f * (h - pad * 2)}
          y2={h - pad - f * (h - pad * 2)}
          stroke="var(--border)"
          strokeDasharray="4 6"
        />
      ))}
      <path d={area} fill="url(#area-fill)" />
      <path d={line} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={3.5} fill="var(--card)" stroke={color} strokeWidth={2} />
      ))}
      {data.map((d, i) => (
        <text
          key={i}
          x={pad + i * stepX}
          y={h - 6}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize="11"
        >
          {d.label}
        </text>
      ))}
    </svg>
  )
}

/* ---------- Grouped bar chart ---------- */
export function BarChart({
  data,
  height = 220,
  formatY,
}: {
  data: { label: string; value: number; target?: number }[]
  height?: number
  formatY?: (n: number) => string
}) {
  const max = Math.max(...data.flatMap((d) => [d.value, d.target ?? 0])) * 1.15
  return (
    <div className="flex items-end justify-between gap-3" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-2">
          <div className="relative flex h-full w-full items-end justify-center gap-1">
            {d.target != null && (
              <div
                className="w-2.5 rounded-t bg-border"
                style={{ height: `${(d.target / max) * 100}%` }}
                title="Meta"
              />
            )}
            <div
              className="w-5 rounded-t bg-accent transition-all duration-500 hover:opacity-80"
              style={{ height: `${(d.value / max) * 100}%` }}
              title={formatY ? formatY(d.value) : String(d.value)}
            />
          </div>
          <span className="text-xs text-muted-foreground">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

/* ---------- Donut chart ---------- */
export function DonutChart({
  data,
  size = 180,
}: {
  data: { name: string; value: number; color: string }[]
  size?: number
}) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const r = size / 2 - 12
  const c = 2 * Math.PI * r
  let offset = 0
  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {data.map((d, i) => {
            const frac = d.value / total
            const dash = frac * c
            const el = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={d.color}
                strokeWidth={16}
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            )
            offset += dash
            return el
          })}
        </g>
        <text
          x="50%"
          y="47%"
          textAnchor="middle"
          className="fill-foreground"
          fontSize="20"
          fontWeight="600"
        >
          {data.length}
        </text>
        <text x="50%" y="60%" textAnchor="middle" className="fill-muted-foreground" fontSize="10">
          categorías
        </text>
      </svg>
      <ul className="space-y-2 text-sm">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ background: d.color }} />
            <span className="text-muted-foreground">{d.name}</span>
            <span className="ml-auto font-medium tabular-nums">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ---------- Sparkline ---------- */
export function Sparkline({
  data,
  color = 'var(--accent)',
  className,
}: {
  data: number[]
  color?: string
  className?: string
}) {
  const w = 120
  const h = 36
  const max = Math.max(...data)
  const min = Math.min(...data)
  const stepX = w / (data.length - 1)
  const points = data
    .map((v, i) => `${i * stepX},${h - ((v - min) / (max - min || 1)) * h}`)
    .join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn('h-9 w-full', className)} preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
