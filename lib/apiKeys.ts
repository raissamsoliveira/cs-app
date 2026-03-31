import crypto from 'crypto'
import { createServiceClient } from './supabase/service'

export function generateApiKey(): string {
  return 'primus_' + crypto.randomBytes(32).toString('hex')
}

export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

/** Valida uma API key consultando o banco via service role (ignora RLS) */
export async function validateApiKey(key: string): Promise<boolean> {
  if (!key || !key.startsWith('primus_')) return false

  const hash = hashApiKey(key)
  const supabase = createServiceClient()

  const { data } = await supabase
    .from('api_keys')
    .select('id')
    .eq('key_hash', hash)
    .eq('is_active', true)
    .maybeSingle()

  if (!data) return false

  // Atualiza last_used_at de forma não-bloqueante
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)
    .then(() => {})

  return true
}

export interface ApiKey {
  id: string
  label: string | null
  key_preview: string
  created_at: string
  last_used_at: string | null
  is_active: boolean
}

/** Retorna as chaves ativas do usuário (sem key_hash) */
export async function getUserApiKeys(userId: string): Promise<ApiKey[]> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('api_keys')
    .select('id, label, key_preview, created_at, last_used_at, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  return data ?? []
}
