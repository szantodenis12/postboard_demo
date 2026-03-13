import { useState, useEffect, useCallback } from 'react'

export interface PostMetric {
  metaPostId: string
  platform: 'facebook' | 'instagram'
  publishedAt: string
  message: string
  imageUrl?: string
  permalink?: string
  likes: number
  comments: number
  shares: number
  engagement: number
}

interface PlatformData {
  posts: PostMetric[]
  totalLikes: number
  totalComments: number
  totalShares: number
  totalEngagement: number
  avgEngagement: number
}

interface CombinedData {
  totalPosts: number
  totalLikes: number
  totalComments: number
  totalShares: number
  totalEngagement: number
  avgEngagement: number
  engagementByDay: { date: string; engagement: number; likes: number; comments: number; shares: number }[]
  topPosts: PostMetric[]
}

export interface ClientAnalytics {
  clientId: string
  pageId: string
  pageName: string
  lastFetched: string
  period: string
  warnings?: {
    facebook?: string
    instagram?: string
  }
  facebook: PlatformData
  instagram: PlatformData
  combined: CombinedData
}

// ── Google Business Profile types ────────────────────────
export interface GoogleInsightsData {
  locationName: string
  period: string
  lastFetched: string
  metrics: {
    searchViews: number
    mapViews: number
    websiteClicks: number
    phoneClicks: number
    directionRequests: number
    totalInteractions: number
  }
  dailyMetrics: { date: string; searches: number; maps: number; website: number; phone: number; directions: number }[]
}

interface ReportTokenSummary {
  token: string
  clientId: string
  period: string
  periods?: string[]
  periodLabel?: string
  createdAt: string
  label?: string
  pageName?: string
  totalPosts?: number
  totalEngagement?: number
}

export interface AnalyticsDataState {
  source: 'none' | 'cached' | 'live'
  message?: string
}

export interface GoogleRetryStatus {
  clientId: string
  period: string
  attempts: number
  nextRetryAt: string
  lastError: string
}

interface GoogleAnalyticsResponse {
  data: GoogleInsightsData | null
  retry?: GoogleRetryStatus | null
}

export function useAnalytics() {
  const [analytics, setAnalytics] = useState<ClientAnalytics | null>(null)
  const [googleAnalytics, setGoogleAnalytics] = useState<GoogleInsightsData | null>(null)
  const [metaState, setMetaState] = useState<AnalyticsDataState>({ source: 'none' })
  const [googleState, setGoogleState] = useState<AnalyticsDataState>({ source: 'none' })
  const [googleRetry, setGoogleRetry] = useState<GoogleRetryStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [fetchingGoogle, setFetchingGoogle] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reports, setReports] = useState<ReportTokenSummary[]>([])

  // Load cached analytics for a client (Meta + Google)
  const loadAnalytics = useCallback(async (
    clientId: string,
    period?: string,
    options: { background?: boolean } = {},
  ) => {
    if (!options.background) {
      setLoading(true)
      setError(null)
      setAnalytics(null)
      setGoogleAnalytics(null)
      setGoogleRetry(null)
    }
    try {
      const googleQuery = period ? `?period=${encodeURIComponent(period)}` : ''
      const [metaRes, googleRes] = await Promise.all([
        fetch(`/api/analytics/${encodeURIComponent(clientId)}`),
        fetch(`/api/google/analytics/${encodeURIComponent(clientId)}${googleQuery}`),
      ])
      const metaJson = await metaRes.json()
      const googleJson = await googleRes.json() as GoogleAnalyticsResponse
      setAnalytics(metaJson.data || null)
      setGoogleAnalytics(googleJson.data || null)
      setGoogleRetry(googleJson.retry || null)
      setMetaState(metaJson.data ? { source: 'cached' } : { source: 'none' })
      setGoogleState(googleJson.data ? { source: 'cached' } : { source: 'none' })
    } catch (err: any) {
      if (!options.background) {
        setError(err.message)
      }
    } finally {
      if (!options.background) {
        setLoading(false)
      }
    }
  }, [])

  // Fetch fresh data from Meta API
  const fetchFresh = useCallback(async (clientId: string, period?: string) => {
    setFetching(true)
    setError(null)
    try {
      const res = await fetch(`/api/analytics/${encodeURIComponent(clientId)}/fetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Fetch failed')
      setAnalytics(json.data)
      setMetaState({ source: 'live' })
      return json.data as ClientAnalytics
    } catch (err: any) {
      if (analytics) {
        setMetaState({
          source: 'cached',
          message: err.message || 'Meta live fetch failed.',
        })
        return analytics
      }
      setMetaState({
        source: 'none',
        message: err.message || 'Meta live fetch failed.',
      })
      setError(err.message)
      return null
    } finally {
      setFetching(false)
    }
  }, [analytics])

  // Fetch fresh Google Business Profile data
  const fetchGoogleFresh = useCallback(async (clientId: string, period?: string) => {
    setFetchingGoogle(true)
    setError(null)
    try {
      const res = await fetch(`/api/google/analytics/${encodeURIComponent(clientId)}/fetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period }),
      })
      const json = await res.json()
      if (!res.ok) throw json
      setGoogleAnalytics(json.data)
      setGoogleRetry(null)
      setGoogleState({ source: 'live' })
      return json.data as GoogleInsightsData
    } catch (err: any) {
      const errorMessage = err?.error || err?.message || 'Google live fetch failed.'
      const retry = err?.retry || null
      if (retry) {
        setGoogleRetry(retry)
      }
      if (googleAnalytics) {
        setGoogleState({
          source: 'cached',
          message: errorMessage,
        })
        return googleAnalytics
      }
      setGoogleState({
        source: 'none',
        message: errorMessage,
      })
      setError(errorMessage)
      return null
    } finally {
      setFetchingGoogle(false)
    }
  }, [googleAnalytics])

  // Load report tokens
  const loadReports = useCallback(async () => {
    try {
      const res = await fetch('/api/reports/tokens')
      if (res.ok) setReports(await res.json())
    } catch { /* ignore */ }
  }, [])

  // Generate a report
  const generateReport = useCallback(async (clientId: string, period?: string | string[], label?: string) => {
    try {
      const payload = Array.isArray(period)
        ? { clientId, periods: period, label }
        : { clientId, period, label }
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to generate report')
      await loadReports()
      return json as { success: boolean; token: string; url: string }
    } catch (err: any) {
      setError(err.message)
      return null
    }
  }, [loadReports])

  // Delete a report
  const deleteReport = useCallback(async (token: string) => {
    try {
      await fetch(`/api/reports/${token}`, { method: 'DELETE' })
      await loadReports()
    } catch { /* ignore */ }
  }, [loadReports])

  // Load reports on mount
  useEffect(() => { loadReports() }, [loadReports])

  return {
    analytics,
    googleAnalytics,
    metaState,
    googleState,
    googleRetry,
    loading,
    fetching,
    fetchingGoogle,
    error,
    reports,
    loadAnalytics,
    fetchFresh,
    fetchGoogleFresh,
    loadReports,
    generateReport,
    deleteReport,
  }
}
