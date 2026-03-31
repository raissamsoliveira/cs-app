import { createClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase com service role key — ignora RLS.
 * NUNCA expor no frontend. Usar apenas em Route Handlers e Server Components.
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
