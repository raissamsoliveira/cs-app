import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PlanoClientArea from './PlanoClientArea'

type TipoIG = 'analise' | 'planejamento'

export default async function PlanoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()

  // Busca paralela: plano + análise de Instagram vinculada (mais recente).
  const [{ data: plano, error }, { data: analiseRows }] = await Promise.all([
    supabase.from('planos').select('*').eq('id', id).single(),
    supabase
      .from('analises_instagram')
      .select('id, conteudo, tipo, created_at')
      .eq('plano_id', id)
      .order('created_at', { ascending: false })
      .limit(1),
  ])

  if (error || !plano) {
    notFound()
  }

  const analiseNova = analiseRows && analiseRows.length > 0 ? analiseRows[0] : null

  // Prioridade: registro novo em analises_instagram → coluna legacy planos.analise_instagram
  const analiseIGConteudo: string | null =
    analiseNova?.conteudo ?? plano.analise_instagram ?? null

  const tipoIG: TipoIG | null =
    analiseNova && (analiseNova.tipo === 'planejamento' ? 'planejamento' : 'analise')

  return (
    <>
      <style>{`
        @page { margin: 1.5cm; size: A4; }

        @media print {
          @page { margin: 1.5cm; size: A4; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

          body * { visibility: hidden; }
          #plano-print-area,
          #plano-print-area * { visibility: visible; }
          #plano-print-area { position: absolute; inset: 0; background: white; }

          .no-print { display: none !important; }

          #plano-print-area h1,
          #plano-print-area h2,
          #plano-print-area h3 { font-family: 'Poppins', sans-serif; }

          #plano-conteudo {
            box-shadow: none !important;
            border: 1px solid #e8e0d6 !important;
          }
          #plano-conteudo table { border-collapse: collapse !important; width: 100% !important; }
          #plano-conteudo table th,
          #plano-conteudo table td { border: 1px solid #ccc !important; }

          h1, h2, h3 { page-break-after: avoid; break-after: avoid; }
          table { page-break-inside: avoid; break-inside: avoid; }
        }
      `}</style>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="no-print flex items-center gap-2 text-sm text-petroleo/50 mb-6">
          <Link href="/historico" className="hover:text-petroleo transition-colors">
            Histórico
          </Link>
          <span>/</span>
          <span className="text-petroleo">{plano.nome_aluno}</span>
        </div>

        {/* Área impressa */}
        <div id="plano-print-area">
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

          {/* Conteúdo do plano + análise IG (renderizados juntos no client) + botões de ação */}
          <PlanoClientArea
            plano={{
              id: plano.id,
              nome_aluno: plano.nome_aluno,
              tutora: plano.tutora,
              conteudo: plano.conteudo,
              createdAt: plano.created_at,
              hasAnalise: !!analiseIGConteudo,
              analiseIG: analiseIGConteudo,
              tipoIG,
            }}
          />
        </div>
      </div>
    </>
  )
}
