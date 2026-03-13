import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, Sparkles, TrendingUp, TrendingDown, BarChart3,
  Heart, MessageCircle, Loader2, AlertCircle, Copy, Check,
  ChevronDown, Calendar, Zap, Target, AlertTriangle,
  ThumbsUp, ThumbsDown, Lightbulb, ArrowRight, Save, X,
  PieChart,
} from 'lucide-react'
import { useApp } from '../../../core/context'
import { useAnalytics, type ClientAnalytics } from '../hooks/useAnalytics'

// ── Types ────────────────────────────────────────────────

type DateRange = 'this-month' | 'last-month' | 'last-3-months' | 'custom'

interface PillarData {
  pillar: string
  count: number
  percentage: number
  color: string
}

interface PillarBalanceResponse {
  balances: Array<{
    clientId: string
    total: number
    pillars: PillarData[]
    untagged: number
  }>
}

interface BestTimesResponse {
  slots: Array<{
    day: string
    hour: number
    avgEngagement: number
    postCount: number
    score: number
  }>
  recommendation: string
}

interface InsightsMetrics {
  totalPosts: number
  totalEngagement: number
  avgEngagement: number
  totalLikes: number
  totalComments: number
  totalShares: number
  bestPost: { message: string; engagement: number; platform: string } | null
  pillarBalance: PillarData[]
  bestTimes: BestTimesResponse | null
  previousPeriodEngagement: number | null
}

interface Recommendation {
  title: string
  explanation: string
  priority: 'high' | 'medium' | 'low'
}

interface ParsedInsights {
  summary: string
  whatWorked: string[]
  whatDidntWork: string[]
  recommendations: Recommendation[]
  benchmark: string
}

// ── Constants ────────────────────────────────────────────

const PILLAR_COLORS: Record<string, string> = {
  educational: '#3b82f6',
  promotional: '#f97316',
  engagement: '#ec4899',
  'behind-the-scenes': '#8b5cf6',
  testimonial: '#10b981',
  inspirational: '#f59e0b',
  informational: '#06b6d4',
  entertainment: '#ef4444',
}

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: 'this-month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'last-3-months', label: 'Last 3 Months' },
]

const PRIORITY_CONFIG = {
  high: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', badge: 'bg-red-500/20 text-red-400' },
  medium: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', badge: 'bg-amber-500/20 text-amber-400' },
  low: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', badge: 'bg-emerald-500/20 text-emerald-400' },
}

function getPeriodLabel(period: string) {
  return new Date(`${period}-01`).toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })
}

function formatPeriod(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function shiftMonths(base: Date, diff: number) {
  const date = new Date(base.getFullYear(), base.getMonth() + diff, 1)
  return formatPeriod(date)
}

function getPeriodsForRange(range: DateRange): string[] {
  const now = new Date()
  if (range === 'last-month') return [shiftMonths(now, -1)]
  if (range === 'last-3-months') return [shiftMonths(now, 0), shiftMonths(now, -1), shiftMonths(now, -2)]
  return [shiftMonths(now, 0)]
}

function buildBestTimes(posts: Array<{ publishedAt: string; engagement: number }>): BestTimesResponse {
  if (posts.length === 0) {
    return { slots: [], recommendation: 'No posting time data' }
  }

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const dayLabels: Record<string, string> = {
    monday: 'Luni',
    tuesday: 'Marți',
    wednesday: 'Miercuri',
    thursday: 'Joi',
    friday: 'Vineri',
    saturday: 'Sâmbătă',
    sunday: 'Duminică',
  }

  const hourMap = new Map<string, { eng: number; count: number }>()
  for (const post of posts) {
    const date = new Date(post.publishedAt)
    if (Number.isNaN(date.getTime())) continue
    const key = `${dayNames[date.getDay()]}-${date.getHours()}`
    const entry = hourMap.get(key) || { eng: 0, count: 0 }
    entry.eng += post.engagement || 0
    entry.count++
    hourMap.set(key, entry)
  }

  if (hourMap.size === 0) {
    return { slots: [], recommendation: 'No posting time data' }
  }

  const maxEng = Math.max(...Array.from(hourMap.values()).map(value => value.eng / value.count), 1)
  const slots = Array.from(hourMap.entries())
    .map(([key, value]) => {
      const [day, hour] = key.split('-')
      const avg = Math.round(value.eng / value.count)
      return {
        day,
        hour: Number(hour),
        avgEngagement: avg,
        postCount: value.count,
        score: Math.round((avg / maxEng) * 100),
      }
    })
    .sort((a, b) => b.score - a.score)

  const top = slots.slice(0, 3)
  const recommendation = top.length > 0
    ? `Cele mai bune momente: ${top.map(slot => `${dayLabels[slot.day] || slot.day} la ${String(slot.hour).padStart(2, '0')}:00`).join(', ')}`
    : 'No posting time data'

  return { slots: slots.slice(0, 50), recommendation }
}

function buildPillarBalance(posts: Array<{ pillar?: string }>): PillarData[] {
  if (posts.length === 0) return []

  const counts = new Map<string, number>()
  for (const post of posts) {
    const pillar = post.pillar?.toLowerCase().trim()
    if (!pillar) continue
    counts.set(pillar, (counts.get(pillar) || 0) + 1)
  }

  const total = posts.length
  return Array.from(counts.entries())
    .map(([pillar, count]) => ({
      pillar,
      count,
      percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      color: PILLAR_COLORS[pillar] || '#64748b',
    }))
    .sort((a, b) => b.count - a.count)
}

function mergeAnalyticsPeriods(entries: ClientAnalytics[]): ClientAnalytics | null {
  if (entries.length === 0) return null

  const allFacebook = entries.flatMap(entry => entry.facebook.posts)
  const allInstagram = entries.flatMap(entry => entry.instagram.posts)
  const allPosts = [...allFacebook, ...allInstagram]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

  const sum = (posts: typeof allFacebook, key: 'likes' | 'comments' | 'shares' | 'engagement') =>
    posts.reduce((total, post) => total + post[key], 0)

  const dayMap = new Map<string, { engagement: number; likes: number; comments: number; shares: number }>()
  for (const post of allPosts) {
    const day = post.publishedAt.slice(0, 10)
    const current = dayMap.get(day) || { engagement: 0, likes: 0, comments: 0, shares: 0 }
    current.engagement += post.engagement
    current.likes += post.likes
    current.comments += post.comments
    current.shares += post.shares
    dayMap.set(day, current)
  }

  const totalEngagement = sum(allPosts, 'engagement')
  const engagementByDay = [...dayMap.entries()]
    .map(([date, values]) => ({ date, ...values }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    clientId: entries[0].clientId,
    pageId: entries[0].pageId,
    pageName: entries[0].pageName,
    lastFetched: entries[0].lastFetched,
    period: entries.map(entry => entry.period).join(','),
    facebook: {
      posts: allFacebook,
      totalLikes: sum(allFacebook, 'likes'),
      totalComments: sum(allFacebook, 'comments'),
      totalShares: sum(allFacebook, 'shares'),
      totalEngagement: sum(allFacebook, 'engagement'),
      avgEngagement: allFacebook.length > 0 ? Math.round(sum(allFacebook, 'engagement') / allFacebook.length) : 0,
    },
    instagram: {
      posts: allInstagram,
      totalLikes: sum(allInstagram, 'likes'),
      totalComments: sum(allInstagram, 'comments'),
      totalShares: sum(allInstagram, 'shares'),
      totalEngagement: sum(allInstagram, 'engagement'),
      avgEngagement: allInstagram.length > 0 ? Math.round(sum(allInstagram, 'engagement') / allInstagram.length) : 0,
    },
    combined: {
      totalPosts: allPosts.length,
      totalLikes: sum(allPosts, 'likes'),
      totalComments: sum(allPosts, 'comments'),
      totalShares: sum(allPosts, 'shares'),
      totalEngagement,
      avgEngagement: allPosts.length > 0 ? Math.round(totalEngagement / allPosts.length) : 0,
      engagementByDay,
      topPosts: [...allPosts].sort((a, b) => b.engagement - a.engagement).slice(0, 10),
    },
  }
}

// ── Main Component ──────────────────────────────────────

export function AIInsights() {
  const { data, selectedClient } = useApp()
  const { generateReport } = useAnalytics()

  const [dateRange, setDateRange] = useState<DateRange>('this-month')
  const [showDateDropdown, setShowDateDropdown] = useState(false)

  // Metrics state
  const [metrics, setMetrics] = useState<InsightsMetrics | null>(null)
  const [metricsLoading, setMetricsLoading] = useState(false)

  // AI state
  const [aiOutput, setAiOutput] = useState('')
  const [aiStreaming, setAiStreaming] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [parsedInsights, setParsedInsights] = useState<ParsedInsights | null>(null)
  const [sourceHints, setSourceHints] = useState<string[]>([])
  const abortRef = useRef<AbortController | null>(null)

  // Export state
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activePeriods, setActivePeriods] = useState<string[]>([])

  const client = selectedClient ? data.clients.find(c => c.id === selectedClient) : null

  // ── Fetch all metrics ──────────────────────────────────

  const fetchMetrics = useCallback(async () => {
    if (!selectedClient || !client) return
    setMetricsLoading(true)
    setAiOutput('')
    setParsedInsights(null)
    setAiError(null)
    setSourceHints([])

    try {
      const periods = getPeriodsForRange(dateRange)
      setActivePeriods(periods)

      const entries: ClientAnalytics[] = []
      for (const period of periods) {
        const res = await fetch(`/api/analytics/${encodeURIComponent(selectedClient)}/fetch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ period }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || `Failed to fetch analytics for ${period}`)
        if (json.data) entries.push(json.data as ClientAnalytics)
      }

      const merged = mergeAnalyticsPeriods(entries)
      if (!merged) {
        throw new Error('No analytics data available for the selected period')
      }

      const filteredPosts = client.posts.filter(post => periods.some(period => post.date.startsWith(period)))
      const bestTimesData = buildBestTimes([...merged.facebook.posts, ...merged.instagram.posts])
      const combined = merged.combined

      const metricsObj: InsightsMetrics = {
        totalPosts: combined?.totalPosts ?? 0,
        totalEngagement: combined?.totalEngagement ?? 0,
        avgEngagement: combined?.avgEngagement ?? 0,
        totalLikes: combined?.totalLikes ?? 0,
        totalComments: combined?.totalComments ?? 0,
        totalShares: combined?.totalShares ?? 0,
        bestPost: combined?.topPosts?.[0]
          ? {
              message: combined.topPosts[0].message.slice(0, 120),
              engagement: combined.topPosts[0].engagement,
              platform: combined.topPosts[0].platform,
            }
          : null,
        pillarBalance: buildPillarBalance(filteredPosts),
        bestTimes: bestTimesData,
        previousPeriodEngagement: null,
      }

      // Calculate trend from engagementByDay if available
      if (combined?.engagementByDay?.length && combined.engagementByDay.length > 6) {
        const days = combined.engagementByDay
        const mid = Math.floor(days.length / 2)
        const firstHalf = days.slice(0, mid).reduce((s, d) => s + d.engagement, 0)
        const secondHalf = days.slice(mid).reduce((s, d) => s + d.engagement, 0)
        metricsObj.previousPeriodEngagement = firstHalf
      }

      setMetrics(metricsObj)
    } catch (err: any) {
      setAiError(err.message || 'Failed to fetch metrics')
    } finally {
      setMetricsLoading(false)
    }
  }, [selectedClient, client, dateRange])

  // ── Generate AI insights ──────────────────────────────

  const generateInsights = useCallback(async () => {
    if (!metrics || !selectedClient) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setAiStreaming(true)
    setAiOutput('')
    setParsedInsights(null)
    setAiError(null)
    setSourceHints([])

    const pillarSummary = metrics.pillarBalance.length > 0
      ? metrics.pillarBalance.map(p => `${p.pillar}: ${p.count} posts (${p.percentage}%)`).join(', ')
      : 'No pillar data available'

    const bestTimesSummary = metrics.bestTimes?.recommendation || 'No posting time data'

    const bestPostInfo = metrics.bestPost
      ? `Best post: "${metrics.bestPost.message}..." on ${metrics.bestPost.platform} with ${metrics.bestPost.engagement} engagement`
      : 'No individual post data'

    const trendInfo = metrics.previousPeriodEngagement !== null
      ? `First half engagement: ${metrics.previousPeriodEngagement}, Second half: ${metrics.totalEngagement - metrics.previousPeriodEngagement}`
      : 'No trend data available'

    const dateRangeLabel = DATE_RANGE_OPTIONS.find(o => o.value === dateRange)?.label || dateRange

    const prompt = `Analyze these social media metrics for a Romanian business client and provide actionable insights. Keep it direct and data-driven — no fluff, no motivational headers.

PERIOD: ${dateRangeLabel}

METRICS:
- Total posts: ${metrics.totalPosts}
- Total engagement: ${metrics.totalEngagement}
- Average engagement per post: ${metrics.avgEngagement}
- Likes: ${metrics.totalLikes} | Comments: ${metrics.totalComments} | Shares: ${metrics.totalShares}
- ${bestPostInfo}
- Content pillar distribution: ${pillarSummary}
- Best posting times: ${bestTimesSummary}
- Engagement trend: ${trendInfo}

Provide your analysis in EXACTLY this format (use these exact headers):

## PERFORMANCE SUMMARY
2-3 sentences on overall performance. Be specific with numbers.

## WHAT WORKED
- Point 1 (with specific data)
- Point 2
- Point 3

## WHAT DIDN'T WORK
- Point 1 (with specific data)
- Point 2
- Point 3

## RECOMMENDATIONS
For each recommendation, use this exact format:
### [HIGH/MEDIUM/LOW] Title of recommendation
Explanation with specific action items.

### [HIGH/MEDIUM/LOW] Title of recommendation
Explanation with specific action items.

(Provide exactly 5 recommendations)

## BENCHMARK
If you do NOT have a validated external benchmark in the system, write exactly:
No validated external benchmark available in PostBoard.
Do not invent industry averages or external comparisons.`

    const messages = [{ role: 'user', content: prompt }]

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: selectedClient, messages }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        setAiError(err.error || 'AI request failed')
        setAiStreaming(false)
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const d = line.slice(6)
            if (d === '[DONE]') {
              setParsedInsights(parseAIOutput(fullText))
              setAiStreaming(false)
              return
            }
            try {
              const parsed = JSON.parse(d)
              if (parsed.text) {
                fullText += parsed.text
                setAiOutput(fullText)
              }
              if (Array.isArray(parsed.sources)) setSourceHints(parsed.sources)
              if (parsed.error) setAiError(parsed.error)
            } catch { /* skip */ }
          }
        }
      }

      setParsedInsights(parseAIOutput(fullText))
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setAiError(err instanceof Error ? err.message : 'Request failed')
      }
    } finally {
      setAiStreaming(false)
    }
  }, [metrics, selectedClient, dateRange])

  // ── Parse AI output into structured sections ──────────

  function parseAIOutput(text: string): ParsedInsights {
    const sections = {
      summary: '',
      whatWorked: [] as string[],
      whatDidntWork: [] as string[],
      recommendations: [] as Recommendation[],
      benchmark: '',
    }

    // Extract summary
    const summaryMatch = text.match(/##\s*PERFORMANCE SUMMARY\s*\n([\s\S]*?)(?=\n##\s|$)/)
    if (summaryMatch) sections.summary = summaryMatch[1].trim()

    // Extract what worked
    const workedMatch = text.match(/##\s*WHAT WORKED\s*\n([\s\S]*?)(?=\n##\s|$)/)
    if (workedMatch) {
      sections.whatWorked = workedMatch[1]
        .split('\n')
        .filter(l => l.trim().startsWith('-') || l.trim().startsWith('*'))
        .map(l => l.replace(/^[\s\-\*]+/, '').trim())
        .filter(Boolean)
    }

    // Extract what didn't work
    const didntMatch = text.match(/##\s*WHAT DIDN'T WORK\s*\n([\s\S]*?)(?=\n##\s|$)/)
    if (didntMatch) {
      sections.whatDidntWork = didntMatch[1]
        .split('\n')
        .filter(l => l.trim().startsWith('-') || l.trim().startsWith('*'))
        .map(l => l.replace(/^[\s\-\*]+/, '').trim())
        .filter(Boolean)
    }

    // Extract recommendations
    const recsMatch = text.match(/##\s*RECOMMENDATIONS\s*\n([\s\S]*?)(?=\n##\s|$)/)
    if (recsMatch) {
      const recBlocks = recsMatch[1].split(/###\s*/).filter(Boolean)
      for (const block of recBlocks) {
        const headerMatch = block.match(/^\[(HIGH|MEDIUM|LOW)\]\s*(.*)/i)
        if (headerMatch) {
          const priority = headerMatch[1].toLowerCase() as 'high' | 'medium' | 'low'
          const title = headerMatch[2].trim()
          const explanation = block.slice(block.indexOf('\n') + 1).trim()
          sections.recommendations.push({ title, explanation, priority })
        }
      }
    }

    // Extract benchmark
    const benchMatch = text.match(/##\s*BENCHMARK\s*\n([\s\S]*?)$/)
    if (benchMatch) sections.benchmark = benchMatch[1].trim()

    return sections
  }

  // ── Handlers ──────────────────────────────────────────

  const handleGenerateAll = async () => {
    await fetchMetrics()
  }

  // After metrics load, auto-generate AI insights
  useEffect(() => {
    if (metrics && !aiStreaming && !parsedInsights && !aiOutput) {
      generateInsights()
    }
  }, [metrics])

  const handleCopy = () => {
    if (!aiOutput) return
    navigator.clipboard.writeText(aiOutput)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveReport = async () => {
    if (!selectedClient || activePeriods.length === 0) return
    setSaving(true)
    const result = await generateReport(
      selectedClient,
      activePeriods,
      `AI Insights — ${activePeriods.length === 1
        ? getPeriodLabel(activePeriods[0])
        : `${getPeriodLabel(activePeriods[activePeriods.length - 1])} - ${getPeriodLabel(activePeriods[0])}`}`,
    )
    if (result) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  const handleAbort = () => {
    abortRef.current?.abort()
    setAiStreaming(false)
  }

  // ── No client selected ────────────────────────────────

  if (!selectedClient) {
    return (
      <div className="h-full flex flex-col">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-1">AI Insights</h2>
          <p className="text-sm text-white/30">Select a client from the sidebar</p>
        </motion.div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Brain size={48} className="text-white/10 mx-auto mb-4" />
            <p className="text-white/30 text-sm mb-1">No client selected</p>
            <p className="text-white/15 text-xs">
              Choose a client to generate AI-powered analytics insights
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Compute trend ─────────────────────────────────────

  const trendPct = metrics?.previousPeriodEngagement
    ? (() => {
        const prev = metrics.previousPeriodEngagement!
        const curr = metrics.totalEngagement - prev
        if (prev === 0) return null
        return Math.round(((curr - prev) / prev) * 100)
      })()
    : null

  // ── Render ────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-start justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <Brain size={24} className="text-accent-violet" />
            AI Insights
          </h2>
          <p className="text-sm text-white/30">
            {client?.displayName} — AI-powered performance analysis
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Date range dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDateDropdown(v => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg glass text-sm text-white/60 hover:text-white/80 transition-colors"
            >
              <Calendar size={14} />
              {DATE_RANGE_OPTIONS.find(o => o.value === dateRange)?.label}
              <ChevronDown size={12} className={`transition-transform ${showDateDropdown ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showDateDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute right-0 top-full mt-1 z-20 glass rounded-lg border border-white/[0.08] overflow-hidden min-w-[160px]"
                >
                  {DATE_RANGE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setDateRange(opt.value); setShowDateDropdown(false) }}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                        dateRange === opt.value
                          ? 'bg-accent-violet/10 text-accent-violet'
                          : 'text-white/50 hover:bg-white/[0.04] hover:text-white/70'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerateAll}
            disabled={metricsLoading || aiStreaming}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-accent-violet/20 text-accent-violet text-sm font-medium hover:bg-accent-violet/30 transition-all disabled:opacity-50"
          >
            {metricsLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            {metricsLoading ? 'Loading...' : aiStreaming ? 'Analyzing...' : 'Generate Insights'}
          </button>
        </div>
      </motion.div>

      {/* Content */}
      <div className="flex-1 scroll-area pr-2 pb-6">
        {/* Error */}
        <AnimatePresence>
          {aiError && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="mb-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            >
              <AlertCircle size={14} />
              <span className="flex-1">{aiError}</span>
              <button onClick={() => setAiError(null)} className="p-1 hover:bg-white/5 rounded">
                <X size={12} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Metrics summary cards */}
        {metrics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={14} className="text-white/30" />
              <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider">Key Metrics</h3>
              <div className="flex-1 h-px bg-white/[0.06]" />
              {activePeriods.length > 0 && (
                <span className="text-[11px] text-white/25">
                  {activePeriods.length === 1
                    ? getPeriodLabel(activePeriods[0])
                    : `${getPeriodLabel(activePeriods[activePeriods.length - 1])} - ${getPeriodLabel(activePeriods[0])}`}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              <MetricCard
                label="Total Posts"
                value={metrics.totalPosts}
                icon={BarChart3}
                gradient="from-violet-500 to-indigo-500"
              />
              <MetricCard
                label="Engagement"
                value={metrics.totalEngagement}
                icon={TrendingUp}
                gradient="from-amber-500 to-orange-500"
                trend={trendPct}
              />
              <MetricCard
                label="Avg / Post"
                value={metrics.avgEngagement}
                icon={Zap}
                gradient="from-purple-500 to-violet-500"
              />
              <MetricCard
                label="Likes"
                value={metrics.totalLikes}
                icon={Heart}
                gradient="from-pink-500 to-rose-500"
              />
              <MetricCard
                label="Comments"
                value={metrics.totalComments}
                icon={MessageCircle}
                gradient="from-cyan-500 to-blue-500"
              />
              <MetricCard
                label="Shares"
                value={metrics.totalShares}
                icon={Target}
                gradient="from-emerald-500 to-teal-500"
              />
            </div>

            {/* Pillar balance and best post side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {/* Pillar balance */}
              {metrics.pillarBalance.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="glass rounded-xl p-5"
                >
                  <h4 className="text-sm font-semibold text-white/60 mb-4 flex items-center gap-2">
                    <PieChart size={14} className="text-violet-400" />
                    Content Pillar Balance
                  </h4>
                  <div className="space-y-0">
                    {metrics.pillarBalance.slice(0, 6).map(p => (
                      <div key={p.pillar} className="py-2.5 border-b border-white/[0.04] last:border-0">
                        <div className="flex justify-between mb-1.5">
                          <span className="text-xs text-white/50 capitalize">{p.pillar}</span>
                          <span className="text-xs font-semibold text-white/80 tabular-nums">
                            {p.count}
                            <span className="text-white/25 ml-1">({p.percentage}%)</span>
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${p.percentage}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: p.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Best performing post */}
              {metrics.bestPost && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="glass rounded-xl p-5"
                >
                  <h4 className="text-sm font-semibold text-white/60 mb-4 flex items-center gap-2">
                    <Zap size={14} className="text-amber-400" />
                    Best Performing Post
                  </h4>
                  <div className="bg-white/[0.03] rounded-lg p-4 mb-3">
                    <p className="text-sm text-white/60 leading-relaxed">
                      "{metrics.bestPost.message}{metrics.bestPost.message.length >= 120 ? '...' : ''}"
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-white/30 capitalize">{metrics.bestPost.platform}</span>
                    <span className="flex items-center gap-1 text-accent-violet font-semibold">
                      <TrendingUp size={12} />
                      {metrics.bestPost.engagement.toLocaleString('ro-RO')} engagement
                    </span>
                  </div>
                  {metrics.bestTimes?.recommendation && (
                    <div className="mt-4 pt-3 border-t border-white/[0.04]">
                      <div className="flex items-start gap-2 text-xs text-white/40">
                        <Lightbulb size={12} className="text-amber-400/60 shrink-0 mt-0.5" />
                        <span>{metrics.bestTimes.recommendation}</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* Loading skeleton */}
        {metricsLoading && !metrics && (
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass rounded-xl p-4 h-20 shimmer" />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="glass rounded-xl h-[240px] shimmer" />
              <div className="glass rounded-xl h-[240px] shimmer" />
            </div>
          </div>
        )}

        {/* AI Analysis */}
        {(aiStreaming || parsedInsights || aiOutput) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Brain size={14} className="text-accent-violet" />
              <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider">AI Analysis</h3>
              <div className="flex-1 h-px bg-white/[0.06]" />
              {aiStreaming && (
                <button
                  onClick={handleAbort}
                  className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors"
                >
                  <X size={12} /> Stop
                </button>
              )}
            </div>

            {sourceHints.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {sourceHints.slice(0, 5).map(source => (
                  <span
                    key={source}
                    className="px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] text-[10px] text-white/35"
                  >
                    {source.split('/').slice(-2).join('/')}
                  </span>
                ))}
              </div>
            )}

            {/* Streaming indicator */}
            {aiStreaming && !parsedInsights && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-xl p-5 mb-4"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative">
                    <Brain size={20} className="text-accent-violet" />
                    <motion.div
                      className="absolute inset-0 rounded-full bg-accent-violet/20"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </div>
                  <span className="text-sm text-white/50">Analyzing your data...</span>
                </div>
                <div className="text-sm text-white/40 whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto scroll-area">
                  {aiOutput}
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="inline-block w-2 h-4 bg-accent-violet/60 ml-0.5 -mb-0.5"
                  />
                </div>
              </motion.div>
            )}

            {/* Parsed structured insights */}
            {parsedInsights && (
              <div className="space-y-4">
                {/* Performance Summary */}
                {parsedInsights.summary && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="glass rounded-xl p-5"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 size={16} className="text-accent-violet" />
                      <h4 className="text-sm font-semibold text-white/70">Performance Summary</h4>
                    </div>
                    <p className="text-sm text-white/50 leading-relaxed">{parsedInsights.summary}</p>
                  </motion.div>
                )}

                {/* What Worked / What Didn't — side by side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* What Worked */}
                  {parsedInsights.whatWorked.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="glass rounded-xl p-5"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <ThumbsUp size={16} className="text-emerald-400" />
                        <h4 className="text-sm font-semibold text-emerald-400/80">What Worked</h4>
                      </div>
                      <div className="space-y-3">
                        {parsedInsights.whatWorked.map((item, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 + i * 0.05 }}
                            className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/10"
                          >
                            <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                              <Check size={10} className="text-emerald-400" />
                            </div>
                            <p className="text-xs text-white/50 leading-relaxed">{item}</p>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* What Didn't Work */}
                  {parsedInsights.whatDidntWork.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="glass rounded-xl p-5"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <ThumbsDown size={16} className="text-red-400/80" />
                        <h4 className="text-sm font-semibold text-red-400/70">What Didn't Work</h4>
                      </div>
                      <div className="space-y-3">
                        {parsedInsights.whatDidntWork.map((item, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + i * 0.05 }}
                            className="flex items-start gap-3 p-3 rounded-lg bg-red-500/[0.06] border border-red-500/10"
                          >
                            <div className="mt-0.5 w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                              <AlertTriangle size={10} className="text-red-400/80" />
                            </div>
                            <p className="text-xs text-white/50 leading-relaxed">{item}</p>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Recommendations */}
                {parsedInsights.recommendations.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb size={14} className="text-amber-400" />
                      <h4 className="text-sm font-semibold text-white/50 uppercase tracking-wider">Recommendations</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {parsedInsights.recommendations.map((rec, i) => (
                        <RecommendationCard key={i} rec={rec} index={i} />
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Benchmark */}
                {parsedInsights.benchmark && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="glass rounded-xl p-5"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Target size={16} className="text-cyan-400" />
                      <h4 className="text-sm font-semibold text-white/70">Industry Benchmark</h4>
                    </div>
                    <p className="text-sm text-white/50 leading-relaxed">{parsedInsights.benchmark}</p>
                  </motion.div>
                )}

                {/* Export buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-3 pt-2"
                >
                  <button
                    onClick={handleSaveReport}
                    disabled={saving || activePeriods.length === 0}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent-violet/20 text-accent-violet text-sm font-medium hover:bg-accent-violet/30 transition-all disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : saved ? (
                      <Check size={14} />
                    ) : (
                      <Save size={14} />
                    )}
                    {saving ? 'Saving...' : saved ? 'Report Saved!' : 'Save as Report'}
                  </button>

                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg glass text-white/40 text-sm font-medium hover:text-white/60 hover:bg-white/[0.06] transition-all"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy Insights'}
                  </button>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}

        {/* Empty state — no analysis yet */}
        {!metrics && !metricsLoading && !aiOutput && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center min-h-[400px]"
          >
            <div className="text-center max-w-md">
              <div className="relative inline-block mb-6">
                <Brain size={56} className="text-white/[0.06]" />
                <motion.div
                  className="absolute -top-1 -right-1"
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Sparkles size={20} className="text-accent-violet/30" />
                </motion.div>
              </div>
              <p className="text-white/40 text-sm mb-2">Ready to analyze</p>
              <p className="text-white/20 text-xs leading-relaxed mb-6">
                Click "Generate Insights" to fetch your metrics and get AI-powered
                analysis with actionable recommendations.
              </p>
              <button
                onClick={handleGenerateAll}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-violet/20 text-accent-violet text-sm font-medium hover:bg-accent-violet/30 transition-all"
              >
                <Sparkles size={16} />
                Generate Insights
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

// ── Metric Card ──────────────────────────────────────────

function MetricCard({ label, value, icon: Icon, gradient, trend, isText }: {
  label: string
  value: number | string
  icon: any
  gradient: string
  trend?: number | null
  isText?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass glass-hover rounded-xl p-4 cursor-default"
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient} bg-opacity-10`}>
          <Icon size={16} className="text-white/90" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <div className="text-xl font-bold text-white truncate">
              {isText ? value : (typeof value === 'number' ? value.toLocaleString('ro-RO') : value)}
            </div>
            {trend !== null && trend !== undefined && (
              <div className={`flex items-center gap-0.5 text-[10px] font-medium ${
                trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-red-400' : 'text-white/30'
              }`}>
                {trend > 0 ? <TrendingUp size={10} /> : trend < 0 ? <TrendingDown size={10} /> : null}
                {trend > 0 ? '+' : ''}{trend}%
              </div>
            )}
          </div>
          <div className="text-[11px] text-white/40 uppercase tracking-wider font-medium">{label}</div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Recommendation Card ──────────────────────────────────

function RecommendationCard({ rec, index }: { rec: Recommendation; index: number }) {
  const config = PRIORITY_CONFIG[rec.priority]
  const PriorityIcon = rec.priority === 'high' ? Zap : rec.priority === 'medium' ? Target : Lightbulb

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 + index * 0.06 }}
      className={`glass rounded-xl p-4 border ${config.border} hover:bg-white/[0.02] transition-colors group`}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`p-1.5 rounded-lg ${config.bg} shrink-0`}>
          <PriorityIcon size={14} className={config.color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${config.badge}`}>
              {rec.priority}
            </span>
          </div>
          <h5 className="text-sm font-semibold text-white/80 leading-tight">{rec.title}</h5>
        </div>
      </div>

      {/* Body */}
      <p className="text-xs text-white/40 leading-relaxed">{rec.explanation}</p>

      {/* Action hint */}
      <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center gap-1.5 text-[10px] text-white/20 group-hover:text-white/40 transition-colors">
        <ArrowRight size={10} />
        <span>Take action</span>
      </div>
    </motion.div>
  )
}
