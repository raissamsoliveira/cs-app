import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AnaliseClientArea from './AnaliseClientArea'

export default async function AnalisePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: analise, error } = await supabase
    .from('analises_instagram')
    .select('id, nome_aluno, created_at, conteudo')
    .eq('id', id)
    .single()

  if (error || !analise) {
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
          #analise-print-area,
          #analise-print-area * { visibility: visible; }
          #analise-print-area { position: absolute; inset: 0; background: white; }

          .no-print { display: none !important; }

          #analise-conteudo {
            box-shadow: none !important;
            border: 1px solid #e8e0d6 !important;
            max-height: none !important;
            height: auto !important;
            overflow: visible !important;
          }
          #analise-conteudo table { border-collapse: collapse !important; width: 100% !important; }
          #analise-conteudo table th,
          #analise-conteudo table td { border: 1px solid #ccc !important; }

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
          <span className="text-petroleo">
            {analise.nome_aluno ?? 'Análise de Instagram'}
          </span>
        </div>

        {/* Área impressa */}
        <div id="analise-print-area">
          {/* Cabeçalho */}
          <div className="bg-petroleo rounded-2xl p-6 mb-6 text-creme">
            <h1 className="font-playfair text-2xl font-semibold mb-3">
              📷 Análise de Instagram
              {analise.nome_aluno ? ` — ${analise.nome_aluno}` : ''}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-creme/70">
              {analise.nome_aluno && (
                <span>
                  <span className="font-medium text-creme">Perfil:</span>{' '}
                  {analise.nome_aluno}
                </span>
              )}
              <span>
                <span className="font-medium text-creme">Gerada em:</span>{' '}
                {new Date(analise.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Conteúdo + botões */}
          <AnaliseClientArea
            analise={{
              id: analise.id,
              nome_aluno: analise.nome_aluno,
              conteudo: analise.conteudo,
            }}
          />
        </div>
      </div>
    </>
  )
}
