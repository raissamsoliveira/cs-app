import { createClient } from '@/lib/supabase/server'
import TutorasClientArea, { type TutoraComStats } from './TutorasClientArea'

export default async function TutorasPage() {
  const supabase = await createClient()

  const [{ data: tutoras }, { data: planos }] = await Promise.all([
    supabase
      .from('tutoras')
      .select('id, nome, email, ativa, created_at')
      .order('nome'),
    supabase.from('planos').select('tutora'),
  ])

  // Conta planos por nome de tutora
  const contagem = new Map<string, number>()
  for (const p of planos ?? []) {
    if (!p.tutora) continue
    contagem.set(p.tutora, (contagem.get(p.tutora) ?? 0) + 1)
  }

  const lista: TutoraComStats[] = (tutoras ?? []).map((t) => ({
    id: t.id,
    nome: t.nome,
    email: t.email,
    ativa: t.ativa,
    createdAt: t.created_at,
    qtdPlanos: contagem.get(t.nome) ?? 0,
  }))

  // Tutoras "órfãs" — aparecem em planos mas não estão na tabela tutoras
  const nomesTabela = new Set(lista.map((t) => t.nome))
  const orfas = [...contagem.entries()]
    .filter(([nome]) => !nomesTabela.has(nome))
    .map(([nome, qtd]) => ({ nome, qtdPlanos: qtd }))

  return (
    <div className="bg-offwhite min-h-screen">
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-8">
          <h1 className="font-playfair text-3xl text-petroleo font-semibold">Tutoras</h1>
          <p className="text-petroleo/60 text-sm mt-1.5">
            Gerencie as tutoras da Mentoria Primus — adicione, renomeie, desative ou exclua.
          </p>
        </header>

        <TutorasClientArea tutoras={lista} orfas={orfas} />
      </div>
    </div>
  )
}
