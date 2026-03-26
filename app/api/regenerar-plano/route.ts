import Anthropic from '@anthropic-ai/sdk'

/**
 * POST /api/regenerar-plano
 * Atualiza um Plano de Ação existente com novas informações sobre o aluno.
 * Body: { planoAtual: string, novasInformacoes: string, nomeAluno: string, tutora: string }
 * Response: { plano: string }
 */

const SYSTEM_PROMPT = `Você é um estrategista de Customer Success da Mentoria Primus, da Ser Mais Criativo (Samer AGI). Gere um Plano de Ação personalizado no padrão da mentoria.

MENTORIA PRIMUS — 6 meses, 4 pilares:
1. Comunicação clara, criativa e persuasiva
2. Rede social lucrativa (posicionamento digital)
3. Palestrante de referência
4. Networking intencional e de alto valor

ENTREGÁVEIS: Mentorias semanais quinzenais com Samer AGI (2h) e com liderança do time (2h). 3 cursos: Escrita Persuasiva, Oratória Criativa, IAGI para Criadores. Diagnóstico com tutora. 2 sessões de destrave com terapeuta. 2 consultorias de imagem e estilo. IAs: IAGI Criadores, IA Palestras, IA Avaliadora de Discursos, IA Financeira.

ESTRUTURA DO PLANO:
# PLANO DE AÇÃO — [NOME]
## 🎯 Principal Objetivo na Mentoria
## 📍 Principais Direcionamentos (3 a 5, título em negrito, 2-4 linhas cada)
## ✅ Tarefas | Ação | Status | Material | (8 a 12 tarefas)
## 💬 Suporte

REGRAS: Segunda pessoa. Nunca mencionar PEAGs, PEAPs, De Frente com o Agi ou Encontro Nacional. Usar dados reais do aluno.`

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { planoAtual, novasInformacoes, nomeAluno, tutora } = body

    if (!planoAtual || !novasInformacoes || !nomeAluno || !tutora) {
      return Response.json(
        { error: 'Campos obrigatórios: planoAtual, novasInformacoes, nomeAluno, tutora.' },
        { status: 400 }
      )
    }

    const userMessage = `Você criou o seguinte Plano de Ação para ${nomeAluno}, aluno(a) da tutora ${tutora}:

${planoAtual}

A tutora ${tutora} quer atualizar o plano com as seguintes novas informações sobre o aluno:

${novasInformacoes}

Atualize e melhore o plano incorporando essas informações. Mantenha rigorosamente a mesma estrutura e padrão. Retorne o plano completo atualizado.`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    const plano = message.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n')

    return Response.json({ plano })
  } catch (err) {
    console.error('[regenerar-plano]', err)
    const message = err instanceof Error ? err.message : 'Erro interno do servidor.'
    return Response.json({ error: message }, { status: 500 })
  }
}
