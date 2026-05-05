import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/analytics/padroes-ig
 *
 * Lê todas as análises de Instagram salvas, manda para a IA classificar e
 * agrupar em categorias de "onde as tutoras precisam atuar". Persiste o
 * resultado em analytics_cache para reuso sem re-pagar a IA.
 *
 * Response: { categorias: [{ nome, count, exemplos[] }], atualizadoEm }
 */

export const maxDuration = 60

const SYSTEM_PROMPT = `Você é um analista de Customer Success da Mentoria Primus. Sua função é ler diversas análises estratégicas de Instagram de mentorados e identificar PADRÕES recorrentes — pontos onde as tutoras precisam atuar mais intensamente.

REGRAS:
- Identifique entre 5 e 10 categorias dominantes (ex: "Posicionamento confuso", "Baixo engajamento", "Falta de identidade visual", "Conteúdo sem CTA claro", "Inconsistência de publicação", etc).
- Para cada categoria, conte aproximadamente quantas análises se encaixam.
- Use português direto, sem jargão de marketing.
- Não invente dados — só categorias que aparecem nas análises lidas.

FORMATO DE RESPOSTA (JSON puro, sem texto antes ou depois):
{
  "categorias": [
    { "nome": "string", "count": number, "exemplos": ["frase curta 1", "frase curta 2"] }
  ]
}

A propriedade "exemplos" deve conter 2 trechos curtos (1 linha cada) das análises que ilustram a categoria.`

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST() {
  try {
    const supabase = await createClient()

    const { data: analises, error } = await supabase
      .from('analises_instagram')
      .select('conteudo, tipo')
      .order('created_at', { ascending: false })
      .limit(80)

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    const total = (analises ?? []).length
    if (total === 0) {
      return Response.json(
        { error: 'Nenhuma análise de Instagram encontrada para processar.' },
        { status: 400 },
      )
    }

    // Concatena resumos das análises (limita tamanho por análise pra caber no contexto)
    const corpus = (analises ?? [])
      .map((a, i) => {
        const tipoLabel = a.tipo === 'planejamento' ? 'PLANEJAMENTO' : 'ANÁLISE'
        const trecho = (a.conteudo || '').slice(0, 1500)
        return `### ${tipoLabel} #${i + 1}\n${trecho}`
      })
      .join('\n\n---\n\n')

    const userMessage = `Abaixo estão ${total} análises de Instagram de mentorados da Primus. Identifique os padrões recorrentes — categorias de problemas/oportunidades que aparecem com frequência.

${corpus}

Retorne APENAS o JSON no formato especificado, sem markdown.`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    const textoResposta = message.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim()

    // Tenta parsear o JSON (a IA pode envolver em ```json...```)
    const jsonMatch = textoResposta.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('IA não retornou JSON válido.')
    }
    const parsed = JSON.parse(jsonMatch[0])

    const payload = {
      categorias: parsed.categorias ?? [],
      totalAnalises: total,
      atualizadoEm: new Date().toISOString(),
    }

    // Persiste no cache
    await supabase
      .from('analytics_cache')
      .upsert({ key: 'padroes_ig', valor: payload, atualizado_em: payload.atualizadoEm })

    return Response.json(payload)
  } catch (err) {
    console.error('[analytics/padroes-ig]', err)
    const m = err instanceof Error ? err.message : 'Erro interno'
    return Response.json({ error: m }, { status: 500 })
  }
}
