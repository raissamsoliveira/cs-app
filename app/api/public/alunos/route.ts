import { validateRequest, unauthorizedResponse } from '@/lib/apiAuth'
import { getAllAlunos } from '@/lib/planilha'

const IG_PREFIX = 'Qual seu instagram ou linkedin'
const EMAIL_KEY = 'E-mail'

export async function GET(request: Request) {
  if (!(await validateRequest(request))) return unauthorizedResponse()

  const { searchParams } = new URL(request.url)
  const nome = searchParams.get('nome')?.trim().toLowerCase() ?? ''

  try {
    const todos = await getAllAlunos()

    const filtrados = nome
      ? todos.filter((a) =>
          (a['Nome completo'] ?? '').toLowerCase().includes(nome)
        )
      : todos

    const alunos = filtrados.map((a) => {
      const igKey = Object.keys(a).find((k) => k.startsWith(IG_PREFIX))
      return {
        nome_completo: a['Nome completo'] ?? '',
        telefone: a['Telefone com DDD'] ?? '',
        instagram: igKey ? (a[igKey] ?? '') : '',
        email: a[EMAIL_KEY] ?? '',
      }
    })

    return Response.json({ data: alunos, total: alunos.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return Response.json({ error: message }, { status: 500 })
  }
}
