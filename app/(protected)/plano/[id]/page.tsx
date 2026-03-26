import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import CopiarBotao from './CopiarBotao'
import CriarNotionBotao from './CriarNotionBotao'
import PlanoMarkdown from '@/components/PlanoMarkdown'

/**
 * Visualização completa de um plano de ação.
 * params é async no Next.js 16 — sempre usar await.
 */
export default async function PlanoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: plano, error } = await supabase
    .from('planos')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !plano) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-petroleo/50 mb-6">
        <Link href="/historico" className="hover:text-petroleo transition-colors">
          Histórico
        </Link>
        <span>/</span>
        <span className="text-petroleo">{plano.nome_aluno}</span>
      </div>

      {/* Cabeçalho */}
      <div className="bg-petroleo rounded-2xl p-6 mb-6 text-creme">
        <h1 className="font-playfair text-2xl font-semibold mb-3">
          Plano de Ação — {plano.nome_aluno}
        </h1>
        <div className="flex flex-wrap gap-4 text-sm text-creme/70">
          <span>
            <span className="font-medium text-creme">Tutora:</span> {plano.tutora}
          </span>
          <span>
            <span className="font-medium text-creme">Criado em:</span>{' '}
            {new Date(plano.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Conteúdo do plano renderizado com markdown */}
      <div className="bg-white rounded-2xl shadow-sm border border-creme p-6 mb-6">
        <PlanoMarkdown conteudo={plano.conteudo} />
      </div>

      {/* Ações */}
      <div className="flex flex-col sm:flex-row gap-3">
        <CopiarBotao conteudo={plano.conteudo} />
        <CriarNotionBotao
          nomeAluno={plano.nome_aluno}
          tutora={plano.tutora}
          conteudo={plano.conteudo}
        />
        <Link
          href="/historico"
          className="flex-1 flex items-center justify-center px-5 py-2.5 rounded-xl border border-creme-dark text-petroleo text-sm font-medium hover:bg-offwhite transition-colors"
        >
          ← Voltar ao Histórico
        </Link>
      </div>
    </div>
  )
}
