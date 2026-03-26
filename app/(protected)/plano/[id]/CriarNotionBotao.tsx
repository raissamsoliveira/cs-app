'use client'

import { useState } from 'react'

interface Props {
  nomeAluno: string
  tutora: string
  conteudo: string
}

export default function CriarNotionBotao({ nomeAluno, tutora, conteudo }: Props) {
  const [loading, setLoading] = useState(false)
  const [url, setUrl] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  async function criarNotion() {
    setLoading(true)
    setErro(null)

    try {
      const res = await fetch('/api/criar-notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomeAluno, tutora, conteudo }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Erro ao criar no Notion')
      }

      const { url: notionUrl } = await res.json()
      setUrl(notionUrl)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 flex items-center justify-center gap-1 bg-creme text-petroleo border border-creme-dark py-2.5 px-5 rounded-xl font-medium text-sm hover:bg-creme-dark transition-colors"
      >
        ✓ Abrir no Notion →
      </a>
    )
  }

  return (
    <button
      onClick={criarNotion}
      disabled={loading}
      title={erro ?? undefined}
      className="flex-1 bg-creme text-petroleo border border-creme-dark py-2.5 px-5 rounded-xl font-medium text-sm hover:bg-creme-dark disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
    >
      {loading ? 'Criando...' : erro ? '❌ Tentar novamente' : '📝 Criar no Notion'}
    </button>
  )
}
