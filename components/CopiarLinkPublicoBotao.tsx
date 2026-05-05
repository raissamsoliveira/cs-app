'use client'

import { useState } from 'react'

interface Props {
  /** Quando ausente, o botão exibe estado "Salve o plano primeiro" e fica desabilitado. */
  planoId: string | null
  /** Disparado quando o botão é clicado sem planoId — uso em /novo-plano para auto-salvar antes de copiar. */
  onSalvarSolicitado?: () => Promise<string | null> | void
  className?: string
}

export default function CopiarLinkPublicoBotao({
  planoId,
  onSalvarSolicitado,
  className,
}: Props) {
  const [copiado, setCopiado] = useState(false)
  const [carregando, setCarregando] = useState(false)

  async function copiarLink() {
    let id = planoId
    if (!id && onSalvarSolicitado) {
      setCarregando(true)
      try {
        const resultado = await onSalvarSolicitado()
        if (typeof resultado === 'string') id = resultado
      } finally {
        setCarregando(false)
      }
    }
    if (!id) return

    const base = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin
    const url = `${base}/publico/${id}`
    await navigator.clipboard.writeText(url)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  return (
    <button
      onClick={copiarLink}
      disabled={!planoId && !onSalvarSolicitado}
      className={
        className ??
        'flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-creme-dark text-petroleo text-sm font-medium hover:bg-offwhite disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
      }
    >
      {carregando ? 'Salvando...' : copiado ? '✓ Link copiado!' : '🔗 Link público'}
    </button>
  )
}
