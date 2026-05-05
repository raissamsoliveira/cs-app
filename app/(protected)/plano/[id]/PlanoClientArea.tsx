'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PlanoMarkdown from '@/components/PlanoMarkdown'
import CopiarBotao from '@/components/CopiarBotao'
import BaixarPdfBotao from '@/components/BaixarPdfBotao'
import EditarComIABotao from '@/components/EditarComIABotao'
import CopiarLinkPublicoBotao from '@/components/CopiarLinkPublicoBotao'
import GerarApresentacaoBotao from '@/components/GerarApresentacaoBotao'
import TrocarTutoraBotao from '@/components/TrocarTutoraBotao'

interface PlanoData {
  id: string
  nome_aluno: string
  tutora: string
  conteudo: string
  createdAt: string
  hasAnalise: boolean
  analiseIG: string | null
  tipoIG: 'analise' | 'planejamento' | null
}

// ── Componente ────────────────────────────────────────────────────────────────

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
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-medium text-petroleo/50 mr-auto">
                Modo de edição — Markdown
              </span>
              {erro && <span className="text-xs text-red-600">{erro}</span>}
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
              style={{ fontFamily: 'monospace', minHeight: 600, background: '#f9f9f9' }}
              className="w-full px-4 py-3 rounded-xl text-petroleo text-sm leading-relaxed focus:outline-none resize-y border-0"
            />
          </>
        ) : (
          <div className="space-y-6">
            {/* 1. Plano de ação */}
            <PlanoMarkdown conteudo={texto} />

            {/* 2. Separador + 3. Análise/Planejamento de Instagram */}
            {plano.analiseIG && (
              <>
                <div className="my-8 pt-6 border-t-2 border-creme-dark">
                  <p className="text-xs uppercase tracking-wider text-petroleo/50 font-medium mb-1">
                    Seção complementar
                  </p>
                  <h3 className="font-playfair text-2xl text-petroleo font-semibold">
                    {plano.tipoIG === 'planejamento'
                      ? 'Planejamento Estratégico de Instagram'
                      : 'Análise Estratégica de Instagram'}
                  </h3>
                </div>
                <PlanoMarkdown conteudo={plano.analiseIG} />
              </>
            )}
          </div>
        )}
      </div>

      {/* Ações — ocultas na impressão */}
      <div className="no-print flex flex-col gap-3 mb-10">
        {/* Grupo 1: Copiar | Criar Notion | Baixar PDF */}
        <div className="flex flex-col sm:flex-row gap-3">
          <CopiarBotao
            conteudo={plano.conteudo}
            createdAt={plano.createdAt}
            hasAnalise={plano.hasAnalise}
          />
          <BaixarPdfBotao nomeAluno={plano.nome_aluno} />
        </div>

        {/* Grupo 2: Gerar Apresentação | Editar Manualmente | Editar com IA */}
        <div className="flex flex-col sm:flex-row gap-3">
          <GerarApresentacaoBotao
            nomeAluno={plano.nome_aluno}
            tutora={plano.tutora}
            conteudo={plano.conteudo}
            createdAt={plano.createdAt}
            analiseIG={plano.analiseIG}
            tipoIG={plano.tipoIG}
          />
          <button
            onClick={editMode ? handleCancelar : handleEditar}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-creme-dark text-petroleo text-sm font-medium hover:bg-offwhite transition-colors"
          >
            {editMode ? '✕ Cancelar Edição' : '✏️ Editar Manualmente'}
          </button>
          <EditarComIABotao
            planoId={plano.id}
            nomeAluno={plano.nome_aluno}
            tutora={plano.tutora}
            conteudo={plano.conteudo}
          />
        </div>

        {/* Grupo 3: Trocar Tutora | Copiar Link Público | Voltar ao Histórico */}
        <div className="flex flex-col sm:flex-row gap-3">
          <TrocarTutoraBotao planoId={plano.id} tutoraAtual={plano.tutora ?? null} />
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
