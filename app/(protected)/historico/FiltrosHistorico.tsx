'use client'

import { useRouter } from 'next/navigation'

interface Props {
  tutoras: string[]
  filtraTutora?: string
  filtraData?: string
  filtraMinha: boolean
}

/**
 * Componente cliente para filtros do histórico.
 * Atualiza a URL com os parâmetros de filtro, o que aciona
 * o re-render do Server Component pai com os novos dados.
 */
export default function FiltrosHistorico({ tutoras, filtraTutora, filtraData, filtraMinha }: Props) {
  const router = useRouter()

  function aplicarFiltro(tutora: string, data: string, minha: boolean) {
    const params = new URLSearchParams()
    if (minha) {
      params.set('minha', '1')
    } else {
      if (tutora) params.set('tutora', tutora)
    }
    if (data) params.set('data', data)
    router.push('/historico?' + params.toString())
  }

  function limpar() {
    router.push('/historico')
  }

  const temFiltro = filtraTutora || filtraData || filtraMinha

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-5">
      {/* Botão "Meus planos" */}
      <button
        onClick={() => aplicarFiltro('', filtraData || '', !filtraMinha)}
        className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors whitespace-nowrap ${
          filtraMinha
            ? 'bg-petroleo text-creme border-petroleo'
            : 'border-creme-dark text-petroleo hover:bg-offwhite'
        }`}
      >
        {filtraMinha ? '✓ Meus planos' : 'Meus planos'}
      </button>

      {/* Filtro por tutora — desabilitado quando "Meus planos" estiver ativo */}
      <select
        value={filtraTutora || ''}
        onChange={(e) => aplicarFiltro(e.target.value, filtraData || '', false)}
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

      {/* Filtro por data */}
      <input
        type="date"
        value={filtraData || ''}
        onChange={(e) => aplicarFiltro(filtraTutora || '', e.target.value, filtraMinha)}
        className="px-4 py-2.5 rounded-xl border border-creme-dark bg-white text-petroleo text-sm focus:outline-none focus:ring-2 focus:ring-petroleo/30 focus:border-petroleo transition"
      />

      {/* Limpar filtros */}
      {temFiltro && (
        <button
          onClick={limpar}
          className="px-4 py-2.5 rounded-xl border border-creme-dark text-petroleo/60 text-sm hover:text-petroleo hover:border-petroleo/30 transition-colors"
        >
          Limpar filtros
        </button>
      )}
    </div>
  )
}
