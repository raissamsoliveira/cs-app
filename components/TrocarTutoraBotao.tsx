'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  planoId: string
  tutoraAtual: string | null
  className?: string
}

/**
 * Abre um seletor de tutoras (carregadas da tabela `tutoras`, apenas ativas)
 * e atualiza `planos.tutora` para a escolhida.
 */
export default function TrocarTutoraBotao({ planoId, tutoraAtual, className }: Props) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [tutoras, setTutoras] = useState<string[]>([])
  const [escolhida, setEscolhida] = useState<string>(tutoraAtual ?? '')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!aberto) return
    const supabase = createClient()
    supabase
      .from('tutoras')
      .select('nome')
      .eq('ativa', true)
      .order('nome')
      .then(({ data }) => {
        setTutoras((data ?? []).map((t) => t.nome as string))
      })
  }, [aberto])

  async function salvar() {
    if (!escolhida || escolhida === tutoraAtual) {
      setAberto(false)
      return
    }
    setSalvando(true)
    setErro(null)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('planos')
        .update({ tutora: escolhida })
        .eq('id', planoId)
      if (error) throw new Error(error.message)

      // Sincroniza também a análise IG vinculada (se houver)
      await supabase
        .from('analises_instagram')
        .update({ tutora: escolhida })
        .eq('plano_id', planoId)

      setAberto(false)
      router.refresh()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao trocar tutora.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <>
      <button
        onClick={() => { setAberto(true); setEscolhida(tutoraAtual ?? '') }}
        className={
          className ??
          'flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-creme-dark text-petroleo text-sm font-medium hover:bg-offwhite transition-colors'
        }
      >
        👤 Trocar tutora
      </button>

      {aberto && (
        <div
          className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setAberto(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl border border-creme p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-playfair text-lg text-petroleo font-semibold mb-1">
              Trocar tutora
            </h3>
            <p className="text-xs text-petroleo/50 mb-4">
              Tutora atual:{' '}
              <span className="font-medium text-petroleo/70">
                {tutoraAtual ?? '(sem tutora)'}
              </span>
            </p>

            <label className="block text-sm font-medium text-petroleo mb-1.5">
              Nova tutora
            </label>
            <select
              value={escolhida}
              onChange={(e) => setEscolhida(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-creme-dark bg-offwhite text-petroleo focus:outline-none focus:ring-2 focus:ring-petroleo/30 focus:border-petroleo transition text-sm mb-4"
            >
              <option value="">Selecione</option>
              {tutoras.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            {erro && (
              <p className="text-xs text-red-600 mb-3">{erro}</p>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setAberto(false)}
                className="px-4 py-2 rounded-xl border border-creme-dark text-petroleo/70 text-sm hover:bg-offwhite transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={salvando || !escolhida}
                className="px-5 py-2 rounded-xl bg-petroleo text-creme text-sm font-medium hover:bg-petroleo-light disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {salvando ? 'Salvando...' : 'Trocar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
