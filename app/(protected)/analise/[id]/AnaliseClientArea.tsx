'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PlanoMarkdown from '@/components/PlanoMarkdown'

interface AnaliseData {
  id: string
  nome_aluno: string | null
  conteudo: string
}

function formatarAnaliseParaNotion(conteudo: string): string {
  return conteudo
    .split('\n')
    .map((linha) => {
      // ## 1) Título ou ## **1) Título**
      const matchH2 = linha.match(/^##\s+\*?\*?(\d+\)[^*]+?)\*?\*?\s*$/)
      if (matchH2) return `## <u>${matchH2[1].trim()}</u>`

      // **1) Título**
      const matchBold = linha.match(/^\*\*(\d+\)[^*]+)\*\*\s*$/)
      if (matchBold) return `## <u>${matchBold[1].trim()}</u>`

      return linha
    })
    .join('\n')
}

export default function AnaliseClientArea({ analise }: { analise: AnaliseData }) {
  const router = useRouter()
  const [editMode, setEditMode] = useState(false)
  const [texto, setTexto] = useState(analise.conteudo)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [copiado, setCopiar] = useState(false)
  const [linkCopiado, setLinkCopiado] = useState(false)

  async function copiarParaNotion() {
    await navigator.clipboard.writeText(formatarAnaliseParaNotion(analise.conteudo))
    setCopiar(true)
    setTimeout(() => setCopiar(false), 2000)
  }

  function baixarPdf() {
    document.title = `Análise de Instagram - ${analise.nome_aluno ?? 'Perfil'}`
    window.print()
  }

  async function copiarLink() {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin
    await navigator.clipboard.writeText(`${base}/analise/publico/${analise.id}`)
    setLinkCopiado(true)
    setTimeout(() => setLinkCopiado(false), 2500)
  }

  async function salvar() {
    setSalvando(true)
    setErro(null)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('analises_instagram')
        .update({ conteudo: texto })
        .eq('id', analise.id)
      if (error) throw new Error(error.message)
      setEditMode(false)
      router.refresh()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <>
      {/* Conteúdo */}
      <div
        id="analise-conteudo"
        className={`rounded-2xl mb-6 transition-all ${
          editMode
            ? 'border-2 border-[#05343d] bg-[#f9f9f9] p-5'
            : 'bg-white shadow-sm border border-creme p-6'
        }`}
      >
        {editMode ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-medium text-petroleo/50 mr-auto">
                Modo de edição — Markdown
              </span>
              {erro && <span className="text-xs text-red-600">{erro}</span>}
              <button
                onClick={() => { setEditMode(false); setErro(null) }}
                className="px-4 py-2 rounded-xl border border-creme-dark text-petroleo/70 text-sm hover:bg-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={salvando}
                className="px-5 py-2 rounded-xl bg-[#05343d] text-[#f7e4ca] text-sm font-medium hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
              >
                {salvando ? 'Salvando...' : '💾 Salvar'}
              </button>
            </div>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              style={{ fontFamily: 'monospace', minHeight: 600, background: '#f9f9f9' }}
              className="w-full px-4 py-3 rounded-xl text-petroleo text-sm leading-relaxed focus:outline-none resize-y border-0"
            />
          </>
        ) : (
          <PlanoMarkdown conteudo={texto} />
        )}
      </div>

      {/* Ações */}
      <div className="no-print flex flex-col gap-3 mb-10">
        {/* Grupo 1: Copiar para Notion | Baixar PDF | Copiar Link Público */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={copiarParaNotion}
            className="flex-1 bg-petroleo text-creme py-2.5 px-5 rounded-xl font-medium text-sm hover:bg-petroleo-light transition-colors"
          >
            {copiado ? '✓ Copiado!' : '📋 Copiar para Notion'}
          </button>
          <button
            onClick={baixarPdf}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-creme-dark text-petroleo text-sm font-medium hover:bg-offwhite transition-colors"
          >
            📄 Baixar PDF
          </button>
          <button
            onClick={copiarLink}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-creme-dark text-petroleo text-sm font-medium hover:bg-offwhite transition-colors"
          >
            {linkCopiado ? '✓ Link copiado!' : '🔗 Copiar Link Público'}
          </button>
        </div>

        {/* Grupo 2: Editar Manualmente | Voltar ao Histórico */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => { setTexto(analise.conteudo); setErro(null); setEditMode(!editMode) }}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-creme-dark text-petroleo text-sm font-medium hover:bg-offwhite transition-colors"
          >
            {editMode ? '✕ Cancelar Edição' : '✏️ Editar Manualmente'}
          </button>
          <Link
            href="/historico"
            className="flex-1 flex items-center justify-center px-5 py-2.5 rounded-xl border border-creme-dark text-petroleo text-sm font-medium hover:bg-offwhite transition-colors"
          >
            ← Voltar ao Histórico
          </Link>
        </div>
      </div>
    </>
  )
}
