'use client'

export default function BaixarPdfBotao({ nomeAluno }: { nomeAluno: string }) {
  // Dispara o diálogo de impressão nativo do navegador.
  // O usuário pode salvar como PDF em todos os navegadores modernos.
  // O CSS @media print na página garante que apenas o plano seja impresso.
  function handlePrint() {
    document.title = `Plano de Ação - ${nomeAluno}`
    window.print()
  }

  return (
    <button
      onClick={handlePrint}
      className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-creme-dark text-petroleo text-sm font-medium hover:bg-offwhite transition-colors"
    >
      📄 Baixar PDF
    </button>
  )
}
