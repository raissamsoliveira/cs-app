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
  const { data: plano, error } = await supabase
    .from('planos')
    .select('id, nome_aluno, tutora, created_at, conteudo')
    .eq('id', id)
    .single()

  if (error || !plano) {
    notFound()
  }

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

        {/* Conteúdo */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#f7e4ca] p-6 mb-10">
          <PlanoMarkdown conteudo={plano.conteudo} />
        </div>

        {/* Rodapé */}
        <div className="text-center py-4 border-t border-[#f7e4ca]">
          <p className="text-[#05343d]/40 text-sm">Mentoria Primus · Ser Mais Criativo</p>
        </div>

      </div>
    </div>
  )
}
