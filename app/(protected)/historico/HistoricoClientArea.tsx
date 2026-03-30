'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

type Tipo = 'plano' | 'analise'

export interface ItemHistorico {
  id: string
  tipo: Tipo
  created_at: string
  nome: string
  tutora: string | null
  preview: string
}

interface Props {
  todos: ItemHistorico[]
  tutoras: string[]
}

export default function HistoricoClientArea({ todos, tutoras }: Props) {
  const [busca, setBusca] = useState('')
  const [filtraTipo, setFiltraTipo] = useState<Tipo | ''>('')
  const [filtraTutora, setFiltraTutora] = useState('')

  const lista = useMemo(() => {
    return todos.filter((item) => {
      if (filtraTipo && item.tipo !== filtraTipo) return false
      if (filtraTutora && item.tutora !== filtraTutora) return false
      if (busca.trim()) {
        const q = busca.trim().toLowerCase()
        if (!item.nome.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [todos, busca, filtraTipo, filtraTutora])

  const temFiltro = busca || filtraTipo || filtraTutora

  function limpar() {
    setBusca('')
    setFiltraTipo('')
    setFiltraTutora('')
  }

  return (
    <>
      {/* ── Filtros ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 mb-5">

        {/* Tipo */}
        <div className="flex flex-wrap gap-2">
          {([['', 'Todos'], ['plano', 'Planos de Ação'], ['analise', 'Análises de Instagram']] as const).map(
            ([val, label]) => (
              <button
                key={label}
                onClick={() => setFiltraTipo(val)}
                className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                  filtraTipo === val
                    ? 'bg-petroleo text-creme border-petroleo'
                    : 'border-creme-dark text-petroleo hover:bg-offwhite'
                }`}
              >
                {label}
              </button>
            )
          )}
        </div>

        {/* Busca + Tutora + Limpar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome do aluno..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-creme-dark bg-white text-petroleo text-sm placeholder-petroleo/40 focus:outline-none focus:ring-2 focus:ring-petroleo/30 focus:border-petroleo transition"
          />

          <select
            value={filtraTutora}
            onChange={(e) => setFiltraTutora(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-creme-dark bg-white text-petroleo text-sm focus:outline-none focus:ring-2 focus:ring-petroleo/30 focus:border-petroleo transition cursor-pointer"
          >
            <option value="">Todas as tutoras</option>
            {tutoras.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {temFiltro && (
            <button
              onClick={limpar}
              className="px-4 py-2.5 rounded-xl border border-creme-dark text-petroleo/60 text-sm hover:text-petroleo hover:border-petroleo/30 transition-colors whitespace-nowrap"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* ── Contador ────────────────────────────────────────────────────── */}
      <p className="text-petroleo/60 text-sm mb-4">
        {lista.length} item{lista.length !== 1 ? 's' : ''} encontrado
        {lista.length !== 1 ? 's' : ''}
      </p>

      {/* ── Tabela ──────────────────────────────────────────────────────── */}
      {lista.length === 0 ? (
        <div className="bg-white rounded-2xl border border-creme p-12 text-center">
          <p className="text-petroleo/50 text-sm">
            Nenhum item encontrado com os filtros selecionados.
          </p>
          {temFiltro && (
            <button
              onClick={limpar}
              className="mt-3 text-petroleo text-sm underline hover:no-underline"
            >
              Limpar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-creme overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-petroleo text-creme">
                <th className="text-left px-5 py-3.5 font-medium">Nome / Perfil</th>
                <th className="text-left px-5 py-3.5 font-medium hidden sm:table-cell">Tipo</th>
                <th className="text-left px-5 py-3.5 font-medium hidden md:table-cell">Tutora</th>
                <th className="text-left px-5 py-3.5 font-medium hidden md:table-cell">Data</th>
                <th className="text-left px-5 py-3.5 font-medium hidden lg:table-cell">Prévia</th>
                <th className="text-right px-5 py-3.5 font-medium">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-creme/50">
              {lista.map((item) => (
                <tr
                  key={`${item.tipo}-${item.id}`}
                  className="hover:bg-offwhite/60 transition-colors"
                >
                  <td className="px-5 py-4 font-medium text-petroleo">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-creme flex items-center justify-center text-petroleo text-xs font-bold shrink-0">
                        {item.nome.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate max-w-[140px]">{item.nome}</span>
                    </div>
                  </td>

                  <td className="px-5 py-4 hidden sm:table-cell">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                        item.tipo === 'plano'
                          ? 'bg-petroleo/10 text-petroleo'
                          : 'bg-creme text-petroleo/70'
                      }`}
                    >
                      {item.tipo === 'plano' ? 'Plano de Ação' : 'Análise Instagram'}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-petroleo/60 hidden md:table-cell">
                    {item.tutora ?? <span className="text-petroleo/30">—</span>}
                  </td>

                  <td className="px-5 py-4 text-petroleo/60 hidden md:table-cell whitespace-nowrap">
                    {new Date(item.created_at).toLocaleDateString('pt-BR')}
                  </td>

                  <td className="px-5 py-4 text-petroleo/50 hidden lg:table-cell">
                    <span className="truncate block max-w-[240px]">{item.preview}…</span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <Link
                      href={
                        item.tipo === 'plano'
                          ? `/plano/${item.id}`
                          : `/analise/${item.id}`
                      }
                      className="text-petroleo text-xs font-medium px-3 py-1.5 rounded-lg border border-creme-dark hover:bg-creme transition-colors"
                    >
                      {item.tipo === 'plano' ? 'Ver plano' : 'Ver análise'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
