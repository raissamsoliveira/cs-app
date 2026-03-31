'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface NavbarProps {
  user: User
  hasApiAccess?: boolean
}

const baseLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/novo-plano', label: 'Novo Plano' },
  { href: '/historico', label: 'Histórico' },
  { href: '/analise-instagram', label: '📷 Instagram' },
]

export default function Navbar({ user, hasApiAccess = false }: NavbarProps) {
  const links = hasApiAccess
    ? [...baseLinks, { href: '/minha-api', label: '🔑 API Key' }]
    : baseLinks
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    // Cria o cliente dentro do handler para evitar execução durante SSR
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="bg-petroleo text-creme shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="font-playfair text-xl font-semibold tracking-wide text-creme">
              Primus CS
            </span>
            <span className="text-creme/50 text-sm hidden sm:block">
              — Ser Mais Criativo
            </span>
          </Link>

          {/* Links de navegação */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-creme text-petroleo'
                      : 'text-creme/80 hover:bg-petroleo-light hover:text-creme'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </div>

          {/* Usuário + logout */}
          <div className="flex items-center gap-3">
            <span className="text-creme/60 text-sm hidden sm:block truncate max-w-[180px]">
              {user.email}
            </span>
            <button
              onClick={handleSignOut}
              className="px-3 py-1.5 rounded-lg border border-creme/30 text-creme/80 text-sm hover:bg-petroleo-light hover:text-creme transition-colors"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="flex md:hidden gap-1 pb-2">
          {links.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 text-center px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  active
                    ? 'bg-creme text-petroleo'
                    : 'text-creme/70 hover:bg-petroleo-light'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
