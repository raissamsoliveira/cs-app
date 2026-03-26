'use client'

import { useRouter } from 'next/navigation'

type Tipo = 'plano' | 'analise'

interface Props {
  tutoras: string[]
  filtraTutora?: string
  filtraData?: string
  filtraMinha: boolean
  filtraTipo?: Tipo
}

export default function FiltrosHistorico({
  tutoras,
  filtraTutora,
  filtraData,
  filtraMinha,
  filtraTipo,
}: Props) {
  const router = useRouter()

  function montar(
    tutora: string,
    data: string,
    minha: boolean,
    tipo: Tipo | '',
  ) {
    const params = new URLSearchParams()
    if (minha) {
      params.set('minha', '1')
    } else if (tutora) {
      params.set('tutora', tutora)
    }
    if (data) params.set('data', data)
    if (tipo) params.set('tipo', tipo)
    router.push('/historico?' + params.toString())
  }

  function limpar() {
    router.push('/historico')
  }

  const temFiltro = filtraTutora || filtraData || filtraMinha || filtraTipo

  return (
    <div className="flex flex-col gap-3 mb-5">
      {/* Filtro por tipo */}
      <div className="flex gap-2">
        {([undefined, 'plano', 'analise'] as const).map((t) => {
          const label = t === undefined ? 'Todos' : t === 'plano' ? 'Planos de Ação' : 'Análises de Instagram'
          const ativo = filtraTipo === t
          return (
            <button
              key={label}
              onClick={() =>
                montar(
                  filtraTutora || '',
                  filtraData || '',
                  filtraMinha,
                  t ?? '',
                )
              }
              className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                ativo
                  ? 'bg-petroleo text-creme border-petroleo'
                  : 'border-creme-dark text-petroleo hover:bg-offwhite'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Filtros secundários */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Meus itens */}
        <button
          onClick={() =>
            montar('', filtraData || '', !filtraMinha, filtraTipo ?? '')
          }
          className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors whitespace-nowrap ${
            filtraMinha
              ? 'bg-petroleo text-creme border-petroleo'
              : 'border-creme-dark text-petroleo hover:bg-offwhite'
          }`}
        >
          {filtraMinha ? '✓ Meus itens' : 'Meus itens'}
        </button>

        {/* Tutora — só faz sentido para planos */}
        <select
          value={filtraTutora || ''}
          onChange={(e) =>
            montar(e.target.value, filtraData || '', false, filtraTipo ?? '')
          }
          disabled={filtraMinha}
          className="px-4 py-2.5 rounded-xl border border-creme-dark bg-white text-petroleo text-sm focus:outline-none focus:ring-2 focus:ring-petroleo/30 focus:border-petroleo transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <option value="">Todas as tutoras</option>
          {tutoras.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        {/* Data */}
        <input
          type="date"
          value={filtraData || ''}
          onChange={(e) =>
            montar(filtraTutora || '', e.target.value, filtraMinha, filtraTipo ?? '')
          }
          className="px-4 py-2.5 rounded-xl border border-creme-dark bg-white text-petroleo text-sm focus:outline-none focus:ring-2 focus:ring-petroleo/30 focus:border-petroleo transition"
        />

        {/* Limpar */}
        {temFiltro && (
          <button
            onClick={limpar}
            className="px-4 py-2.5 rounded-xl border border-creme-dark text-petroleo/60 text-sm hover:text-petroleo hover:border-petroleo/30 transition-colors"
          >
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  )
}
