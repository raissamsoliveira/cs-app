import Anthropic from '@anthropic-ai/sdk'

/**
 * POST /api/gerar-plano
 * Gera um Plano de Ação personalizado via API Anthropic.
 * Body: { nomeAluno, tutora, contexto, imagens? }
 * Response: { plano }
 *
 * As imagens do Instagram (quando fornecidas) são usadas apenas como contexto
 * visual — a análise de Instagram é sempre um campo separado (coluna analise_instagram).
 */

export const maxDuration = 60

const SYSTEM_PROMPT = `Você é um estrategista de Customer Success da Mentoria Primus, da Ser Mais Criativo (Samer AGI). Gere um Plano de Ação personalizado no padrão da mentoria.

MENTORIA PRIMUS — 6 meses, 4 pilares:
1. Comunicação clara, criativa e persuasiva
2. Rede social lucrativa (posicionamento digital)
3. Palestrante de referência
4. Networking intencional e de alto valor

ENTREGÁVEIS: Mentorias semanais quinzenais com Samer AGI (2h) e com liderança do time (2h). 3 cursos: Escrita Persuasiva, Oratória Criativa, IAGI para Criadores. Diagnóstico com tutora. 2 sessões de destrave com terapeuta. 2 consultorias de imagem e estilo. IAs: IAGI Criadores, IA Palestras, IA Avaliadora de Discursos, IA Financeira.

ESTRUTURA DO PLANO (use exatamente esses títulos, sem emojis):
# PLANO DE AÇÃO — [NOME]
## Principal Objetivo na Mentoria
## Principais Direcionamentos (3 a 5, título em negrito, 2-4 linhas cada)
## Tarefas
(gere uma tabela com 8 a 12 linhas e as colunas: Tarefa | Ação | Status | Material)
## Suporte

REGRAS: Segunda pessoa. Nunca mencionar PEAGs, PEAPs, De Frente com o Agi ou Encontro Nacional. Usar dados reais do aluno. Não use emojis nos títulos das seções. NÃO inclua seção de Análise de Instagram no plano — se imagens do Instagram forem fornecidas, use-as apenas como contexto visual para personalizar as demais seções.`

interface ImagemInput {
  data: string
  mediaType: string
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nomeAluno, tutora, contexto, imagens } = body as {
      nomeAluno: string
      tutora: string
      contexto: string
      imagens?: ImagemInput[]
    }

    if (!nomeAluno || !tutora || !contexto) {
      return Response.json(
        { error: 'Campos obrigatórios: nomeAluno, tutora, contexto.' },
        { status: 400 }
      )
    }

    const temImagens = Array.isArray(imagens) && imagens.length > 0

    const textoUsuario = `Crie um Plano de Ação personalizado para o seguinte aluno da Mentoria Primus:

Nome do aluno: ${nomeAluno}
Tutora responsável: ${tutora}

${contexto}

Gere o plano completo seguindo rigorosamente a estrutura e regras definidas.${
      temImagens
        ? '\n\nAs imagens do Instagram foram fornecidas como contexto visual. Use-as para personalizar o plano, mas NÃO inclua uma seção de Análise de Instagram.'
        : ''
    }`

    const messageContent = temImagens
      ? [
          ...imagens!.map((img) => ({
            type: 'image' as const,
            source: {
              type: 'base64' as const,
              media_type: img.mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
              data: img.data,
            },
          })),
          { type: 'text' as const, text: textoUsuario },
        ]
      : textoUsuario

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: messageContent }],
    })

    const plano = message.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')

    return Response.json({ plano })
  } catch (err) {
    console.error('[gerar-plano]', err)
    const message = err instanceof Error ? err.message : 'Erro interno do servidor.'
    return Response.json({ error: message }, { status: 500 })
  }
}
