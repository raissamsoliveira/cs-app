'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BarRanking from '@/components/charts/BarRanking'
import PairedBars from '@/components/charts/PairedBars'
import VerticalBars from '@/components/charts/VerticalBars'
import type { BarItem, FaturamentoPar } from '@/lib/dashboardStats'

interface PadroesIG {
  categorias: { nome: string; count: number; exemplos: string[] }[]
  totalAnalises: number
  atualizadoEm: string
}

export interface DashboardData {
  kpis: {
    totalPlanos: number
    totalAnalises: number
    totalTutorasAtivas: number
    planosEsteMes: number
  }
  profissoes: BarItem[]
  areas: BarItem[]
  rankingTutoras: BarItem[]
  timelinePlanos: BarItem[]
  planosDates: string[]
  faturamento: FaturamentoPar[]
  padroesIG: PadroesIG | null
}

/** Agrupa datas por dia dentro de um mês YYYY-MM. */
function planosPorDia(dates: string[], monthKey: string): BarItem[] {
  const [yr, mo] = monthKey.split('-').map(Number)
  const diasNoMes = new Date(yr, mo, 0).getDate()
  const map = new Map<number, number>()
  for (const iso of dates) {
    const d = new Date(iso)
    if (d.getFullYear() === yr && d.getMonth() + 1 === mo) {
      const dia = d.getDate()
      map.set(dia, (map.get(dia) ?? 0) + 1)
    }
  }
  const result: BarItem[] = []
  for (let d = 1; d <= diasNoMes; d++) {
    result.push({ label: String(d), count: map.get(d) ?? 0 })
  }
  return result
}

export default function DashboardClientArea({ data }: { data: DashboardData }) {
  const router = useRouter()
  const [atualizandoIA, setAtualizandoIA] = useState(false)
  const [erroIA, setErroIA] = useState<string | null>(null)
  const [padroesLocal, setPadroesLocal] = useState<PadroesIG | null>(data.padroesIG)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)

  const selectedMonthLabel = useMemo(() => {
    if (!selectedMonth) return null
    const item = data.timelinePlanos.find((t) => t.key === selectedMonth)
    return item?.label ?? selectedMonth
  }, [selectedMonth, data.timelinePlanos])

  const dailyData = useMemo(() => {
    if (!selectedMonth) return []
    return planosPorDia(data.planosDates, selectedMonth)
  }, [selectedMonth, data.planosDates])

  async function atualizarPadroesIG() {
    setAtualizandoIA(true)
    setErroIA(null)
    try {
      const res = await fetch('/api/analytics/padroes-ig', { method: 'POST' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Erro ${res.status}`)
      }
      const json = await res.json()
      setPadroesLocal({
        categorias: json.categorias,
        totalAnalises: json.totalAnalises,
        atualizadoEm: json.atualizadoEm,
      })
    } catch (err) {
      setErroIA(err instanceof Error ? err.message : 'Erro ao analisar padrões.')
    } finally {
      setAtualizandoIA(false)
    }
  }

  function dataFmt(iso: string) {
    return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
  }

  return (
    <div className="bg-offwhite min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="font-playfair text-3xl text-petroleo font-semibold">Dashboard</h1>
            <p className="text-petroleo/60 text-sm mt-1.5">
              Análise consolidada dos planos e análises de Instagram
            </p>
          </div>
          <button
            onClick={() => router.refresh()}
            className="bg-petroleo text-creme py-2.5 px-5 rounded-xl font-medium text-sm hover:bg-petroleo-light transition-colors"
          >
            🔄 Atualizar dados
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <KPI label="Planos de Ação" value={data.kpis.totalPlanos} icon="📋" />
          <KPI label="Análises de IG" value={data.kpis.totalAnalises} icon="📷" />
          <KPI label="Tutoras Ativas" value={data.kpis.totalTutorasAtivas} icon="👩‍💼" />
          <KPI label="Planos este mês" value={data.kpis.planosEsteMes} icon="📅" />
        </div>

        {/* Grid de gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de timeline/mensal — com seletor de mês */}
          <Card
            title={
              selectedMonth
                ? `Planos por dia — ${selectedMonthLabel}`
                : 'Planos gerados por mês (12 meses)'
            }
            headerExtra={
              selectedMonth ? (
                <button
                  onClick={() => setSelectedMonth(null)}
                  className="text-xs text-petroleo/60 hover:text-petroleo underline underline-offset-2"
                >
                  ← Ver todos os meses
                </button>
              ) : (
                <span className="text-xs text-petroleo/40">clique num mês para detalhar</span>
              )
            }
          >
            {selectedMonth ? (
              <VerticalBars data={dailyData} />
            ) : (
              <VerticalBars
                data={data.timelinePlanos}
                rotateLabels
                onBarClick={(item) => item.key && setSelectedMonth(item.key)}
                activeKey={selectedMonth ?? undefined}
              />
            )}
          </Card>

          <Card title="Ranking de tutoras por nº de planos">
            <BarRanking
              data={data.rankingTutoras}
              emptyMessage="Nenhuma tutora com planos ainda."
            />
          </Card>

          <Card title="Profissões mais comuns dos alunos">
            <BarRanking
              data={data.profissoes}
              emptyMessage="Sem dados na planilha."
            />
          </Card>

          <Card title="Áreas de atuação mais comuns">
            <BarRanking
              data={data.areas}
              emptyMessage="Sem dados na planilha."
            />
          </Card>

          <Card
            title="Faturamento atual vs. desejado"
            className="lg:col-span-2"
          >
            <PairedBars data={data.faturamento} />
          </Card>
        </div>

        {/* Padrões de IG via IA */}
        <section className="mt-6 bg-white rounded-2xl border border-creme/70 shadow-sm p-7 sm:p-8">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
            <div>
              <h2 className="font-playfair text-xl text-petroleo font-semibold">
                Onde as tutoras mais precisam atuar
              </h2>
              <p className="text-xs text-petroleo/50 mt-1">
                Categorias recorrentes nas análises de Instagram, classificadas por IA. Custo da IA aplica-se a cada atualização.
              </p>
              {padroesLocal && (
                <p className="text-xs text-petroleo/40 mt-1">
                  Atualizado em {dataFmt(padroesLocal.atualizadoEm)} · {padroesLocal.totalAnalises} análises processadas
                </p>
              )}
            </div>
            <button
              onClick={atualizarPadroesIG}
              disabled={atualizandoIA}
              className="bg-petroleo text-creme py-2.5 px-5 rounded-xl font-medium text-sm hover:bg-petroleo-light disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {atualizandoIA ? 'Analisando com IA...' : padroesLocal ? '🔄 Reanalisar com IA' : '✨ Analisar com IA'}
            </button>
          </div>

          {erroIA && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
              {erroIA}
            </div>
          )}

          {!padroesLocal ? (
            <p className="text-petroleo/50 text-sm py-6 text-center">
              Clique em &quot;Analisar com IA&quot; para gerar a primeira leitura.
            </p>
          ) : padroesLocal.categorias.length === 0 ? (
            <p className="text-petroleo/50 text-sm">Nenhuma categoria detectada.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {padroesLocal.categorias
                .slice()
                .sort((a, b) => b.count - a.count)
                .map((cat) => (
                  <div
                    key={cat.nome}
                    className="border border-creme rounded-xl p-4 bg-offwhite/40"
                  >
                    <div className="flex items-baseline justify-between mb-2">
                      <h3 className="font-medium text-petroleo text-sm">{cat.nome}</h3>
                      <span className="text-xs font-medium text-petroleo/60">
                        {cat.count} análises
                      </span>
                    </div>
                    {cat.exemplos?.length > 0 && (
                      <ul className="space-y-1 mt-2">
                        {cat.exemplos.slice(0, 2).map((ex, i) => (
                          <li
                            key={i}
                            className="text-xs text-petroleo/60 italic border-l-2 border-creme-dark pl-2"
                          >
                            &ldquo;{ex}&rdquo;
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
            </div>
          )}
        </section>

        {/* Atalho final */}
        <div className="mt-6 text-center">
          <Link
            href="/novo-plano"
            className="inline-flex items-center gap-2 bg-petroleo text-creme py-3 px-6 rounded-xl text-sm font-medium hover:bg-petroleo-light transition-colors"
          >
            + Criar Novo Plano
          </Link>
        </div>
      </div>
    </div>
  )
}

function KPI({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="bg-white rounded-2xl border border-creme/70 shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-petroleo/60 text-xs">{label}</p>
          <p className="font-playfair text-3xl text-petroleo font-semibold mt-1">{value}</p>
        </div>
        <span className="text-2xl opacity-70">{icon}</span>
      </div>
    </div>
  )
}

function Card({
  title,
  children,
  className,
  headerExtra,
}: {
  title: React.ReactNode
  children: React.ReactNode
  className?: string
  headerExtra?: React.ReactNode
}) {
  return (
    <div
      className={`bg-white rounded-2xl border border-creme/70 shadow-sm p-6 ${className ?? ''}`}
    >
      <div className="flex items-baseline justify-between gap-2 mb-4">
        <h2 className="font-playfair text-lg text-petroleo font-semibold">{title}</h2>
        {headerExtra}
      </div>
      {children}
    </div>
  )
}
