'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PlanoMarkdown from '@/components/PlanoMarkdown'
import BuscaAluno from '@/components/BuscaAluno'

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

// ── Componente principal ─────────────────────────────────────────────────────

export default function NovoPlanoPage() {
  const router = useRouter()

  // Campos comuns
  const [nomeAluno, setNomeAluno] = useState('')
  const [tutora, setTutora] = useState('')
  const [tutoras, setTutoras] = useState<string[]>([])

  // Aluno selecionado da planilha
  const [alunoSelecionado, setAlunoSelecionado] = useState<Record<string, string> | null>(null)
  const [contextoAluno, setContextoAluno] = useState('')
  const [painelAberto, setPainelAberto] = useState(true)
  const [abaAluno, setAbaAluno] = useState<AbaAluno>('identificacao')

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('planos')
      .select('tutora')
      .not('tutora', 'is', null)
      .order('tutora')
      .then(({ data }) => {
        const lista = [...new Set((data ?? []).map((p) => p.tutora as string))]
        setTutoras(lista)
      })
  }, [])

  // Contexto adicional
  const [textoBruto, setTextoBruto] = useState('')

  // PDA21 — PDF opcional
  const [pda21Base64, setPda21Base64] = useState<string | null>(null)
  const [nomePda21, setNomePda21] = useState('')
  const inputRefPda21 = useRef<HTMLInputElement>(null)

  // Estado da geração
  const [gerando, setGerando] = useState(false)
  const [planoGerado, setPlanoGerado] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  // Estado de salvar / criar Notion
  const [salvando, setSalvando] = useState(false)
  const [criandoNotion, setCriandoNotion] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [notionUrl, setNotionUrl] = useState<string | null>(null)

  // ── Handler BuscaAluno ────────────────────────────────────────────────────

  function handleSelecionarAluno(aluno: Record<string, string>) {
    setAlunoSelecionado(aluno)
    setNomeAluno(aluno['Nome completo'] ?? '')
    setContextoAluno(buildAlunoContext(aluno))
    setPainelAberto(true)
  }

  // ── Handler PDA21 ──────────────────────────────────────────────────────────

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

  // ── Handler principal ──────────────────────────────────────────────────────

  async function handleGerar() {
    if (!nomeAluno.trim() || !tutora.trim()) {
      setErro('Preencha o nome do aluno e a tutora antes de gerar o plano.')
      return
    }

    setGerando(true)
    setErro(null)
    setPlanoGerado(null)
    setMensagem(null)
    setNotionUrl(null)

    // Monta o contexto: dados da planilha + contexto adicional
    let contexto = contextoAluno ? contextoAluno + '\n\n' : ''

    if (!textoBruto.trim() && !contextoAluno) {
      setErro('Selecione um aluno da planilha ou cole algum contexto antes de gerar.')
      setGerando(false)
      return
    }

    if (textoBruto.trim()) {
      contexto += `INFORMAÇÕES ADICIONAIS:\n${textoBruto}`
    }

    try {
      const res = await fetch('/api/gerar-plano', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomeAluno,
          tutora,
          contexto,
          ...(pda21Base64 && { pda21: pda21Base64 }),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Erro ${res.status}`)
      }

      const { plano } = await res.json()
      setPlanoGerado(plano)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao gerar o plano. Tente novamente.')
    } finally {
      setGerando(false)
    }
  }

  async function handleSalvar() {
    if (!planoGerado) return
    setSalvando(true)
    setMensagem(null)
    setErro(null)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase.from('planos').insert({
      nome_aluno: nomeAluno,
      tutora,
      conteudo: planoGerado,
      criado_por: user?.id,
    })

    if (error) {
      setErro('Erro ao salvar o plano: ' + error.message)
    } else {
      setMensagem('Plano salvo com sucesso no Supabase!')
    }
    setSalvando(false)
  }

  async function handleCriarNotion() {
    if (!planoGerado) return
    setCriandoNotion(true)
    setMensagem(null)
    setErro(null)

    try {
      const res = await fetch('/api/criar-notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomeAluno, tutora, conteudo: planoGerado }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Erro ${res.status}`)
      }

      const { url } = await res.json()
      setNotionUrl(url)
      setMensagem('Página criada no Notion!')
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao criar no Notion.')
    } finally {
      setCriandoNotion(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Título */}
      <div className="mb-8">
        <h1 className="font-playfair text-3xl text-petroleo font-semibold">
          Novo Plano de Ação
        </h1>
        <p className="text-petroleo/60 text-sm mt-1">
          Gere um plano personalizado para o aluno da Mentoria Primus
        </p>
      </div>

      {/* Campos comuns */}
      <div className="bg-white rounded-2xl shadow-sm border border-creme p-6 mb-6">
        <h2 className="font-playfair text-lg text-petroleo font-semibold mb-4">
          Identificação
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-petroleo mb-1.5">
              Nome do Aluno *
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
              className="w-full px-4 py-2.5 rounded-xl border border-creme-dark bg-offwhite text-petroleo focus:outline-none focus:ring-2 focus:ring-petroleo/30 focus:border-petroleo transition"
            >
              <option value="">Selecione a tutora</option>
              {tutoras.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Painel "Dados do Aluno" — exibido após seleção na planilha */}
      {alunoSelecionado && (
        <div className="bg-white rounded-2xl shadow-sm border border-creme mb-6 overflow-hidden">
          {/* Cabeçalho colapsável */}
          <button
            onClick={() => setPainelAberto((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-offwhite/50 transition-colors"
          >
            <span className="font-playfair text-lg text-petroleo font-semibold">
              Dados do aluno
            </span>
            <span className="text-petroleo/50 text-sm">
              {painelAberto ? '▲ Recolher' : '▼ Expandir'}
            </span>
          </button>

          {painelAberto && (
            <div className="px-6 pb-6">
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
        </div>
      )}

      {/* Botão secundário — só aparece após selecionar aluno da planilha */}
      {alunoSelecionado && (
        <button
          onClick={handleGerar}
          disabled={gerando}
          className="w-full mb-6 py-3 px-6 rounded-xl font-medium text-sm border-2 border-petroleo text-petroleo hover:bg-petroleo hover:text-creme disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {gerando ? '✨ Gerando plano...' : '✨ Gerar plano com dados da planilha'}
        </button>
      )}

      {/* Contexto adicional */}
      <div className="bg-white rounded-2xl shadow-sm border border-creme p-6 mb-6">
        <label className="block text-sm font-medium text-petroleo mb-1">
          Contexto adicional
          {alunoSelecionado && (
            <span className="text-petroleo/40 font-normal ml-1">(opcional)</span>
          )}
        </label>
        <p className="text-xs text-petroleo/50 mb-3">
          Informações extras sobre o aluno — anotações, observações da tutora, etc.
        </p>
        <textarea
          value={textoBruto}
          onChange={(e) => setTextoBruto(e.target.value)}
          rows={8}
          placeholder="Cole aqui anotações, observações extras ou qualquer contexto adicional sobre o aluno..."
          className="w-full px-4 py-3 rounded-xl border border-creme-dark bg-offwhite text-petroleo placeholder-petroleo/40 focus:outline-none focus:ring-2 focus:ring-petroleo/30 focus:border-petroleo transition resize-none text-sm leading-relaxed"
        />
      </div>

      {/* PDA21 — opcional */}
      <div className="bg-white rounded-2xl shadow-sm border border-creme p-6 mb-6">
        <h2 className="font-playfair text-lg text-petroleo font-semibold mb-1">
          Plano de Ataque (PDA21){' '}
          <span className="text-petroleo/40 font-normal text-sm">(opcional)</span>
        </h2>
        <p className="text-petroleo/50 text-xs mb-4">
          Envie o PDF do PDA21 preenchido pelo aluno para enriquecer o plano de ação
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
            className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer border-creme-dark hover:border-petroleo/40 hover:bg-offwhite transition-colors"
          >
            <p className="text-2xl mb-1">📄</p>
            <p className="text-sm font-medium text-petroleo">Clique para selecionar o PDF</p>
            <p className="text-xs text-petroleo/40 mt-0.5">Apenas arquivos PDF</p>
          </div>
        )}
      </div>

      {/* Feedback de erro */}
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
          {erro}
        </div>
      )}

      {/* Botão gerar */}
      <button
        onClick={handleGerar}
        disabled={gerando}
        className="w-full bg-petroleo text-creme py-3.5 px-6 rounded-xl font-semibold text-sm hover:bg-petroleo-light disabled:opacity-60 disabled:cursor-not-allowed transition-colors mb-8"
      >
        {gerando ? '✨ Gerando plano...' : '✨ Gerar Plano de Ação'}
      </button>

      {/* Plano gerado */}
      {planoGerado && (
        <div className="bg-white rounded-2xl shadow-sm border border-creme p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-playfair text-xl text-petroleo font-semibold">
              Plano Gerado
            </h2>
            <button
              onClick={() => navigator.clipboard.writeText(planoGerado)}
              className="text-petroleo/60 text-sm hover:text-petroleo transition-colors px-3 py-1.5 rounded-lg border border-creme-dark hover:border-petroleo/30"
            >
              Copiar
            </button>
          </div>

          <div className="border border-offwhite bg-offwhite rounded-xl p-5 max-h-[600px] overflow-y-auto">
            <PlanoMarkdown conteudo={planoGerado} />
          </div>

          {mensagem && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">
              {mensagem}
              {notionUrl && (
                <a
                  href={notionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 underline hover:no-underline"
                >
                  Abrir no Notion →
                </a>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mt-5">
            <button
              onClick={handleSalvar}
              disabled={salvando}
              className="flex-1 bg-petroleo text-creme py-2.5 px-5 rounded-xl font-medium text-sm hover:bg-petroleo-light disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {salvando ? 'Salvando...' : '💾 Salvar no Supabase'}
            </button>
            <button
              onClick={handleCriarNotion}
              disabled={criandoNotion}
              className="flex-1 bg-creme text-petroleo border border-creme-dark py-2.5 px-5 rounded-xl font-medium text-sm hover:bg-creme-dark disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {criandoNotion ? 'Criando...' : '📝 Criar no Notion'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

