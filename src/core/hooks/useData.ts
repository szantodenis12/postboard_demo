import { useState, useEffect, useCallback, useRef } from 'react'
import type { DashboardData, PostStatus, PostPublishOptions } from '../types'

const EMPTY: DashboardData = {
  clients: [],
  totals: { clients: 0, posts: 0, draft: 0, approved: 0, scheduled: 0, published: 0 },
}

const POLL_INTERVAL = 10_000 // 10 seconds

export function useData({ includeExpired = false }: { includeExpired?: boolean } = {}) {
  const [data, setData] = useState<DashboardData>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const lastFingerprint = useRef('')

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/clients?includeExpired=${includeExpired ? '1' : '0'}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }, [includeExpired])

  const updatePostStatus = useCallback(async (postId: string, status: PostStatus) => {
    // Optimistic update
    setData(prev => {
      const next = structuredClone(prev)
      for (const client of next.clients) {
        const post = client.posts.find(p => p.id === postId)
        if (post) {
          const oldStatus = post.status
          post.status = status
          client.stats[oldStatus]--
          client.stats[status]++
          // Recalculate totals
          next.totals[oldStatus]--
          next.totals[status]++
          break
        }
      }
      return next
    })

    // Persist to server
    try {
      const res = await fetch(`/api/posts/${postId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    } catch {
      // Revert on failure
      refresh()
    }
  }, [refresh])

  const updatePostCaption = useCallback(async (postId: string, caption: string, hashtags: string[]) => {
    // Optimistic update
    setData(prev => {
      const next = structuredClone(prev)
      for (const client of next.clients) {
        const post = client.posts.find(p => p.id === postId)
        if (post) {
          post.caption = caption
          post.hashtags = hashtags
          break
        }
      }
      return next
    })

    // Persist to server
    try {
      const res = await fetch(`/api/posts/${postId}/caption`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption, hashtags }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    } catch {
      refresh()
    }
  }, [refresh])

  const updatePostDate = useCallback(async (postId: string, date: string) => {
    setData(prev => {
      const next = structuredClone(prev)
      for (const client of next.clients) {
        const post = client.posts.find(p => p.id === postId)
        if (post) { post.date = date; break }
      }
      return next
    })
    try {
      const res = await fetch(`/api/posts/${postId}/date`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    } catch { refresh() }
  }, [refresh])

  const updatePostPublishOptions = useCallback(async (postId: string, options: PostPublishOptions) => {
    setData(prev => {
      const next = structuredClone(prev)
      for (const client of next.clients) {
        const post = client.posts.find(p => p.id === postId)
        if (post) {
          if (options.requiresInstagramMusic !== undefined) {
            post.requiresInstagramMusic = options.requiresInstagramMusic
          }
          break
        }
      }
      return next
    })

    try {
      const res = await fetch(`/api/posts/${postId}/publish-options`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return true
    } catch {
      refresh()
      return false
    }
  }, [refresh])

  const deletePost = useCallback(async (postId: string) => {
    // Optimistic removal
    setData(prev => {
      const next = structuredClone(prev)
      for (const client of next.clients) {
        const idx = client.posts.findIndex(p => p.id === postId)
        if (idx !== -1) {
          const post = client.posts[idx]
          client.stats[post.status]--
          client.stats.total--
          next.totals[post.status]--
          next.totals.posts--
          client.posts.splice(idx, 1)
          break
        }
      }
      return next
    })
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    } catch { refresh() }
  }, [refresh])

  useEffect(() => { refresh() }, [refresh])

  // Poll for file changes — only re-fetch when files actually changed
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/api/changes')
        if (!res.ok) return
        const { fingerprint } = await res.json()
        if (lastFingerprint.current && fingerprint !== lastFingerprint.current) {
          refresh()
        }
        lastFingerprint.current = fingerprint
      } catch { /* ignore */ }
    }
    // Initial fingerprint
    poll()
    const id = setInterval(poll, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [refresh])

  return {
    data,
    loading,
    error,
    refresh,
    updatePostStatus,
    updatePostDate,
    updatePostCaption,
    updatePostPublishOptions,
    deletePost,
  }
}
