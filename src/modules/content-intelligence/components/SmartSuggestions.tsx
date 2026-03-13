import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lightbulb, TrendingUp, BarChart3, Heart, MessageCircle, Share2,
  Loader2, Sparkles, Copy, Check, RotateCcw, AlertCircle,
  Facebook, Instagram, ExternalLink, ArrowUpRight, PieChart,
  Zap, Target, RefreshCw,
} from 'lucide-react'
import { useApp } from '../../../core/context'
import { useAIStream } from '../hooks/useAI'

// ── Types ────────────────────────────────────────────────
interface PostMetric {
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

interface ClientAnalytics {
  clientId: string
  pageName: string
  lastFetched: string
  period: string
  facebook: { posts: PostMetric[]; totalEngagement: number; avgEngagement: number }
  instagram: { posts: PostMetric[]; totalEngagement: number; avgEngagement: number }
  combined: {
    totalPosts: number
    totalLikes: number
    totalComments: number
    totalShares: number
    totalEngagement: number
    avgEngagement: number
    topPosts: PostMetric[]
  }
}

interface PillarData {
  pillar: string
  count: number
  percentage: number
  color: string
}

interface PillarBalance {
  clientId: string
  total: number
  pillars: PillarData[]
  untagged: number
}

// ── Helpers ──────────────────────────────────────────────
const PLATFORM_CONFIG = {
  facebook: { icon: Facebook, color: '#1877f2', label: 'Facebook' },
  instagram: { icon: Instagram, color: '#e4405f', label: 'Instagram' },
} as const

function truncate(str: string, len: number) {
  if (!str) return ''
  return str.length > len ? str.slice(0, len) + '...' : str
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

// Identify content gaps from pillar balance
function analyzeGaps(pillars: PillarData[], total: number): { underperforming: PillarData[]; missing: string[] } {
  const IDEAL_PILLARS = [
    'educational', 'promotional', 'engagement', 'behind-the-scenes',
    'testimonial', 'inspirational',
  ]
  const idealPct = 100 / IDEAL_PILLARS.length

  const existing = new Set(pillars.map(p => p.pillar))
  const missing = IDEAL_PILLARS.filter(p => !existing.has(p))

  // Pillars that exist but are significantly below ideal distribution
  const underperforming = pillars.filter(p =>
    IDEAL_PILLARS.includes(p.pillar) && p.percentage < idealPct * 0.5
  )

  return { underperforming, missing }
}

// ── Main Component ───────────────────────────────────────
export function SmartSuggestions({ clientId }: { clientId: string }) {
  const { stream, streaming, abort } = useAIStream()

  // Data states
  const [analytics, setAnalytics] = useState<ClientAnalytics | null>(null)
  const [pillarBalance, setPillarBalance] = useState<PillarBalance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // AI generation state
  const [generatingPostId, setGeneratingPostId] = useState<string | null>(null)
  const [generatingGaps, setGeneratingGaps] = useState(false)
  const [result, setResult] = useState('')
  const [resultLabel, setResultLabel] = useState('')
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const resultRef = useRef('')
  const resultEndRef = useRef<HTMLDivElement>(null)

  // ── Fetch data ──
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [analyticsRes, pillarRes] = await Promise.all([
        fetch(`/api/analytics/${clientId}`),
        fetch(`/api/intelligence/pillar-balance?clientId=${clientId}`),
      ])

      const analyticsData = await analyticsRes.json()
      const pillarData = await pillarRes.json()

      if (analyticsData.data) {
        setAnalytics(analyticsData.data)
      } else {
        setAnalytics(null)
      }

      if (pillarData.balances?.length > 0) {
        setPillarBalance(pillarData.balances[0])
      }
    } catch (err) {
      setError('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    fetchData()
    // Reset AI state on client change
    setResult('')
    setResultLabel('')
    setGeneratingPostId(null)
    setGeneratingGaps(false)
    resultRef.current = ''
  }, [fetchData])

  useEffect(() => {
    if (streaming) resultEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [result, streaming])

  // ── Generate similar posts ──
  const handleGenerateSimilar = (post: PostMetric) => {
    if (streaming) return
    setGeneratingPostId(post.metaPostId)
    setGeneratingGaps(false)
    setResultLabel(`Similar to: "${truncate(post.message, 60)}"`)
    resultRef.current = ''
    setResult('')

    stream(
      '/api/intelligence/repurpose',
      {
        clientId,
        caption: `CONTEXT: This is a top-performing post with ${post.engagement} total engagements (${post.likes} likes, ${post.comments} comments, ${post.shares} shares). It was posted on ${post.platform}.

ORIGINAL POST:
${post.message}

TASK: Generate 3 new post variations inspired by this top performer. Each variation should:
1. Use a different hook/angle but keep the same core theme
2. Be optimized for ${post.platform}
3. Include suggested hashtags
4. Be written in Romanian with proper diacritics (ă, â, î, ș, ț)

Label each variation clearly as "Varianta 1", "Varianta 2", "Varianta 3".
For each, explain briefly why this angle should work well based on the original's success.`,
        platform: post.platform,
      },
      (chunk) => {
        resultRef.current += chunk
        setResult(resultRef.current)
      },
      () => setGeneratingPostId(null),
      () => setGeneratingPostId(null),
    )
  }

  // ── Generate from content gaps ──
  const handleGenerateFromGaps = (gaps: { underperforming: PillarData[]; missing: string[] }) => {
    if (streaming) return
    setGeneratingGaps(true)
    setGeneratingPostId(null)
    setResultLabel('Content Gap Suggestions')
    resultRef.current = ''
    setResult('')

    const gapDescription = [
      ...(gaps.missing.length > 0 ? [`Missing pillars: ${gaps.missing.join(', ')}`] : []),
      ...(gaps.underperforming.length > 0 ? [`Underperforming pillars: ${gaps.underperforming.map(p => `${p.pillar} (${p.percentage}%)`).join(', ')}`] : []),
    ].join('\n')

    stream(
      '/api/intelligence/repurpose',
      {
        clientId,
        caption: `CONTENT GAP ANALYSIS:
${gapDescription}

${pillarBalance ? `Current distribution: ${pillarBalance.pillars.map(p => `${p.pillar}: ${p.percentage}%`).join(', ')}` : ''}

TASK: Generate content suggestions to fill these gaps. For each gap/underperforming pillar:
1. Explain why this content type matters for the brand
2. Provide 2 ready-to-use post ideas with full captions
3. Suggest the best platform and format for each
4. Include hashtags

Write everything in Romanian with proper diacritics (ă, â, î, ș, ț).
Label each section by pillar name.`,
        platform: 'facebook',
      },
      (chunk) => {
        resultRef.current += chunk
        setResult(resultRef.current)
      },
      () => setGeneratingGaps(false),
      () => setGeneratingGaps(false),
    )
  }

  const handleReset = () => {
    abort()
    setResult('')
    setResultLabel('')
    setGeneratingPostId(null)
    setGeneratingGaps(false)
    resultRef.current = ''
  }

  const copyText = (text: string, idx: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  // ── Derived data ──
  const topPosts = analytics?.combined?.topPosts?.slice(0, 6) || []
  const allPosts = [
    ...(analytics?.facebook?.posts || []),
    ...(analytics?.instagram?.posts || []),
  ].sort((a, b) => b.engagement - a.engagement)
  const displayPosts = topPosts.length > 0 ? topPosts : allPosts.slice(0, 6)
  const gaps = pillarBalance ? analyzeGaps(pillarBalance.pillars, pillarBalance.total) : null
  const hasGaps = gaps && (gaps.missing.length > 0 || gaps.underperforming.length > 0)

  // Parse AI result into sections
  const parseSections = (text: string) => {
    const sections: { title: string; content: string }[] = []
    const lines = text.split('\n')
    let current: { title: string; lines: string[] } | null = null

    for (const line of lines) {
      const headerMatch = line.match(/^#{1,3}\s+(.+)/)
      if (headerMatch) {
        if (current) sections.push({ title: current.title, content: current.lines.join('\n').trim() })
        current = { title: headerMatch[1], lines: [] }
        continue
      }
      if (current) current.lines.push(line)
      else if (line.trim()) {
        // Content before any header
        if (!current) current = { title: '', lines: [line] }
      }
    }
    if (current) sections.push({ title: current.title, content: current.lines.join('\n').trim() })
    return sections
  }

  // ── Loading state ──
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 size={24} className="animate-spin text-amber-400/60 mx-auto mb-3" />
          <p className="text-sm text-white/30">Loading analytics...</p>
        </motion.div>
      </div>
    )
  }

  // ── No data state ──
  if (!analytics && !loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-2xl p-8 max-w-md text-center"
        >
          <div className="w-14 h-14 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} className="text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No Analytics Data</h3>
          <p className="text-sm text-white/40 mb-4">
            Connect Meta and fetch analytics data first. Smart Suggestions uses real engagement data to find your top performers.
          </p>
          <p className="text-xs text-white/20">
            Go to Analytics and click "Fetch Data" for this client.
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="h-full flex gap-4">
      {/* ── Left Panel: Top Performers + Content Gaps ── */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-[380px] shrink-0 flex flex-col gap-3 overflow-y-auto scroll-area"
      >
        {/* Header */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                <Lightbulb size={18} className="text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Smart Suggestions</h3>
                <p className="text-[10px] text-white/25">AI-powered content insights</p>
              </div>
            </div>
            <button
              onClick={fetchData}
              className="p-2 rounded-lg glass-hover text-white/20 hover:text-white/50 transition-colors"
              title="Refresh data"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {/* Quick stats */}
          {analytics && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="bg-white/[0.04] rounded-lg p-2.5 text-center">
                <div className="text-xs font-bold text-white/80">{analytics.combined.totalPosts}</div>
                <div className="text-[9px] text-white/25">Posts</div>
              </div>
              <div className="bg-white/[0.04] rounded-lg p-2.5 text-center">
                <div className="text-xs font-bold text-white/80">{formatNumber(analytics.combined.totalEngagement)}</div>
                <div className="text-[9px] text-white/25">Engagement</div>
              </div>
              <div className="bg-white/[0.04] rounded-lg p-2.5 text-center">
                <div className="text-xs font-bold text-white/80">{analytics.combined.avgEngagement}</div>
                <div className="text-[9px] text-white/25">Avg/Post</div>
              </div>
            </div>
          )}

          {analytics?.lastFetched && (
            <p className="text-[9px] text-white/15 mt-2 text-center">
              Data from {new Date(analytics.lastFetched).toLocaleDateString('ro-RO')} | Period: {analytics.period}
            </p>
          )}
        </div>

        {/* Top Performers */}
        {displayPosts.length > 0 && (
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-emerald-400" />
              <span className="text-xs font-semibold text-white/70">Top Performers</span>
              <span className="text-[9px] text-white/20 ml-auto">{displayPosts.length} posts</span>
            </div>

            <div className="flex flex-col gap-2">
              {displayPosts.map((post, i) => {
                const platform = PLATFORM_CONFIG[post.platform]
                const PlatformIcon = platform.icon
                const isGenerating = generatingPostId === post.metaPostId && streaming

                return (
                  <motion.div
                    key={post.metaPostId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3 group hover:border-white/[0.1] transition-all"
                  >
                    {/* Post header */}
                    <div className="flex items-start gap-2 mb-2">
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: `${platform.color}15` }}
                      >
                        <PlatformIcon size={12} style={{ color: platform.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white/60 leading-relaxed line-clamp-2">
                          {post.message || 'No caption'}
                        </p>
                      </div>
                      {/* Rank badge */}
                      <div className="w-5 h-5 rounded-md bg-white/[0.06] flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-white/30">#{i + 1}</span>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-1 text-[10px] text-white/30">
                        <Heart size={10} className="text-rose-400/60" />
                        {formatNumber(post.likes)}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-white/30">
                        <MessageCircle size={10} className="text-blue-400/60" />
                        {formatNumber(post.comments)}
                      </div>
                      {post.shares > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-white/30">
                          <Share2 size={10} className="text-green-400/60" />
                          {formatNumber(post.shares)}
                        </div>
                      )}
                      <span className="text-[9px] text-white/15 ml-auto">
                        {timeAgo(post.publishedAt)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleGenerateSimilar(post)}
                        disabled={streaming}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-30 disabled:cursor-not-allowed text-amber-400/80 text-[10px] font-medium transition-all"
                      >
                        {isGenerating ? (
                          <Loader2 size={10} className="animate-spin" />
                        ) : (
                          <Sparkles size={10} />
                        )}
                        {isGenerating ? 'Generating...' : 'Generate Similar'}
                      </button>
                      {post.permalink && (
                        <a
                          href={post.permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-md glass-hover text-white/15 hover:text-white/40 transition-colors"
                          title="View original post"
                        >
                          <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        {/* Content Gaps */}
        {pillarBalance && (
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <PieChart size={14} className="text-violet-400" />
              <span className="text-xs font-semibold text-white/70">Content Gaps</span>
            </div>

            {/* Current pillar distribution */}
            <div className="mb-3">
              <label className="text-[9px] font-medium text-white/20 uppercase tracking-wider mb-1.5 block">
                Pillar Distribution
              </label>
              <div className="flex flex-col gap-1">
                {pillarBalance.pillars.slice(0, 6).map(p => (
                  <div key={p.pillar} className="flex items-center gap-2">
                    <span className="text-[10px] text-white/40 w-24 truncate capitalize">{p.pillar}</span>
                    <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(p.percentage, 100)}%` }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="h-full rounded-full"
                        style={{ background: p.color }}
                      />
                    </div>
                    <span className="text-[9px] text-white/20 w-8 text-right">{p.percentage}%</span>
                  </div>
                ))}
              </div>
              {pillarBalance.untagged > 0 && (
                <p className="text-[9px] text-white/15 mt-1.5">
                  {pillarBalance.untagged} posts without a pillar tag
                </p>
              )}
            </div>

            {/* Gap analysis */}
            {hasGaps && gaps && (
              <div className="border-t border-white/[0.06] pt-3">
                {gaps.missing.length > 0 && (
                  <div className="mb-2">
                    <label className="text-[9px] font-medium text-red-400/60 uppercase tracking-wider mb-1 block flex items-center gap-1">
                      <AlertCircle size={8} />
                      Missing Pillars
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {gaps.missing.map(p => (
                        <span key={p} className="px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/15 text-[9px] text-red-400/60 capitalize">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {gaps.underperforming.length > 0 && (
                  <div className="mb-2">
                    <label className="text-[9px] font-medium text-amber-400/60 uppercase tracking-wider mb-1 block flex items-center gap-1">
                      <ArrowUpRight size={8} />
                      Needs More Content
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {gaps.underperforming.map(p => (
                        <span key={p.pillar} className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/15 text-[9px] text-amber-400/60 capitalize">
                          {p.pillar} ({p.percentage}%)
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleGenerateFromGaps(gaps)}
                  disabled={streaming}
                  className="w-full mt-2 py-2 rounded-lg bg-gradient-to-r from-violet-500/80 to-purple-500/80 hover:from-violet-600/80 hover:to-purple-600/80 disabled:opacity-30 disabled:cursor-not-allowed text-white text-[11px] font-medium flex items-center justify-center gap-2 transition-all"
                >
                  {generatingGaps && streaming ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Zap size={12} />
                  )}
                  {generatingGaps && streaming ? 'Generating...' : 'Fill Content Gaps'}
                </button>
              </div>
            )}

            {!hasGaps && pillarBalance.pillars.length > 0 && (
              <div className="border-t border-white/[0.06] pt-3 text-center">
                <div className="flex items-center justify-center gap-1.5 text-emerald-400/60">
                  <Check size={12} />
                  <span className="text-[10px] font-medium">Content pillars are well balanced</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Engagement insights */}
        {analytics && analytics.combined.totalPosts > 0 && (
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={14} className="text-cyan-400" />
              <span className="text-xs font-semibold text-white/70">Engagement Breakdown</span>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Likes', value: analytics.combined.totalLikes, icon: Heart, color: '#f43f5e' },
                { label: 'Comments', value: analytics.combined.totalComments, icon: MessageCircle, color: '#3b82f6' },
                { label: 'Shares', value: analytics.combined.totalShares, icon: Share2, color: '#22c55e' },
              ].map(metric => {
                const pct = analytics.combined.totalEngagement > 0
                  ? (metric.value / analytics.combined.totalEngagement) * 100
                  : 0
                const Icon = metric.icon
                return (
                  <div key={metric.label} className="flex items-center gap-2.5">
                    <Icon size={12} style={{ color: metric.color }} className="shrink-0 opacity-60" />
                    <span className="text-[10px] text-white/40 w-16">{metric.label}</span>
                    <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: metric.color }}
                      />
                    </div>
                    <span className="text-[10px] text-white/30 w-12 text-right">{formatNumber(metric.value)}</span>
                  </div>
                )
              })}
            </div>

            {/* Platform comparison */}
            {analytics.facebook.posts.length > 0 && analytics.instagram.posts.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/[0.06]">
                <label className="text-[9px] font-medium text-white/20 uppercase tracking-wider mb-1.5 block">
                  Platform Performance
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/[0.03] rounded-lg p-2 text-center">
                    <Facebook size={12} className="mx-auto mb-1" style={{ color: '#1877f2' }} />
                    <div className="text-[10px] font-medium text-white/60">{formatNumber(analytics.facebook.totalEngagement)}</div>
                    <div className="text-[8px] text-white/20">{analytics.facebook.posts.length} posts / avg {analytics.facebook.avgEngagement}</div>
                  </div>
                  <div className="bg-white/[0.03] rounded-lg p-2 text-center">
                    <Instagram size={12} className="mx-auto mb-1" style={{ color: '#e4405f' }} />
                    <div className="text-[10px] font-medium text-white/60">{formatNumber(analytics.instagram.totalEngagement)}</div>
                    <div className="text-[8px] text-white/20">{analytics.instagram.posts.length} posts / avg {analytics.instagram.avgEngagement}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* ── Right Panel: AI Results ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex-1 min-w-0 overflow-y-auto scroll-area"
      >
        {!result && !streaming ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-xs">
              <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center mx-auto mb-5">
                <Lightbulb size={32} className="text-white/[0.06]" />
              </div>
              <h3 className="text-sm font-semibold text-white/25 mb-2">Smart Content Suggestions</h3>
              <p className="text-xs text-white/15 leading-relaxed">
                Click "Generate Similar" on a top performer to create new content inspired by what works, or "Fill Content Gaps" to cover underrepresented pillars.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Result header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  streaming ? 'bg-amber-500/15' : 'bg-emerald-500/15'
                }`}>
                  {streaming ? (
                    <Loader2 size={18} className="animate-spin text-amber-400" />
                  ) : (
                    <Check size={18} className="text-emerald-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {generatingGaps ? 'Content Gap Suggestions' : 'Similar Content'}
                  </h3>
                  <p className="text-[10px] text-white/25 max-w-[300px] truncate">
                    {streaming ? 'Generating...' : resultLabel}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {!streaming && result && (
                  <button
                    onClick={() => copyText(result, -1)}
                    className="p-2 rounded-lg glass-hover text-white/25 hover:text-white/50 transition-colors"
                    title="Copy all"
                  >
                    {copiedIdx === -1 ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                )}
                {(result || streaming) && (
                  <button
                    onClick={handleReset}
                    className="p-2 rounded-lg glass-hover text-white/25 hover:text-white/50 transition-colors"
                    title="Clear"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
              </div>
            </motion.div>

            {/* Streaming raw output */}
            {streaming && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Loader2 size={14} className="animate-spin text-amber-400" />
                  <span className="text-xs text-white/30">Generating suggestions...</span>
                </div>
                <div className="text-sm text-white/60 whitespace-pre-wrap leading-relaxed">{result}</div>
                <div className="mt-3 h-0.5 w-10 bg-amber-500/40 animate-pulse rounded-full" />
                <div ref={resultEndRef} />
              </motion.div>
            )}

            {/* Parsed result sections */}
            {!streaming && result && (
              <AnimatePresence>
                {(() => {
                  const sections = parseSections(result)
                  if (sections.length === 0) {
                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass rounded-xl p-5"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold text-white">Result</span>
                          <button
                            onClick={() => copyText(result, 0)}
                            className="p-1.5 rounded-lg glass-hover text-white/30 hover:text-white/60 transition-colors"
                          >
                            {copiedIdx === 0 ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                          </button>
                        </div>
                        <div className="text-sm text-white/55 whitespace-pre-wrap leading-relaxed">{result}</div>
                      </motion.div>
                    )
                  }

                  return sections.map((section, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="glass rounded-xl p-5"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-amber-500/15 flex items-center justify-center">
                            <Target size={12} className="text-amber-400/70" />
                          </div>
                          <span className="text-sm font-semibold text-white">{section.title || `Section ${i + 1}`}</span>
                        </div>
                        <button
                          onClick={() => copyText(section.content, i)}
                          className="p-1.5 rounded-lg glass-hover text-white/30 hover:text-white/60 transition-colors"
                        >
                          {copiedIdx === i ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        </button>
                      </div>
                      <div className="text-sm text-white/55 whitespace-pre-wrap leading-relaxed">{section.content}</div>
                    </motion.div>
                  ))
                })()}
              </AnimatePresence>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}
