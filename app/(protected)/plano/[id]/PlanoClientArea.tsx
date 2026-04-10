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
import {
  escHtml,
  boldHtml,
  renderTabelaHtml,
  renderConteudoHtml,
  logoHtml,
  buildSlidesHtml,
  type SlideEntry,
} from '@/lib/slides'

interface PlanoData {
  id: string
  nome_aluno: string
  tutora: string
  conteudo: string
  createdAt: string
  hasAnalise: boolean
}

// ── Gerador de slides do plano de ação ───────────────────────────────────────

const isSepLinha = (l: string) => /^[\s|:\-]+$/.test(l)
const MAX_TASK_ROWS = 6

function planoParaSlides(plano: PlanoData): string {
  // ── Parse apenas seções ## (não quebra em ### para manter sub-itens inline) ─
  type Bloco = { titulo: string; linhas: string[] }
  const blocos: Bloco[] = []
  let atual: Bloco | null = null

  for (const linha of plano.conteudo.split('\n')) {
    const t = linha.trim()
    if (t.startsWith('## ')) {
      if (atual) blocos.push(atual)
      atual = { titulo: t.slice(3).trim(), linhas: [] }
    } else if (atual) {
      atual.linhas.push(linha)
    }
  }
  if (atual) blocos.push(atual)

  // ── Build slides ────────────────────────────────────────────────────────────
  const slides: SlideEntry[] = []

  const dataFmt = new Date(plano.createdAt).toLocaleDateString('pt-BR', {
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
      '<div class="capa-subtitulo-label">PLANO DE A&Ccedil;&Atilde;O</div>',
      '<div class="capa-nome">' + escHtml(plano.nome_aluno) + '</div>',
      '<div class="capa-meta">Tutora: ' +
        escHtml(plano.tutora || '') +
        ' &middot; ' +
        dataFmt +
        '</div>',
      '<div class="capa-rodape">Mentoria Primus &middot; Ser Mais Criativo</div>',
      '</div>',
    ].join('\n'),
  })

  for (const bloco of blocos) {
    const tl = bloco.titulo.toLowerCase()

    // Pular seção de análise de Instagram (se existir no plano)
    if (tl.includes('instagram')) continue

    if (tl.includes('objetivo')) {
      // ── Slide: Principal Objetivo — fonte maior, centralizado se curto ─────
      const parts: string[] = []
      let tblBuf: string[] = []
      for (const raw of bloco.linhas) {
        const t = raw.trim()
        if (!t || t === '---') {
          if (tblBuf.length) { parts.push(renderTabelaHtml(tblBuf)); tblBuf = [] }
          continue
        }
        if (t.startsWith('|')) {
          tblBuf.push(t)
        } else {
          if (tblBuf.length) { parts.push(renderTabelaHtml(tblBuf)); tblBuf = [] }
          parts.push(
            '<p style="font-size:20px;line-height:1.8;color:#333">' + boldHtml(t) + '</p>',
          )
        }
      }
      if (tblBuf.length) parts.push(renderTabelaHtml(tblBuf))
      const objHtml = parts.join('\n')

      const textoPlain = bloco.linhas
        .filter((l) => l.trim() && l.trim() !== '---')
        .join(' ')
      const corpoStyle =
        textoPlain.length < 200 ? ' style="justify-content:center"' : ''

      slides.push({
        html: [
          '<h2 class="slide-titulo">' + boldHtml(bloco.titulo) + '</h2>',
          '<div class="slide-corpo"' + corpoStyle + '>',
          objHtml,
          '</div>',
        ].join('\n'),
      })
    } else if (tl.includes('direcion')) {
      // ── Slides: Principais Direcionamentos (até 3 por slide) ──────────────
      const h3Titulos = bloco.linhas
        .filter((l) => l.trim().startsWith('### '))
        .map((l) => l.trim().slice(4).trim())

      const liStyle =
        'style="font-size:18px;line-height:1.8;margin-bottom:12px"'

      function makeListaDir(titulos: string[]): string {
        return (
          '<ul class="dir-list">' +
          titulos.map((t) => '<li ' + liStyle + '>' + boldHtml(t) + '</li>').join('') +
          '</ul>'
        )
      }

      const sufixoTitulo = (part: string) =>
        ' <span style="font-size:16px;font-family:Poppins,sans-serif;opacity:.5;font-weight:400">' +
        part +
        '</span>'

      if (h3Titulos.length > 3) {
        // Slide A — primeiros 3
        slides.push({
          html: [
            '<h2 class="slide-titulo">' +
              boldHtml(bloco.titulo) +
              sufixoTitulo('(1/2)') +
              '</h2>',
            '<div class="slide-corpo">' + makeListaDir(h3Titulos.slice(0, 3)) + '</div>',
          ].join('\n'),
        })
        // Slide B — restantes
        slides.push({
          html: [
            '<h2 class="slide-titulo">' +
              boldHtml(bloco.titulo) +
              sufixoTitulo('(2/2)') +
              '</h2>',
            '<div class="slide-corpo">' + makeListaDir(h3Titulos.slice(3)) + '</div>',
          ].join('\n'),
        })
      } else {
        const listaHtml = h3Titulos.length
          ? makeListaDir(h3Titulos)
          : renderConteudoHtml(bloco.linhas)
        slides.push({
          html: [
            '<h2 class="slide-titulo">' + boldHtml(bloco.titulo) + '</h2>',
            '<div class="slide-corpo">' + listaHtml + '</div>',
          ].join('\n'),
        })
      }
    } else if (tl.includes('tarefa')) {
      // ── Slides de tarefas: quebra automática a cada MAX_TASK_ROWS ──────────
      const tblLinhas = bloco.linhas.filter((l) => l.trim().startsWith('|'))

      if (!tblLinhas.length) {
        slides.push({
          html: [
            '<h2 class="slide-titulo">' + boldHtml(bloco.titulo) + '</h2>',
            '<div class="slide-corpo">' + renderConteudoHtml(bloco.linhas) + '</div>',
          ].join('\n'),
        })
        continue
      }

      const validas = tblLinhas.filter((l) => !isSepLinha(l))
      const [head, ...body] = validas
      const totalParts = Math.ceil(body.length / MAX_TASK_ROWS)

      for (let i = 0; i < Math.max(totalParts, 1); i++) {
        const chunk = body.slice(i * MAX_TASK_ROWS, (i + 1) * MAX_TASK_ROWS)
        const tblHtml = renderTabelaHtml([head, ...chunk])

        const sufixo =
          totalParts > 1
            ? ' <span style="font-size:16px;font-family:Poppins,sans-serif;opacity:.5;font-weight:400">(' +
                (i + 1) +
                '/' +
                totalParts +
                ')</span>'
            : ''

        slides.push({
          html: [
            '<h2 class="slide-titulo">' + boldHtml(bloco.titulo) + sufixo + '</h2>',
            '<div class="slide-corpo">' + tblHtml + '</div>',
          ].join('\n'),
        })
      }
    } else if (tl.includes('suporte')) {
      // ── Slide: Suporte ─────────────────────────────────────────────────────
      slides.push({
        html: [
          '<h2 class="slide-titulo">' + boldHtml(bloco.titulo) + '</h2>',
          '<div class="slide-corpo">' + renderConteudoHtml(bloco.linhas) + '</div>',
        ].join('\n'),
      })
    }
    // Seções não reconhecidas são ignoradas (ex: separadores, notas internas)
  }

  // Slide final — Encerramento
  slides.push({
    dark: true,
    html: [
      '<div class="encerramento">',
      logoHtml(),
      '<div class="enc-sub">Ser Mais Criativo</div>',
      '<div class="enc-ano">Mentoria Primus &middot; 2026</div>',
      '</div>',
    ].join('\n'),
  })

  return buildSlidesHtml(slides, 'Plano de Ação — ' + plano.nome_aluno)
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function PlanoClientArea({ plano }: { plano: PlanoData }) {
  const router = useRouter()
  const [editMode, setEditMode] = useState(false)
  const [texto, setTexto] = useState(plano.conteudo)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  function gerarApresentacao() {
    const html = planoParaSlides(plano)
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

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
          <PlanoMarkdown conteudo={texto} />
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
          <CriarNotionBotao
            nomeAluno={plano.nome_aluno}
            tutora={plano.tutora}
            conteudo={plano.conteudo}
          />
          <BaixarPdfBotao nomeAluno={plano.nome_aluno} />
        </div>

        {/* Grupo 2: Gerar Apresentação | Editar Manualmente | Editar com IA */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={gerarApresentacao}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-creme-dark text-petroleo text-sm font-medium hover:bg-offwhite transition-colors"
          >
            🎯 Gerar Apresentação
          </button>
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
