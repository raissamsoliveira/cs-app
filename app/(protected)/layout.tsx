import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'

/**
 * Layout de rotas protegidas.
 * Verifica autenticação e renderiza a Navbar.
 * O proxy.ts também protege as rotas, mas esta verificação dupla
 * garante segurança em Server Components.
 */
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 animate-fade-in">
        {children}
      </main>
    </div>
  )
}
