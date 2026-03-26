'use client'

import { useState } from 'react'

export default function CopiarLinkPublicoBotao({ planoId }: { planoId: string }) {
  const [copiado, setCopiado] = useState(false)

  async function copiarLink() {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin
    const url = `${base}/publico/${planoId}`
    await navigator.clipboard.writeText(url)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  return (
    <button
      onClick={copiarLink}
      className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-creme-dark text-petroleo text-sm font-medium hover:bg-offwhite transition-colors"
    >
      {copiado ? '✓ Link copiado!' : '🔗 Copiar Link Público'}
    </button>
  )
}
