import type { ReactNode } from 'react'

/**
 * PlanoMarkdown — renderiza o markdown dos planos de ação da Mentoria Primus.
 *
 * Suporta:
 *  - Títulos: # ## ###
 *  - Negrito inline: **texto**
 *  - Tabelas: | col | col |
 *  - Parágrafos e linhas em branco
 *
 * Parser feito sem dependências para manter controle total do estilo Primus.
 */
export default function PlanoMarkdown({ conteudo }: { conteudo: string }) {
  const segmentos = parseSegmentos(conteudo)

  return (
    <div className="space-y-1">
      {segmentos.map((seg, i) => {
        switch (seg.tipo) {
          case 'h1':
            return (
              <h1
                key={i}
                className="font-playfair text-2xl font-semibold text-petroleo mt-6 mb-3 pb-2 border-b border-creme"
              >
                {renderInline(seg.conteudo)}
              </h1>
            )

          case 'h2':
            return (
              <h2
                key={i}
                className="font-playfair text-xl font-semibold text-petroleo mt-5 mb-2"
              >
                {renderInline(seg.conteudo)}
              </h2>
            )

          case 'h3':
            return (
              <h3
                key={i}
                className="font-playfair text-base font-semibold text-petroleo-light mt-4 mb-1"
              >
                {renderInline(seg.conteudo)}
              </h3>
            )

          case 'tabela':
            return <TabelaMarkdown key={i} linhas={seg.linhas!} />

          case 'vazio':
            return <div key={i} className="h-2" />

          default:
            return (
              <p key={i} className="text-petroleo/85 text-sm leading-relaxed">
                {renderInline(seg.conteudo)}
              </p>
            )
        }
      })}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Tabela                                                                      */
/* -------------------------------------------------------------------------- */

function TabelaMarkdown({ linhas }: { linhas: string[] }) {
  // Separa células de uma linha: "| a | b | c |" → ["a", "b", "c"]
  const celulas = (linha: string) =>
    linha
      .split('|')
      .slice(1, -1) // remove o primeiro e último (vazios pelo | inicial/final)
      .map((c) => c.trim())

  // Detecta linha separadora: contém apenas -, :, espaço
  const isSeparador = (linha: string) => /^[\s|:\-]+$/.test(linha)

  const linhasValidas = linhas.filter((l) => !isSeparador(l))

  if (linhasValidas.length === 0) return null

  const [cabecalho, ...corpo] = linhasValidas

  return (
    <div className="my-4 overflow-x-auto rounded-xl border border-creme">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-petroleo text-creme">
            {celulas(cabecalho).map((cel, i) => (
              <th
                key={i}
                className="px-4 py-3 text-left font-semibold whitespace-nowrap font-poppins"
              >
                {renderInline(cel)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {corpo.map((linha, ri) => (
            <tr
              key={ri}
              className={ri % 2 === 0 ? 'bg-white' : 'bg-offwhite'}
            >
              {celulas(linha).map((cel, ci) => (
                <td
                  key={ci}
                  className={`px-4 py-2.5 text-petroleo/85 align-top border-t border-creme font-poppins ${
                    ci === 0 ? 'font-medium' : ''
                  }`}
                >
                  {renderInline(cel)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Parser de segmentos                                                         */
/* -------------------------------------------------------------------------- */

type TipoSegmento = 'h1' | 'h2' | 'h3' | 'tabela' | 'paragrafo' | 'vazio'

interface Segmento {
  tipo: TipoSegmento
  conteudo: string
  linhas?: string[] // usado apenas em tabelas
}

function parseSegmentos(texto: string): Segmento[] {
  const linhas = texto.split('\n')
  const segmentos: Segmento[] = []
  let i = 0

  while (i < linhas.length) {
    const raw = linhas[i]
    const trimmed = raw.trim()

    // Linha vazia
    if (!trimmed) {
      segmentos.push({ tipo: 'vazio', conteudo: '' })
      i++
      continue
    }

    // Heading 1
    if (trimmed.startsWith('# ')) {
      segmentos.push({ tipo: 'h1', conteudo: trimmed.slice(2).trim() })
      i++
      continue
    }

    // Heading 2
    if (trimmed.startsWith('## ')) {
      segmentos.push({ tipo: 'h2', conteudo: trimmed.slice(3).trim() })
      i++
      continue
    }

    // Heading 3
    if (trimmed.startsWith('### ')) {
      segmentos.push({ tipo: 'h3', conteudo: trimmed.slice(4).trim() })
      i++
      continue
    }

    // Tabela: linha que começa com | (e tem pelo menos um | a mais)
    if (trimmed.startsWith('|') && trimmed.includes('|', 1)) {
      const linhasTabela: string[] = []
      while (i < linhas.length && linhas[i].trim().startsWith('|')) {
        linhasTabela.push(linhas[i].trim())
        i++
      }
      segmentos.push({ tipo: 'tabela', conteudo: '', linhas: linhasTabela })
      continue
    }

    // Parágrafo comum
    segmentos.push({ tipo: 'paragrafo', conteudo: trimmed })
    i++
  }

  return segmentos
}

/* -------------------------------------------------------------------------- */
/* Inline: **negrito**                                                         */
/* -------------------------------------------------------------------------- */

function renderInline(texto: string): ReactNode {
  const partes: ReactNode[] = []
  const regex = /\*\*(.*?)\*\*/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(texto)) !== null) {
    if (match.index > lastIndex) {
      partes.push(texto.slice(lastIndex, match.index))
    }
    partes.push(
      <strong key={match.index} className="font-semibold text-petroleo">
        {match[1]}
      </strong>
    )
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < texto.length) {
    partes.push(texto.slice(lastIndex))
  }

  // Sem nenhum match — retorna o texto direto (evita array de 1 item)
  return partes.length === 1 && typeof partes[0] === 'string' ? partes[0] : partes
}
