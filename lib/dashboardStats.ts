/**
 * Helpers para cálculo de estatísticas do dashboard.
 * Recebem listas brutas (planos + alunos da planilha) e retornam
 * estruturas prontas pra renderizar em barras/timeline.
 */

export interface Plano {
  id: string
  created_at: string
  nome_aluno: string
  tutora: string | null
}

export interface AlunoRaw {
  [k: string]: string
}

export interface BarItem {
  label: string
  count: number
  key?: string
}

/** Gera ranking ordenado decrescente, top N + agrupa o resto em "Outros". */
export function ranking(
  itens: (string | null | undefined)[],
  topN = 10,
): BarItem[] {
  const map = new Map<string, number>()
  for (const it of itens) {
    const v = (it ?? '').trim()
    if (!v) continue
    map.set(v, (map.get(v) ?? 0) + 1)
  }
  const ordenado = [...map.entries()].sort((a, b) => b[1] - a[1])
  const top = ordenado.slice(0, topN)
  const restoCount = ordenado.slice(topN).reduce((s, [, c]) => s + c, 0)
  const result: BarItem[] = top.map(([label, count]) => ({ label, count }))
  if (restoCount > 0) result.push({ label: 'Outros', count: restoCount })
  return result
}

/** Agrupa planos por mês YYYY-MM (últimos N meses, completando vazios). */
export function planosPorMes(planos: Plano[], meses = 12): BarItem[] {
  const map = new Map<string, number>()
  for (const p of planos) {
    const d = new Date(p.created_at)
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    map.set(k, (map.get(k) ?? 0) + 1)
  }

  const result: BarItem[] = []
  const agora = new Date()
  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1)
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const labelMes = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    result.push({ label: labelMes.replace('.', ''), count: map.get(k) ?? 0, key: k })
  }
  return result
}

/** Faixas de faturamento — categoriza valores soltos em buckets. */
const FAIXAS_FAT = [
  { label: 'Até R$ 5k', test: /(?:até|menos de|abaixo de|0\b).*(?:5|3|2|1)\.?000|^r?\$?\s*(?:[01234]\.?\d{3})/i },
  { label: 'R$ 5k–10k', test: /5\.?000.*10\.?000|entre 5.*10|6\.000|7\.000|8\.000|9\.000/i },
  { label: 'R$ 10k–20k', test: /10\.?000.*20\.?000|entre 10.*20|15\.000|10 a 20|10 e 20/i },
  { label: 'R$ 20k–50k', test: /20\.?000.*50\.?000|20 a 50|30\.000|40\.000/i },
  { label: 'Acima de R$ 50k', test: /50\.?000|acima de 50|6 ou mais d[ií]gitos|6 d[ií]gitos|seis d[ií]gitos|100\.?000/i },
]

export function categorizarFaturamento(valor: string): string | null {
  const v = (valor ?? '').toLowerCase().trim()
  if (!v) return null
  for (const faixa of FAIXAS_FAT) {
    if (faixa.test.test(v)) return faixa.label
  }
  return 'Não categorizado'
}

/**
 * Distribuição de faturamento atual vs desejado (em pares por faixa).
 * Retorna lista ordenada pelas faixas conhecidas.
 */
export interface FaturamentoPar {
  faixa: string
  atual: number
  desejado: number
}

const ORDEM_FAIXAS = [
  'Até R$ 5k',
  'R$ 5k–10k',
  'R$ 10k–20k',
  'R$ 20k–50k',
  'Acima de R$ 50k',
  'Não categorizado',
]

export function faturamentoComparativo(alunos: AlunoRaw[]): FaturamentoPar[] {
  const atual = new Map<string, number>()
  const desejado = new Map<string, number>()

  for (const a of alunos) {
    const fa = categorizarFaturamento(a['Faturmento médio mensal atual:'] ?? '')
    if (fa) atual.set(fa, (atual.get(fa) ?? 0) + 1)
    const fd = categorizarFaturamento(
      a['Faturamento médio mensal desejado após o ciclo da mentoria:'] ?? '',
    )
    if (fd) desejado.set(fd, (desejado.get(fd) ?? 0) + 1)
  }

  return ORDEM_FAIXAS.filter(
    (f) => (atual.get(f) ?? 0) > 0 || (desejado.get(f) ?? 0) > 0,
  ).map((faixa) => ({
    faixa,
    atual: atual.get(faixa) ?? 0,
    desejado: desejado.get(faixa) ?? 0,
  }))
}
