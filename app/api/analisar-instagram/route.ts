import Anthropic from '@anthropic-ai/sdk'

/**
 * POST /api/analisar-instagram
 * Analisa prints de Instagram usando visão do Claude.
 * Body: { nomeAluno: string, imagens: Array<{ data: string, mediaType: string }> }
 * Response: { analise: string }
 */

// Aumenta o timeout máximo para análise de imagens (pode ser lento)
export const maxDuration = 60

const SYSTEM_PROMPT = `Você é uma especialista em posicionamento digital e marketing de autoridade da Mentoria Primus. Sua função é analisar o Instagram de um mentorado e gerar uma análise estratégica profissional, direta e personalizada.

Tom: profissional, direto, sem bullet points soltos. Use parágrafos corridos para análises e tabelas para comparações e recomendações. A análise deve parecer escrita por uma especialista humana, não por uma IA.

ESTRUTURA OBRIGATÓRIA (use exatamente estes títulos e formatos):

---

## 1. POSICIONAMENTO ATUAL DA CONTA

Escreva 2 a 3 parágrafos analisando como o perfil se posiciona hoje, qual mensagem transmite ao primeiro olhar, se o posicionamento está alinhado com o objetivo do mentorado e o que precisa mudar. Seja direta e específica, use dados reais do perfil analisado.

---

## 2. PADRÃO DE CONTEÚDO IDENTIFICADO

Crie uma tabela com o seguinte formato:

| Tema Recorrente | Formato Utilizado Hoje | Formato Ideal Sugerido |
|-----------------|----------------------|----------------------|
| [tema 1] | [formato atual] | [formato ideal] |
| [tema 2] | [formato atual] | [formato ideal] |
[mínimo 4 linhas, máximo 7]

Após a tabela, escreva 1 parágrafo com a análise geral do padrão de conteúdo.

---

## 3. PONTOS FORTES DA PRESENÇA DIGITAL

Crie uma tabela com o seguinte formato:

| Ponto Forte | Por que isso funciona |
|-------------|----------------------|
| [ponto 1] | [explicação direta] |
| [ponto 2] | [explicação direta] |
[mínimo 3, máximo 5 pontos]

---

## 4. RECOMENDAÇÕES ESTRATÉGICAS

Organize em fases. Cada fase deve ter:
- Título no formato: FASE [número]: [NOME DA FASE EM MAIÚSCULAS] ([prazo])
- 1 parágrafo explicando o foco da fase
- Tabela de ações:

| Ação | Descrição | Resultado Esperado |
|------|-----------|-------------------|
| [ação] | [descrição direta] | [resultado] |
[mínimo 3 ações por fase]

Use no máximo 3 fases.

---

REGRAS IMPORTANTES:
- Nunca use listas com bullet points (- item)
- Use sempre parágrafos corridos ou tabelas
- Seja específica: mencione o nicho, o público, os números reais do perfil
- Conecte sempre as recomendações com o objetivo do mentorado na mentoria
- Tom: como uma consultora experiente falando diretamente com o cliente
- Não use frases genéricas como "é fundamental que" ou "é importante ressaltar"
- Se houver informações adicionais fornecidas pela tutora, use-as para personalizar a análise
- Se houver objetivo do aluno na mentoria, conecte todas as recomendações a esse objetivo`

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface ImagemInput {
  data: string
  mediaType: string
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nomeAluno, imagens, objetivoAluno, infoAdicionais } = body as {
      nomeAluno: string
      imagens: ImagemInput[]
      objetivoAluno?: string
      infoAdicionais?: string
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
                  ? `OBJETIVO DO ALUNO NA MENTORIA: ${objetivoAluno}`
                  : '',
                infoAdicionais
                  ? `INFORMAÇÕES ADICIONAIS FORNECIDAS PELA TUTORA: ${infoAdicionais}`
                  : '',
                `Analise os prints do Instagram do(a) aluno(a) / perfil "${nomeAluno}" e gere a análise estratégica completa conforme a estrutura obrigatória.`,
              ]
                .filter(Boolean)
                .join('\n\n'),
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
