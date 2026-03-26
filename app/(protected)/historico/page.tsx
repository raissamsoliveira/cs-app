import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import FiltrosHistorico from './FiltrosHistorico'

interface Plano {
  id: string
  created_at: string
  nome_aluno: string
  tutora: string
  conteudo: string
}

/**
 * Histórico — tabela de todos os planos com filtros por tutora e data.
 * searchParams são async no Next.js 16 — sempre usar await.
 */
export default async function HistoricoPage({
  searchParams,
}: {
  searchParams: Promise<{ tutora?: string; data?: string }>
}) {
  const { tutora: filtraTutora, data: filtraData } = await searchParams

  const supabase = await createClient()

  // Busca todas as tutoras distintas para o filtro
  const { data: todasTutoras } = await supabase
    .from('planos')
    .select('tutora')
    .order('tutora')

  const tutoras = [...new Set((todasTutoras ?? []).map((p) => p.tutora))]

  // Query principal com filtros opcionais
  let query = supabase
    .from('planos')
    .select('id, created_at, nome_aluno, tutora, conteudo')
    .order('created_at', { ascending: false })

  if (filtraTutora) {
    query = query.eq('tutora', filtraTutora)
  }
  if (filtraData) {
    // Filtra pelo dia inteiro
    const inicio = new Date(filtraData)
    const fim = new Date(filtraData)
    fim.setDate(fim.getDate() + 1)
    query = query
      .gte('created_at', inicio.toISOString())
      .lt('created_at', fim.toISOString())
  }

  const { data: planos, error } = await query
  const lista: Plano[] = planos ?? []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Título */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-playfair text-3xl text-petroleo font-semibold">
            Histórico
          </h1>
          <p className="text-petroleo/60 text-sm mt-1">
            {lista.length} plano{lista.length !== 1 ? 's' : ''} encontrado
            {lista.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/novo-plano"
          className="bg-petroleo text-creme px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-petroleo-light transition-colors"
        >
          + Novo Plano
        </Link>
      </div>

      {/* Filtros */}
      <FiltrosHistorico
        tutoras={tutoras}
        filtraTutora={filtraTutora}
        filtraData={filtraData}
      />

      {/* Tabela */}
      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          Erro ao carregar planos: {error.message}
        </div>
      ) : lista.length === 0 ? (
        <div className="bg-white rounded-2xl border border-creme p-12 text-center">
          <p className="text-petroleo/50 text-sm">
            Nenhum plano encontrado com os filtros selecionados.
          </p>
          {(filtraTutora || filtraData) && (
            <Link
              href="/historico"
              className="mt-3 inline-block text-petroleo text-sm underline hover:no-underline"
            >
              Limpar filtros
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-creme overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-petroleo text-creme">
                <th className="text-left px-5 py-3.5 font-medium">Aluno</th>
                <th className="text-left px-5 py-3.5 font-medium hidden sm:table-cell">
                  Tutora
                </th>
                <th className="text-left px-5 py-3.5 font-medium hidden md:table-cell">
                  Data
                </th>
                <th className="text-left px-5 py-3.5 font-medium hidden lg:table-cell">
                  Prévia
                </th>
                <th className="text-right px-5 py-3.5 font-medium">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-creme/50">
              {lista.map((plano) => (
                <tr key={plano.id} className="hover:bg-offwhite/60 transition-colors">
                  <td className="px-5 py-4 font-medium text-petroleo">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-creme flex items-center justify-center text-petroleo text-xs font-bold shrink-0">
                        {plano.nome_aluno.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate max-w-[140px]">{plano.nome_aluno}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-petroleo/70 hidden sm:table-cell">
                    {plano.tutora}
                  </td>
                  <td className="px-5 py-4 text-petroleo/60 hidden md:table-cell whitespace-nowrap">
                    {new Date(plano.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-5 py-4 text-petroleo/50 hidden lg:table-cell">
                    <span className="truncate block max-w-[240px]">
                      {plano.conteudo.slice(0, 80)}...
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/plano/${plano.id}`}
                      className="text-petroleo text-xs font-medium px-3 py-1.5 rounded-lg border border-creme-dark hover:bg-creme hover:border-creme-dark transition-colors"
                    >
                      Ver plano
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
