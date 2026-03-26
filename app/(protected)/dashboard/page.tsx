import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

interface Plano {
  id: string
  created_at: string
  nome_aluno: string
  tutora: string
  conteudo: string
  criado_por: string
}

/**
 * Dashboard — visão geral dos planos de ação.
 * Carrega dados diretamente no servidor via Supabase.
 */
export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: planos, error } = await supabase
    .from('planos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-red-600">Erro ao carregar dados: {error.message}</p>
      </div>
    )
  }

  const lista: Plano[] = planos ?? []

  // Estatísticas
  const totalPlanos = lista.length

  // Agrupa por tutora
  const porTutora = lista.reduce<Record<string, number>>((acc, p) => {
    acc[p.tutora] = (acc[p.tutora] || 0) + 1
    return acc
  }, {})

  // Planos criados este mês
  const agora = new Date()
  const planosEsteMes = lista.filter((p) => {
    const d = new Date(p.created_at)
    return d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear()
  }).length

  const ultimosPlanos = lista.slice(0, 5)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Título */}
      <div className="mb-8">
        <h1 className="font-playfair text-3xl text-petroleo font-semibold">Dashboard</h1>
        <p className="text-petroleo/60 text-sm mt-1">
          Visão geral dos planos de ação da Mentoria Primus
        </p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <StatCard label="Total de Planos" value={totalPlanos} icon="📋" />
        <StatCard label="Tutoras Ativas" value={Object.keys(porTutora).length} icon="👩‍💼" />
        <StatCard label="Criados Este Mês" value={planosEsteMes} icon="📅" />
      </div>

      {/* Conteúdo principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Planos por tutora */}
        <div className="bg-white rounded-2xl shadow-sm border border-creme p-6">
          <h2 className="font-playfair text-xl text-petroleo font-semibold mb-4">
            Planos por Tutora
          </h2>
          {Object.keys(porTutora).length === 0 ? (
            <p className="text-petroleo/50 text-sm">Nenhum plano ainda.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(porTutora)
                .sort(([, a], [, b]) => b - a)
                .map(([tutora, count]) => (
                  <div key={tutora} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-petroleo">{tutora}</span>
                        <span className="text-sm text-petroleo/60">{count}</span>
                      </div>
                      {/* Barra de progresso */}
                      <div className="h-2 bg-offwhite rounded-full overflow-hidden">
                        <div
                          className="h-full bg-petroleo rounded-full transition-all"
                          style={{ width: `${(count / totalPlanos) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Últimos planos criados */}
        <div className="bg-white rounded-2xl shadow-sm border border-creme p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-playfair text-xl text-petroleo font-semibold">
              Últimos Planos
            </h2>
            <Link
              href="/historico"
              className="text-petroleo/60 text-sm hover:text-petroleo transition-colors"
            >
              Ver todos →
            </Link>
          </div>

          {ultimosPlanos.length === 0 ? (
            <p className="text-petroleo/50 text-sm">Nenhum plano ainda.</p>
          ) : (
            <div className="space-y-3">
              {ultimosPlanos.map((plano) => (
                <Link
                  key={plano.id}
                  href={`/plano/${plano.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-offwhite transition-colors group"
                >
                  <div className="w-9 h-9 rounded-full bg-creme flex items-center justify-center text-petroleo font-semibold text-sm shrink-0">
                    {plano.nome_aluno.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-petroleo truncate group-hover:text-petroleo-light">
                      {plano.nome_aluno}
                    </p>
                    <p className="text-xs text-petroleo/50">
                      {plano.tutora} · {formatDate(plano.created_at)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Botão novo plano */}
          <Link
            href="/novo-plano"
            className="mt-4 flex items-center justify-center gap-2 w-full bg-petroleo text-creme py-2.5 rounded-xl text-sm font-medium hover:bg-petroleo-light transition-colors"
          >
            + Criar Novo Plano
          </Link>
        </div>
      </div>
    </div>
  )
}

/* Componente de card de estatística */
function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-creme p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-petroleo/60 text-sm mb-1">{label}</p>
          <p className="font-playfair text-4xl text-petroleo font-semibold">{value}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
