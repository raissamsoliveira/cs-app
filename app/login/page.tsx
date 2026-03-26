'use client'

// Força renderização dinâmica — a página de login usa Supabase client
// e não deve ser pré-renderizada em build time sem as envvars.
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Cria o cliente apenas dentro do handler (evita execução no servidor durante SSR)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('E-mail ou senha inválidos. Verifique seus dados e tente novamente.')
      setLoading(false)
      return
    }

    // Redireciona após login bem-sucedido
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-offwhite px-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Cabeçalho */}
        <div className="text-center mb-10">
          <h1 className="font-playfair text-4xl text-petroleo font-semibold mb-2">
            Primus CS
          </h1>
          <p className="text-petroleo/60 text-sm">
            Mentoria Primus — Ser Mais Criativo
          </p>
        </div>

        {/* Card de login */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-creme">
          <h2 className="font-playfair text-2xl text-petroleo mb-6">Entrar</h2>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* E-mail */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-petroleo mb-1.5"
              >
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-4 py-3 rounded-xl border border-creme-dark bg-offwhite text-petroleo placeholder-petroleo/40 focus:outline-none focus:ring-2 focus:ring-petroleo/30 focus:border-petroleo transition"
              />
            </div>

            {/* Senha */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-petroleo mb-1.5"
              >
                Senha
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-creme-dark bg-offwhite text-petroleo placeholder-petroleo/40 focus:outline-none focus:ring-2 focus:ring-petroleo/30 focus:border-petroleo transition"
              />
            </div>

            {/* Erro */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-petroleo text-creme py-3 px-6 rounded-xl font-semibold text-sm hover:bg-petroleo-light disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-petroleo/40 text-xs mt-6">
          © {new Date().getFullYear()} Mentoria Primus · Ser Mais Criativo
        </p>
      </div>
    </div>
  )
}
