'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  planoId: string
  nomeAluno: string
  tutora: string
  conteudo: string
}

export default function EditarPlanoBotao({ planoId, nomeAluno, tutora, conteudo }: Props) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [novasInfos, setNovasInfos] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  async function handleRegenerarESalvar() {
    if (!novasInfos.trim()) {
      setErro('Adicione informações antes de regenerar.')
      return
    }

    setCarregando(true)
    setErro(null)
    setSucesso(false)

    try {
      // Passo 1: regenera o plano via Anthropic
      const res = await fetch('/api/regenerar-plano', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planoAtual: conteudo, novasInformacoes: novasInfos, nomeAluno, tutora }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Erro ${res.status}`)
      }

      const { plano } = await res.json()

      // Passo 2: salva o plano atualizado no Supabase
      const supabase = createClient()
      // UPDATE apenas em "conteudo" — analise_instagram é preservada
      const { error } = await supabase
        .from('planos')
        .update({ conteudo: plano })
        .eq('id', planoId)

      if (error) throw new Error('Erro ao salvar: ' + error.message)

      setSucesso(true)
      setNovasInfos('')
      setAberto(false)
      router.refresh()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro desconhecido.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col gap-3">
      <button
        onClick={() => { setAberto(!aberto); setErro(null); setSucesso(false) }}
        className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-creme-dark text-petroleo text-sm font-medium hover:bg-offwhite transition-colors"
      >
        {aberto ? '✕ Fechar' : '✨ Editar com IA'}
      </button>

      {sucesso && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">
          Plano atualizado com sucesso!
        </div>
      )}

      {aberto && (
        <div className="bg-white rounded-2xl shadow-sm border border-creme p-5">
          <h3 className="font-playfair text-base font-semibold text-petroleo mb-3">
            Novas informações sobre o aluno
          </h3>
          <p className="text-petroleo/60 text-xs mb-3">
            Descreva atualizações, conquistas recentes, mudanças de objetivo ou qualquer contexto que deva ser incorporado ao plano.
          </p>
          <textarea
            value={novasInfos}
            onChange={(e) => setNovasInfos(e.target.value)}
            rows={5}
            placeholder="Ex: O aluno fechou sua primeira parceria paga, quer focar mais em palestras corporativas e tem dificuldade com consistência na criação de conteúdo..."
            className="w-full px-4 py-3 rounded-xl border border-creme-dark bg-offwhite text-petroleo placeholder-petroleo/40 focus:outline-none focus:ring-2 focus:ring-petroleo/30 focus:border-petroleo transition resize-none text-sm leading-relaxed mb-3"
          />

          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-3">
              {erro}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setAberto(false)}
              className="px-4 py-2.5 rounded-xl border border-creme-dark text-petroleo/70 text-sm hover:bg-offwhite transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleRegenerarESalvar}
              disabled={carregando}
              className="flex-1 bg-petroleo text-creme py-2.5 px-5 rounded-xl font-medium text-sm hover:bg-petroleo-light disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {carregando ? '✨ Regenerando e salvando...' : '✨ Regenerar e Salvar Plano'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
