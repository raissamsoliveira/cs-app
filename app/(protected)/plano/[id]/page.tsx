import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import CopiarBotao from './CopiarBotao'
import CriarNotionBotao from './CriarNotionBotao'
import EditarPlanoBotao from './EditarPlanoBotao'
import BaixarPdfBotao from './BaixarPdfBotao'
import CopiarLinkPublicoBotao from './CopiarLinkPublicoBotao'
import PlanoMarkdown from '@/components/PlanoMarkdown'
import AnaliseInstagramForm from '@/components/AnaliseInstagramForm'

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
    <>
      {/* CSS de impressão — mostra apenas o plano, oculta navbar e botões */}
      <style>{`
        @page {
          margin: 1.5cm;
          size: A4;
        }

        @media print {
          @page { margin: 1.5cm; size: A4; }

          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          body * { visibility: hidden; }

          #plano-print-area,
          #plano-print-area * { visibility: visible; }

          #plano-print-area {
            position: absolute;
            inset: 0;
            background: white;
          }

          #plano-print-area h1,
          #plano-print-area h2,
          #plano-print-area h3 {
            font-family: 'Poppins', sans-serif;
          }

          #plano-conteudo {
            box-shadow: none !important;
            border: 1px solid #e8e0d6 !important;
          }

          #plano-conteudo table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          #plano-conteudo table th,
          #plano-conteudo table td {
            border: 1px solid #ccc !important;
          }

          h1, h2, h3 { page-break-after: avoid; break-after: avoid; }
          table { page-break-inside: avoid; break-inside: avoid; }
        }
      `}</style>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-petroleo/50 mb-6">
          <Link href="/historico" className="hover:text-petroleo transition-colors">
            Histórico
          </Link>
          <span>/</span>
          <span className="text-petroleo">{plano.nome_aluno}</span>
        </div>

        {/* Área impressa: cabeçalho + conteúdo do plano */}
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

          {/* Conteúdo do plano */}
          <div id="plano-conteudo" className="bg-white rounded-2xl shadow-sm border border-creme p-6 mb-6">
            <PlanoMarkdown conteudo={plano.conteudo} />
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col gap-3 mb-10">
          <div className="flex flex-col sm:flex-row gap-3">
            <CopiarBotao conteudo={plano.conteudo} />
            <CriarNotionBotao
              nomeAluno={plano.nome_aluno}
              tutora={plano.tutora}
              conteudo={plano.conteudo}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <BaixarPdfBotao nomeAluno={plano.nome_aluno} />
            <CopiarLinkPublicoBotao planoId={plano.id} />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/historico"
              className="flex-1 flex items-center justify-center px-5 py-2.5 rounded-xl border border-creme-dark text-petroleo text-sm font-medium hover:bg-offwhite transition-colors"
            >
              ← Voltar ao Histórico
            </Link>
          </div>
          <EditarPlanoBotao
            planoId={plano.id}
            nomeAluno={plano.nome_aluno}
            tutora={plano.tutora}
            conteudo={plano.conteudo}
          />
        </div>

        {/* Análise de Instagram */}
        <div className="bg-white rounded-2xl shadow-sm border border-creme p-6">
          <div className="mb-5">
            <h2 className="font-playfair text-xl text-petroleo font-semibold">
              📷 Análise de Instagram
            </h2>
            <p className="text-petroleo/60 text-sm mt-1">
              Envie prints do Instagram de {plano.nome_aluno} para gerar uma análise estratégica
            </p>
          </div>
          <AnaliseInstagramForm
            nomeAlunoInicial={plano.nome_aluno}
            planoId={plano.id}
            analiseExistente={plano.analise_instagram ?? null}
          />
        </div>
      </div>
    </>
  )
}
