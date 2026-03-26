import Anthropic from '@anthropic-ai/sdk'

/**
 * POST /api/gerar-plano
 * Gera um Plano de Ação personalizado via API Anthropic (claude-sonnet-4-20250514).
 * Body: { nomeAluno, tutora, contexto, imagens? }
 * Response: { plano, analiseInstagram? }
 */

// Aumenta timeout para suportar análise de imagens
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

REGRAS: Segunda pessoa. Nunca mencionar PEAGs, PEAPs, De Frente com o Agi ou Encontro Nacional. Usar dados reais do aluno. Não use emojis nos títulos das seções.`

const INSTRUCAO_INSTAGRAM = `

Além do plano de ação, analise os prints do Instagram fornecidos e insira uma seção '## Análise de Instagram' ENTRE as seções 'Principais Direcionamentos' e 'Tarefas'. A seção deve conter: 1) Posicionamento atual da conta, 2) Análise visual do feed, 3) Padrão de conteúdo identificado, 4) Pontos fortes, 5) Oportunidades de melhoria, 6) Recomendações estratégicas. Seja específico e use linguagem profissional. Não use emojis no título da seção.`

interface ImagemInput {
  data: string
  mediaType: string
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

/** Extrai o trecho "## Análise de Instagram" do plano gerado */
function extrairAnaliseInstagram(plano: string): string | null {
  // Suporta tanto o formato novo (sem emoji) quanto o legado (com emoji)
  const marcadores = ['## Análise de Instagram', '## 📊 Análise de Instagram']
  for (const marcador of marcadores) {
    const idx = plano.indexOf(marcador)
    if (idx !== -1) {
      // Extrai só até a próxima seção ## (ou fim do texto)
      const resto = plano.slice(idx)
      const fimIdx = resto.indexOf('\n## ', 3)
      return (fimIdx !== -1 ? resto.slice(0, fimIdx) : resto).trim()
    }
  }
  return null
}

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

Gere o plano completo seguindo rigorosamente a estrutura e regras definidas.${temImagens ? INSTRUCAO_INSTAGRAM : ''}`

    // Com imagens: content array com blocos de imagem + texto
    // Sem imagens: string simples
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

    const analiseInstagram = temImagens ? extrairAnaliseInstagram(plano) : null

    return Response.json({ plano, analiseInstagram })
  } catch (err) {
    console.error('[gerar-plano]', err)
    const message = err instanceof Error ? err.message : 'Erro interno do servidor.'
    return Response.json({ error: message }, { status: 500 })
  }
}
