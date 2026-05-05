'use client'

import { useEffect, useRef, useState } from 'react'
import {
  type ImagemCarregada,
  MAX_IMAGENS,
  processarArquivos,
} from '@/lib/instagram-uploads'

export type TipoInstagram = 'analise' | 'planejamento'

export interface BlocoInstagramData {
  tipo: TipoInstagram
  imagens: ImagemCarregada[]
  contextoIG: string
}

const ROTULOS: Record<TipoInstagram, string> = {
  analise: 'Análise Estratégica',
  planejamento: 'Planejamento Estratégico',
}

interface Props {
  /** @-handle ou texto livre — pode vir da planilha do aluno e ser editado pela tutora. */
  instagramAluno?: string
  /** Disparado quando a tutora edita o campo Instagram. */
  onInstagramAlunoChange?: (valor: string) => void
  /** Disparado a cada mudança nos campos internos (tipo/imagens/contexto). */
  onChange: (data: BlocoInstagramData) => void
}

export default function BlocoInstagram({
  instagramAluno = '',
  onInstagramAlunoChange,
  onChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const [tipo, setTipo] = useState<TipoInstagram>('analise')
  const [imagens, setImagens] = useState<ImagemCarregada[]>([])
  const [contextoIG, setContextoIG] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // Propaga estado para o pai sempre que algo mudar
  useEffect(() => {
    onChange({ tipo, imagens, contextoIG })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo, imagens, contextoIG])

  async function handleFiles(files: FileList | File[]) {
    const { imagens: novas, erro: errMsg } = await processarArquivos(files, imagens)
    if (errMsg) {
      setErro(errMsg)
      return
    }
    setErro(null)
    setImagens(novas)
  }

  function removerImagem(idx: number) {
    setImagens((prev) => prev.filter((_, i) => i !== idx))
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const inputCls =
    'w-full px-4 py-2.5 rounded-xl border border-creme-dark bg-offwhite text-petroleo placeholder-petroleo/40 focus:outline-none focus:ring-2 focus:ring-petroleo/30 focus:border-petroleo transition'

  return (
    <section className="bg-white rounded-2xl border border-creme/70 shadow-sm p-7 sm:p-8">
      <h2 className="font-playfair text-xl text-petroleo font-semibold">Instagram</h2>
      <p className="text-xs text-petroleo/50 mt-1.5 mb-6">
        Análise ou planejamento estratégico do perfil — incluído junto ao plano de ação.
      </p>

      <div className="space-y-5">
        {/* Tipo */}
        <div>
          <label className="block text-sm font-medium text-petroleo mb-1.5">
            Tipo de entrega
          </label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoInstagram)}
            className={inputCls}
          >
            <option value="analise">{ROTULOS.analise}</option>
            <option value="planejamento">{ROTULOS.planejamento}</option>
          </select>
        </div>

        {/* Instagram readonly do aluno */}
        <div>
          <label className="block text-sm font-medium text-petroleo mb-1.5">
            Instagram do aluno
          </label>
          <input
            type="text"
            value={instagramAluno}
            onChange={(e) => onInstagramAlunoChange?.(e.target.value)}
            placeholder="@usuario, link ou texto livre. Pode ser editado mesmo após selecionar o aluno."
            className={inputCls}
          />
        </div>

        {/* Upload de prints */}
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
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
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

          {erro && (
            <p className="mt-2 text-xs text-red-600">{erro}</p>
          )}
        </div>

        {/* Contexto sobre o perfil */}
        <div>
          <label className="block text-sm font-medium text-petroleo mb-1.5">
            Contexto sobre o perfil{' '}
            <span className="text-petroleo/50 font-normal text-xs">(opcional)</span>
          </label>
          <textarea
            value={contextoIG}
            onChange={(e) => setContextoIG(e.target.value)}
            rows={5}
            placeholder="Descreva o momento atual do perfil, pontos de atenção, objetivos específicos para o Instagram..."
            className={`${inputCls} resize-none text-sm leading-relaxed`}
          />
        </div>
      </div>
    </section>
  )
}
