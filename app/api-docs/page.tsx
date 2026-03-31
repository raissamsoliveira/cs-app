export const metadata = {
  title: 'Documentação da API — Primus CS',
  description: 'Referência completa da API REST da Primus CS.',
}

const BASE = 'https://cs.primusmentoria.com.br'

interface Endpoint {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  path: string
  description: string
  params?: { name: string; type: string; required: boolean; description: string }[]
  response: string
}

const endpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/api/public/alunos',
    description: 'Lista os alunos cadastrados na planilha.',
    params: [
      { name: 'nome', type: 'string', required: false, description: 'Filtra por nome (busca parcial, case-insensitive).' },
    ],
    response: `{ "data": [ { "nome_completo": "...", "telefone": "...", "instagram": "...", "email": "..." } ], "total": 42 }`,
  },
  {
    method: 'GET',
    path: '/api/public/planos',
    description: 'Lista os planos de ação gerados.',
    params: [
      { name: 'aluno', type: 'string', required: false, description: 'Filtra por nome do aluno (busca parcial).' },
      { name: 'tutora', type: 'string', required: false, description: 'Filtra por tutora (match exato).' },
      { name: 'limit', type: 'number', required: false, description: 'Máximo de resultados (padrão: 20, máximo: 100).' },
    ],
    response: `{ "data": [ { "id": "uuid", "nome_aluno": "...", "tutora": "...", "criado_em": "2025-01-01T00:00:00Z", "link_publico": "https://...", "preview": "..." } ], "total": 5 }`,
  },
  {
    method: 'GET',
    path: '/api/public/planos/{id}',
    description: 'Retorna um plano de ação completo pelo ID.',
    params: [
      { name: 'id', type: 'string (path)', required: true, description: 'UUID do plano.' },
    ],
    response: `{ "id": "uuid", "nome_aluno": "...", "tutora": "...", "criado_em": "...", "link_publico": "...", "conteudo": "..." }`,
  },
  {
    method: 'GET',
    path: '/api/public/analises',
    description: 'Lista as análises de Instagram geradas.',
    params: [
      { name: 'aluno', type: 'string', required: false, description: 'Filtra por nome do aluno (busca parcial).' },
      { name: 'limit', type: 'number', required: false, description: 'Máximo de resultados (padrão: 20, máximo: 100).' },
    ],
    response: `{ "data": [ { "id": "uuid", "nome_aluno": "...", "criado_em": "...", "preview": "..." } ], "total": 3 }`,
  },
]

const methodColors: Record<string, string> = {
  GET: 'bg-blue-100 text-blue-700',
  POST: 'bg-green-100 text-green-700',
  PATCH: 'bg-yellow-100 text-yellow-700',
  DELETE: 'bg-red-100 text-red-700',
}

export default function ApiDocsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="font-playfair text-4xl text-petroleo font-semibold mb-2">
        Documentação da API
      </h1>
      <p className="text-gray-500 mb-2">
        API REST da Primus CS para integração com automações (Zapier, Make, N8N, etc.).
      </p>
      <p className="text-gray-400 text-sm mb-10">
        Base URL:{' '}
        <code className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 text-xs">
          {BASE}
        </code>
      </p>

      {/* Autenticação */}
      <section className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-10">
        <h2 className="font-semibold text-amber-800 text-lg mb-2">Autenticação</h2>
        <p className="text-amber-700 text-sm mb-3">
          Todas as requisições devem incluir o header{' '}
          <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono">
            x-api-key
          </code>{' '}
          com sua chave de acesso.
        </p>
        <pre className="bg-white border border-amber-200 rounded-lg px-4 py-3 text-xs font-mono text-gray-700 overflow-x-auto">
{`curl -H "x-api-key: primus_sua_chave_aqui" \\
  ${BASE}/api/public/alunos`}
        </pre>
        <p className="text-amber-600 text-xs mt-3">
          Obtenha sua chave em{' '}
          <a href="/minha-api" className="underline font-medium">
            Minha API Key
          </a>
          .
        </p>
      </section>

      {/* Endpoints */}
      <h2 className="font-playfair text-2xl text-petroleo font-semibold mb-6">
        Endpoints
      </h2>

      <div className="space-y-6">
        {endpoints.map((ep) => (
          <div
            key={ep.path}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
          >
            <div className="px-6 py-4 flex items-start gap-3 border-b border-gray-100">
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-md font-mono mt-0.5 ${methodColors[ep.method]}`}
              >
                {ep.method}
              </span>
              <div>
                <code className="text-sm font-mono text-gray-800">{ep.path}</code>
                <p className="text-gray-500 text-sm mt-1">{ep.description}</p>
              </div>
            </div>

            {ep.params && ep.params.length > 0 && (
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Parâmetros
                </h3>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-100">
                    {ep.params.map((p) => (
                      <tr key={p.name}>
                        <td className="py-2 pr-4 font-mono text-xs text-gray-700 w-32">
                          {p.name}
                          {p.required && (
                            <span className="text-red-500 ml-0.5">*</span>
                          )}
                        </td>
                        <td className="py-2 pr-4 text-xs text-gray-400 w-20">
                          {p.type}
                        </td>
                        <td className="py-2 text-xs text-gray-500">{p.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="px-6 py-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Resposta (200)
              </h3>
              <pre className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-xs font-mono text-gray-700 overflow-x-auto whitespace-pre-wrap">
                {ep.response}
              </pre>
            </div>
          </div>
        ))}
      </div>

      {/* Erros */}
      <section className="mt-10 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="font-semibold text-petroleo text-lg mb-4">Erros</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
              <th className="pb-2 pr-4">Código</th>
              <th className="pb-2">Descrição</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="py-3 pr-4 font-mono text-xs font-bold text-red-600">401</td>
              <td className="py-3 text-xs text-gray-500">API key inválida ou ausente.</td>
            </tr>
            <tr>
              <td className="py-3 pr-4 font-mono text-xs font-bold text-red-600">404</td>
              <td className="py-3 text-xs text-gray-500">Recurso não encontrado.</td>
            </tr>
            <tr>
              <td className="py-3 pr-4 font-mono text-xs font-bold text-red-600">500</td>
              <td className="py-3 text-xs text-gray-500">Erro interno do servidor.</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  )
}
