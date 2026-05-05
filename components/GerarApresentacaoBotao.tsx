'use client'

import { planoParaSlides } from '@/lib/planoParaSlides'

interface Props {
  nomeAluno: string
  tutora: string
  conteudo: string
  /** ISO; se o plano ainda não foi salvo, passe new Date().toISOString(). */
  createdAt: string
  /** Conteúdo Markdown da seção de Instagram (sem heading). Opcional. */
  analiseIG?: string | null
  /** Tipo da seção de IG — define o título da capa intermediária. */
  tipoIG?: 'analise' | 'planejamento' | null
  className?: string
}

export default function GerarApresentacaoBotao({
  nomeAluno,
  tutora,
  conteudo,
  createdAt,
  analiseIG,
  tipoIG,
  className,
}: Props) {
  function gerar() {
    const html = planoParaSlides({
      nome_aluno: nomeAluno,
      tutora,
      conteudo,
      createdAt,
      analiseIG: analiseIG ?? null,
      tipoIG: tipoIG ?? null,
    })
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  return (
    <button
      onClick={gerar}
      className={
        className ??
        'flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-creme-dark text-petroleo text-sm font-medium hover:bg-offwhite transition-colors'
      }
    >
      🎯 Gerar Apresentação
    </button>
  )
}
