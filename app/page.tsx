import { redirect } from 'next/navigation'

/**
 * Raiz do app — redireciona para /dashboard.
 * O proxy.ts vai redirecionar para /login se não houver sessão ativa.
 */
export default function RootPage() {
  redirect('/dashboard')
}
