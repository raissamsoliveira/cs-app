import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Cliente Supabase para uso em Server Components e Route Handlers.
 * Lê/escreve cookies para manter a sessão do usuário.
 * Nota: cookies() é async no Next.js 16 — sempre usar await.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll chamado de Server Component — ignorar.
            // O proxy.ts cuida de renovar a sessão.
          }
        },
      },
    }
  )
}
