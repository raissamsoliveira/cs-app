import { unstable_cache } from 'next/cache'

const SHEET_URL = `https://docs.google.com/spreadsheets/d/${process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv`

/** Parser RFC 4180 — suporta campos com vírgulas, aspas e quebras de linha */
function parseCSV(text: string): Record<string, string>[] {
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

  if (rows.length < 2) return []

  const headers = rows[0].map((h) => h.trim())
  return rows.slice(1).map((row) => {
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => {
      obj[h] = (row[i] ?? '').trim()
    })
    return obj
  })
}

/** Busca e parseia todos os alunos da planilha — cacheado por 5 minutos */
export const getAllAlunos = unstable_cache(
  async (): Promise<Record<string, string>[]> => {
    const res = await fetch(SHEET_URL)
    if (!res.ok) throw new Error(`Erro ao buscar planilha: ${res.status}`)
    const text = await res.text()
    return parseCSV(text)
  },
  ['alunos-planilha'],
  { revalidate: 300 }
)
