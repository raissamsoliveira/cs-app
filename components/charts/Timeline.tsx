import type { BarItem } from '@/lib/dashboardStats'

interface Props {
  data: BarItem[]
}

export default function Timeline({ data }: Props) {
  if (data.length === 0) {
    return <p className="text-petroleo/50 text-sm">Sem dados</p>
  }

  const W = 600
  const H = 180
  const PAD_X = 28
  const PAD_TOP = 16
  const PAD_BOTTOM = 28
  const max = Math.max(...data.map((d) => d.count), 1)

  const stepX = (W - 2 * PAD_X) / Math.max(data.length - 1, 1)
  const yFor = (count: number) =>
    H - PAD_BOTTOM - (count / max) * (H - PAD_TOP - PAD_BOTTOM)

  const pontos = data.map((d, i) => ({
    x: PAD_X + i * stepX,
    y: yFor(d.count),
    label: d.label,
    count: d.count,
  }))

  const pathD = pontos
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
      {[0, 0.5, 1].map((t) => {
        const y = PAD_TOP + t * (H - PAD_TOP - PAD_BOTTOM)
        return (
          <line
            key={t}
            x1={PAD_X}
            x2={W - PAD_X}
            y1={y}
            y2={y}
            stroke="#e8c99a"
            strokeWidth={0.5}
            strokeDasharray="3 3"
            opacity={0.6}
          />
        )
      })}

      <path
        d={`${pathD} L ${(W - PAD_X).toFixed(1)} ${H - PAD_BOTTOM} L ${PAD_X} ${H - PAD_BOTTOM} Z`}
        fill="#05343d"
        fillOpacity={0.08}
      />
      <path d={pathD} fill="none" stroke="#05343d" strokeWidth={2} />

      {pontos.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3.5} fill="#05343d" />
          {p.count > 0 && (
            <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize={10} fill="#05343d" fontWeight={600}>
              {p.count}
            </text>
          )}
          <text x={p.x} y={H - 8} textAnchor="middle" fontSize={10} fill="#05343d" opacity={0.6}>
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  )
}
