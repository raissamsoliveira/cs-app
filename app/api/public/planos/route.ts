import { validateRequest, unauthorizedResponse } from '@/lib/apiAuth'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(request: Request) {
  if (!(await validateRequest(request))) return unauthorizedResponse()

  const { searchParams } = new URL(request.url)
  const aluno = searchParams.get('aluno')
  const tutora = searchParams.get('tutora')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10) || 20, 100)

  const supabase = createServiceClient()
  let query = supabase
    .from('planos')
    .select('id, nome_aluno, tutora, created_at, conteudo')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (aluno) query = query.ilike('nome_aluno', `%${aluno}%`)
  if (tutora) query = query.eq('tutora', tutora)

  const { data, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })

  const base = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const planos = (data ?? []).map((p) => ({
    id: p.id,
    nome_aluno: p.nome_aluno,
    tutora: p.tutora,
    criado_em: p.created_at,
    link_publico: `${base}/publico/${p.id}`,
    preview: (p.conteudo as string).slice(0, 200),
  }))

  return Response.json({ data: planos, total: planos.length })
}
