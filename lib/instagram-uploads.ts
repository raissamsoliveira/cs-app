/**
 * Helpers de upload e compressão de prints do Instagram.
 * Lógica extraída do antigo AnaliseInstagramForm para ser reaproveitada
 * pelo novo BlocoInstagram (e por qualquer outro consumidor futuro).
 */

export interface ImagemCarregada {
  previewUrl: string
  base64: string
  mediaType: string
}

export const MAX_IMAGENS = 6
export const MAX_DIM = 800
export const QUALIDADE = 0.7
export const MAX_PAYLOAD_MB = 4

/**
 * Comprime uma imagem em canvas (≤ MAX_DIM × MAX_DIM, JPEG QUALIDADE).
 * Retorna base64 + previewUrl + mediaType.
 */
export function comprimirImagem(file: File): Promise<ImagemCarregada> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) {
          height = Math.round((height * MAX_DIM) / width)
          width = MAX_DIM
        } else {
          width = Math.round((width * MAX_DIM) / height)
          height = MAX_DIM
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      const dataUrl = canvas.toDataURL('image/jpeg', QUALIDADE)
      URL.revokeObjectURL(objectUrl)
      resolve({
        previewUrl: dataUrl,
        base64: dataUrl.split(',')[1],
        mediaType: 'image/jpeg',
      })
    }
    img.src = objectUrl
  })
}

export interface ProcessarResultado {
  imagens: ImagemCarregada[]
  erro: string | null
}

/**
 * Processa arquivos vindos de input/drop:
 * - Filtra somente imagens
 * - Respeita o limite de MAX_IMAGENS no total
 * - Comprime cada uma
 * - Verifica payload total (MAX_PAYLOAD_MB)
 *
 * Não muta o array existente — retorna o conjunto novo (existentes + novas).
 */
export async function processarArquivos(
  files: FileList | File[],
  existentes: ImagemCarregada[],
): Promise<ProcessarResultado> {
  const lista = Array.from(files).filter((f) => f.type.startsWith('image/'))
  const vagas = MAX_IMAGENS - existentes.length
  if (vagas <= 0) {
    return { imagens: existentes, erro: null }
  }

  const novas: ImagemCarregada[] = []
  for (const file of lista.slice(0, vagas)) {
    novas.push(await comprimirImagem(file))
  }

  const todas = [...existentes, ...novas]
  const totalBytes = todas.reduce((sum, img) => sum + img.base64.length * 0.75, 0)
  if (totalBytes > MAX_PAYLOAD_MB * 1024 * 1024) {
    return {
      imagens: existentes,
      erro:
        `As imagens somam ${(totalBytes / 1024 / 1024).toFixed(1)} MB comprimidas. ` +
        `Limite: ${MAX_PAYLOAD_MB} MB. Reduza o número de imagens.`,
    }
  }

  return { imagens: todas, erro: null }
}
