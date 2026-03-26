'use client'

import { useState } from 'react'

export default function CopiarBotao({ conteudo }: { conteudo: string }) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    await navigator.clipboard.writeText(conteudo)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <button
      onClick={copiar}
      className="flex-1 bg-petroleo text-creme py-2.5 px-5 rounded-xl font-medium text-sm hover:bg-petroleo-light transition-colors"
    >
      {copiado ? '✓ Copiado!' : '📋 Copiar Plano'}
    </button>
  )
}
