import type { BarItem } from '@/lib/dashboardStats'

interface Props {
  data: BarItem[]
  onBarClick?: (item: BarItem) => void
  rotateLabels?: boolean
  activeKey?: string
}

export default function VerticalBars({ data, onBarClick, rotateLabels = false, activeKey }: Props) {
  if (data.length === 0) {
    return <p className="text-petroleo/50 text-sm">Sem dados</p>
  }

  const W = 560
  const H = 200
  const PAD_L = 28
  const PAD_R = 8
  const PAD_TOP = 20
  const LABEL_AREA = rotateLabels ? 52 : 22
  const chartH = H - PAD_TOP - LABEL_AREA

  const max = Math.max(...data.map((d) => d.count), 1)
  const barSlot = (W - PAD_L - PAD_R) / data.length
  const barGap = Math.max(barSlot * 0.2, 2)
  const barW = Math.max(barSlot - barGap, 2)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
      {/* Linhas de referência */}
      {[0, 0.5, 1].map((t) => {
        const y = PAD_TOP + (1 - t) * chartH
        return (
          <line
            key={t}
            x1={PAD_L}
            x2={W - PAD_R}
            y1={y}
            y2={y}
            stroke="#e8c99a"
            strokeWidth={0.5}
            strokeDasharray="3 3"
            opacity={0.6}
          />
        )
      })}

      {/* Barras */}
      {data.map((d, i) => {
        const barH = Math.max((d.count / max) * chartH, d.count > 0 ? 2 : 0)
        const x = PAD_L + i * barSlot + barGap / 2
        const y = PAD_TOP + chartH - barH
        const cx = x + barW / 2
        const isActive = activeKey !== undefined && d.key === activeKey
        const clickable = !!onBarClick && !!d.key

        return (
          <g
            key={i}
            onClick={() => d.key && onBarClick?.(d)}
            style={{ cursor: clickable ? 'pointer' : 'default' }}
          >
            {/* Hover área invisível */}
            {clickable && (
              <rect
                x={x - 2}
                y={PAD_TOP}
                width={barW + 4}
                height={chartH}
                fill="transparent"
              />
            )}

            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={2}
              fill={isActive ? '#f7a75c' : '#05343d'}
              fillOpacity={d.count > 0 ? 0.85 : 0.12}
            />

            {d.count > 0 && (
              <text
                x={cx}
                y={y - 4}
                textAnchor="middle"
                fontSize={9}
                fill="#05343d"
                fontWeight={600}
              >
                {d.count}
              </text>
            )}

            {rotateLabels ? (
              <text
                x={cx}
                y={PAD_TOP + chartH + 6}
                textAnchor="end"
                fontSize={9}
                fill={isActive ? '#b05a00' : '#05343d'}
                opacity={isActive ? 1 : 0.6}
                fontWeight={isActive ? 700 : 400}
                transform={`rotate(-40, ${cx}, ${PAD_TOP + chartH + 6})`}
              >
                {d.label}
              </text>
            ) : (
              <text
                x={cx}
                y={PAD_TOP + chartH + 14}
                textAnchor="middle"
                fontSize={9}
                fill={isActive ? '#b05a00' : '#05343d'}
                opacity={isActive ? 1 : 0.6}
                fontWeight={isActive ? 700 : 400}
              >
                {d.label}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
