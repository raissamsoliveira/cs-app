import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { generateApiKey, hashApiKey, getUserApiKeys } from '@/lib/apiKeys'

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) return Response.json({ error: 'Não autorizado.' }, { status: 401 })

  const keys = await getUserApiKeys(user.id)
  return Response.json({ data: keys })
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser()
  if (!user) return Response.json({ error: 'Não autorizado.' }, { status: 401 })

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[POST /api/keys] SUPABASE_SERVICE_ROLE_KEY não definida')
    return Response.json({ error: 'Configuração de servidor incompleta.' }, { status: 500 })
  }

  const body = await request.json().catch(() => ({}))
  const label: string | null = body?.label?.trim() || null

  const key = generateApiKey()
  const hash = hashApiKey(key)
  const preview = key.slice(0, 14) + '...' + key.slice(-4)

  const service = createServiceClient()
  const { error } = await service.from('api_keys').insert({
    user_id: user.id,
    key_hash: hash,
    key_preview: preview,
    label,
    is_active: true,
  })

  if (error) {
    console.error('[POST /api/keys] insert error:', error.code, error.message, error.hint)
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ key, preview, label }, { status: 201 })
}

export async function PATCH(request: Request) {
  const user = await getAuthenticatedUser()
  if (!user) return Response.json({ error: 'Não autorizado.' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const { id } = body
  if (!id) return Response.json({ error: 'id é obrigatório.' }, { status: 400 })

  const service = createServiceClient()
  const { error } = await service
    .from('api_keys')
    .update({ is_active: false })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ ok: true })
}
