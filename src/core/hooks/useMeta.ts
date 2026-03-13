import { useState, useEffect, useCallback } from 'react'
import type { MetaStatus, PageMapping, PublishConfig, PublishMediaPayload, InstagramPublishPayload } from '../types'

const EMPTY: MetaStatus = { connected: false, appId: '', loginUrl: '', pages: [] }

export function useMeta() {
  const [meta, setMeta] = useState<MetaStatus>(EMPTY)
  const [pageMapping, setPageMappingState] = useState<PageMapping>({})
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState<string | null>(null) // postId being published

  const refresh = useCallback(async () => {
    try {
      const [statusRes, mappingRes] = await Promise.all([
        fetch('/api/meta/status'),
        fetch('/api/meta/page-mapping'),
      ])
      if (statusRes.ok) setMeta(await statusRes.json())
      if (mappingRes.ok) setPageMappingState(await mappingRes.json())
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const connect = useCallback(() => {
    if (meta.loginUrl) {
      window.location.href = meta.loginUrl
    } else {
      fetch('/api/meta/status')
        .then(res => res.json())
        .then(data => {
          if (data.loginUrl) window.location.href = data.loginUrl
        })
    }
  }, [meta.loginUrl])

  const handleCallback = useCallback(async (code: string) => {
    try {
      setLoading(true)
      const res = await fetch('/api/meta/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (data.success) {
        await refresh()
        return { success: true, pages: data.pages }
      }
      return { success: false, error: data.error }
    } catch (err: any) {
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [refresh])

  const disconnect = useCallback(async () => {
    await fetch('/api/meta/disconnect', { method: 'POST' })
    await refresh()
  }, [refresh])

  // Page-to-client mapping
  const setPageMapping = useCallback(async (clientId: string, pageId: string | null) => {
    // Optimistic update
    setPageMappingState(prev => {
      const next = { ...prev }
      if (pageId) next[clientId] = pageId
      else delete next[clientId]
      return next
    })
    await fetch('/api/meta/page-mapping', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, pageId }),
    })
  }, [])

  // Get publish config for a given client
  const getPublishConfig = useCallback((clientId: string): PublishConfig | null => {
    if (!meta.connected) return null
    const pageId = pageMapping[clientId]
    if (!pageId) return null
    const page = meta.pages.find(p => p.pageId === pageId)
    if (!page) return null
    return {
      pageId: page.pageId,
      pageName: page.pageName,
      hasInstagram: page.hasInstagram,
    }
  }, [meta, pageMapping])

  // Publish to Facebook
  const publishToFacebook = useCallback(async (pageId: string, message: string, media?: PublishMediaPayload) => {
    setPublishing(pageId)
    try {
      const res = await fetch('/api/meta/publish/facebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, message, media }),
      })
      return await res.json()
    } finally {
      setPublishing(null)
    }
  }, [])

  // Publish to Instagram
  const publishToInstagram = useCallback(async (pageId: string, caption: string, media: InstagramPublishPayload) => {
    setPublishing(pageId)
    try {
      const res = await fetch('/api/meta/publish/instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, caption, media }),
      })
      return await res.json()
    } finally {
      setPublishing(null)
    }
  }, [])

  return {
    meta,
    pageMapping,
    loading,
    publishing,
    connect,
    handleCallback,
    disconnect,
    refresh,
    setPageMapping,
    getPublishConfig,
    publishToFacebook,
    publishToInstagram,
  }
}
