'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PlanoMarkdown from '@/components/PlanoMarkdown'
import BuscaAluno from '@/components/BuscaAluno'

interface ImagemCarregada {
  previewUrl: string
  base64: string
  mediaType: string
}

interface Props {
  nomeAlunoInicial?: string
  mostrarInputNome?: boolean
  mostrarAlunoBusca?: boolean
  mostrarTutora?: boolean
  planoId?: string
  analiseExistente?: string | null
  mostrarBotaoPublico?: boolean
}

type Modo = 'analise' | 'planejamento'

const MAX_IMAGENS = 6
const MAX_DIM = 800
const QUALIDADE = 0.7
const MAX_PAYLOAD_MB = 4

function extrairObjetivoDePlano(conteudo: string): string | null {
  const linhas = conteudo.split('\n')
  let dentro = false
  const trechos: string[] = []
  for (const linha of linhas) {
    if (linha.startsWith('## Principal Objetivo na Mentoria')) {
      dentro = true
      continue
    }
    if (dentro) {
      if (linha.startsWith('## ')) break
      if (linha.trim()) trechos.push(linha.trim())
    }
  }
  return trechos.join(' ').trim() || null
}

export default function AnaliseInstagramForm({
  nomeAlunoInicial = '',
  mostrarInputNome = false,
  mostrarAlunoBusca = false,
  mostrarTutora = false,
  planoId,
  analiseExistente,
  mostrarBotaoPublico = false,
}: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  // ── Modo (toggle) ──────────────────────────────────────────────────────────
  const [modo, setModo] = useState<Modo>('analise')

  // ── Campos comuns ──────────────────────────────────────────────────────────
  const [nomeAluno, setNomeAluno] = useState(nomeAlunoInicial)
  const [infoAdicionais, setInfoAdicionais] = useState('')
  const [analisando, setAnalisando] = useState(false)
  const [analise, setAnalise] = useState<string | null>(analiseExistente ?? null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [idPublico, setIdPublico] = useState<string | null>(null)
  const [linkCopiado, setLinkCopiado] = useState(false)

  // ── Modo A — imagens ───────────────────────────────────────────────────────
  const [imagens, setImagens] = useState<ImagemCarregada[]>([])
  const [isDragging, setIsDragging] = useState(false)

  // ── Modo B — campos de planejamento ───────────────────────────────────────
  const [nicho, setNicho] = useState('')
  const [publicoAlvo, setPublicoAlvo] = useState('')
  const [objetivoRedes, setObjetivoRedes] = useState('')
  const [referencias, setReferencias] = useState('')

  // ── Busca de aluno ─────────────────────────────────────────────────────────
  const [planoIdSelecionado, setPlanoIdSelecionado] = useState<string | null>(null)
  const [objetivoAluno, setObjetivoAluno] = useState<string | null>(null)
  const [igAluno, setIgAluno] = useState<string | null>(null)
  const [igCopiado, setIgCopiado] = useState(false)

  async function selecionarAlunoDaPlanilha(aluno: Record<string, string>) {
    const nome = aluno['Nome completo'] ?? ''
    setNomeAluno(nome)
    const igKey = Object.keys(aluno).find((k) =>
      k.startsWith('Qual seu instagram ou linkedin')
    )
    setIgAluno(igKey && aluno[igKey] ? aluno[igKey] : null)

    if (nome.trim()) {
      const supabase = createClient()
      const { data } = await supabase
        .from('planos')
        .select('id, conteudo')
        .eq('nome_aluno', nome)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (data) {
        setPlanoIdSelecionado(data.id)
        const obj = extrairObjetivoDePlano(data.conteudo)
        if (obj) setObjetivoAluno(obj)
      }
    }
  }

  // ── Tutoras ────────────────────────────────────────────────────────────────
  const [tutoras, setTutoras] = useState<string[]>([])
  const [tutoraSelecionada, setTutoraSelecionada] = useState('')

  useEffect(() => {
    if (!mostrarTutora) return
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
  }, [mostrarTutora])

  // ── Compressão de imagens ──────────────────────────────────────────────────
  function comprimirImagem(file: File): Promise<ImagemCarregada> {
    return new Promise((resolve) => {
      const objectUrl = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width)
            width = MAX_DIM
          } else {
            width = Math.round((width * MAX_DIM) / height)
            height = MAX_DIM
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', QUALIDADE)
        URL.revokeObjectURL(objectUrl)
        resolve({
          previewUrl: dataUrl,
          base64: dataUrl.split(',')[1],
          mediaType: 'image/jpeg',
        })
      }
      img.src = objectUrl
    })
  }

  async function processarArquivos(files: FileList | File[]) {
    const lista = Array.from(files).filter((f) => f.type.startsWith('image/'))
    const vagas = MAX_IMAGENS - imagens.length
    if (vagas <= 0) return

    const novas: ImagemCarregada[] = []
    for (const file of lista.slice(0, vagas)) {
      novas.push(await comprimirImagem(file))
    }

    const todasImagens = [...imagens, ...novas]
    const totalBytes = todasImagens.reduce((sum, img) => sum + img.base64.length * 0.75, 0)
    if (totalBytes > MAX_PAYLOAD_MB * 1024 * 1024) {
      setErro(
        `As imagens somam ${(totalBytes / 1024 / 1024).toFixed(1)} MB comprimidas. ` +
          `Limite: ${MAX_PAYLOAD_MB} MB. Reduza o número de imagens.`
      )
      return
    }

    setImagens(todasImagens)
    setErro(null)
  }

  function removerImagem(idx: number) {
    setImagens((prev) => prev.filter((_, i) => i !== idx))
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    processarArquivos(e.dataTransfer.files)
  }

  // ── Análise / Planejamento ─────────────────────────────────────────────────
  async function handleAnalisar() {
    if (!nomeAluno.trim()) {
      setErro('Informe o nome do aluno ou perfil.')
      return
    }
    if (modo === 'planejamento' && !nicho.trim()) {
      setErro('Informe o nicho de atuação.')
      return
    }

    setAnalisando(true)
    setErro(null)
    setSucesso(false)
    setIdPublico(null)

    try {
      const body: Record<string, unknown> = {
        nomeAluno,
        ...(objetivoAluno && { objetivoAluno }),
        ...(infoAdicionais.trim() && { infoAdicionais: infoAdicionais.trim() }),
      }

      if (modo === 'planejamento') {
        body.tipo = 'planejamento'
        body.nicho = nicho.trim()
        if (publicoAlvo.trim()) body.publicoAlvo = publicoAlvo.trim()
        if (objetivoRedes.trim()) body.objetivoRedes = objetivoRedes.trim()
        if (referencias.trim()) body.referencias = referencias.trim()
      } else {
        body.imagens = imagens.map((img) => ({ data: img.base64, mediaType: img.mediaType }))
      }

      const res = await fetch('/api/analisar-instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Erro ${res.status}`)
      }

      const { analise: resultado } = await res.json()
      setAnalise(resultado)

      if (mostrarBotaoPublico) {
        await salvarNaTabela(resultado, modo)
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao gerar análise.')
    } finally {
      setAnalisando(false)
    }
  }

  // ── Salvar em analises_instagram ───────────────────────────────────────────
  async function salvarNaTabela(conteudoAnalise: string, tipo: Modo = 'analise') {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { data, error } = await supabase
        .from('analises_instagram')
        .insert({
          nome_aluno: nomeAluno || null,
          conteudo: conteudoAnalise,
          tipo,
          criado_por: user?.id ?? null,
          ...(tutoraSelecionada && { tutora: tutoraSelecionada }),
          ...(planoIdSelecionado && { plano_id: planoIdSelecionado }),
        })
        .select('id')
        .single()

      if (!error && data) {
        setIdPublico(data.id)
      }
    } catch {
      // Falha silenciosa
    }
  }

  // ── Salvar no plano (planoId fornecido) ────────────────────────────────────
  async function handleSalvar() {
    if (!analise || !planoId) return
    setSalvando(true)
    setErro(null)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('planos')
        .update({ analise_instagram: analise })
        .eq('id', planoId)

      if (error) throw new Error(error.message)
      setSucesso(true)
      router.refresh()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

  async function handleCopiar() {
    if (!analise) return
    await navigator.clipboard.writeText(analise)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  async function handleSalvarPublico() {
    if (!analise) return
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { data, error } = await supabase
        .from('analises_instagram')
        .insert({
          nome_aluno: nomeAluno || null,
          conteudo: analise,
          tipo: modo,
          criado_por: user?.id ?? null,
          ...(tutoraSelecionada && { tutora: tutoraSelecionada }),
          ...(planoIdSelecionado && { plano_id: planoIdSelecionado }),
        })
        .select('id')
        .single()

      if (error || !data) throw new Error(error?.message ?? 'Erro ao salvar.')

      const base = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin
      const url = `${base}/analise/publico/${data.id}`
      await navigator.clipboard.writeText(url)
      setIdPublico(data.id)
      setLinkCopiado(true)
      setTimeout(() => setLinkCopiado(false), 3000)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar análise.')
    }
  }

  async function handleCopiarLink() {
    if (!idPublico) return
    const base = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin
    await navigator.clipboard.writeText(`${base}/analise/publico/${idPublico}`)
    setLinkCopiado(true)
    setTimeout(() => setLinkCopiado(false), 2000)
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Toggle de modo — apenas na página avulsa */}
      {mostrarAlunoBusca && (
        <div className="space-y-3">
          <div className="flex rounded-xl border border-creme-dark overflow-hidden">
            <button
              type="button"
              onClick={() => { setModo('analise'); setAnalise(null); setErro(null) }}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                modo === 'analise'
                  ? 'bg-petroleo text-creme'
                  : 'text-petroleo/70 hover:bg-offwhite'
              }`}
            >
              📷 Tenho Instagram
            </button>
            <button
              type="button"
              onClick={() => { setModo('planejamento'); setAnalise(null); setErro(null) }}
              className={`flex-1 py-3 text-sm font-medium transition-colors border-l border-creme-dark ${
                modo === 'planejamento'
                  ? 'bg-petroleo text-creme'
                  : 'text-petroleo/70 hover:bg-offwhite'
              }`}
            >
              🚀 Ainda não tenho Instagram
            </button>
          </div>

          <div>
            <h2 className="font-playfair text-xl font-semibold text-petroleo">
              {modo === 'analise'
                ? 'Análise Estratégica de Instagram'
                : 'Planejamento Estratégico de Instagram'}
            </h2>
            <p className="text-petroleo/50 text-xs mt-0.5">
              {modo === 'analise'
                ? 'Envie prints do perfil para gerar uma análise estratégica com IA'
                : 'Preencha os dados abaixo para criar um plano de Instagram do zero'}
            </p>
          </div>
        </div>
      )}

      {/* Campo Aluno com busca na planilha */}
      {mostrarAlunoBusca && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-petroleo mb-1.5">
            Aluno / Perfil analisado *
          </label>
          <BuscaAluno
            onSelect={selecionarAlunoDaPlanilha}
            placeholder="Buscar aluno pelo nome..."
          />

          {igAluno && modo === 'analise' && (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                readOnly
                value={igAluno}
                className="flex-1 px-4 py-2.5 rounded-xl border border-creme-dark bg-offwhite text-petroleo text-sm cursor-default"
              />
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(igAluno)
                  setIgCopiado(true)
                  setTimeout(() => setIgCopiado(false), 2000)
                }}
                title="Copiar Instagram"
                className="px-3 py-2.5 rounded-xl border border-creme-dark text-petroleo/60 hover:text-petroleo hover:border-petroleo/30 transition-colors text-sm"
              >
                {igCopiado ? '✓' : '📋'}
              </button>
            </div>
          )}

          {objetivoAluno && (
            <p className="text-xs text-petroleo/50 bg-creme/40 px-3 py-2 rounded-lg border border-creme">
              <span className="font-medium text-petroleo/70">Objetivo na mentoria:</span>{' '}
              {objetivoAluno}
            </p>
          )}
        </div>
      )}

      {/* Nome livre (página do plano) */}
      {mostrarInputNome && (
        <div>
          <label className="block text-sm font-medium text-petroleo mb-1.5">
            Nome do aluno / perfil analisado *
          </label>
          <input
            type="text"
            value={nomeAluno}
            onChange={(e) => setNomeAluno(e.target.value)}
            placeholder="Ex: João Silva (@joaosilva)"
            className="w-full px-4 py-2.5 rounded-xl border border-creme-dark bg-offwhite text-petroleo placeholder-petroleo/40 focus:outline-none focus:ring-2 focus:ring-petroleo/30 focus:border-petroleo transition text-sm"
          />
        </div>
      )}

      {/* Tutora */}
      {mostrarTutora && (
        <div>
          <label className="block text-sm font-medium text-petroleo mb-2">
            Tutora
          </label>
          {tutoras.length === 0 ? (
            <p className="text-xs text-petroleo/40">Carregando tutoras...</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tutoras.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTutoraSelecionada(tutoraSelecionada === t ? '' : t)}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                    tutoraSelecionada === t
                      ? 'bg-petroleo text-creme border-petroleo'
                      : 'border-petroleo/30 text-petroleo hover:bg-offwhite'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MODO A: upload de prints ────────────────────────────────────────── */}
      {modo === 'analise' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-petroleo">
              Prints do Instagram{' '}
              <span className="text-petroleo/50 font-normal">
                ({imagens.length}/{MAX_IMAGENS})
              </span>
              <span className="text-petroleo/40 font-normal ml-1 text-xs">(opcional)</span>
            </label>
            {imagens.length < MAX_IMAGENS && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-petroleo/60 text-xs hover:text-petroleo transition-colors"
              >
                + Adicionar
              </button>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => e.target.files && processarArquivos(e.target.files)}
            className="hidden"
          />

          {imagens.length === 0 ? (
            <div
              onDrop={onDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-petroleo bg-creme/20'
                  : 'border-creme-dark hover:border-petroleo/40 hover:bg-offwhite'
              }`}
            >
              <p className="text-3xl mb-2">📷</p>
              <p className="text-sm font-medium text-petroleo">
                Clique ou arraste as imagens aqui
              </p>
              <p className="text-xs text-petroleo/50 mt-1">
                Até {MAX_IMAGENS} prints · PNG, JPG, WEBP · comprimidos automaticamente
              </p>
            </div>
          ) : (
            <div
              onDrop={onDrop}
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
              {imagens.length < MAX_IMAGENS && (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-creme-dark hover:border-petroleo/40 flex items-center justify-center text-petroleo/30 hover:text-petroleo/60 transition-colors text-2xl"
                >
                  +
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── MODO B: campos de planejamento ─────────────────────────────────── */}
      {modo === 'planejamento' && (
        <div className="space-y-4">
          {/* Nicho */}
          <div>
            <label className="block text-sm font-medium text-petroleo mb-1.5">
              Nicho de atuação *
            </label>
            <input
              type="text"
              value={nicho}
              onChange={(e) => setNicho(e.target.value)}
              placeholder="Ex: Advogado trabalhista, Médica ortopedista, Coach financeiro..."
              className="w-full px-4 py-2.5 rounded-xl border border-creme-dark bg-offwhite text-petroleo placeholder-petroleo/40 focus:outline-none focus:ring-2 focus:ring-petroleo/30 focus:border-petroleo transition text-sm"
            />
          </div>

          {/* Público-alvo */}
          <div>
            <label className="block text-sm font-medium text-petroleo mb-1.5">
              Público-alvo{' '}
              <span className="font-normal text-petroleo/50">(opcional)</span>
            </label>
            <textarea
              value={publicoAlvo}
              onChange={(e) => setPublicoAlvo(e.target.value)}
              placeholder="Descreva quem você quer atingir: perfil, dores, desejos..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-creme-dark bg-offwhite text-petroleo placeholder-petroleo/40 focus:outline-none focus:ring-2 focus:ring-petroleo/30 focus:border-petroleo transition text-sm resize-none"
            />
          </div>

          {/* Objetivo nas redes */}
          <div>
            <label className="block text-sm font-medium text-petroleo mb-1.5">
              Objetivo nas redes sociais{' '}
              <span className="font-normal text-petroleo/50">(opcional)</span>
            </label>
            <textarea
              value={objetivoRedes}
              onChange={(e) => setObjetivoRedes(e.target.value)}
              placeholder="Ex: Atrair clientes, construir autoridade, vender infoprodutos..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-creme-dark bg-offwhite text-petroleo placeholder-petroleo/40 focus:outline-none focus:ring-2 focus:ring-petroleo/30 focus:border-petroleo transition text-sm resize-none"
            />
          </div>

          {/* Referências */}
          <div>
            <label className="block text-sm font-medium text-petroleo mb-1.5">
              Referências de perfis{' '}
              <span className="font-normal text-petroleo/50">(opcional)</span>
            </label>
            <input
              type="text"
              value={referencias}
              onChange={(e) => setReferencias(e.target.value)}
              placeholder="Perfis do Instagram que você admira ou quer se inspirar"
              className="w-full px-4 py-2.5 rounded-xl border border-creme-dark bg-offwhite text-petroleo placeholder-petroleo/40 focus:outline-none focus:ring-2 focus:ring-petroleo/30 focus:border-petroleo transition text-sm"
            />
          </div>
        </div>
      )}

      {/* Informações adicionais */}
      <div>
        <label className="block text-sm font-medium text-petroleo mb-1.5">
          Informações adicionais{' '}
          <span className="font-normal text-petroleo/50">(opcional)</span>
        </label>
        <textarea
          value={infoAdicionais}
          onChange={(e) => setInfoAdicionais(e.target.value)}
          placeholder="Descreva o contexto do aluno, objetivos específicos, nicho de atuação, público-alvo ou qualquer informação relevante que ajude na análise..."
          rows={4}
          className="w-full px-4 py-2.5 rounded-xl border border-creme-dark bg-offwhite text-petroleo placeholder-petroleo/40 focus:outline-none focus:ring-2 focus:ring-petroleo/30 focus:border-petroleo transition text-sm resize-none"
          style={{ minHeight: 100 }}
        />
      </div>

      {/* Erro */}
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {erro}
        </div>
      )}

      {/* Botão gerar */}
      <button
        onClick={handleAnalisar}
        disabled={analisando}
        className="w-full bg-petroleo text-creme py-3 px-6 rounded-xl font-semibold text-sm hover:bg-petroleo-light disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {analisando
          ? modo === 'planejamento' ? '🚀 Gerando planejamento...' : '🔍 Analisando...'
          : modo === 'planejamento' ? '🚀 Gerar Planejamento' : '🔍 Gerar Análise'}
      </button>

      {/* Resultado */}
      {analise && (
        <div className="bg-white rounded-2xl shadow-sm border border-creme p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-playfair text-lg text-petroleo font-semibold">
              {modo === 'planejamento' ? 'Planejamento gerado' : 'Análise gerada'}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleCopiar}
                className="text-petroleo/60 text-xs hover:text-petroleo transition-colors px-3 py-1.5 rounded-lg border border-creme-dark hover:border-petroleo/30"
              >
                {copiado ? '✓ Copiado' : 'Copiar'}
              </button>
              <button
                onClick={() => window.print()}
                className="text-petroleo/60 text-xs hover:text-petroleo transition-colors px-3 py-1.5 rounded-lg border border-creme-dark hover:border-petroleo/30"
              >
                PDF
              </button>
            </div>
          </div>

          <div id="analise-conteudo" className="max-h-[600px] overflow-y-auto">
            <PlanoMarkdown conteudo={analise} />
          </div>

          {/* Salvar no plano */}
          {planoId && (
            <div className="mt-4 pt-4 border-t border-creme flex items-center gap-3">
              <button
                onClick={handleSalvar}
                disabled={salvando}
                className="bg-petroleo text-creme py-2 px-5 rounded-xl font-medium text-sm hover:bg-petroleo-light disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {salvando ? 'Salvando...' : '💾 Salvar Análise'}
              </button>
              {sucesso && (
                <span className="text-sm text-green-600">✓ Análise salva com sucesso!</span>
              )}
            </div>
          )}

          {/* Link público */}
          {mostrarBotaoPublico && idPublico && (
            <div className="mt-4 pt-4 border-t border-creme">
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-offwhite rounded-xl px-4 py-2.5 text-sm text-petroleo/70 font-mono truncate border border-creme-dark">
                  {process.env.NEXT_PUBLIC_APP_URL ?? ''}/analise/publico/{idPublico}
                </div>
                <button
                  onClick={handleCopiarLink}
                  className="px-4 py-2.5 rounded-xl bg-petroleo text-creme text-sm font-medium hover:bg-petroleo-light transition-colors whitespace-nowrap"
                >
                  {linkCopiado ? '✓ Copiado!' : '🔗 Copiar link'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Análise já salva */}
      {analiseExistente && !analise && (
        <div className="bg-white rounded-2xl shadow-sm border border-creme p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-playfair text-lg text-petroleo font-semibold">
              Análise salva
            </h3>
            <button
              onClick={() => setAnalise(analiseExistente)}
              className="text-petroleo/60 text-xs hover:text-petroleo transition-colors"
            >
              Regenerar
            </button>
          </div>
          <PlanoMarkdown conteudo={analiseExistente} />
        </div>
      )}
    </div>
  )
}
