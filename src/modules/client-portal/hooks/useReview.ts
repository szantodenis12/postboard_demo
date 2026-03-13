import { useState, useEffect, useCallback, useMemo } from 'react'
import type { ReviewToken, ReviewFeedback } from '../../../core/types'

export function useReview() {
  const [tokens, setTokens] = useState<ReviewToken[]>([])
  const [feedback, setFeedback] = useState<ReviewFeedback[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const [tokensRes, feedbackRes] = await Promise.all([
        fetch('/api/review/tokens'),
        fetch('/api/feedback'),
      ])
      if (tokensRes.ok) setTokens(await tokensRes.json())
      if (feedbackRes.ok) {
        const data = await feedbackRes.json()
        setFeedback(data.feedback || [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  const createToken = useCallback(async (clientId: string, label?: string, expiresInDays?: number) => {
    const res = await fetch('/api/review/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, label, expiresInDays: expiresInDays || undefined }),
    })
    if (!res.ok) throw new Error('Failed to create review link')
    const data = await res.json()
    await refresh()
    return data
  }, [refresh])

  const deleteToken = useCallback(async (token: string) => {
    await fetch(`/api/review/${token}`, { method: 'DELETE' })
    setTokens(prev => prev.filter(t => t.token !== token))
  }, [])

  const feedbackCountByToken = useMemo(() => {
    const map: Record<string, { total: number; approved: number; changesRequested: number }> = {}
    for (const fb of feedback) {
      if (!map[fb.token]) map[fb.token] = { total: 0, approved: 0, changesRequested: 0 }
      map[fb.token].total++
      if (fb.action === 'approved') map[fb.token].approved++
      else map[fb.token].changesRequested++
    }
    return map
  }, [feedback])

  useEffect(() => { refresh() }, [refresh])

  return {
    tokens,
    feedback,
    loading,
    refresh,
    createToken,
    deleteToken,
    feedbackCountByToken,
  }
}
