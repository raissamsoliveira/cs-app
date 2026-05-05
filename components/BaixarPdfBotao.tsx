'use client'

interface Props {
  /** Nome do aluno usado como título do documento ao imprimir. */
  nomeAluno: string
  /** Classes adicionais — quando usado em barras flexíveis, default é flex-1. */
  className?: string
}

/**
 * Botão de download de PDF — aciona o diálogo de impressão nativo do navegador.
 * Em todos os navegadores modernos a tutora pode "Salvar como PDF" pelo dialog.
 * Requer que a página tenha CSS @media print isolando a área a ser impressa.
 */
export default function BaixarPdfBotao({ nomeAluno, className }: Props) {
  function handlePrint() {
    document.title = `Plano de Ação - ${nomeAluno}`
    window.print()
  }

  return (
    <button
      onClick={handlePrint}
      className={
        className ??
        'flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-creme-dark text-petroleo text-sm font-medium hover:bg-offwhite transition-colors'
      }
    >
      📄 Baixar PDF
    </button>
  )
}
