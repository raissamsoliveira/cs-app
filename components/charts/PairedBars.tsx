import type { FaturamentoPar } from '@/lib/dashboardStats'

interface Props {
  data: FaturamentoPar[]
}

export default function PairedBars({ data }: Props) {
  if (data.length === 0) {
    return (
      <p className="text-petroleo/50 text-sm">
        Sem dados de faturamento na planilha.
      </p>
    )
  }
  const max = Math.max(...data.flatMap((d) => [d.atual, d.desejado]), 1)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-xs text-petroleo/60 mb-1">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-petroleo" /> Atual
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-creme-dark" /> Desejado
        </span>
      </div>
      {data.map((par) => (
        <div key={par.faixa}>
          <p className="text-sm text-petroleo mb-1.5">{par.faixa}</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-3 bg-offwhite rounded-full overflow-hidden">
                <div className="h-full bg-petroleo" style={{ width: `${(par.atual / max) * 100}%` }} />
              </div>
              <span className="w-8 text-right text-xs text-petroleo/60 shrink-0">{par.atual}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-3 bg-offwhite rounded-full overflow-hidden">
                <div className="h-full bg-creme-dark" style={{ width: `${(par.desejado / max) * 100}%` }} />
              </div>
              <span className="w-8 text-right text-xs text-petroleo/60 shrink-0">{par.desejado}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
