'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PlanoMarkdown from '@/components/PlanoMarkdown'
import BuscaAluno from '@/components/BuscaAluno'
import BlocoInstagram, {
  type BlocoInstagramData,
} from '@/components/BlocoInstagram'
import BaixarPdfBotao from '@/components/BaixarPdfBotao'
import CopiarLinkPublicoBotao from '@/components/CopiarLinkPublicoBotao'
import EditarComIABotao from '@/components/EditarComIABotao'
import CopiarBotao from '@/components/CopiarBotao'
import GerarApresentacaoBotao from '@/components/GerarApresentacaoBotao'

type AbaAluno = 'identificacao' | 'negocio' | 'comunicacao' | 'conteudo'

// ── Campos por aba do painel "Dados do Aluno" ────────────────────────────────

const TABS_DADOS: Record<AbaAluno, { label: string; key: string }[]> = {
  identificacao: [
    { label: 'Nome completo', key: 'Nome completo' },
    { label: 'E-mail', key: 'E-mail utilizado na compra da mentoria:' },
    { label: 'Telefone', key: 'Telefone com DDD' },
    { label: 'Data de Nascimento', key: 'Data de Nascimento' },
    { label: 'Endereço', key: 'Endereço completo com CEP' },
    { label: 'Instagram / LinkedIn', key: 'Qual seu instagram ou linkedin? Se tiver os dois, coloque os dois.' },
  ],
  negocio: [
    { label: 'Profissão', key: 'Qual sua profissão atual?' },
    { label: 'Área de atuação', key: 'Área de atuação:' },
    { label: 'Trabalha atualmente', key: 'Você trabalha atualmente?' },
    { label: 'Faturamento atual', key: 'Faturmento médio mensal atual:' },
    { label: 'Faturamento desejado', key: 'Faturamento médio mensal desejado após o ciclo da mentoria:' },
    { label: 'Obstáculo principal', key: 'Qual seu maior obstáculo para alcançar esse objetivo?' },
  ],
  comunicacao: [
    { label: 'Falar em público', key: 'Como você se sente ao falar em público?' },
    { label: 'Já faz palestras', key: 'Você já realiza palestras, aulas ou apresentações?' },
    { label: 'Em reuniões', key: 'Em reuniões profissionais, você costuma:' },
    { label: 'Bloqueio', key: 'O que te bloqueia ao se comunicar?' },
    { label: 'Persuasão', key: 'Você se considera persuasivo(a)?' },
    { label: 'Onde quer melhorar', key: 'Em qual situação você quer melhorar sua persuação?' },
  ],
  conteudo: [
    { label: 'Cria conteúdo', key: 'Você cria conteúdo nas redes sociais atualmente?' },
    { label: 'Frequência', key: 'Frequência de publicação:' },
    { label: 'Objetivo rede social', key: 'Qual seu maior objetivo com sua rede social hoje?' },
    { label: 'Seguidores Instagram', key: 'Quantos seguidores você tem no Instagram hoje?' },
    { label: 'Gera vendas pelo IG', key: 'Você gera vendas ou agendamentos pelo seu Instagram hoje?' },
    { label: 'Dificuldade conteúdo', key: 'Maior dificuldade ao criar conteúdo:' },
    { label: 'Usa IA', key: 'Já usou IA para criar conteúdo?' },
    { label: 'Produto digital', key: 'Você já tem algum produto digital?' },
    { label: 'Rede de contatos', key: 'Como está sua rede de contatos hoje?' },
    { label: 'Objetivo networking', key: 'Qual seu principal objetivo com networking?' },
    { label: 'Preferência conexões', key: 'Prefere conexões:' },
    { label: 'Meta 2 meses', key: 'Qual sua principal meta para os próximos 2 meses?' },
    { label: 'Meta 6 meses', key: 'Qual sua principal meta para os próximos 6 meses?' },
    { label: 'Palavra-chave', key: 'Em uma palavra, o que você mais deseja transformar em sua vida profissional com esta mentoria?' },
    { label: 'Comprometimento (0-10)', key: 'Em uma escala de 0 a 10, qual seu comprometimento em aplicar o que aprenderá?' },
    { label: 'O que motivou entrar na Primus', key: 'O que te motivou a entrar na Mentoria Primus?' },
    { label: 'O que precisa acontecer após o ciclo', key: 'O que precisa ter acontecido na sua vida após o ciclo da mentoria para você sentir que o investimento foi válido?' },
  ],
}

const TABS_LABELS: { key: AbaAluno; label: string }[] = [
  { key: 'identificacao', label: 'Identificação' },
  { key: 'negocio', label: 'Negócio' },
  { key: 'comunicacao', label: 'Comunicação' },
  { key: 'conteudo', label: 'Conteúdo & Metas' },
]

// ── Builder do contexto para a IA ────────────────────────────────────────────

function buildAlunoContext(aluno: Record<string, string>): string {
  const v = (key: string) => {
    // Tenta chave exata; depois tenta por prefixo (para o campo de instagram)
    const val = aluno[key] ?? Object.values(
      Object.fromEntries(
        Object.entries(aluno).filter(([k]) => k.startsWith(key.slice(0, 30)))
      )
    )[0] ?? ''
    return val.trim() || 'Não informado'
  }

  return `=== DADOS DO ALUNO ===
Nome: ${v('Nome completo')}
Profissão: ${v('Qual sua profissão atual?')}
Área: ${v('Área de atuação:')}
Faturamento atual: ${v('Faturmento médio mensal atual:')}
Faturamento desejado: ${v('Faturamento médio mensal desejado após o ciclo da mentoria:')}
Obstáculo principal: ${v('Qual seu maior obstáculo para alcançar esse objetivo?')}
Instagram/LinkedIn: ${v('Qual seu instagram ou linkedin? Se tiver os dois, coloque os dois.')}

=== COMUNICAÇÃO ===
Falar em público: ${v('Como você se sente ao falar em público?')}
Já faz palestras: ${v('Você já realiza palestras, aulas ou apresentações?')}
Em reuniões: ${v('Em reuniões profissionais, você costuma:')}
Bloqueio na comunicação: ${v('O que te bloqueia ao se comunicar?')}
Persuasão: ${v('Você se considera persuasivo(a)?')}
Onde quer melhorar: ${v('Em qual situação você quer melhorar sua persuação?')}

=== CONTEÚDO & REDE ===
Cria conteúdo: ${v('Você cria conteúdo nas redes sociais atualmente?')}
Frequência: ${v('Frequência de publicação:')}
Objetivo com rede social: ${v('Qual seu maior objetivo com sua rede social hoje?')}
Seguidores Instagram: ${v('Quantos seguidores você tem no Instagram hoje?')}
Gera vendas pelo Instagram: ${v('Você gera vendas ou agendamentos pelo seu Instagram hoje?')}
Dificuldade em criar conteúdo: ${v('Maior dificuldade ao criar conteúdo:')}
Usa IA para conteúdo: ${v('Já usou IA para criar conteúdo?')}
Tem produto digital: ${v('Você já tem algum produto digital?')}
Rede de contatos: ${v('Como está sua rede de contatos hoje?')}
Objetivo networking: ${v('Qual seu principal objetivo com networking?')}

=== METAS ===
Meta 2 meses: ${v('Qual sua principal meta para os próximos 2 meses?')}
Meta 6 meses: ${v('Qual sua principal meta para os próximos 6 meses?')}
Palavra-chave transformação: ${v('Em uma palavra, o que você mais deseja transformar em sua vida profissional com esta mentoria?')}
Comprometimento (0-10): ${v('Em uma escala de 0 a 10, qual seu comprometimento em aplicar o que aprenderá?')}
O que motivou entrar na Primus: ${v('O que te motivou a entrar na Mentoria Primus?')}
O que precisa acontecer após o ciclo: ${v('O que precisa ter acontecido na sua vida após o ciclo da mentoria para você sentir que o investimento foi válido?')}`
}

// ── Helper de extração de Instagram do aluno selecionado ────────────────────

function extrairInstagram(aluno: Record<string, string>): string {
  const key = Object.keys(aluno).find((k) =>
    k.startsWith('Qual seu instagram ou linkedin')
  )
  return (key && aluno[key]?.trim()) || ''
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function NovoPlanoPage() {
  // (router será usado na Etapa 5, ao redirecionar para /plano/[id] após salvar)
  useRouter()

  // ── Bloco 1: Identificação ──────────────────────────────────────────────
  const [nomeAluno, setNomeAluno] = useState('')
  const [tutora, setTutora] = useState('')
  const [tutoras, setTutoras] = useState<string[]>([])

  // ── Bloco 2: Dados do aluno ─────────────────────────────────────────────
  const [alunoSelecionado, setAlunoSelecionado] = useState<Record<string, string> | null>(null)
  const [contextoAluno, setContextoAluno] = useState('')
  const [painelDadosAberto, setPainelDadosAberto] = useState(true)
  const [abaAluno, setAbaAluno] = useState<AbaAluno>('identificacao')
  const [instagramAluno, setInstagramAluno] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('tutoras')
      .select('nome')
      .eq('ativa', true)
      .order('nome')
      .then(({ data }) => {
        setTutoras((data ?? []).map((t) => t.nome as string))
      })
  }, [])

  // ── Bloco 3: Contexto adicional (colapsável, fechado por padrão) ────────
  const [contextoAberto, setContextoAberto] = useState(false)
  const [textoBruto, setTextoBruto] = useState('')
  const [pda21Base64, setPda21Base64] = useState<string | null>(null)
  const [nomePda21, setNomePda21] = useState('')
  const inputRefPda21 = useRef<HTMLInputElement>(null)

  // ── Bloco 4: Instagram ──────────────────────────────────────────────────
  const [blocoIG, setBlocoIG] = useState<BlocoInstagramData>({
    tipo: 'analise',
    imagens: [],
    contextoIG: '',
  })

  // ── Bloco 5/6: Geração e resultado ──────────────────────────────────────
  const [gerando, setGerando] = useState(false)
  const [planoGerado, setPlanoGerado] = useState<string | null>(null)
  const [analiseIGGerada, setAnaliseIGGerada] = useState<string | null>(null)
  const [tipoIGGerado, setTipoIGGerado] = useState<'analise' | 'planejamento'>('analise')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [planoSalvoId, setPlanoSalvoId] = useState<string | null>(null)
  const [mensagem, setMensagem] = useState<string | null>(null)

  // Edição manual inline
  const [editMode, setEditMode] = useState(false)
  const [textoEdit, setTextoEdit] = useState('')
  const [salvandoEdit, setSalvandoEdit] = useState(false)

  // ── Handlers ────────────────────────────────────────────────────────────

  function handleSelecionarAluno(aluno: Record<string, string>) {
    setAlunoSelecionado(aluno)
    setNomeAluno(aluno['Nome completo'] ?? '')
    setContextoAluno(buildAlunoContext(aluno))
    setInstagramAluno(extrairInstagram(aluno))
    setPainelDadosAberto(true)
  }

  function handlePda21Change(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      setPda21Base64(result.split(',')[1])
      setNomePda21(file.name)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function removerPda21() {
    setPda21Base64(null)
    setNomePda21('')
  }

  // Geração unificada — uma única chamada à IA com marcador ===INSTAGRAM===
  async function handleGerar() {
    if (!nomeAluno.trim() || !tutora.trim()) {
      setErro('Preencha o nome do aluno e a tutora antes de gerar o plano.')
      return
    }

    if (!textoBruto.trim() && !contextoAluno) {
      setErro('Selecione um aluno da planilha ou adicione algum contexto antes de gerar.')
      return
    }

    setGerando(true)
    setErro(null)
    setPlanoGerado(null)
    setAnaliseIGGerada(null)
    setPlanoSalvoId(null)
    setMensagem(null)

    let contexto = contextoAluno ? contextoAluno + '\n\n' : ''
    if (textoBruto.trim()) {
      contexto += `INFORMAÇÕES ADICIONAIS:\n${textoBruto}`
    }

    const temImagensIG = blocoIG.imagens.length > 0
    try {
      const res = await fetch('/api/gerar-plano', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomeAluno,
          tutora,
          contexto,
          ...(pda21Base64 && { pda21: pda21Base64 }),
          ...(temImagensIG && {
            imagens: blocoIG.imagens.map((img) => ({
              data: img.base64,
              mediaType: img.mediaType,
            })),
          }),
          instagramTipo: blocoIG.tipo,
          instagramAluno,
          ...(blocoIG.contextoIG.trim() && {
            instagramContexto: blocoIG.contextoIG.trim(),
          }),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Erro ${res.status}`)
      }

      const { plano } = await res.json()

      // Divide a resposta pelo marcador ===INSTAGRAM===
      const MARCADOR = /\n?\s*={3,}\s*INSTAGRAM\s*={3,}\s*\n?/i
      const partes = (plano as string).split(MARCADOR)
      const planoConteudo = partes[0].trim()
      const analiseIG = partes.length > 1 ? partes.slice(1).join('\n').trim() : ''

      setPlanoGerado(planoConteudo)
      setTipoIGGerado(blocoIG.tipo)
      setAnaliseIGGerada(analiseIG || null)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao gerar o plano. Tente novamente.')
    } finally {
      setGerando(false)
    }
  }

  // ── Helpers para a barra de ações ──────────────────────────────────────

  /** Garante que o plano + análise IG estão salvos. Retorna o id do plano. */
  async function garantirSalvo(): Promise<string | null> {
    if (planoSalvoId) return planoSalvoId
    if (!planoGerado) return null

    setSalvando(true)
    setMensagem(null)
    setErro(null)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { data: planoData, error: errPlano } = await supabase
        .from('planos')
        .insert({
          nome_aluno: nomeAluno,
          tutora,
          conteudo: planoGerado,
          criado_por: user?.id ?? null,
        })
        .select('id')
        .single()

      if (errPlano || !planoData) {
        throw new Error(errPlano?.message ?? 'Erro ao salvar o plano')
      }

      const id = planoData.id as string
      setPlanoSalvoId(id)

      if (analiseIGGerada) {
        const { error: errIG } = await supabase
          .from('analises_instagram')
          .insert({
            nome_aluno: nomeAluno || null,
            conteudo: analiseIGGerada,
            tipo: tipoIGGerado,
            plano_id: id,
            tutora: tutora || null,
            criado_por: user?.id ?? null,
          })
        if (errIG) {
          setErro(
            'Plano salvo, mas a análise de Instagram falhou: ' + errIG.message,
          )
        }
      }

      setMensagem('Plano salvo com sucesso!')
      return id
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar o plano.')
      return null
    } finally {
      setSalvando(false)
    }
  }

  function handleAbrirEdit() {
    const base = planoGerado ?? ''
    const ig = analiseIGGerada ? `

===INSTAGRAM===

${analiseIGGerada}` : ''
    setTextoEdit(base + ig)
    setEditMode(true)
  }

  function handleCancelarEdit() {
    setEditMode(false)
  }

  async function handleSalvarEdit() {
    setSalvandoEdit(true)
    setErro(null)
    try {
      // Re-separa pelo marcador ===INSTAGRAM===
      const MARCADOR = /\n?\s*={3,}\s*INSTAGRAM\s*={3,}\s*\n?/i
      const partes = textoEdit.split(MARCADOR)
      const novoPlano = partes[0].trim()
      const novaIG = partes.length > 1 ? partes.slice(1).join('\n').trim() : null

      // Atualiza estado local
      setPlanoGerado(novoPlano)
      setAnaliseIGGerada(novaIG)

      // Se o plano já estava salvo, persiste os updates no banco
      if (planoSalvoId) {
        const supabase = createClient()

        const { error: errPlano } = await supabase
          .from('planos')
          .update({ conteudo: novoPlano })
          .eq('id', planoSalvoId)
        if (errPlano) throw new Error(errPlano.message)

        if (novaIG !== null) {
          // Atualiza ou insere a análise de IG vinculada
          const { data: igExistente } = await supabase
            .from('analises_instagram')
            .select('id')
            .eq('plano_id', planoSalvoId)
            .maybeSingle()

          if (igExistente) {
            await supabase
              .from('analises_instagram')
              .update({ conteudo: novaIG })
              .eq('id', igExistente.id)
          } else {
            const { data: { user } } = await supabase.auth.getUser()
            await supabase.from('analises_instagram').insert({
              nome_aluno: nomeAluno || null,
              conteudo: novaIG,
              tipo: tipoIGGerado,
              plano_id: planoSalvoId,
              tutora: tutora || null,
              criado_por: user?.id ?? null,
            })
          }
        }
      }

      setEditMode(false)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar edição.')
    } finally {
      setSalvandoEdit(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────

  const inputCls =
    'w-full px-4 py-2.5 rounded-xl border border-creme-dark bg-offwhite text-petroleo placeholder-petroleo/40 focus:outline-none focus:ring-2 focus:ring-petroleo/30 focus:border-petroleo transition'

  const cardCls = 'bg-white rounded-2xl border border-creme/70 shadow-sm p-7 sm:p-8'

  const tituloBlocoCls = 'font-playfair text-xl text-petroleo font-semibold'

  return (
    <div className="bg-offwhite min-h-screen">
      <style>{`
        @page { margin: 1.5cm; size: A4; }
        @media print {
          @page { margin: 1.5cm; size: A4; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body * { visibility: hidden; }
          #novo-plano-print-area, #novo-plano-print-area * { visibility: visible; }
          #novo-plano-print-area { position: absolute; inset: 0; padding: 0; background: white; }
          .no-print { display: none !important; }
          h1, h2, h3 { font-family: 'Poppins', sans-serif; page-break-after: avoid; break-after: avoid; }
          p, table { page-break-inside: avoid; break-inside: avoid; }
          table th, table td { border: 1px solid #ccc !important; }
        }
      `}</style>
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Cabeçalho */}
        <header className="mb-10">
          <h1 className="font-playfair text-3xl text-petroleo font-semibold">
            Novo Plano de Ação
          </h1>
          <p className="text-petroleo/60 text-sm mt-1.5">
            Gere um plano completo do aluno + análise de Instagram em uma única etapa.
          </p>
        </header>

        <div className="space-y-7">
          {/* ─────── Bloco 1 — Identificação ─────── */}
          <section className={cardCls}>
            <h2 className={`${tituloBlocoCls} mb-5`}>Identificação</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-petroleo mb-1.5">
                  Aluno *
                </label>
                <BuscaAluno
                  onSelect={handleSelecionarAluno}
                  placeholder="Buscar aluno pelo nome..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-petroleo mb-1.5">
                  Tutora *
                </label>
                <select
                  value={tutora}
                  onChange={(e) => setTutora(e.target.value)}
                  className={inputCls}
                >
                  <option value="">Selecione a tutora</option>
                  {tutoras.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* ─────── Bloco 2 — Dados do aluno (após seleção) ─────── */}
          {alunoSelecionado && (
            <section className="bg-white rounded-2xl border border-creme/70 shadow-sm overflow-hidden">
              <button
                onClick={() => setPainelDadosAberto((v) => !v)}
                className="w-full flex items-center justify-between px-7 sm:px-8 py-5 text-left hover:bg-offwhite/60 transition-colors"
              >
                <span className={tituloBlocoCls}>Dados do aluno</span>
                <span className="text-petroleo/50 text-sm">
                  {painelDadosAberto ? '▲ Recolher' : '▼ Expandir'}
                </span>
              </button>

              {painelDadosAberto && (
                <div className="px-7 sm:px-8 pb-7">
                  {/* Abas */}
                  <div className="flex gap-1 mb-5 bg-offwhite p-1 rounded-xl">
                    {TABS_LABELS.map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setAbaAluno(key)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          abaAluno === key
                            ? 'bg-petroleo text-creme'
                            : 'text-petroleo/60 hover:text-petroleo'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Campos */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                    {TABS_DADOS[abaAluno].map(({ label, key }) => {
                      const valor = alunoSelecionado[key]?.trim() ||
                        Object.entries(alunoSelecionado).find(([k]) =>
                          k.startsWith(key.slice(0, 20))
                        )?.[1]?.trim() ||
                        ''
                      return (
                        <div key={key} className="border-b border-creme/60 pb-2 last:border-0">
                          <p className="text-xs font-medium text-petroleo/60 mb-0.5">{label}</p>
                          <p className={`text-sm ${valor ? 'text-petroleo' : 'text-petroleo/30 italic'}`}>
                            {valor || 'Não informado'}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ─────── Bloco 3 — Contexto adicional (colapsável, fechado por padrão) ─────── */}
          <section className="bg-white rounded-2xl border border-creme/70 shadow-sm overflow-hidden">
            <button
              onClick={() => setContextoAberto((v) => !v)}
              className="w-full flex items-center justify-between px-7 sm:px-8 py-5 text-left hover:bg-offwhite/60 transition-colors"
            >
              <div>
                <span className={tituloBlocoCls}>Contexto adicional</span>
                <p className="text-xs text-petroleo/50 mt-0.5 font-normal">
                  Observações da tutora e PDA21 (opcional)
                </p>
              </div>
              <span className="text-petroleo/50 text-sm shrink-0 ml-4">
                {contextoAberto ? '▲ Recolher' : '▼ Expandir'}
              </span>
            </button>

            {contextoAberto && (
              <div className="px-7 sm:px-8 pb-7 space-y-6">
                {/* Textarea */}
                <div>
                  <label className="block text-sm font-medium text-petroleo mb-1.5">
                    Observações
                  </label>
                  <p className="text-xs text-petroleo/50 mb-2">
                    Informações extras sobre o aluno — anotações, observações da tutora, etc.
                  </p>
                  <textarea
                    value={textoBruto}
                    onChange={(e) => setTextoBruto(e.target.value)}
                    rows={6}
                    placeholder="Cole aqui anotações, observações extras ou qualquer contexto adicional sobre o aluno..."
                    className={`${inputCls} resize-none text-sm leading-relaxed`}
                  />
                </div>

                {/* Upload PDA21 */}
                <div>
                  <label className="block text-sm font-medium text-petroleo mb-1.5">
                    Plano de Ataque (PDA21){' '}
                    <span className="text-petroleo/40 font-normal text-xs">(opcional)</span>
                  </label>
                  <p className="text-xs text-petroleo/50 mb-3">
                    Envie o PDF do PDA21 preenchido pelo aluno para enriquecer o plano.
                  </p>

                  <input
                    ref={inputRefPda21}
                    type="file"
                    accept="application/pdf"
                    onChange={handlePda21Change}
                    className="hidden"
                  />

                  {pda21Base64 ? (
                    <div className="flex items-center gap-3 p-3 bg-offwhite rounded-xl border border-creme-dark">
                      <span className="text-xl">📄</span>
                      <span className="flex-1 text-sm text-petroleo truncate">{nomePda21}</span>
                      <button
                        onClick={removerPda21}
                        className="text-petroleo/40 hover:text-petroleo text-sm transition-colors"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => inputRefPda21.current?.click()}
                      className="border-2 border-dashed rounded-xl p-7 text-center cursor-pointer border-creme-dark hover:border-petroleo/40 hover:bg-offwhite transition-colors"
                    >
                      <p className="text-2xl mb-1">📄</p>
                      <p className="text-sm font-medium text-petroleo">Clique para selecionar o PDF</p>
                      <p className="text-xs text-petroleo/40 mt-0.5">Apenas arquivos PDF</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* ─────── Bloco 4 — Instagram ─────── */}
          <BlocoInstagram
            instagramAluno={instagramAluno}
            onInstagramAlunoChange={setInstagramAluno}
            onChange={setBlocoIG}
          />

          {/* ─────── Bloco 5 — Botão principal ─────── */}
          <div>
            {erro && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
                {erro}
              </div>
            )}
            <button
              onClick={handleGerar}
              disabled={gerando}
              className="w-full bg-petroleo text-creme py-4 px-6 rounded-xl font-semibold text-sm hover:bg-petroleo-light disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              style={{ backgroundColor: gerando ? undefined : '#05343d' }}
            >
              {gerando ? 'Gerando...' : 'Gerar Plano Completo'}
            </button>
          </div>

          {/* ─────── Bloco 6 — Resultado ─────── */}
          {!planoGerado ? (
            <section className={cardCls}>
              <div className="py-16 text-center">
                <p className="text-petroleo/50 text-sm">
                  Preencha as informações acima e clique em{' '}
                  <span className="font-medium text-petroleo/70">Gerar Plano Completo</span>
                </p>
              </div>
            </section>
          ) : (
            <section
              id="novo-plano-resultado"
              className="bg-white rounded-2xl border border-creme/70 shadow-sm overflow-hidden"
            >
              {/* Barra de ações sticky */}
              <div className="no-print sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-creme px-5 sm:px-6 py-3 flex flex-wrap gap-2 items-center">
                <CopiarBotao
                  conteudo={planoGerado}
                  createdAt={new Date().toISOString()}
                  hasAnalise={!!analiseIGGerada}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-petroleo text-creme text-sm font-medium hover:bg-petroleo-light transition-colors"
                />

                <BaixarPdfBotao
                  nomeAluno={nomeAluno}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-creme-dark text-petroleo text-sm font-medium hover:bg-offwhite transition-colors"
                />

                <GerarApresentacaoBotao
                  nomeAluno={nomeAluno}
                  tutora={tutora}
                  conteudo={planoGerado}
                  createdAt={new Date().toISOString()}
                  analiseIG={analiseIGGerada}
                  tipoIG={analiseIGGerada ? tipoIGGerado : null}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-creme-dark text-petroleo text-sm font-medium hover:bg-offwhite transition-colors"
                />

                <button
                  onClick={editMode ? handleCancelarEdit : handleAbrirEdit}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-creme-dark text-petroleo text-sm font-medium hover:bg-offwhite transition-colors"
                >
                  {editMode ? '✕ Cancelar' : '✏️ Editar Manualmente'}
                </button>

                <EditarComIABotao
                  planoId={planoSalvoId}
                  nomeAluno={nomeAluno}
                  tutora={tutora}
                  conteudo={planoGerado}
                  onUpdate={(novo) => setPlanoGerado(novo)}
                  onSalvarSolicitado={garantirSalvo}
                  className="flex items-center justify-center"
                />

                <CopiarLinkPublicoBotao
                  planoId={planoSalvoId}
                  onSalvarSolicitado={garantirSalvo}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-creme-dark text-petroleo text-sm font-medium hover:bg-offwhite disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                />

                <div className="ml-auto">
                  <button
                    onClick={async () => { await garantirSalvo() }}
                    disabled={salvando || !!planoSalvoId}
                    className="bg-petroleo text-creme py-2 px-5 rounded-xl font-medium text-sm hover:bg-petroleo-light disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {salvando
                      ? 'Salvando...'
                      : planoSalvoId
                        ? '✓ Plano salvo'
                        : analiseIGGerada
                          ? 'Salvar Plano + Análise'
                          : 'Salvar Plano'}
                  </button>
                </div>
              </div>

              {/* Conteúdo do documento */}
              <div id="novo-plano-print-area" className="p-7 sm:p-8">
                {editMode ? (
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="mr-auto">
                        <span className="text-xs font-medium text-petroleo/50">
                          Modo de edição — Markdown
                        </span>
                        {analiseIGGerada && (
                          <span className="block text-xs text-petroleo/40 mt-0.5">
                            Use <code className="bg-creme px-1 rounded">===INSTAGRAM===</code> para separar o plano da análise de Instagram
                          </span>
                        )}
                      </div>
                      <button
                        onClick={handleCancelarEdit}
                        className="px-4 py-2 rounded-xl border border-creme-dark text-petroleo/70 text-sm hover:bg-offwhite transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSalvarEdit}
                        disabled={salvandoEdit}
                        className="px-5 py-2 rounded-xl bg-petroleo text-creme text-sm font-medium hover:bg-petroleo-light disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                      >
                        {salvandoEdit ? 'Salvando...' : '💾 Salvar edição'}
                      </button>
                    </div>
                    <textarea
                      value={textoEdit}
                      onChange={(e) => setTextoEdit(e.target.value)}
                      style={{ fontFamily: 'monospace', minHeight: 600 }}
                      className="w-full px-4 py-3 rounded-xl border border-creme-dark bg-offwhite text-petroleo text-sm leading-relaxed focus:outline-none resize-y"
                    />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* 1. Plano de ação */}
                    <PlanoMarkdown conteudo={planoGerado} />

                    {/* 2. Separador + 3. Análise/Planejamento de Instagram */}
                    {analiseIGGerada && (
                      <>
                        <div className="my-8 pt-6 border-t-2 border-creme-dark">
                          <p className="text-xs uppercase tracking-wider text-petroleo/50 font-medium mb-1">
                            Seção complementar
                          </p>
                          <h3 className="font-playfair text-2xl text-petroleo font-semibold">
                            {tipoIGGerado === 'planejamento'
                              ? 'Planejamento Estratégico de Instagram'
                              : 'Análise Estratégica de Instagram'}
                          </h3>
                        </div>
                        <PlanoMarkdown conteudo={analiseIGGerada} />
                      </>
                    )}
                  </div>
                )}

                {mensagem && (
                  <div className="no-print mt-6 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">
                    {mensagem}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
