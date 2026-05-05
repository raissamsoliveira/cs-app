import {
  escHtml,
  boldHtml,
  renderTabelaHtml,
  renderConteudoHtml,
  logoHtml,
  buildSlidesHtml,
  type SlideEntry,
} from '@/lib/slides'

export interface PlanoSlideInput {
  nome_aluno: string
  tutora: string
  conteudo: string
  /** ISO string. Se não houver plano salvo (gerado em memória), use new Date().toISOString(). */
  createdAt: string
  /** Conteúdo Markdown da seção de Instagram (sem heading H1). Opcional. */
  analiseIG?: string | null
  /** Tipo da seção de IG — define o título da capa intermediária. */
  tipoIG?: 'analise' | 'planejamento' | null
}

const TITULO_IG: Record<'analise' | 'planejamento', string> = {
  analise: 'Análise Estratégica de Instagram',
  planejamento: 'Planejamento Estratégico de Instagram',
}

const isSepLinha = (l: string) => /^[\s|:\-]+$/.test(l)
const MAX_TASK_ROWS = 6

/** Constrói HTML de slides a partir do conteúdo Markdown do plano. */
export function planoParaSlides(plano: PlanoSlideInput): string {
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

    // Pula seção de Instagram (apresentação é só do plano de ação)
    if (tl.includes('instagram')) continue

    if (tl.includes('objetivo')) {
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
        slides.push({
          html: [
            '<h2 class="slide-titulo">' +
              boldHtml(bloco.titulo) +
              sufixoTitulo('(1/2)') +
              '</h2>',
            '<div class="slide-corpo">' + makeListaDir(h3Titulos.slice(0, 3)) + '</div>',
          ].join('\n'),
        })
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
      slides.push({
        html: [
          '<h2 class="slide-titulo">' + boldHtml(bloco.titulo) + '</h2>',
          '<div class="slide-corpo">' + renderConteudoHtml(bloco.linhas) + '</div>',
        ].join('\n'),
      })
    }
  }

  // ── Slides da seção de Instagram (se houver) ─────────────────────────────
  if (plano.analiseIG && plano.analiseIG.trim()) {
    const tipo: 'analise' | 'planejamento' =
      plano.tipoIG === 'planejamento' ? 'planejamento' : 'analise'

    // Capa intermediária dark
    slides.push({
      dark: true,
      html: [
        '<div class="capa">',
        logoHtml(),
        '<div class="capa-subtitulo-label">SEÇÃO COMPLEMENTAR</div>',
        '<div class="capa-nome">' + escHtml(TITULO_IG[tipo]) + '</div>',
        '<div class="capa-meta">' + escHtml(plano.nome_aluno) + '</div>',
        '</div>',
      ].join('\n'),
    })

    // Parse das seções H2 da análise IG
    type BlocoIG = { titulo: string; linhas: string[] }
    const blocosIG: BlocoIG[] = []
    let atualIG: BlocoIG | null = null
    for (const linha of plano.analiseIG.split('\n')) {
      const t = linha.trim()
      if (t.startsWith('## ')) {
        if (atualIG) blocosIG.push(atualIG)
        atualIG = { titulo: t.slice(3).trim(), linhas: [] }
      } else if (atualIG) {
        atualIG.linhas.push(linha)
      }
    }
    if (atualIG) blocosIG.push(atualIG)

    // Para cada bloco H2: 1 slide; se for tabela longa, quebra em chunks.
    for (const bloco of blocosIG) {
      const tblLinhas = bloco.linhas.filter((l) => l.trim().startsWith('|'))
      const ehTabelaPura =
        tblLinhas.length >= 2 &&
        bloco.linhas.filter((l) => l.trim()).every((l) => l.trim().startsWith('|'))

      if (ehTabelaPura) {
        const validas = tblLinhas.filter((l) => !isSepLinha(l))
        const [head, ...body] = validas
        const totalParts = Math.max(Math.ceil(body.length / MAX_TASK_ROWS), 1)
        for (let i = 0; i < totalParts; i++) {
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
      } else {
        // Conteúdo misto (parágrafos + eventual tabela): renderConteudoHtml lida com ambos
        slides.push({
          html: [
            '<h2 class="slide-titulo">' + boldHtml(bloco.titulo) + '</h2>',
            '<div class="slide-corpo">' + renderConteudoHtml(bloco.linhas) + '</div>',
          ].join('\n'),
        })
      }
    }
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
