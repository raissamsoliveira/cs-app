@AGENTS.md

# Primus CS App — Instruções para o Claude

## O que é este projeto

O **Primus CS App** é uma ferramenta interna da **Ser Mais Criativo** usada pelas tutoras da Mentoria Primus para gerar e gerenciar **Planos de Ação** personalizados para os alunos. A ferramenta usa IA (Claude Sonnet) para gerar os planos com base nos dados do aluno vindos de uma planilha Google Sheets.

Funcionalidades principais:
- Geração de Plano de Ação + Análise/Planejamento de Instagram em uma única chamada de IA
- Histórico de planos com filtros por tutora, tipo e nome
- Dashboard analítico com gráficos de tutoras, profissões, faturamento e padrões de IG
- Gestão de tutoras (CRUD)
- Apresentação de slides gerada a partir do plano
- Links públicos para compartilhar planos com alunos

---

## Stack técnica

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16.2.1 (App Router, Turbopack) |
| Linguagem | TypeScript 5 |
| Estilo | Tailwind CSS v4 (sem JIT externo) |
| Banco de dados | Supabase (PostgreSQL + Auth + RLS) |
| IA | Anthropic Claude SDK (`@anthropic-ai/sdk`) |
| Deploy | Vercel |
| Dados de alunos | Google Sheets via endpoint CSV (`gviz`) |

---

## Setup local

```bash
npm install
cp .env.example .env.local   # preencher com as variáveis reais
npm run dev                   # http://localhost:3000
```

### Variáveis de ambiente necessárias (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_SHEET_ID=
NOTION_TOKEN=           # opcional
NOTION_DATABASE_ID=     # opcional
```

---

## Banco de dados (Supabase)

Todas as tabelas têm RLS habilitado. O schema base está em `supabase/schema.sql`.

### `planos`
Armazena os planos de ação gerados.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Chave primária |
| `created_at` | timestamptz | Data de criação |
| `nome_aluno` | text | Nome do aluno |
| `tutora` | text | Nome da tutora (texto livre) |
| `conteudo` | text | Markdown do plano de ação |
| `criado_por` | uuid | FK para `auth.users` |

Política RLS: usuário vê/edita/deleta apenas seus próprios registros (`auth.uid() = criado_por`).

### `analises_instagram`
Armazena análises e planejamentos de Instagram vinculados a um plano ou autônomos.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Chave primária |
| `created_at` | timestamptz | Data de criação |
| `nome_aluno` | text | Nome do aluno |
| `tutora` | text | Nome da tutora |
| `conteudo` | text | Markdown da análise |
| `tipo` | text | `'analise'` ou `'planejamento'` |
| `plano_id` | uuid | FK para `planos` (null = autônomo) |
| `criado_por` | uuid | FK para `auth.users` |

Registros com `plano_id` não aparecem no histórico como item separado — são acessados via a página do plano.

### `tutoras`
Lista de tutoras ativas na mentoria.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Chave primária |
| `nome` | text | Nome da tutora |
| `ativa` | boolean | Se aparece nos selects de novo plano |

### `analytics_cache`
Cache de resultados caros de IA (padrões de Instagram).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `key` | text | Identificador (ex: `'padroes_ig'`) |
| `valor` | jsonb | Resultado armazenado |
| `atualizado_em` | timestamptz | Quando foi gerado |

### `profiles` e `api_keys`
Tabelas de suporte para o sistema de API keys (acesso externo). Não alterar sem necessidade.

---

## Estrutura de pastas

```
app/
  (protected)/          # Rotas autenticadas (layout verifica sessão)
    dashboard/          # Dashboard analítico
    historico/          # Histórico de planos e análises
    novo-plano/         # Tela principal de geração
    plano/[id]/         # Visualização/edição de plano salvo
    tutoras/            # CRUD de tutoras
    minha-api/          # Gerenciamento de API key do usuário
  (public)/             # Rotas públicas sem auth
    p/[id]/             # Link público do plano
  api/
    gerar-plano/        # POST — gera plano + análise IG via Claude
    analytics/padroes-ig/ # POST — classifica padrões de IG via Claude
    alunos/             # GET — retorna alunos da planilha Google Sheets
    gerar-apresentacao/ # POST — gera HTML de slides do plano
    public/             # Endpoints da API pública (com api_key)

components/
  BlocoInstagram.tsx    # Bloco de upload e contexto de Instagram
  BuscaAluno.tsx        # Campo de busca de aluno (autocomplete)
  CopiarBotao.tsx       # Copia plano formatado para Notion
  EditarComIABotao.tsx  # Edição assistida por IA
  GerarApresentacaoBotao.tsx # Gera apresentação de slides
  TrocarTutoraBotao.tsx # Modal para trocar tutora de um plano
  charts/               # Componentes de gráficos SVG inline
    VerticalBars.tsx    # Barras verticais (clicável para drill-down)
    BarRanking.tsx      # Ranking horizontal
    PairedBars.tsx      # Barras pareadas (atual vs desejado)

lib/
  supabase/
    client.ts           # Supabase para Client Components
    server.ts           # Supabase para Server Components (async)
  planilha.ts           # Lê alunos do Google Sheets via gviz CSV
  dashboardStats.ts     # Funções de agregação para o dashboard
  planoParaSlides.ts    # Converte markdown do plano em HTML de slides
  instagram-uploads.ts  # Compressão e processamento de imagens
```

---

## Padrões e convenções importantes

### Supabase: server vs client
- **Server Components** e **Route Handlers**: usar `await createClient()` de `@/lib/supabase/server`
- **Client Components**: usar `createClient()` de `@/lib/supabase/client`
- Nunca misturar os dois módulos no mesmo arquivo.

### Geração unificada de plano + IG
A rota `POST /api/gerar-plano` faz UMA única chamada à API Claude. Quando há dados de Instagram, a IA gera o plano e depois anexa a análise com o marcador `===INSTAGRAM===`.

No cliente, a resposta é dividida assim:
```ts
const MARCADOR = /\n?\s*={3,}\s*INSTAGRAM\s*={3,}\s*\n?/i
const [planoConteudo, ...igPartes] = resposta.split(MARCADOR)
const analiseIG = igPartes.join('\n').trim() || null
```

O plano vai para a tabela `planos.conteudo` e a análise para `analises_instagram.conteudo`.

### Planilha de alunos
A função `getAllAlunos()` em `lib/planilha.ts` lê o Google Sheets via endpoint CSV público (`gviz/tq?tqx=out:csv`). A planilha DEVE ser pública ("qualquer pessoa com o link pode ver"). A coluna de nome é detectada dinamicamente pela função `detectarIndiceNome()` — não depende de que a célula B1 tenha exatamente "Nome completo".

### Estilo (Tailwind v4)
Cores da marca definidas em `app/globals.css`:
- `petroleo` / `petroleo-light` — verde escuro principal
- `creme` / `creme-dark` — bege/dourado de destaque
- `offwhite` — fundo geral `#f5f5f5`
- Fonte serifada (`font-playfair`): títulos e destaques
- Fonte sans (`font-poppins`): corpo de texto

### Server Components com dados dinâmicos
Páginas que buscam dados do Supabase precisam de:
```ts
export const dynamic = 'force-dynamic'
```
Caso contrário o Next.js 16 pode cacheá-las e novos registros não aparecem.

### Componentes client vs server
- Páginas que só buscam dados: Server Components (sem `'use client'`)
- Telas com interatividade (forms, estados): separar em `*ClientArea.tsx` com `'use client'`
- Padrão usado: `page.tsx` (server, busca dados) → `NomeClientArea.tsx` (client, renderiza)

---

## Fluxo principal: Gerar um novo plano

1. Tutora acessa `/novo-plano`
2. Busca o aluno pelo nome (autocomplete da planilha)
3. Seleciona a tutora responsável
4. Opcionalmente: adiciona contexto, faz upload do PDA21 (PDF), adiciona prints do Instagram
5. Clica em **Gerar Plano Completo** → chama `POST /api/gerar-plano`
6. Resultado aparece abaixo — plano + seção de IG (se aplicável)
7. Tutora pode editar manualmente, editar com IA, gerar apresentação, copiar para Notion, baixar PDF ou copiar link público
8. Ao clicar **Salvar**: plano vai para `planos`, análise de IG vai para `analises_instagram` com `plano_id`

---

## Histórico

A página `/historico` mostra:
- Todos os `planos` do usuário logado (tag "Plano de Ação")
- `analises_instagram` **sem** `plano_id` (análises autônomas antigas)
- Análises vinculadas a planos são acessadas via `/plano/[id]`, não aparecem como item separado

---

## Dashboard

O dashboard em `/dashboard` busca dados em paralelo e passa para `DashboardClientArea`. Gráficos são SVG inline, sem biblioteca externa. O gráfico de planos por mês tem drill-down: clicar em um mês mostra o detalhamento por dia.

A seção "Padrões de IG" usa IA (Claude Sonnet) e tem custo por clique — o botão é manual.

---

## O que NÃO fazer

- Não instalar bibliotecas de gráficos — os gráficos são SVG inline propositalmente (performance e sem dependência)
- Não remover o `export const dynamic = 'force-dynamic'` das páginas que buscam dados do Supabase
- Não usar `lib/supabase/server.ts` em Client Components (quebra o bundle)
- Não hardcodar nomes de tutoras — eles vêm da tabela `tutoras`
- Não mencionar "PEAGs", "PEAPs", "De Frente com o Agi" ou "Encontro Nacional" no conteúdo gerado pela IA (restrição do prompt)
- Não alterar o prompt principal de geração sem revisão cuidadosa — ele define toda a estrutura dos planos
