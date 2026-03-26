import type { Metadata } from 'next'
import { Playfair_Display, Poppins } from 'next/font/google'
import './globals.css'

/* Fontes da identidade Primus */
const playfairDisplay = Playfair_Display({
  variable: '--font-playfair-display',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const poppins = Poppins({
  variable: '--font-poppins-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Primus CS — Mentoria Primus',
  description: 'Plataforma de Customer Success da Mentoria Primus (Ser Mais Criativo)',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${playfairDisplay.variable} ${poppins.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-offwhite text-petroleo antialiased">
        {children}
      </body>
    </html>
  )
}
