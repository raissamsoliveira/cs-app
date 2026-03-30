import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import HistoricoClientArea, { type ItemHistorico } from './HistoricoClientArea'

export default async function HistoricoPage() {
  const supabase = await createClient()

  // Busca paralela nas duas tabelas
  const [{ data: planos }, { data: analises }, { data: todasTutoras }] = await Promise.all([
    supabase
      .from('planos')
      .select('id, created_at, nome_aluno, tutora, conteudo')
      .order('created_at', { ascending: false }),
    supabase
      .from('analises_instagram')
      .select('id, created_at, nome_aluno, conteudo, tutora')
      .order('created_at', { ascending: false }),
    supabase.from('planos').select('tutora').order('tutora'),
  ])

  const tutoras = [...new Set((todasTutoras ?? []).map((p) => p.tutora))]

  const itensPlanos: ItemHistorico[] = (planos ?? []).map((p) => ({
    id: p.id,
    tipo: 'plano',
    created_at: p.created_at,
    nome: p.nome_aluno,
    tutora: p.tutora,
    preview: p.conteudo.slice(0, 80),
  }))

  const itensAnalises: ItemHistorico[] = (analises ?? []).map((a) => ({
    id: a.id,
    tipo: 'analise',
    created_at: a.created_at,
    nome: a.nome_aluno ?? '—',
    tutora: a.tutora ?? null,
    preview: a.conteudo.slice(0, 80),
  }))

  // Merge ordenado por data decrescente
  const todos = [...itensPlanos, ...itensAnalises].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Título */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-playfair text-3xl text-petroleo font-semibold">Histórico</h1>
        <Link
          href="/novo-plano"
          className="bg-petroleo text-creme px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-petroleo-light transition-colors"
        >
          + Novo Plano
        </Link>
      </div>

      {/* Filtros + tabela (cliente) */}
      <HistoricoClientArea todos={todos} tutoras={tutoras} />
    </div>
  )
}
