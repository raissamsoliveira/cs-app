import type { BarItem } from '@/lib/dashboardStats'

interface Props {
  data: BarItem[]
  emptyMessage?: string
}

export default function BarRanking({ data, emptyMessage = 'Sem dados' }: Props) {
  if (data.length === 0) {
    return <p className="text-petroleo/50 text-sm">{emptyMessage}</p>
  }
  const max = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className="space-y-2.5">
      {data.map((item) => (
        <div key={item.label}>
          <div className="flex justify-between items-baseline gap-2 mb-1">
            <span className="text-sm text-petroleo truncate" title={item.label}>
              {item.label}
            </span>
            <span className="text-xs font-medium text-petroleo/60 shrink-0">
              {item.count}
            </span>
          </div>
          <div className="h-2 bg-offwhite rounded-full overflow-hidden">
            <div
              className="h-full bg-petroleo rounded-full"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
