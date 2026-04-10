import Anthropic from '@anthropic-ai/sdk'

/**
 * POST /api/gerar-apresentacao
 * Gera uma apresentação executiva resumida com base em uma análise de Instagram.
 * Body: { conteudo: string, nomeAluno?: string }
 * Response: { apresentacao: string }
 */

export const maxDuration = 60

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { conteudo, nomeAluno } = body as {
      conteudo: string
      nomeAluno?: string
    }

    if (!conteudo?.trim()) {
      return Response.json({ error: 'Conteúdo da análise é obrigatório.' }, { status: 400 })
    }

    const nomeFormatado = nomeAluno?.trim().toUpperCase() ?? '[NOME DO ALUNO]'

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Com base na análise de Instagram a seguir, gere uma apresentação executiva resumida para ser apresentada ao mentorado. Inclua apenas:

1. Título: ANÁLISE DE INSTAGRAM — ${nomeFormatado}
2. Posicionamento atual (1 parágrafo curto)
3. O que está funcionando (tabela simplificada: Ponto Forte | Por que funciona)
4. Plano de ação resumido (tabela: Fase | Ação Principal | Prazo)

Tom: direto, positivo, motivador. Máximo 1 página.

ANÁLISE COMPLETA:
${conteudo}`,
        },
      ],
    })

    const apresentacao = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('\n')

    return Response.json({ apresentacao })
  } catch (err) {
    console.error('[gerar-apresentacao]', err)
    const message = err instanceof Error ? err.message : 'Erro interno do servidor.'
    return Response.json({ error: message }, { status: 500 })
  }
}
