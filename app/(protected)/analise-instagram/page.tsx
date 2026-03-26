import AnaliseInstagramForm from '@/components/AnaliseInstagramForm'

/**
 * Página avulsa de Análise de Instagram.
 * Permite analisar qualquer perfil sem vincular a um plano.
 */
export default function AnaliseInstagramPage() {
  return (
    <>
      {/* CSS de impressão — isola apenas o resultado para o PDF */}
      <style>{`
        @page { margin: 1.5cm; size: A4; }

        @media print {
          @page { margin: 1.5cm; size: A4; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

          body * { visibility: hidden; }
          #analise-conteudo,
          #analise-conteudo * { visibility: visible; }

          /* Remove restrições de altura/overflow para imprimir o conteúdo completo */
          #analise-conteudo {
            position: absolute;
            inset: 0;
            background: white;
            padding: 0;
            max-height: none !important;
            height: auto !important;
            overflow: visible !important;
          }

          h1, h2, h3 {
            font-family: 'Poppins', sans-serif;
            page-break-after: avoid;
            break-after: avoid;
          }
          p { page-break-inside: avoid; break-inside: avoid; }
          table { page-break-inside: avoid; break-inside: avoid; }
          table th, table td { border: 1px solid #ccc !important; }
        }
      `}</style>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Título */}
        <div className="mb-8">
          <h1 className="font-playfair text-3xl text-petroleo font-semibold">
            Análise de Instagram
          </h1>
          <p className="text-petroleo/60 text-sm mt-1">
            Envie até 6 prints do perfil para gerar um relatório estratégico com IA
          </p>
        </div>

        {/* Formulário */}
        <div className="bg-white rounded-2xl shadow-sm border border-creme p-6">
          <AnaliseInstagramForm mostrarInputNome mostrarBotaoPublico />
        </div>
      </div>
    </>
  )
}
