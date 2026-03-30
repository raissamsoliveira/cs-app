'use client'

import { useState } from 'react'

interface Props {
  conteudo: string
  createdAt: string
  hasAnalise: boolean
}

function formatarParaNotion(conteudo: string, createdAt: string, hasAnalise: boolean): string {
  const linhas = conteudo.split('\n')
  const secoes = new Map<string, string[]>()
  let secaoAtual = ''

  for (const linha of linhas) {
    if (linha.startsWith('# ')) continue
    if (linha.startsWith('## ')) {
      secaoAtual = linha.slice(3).trim()
      secoes.set(secaoAtual, [])
    } else if (secaoAtual) {
      secoes.get(secaoAtual)!.push(linha)
    }
  }

  function textoSecao(nome: string) {
    return (secoes.get(nome) ?? []).join('\n').trim()
  }

  const dataFormatada = new Date(createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  // Links Importantes
  const linksBlock = [
    '→ Links Importantes',
    '',
    `Reunião de Diagnóstico realizada em ${dataFormatada}:`,
    ...(hasAnalise ? ['Análise de Instagram:'] : []),
  ].join('\n')

  // Principal Objetivo
  const objetivoBlock =
    `## **Principal Objetivo na Mentoria** {color="green_bg"}\n` +
    textoSecao('Principal Objetivo na Mentoria')

  // Principais Direcionamentos — cada tópico em negrito vira toggle
  const direcLinhas = textoSecao('Principais Direcionamentos').split('\n')
  const toggles: string[] = []
  let tituloAtual = ''
  let conteudoAtual: string[] = []

  for (const linha of direcLinhas) {
    const bold = linha.match(/^\*\*(.+?)\*\*\s*$/)
    if (bold) {
      if (tituloAtual) {
        toggles.push(
          `<details>\n<summary>**${tituloAtual}**</summary>\n${conteudoAtual.join('\n').trim()}\n</details>`
        )
      }
      tituloAtual = bold[1]
      conteudoAtual = []
    } else if (tituloAtual) {
      conteudoAtual.push(linha)
    }
  }
  if (tituloAtual) {
    toggles.push(
      `<details>\n<summary>**${tituloAtual}**</summary>\n${conteudoAtual.join('\n').trim()}\n</details>`
    )
  }

  const direcBlock = `→ Principais Direcionamentos\n${toggles.join('\n')}`

  // Tarefas
  const tarefasBlock = `Tarefas\n${textoSecao('Tarefas')}`

  // Suporte
  const suporteBlock = `→ Suporte\n${textoSecao('Suporte')}`

  return [
    linksBlock,
    '',
    '',
    objetivoBlock,
    '',
    '',
    '',
    direcBlock,
    '',
    '',
    tarefasBlock,
    '',
    suporteBlock,
  ].join('\n')
}

export default function CopiarBotao({ conteudo, createdAt, hasAnalise }: Props) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    const texto = formatarParaNotion(conteudo, createdAt, hasAnalise)
    await navigator.clipboard.writeText(texto)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <button
      onClick={copiar}
      className="flex-1 bg-petroleo text-creme py-2.5 px-5 rounded-xl font-medium text-sm hover:bg-petroleo-light transition-colors"
    >
      {copiado ? '✓ Copiado!' : '📋 Copiar para Notion'}
    </button>
  )
}
