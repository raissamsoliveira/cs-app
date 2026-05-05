import { createClient } from '@/lib/supabase/server'
import { getAllAlunos } from '@/lib/planilha'
import {
  ranking,
  planosPorMes,
  faturamentoComparativo,
  type Plano,
  type AlunoRaw,
} from '@/lib/dashboardStats'
import DashboardClientArea, { type DashboardData } from './DashboardClientArea'

export const dynamic = 'force-dynamic'

interface PadroesIGCache {
  categorias: { nome: string; count: number; exemplos: string[] }[]
  totalAnalises: number
  atualizadoEm: string
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { data: planos },
    { data: analises },
    { data: tutoras },
    alunosRaw,
    { data: cacheRow },
  ] = await Promise.all([
    supabase
      .from('planos')
      .select('id, created_at, nome_aluno, tutora')
      .order('created_at', { ascending: false }),
    supabase.from('analises_instagram').select('id, created_at'),
    supabase.from('tutoras').select('id').eq('ativa', true),
    getAllAlunos().catch(() => [] as AlunoRaw[]),
    supabase.from('analytics_cache').select('valor').eq('key', 'padroes_ig').maybeSingle(),
  ])

  const listaPlanos: Plano[] = planos ?? []

  // Cruza alunos da planilha com os que têm planos (por nome)
  const nomesComPlano = new Set(
    listaPlanos.map((p) => (p.nome_aluno ?? '').toLowerCase().trim()),
  )
  const alunosComPlano = (alunosRaw ?? []).filter((a) =>
    nomesComPlano.has((a['Nome completo'] ?? '').toLowerCase().trim()),
  )

  // Agrega: profissões / áreas / tutoras / mês / faturamento
  const profissoes = ranking(
    alunosComPlano.map((a) => a['Qual sua profissão atual?']),
    10,
  )
  const areas = ranking(
    alunosComPlano.map((a) => a['Área de atuação:']),
    10,
  )
  const rankingTutoras = ranking(
    listaPlanos.map((p) => p.tutora),
    20,
  )
  const timelinePlanos = planosPorMes(listaPlanos, 12)
  const faturamento = faturamentoComparativo(alunosComPlano)

  const totalPlanos = listaPlanos.length
  const totalAnalises = analises?.length ?? 0
  const totalTutorasAtivas = tutoras?.length ?? 0

  const agora = new Date()
  const planosEsteMes = listaPlanos.filter((p) => {
    const d = new Date(p.created_at)
    return d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear()
  }).length

  const dados: DashboardData = {
    kpis: {
      totalPlanos,
      totalAnalises,
      totalTutorasAtivas,
      planosEsteMes,
    },
    profissoes,
    areas,
    rankingTutoras,
    timelinePlanos,
    planosDates: listaPlanos.map((p) => p.created_at),
    faturamento,
    padroesIG: (cacheRow?.valor as PadroesIGCache | null) ?? null,
  }

  return <DashboardClientArea data={dados} />
}
