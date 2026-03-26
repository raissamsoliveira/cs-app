import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import PlanoMarkdown from '@/components/PlanoMarkdown'

/**
 * Página pública do plano de ação — acessível sem autenticação.
 * URL: /p/[id]
 *
 * Requer a policy Supabase: CREATE POLICY "Leitura pública dos planos"
 *   ON planos FOR SELECT USING (true);
 */

// Cliente anon — sem cookies de sessão. Funciona com a policy pública USING (true).
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
    <div className="min-h-screen bg-offwhite">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Identidade */}
        <div className="flex items-center gap-2 mb-6">
          <span className="font-playfair text-lg font-semibold text-petroleo">Primus CS</span>
          <span className="text-petroleo/40 text-sm">— Ser Mais Criativo</span>
        </div>

        {/* Cabeçalho do plano */}
        <div className="bg-petroleo rounded-2xl p-6 mb-6 text-creme">
          <h1 className="font-playfair text-2xl font-semibold mb-3">
            Plano de Ação — {plano.nome_aluno}
          </h1>
          <div className="flex flex-wrap gap-4 text-sm text-creme/70">
            <span>
              <span className="font-medium text-creme">Tutora:</span> {plano.tutora}
            </span>
            <span>
              <span className="font-medium text-creme">Criado em:</span> {dataCriacao}
            </span>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="bg-white rounded-2xl shadow-sm border border-creme p-6 mb-10">
          <PlanoMarkdown conteudo={plano.conteudo} />
        </div>

        {/* Rodapé */}
        <div className="text-center py-4 border-t border-creme">
          <p className="text-petroleo/40 text-sm">Mentoria Primus · Ser Mais Criativo</p>
        </div>
      </div>
    </div>
  )
}
