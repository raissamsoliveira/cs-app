import { unstable_cache } from 'next/cache'

const SHEET_URL = `https://docs.google.com/spreadsheets/d/${process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv`

/** Parser RFC 4180 — suporta campos com vírgulas, aspas e quebras de linha */
function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const rows: string[][] = []
  let current: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        current.push(field)
        field = ''
      } else if (ch === '\r') {
        // ignorar
      } else if (ch === '\n') {
        current.push(field)
        rows.push(current)
        current = []
        field = ''
      } else {
        field += ch
      }
    }
  }

  if (field !== '' || current.length > 0) {
    current.push(field)
    if (current.some((f) => f !== '')) rows.push(current)
  }

  if (rows.length < 2) return { headers: [], rows: [] }

  const headers = rows[0].map((h) => h.trim())
  return { headers, rows: rows.slice(1) }
}

/**
 * Localiza o índice da coluna do nome de forma tolerante:
 * - prioridade: cabeçalho exato "Nome completo"
 * - fallback 1: qualquer cabeçalho que contenha "nome" (case-insensitive)
 * - fallback 2: coluna B (índice 1) — convenção do Google Forms
 */
function detectarIndiceNome(headers: string[]): number {
  const exato = headers.findIndex((h) => h.trim().toLowerCase() === 'nome completo')
  if (exato >= 0) return exato
  const contemNome = headers.findIndex((h) => /nome/i.test(h))
  if (contemNome >= 0) return contemNome
  return Math.min(1, headers.length - 1)
}

/** Busca e parseia todos os alunos da planilha — cacheado por 5 minutos */
export const getAllAlunos = unstable_cache(
  async (): Promise<Record<string, string>[]> => {
    const res = await fetch(SHEET_URL)
    if (!res.ok) {
      throw new Error(`Erro ao buscar planilha: ${res.status}`)
    }
    const text = await res.text()
    const { headers, rows } = parseCSV(text)
    if (rows.length === 0) return []

    const idxNome = detectarIndiceNome(headers)
    const cabecalhoOriginalNome = headers[idxNome]

    if (cabecalhoOriginalNome !== 'Nome completo') {
      console.warn(
        `[planilha] Coluna "${cabecalhoOriginalNome}" (índice ${idxNome}) será tratada como "Nome completo". ` +
        `Para corrigir, ajuste o cabeçalho da planilha para "Nome completo".`,
      )
    }

    return rows.map((row) => {
      const obj: Record<string, string> = {}
      headers.forEach((h, i) => {
        obj[h] = (row[i] ?? '').trim()
      })
      // Garante que a chave "Nome completo" exista, mesmo que o cabeçalho original seja outro.
      if (!obj['Nome completo']) {
        obj['Nome completo'] = (row[idxNome] ?? '').trim()
      }
      return obj
    })
  },
  ['alunos-planilha'],
  { revalidate: 300 }
)
