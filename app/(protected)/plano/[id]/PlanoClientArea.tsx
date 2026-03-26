'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PlanoMarkdown from '@/components/PlanoMarkdown'
import CopiarBotao from './CopiarBotao'
import CriarNotionBotao from './CriarNotionBotao'
import BaixarPdfBotao from './BaixarPdfBotao'
import EditarPlanoBotao from './EditarPlanoBotao'
import CopiarLinkPublicoBotao from './CopiarLinkPublicoBotao'

interface PlanoData {
  id: string
  nome_aluno: string
  tutora: string
  conteudo: string
}

export default function PlanoClientArea({ plano }: { plano: PlanoData }) {
  const router = useRouter()
  const [editMode, setEditMode] = useState(false)
  const [texto, setTexto] = useState(plano.conteudo)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  function handleEditar() {
    setTexto(plano.conteudo)
    setErro(null)
    setEditMode(true)
  }

  function handleCancelar() {
    setEditMode(false)
    setErro(null)
  }

  async function handleSalvar() {
    setSalvando(true)
    setErro(null)
    try {
      const supabase = createClient()
      // UPDATE apenas em "conteudo" — analise_instagram é preservada
      const { error } = await supabase
        .from('planos')
        .update({ conteudo: texto })
        .eq('id', plano.id)
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
      {/* Conteúdo do plano — view ou edit */}
      <div
        id="plano-conteudo"
        className={`rounded-2xl mb-6 transition-all ${
          editMode
            ? 'border-2 border-[#05343d] bg-[#f9f9f9] p-5'
            : 'bg-white shadow-sm border border-creme p-6'
        }`}
      >
        {editMode ? (
          <>
            {/* Barra de ações — topo da área de edição */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-medium text-petroleo/50 mr-auto">
                Modo de edição — Markdown
              </span>
              {erro && (
                <span className="text-xs text-red-600">{erro}</span>
              )}
              <button
                onClick={handleCancelar}
                className="px-4 py-2 rounded-xl border border-creme-dark text-petroleo/70 text-sm hover:bg-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvar}
                disabled={salvando}
                className="px-5 py-2 rounded-xl bg-[#05343d] text-[#f7e4ca] text-sm font-medium hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
              >
                {salvando ? 'Salvando...' : '💾 Salvar'}
              </button>
            </div>

            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              style={{
                fontFamily: 'monospace',
                minHeight: 600,
                background: '#f9f9f9',
              }}
              className="w-full px-4 py-3 rounded-xl text-petroleo text-sm leading-relaxed focus:outline-none resize-y border-0"
            />
          </>
        ) : (
          <PlanoMarkdown conteudo={texto} />
        )}
      </div>

      {/* Ações — ocultas na impressão */}
      <div className="no-print flex flex-col gap-3 mb-10">
        {/* Grupo 1: Copiar | Criar Notion | Baixar PDF */}
        <div className="flex flex-col sm:flex-row gap-3">
          <CopiarBotao conteudo={plano.conteudo} />
          <CriarNotionBotao
            nomeAluno={plano.nome_aluno}
            tutora={plano.tutora}
            conteudo={plano.conteudo}
          />
          <BaixarPdfBotao nomeAluno={plano.nome_aluno} />
        </div>

        {/* Grupo 2: Editar Manualmente | Editar com IA */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={editMode ? handleCancelar : handleEditar}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-creme-dark text-petroleo text-sm font-medium hover:bg-offwhite transition-colors"
          >
            {editMode ? '✕ Cancelar Edição' : '✏️ Editar Manualmente'}
          </button>
          <EditarPlanoBotao
            planoId={plano.id}
            nomeAluno={plano.nome_aluno}
            tutora={plano.tutora}
            conteudo={plano.conteudo}
          />
        </div>

        {/* Grupo 3: Copiar Link Público | Voltar ao Histórico */}
        <div className="flex flex-col sm:flex-row gap-3">
          <CopiarLinkPublicoBotao planoId={plano.id} />
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
