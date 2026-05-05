import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import PlanoMarkdown from '@/components/PlanoMarkdown'

function criarClientePublico() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export default async function PlanoPublicoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = criarClientePublico()

  const [{ data: plano, error }, { data: analiseRows }] = await Promise.all([
    supabase
      .from('planos')
      .select('id, nome_aluno, tutora, created_at, conteudo, analise_instagram')
      .eq('id', id)
      .single(),
    supabase
      .from('analises_instagram')
      .select('conteudo, tipo')
      .eq('plano_id', id)
      .order('created_at', { ascending: false })
      .limit(1),
  ])

  if (error || !plano) {
    notFound()
  }

  const analiseNova = analiseRows && analiseRows.length > 0 ? analiseRows[0] : null
  const analiseIG: string | null =
    analiseNova?.conteudo ?? plano.analise_instagram ?? null
  const tipoIG: 'analise' | 'planejamento' | null = analiseNova
    ? analiseNova.tipo === 'planejamento'
      ? 'planejamento'
      : 'analise'
    : null

  const dataCriacao = new Date(plano.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-[#f5f5f5]" style={{ fontFamily: 'Poppins, sans-serif' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Identidade */}
        <div className="flex items-center gap-2 mb-8">
          <span
            className="text-lg font-semibold text-[#05343d]"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Primus CS
          </span>
          <span className="text-[#05343d]/40 text-sm">— Ser Mais Criativo</span>
        </div>

        {/* Cabeçalho do plano */}
        <div className="bg-[#05343d] rounded-2xl p-6 mb-6">
          <h1
            className="text-2xl font-semibold mb-3 text-[#f7e4ca]"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Plano de Ação — {plano.nome_aluno}
          </h1>
          <div className="flex flex-wrap gap-4 text-sm text-[#f7e4ca]/70">
            <span>
              <span className="font-medium text-[#f7e4ca]">Tutora:</span> {plano.tutora}
            </span>
            <span>
              <span className="font-medium text-[#f7e4ca]">Criado em:</span> {dataCriacao}
            </span>
          </div>
        </div>

        {/* Conteúdo: plano + (opcional) análise de Instagram */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#f7e4ca] p-6 mb-10 space-y-6">
          <PlanoMarkdown conteudo={plano.conteudo} />

          {analiseIG && (
            <>
              <div className="my-8 pt-6 border-t-2 border-[#e8c99a]">
                <p className="text-xs uppercase tracking-wider text-[#05343d]/50 font-medium mb-1">
                  Seção complementar
                </p>
                <h3
                  className="text-2xl font-semibold text-[#05343d]"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  {tipoIG === 'planejamento'
                    ? 'Planejamento Estratégico de Instagram'
                    : 'Análise Estratégica de Instagram'}
                </h3>
              </div>
              <PlanoMarkdown conteudo={analiseIG} />
            </>
          )}
        </div>

        {/* Rodapé */}
        <div className="text-center py-4 border-t border-[#f7e4ca]">
          <p className="text-[#05343d]/40 text-sm">Mentoria Primus · Ser Mais Criativo</p>
        </div>

      </div>
    </div>
  )
}
