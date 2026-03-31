'use client'

import { useState } from 'react'
import { useAlunos } from '@/hooks/useAlunos'

interface Props {
  onSelect: (aluno: Record<string, string>) => void
  placeholder?: string
  valorInicial?: string
}

export default function BuscaAluno({
  onSelect,
  placeholder = 'Buscar aluno pelo nome...',
  valorInicial = '',
}: Props) {
  const [query, setQuery] = useState(valorInicial)
  const [aberto, setAberto] = useState(false)
  const { alunos, loading } = useAlunos(query)

  /** Retorna o valor do campo instagram/linkedin (busca por prefixo para robustez) */
  function getIg(aluno: Record<string, string>): string {
    const key = Object.keys(aluno).find((k) =>
      k.startsWith('Qual seu instagram ou linkedin')
    )
    return key ? aluno[key] : ''
  }

  function handleSelect(aluno: Record<string, string>) {
    setQuery(aluno['Nome completo'] ?? '')
    setAberto(false)
    onSelect(aluno)
  }

  const mostrarDropdown = aberto && query.trim().length > 0

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setAberto(true)
        }}
        onFocus={() => query.trim() && setAberto(true)}
        onBlur={() => setTimeout(() => setAberto(false), 150)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl border border-creme-dark bg-offwhite text-petroleo placeholder-petroleo/40 focus:outline-none focus:ring-2 focus:ring-petroleo/30 focus:border-petroleo transition text-sm"
      />

      {mostrarDropdown && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-creme-dark rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <li className="px-4 py-3 text-sm text-petroleo/50">Buscando...</li>
          ) : alunos.length === 0 ? (
            <li className="px-4 py-3 text-sm text-petroleo/50">
              Aluno não encontrado na planilha
            </li>
          ) : (
            alunos.map((aluno, i) => {
              const ig = getIg(aluno)
              return (
                <li
                  key={i}
                  onMouseDown={() => handleSelect(aluno)}
                  className="px-4 py-2.5 cursor-pointer hover:bg-offwhite transition-colors border-b border-creme/50 last:border-0"
                >
                  <p className="text-sm font-medium text-petroleo">
                    {aluno['Nome completo']}
                  </p>
                  {ig && (
                    <p className="text-xs text-petroleo/50 mt-0.5 truncate">{ig}</p>
                  )}
                </li>
              )
            })
          )}
        </ul>
      )}
    </div>
  )
}
