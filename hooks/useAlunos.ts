'use client'

import { useState, useEffect, useRef } from 'react'

export function useAlunos(query: string) {
  const [alunos, setAlunos] = useState<Record<string, string>[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    if (!query.trim()) {
      setAlunos([])
      setLoading(false)
      return
    }

    setLoading(true)
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/alunos?q=${encodeURIComponent(query)}`)
        if (!res.ok) throw new Error(`Erro ${res.status}`)
        const data = await res.json()
        setAlunos(data.alunos ?? [])
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro')
        setAlunos([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query])

  return { alunos, loading, error }
}
