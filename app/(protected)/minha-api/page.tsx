'use client'

import { useEffect, useState, useCallback } from 'react'
import type { ApiKey } from '@/lib/apiKeys'

interface NewKeyResult {
  key: string
  preview: string
  label: string | null
}

export default function MinhaApiPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [label, setLabel] = useState('')
  const [newKey, setNewKey] = useState<NewKeyResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [revoking, setRevoking] = useState<string | null>(null)

  const fetchKeys = useCallback(async () => {
    const res = await fetch('/api/keys')
    if (res.ok) {
      const json = await res.json()
      setKeys(json.data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchKeys()
  }, [fetchKeys])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    const res = await fetch('/api/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: label.trim() || null }),
    })
    if (res.ok) {
      const result: NewKeyResult = await res.json()
      setNewKey(result)
      setLabel('')
      await fetchKeys()
    }
    setCreating(false)
  }

  async function handleRevoke(id: string) {
    setRevoking(id)
    const res = await fetch('/api/keys', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setKeys((prev) => prev.filter((k) => k.id !== id))
    }
    setRevoking(null)
  }

  async function handleCopy() {
    if (!newKey) return
    await navigator.clipboard.writeText(newKey.key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-playfair text-3xl text-petroleo font-semibold mb-2">
        Minha API Key
      </h1>
      <p className="text-gray-500 text-sm mb-8">
        Gere chaves de acesso para integrar com a API da Primus CS. Cada chave é
        exibida uma única vez — guarde em local seguro.
      </p>

      {/* Formulário de criação */}
      <form
        onSubmit={handleCreate}
        className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm"
      >
        <h2 className="font-semibold text-petroleo mb-4">Gerar nova chave</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Rótulo opcional (ex: Zapier, Make, N8N)"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-petroleo/40"
            maxLength={80}
          />
          <button
            type="submit"
            disabled={creating}
            className="px-5 py-2 bg-petroleo text-creme rounded-lg text-sm font-medium hover:bg-petroleo/90 disabled:opacity-50 transition-colors"
          >
            {creating ? 'Gerando...' : 'Gerar'}
          </button>
        </div>
      </form>

      {/* Chave recém criada */}
      {newKey && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 mb-6">
          <p className="text-amber-800 text-sm font-semibold mb-2">
            Copie sua chave agora — ela não será exibida novamente.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white border border-amber-200 rounded-lg px-4 py-2 text-sm font-mono text-gray-800 break-all">
              {newKey.key}
            </code>
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-petroleo text-creme rounded-lg text-sm font-medium hover:bg-petroleo/90 transition-colors whitespace-nowrap"
            >
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
          {newKey.label && (
            <p className="text-amber-700 text-xs mt-2">Rótulo: {newKey.label}</p>
          )}
          <button
            onClick={() => setNewKey(null)}
            className="text-amber-600 text-xs mt-3 underline hover:text-amber-800"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Lista de chaves */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-petroleo">Chaves ativas</h2>
        </div>

        {loading ? (
          <p className="text-gray-400 text-sm px-6 py-8 text-center">
            Carregando...
          </p>
        ) : keys.length === 0 ? (
          <p className="text-gray-400 text-sm px-6 py-8 text-center">
            Nenhuma chave ativa. Gere uma acima.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {keys.map((k) => (
              <li key={k.id} className="px-6 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono text-gray-700">{k.key_preview}</p>
                  {k.label && (
                    <p className="text-xs text-gray-400 mt-0.5">{k.label}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    Criada em{' '}
                    {new Date(k.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                    {k.last_used_at && (
                      <>
                        {' · '}Último uso:{' '}
                        {new Date(k.last_used_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => handleRevoke(k.id)}
                  disabled={revoking === k.id}
                  className="px-3 py-1.5 border border-red-300 text-red-600 rounded-lg text-xs hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  {revoking === k.id ? 'Revogando...' : 'Revogar'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Link para docs */}
      <p className="text-center text-sm text-gray-400 mt-6">
        Consulte a{' '}
        <a href="/api-docs" className="text-petroleo underline hover:text-petroleo/80">
          documentação da API
        </a>{' '}
        para ver os endpoints disponíveis.
      </p>
    </div>
  )
}
