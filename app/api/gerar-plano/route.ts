import Anthropic from '@anthropic-ai/sdk'

/**
 * POST /api/gerar-plano
 * Gera um Plano de Ação + (opcional) Análise/Planejamento de Instagram
 * via UMA única chamada à API Anthropic.
 *
 * Body:
 *   nomeAluno: string (obrigatório)
 *   tutora: string (obrigatório)
 *   contexto: string (obrigatório)
 *   pda21?: string (base64 PDF)
 *   imagens?: { data: string; mediaType: string }[]   // prints do Instagram
 *   instagramTipo?: 'analise' | 'planejamento'        // default: 'analise'
 *   instagramAluno?: string                           // @-handle ou descrição
 *   instagramContexto?: string                        // contexto livre da tutora
 *
 * Quando houver QUALQUER dado de Instagram (prints OU instagramAluno OU
 * instagramContexto), a IA é instruída a anexar, após o plano, uma seção
 * iniciada exatamente pelo marcador ===INSTAGRAM=== seguida do título do
 * tipo selecionado e da análise estruturada.
 *
 * Response: { plano }   // o client divide pelo marcador.
 */

export const maxDuration = 90

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

REGRAS: Segunda pessoa. Nunca mencionar PEAGs, PEAPs, De Frente com o Agi ou Encontro Nacional. Usar dados reais do aluno. Não use emojis nos títulos das seções. NÃO inclua seção de Análise de Instagram dentro do plano de ação — se imagens do Instagram forem fornecidas, use-as apenas como contexto visual para personalizar as demais seções.

Se um PDF do PDA21 for enviado junto, analise as respostas do aluno nas 21 tarefas antes de gerar o plano. Use as respostas para:
- Personalizar profundamente os Principais Direcionamentos com base nas decisões e clareza que o aluno já tem
- Evitar tarefas no plano que o aluno já concluiu no PDA21
- Identificar pontos de confusão ou bloqueio mencionados nas respostas
- Referenciar decisões específicas que o aluno tomou (ex: 'Você já definiu no PDA21 que...')
O PDA21 tem 3 blocos: Clareza Essencial (tarefas 1-7), Direção Executiva (tarefas 8-14) e Consolidação Prática (tarefas 15-21). Cada tarefa termina com uma decisão prática.`

const TITULO_IG: Record<'analise' | 'planejamento', string> = {
  analise: 'Análise Estratégica de Instagram',
  planejamento: 'Planejamento Estratégico de Instagram',
}

interface ImagemInput {
  data: string
  mediaType: string
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      nomeAluno,
      tutora,
      contexto,
      imagens,
      pda21,
      instagramTipo,
      instagramAluno,
      instagramContexto,
    } = body as {
      nomeAluno: string
      tutora: string
      contexto: string
      imagens?: ImagemInput[]
      pda21?: string
      instagramTipo?: 'analise' | 'planejamento'
      instagramAluno?: string
      instagramContexto?: string
    }

    if (!nomeAluno || !tutora || !contexto) {
      return Response.json(
        { error: 'Campos obrigatórios: nomeAluno, tutora, contexto.' },
        { status: 400 }
      )
    }

    const temImagens = Array.isArray(imagens) && imagens.length > 0
    const temPda21 = !!pda21
    const tipoIG: 'analise' | 'planejamento' =
      instagramTipo === 'planejamento' ? 'planejamento' : 'analise'

    // Há "dados de Instagram" se houver prints, handle ou contexto livre
    const temIG = temImagens || !!instagramAluno?.trim() || !!instagramContexto?.trim()

    const blocoInstrucaoIG = temIG
      ? `

---

INSTRUÇÃO ADICIONAL — SEÇÃO DE INSTAGRAM:

Após o plano de ação completo, gere também uma seção separada iniciando exatamente com o marcador ===INSTAGRAM=== seguido de uma linha em branco. NÃO inclua nenhum heading com o título "${TITULO_IG[tipoIG]}" — esse título é renderizado pelo app fora do conteúdo. Comece a seção direto pelos subtítulos H2 abaixo. A seção deve conter uma análise estratégica detalhada do perfil ${instagramAluno?.trim() || '(perfil informado pelo aluno)'} com base nos prints fornecidos${instagramContexto?.trim() ? ' e no contexto informado pela tutora abaixo' : ''}.

${instagramContexto?.trim() ? `CONTEXTO SOBRE O PERFIL (informado pela tutora):\n${instagramContexto.trim()}\n\n` : ''}Estrutura da seção de Instagram (use exatamente estes subtítulos H2):
## 1. Diagnóstico atual do perfil
## 2. Pontos fortes identificados
## 3. Oportunidades de melhoria
## 4. Direcionamentos estratégicos
(3 a 5 direcionamentos, cada um em parágrafo curto)
## 5. Próximos passos práticos
(tabela com colunas: Ação | Prazo | Objetivo — mínimo 4 linhas)

REGRAS para a seção de Instagram:
- Use parágrafos corridos e tabelas (nada de bullet points soltos com "-")
- Tom direto, profissional, como uma consultora experiente
- Conecte as recomendações ao objetivo do aluno na mentoria
- Não repita o conteúdo do plano de ação — esta seção é independente e foca exclusivamente no Instagram

IMPORTANTE: o marcador ===INSTAGRAM=== deve aparecer SEMPRE em uma linha sozinha, exatamente como escrito (três sinais de igual, palavra INSTAGRAM em maiúsculas, três sinais de igual). Não envolva o marcador em backticks, headings ou outro formato.`
      : ''

    const textoUsuario = `Crie um Plano de Ação personalizado para o seguinte aluno da Mentoria Primus:

Nome do aluno: ${nomeAluno}
Tutora responsável: ${tutora}

${contexto}

Gere o plano completo seguindo rigorosamente a estrutura e regras definidas.${
      temImagens
        ? '\n\nAs imagens do Instagram foram fornecidas como contexto visual. Use-as para personalizar o plano de ação E para a análise de Instagram da seção final.'
        : ''
    }${
      temPda21
        ? '\n\nO PDF do PDA21 foi enviado. Analise as respostas do aluno antes de gerar o plano.'
        : ''
    }${blocoInstrucaoIG}`

    const messageContent =
      temImagens || temPda21
        ? [
            ...(temPda21
              ? [
                  {
                    type: 'document' as const,
                    source: {
                      type: 'base64' as const,
                      media_type: 'application/pdf' as const,
                      data: pda21!,
                    },
                  },
                ]
              : []),
            ...(temImagens
              ? imagens!.map((img) => ({
                  type: 'image' as const,
                  source: {
                    type: 'base64' as const,
                    media_type: img.mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                    data: img.data,
                  },
                }))
              : []),
            { type: 'text' as const, text: textoUsuario },
          ]
        : textoUsuario

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: temIG ? 8192 : 4096,
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
