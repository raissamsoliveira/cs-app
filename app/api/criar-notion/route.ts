import { Client } from '@notionhq/client'
import type {
  BlockObjectRequest,
  RichTextItemRequest,
} from '@notionhq/client/build/src/api-endpoints'

/**
 * POST /api/criar-notion
 *
 * Estrutura da página criada no Notion:
 *  - heading_2:  "PLANO DE AÇÃO — Nome"
 *  - callout 🎯 target_green       blue_background:   Principal Objetivo
 *  - callout 📍 map-pin_green      yellow_background: Principais Direcionamentos (toggles)
 *  - callout ✅ checklist_green    green_background:  Tarefas (tabela nativa)
 *  - callout 💬 speech-bubble_green default:          Suporte e demais seções
 *
 * Todos os callouts usam:
 *  - rich_text vazio no callout em si
 *  - heading_3 como primeiro filho (título da seção)
 *  - icone external SVG (cor green) em vez de emoji
 */

const notion = new Client({ auth: process.env.NOTION_TOKEN })

/* ─────────────────────────────────────────────────────────────────────────── */
/* Tipos locais não exportados pelo SDK                                         */
/* ─────────────────────────────────────────────────────────────────────────── */

type TableRowBlock = {
  object: 'block'
  type: 'table_row'
  table_row: { cells: RichTextItemRequest[][] }
}

/** Tipos de seção identificados pelo heading # e ## */
type TipoSecao =
  | 'inicio'                   // conteúdo antes do primeiro heading
  | 'h1'                       // # Heading 1  (título principal do plano)
  | 'callout-objetivo'         // ## 🎯 …
  | 'callout-direcionamentos'  // ## 📍 …
  | 'callout-tarefas'          // ## ✅ …
  | 'normal'                   // ## 💬 … e demais

interface Secao {
  tipo: TipoSecao
  tituloRaw: string  // texto do heading sem o prefixo # / ##
  linhas: string[]   // linhas de conteúdo que seguem o heading
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Rich text inline — parseia **negrito**                                       */
/* ─────────────────────────────────────────────────────────────────────────── */

function parsearRichText(texto: string): RichTextItemRequest[] {
  const partes: RichTextItemRequest[] = []
  const regex = /\*\*(.*?)\*\*/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(texto)) !== null) {
    if (match.index > lastIndex) {
      partes.push({ type: 'text', text: { content: texto.slice(lastIndex, match.index) } })
    }
    partes.push({
      type: 'text',
      text: { content: match[1] },
      annotations: { bold: true },
    })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < texto.length) {
    partes.push({ type: 'text', text: { content: texto.slice(lastIndex) } })
  }
  return partes.length > 0 ? partes : [{ type: 'text', text: { content: texto } }]
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Tabela markdown → bloco table do Notion                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

function isSeparador(linha: string) {
  return /^[\s|:\-]+$/.test(linha.trim())
}

function celulas(linha: string): string[] {
  return linha.trim().split('|').slice(1, -1).map((c) => c.trim())
}

function criarBlocoTabela(linhas: string[]): BlockObjectRequest {
  const validas = linhas.filter((l) => !isSeparador(l))
  const largura = Math.max(...validas.map((l) => celulas(l).length))

  const rows: TableRowBlock[] = validas.map((linha) => {
    const cols = celulas(linha)
    while (cols.length < largura) cols.push('')
    return {
      object: 'block',
      type: 'table_row',
      table_row: { cells: cols.map((cel) => parsearRichText(cel)) },
    }
  })

  return {
    object: 'block',
    type: 'table',
    table: { table_width: largura, has_column_header: true, has_row_header: false, children: rows },
  } as unknown as BlockObjectRequest
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Conversor base: linhas → blocos Notion                                       */
/* ─────────────────────────────────────────────────────────────────────────── */

function linhasParaBlocos(linhas: string[]): BlockObjectRequest[] {
  const blocos: BlockObjectRequest[] = []
  let i = 0

  while (i < linhas.length) {
    const trimmed = linhas[i].trim()

    if (!trimmed) {
      blocos.push({ object: 'block', type: 'paragraph', paragraph: { rich_text: [] } })
      i++
      continue
    }

    if (trimmed.startsWith('### ')) {
      blocos.push({
        object: 'block',
        type: 'heading_3',
        heading_3: { rich_text: parsearRichText(trimmed.slice(4).trim()) },
      })
      i++
      continue
    }

    // Tabela — agrupa linhas consecutivas com |
    if (trimmed.startsWith('|') && trimmed.includes('|', 1)) {
      const grupo: string[] = []
      while (i < linhas.length && linhas[i].trim().startsWith('|')) grupo.push(linhas[i++])
      blocos.push(criarBlocoTabela(grupo))
      continue
    }

    blocos.push({
      object: 'block',
      type: 'paragraph',
      paragraph: { rich_text: parsearRichText(trimmed) },
    })
    i++
  }

  return blocos
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Conversor para seção Principais Direcionamentos                              */
/* Cada tópico cujo parágrafo começa com **negrito** vira um bloco toggle.      */
/* ─────────────────────────────────────────────────────────────────────────── */

function linhasParaBlocosDirecionamentos(linhas: string[]): BlockObjectRequest[] {
  type Grupo = { titulo: RichTextItemRequest[]; corpo: string[] }

  const grupos: Grupo[] = []
  const preContent: string[] = []
  let atual: Grupo | null = null

  for (const linha of linhas) {
    const trimmed = linha.trim()
    const match = trimmed.match(/^\*\*([^*]+)\*\*:?\s*(.*)$/)

    if (match) {
      if (atual) grupos.push(atual)
      const tituloTexto = match[1].replace(/:$/, '').trim()
      const restoNaLinha = match[2].trim()
      atual = {
        titulo: [{ type: 'text', text: { content: tituloTexto }, annotations: { bold: true } }],
        corpo: restoNaLinha ? [restoNaLinha] : [],
      }
    } else if (atual) {
      atual.corpo.push(linha)
    } else {
      preContent.push(linha)
    }
  }

  if (atual) grupos.push(atual)

  return [
    ...linhasParaBlocos(preContent),
    ...grupos.map((g) => {
      const children = linhasParaBlocos(g.corpo).filter(
        (b) => b.type !== 'paragraph' || (b as { paragraph: { rich_text: unknown[] } }).paragraph.rich_text.length > 0
      )
      return {
        object: 'block',
        type: 'toggle',
        toggle: {
          rich_text: g.titulo,
          ...(children.length > 0 && { children }),
        },
      } as unknown as BlockObjectRequest
    }),
  ]
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Parser de seções — agrupa linhas por heading # e ##                          */
/* ─────────────────────────────────────────────────────────────────────────── */

function getTipoSecao(titulo: string): TipoSecao {
  if (titulo.startsWith('🎯')) return 'callout-objetivo'
  if (titulo.startsWith('📍')) return 'callout-direcionamentos'
  if (titulo.startsWith('✅')) return 'callout-tarefas'
  return 'normal'
}

function parseSecoes(texto: string): Secao[] {
  const linhas = texto.split('\n')
  const secoes: Secao[] = []
  let atual: Secao = { tipo: 'inicio', tituloRaw: '', linhas: [] }

  const flush = () => {
    if (atual.tituloRaw || atual.linhas.some((l) => l.trim())) secoes.push(atual)
  }

  for (const linha of linhas) {
    const t = linha.trim()

    if (t.startsWith('# ') && !t.startsWith('## ')) {
      flush()
      atual = { tipo: 'h1', tituloRaw: t.slice(2).trim(), linhas: [] }
      continue
    }
    if (t.startsWith('## ')) {
      flush()
      const tituloRaw = t.slice(3).trim()
      atual = { tipo: getTipoSecao(tituloRaw), tituloRaw, linhas: [] }
      continue
    }

    atual.linhas.push(linha)
  }

  flush()
  return secoes
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Remove emoji inicial do título (fica no ícone externo do callout)            */
/* ─────────────────────────────────────────────────────────────────────────── */

function semEmoji(titulo: string) {
  return titulo.replace(/^\p{Emoji_Presentation}\s*/u, '').trim()
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Converte todas as seções em blocos Notion                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

function converterSecoes(secoes: Secao[]): BlockObjectRequest[] {
  const blocos: BlockObjectRequest[] = []

  for (const secao of secoes) {
    switch (secao.tipo) {
      case 'inicio':
        blocos.push(...linhasParaBlocos(secao.linhas))
        break

      // # Título principal → heading_2
      case 'h1':
        blocos.push({
          object: 'block',
          type: 'heading_2',
          heading_2: { rich_text: parsearRichText(secao.tituloRaw) },
        })
        blocos.push(...linhasParaBlocos(secao.linhas))
        break

      // ## 🎯 Principal Objetivo → callout azul com ícone target
      case 'callout-objetivo': {
        const titulo: BlockObjectRequest = {
          object: 'block',
          type: 'heading_3',
          heading_3: { rich_text: parsearRichText(semEmoji(secao.tituloRaw)) },
        }
        const conteudo = linhasParaBlocos(secao.linhas)
        blocos.push({
          object: 'block',
          type: 'callout',
          callout: {
            rich_text: [],
            icon: { type: 'external', external: { url: 'https://www.notion.so/icons/target_green.svg' } },
            color: 'blue_background',
            children: [titulo, ...conteudo],
          },
        } as unknown as BlockObjectRequest)
        break
      }

      // ## 📍 Principais Direcionamentos → callout amarelo com ícone map-pin + toggles
      case 'callout-direcionamentos': {
        const titulo: BlockObjectRequest = {
          object: 'block',
          type: 'heading_3',
          heading_3: { rich_text: parsearRichText(semEmoji(secao.tituloRaw)) },
        }
        const conteudo = linhasParaBlocosDirecionamentos(secao.linhas)
        blocos.push({
          object: 'block',
          type: 'callout',
          callout: {
            rich_text: [],
            icon: { type: 'external', external: { url: 'https://www.notion.so/icons/map-pin_green.svg' } },
            color: 'yellow_background',
            children: [titulo, ...conteudo],
          },
        } as unknown as BlockObjectRequest)
        break
      }

      // ## ✅ Tarefas → callout verde com ícone checklist + tabela nativa
      // A tabela inclui todas as 4 colunas: Tarefa | Ação | Status | Direcionamentos da tutora
      case 'callout-tarefas': {
        const titulo: BlockObjectRequest = {
          object: 'block',
          type: 'heading_3',
          heading_3: { rich_text: parsearRichText(semEmoji(secao.tituloRaw)) },
        }
        const linhasTabela = secao.linhas.filter((l) => l.trim().startsWith('|'))
        const children: BlockObjectRequest[] = [titulo]
        if (linhasTabela.length > 0) {
          children.push(criarBlocoTabela(linhasTabela))
        }
        blocos.push({
          object: 'block',
          type: 'callout',
          callout: {
            rich_text: [],
            icon: { type: 'external', external: { url: 'https://www.notion.so/icons/checklist_green.svg' } },
            color: 'green_background',
            children,
          },
        } as unknown as BlockObjectRequest)
        break
      }

      // ## 💬 Suporte e demais → callout com ícone speech-bubble
      case 'normal': {
        const titulo: BlockObjectRequest = {
          object: 'block',
          type: 'heading_3',
          heading_3: { rich_text: parsearRichText(semEmoji(secao.tituloRaw)) },
        }
        const conteudo = linhasParaBlocos(secao.linhas)
        blocos.push({
          object: 'block',
          type: 'callout',
          callout: {
            rich_text: [],
            icon: { type: 'external', external: { url: 'https://www.notion.so/icons/speech-bubble_green.svg' } },
            color: 'default',
            children: [titulo, ...conteudo],
          },
        } as unknown as BlockObjectRequest)
        break
      }
    }
  }

  return blocos
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Route handler                                                                */
/* ─────────────────────────────────────────────────────────────────────────── */

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nomeAluno, conteudo } = body as {
      nomeAluno: string
      tutora: string  // recebido mas não usado nas propriedades Notion
      conteudo: string
    }

    if (!nomeAluno || !conteudo) {
      return Response.json({ error: 'Campos obrigatórios: nomeAluno, conteudo.' }, { status: 400 })
    }
    if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) {
      return Response.json(
        { error: 'Variáveis NOTION_TOKEN e NOTION_DATABASE_ID não configuradas.' },
        { status: 500 }
      )
    }

    const secoes = parseSecoes(conteudo)
    const blocos = converterSecoes(secoes)

    // Cria a página com até 100 blocos (limite da API do Notion)
    const page = await notion.pages.create({
      parent: { database_id: process.env.NOTION_DATABASE_ID },
      properties: {
        Aluno: {
          title: [{ type: 'text', text: { content: `Plano de Ação | ${nomeAluno}` } }],
        },
        Status: { status: { name: 'Não iniciada' } },
      },
      children: blocos.slice(0, 100),
    })

    const pageId = (page as { id: string }).id

    // Appenda blocos excedentes se necessário
    if (blocos.length > 100) {
      await notion.blocks.children.append({
        block_id: pageId,
        children: blocos.slice(100, 200),
      })
    }

    return Response.json({ url: (page as { url: string }).url })
  } catch (err) {
    console.error('[criar-notion]', err)
    const message = err instanceof Error ? err.message : 'Erro interno do servidor.'
    return Response.json({ error: message }, { status: 500 })
  }
}
