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

const SYSTEM_PROMPT_PLANEJAMENTO = `Você é uma especialista em posicionamento digital e marketing de autoridade da Mentoria Primus. Sua função é criar um Planejamento Estratégico de Instagram do zero para um mentorado que ainda não tem presença digital ativa.

Tom: profissional, direto, inspirador. Use parágrafos corridos para análises e tabelas para recomendações estruturadas. O planejamento deve parecer criado por uma consultora experiente que entende profundamente o nicho e o público do mentorado.

ESTRUTURA OBRIGATÓRIA (use exatamente estes títulos e formatos):

---

## 1. POSICIONAMENTO ESTRATÉGICO SUGERIDO

Escreva 2 a 3 parágrafos definindo o posicionamento de marca recomendado para o perfil. Explique qual narrativa o mentorado deve construir, como se diferenciar no nicho, e qual percepção de valor quer gerar no público. Seja específica e conecte com o nicho e objetivo declarado.

---

## 2. IDENTIDADE DO PERFIL

Crie uma tabela com recomendações de identidade visual e comunicacional:

| Elemento | Recomendação | Justificativa |
|----------|-------------|---------------|
| Nome de usuário | [sugestão] | [por que funciona] |
| Bio | [texto sugerido] | [o que comunica] |
| Foto de perfil | [orientação] | [impacto] |
| Paleta de cores | [sugestão] | [associação] |
| Tipografia | [estilo sugerido] | [sensação transmitida] |

---

## 3. PILARES DE CONTEÚDO

Crie uma tabela definindo os pilares estratégicos de conteúdo:

| Pilar | Tipo de Conteúdo | Exemplos de Temas | Frequência Sugerida |
|-------|-----------------|-------------------|---------------------|
| [pilar 1] | [formato] | [tema A, tema B] | [X vezes/semana] |
| [pilar 2] | [formato] | [tema A, tema B] | [X vezes/semana] |
[mínimo 3 pilares, máximo 5]

---

## 4. PLANO DE LANÇAMENTO

Organize em 3 fases. Cada fase deve ter:
- Título no formato: FASE [número]: [NOME DA FASE EM MAIÚSCULAS] ([prazo])
- 1 parágrafo explicando o foco da fase
- Tabela de ações:

| Ação | Descrição | Resultado Esperado |
|------|-----------|-------------------|
| [ação] | [descrição direta] | [resultado] |
[mínimo 3 ações por fase]

---

REGRAS IMPORTANTES:
- Nunca use listas com bullet points (- item)
- Use sempre parágrafos corridos ou tabelas
- Seja específica: use o nicho e o público-alvo fornecidos em todas as recomendações
- Conecte as recomendações ao objetivo declarado nas redes sociais
- Tom: como uma consultora experiente montando uma estratégia real para o cliente
- Não use frases genéricas como "é fundamental que" ou "é importante ressaltar"
- Se houver referências de perfis inspiradores, considere-os nas recomendações`

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface ImagemInput {
  data: string
  mediaType: string
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      nomeAluno,
      imagens,
      objetivoAluno,
      infoAdicionais,
      tipo,
      nicho,
      publicoAlvo,
      objetivoRedes,
      referencias,
    } = body as {
      nomeAluno: string
      imagens?: ImagemInput[]
      objetivoAluno?: string
      infoAdicionais?: string
      tipo?: 'analise' | 'planejamento'
      nicho?: string
      publicoAlvo?: string
      objetivoRedes?: string
      referencias?: string
    }

    const isPlanejamento = tipo === 'planejamento'

    if (!nomeAluno?.trim()) {
      return Response.json({ error: 'Campo obrigatório: nomeAluno.' }, { status: 400 })
    }
    if (isPlanejamento && !nicho?.trim()) {
      return Response.json({ error: 'Campo obrigatório: nicho.' }, { status: 400 })
    }

    const imageBlocks =
      !isPlanejamento && imagens?.length
        ? imagens.map((img) => ({
            type: 'image' as const,
            source: {
              type: 'base64' as const,
              media_type: img.mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
              data: img.data,
            },
          }))
        : []

    const userTextParts: string[] = []
    if (isPlanejamento) {
      userTextParts.push(`NICHO: ${nicho}`)
      if (publicoAlvo) userTextParts.push(`PÚBLICO-ALVO: ${publicoAlvo}`)
      if (objetivoRedes) userTextParts.push(`OBJETIVO NAS REDES SOCIAIS: ${objetivoRedes}`)
      if (referencias) userTextParts.push(`PERFIS DE REFERÊNCIA: ${referencias}`)
      if (objetivoAluno) userTextParts.push(`OBJETIVO NA MENTORIA: ${objetivoAluno}`)
      userTextParts.push(
        `Crie o Planejamento Estratégico de Instagram completo para "${nomeAluno}" conforme a estrutura obrigatória.`,
      )
    } else {
      if (objetivoAluno) userTextParts.push(`OBJETIVO DO ALUNO NA MENTORIA: ${objetivoAluno}`)
      if (infoAdicionais)
        userTextParts.push(`INFORMAÇÕES ADICIONAIS FORNECIDAS PELA TUTORA: ${infoAdicionais}`)
      userTextParts.push(
        `Analise os prints do Instagram do(a) aluno(a) / perfil "${nomeAluno}" e gere a análise estratégica completa conforme a estrutura obrigatória.`,
      )
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: isPlanejamento ? SYSTEM_PROMPT_PLANEJAMENTO : SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            ...imageBlocks,
            {
              type: 'text',
              text: userTextParts.join('\n\n'),
            },
          ],
        },
      ],
    })

    const analise = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('\n')

    return Response.json({ analise })
  } catch (err) {
    console.error('[analisar-instagram]', err)
    const message = err instanceof Error ? err.message : 'Erro interno do servidor.'
    return Response.json({ error: message }, { status: 500 })
  }
}
