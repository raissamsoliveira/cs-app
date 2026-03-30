import Anthropic from '@anthropic-ai/sdk'

/**
 * POST /api/analisar-instagram
 * Analisa prints de Instagram usando visão do Claude.
 * Body: { nomeAluno: string, imagens: Array<{ data: string, mediaType: string }> }
 * Response: { analise: string }
 */

// Aumenta o timeout máximo para análise de imagens (pode ser lento)
export const maxDuration = 60

const SYSTEM_PROMPT = `Você é um especialista em social media e marketing digital com foco em posicionamento pessoal e marketing de autoridade. Analise os prints do Instagram fornecidos e gere um relatório estratégico em português com as seguintes seções:
1) Posicionamento atual da conta, 2) Análise visual do feed (consistência, estética, identidade visual, qualidade das imagens), 3) Padrão de conteúdo identificado (temas, formatos, frequência aparente), 4) Pontos fortes da presença digital atual, 5) Oportunidades de melhoria, 6) Recomendações estratégicas personalizadas para crescimento e autoridade. Seja específico, use linguagem profissional e oriente sempre para resultado de negócio.`

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface ImagemInput {
  data: string
  mediaType: string
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nomeAluno, imagens, objetivoAluno } = body as {
      nomeAluno: string
      imagens: ImagemInput[]
      objetivoAluno?: string
    }

    if (!nomeAluno?.trim()) {
      return Response.json({ error: 'Campo obrigatório: nomeAluno.' }, { status: 400 })
    }
    if (!imagens?.length) {
      return Response.json({ error: 'Envie pelo menos uma imagem.' }, { status: 400 })
    }

    const imageBlocks = imagens.map((img) => ({
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: img.mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
        data: img.data,
      },
    }))

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            ...imageBlocks,
            {
              type: 'text',
              text: [
                objetivoAluno
                  ? `CONTEXTO DO ALUNO: O objetivo principal deste aluno na mentoria é: ${objetivoAluno}. Use este contexto para personalizar as recomendações conectando-as com esse objetivo.\n`
                  : '',
                `Analise os prints do Instagram do(a) aluno(a) / perfil "${nomeAluno}" e gere o relatório estratégico completo.`,
              ]
                .filter(Boolean)
                .join('\n'),
            },
          ],
        },
      ],
    })

    const analise = message.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')

    return Response.json({ analise })
  } catch (err) {
    console.error('[analisar-instagram]', err)
    const message = err instanceof Error ? err.message : 'Erro interno do servidor.'
    return Response.json({ error: message }, { status: 500 })
  }
}
