import { validateRequest, unauthorizedResponse } from '@/lib/apiAuth'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(request: Request) {
  if (!(await validateRequest(request))) return unauthorizedResponse()

  const { searchParams } = new URL(request.url)
  const aluno = searchParams.get('aluno')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10) || 20, 100)

  const supabase = createServiceClient()
  let query = supabase
    .from('analises_instagram')
    .select('id, nome_aluno, tutora, created_at, conteudo')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (aluno) query = query.ilike('nome_aluno', `%${aluno}%`)

  const { data, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })

  const analises = (data ?? []).map((a) => ({
    id: a.id,
    nome_aluno: a.nome_aluno,
    tutora: a.tutora,
    criado_em: a.created_at,
    preview: (a.conteudo as string).slice(0, 200),
  }))

  return Response.json({ data: analises, total: analises.length })
}
