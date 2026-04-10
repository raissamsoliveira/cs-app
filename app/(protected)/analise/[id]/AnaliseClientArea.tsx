'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PlanoMarkdown from '@/components/PlanoMarkdown'
import {
  escHtml,
  boldHtml,
  renderTabelaHtml,
  renderConteudoHtml,
  logoHtml,
  buildSlidesHtml,
  type SlideEntry,
} from '@/lib/slides'

interface AnaliseData {
  id: string
  nome_aluno: string | null
  conteudo: string
  created_at: string
}

function formatarAnaliseParaNotion(conteudo: string): string {
  return conteudo
    .split('\n')
    .map((linha) => {
      const matchH2 = linha.match(/^##\s+\*?\*?(\d+\)[^*]+?)\*?\*?\s*$/)
      if (matchH2) return `## <u>${matchH2[1].trim()}</u>`
      const matchBold = linha.match(/^\*\*(\d+\)[^*]+)\*\*\s*$/)
      if (matchBold) return `## <u>${matchBold[1].trim()}</u>`
      return linha
    })
    .join('\n')
}

// ── Gerador de slides da análise de Instagram ─────────────────────────────────

const isSep = (l: string) => /^[\s|:\-]+$/.test(l)
const MAX_FASE_ROWS = 4 // slide A mostra até 4 linhas; split se body > 5

function markdownParaSlides(
  conteudo: string,
  nomeAluno: string | null,
  dataCriacao: string,
): string {
  // ── Parse sections ──────────────────────────────────────────────────────────
  type Bloco = { tipo: 'h2' | 'h3'; titulo: string; linhas: string[] }
  const blocos: Bloco[] = []
  let atual: Bloco | null = null

  for (const linha of conteudo.split('\n')) {
    const t = linha.trim()

    // FASE detectado em qualquer formato: ### FASE n, ## FASE n, **FASE n**, FASE n:
    const matchFase = /^(#{0,3}\s*\*{0,2})FASE\s+\d+/i.test(t)

    if (matchFase) {
      if (atual) blocos.push(atual)
      const titulo = t
        .replace(/^#{0,3}\s*/, '')
        .replace(/^\*\*/, '')
        .replace(/\*\*$/, '')
        .trim()
      atual = { tipo: 'h3', titulo, linhas: [] }
    } else if (t.startsWith('## ')) {
      if (atual) blocos.push(atual)
      atual = { tipo: 'h2', titulo: t.slice(3).trim(), linhas: [] }
    } else if (atual) {
      atual.linhas.push(linha)
    }
  }
  if (atual) blocos.push(atual)

  // ── Build slides ────────────────────────────────────────────────────────────
  const slides: SlideEntry[] = []

  const dataFmt = new Date(dataCriacao).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  // Slide 1 — Capa
  slides.push({
    dark: true,
    html: [
      '<div class="capa">',
      logoHtml(),
      nomeAluno ? '<div class="capa-nome">' + escHtml(nomeAluno) + '</div>' : '',
      '<div class="capa-meta">An&aacute;lise de Instagram &middot; ' + dataFmt + '</div>',
      '<div class="capa-rodape">Mentoria Primus &middot; Ser Mais Criativo</div>',
      '</div>',
    ].join('\n'),
  })

  const hasFases = blocos.some((b) => b.tipo === 'h3')

  // Slides de conteúdo (## 1, ## 2, ## 3)
  for (const bloco of blocos) {
    if (bloco.tipo !== 'h2') continue
    const num = parseInt(bloco.titulo.match(/^(\d+)/)?.[1] ?? '0')
    if (num >= 4 && hasFases) continue // ## 4 é só container das fases

    slides.push({
      html: [
        '<h2 class="slide-titulo">' + boldHtml(bloco.titulo) + '</h2>',
        '<div class="slide-corpo">' + renderConteudoHtml(bloco.linhas) + '</div>',
      ].join('\n'),
    })
  }

  // Slides de fases
  for (const bloco of blocos) {
    if (bloco.tipo !== 'h3') continue

    // Separar parágrafos e tabela
    const paraLinhas: string[] = []
    const tblLinhas: string[] = []
    for (const raw of bloco.linhas) {
      const t = raw.trim()
      if (t.startsWith('|')) tblLinhas.push(t)
      else if (t && t !== '---') paraLinhas.push(raw)
    }

    const tblValidas = tblLinhas.filter((l) => !isSep(l))
    const [head, ...body] = tblValidas

    const needsSplit = body.length > 5
    const corpoClass =
      bloco.linhas.join('').length > 500 ? 'slide-corpo small' : 'slide-corpo'
    const paraHtml = paraLinhas
      .map((l) => '<p>' + boldHtml(l.trim()) + '</p>')
      .join('\n')

    const supertitulo =
      '<p class="fase-supertitulo">RECOMENDA&Ccedil;&Otilde;ES ESTRAT&Eacute;GICAS</p>'
    const h2Titulo =
      '<h2 class="slide-titulo fase-titulo">' + boldHtml(bloco.titulo) + '</h2>'

    if (!head || !needsSplit) {
      // Slide único
      const tblHtml = tblLinhas.length ? renderTabelaHtml(tblLinhas) : ''
      slides.push({
        html: [
          supertitulo,
          h2Titulo,
          '<div class="' + corpoClass + '">',
          paraHtml,
          tblHtml,
          '</div>',
        ].join('\n'),
      })
    } else {
      // Slide A — parágrafo + primeiras MAX_FASE_ROWS linhas
      const tblA = renderTabelaHtml([head, ...body.slice(0, MAX_FASE_ROWS)])
      slides.push({
        html: [
          supertitulo,
          h2Titulo,
          '<div class="' + corpoClass + '">',
          paraHtml,
          tblA,
          '</div>',
          '<p class="slide-nota">continua no pr&oacute;ximo slide &rarr;</p>',
        ].join('\n'),
      })

      // Slide B — linhas restantes
      const tblB = renderTabelaHtml([head, ...body.slice(MAX_FASE_ROWS)])
      slides.push({
        html: [
          supertitulo,
          '<h2 class="slide-titulo fase-titulo">' +
            boldHtml(bloco.titulo) +
            ' <span style="font-size:16px;font-family:Poppins,sans-serif;opacity:.5;font-weight:400">(continua&ccedil;&atilde;o)</span>' +
            '</h2>',
          '<div class="' + corpoClass + '">',
          tblB,
          '</div>',
        ].join('\n'),
      })
    }
  }

  // Slide final — Encerramento
  slides.push({
    dark: true,
    html: [
      '<div class="encerramento">',
      logoHtml(),
      '<div class="enc-sub">Ser Mais Criativo</div>',
      '</div>',
    ].join('\n'),
  })

  return buildSlidesHtml(
    slides,
    'Análise de Instagram' + (nomeAluno ? ' — ' + nomeAluno : ''),
  )
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function AnaliseClientArea({ analise }: { analise: AnaliseData }) {
  const router = useRouter()
  const [editMode, setEditMode] = useState(false)
  const [texto, setTexto] = useState(analise.conteudo)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [copiado, setCopiar] = useState(false)
  const [linkCopiado, setLinkCopiado] = useState(false)

  function gerarApresentacao() {
    const html = markdownParaSlides(analise.conteudo, analise.nome_aluno, analise.created_at)
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

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

        {/* Grupo 2: Gerar Apresentação | Editar | Voltar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={gerarApresentacao}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-creme-dark text-petroleo text-sm font-medium hover:bg-offwhite transition-colors"
          >
            🎯 Gerar Apresentação
          </button>
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
