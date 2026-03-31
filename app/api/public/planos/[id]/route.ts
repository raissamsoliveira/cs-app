import { validateRequest, unauthorizedResponse } from '@/lib/apiAuth'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(
  request: Request,
  ctx: RouteContext<'/api/public/planos/[id]'>
) {
  if (!(await validateRequest(request))) return unauthorizedResponse()

  const { id } = await ctx.params
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('planos')
    .select('id, nome_aluno, tutora, created_at, conteudo')
    .eq('id', id)
    .maybeSingle()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  if (!data) return Response.json({ error: 'Não encontrado.' }, { status: 404 })

  const base = process.env.NEXT_PUBLIC_APP_URL ?? ''
  return Response.json({
    id: data.id,
    nome_aluno: data.nome_aluno,
    tutora: data.tutora,
    criado_em: data.created_at,
    link_publico: `${base}/publico/${data.id}`,
    conteudo: data.conteudo,
  })
}
