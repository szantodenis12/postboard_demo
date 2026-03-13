import { useState, useEffect, useRef, useCallback } from 'react'
import type { HealthScore } from '../../../core/types'

interface HealthScoresState {
  scores: Map<string, HealthScore>
  loading: boolean
  error: string | null
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Module-level cache shared across all instances
let cachedScores: Map<string, HealthScore> | null = null
let cacheTimestamp = 0

export function useHealthScores() {
  const [state, setState] = useState<HealthScoresState>({
    scores: cachedScores || new Map(),
    loading: !cachedScores,
    error: null,
  })
  const abortRef = useRef<AbortController | null>(null)

  const fetchScores = useCallback(async (force = false) => {
    // Serve from cache if still fresh
    if (!force && cachedScores && Date.now() - cacheTimestamp < CACHE_TTL) {
      setState({ scores: cachedScores, loading: false, error: null })
      return
    }

    // Cancel any in-flight request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const res = await fetch('/api/intelligence/health-scores', {
        signal: controller.signal,
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      const map = new Map<string, HealthScore>()
      for (const entry of data.scores || []) {
        map.set(entry.clientId, entry)
      }

      // Update module cache
      cachedScores = map
      cacheTimestamp = Date.now()

      setState({ scores: map, loading: false, error: null })
    } catch (err: any) {
      if (err.name === 'AbortError') return
      setState(prev => ({ ...prev, loading: false, error: err.message }))
    }
  }, [])

  useEffect(() => {
    fetchScores()
    return () => { abortRef.current?.abort() }
  }, [fetchScores])

  const getScore = useCallback(
    (clientId: string): HealthScore | null => state.scores.get(clientId) ?? null,
    [state.scores],
  )

  return {
    scores: state.scores,
    loading: state.loading,
    error: state.error,
    getScore,
    refresh: () => fetchScores(true),
  }
}
