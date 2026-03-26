import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import PlanoMarkdown from '@/components/PlanoMarkdown'

/**
 * Página pública de análise de Instagram — acessível sem autenticação.
 * URL: /analise/publico/[id]
 *
 * Requer a policy: CREATE POLICY "Leitura pública das análises"
 *   ON analises_instagram FOR SELECT USING (true);
 */
function criarClientePublico() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export default async function AnalisePublicaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = criarClientePublico()
  const { data: analise, error } = await supabase
    .from('analises_instagram')
    .select('id, nome_aluno, created_at, conteudo')
    .eq('id', id)
    .single()

  if (error || !analise) {
    notFound()
  }

  const dataCriacao = new Date(analise.created_at).toLocaleDateString('pt-BR', {
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

        {/* Cabeçalho */}
        <div className="bg-petroleo rounded-2xl p-6 mb-6 text-creme">
          <h1 className="font-playfair text-2xl font-semibold mb-3">
            📷 Análise de Instagram{analise.nome_aluno ? ` — ${analise.nome_aluno}` : ''}
          </h1>
          <div className="flex flex-wrap gap-4 text-sm text-creme/70">
            {analise.nome_aluno && (
              <span>
                <span className="font-medium text-creme">Perfil:</span> {analise.nome_aluno}
              </span>
            )}
            <span>
              <span className="font-medium text-creme">Gerada em:</span> {dataCriacao}
            </span>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="bg-white rounded-2xl shadow-sm border border-creme p-6 mb-10">
          <PlanoMarkdown conteudo={analise.conteudo} />
        </div>

        {/* Rodapé */}
        <div className="text-center py-4 border-t border-creme">
          <p className="text-petroleo/40 text-sm">Mentoria Primus · Ser Mais Criativo</p>
        </div>
      </div>
    </div>
  )
}
