import { getAllAlunos } from '@/lib/planilha'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim().toLowerCase() ?? ''

    const todos = await getAllAlunos()

    const alunos = q
      ? todos
          .filter((a) => {
            const nome = (a['Nome completo'] ?? '').toLowerCase()
            return nome.includes(q)
          })
          .slice(0, 8)
      : todos

    return Response.json({ alunos })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return Response.json({ error: message }, { status: 500 })
  }
}
