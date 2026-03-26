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

          case 'h2': {
            const titulo = stripEmoji(seg.conteudo)
            return (
              <h2
                key={i}
                className="font-playfair text-xl font-semibold text-petroleo mt-5 mb-2 flex items-center gap-2"
              >
                <span className="shrink-0">{getH2Icon(titulo)}</span>
                {renderInline(titulo)}
              </h2>
            )
          }

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
/* Ícones SVG para seções h2                                                   */
/* -------------------------------------------------------------------------- */

const ICON_PROPS = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: '#05343d',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function IconTarget() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}

function IconPin() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M12 2C8.686 2 6 4.686 6 8c0 4.418 6 12 6 12s6-7.582 6-12c0-3.314-2.686-6-6-6z" />
      <circle cx="12" cy="8" r="2" />
    </svg>
  )
}

function IconBarChart() {
  return (
    <svg {...ICON_PROPS}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

function IconChecklist() {
  return (
    <svg {...ICON_PROPS}>
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  )
}

function IconChat() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  )
}

/** Remove emojis do início e qualquer coisa após " | " no título h2 */
function stripEmoji(s: string): string {
  const semEmoji = s.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+/u, '').trim()
  // Remove sufixo " | Ação | Status ..." que o modelo pode incluir no título
  const pipIdx = semEmoji.indexOf(' | ')
  return pipIdx !== -1 ? semEmoji.slice(0, pipIdx).trim() : semEmoji
}

/** Retorna o ícone SVG correspondente ao título da seção h2 */
function getH2Icon(titulo: string): ReactNode {
  const t = titulo.toLowerCase()
  if (t.includes('objetivo')) return <IconTarget />
  if (t.includes('direcion')) return <IconPin />
  if (t.includes('instagram')) return <IconBarChart />
  if (t.includes('tarefa')) return <IconChecklist />
  if (t.includes('suporte')) return <IconChat />
  return null
}

/* -------------------------------------------------------------------------- */
/* Tabela                                                                      */
/* -------------------------------------------------------------------------- */

function TabelaMarkdown({ linhas }: { linhas: string[] }) {
  const celulas = (linha: string) =>
    linha
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim())

  const isSeparador = (linha: string) => /^[\s|:\-]+$/.test(linha)

  const linhasValidas = linhas.filter((l) => !isSeparador(l))

  if (linhasValidas.length === 0) return null

  const [cabecalho, ...corpo] = linhasValidas

  return (
    <div className="my-4 overflow-x-auto rounded-xl border border-creme">
      <table className="w-full text-sm border-collapse" style={{ tableLayout: 'fixed' }}>
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
                  style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
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
  linhas?: string[]
}

function parseSegmentos(texto: string): Segmento[] {
  const linhas = texto.split('\n')
  const segmentos: Segmento[] = []
  let i = 0

  while (i < linhas.length) {
    const raw = linhas[i]
    const trimmed = raw.trim()

    if (!trimmed) {
      segmentos.push({ tipo: 'vazio', conteudo: '' })
      i++
      continue
    }

    if (trimmed.startsWith('# ')) {
      segmentos.push({ tipo: 'h1', conteudo: trimmed.slice(2).trim() })
      i++
      continue
    }

    if (trimmed.startsWith('## ')) {
      segmentos.push({ tipo: 'h2', conteudo: trimmed.slice(3).trim() })
      i++
      continue
    }

    if (trimmed.startsWith('### ')) {
      segmentos.push({ tipo: 'h3', conteudo: trimmed.slice(4).trim() })
      i++
      continue
    }

    if (trimmed.startsWith('|') && trimmed.includes('|', 1)) {
      const linhasTabela: string[] = []
      while (i < linhas.length && linhas[i].trim().startsWith('|')) {
        linhasTabela.push(linhas[i].trim())
        i++
      }
      segmentos.push({ tipo: 'tabela', conteudo: '', linhas: linhasTabela })
      continue
    }

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

  return partes.length === 1 && typeof partes[0] === 'string' ? partes[0] : partes
}
