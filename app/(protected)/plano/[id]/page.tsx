import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PlanoClientArea from './PlanoClientArea'
import PlanoMarkdown from '@/components/PlanoMarkdown'

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

          {/* Conteúdo + botões */}
          <PlanoClientArea
            plano={{
              id: plano.id,
              nome_aluno: plano.nome_aluno,
              tutora: plano.tutora,
              conteudo: plano.conteudo,
            }}
          />
        </div>

        {/* Análise de Instagram salva — apenas leitura, sem formulário de upload */}
        {plano.analise_instagram && (
          <div className="no-print bg-white rounded-2xl shadow-sm border border-creme p-6 mt-2">
            <h2 className="font-playfair text-lg text-petroleo font-semibold mb-4">
              Análise de Instagram
            </h2>
            <PlanoMarkdown conteudo={plano.analise_instagram} />
          </div>
        )}
      </div>
    </>
  )
}
