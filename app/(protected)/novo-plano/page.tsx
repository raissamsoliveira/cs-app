'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PlanoMarkdown from '@/components/PlanoMarkdown'

type Aba = 'texto-bruto' | 'campos'

interface ImagemCarregada {
  previewUrl: string  // data URL completo para <img src>
  base64: string      // dados após a vírgula
  mediaType: string
}

/**
 * Novo Plano — formulário com duas abas para geração de planos de ação.
 * Aba 1: Colar texto bruto sobre o aluno.
 * Aba 2: Preencher campos estruturados.
 */
export default function NovoPlanoPage() {
  const router = useRouter()

  const [aba, setAba] = useState<Aba>('texto-bruto')

  // Campos comuns
  const [nomeAluno, setNomeAluno] = useState('')
  const [tutora, setTutora] = useState('')

  // Aba 1: texto bruto
  const [textoBruto, setTextoBruto] = useState('')

  // Aba 2: campos estruturados
  const [objetivo, setObjetivo] = useState('')
  const [desafios, setDesafios] = useState('')
  const [background, setBackground] = useState('')
  const [areaAtuacao, setAreaAtuacao] = useState('')
  const [observacoes, setObservacoes] = useState('')

  // Instagram — imagens e análise gerada
  const [imagens, setImagens] = useState<ImagemCarregada[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const inputRefInstagram = useRef<HTMLInputElement>(null)
  const [analiseInstagram, setAnaliseInstagram] = useState<string | null>(null)

  // Estado da geração
  const [gerando, setGerando] = useState(false)
  const [planoGerado, setPlanoGerado] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  // Estado de salvar / criar Notion
  const [salvando, setSalvando] = useState(false)
  const [criandoNotion, setCriandoNotion] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [notionUrl, setNotionUrl] = useState<string | null>(null)

  // ── Handlers de upload de imagens ──────────────────────────────────────────

  async function processarImagens(files: FileList | File[]) {
    const lista = Array.from(files).filter((f) => f.type.startsWith('image/'))
    const vagas = 6 - imagens.length
    if (vagas <= 0) return

    const novas: ImagemCarregada[] = []
    for (const file of lista.slice(0, vagas)) {
      const previewUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(file)
      })
      novas.push({ previewUrl, base64: previewUrl.split(',')[1], mediaType: file.type })
    }

    setImagens((prev) => [...prev, ...novas])
  }

  function removerImagem(idx: number) {
    setImagens((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleGerar() {
    if (!nomeAluno.trim() || !tutora.trim()) {
      setErro('Preencha o nome do aluno e a tutora antes de gerar o plano.')
      return
    }

    setGerando(true)
    setErro(null)
    setPlanoGerado(null)
    setAnaliseInstagram(null)
    setMensagem(null)
    setNotionUrl(null)

    // Monta o contexto conforme a aba ativa
    let contexto = ''
    if (aba === 'texto-bruto') {
      if (!textoBruto.trim()) {
        setErro('Cole algum texto sobre o aluno antes de gerar.')
        setGerando(false)
        return
      }
      contexto = `INFORMAÇÕES DO ALUNO (texto bruto):\n${textoBruto}`
    } else {
      contexto = [
        `Nome: ${nomeAluno}`,
        `Tutora: ${tutora}`,
        objetivo && `Objetivo principal: ${objetivo}`,
        desafios && `Principais desafios: ${desafios}`,
        background && `Background: ${background}`,
        areaAtuacao && `Área de atuação: ${areaAtuacao}`,
        observacoes && `Observações: ${observacoes}`,
      ]
        .filter(Boolean)
        .join('\n')
    }

    try {
      const res = await fetch('/api/gerar-plano', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomeAluno,
          tutora,
          contexto,
          ...(imagens.length > 0 && {
            imagens: imagens.map((img) => ({ data: img.base64, mediaType: img.mediaType })),
          }),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Erro ${res.status}`)
      }

      const { plano, analiseInstagram: analise } = await res.json()
      setPlanoGerado(plano)
      if (analise) setAnaliseInstagram(analise)
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

    // Cliente criado dentro do handler para não executar durante SSR
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase.from('planos').insert({
      nome_aluno: nomeAluno,
      tutora,
      conteudo: planoGerado,
      criado_por: user?.id,
      ...(analiseInstagram && { analise_instagram: analiseInstagram }),
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
            <input
              type="text"
              value={nomeAluno}
              onChange={(e) => setNomeAluno(e.target.value)}
              placeholder="Ex: João Silva"
              className="w-full px-4 py-2.5 rounded-xl border border-creme-dark bg-offwhite text-petroleo placeholder-petroleo/40 focus:outline-none focus:ring-2 focus:ring-petroleo/30 focus:border-petroleo transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-petroleo mb-1.5">
              Tutora *
            </label>
            <input
              type="text"
              value={tutora}
              onChange={(e) => setTutora(e.target.value)}
              placeholder="Ex: Ana Paula"
              className="w-full px-4 py-2.5 rounded-xl border border-creme-dark bg-offwhite text-petroleo placeholder-petroleo/40 focus:outline-none focus:ring-2 focus:ring-petroleo/30 focus:border-petroleo transition"
            />
          </div>
        </div>
      </div>

      {/* Análise de Instagram (opcional) */}
      <div className="bg-white rounded-2xl shadow-sm border border-creme p-6 mb-6">
        <h2 className="font-playfair text-lg text-petroleo font-semibold mb-1">
          Análise de Instagram <span className="text-petroleo/40 font-normal text-sm">(opcional)</span>
        </h2>
        <p className="text-petroleo/50 text-xs mb-4">
          Anexe até 6 prints do perfil do aluno para gerar uma análise estratégica junto com o plano
        </p>

        <input
          ref={inputRefInstagram}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => e.target.files && processarImagens(e.target.files)}
          className="hidden"
        />

        {imagens.length === 0 ? (
          <div
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); processarImagens(e.dataTransfer.files) }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => inputRefInstagram.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragging ? 'border-petroleo bg-creme/20' : 'border-creme-dark hover:border-petroleo/40 hover:bg-offwhite'
            }`}
          >
            <p className="text-2xl mb-1">📷</p>
            <p className="text-sm font-medium text-petroleo">Clique ou arraste prints do Instagram</p>
            <p className="text-xs text-petroleo/40 mt-0.5">Até 6 imagens · PNG, JPG, WEBP</p>
          </div>
        ) : (
          <div
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); processarImagens(e.dataTransfer.files) }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            className={`grid grid-cols-3 gap-3 p-3 rounded-xl border-2 border-dashed transition-colors ${
              isDragging ? 'border-petroleo bg-creme/10' : 'border-creme-dark'
            }`}
          >
            {imagens.map((img, i) => (
              <div key={i} className="relative group aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.previewUrl}
                  alt={`Print ${i + 1}`}
                  className="w-full h-full object-cover rounded-lg border border-creme"
                />
                <button
                  onClick={() => removerImagem(i)}
                  className="absolute top-1 right-1 w-5 h-5 bg-petroleo text-creme rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity leading-none"
                >
                  ×
                </button>
              </div>
            ))}
            {imagens.length < 6 && (
              <button
                type="button"
                onClick={() => inputRefInstagram.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-creme-dark hover:border-petroleo/40 flex items-center justify-center text-petroleo/30 hover:text-petroleo/60 transition-colors text-2xl"
              >
                +
              </button>
            )}
          </div>
        )}
      </div>

      {/* Abas */}
      <div className="bg-white rounded-2xl shadow-sm border border-creme p-6 mb-6">
        {/* Seletor de aba */}
        <div className="flex gap-1 mb-6 bg-offwhite p-1 rounded-xl">
          <button
            onClick={() => setAba('texto-bruto')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              aba === 'texto-bruto'
                ? 'bg-petroleo text-creme'
                : 'text-petroleo/60 hover:text-petroleo'
            }`}
          >
            Colar Texto Bruto
          </button>
          <button
            onClick={() => setAba('campos')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              aba === 'campos'
                ? 'bg-petroleo text-creme'
                : 'text-petroleo/60 hover:text-petroleo'
            }`}
          >
            Preencher Campos
          </button>
        </div>

        {/* Conteúdo da aba */}
        {aba === 'texto-bruto' ? (
          <div>
            <label className="block text-sm font-medium text-petroleo mb-1.5">
              Texto com informações do aluno
            </label>
            <textarea
              value={textoBruto}
              onChange={(e) => setTextoBruto(e.target.value)}
              rows={10}
              placeholder="Cole aqui qualquer texto sobre o aluno — diagnóstico, anotações, entrevista, formulário de inscrição, etc."
              className="w-full px-4 py-3 rounded-xl border border-creme-dark bg-offwhite text-petroleo placeholder-petroleo/40 focus:outline-none focus:ring-2 focus:ring-petroleo/30 focus:border-petroleo transition resize-none text-sm leading-relaxed"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <CampoTexto
              label="Objetivo Principal na Mentoria"
              value={objetivo}
              onChange={setObjetivo}
              placeholder="Ex: Construir autoridade digital como especialista em marketing criativo"
            />
            <CampoTexto
              label="Principais Desafios"
              value={desafios}
              onChange={setDesafios}
              placeholder="Ex: Dificuldade em falar em público, falta de consistência nas redes sociais"
            />
            <CampoTexto
              label="Background / Experiência"
              value={background}
              onChange={setBackground}
              placeholder="Ex: Designer há 5 anos, trabalha com agências de publicidade"
            />
            <CampoTexto
              label="Área de Atuação"
              value={areaAtuacao}
              onChange={setAreaAtuacao}
              placeholder="Ex: Design, Marketing, Educação, Saúde..."
            />
            <CampoTexto
              label="Observações Adicionais"
              value={observacoes}
              onChange={setObservacoes}
              placeholder="Qualquer informação relevante sobre o aluno"
              rows={3}
            />
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

          {/* Conteúdo do plano renderizado com markdown */}
          <div className="border border-offwhite bg-offwhite rounded-xl p-5 max-h-[600px] overflow-y-auto">
            <PlanoMarkdown conteudo={planoGerado} />
          </div>

          {/* Mensagem de feedback */}
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

          {/* Ações */}
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

/* Campo de texto reutilizável */
function CampoTexto({
  label,
  value,
  onChange,
  placeholder,
  rows = 2,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-petroleo mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl border border-creme-dark bg-offwhite text-petroleo placeholder-petroleo/40 focus:outline-none focus:ring-2 focus:ring-petroleo/30 focus:border-petroleo transition resize-none text-sm"
      />
    </div>
  )
}
