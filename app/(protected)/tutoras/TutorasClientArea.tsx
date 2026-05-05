'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export interface TutoraComStats {
  id: string
  nome: string
  email: string | null
  ativa: boolean
  createdAt: string
  qtdPlanos: number
}

export interface TutoraOrfa {
  nome: string
  qtdPlanos: number
}

interface Props {
  tutoras: TutoraComStats[]
  orfas: TutoraOrfa[]
}

export default function TutorasClientArea({ tutoras, orfas }: Props) {
  const router = useRouter()
  const [novoNome, setNovoNome] = useState('')
  const [novoEmail, setNovoEmail] = useState('')
  const [criando, setCriando] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editNome, setEditNome] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [salvandoEdit, setSalvandoEdit] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const inputCls =
    'w-full px-4 py-2.5 rounded-xl border border-creme-dark bg-offwhite text-petroleo placeholder-petroleo/40 focus:outline-none focus:ring-2 focus:ring-petroleo/30 focus:border-petroleo transition text-sm'

  async function criar() {
    if (!novoNome.trim()) {
      setErro('Informe o nome.')
      return
    }
    setCriando(true)
    setErro(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('tutoras').insert({
        nome: novoNome.trim(),
        email: novoEmail.trim() || null,
      })
      if (error) throw new Error(error.message)
      setNovoNome('')
      setNovoEmail('')
      router.refresh()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao criar tutora.')
    } finally {
      setCriando(false)
    }
  }

  function abrirEdit(t: TutoraComStats) {
    setEditandoId(t.id)
    setEditNome(t.nome)
    setEditEmail(t.email ?? '')
    setErro(null)
  }

  function cancelarEdit() {
    setEditandoId(null)
  }

  async function salvarEdit(t: TutoraComStats) {
    if (!editNome.trim()) {
      setErro('Nome não pode ficar vazio.')
      return
    }
    setSalvandoEdit(true)
    setErro(null)
    try {
      const supabase = createClient()
      const novoNomeTrim = editNome.trim()
      const renomeou = novoNomeTrim !== t.nome

      // 1) Atualiza a tutora
      const { error: errT } = await supabase
        .from('tutoras')
        .update({ nome: novoNomeTrim, email: editEmail.trim() || null })
        .eq('id', t.id)
      if (errT) throw new Error(errT.message)

      // 2) Se renomeou, atualiza nos planos antigos (sync global)
      if (renomeou) {
        const { error: errP } = await supabase
          .from('planos')
          .update({ tutora: novoNomeTrim })
          .eq('tutora', t.nome)
        if (errP) throw new Error('Tutora renomeada, mas falhou ao atualizar planos: ' + errP.message)

        const { error: errAI } = await supabase
          .from('analises_instagram')
          .update({ tutora: novoNomeTrim })
          .eq('tutora', t.nome)
        if (errAI) {
          // Apenas avisa — não bloqueia
          console.warn('Falha ao atualizar análises de IG:', errAI.message)
        }
      }

      setEditandoId(null)
      router.refresh()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar edição.')
    } finally {
      setSalvandoEdit(false)
    }
  }

  async function toggleAtiva(t: TutoraComStats) {
    const supabase = createClient()
    const { error } = await supabase
      .from('tutoras')
      .update({ ativa: !t.ativa })
      .eq('id', t.id)
    if (error) {
      alert('Erro ao alterar status: ' + error.message)
      return
    }
    router.refresh()
  }

  async function excluir(t: TutoraComStats) {
    const aviso =
      t.qtdPlanos > 0
        ? `A tutora "${t.nome}" tem ${t.qtdPlanos} plano(s) vinculado(s). Os planos NÃO serão deletados, mas ficarão sem tutora atribuída. Deseja continuar?`
        : `Excluir tutora "${t.nome}"? Esta ação não pode ser desfeita.`
    if (!confirm(aviso)) return

    const supabase = createClient()
    const { error } = await supabase.from('tutoras').delete().eq('id', t.id)
    if (error) {
      alert('Erro ao excluir: ' + error.message)
      return
    }
    router.refresh()
  }

  async function adicionarOrfa(orfa: TutoraOrfa) {
    const supabase = createClient()
    const { error } = await supabase.from('tutoras').insert({ nome: orfa.nome })
    if (error) {
      alert('Erro: ' + error.message)
      return
    }
    router.refresh()
  }

  return (
    <div className="space-y-7">
      {/* Form de criação */}
      <section className="bg-white rounded-2xl border border-creme/70 shadow-sm p-7 sm:p-8">
        <h2 className="font-playfair text-xl text-petroleo font-semibold mb-5">
          Adicionar nova tutora
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
          <input
            type="text"
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            placeholder="Nome *"
            className={inputCls}
          />
          <input
            type="email"
            value={novoEmail}
            onChange={(e) => setNovoEmail(e.target.value)}
            placeholder="E-mail (opcional)"
            className={inputCls}
          />
        </div>
        {erro && (
          <p className="text-sm text-red-600 mb-3">{erro}</p>
        )}
        <button
          onClick={criar}
          disabled={criando}
          className="bg-petroleo text-creme py-2.5 px-6 rounded-xl font-medium text-sm hover:bg-petroleo-light disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {criando ? 'Adicionando...' : 'Adicionar tutora'}
        </button>
      </section>

      {/* Tutoras órfãs (aparecem em planos mas não estão na tabela) */}
      {orfas.length > 0 && (
        <section className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
          <h2 className="font-playfair text-lg text-amber-900 font-semibold mb-2">
            Tutoras encontradas em planos antigos
          </h2>
          <p className="text-xs text-amber-800/80 mb-4">
            Estas tutoras aparecem em planos mas não estão cadastradas. Adicione-as para gerenciar.
          </p>
          <div className="space-y-2">
            {orfas.map((o) => (
              <div
                key={o.nome}
                className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 border border-amber-200"
              >
                <div>
                  <span className="text-sm font-medium text-petroleo">{o.nome}</span>
                  <span className="ml-2 text-xs text-petroleo/50">
                    {o.qtdPlanos} plano{o.qtdPlanos !== 1 ? 's' : ''}
                  </span>
                </div>
                <button
                  onClick={() => adicionarOrfa(o)}
                  className="text-xs text-petroleo font-medium px-3 py-1.5 rounded-lg border border-creme-dark hover:bg-creme transition-colors"
                >
                  + Adicionar
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Lista de tutoras */}
      <section className="bg-white rounded-2xl border border-creme/70 shadow-sm overflow-hidden">
        <div className="px-7 sm:px-8 py-5 border-b border-creme">
          <h2 className="font-playfair text-xl text-petroleo font-semibold">
            Tutoras cadastradas ({tutoras.length})
          </h2>
        </div>

        {tutoras.length === 0 ? (
          <div className="p-12 text-center text-petroleo/50 text-sm">
            Nenhuma tutora cadastrada ainda.
          </div>
        ) : (
          <ul className="divide-y divide-creme/60">
            {tutoras.map((t) => (
              <li key={t.id} className="px-7 sm:px-8 py-4">
                {editandoId === t.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={editNome}
                        onChange={(e) => setEditNome(e.target.value)}
                        placeholder="Nome"
                        className={inputCls}
                      />
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="E-mail (opcional)"
                        className={inputCls}
                      />
                    </div>
                    <p className="text-xs text-petroleo/50">
                      Renomear vai sincronizar todos os planos e análises com a tutora atual.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={cancelarEdit}
                        className="px-4 py-2 rounded-xl border border-creme-dark text-petroleo/70 text-sm hover:bg-offwhite transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => salvarEdit(t)}
                        disabled={salvandoEdit}
                        className="px-5 py-2 rounded-xl bg-petroleo text-creme text-sm font-medium hover:bg-petroleo-light disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                      >
                        {salvandoEdit ? 'Salvando...' : 'Salvar'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-petroleo">{t.nome}</span>
                        {!t.ativa && (
                          <span className="text-xs px-2 py-0.5 rounded-md bg-creme text-petroleo/60">
                            inativa
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-petroleo/50 mt-0.5">
                        {t.email ?? <span className="italic">sem e-mail</span>}
                        {' · '}
                        {t.qtdPlanos} plano{t.qtdPlanos !== 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => toggleAtiva(t)}
                        title={t.ativa ? 'Desativar' : 'Ativar'}
                        className="text-xs text-petroleo/70 px-3 py-1.5 rounded-lg border border-creme-dark hover:bg-offwhite transition-colors"
                      >
                        {t.ativa ? 'Desativar' : 'Ativar'}
                      </button>
                      <button
                        onClick={() => abrirEdit(t)}
                        className="text-xs text-petroleo px-3 py-1.5 rounded-lg border border-creme-dark hover:bg-creme transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => excluir(t)}
                        className="text-xs text-red-600 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
