'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  planoId: string
  conteudo: string
}

export default function EditarManualmenteBotao({ planoId, conteudo }: Props) {
  const router = useRouter()
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState(conteudo)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  function handleAbrir() {
    setTexto(conteudo) // garante que começa com o conteúdo atual
    setErro(null)
    setEditando(true)
  }

  function handleCancelar() {
    setEditando(false)
    setErro(null)
  }

  async function handleSalvar() {
    setSalvando(true)
    setErro(null)

    try {
      const supabase = createClient()
      // UPDATE apenas em "conteudo" — analise_instagram é preservada
      const { error } = await supabase
        .from('planos')
        .update({ conteudo: texto })
        .eq('id', planoId)

      if (error) throw new Error(error.message)
      setEditando(false)
      router.refresh()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

  if (!editando) {
    return (
      <button
        onClick={handleAbrir}
        className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-creme-dark text-petroleo text-sm font-medium hover:bg-offwhite transition-colors"
      >
        ✏️ Editar Manualmente
      </button>
    )
  }

  return (
    <div className="col-span-full bg-white rounded-2xl shadow-sm border border-creme p-5 space-y-3">
      <h3 className="font-playfair text-base font-semibold text-petroleo">
        Editar Plano (Markdown)
      </h3>
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={20}
        className="w-full px-4 py-3 rounded-xl border border-creme-dark bg-offwhite text-petroleo text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-petroleo/30 focus:border-petroleo transition resize-y"
      />

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {erro}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleCancelar}
          className="px-4 py-2.5 rounded-xl border border-creme-dark text-petroleo/70 text-sm hover:bg-offwhite transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSalvar}
          disabled={salvando}
          className="flex-1 bg-petroleo text-creme py-2.5 px-5 rounded-xl font-medium text-sm hover:bg-petroleo-light disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {salvando ? 'Salvando...' : '💾 Salvar'}
        </button>
      </div>
    </div>
  )
}
