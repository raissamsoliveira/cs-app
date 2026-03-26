import { Client } from '@notionhq/client'
import type {
  BlockObjectRequest,
  RichTextItemRequest,
} from '@notionhq/client/build/src/api-endpoints'

// O SDK não exporta este tipo separadamente — definido localmente
type TableRowBlock = {
  object: 'block'
  type: 'table_row'
  table_row: { cells: RichTextItemRequest[][] }
}

/**
 * POST /api/criar-notion
 * Cria uma página no banco de dados Notion com o plano de ação.
 *
 * Propriedades do banco:
 *  - "Aluno"  → título da página  (title)
 *  - "Status" → status da página  (status, padrão: "Não iniciada")
 *
 * Body:    { nomeAluno: string, tutora: string, conteudo: string }
 * Response: { url: string }
 */

const notion = new Client({ auth: process.env.NOTION_TOKEN })

/* -------------------------------------------------------------------------- */
/* Rich text inline — parseia **negrito**                                      */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Tabela — converte linhas markdown em bloco table do Notion                 */
/* -------------------------------------------------------------------------- */

function isSeparador(linha: string) {
  // Detecta linha separadora: |---|---| ou | :--- | :---: |
  return /^[\s|:\-]+$/.test(linha.trim())
}

function celulas(linha: string): string[] {
  return linha
    .trim()
    .split('|')
    .slice(1, -1)
    .map((c) => c.trim())
}

function criarBlocoTabela(linhas: string[]): BlockObjectRequest {
  const linhasValidas = linhas.filter((l) => !isSeparador(l))

  // Descobre a largura pela linha com mais colunas (garante consistência)
  const largura = Math.max(...linhasValidas.map((l) => celulas(l).length))

  const rows: TableRowBlock[] = linhasValidas.map((linha) => {
    const cols = celulas(linha)
    // Preenche colunas faltantes para manter largura uniforme
    while (cols.length < largura) cols.push('')

    return {
      object: 'block',
      type: 'table_row',
      table_row: {
        cells: cols.map((cel) => parsearRichText(cel)),
      },
    }
  })

  return {
    object: 'block',
    type: 'table',
    table: {
      table_width: largura,
      has_column_header: true,  // primeira linha é o cabeçalho
      has_row_header: false,
      children: rows,
    },
  } as unknown as BlockObjectRequest
  // Cast necessário porque o tipo BlockObjectRequest do SDK não inclui
  // children dentro de table (mas a API aceita na criação de página).
}

/* -------------------------------------------------------------------------- */
/* Converter texto markdown em blocos Notion                                  */
/* -------------------------------------------------------------------------- */

function converterParaBlocos(texto: string): BlockObjectRequest[] {
  const linhas = texto.split('\n')
  const blocos: BlockObjectRequest[] = []
  let i = 0

  while (i < linhas.length) {
    const trimmed = linhas[i].trim()

    // Linha vazia
    if (!trimmed) {
      blocos.push({ object: 'block', type: 'paragraph', paragraph: { rich_text: [] } })
      i++
      continue
    }

    // Heading 1  →  # Texto
    if (trimmed.startsWith('# ')) {
      blocos.push({
        object: 'block',
        type: 'heading_1',
        heading_1: { rich_text: parsearRichText(trimmed.slice(2).trim()) },
      })
      i++
      continue
    }

    // Heading 2  →  ## Texto
    if (trimmed.startsWith('## ')) {
      blocos.push({
        object: 'block',
        type: 'heading_2',
        heading_2: { rich_text: parsearRichText(trimmed.slice(3).trim()) },
      })
      i++
      continue
    }

    // Heading 3  →  ### Texto
    if (trimmed.startsWith('### ')) {
      blocos.push({
        object: 'block',
        type: 'heading_3',
        heading_3: { rich_text: parsearRichText(trimmed.slice(4).trim()) },
      })
      i++
      continue
    }

    // Tabela  →  agrupa todas as linhas consecutivas com |
    if (trimmed.startsWith('|') && trimmed.includes('|', 1)) {
      const linhasTabela: string[] = []
      while (i < linhas.length && linhas[i].trim().startsWith('|')) {
        linhasTabela.push(linhas[i])
        i++
      }
      blocos.push(criarBlocoTabela(linhasTabela))
      continue
    }

    // Parágrafo comum
    blocos.push({
      object: 'block',
      type: 'paragraph',
      paragraph: { rich_text: parsearRichText(trimmed) },
    })
    i++
  }

  return blocos
}

/* -------------------------------------------------------------------------- */
/* Route handler                                                               */
/* -------------------------------------------------------------------------- */

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nomeAluno, conteudo } = body as {
      nomeAluno: string
      tutora: string   // recebido mas não enviado ao Notion (banco não tem essa propriedade)
      conteudo: string
    }

    if (!nomeAluno || !conteudo) {
      return Response.json(
        { error: 'Campos obrigatórios: nomeAluno, conteudo.' },
        { status: 400 }
      )
    }

    if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) {
      return Response.json(
        { error: 'Variáveis NOTION_TOKEN e NOTION_DATABASE_ID não configuradas.' },
        { status: 500 }
      )
    }

    // A API do Notion aceita até 100 blocos por requisição.
    // Tabelas contam como 1 bloco (as linhas são children inline).
    const blocos = converterParaBlocos(conteudo).slice(0, 100)

    const page = await notion.pages.create({
      parent: { database_id: process.env.NOTION_DATABASE_ID },
      properties: {
        // Título da página — propriedade "Aluno" (tipo title)
        Aluno: {
          title: [
            {
              type: 'text',
              text: { content: `Plano de Ação | ${nomeAluno}` },
            },
          ],
        },
        // Status — propriedade tipo status, valor padrão do banco
        Status: {
          status: { name: 'Não iniciada' },
        },
      },
      children: blocos,
    })

    return Response.json({ url: (page as { url: string }).url })
  } catch (err) {
    console.error('[criar-notion]', err)
    const message = err instanceof Error ? err.message : 'Erro interno do servidor.'
    return Response.json({ error: message }, { status: 500 })
  }
}
