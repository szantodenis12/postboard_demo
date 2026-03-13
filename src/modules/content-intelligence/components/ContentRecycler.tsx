import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Recycle, Loader2, AlertCircle, RefreshCw, Heart, MessageCircle, Share2,
  Facebook, Instagram, Linkedin, Copy, Check, Calendar, Clock,
  Sparkles, ArrowRightLeft, BarChart3, Image, Film, FileText,
  Layers, Sun, ChevronDown, ChevronUp, X, Zap,
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

interface RecyclablePost extends PostMetric {
  recycleScore: number
  daysSincePosted: number
  engagementRate: number
  isEvergreen: boolean
  bestDay: string
  bestHour: number
}

type RecycleStrategy =
  | 'refresh-angle'
  | 'update-data'
  | 'format-change'
  | 'platform-swap'
  | 'seasonal-adaptation'

interface RecycledVariant {
  caption: string
  hashtags: string
  suggestedFormat: string
  suggestedPlatform: string
  whatChanged: string
}

// ── Constants ────────────────────────────────────────────
const PLATFORM_CONFIG = {
  facebook: { icon: Facebook, color: '#1877f2', label: 'Facebook' },
  instagram: { icon: Instagram, color: '#e4405f', label: 'Instagram' },
  linkedin: { icon: Linkedin, color: '#0a66c2', label: 'LinkedIn' },
} as const

const STRATEGIES: { id: RecycleStrategy; label: string; icon: typeof Sparkles; desc: string }[] = [
  { id: 'refresh-angle', label: 'Perspectivă nouă', icon: Sparkles, desc: 'Same topic, different hook' },
  { id: 'update-data', label: 'Actualizare date', icon: BarChart3, desc: 'Update stats & numbers' },
  { id: 'format-change', label: 'Schimbare format', icon: Layers, desc: 'Text → carousel, image → reel' },
  { id: 'platform-swap', label: 'Altă platformă', icon: ArrowRightLeft, desc: 'Adapt for a different platform' },
  { id: 'seasonal-adaptation', label: 'Adaptare sezon', icon: Sun, desc: 'Match current season/trends' },
]

const FORMAT_OPTIONS = [
  { id: 'text', label: 'Text', icon: FileText },
  { id: 'single-image', label: 'Image', icon: Image },
  { id: 'carousel', label: 'Carousel', icon: Layers },
  { id: 'reel', label: 'Reel', icon: Film },
]

const DAY_NAMES = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă']
const SEASON_MAP: Record<number, string> = {
  0: 'iarnă', 1: 'iarnă', 2: 'primăvară', 3: 'primăvară',
  4: 'primăvară', 5: 'vară', 6: 'vară', 7: 'vară',
  8: 'toamnă', 9: 'toamnă', 10: 'toamnă', 11: 'iarnă',
}

// ── Helpers ──────────────────────────────────────────────
function truncate(str: string, len: number) {
  if (!str) return ''
  return str.length > len ? str.slice(0, len) + '...' : str
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function daysAgo(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

function relativeTime(days: number): string {
  if (days === 0) return 'Astăzi'
  if (days === 1) return 'Ieri'
  if (days < 7) return `acum ${days} zile`
  if (days < 30) return `acum ${Math.floor(days / 7)} săpt.`
  if (days < 365) return `acum ${Math.floor(days / 30)} luni`
  return `acum ${Math.floor(days / 365)} ani`
}

function getCurrentSeason(): string {
  return SEASON_MAP[new Date().getMonth()]
}

function isTimeSensitive(message: string): boolean {
  if (!message) return false
  const lower = message.toLowerCase()
  const timeSensitivePatterns = [
    // Romanian date/event patterns
    /\b\d{1,2}\s+(ianuarie|februarie|martie|aprilie|mai|iunie|iulie|august|septembrie|octombrie|noiembrie|decembrie)\b/,
    /\b(azi|mâine|astăzi|săptămâna aceasta|luna aceasta|weekendul acesta)\b/,
    /\b(black friday|cyber monday|crăciun|paște|revelion|1 decembrie|8 martie|ziua (?:mamei|tatălui|copilului|îndrăgostiților))\b/i,
    // English date/event patterns
    /\b(today|tomorrow|this week|this month|this weekend)\b/i,
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/i,
    /\b(christmas|easter|new year|valentine|halloween|black friday)\b/i,
    // Time-specific: dates like 12.03.2026
    /\b\d{1,2}\.\d{1,2}\.\d{4}\b/,
    // Flash sale, limited, urgent language
    /\b(ofertă limitată|doar azi|ultimele|promoție|reducere \d+%)\b/i,
    /\b(flash sale|limited time|limited offer|ends today)\b/i,
  ]
  return timeSensitivePatterns.some(p => p.test(lower))
}

function isEducational(message: string): boolean {
  if (!message) return false
  const lower = message.toLowerCase()
  const eduPatterns = [
    /\b(sfat|sfaturi|ghid|cum să|de ce|ce este|beneficii|avantaje|trucuri|tips)\b/i,
    /\b(știai că|ai știut|important|atenție|greșeli|mit|mituri)\b/i,
    /\b(how to|tips|guide|benefits|advantages|did you know|mistakes)\b/i,
    /\d+\s+(sfaturi|motive|pași|moduri|metode|beneficii|trucuri)/i,
    /^\d+\./m, // numbered lists
    /[✅✓•→]/,
  ]
  return eduPatterns.some(p => p.test(lower))
}

function computeRecycleScore(post: PostMetric, avgEngagement: number): number {
  const days = daysAgo(post.publishedAt)
  const hasContent = (post.message?.length || 0) > 30

  // Engagement factor (0-35 pts): higher than average = higher score
  const engRatio = avgEngagement > 0 ? post.engagement / avgEngagement : 1
  const engScore = Math.min(35, Math.round(engRatio * 20))

  // Age factor (0-25 pts): older posts are more due for recycling
  let ageScore = 0
  if (days > 180) ageScore = 25
  else if (days > 120) ageScore = 22
  else if (days > 90) ageScore = 18
  else if (days > 60) ageScore = 14
  else if (days > 30) ageScore = 8
  else ageScore = 2

  // Evergreen factor (0-25 pts): educational/informational content is more recyclable
  const edu = isEducational(post.message) ? 20 : 5
  const timePenalty = isTimeSensitive(post.message) ? -15 : 0
  const evergreenScore = Math.max(0, edu + timePenalty + 5)

  // Content quality (0-15 pts): has decent content length
  const qualityScore = hasContent ? 15 : 3

  return Math.min(100, engScore + ageScore + evergreenScore + qualityScore)
}

// ── Circular Progress ────────────────────────────────────
function CircularScore({ score, size = 44 }: { score: number; size?: number }) {
  const radius = (size - 6) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const getColor = () => {
    if (score >= 75) return '#22c55e'
    if (score >= 50) return '#84cc16'
    if (score >= 30) return '#eab308'
    return '#ef4444'
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={3}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-bold" style={{ color: getColor() }}>
          {score}
        </span>
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────
export function ContentRecycler({ clientId }: { clientId: string }) {
  const { stream, streaming, abort } = useAIStream()

  // Data
  const [analytics, setAnalytics] = useState<ClientAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Selection
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set())
  const [selectedStrategies, setSelectedStrategies] = useState<Set<RecycleStrategy>>(new Set(['refresh-angle']))
  const [expandedPost, setExpandedPost] = useState<string | null>(null)

  // AI generation
  const [result, setResult] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generationDone, setGenerationDone] = useState(false)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const resultRef = useRef('')
  const resultEndRef = useRef<HTMLDivElement>(null)

  // ── Fetch analytics ──
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/analytics/${clientId}`)
      const json = await res.json()
      if (json.data) {
        setAnalytics(json.data)
      } else {
        setAnalytics(null)
      }
    } catch {
      setError('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    fetchData()
    setSelectedPosts(new Set())
    setResult('')
    setGenerating(false)
    setGenerationDone(false)
    resultRef.current = ''
  }, [fetchData])

  useEffect(() => {
    if (streaming) resultEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [result, streaming])

  // ── Build recyclable posts ──
  const recyclablePosts: RecyclablePost[] = useMemo(() => {
    if (!analytics) return []

    const allPosts = [
      ...(analytics.facebook?.posts || []),
      ...(analytics.instagram?.posts || []),
    ]
    const avg = analytics.combined?.avgEngagement || 1

    return allPosts
      .filter(p => p.message && p.message.length > 20) // skip empty/minimal posts
      .map(post => {
        const days = daysAgo(post.publishedAt)
        const totalReach = post.likes + post.comments + post.shares
        const pubDate = new Date(post.publishedAt)

        return {
          ...post,
          recycleScore: computeRecycleScore(post, avg),
          daysSincePosted: days,
          engagementRate: totalReach > 0 ? parseFloat(((post.comments + post.shares) / totalReach * 100).toFixed(1)) : 0,
          isEvergreen: isEducational(post.message) && !isTimeSensitive(post.message),
          bestDay: DAY_NAMES[pubDate.getDay()],
          bestHour: pubDate.getHours(),
        }
      })
      .sort((a, b) => b.recycleScore - a.recycleScore)
  }, [analytics])

  // ── Selection handlers ──
  const togglePost = (id: string) => {
    setSelectedPosts(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < 5) {
        next.add(id)
      }
      return next
    })
  }

  const toggleStrategy = (id: RecycleStrategy) => {
    setSelectedStrategies(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        if (next.size > 1) next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // ── Generate recycled content ──
  const handleRecycle = () => {
    if (streaming || selectedPosts.size === 0) return

    const selected = recyclablePosts.filter(p => selectedPosts.has(p.metaPostId))
    const strategies = Array.from(selectedStrategies)
    const season = getCurrentSeason()
    const today = new Date().toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })

    setGenerating(true)
    setGenerationDone(false)
    resultRef.current = ''
    setResult('')

    const postsContext = selected.map((post, i) => `
--- POSTARE ${i + 1} ---
Platformă: ${post.platform}
Data publicării: ${new Date(post.publishedAt).toLocaleDateString('ro-RO')} (acum ${post.daysSincePosted} zile)
Engagement: ${post.likes} like-uri, ${post.comments} comentarii, ${post.shares} share-uri
Scor reciclare: ${post.recycleScore}/100
Conținut evergreen: ${post.isEvergreen ? 'Da' : 'Nu'}
Cea mai bună zi: ${post.bestDay} la ora ${post.bestHour}:00

Caption original:
${post.message}
`).join('\n')

    const strategyDescriptions = strategies.map(s => {
      switch (s) {
        case 'refresh-angle': return 'PERSPECTIVĂ NOUĂ: Păstrează subiectul dar schimbă hook-ul, unghiul sau perspectiva'
        case 'update-data': return 'ACTUALIZARE DATE: Dacă postarea menționează cifre/statistici, actualizează-le'
        case 'format-change': return 'SCHIMBARE FORMAT: Transformă un post text în prompt de carusel, sau o imagine singulară într-un script de reel'
        case 'platform-swap': return 'ALTĂ PLATFORMĂ: Adaptează conținutul pentru o altă platformă (Facebook ↔ Instagram ↔ LinkedIn)'
        case 'seasonal-adaptation': return `ADAPTARE SEZON: Adaptează conținutul pentru sezonul curent (${season}) și trendurile actuale`
      }
    }).join('\n')

    const prompt = `Ești un expert în content marketing. Analizează aceste postări performante și generează variante reciclate.

DATA CURENTĂ: ${today}
SEZON: ${season}

POSTĂRI DE RECICLAT:
${postsContext}

STRATEGII DE RECICLARE SELECTATE:
${strategyDescriptions}

INSTRUCȚIUNI:
Pentru FIECARE postare de mai sus, generează 2-3 variante reciclate. Pentru fiecare variantă:

1. Scrie un **caption complet** (nu schelet, nu placeholder) — gata de publicat
2. Include **hashtag-uri relevante** (5-10 pentru Instagram, 2-3 pentru Facebook/LinkedIn)
3. Sugerează **format** (imagine, carusel, reel, text) și **platformă**
4. Explică pe scurt **ce s-a schimbat** față de original
5. Sugerează **cea mai bună zi și oră** pentru repostare, bazat pe performanța originalului

REGULI:
- Scrie totul în ROMÂNĂ cu diacritice corecte (ă, â, î, ș, ț)
- Tonul trebuie să fie natural, nu robotic
- Fiecare variantă trebuie să fie suficient de diferită pentru a nu părea duplicat
- Folosește emoji-uri moderat (1-3 per caption, nu exagera)
- Include un CTA clar în fiecare variantă

Formatează output-ul clar cu headere pentru fiecare postare și variantă.
Folosește "## Postare X" pentru fiecare postare originală și "### Varianta X.Y" pentru fiecare reciclare.
La final adaugă o secțiune "## Calendar de Reciclare" cu sugestii de programare.`

    stream(
      '/api/intelligence/repurpose',
      {
        clientId,
        caption: prompt,
        platform: 'facebook',
      },
      (chunk) => {
        resultRef.current += chunk
        setResult(resultRef.current)
      },
      () => {
        setGenerating(false)
        setGenerationDone(true)
      },
      () => {
        setGenerating(false)
      },
    )
  }

  const handleReset = () => {
    abort()
    setResult('')
    setGenerating(false)
    setGenerationDone(false)
    resultRef.current = ''
  }

  const copyText = (text: string, idx: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  // ── Parse result into sections ──
  const parseSections = (text: string) => {
    const sections: { title: string; content: string }[] = []
    const lines = text.split('\n')
    let current: { title: string; lines: string[] } | null = null

    for (const line of lines) {
      const h2Match = line.match(/^##\s+(.+)/)
      const h3Match = line.match(/^###\s+(.+)/)
      if (h2Match || h3Match) {
        if (current) sections.push({ title: current.title, content: current.lines.join('\n').trim() })
        current = { title: (h2Match || h3Match)![1], lines: [] }
        continue
      }
      if (current) current.lines.push(line)
      else if (line.trim()) {
        current = { title: '', lines: [line] }
      }
    }
    if (current) sections.push({ title: current.title, content: current.lines.join('\n').trim() })
    return sections
  }

  // ── Stats from selected ──
  const selectionStats = useMemo(() => {
    const selected = recyclablePosts.filter(p => selectedPosts.has(p.metaPostId))
    return {
      count: selected.length,
      avgScore: selected.length > 0
        ? Math.round(selected.reduce((s, p) => s + p.recycleScore, 0) / selected.length)
        : 0,
      platforms: [...new Set(selected.map(p => p.platform))],
    }
  }, [recyclablePosts, selectedPosts])

  // ── Loading state ──
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <Loader2 size={24} className="animate-spin text-emerald-400/60 mx-auto mb-3" />
          <p className="text-sm text-white/30">Se încarcă datele analitice...</p>
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
          <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} className="text-emerald-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No Analytics Data</h3>
          <p className="text-sm text-white/40 mb-4">
            Connect Meta and fetch analytics data first. The Content Recycler needs real engagement data to identify recyclable posts.
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
      {/* ── Left Panel: Discovery + Selection ── */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-[420px] shrink-0 flex flex-col gap-3 overflow-y-auto scroll-area"
      >
        {/* Header */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center">
                <Recycle size={18} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Content Recycler</h3>
                <p className="text-[10px] text-white/25">Recycle top-performing content</p>
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
                <div className="text-xs font-bold text-emerald-400/80">{recyclablePosts.length}</div>
                <div className="text-[9px] text-white/25">Recyclable</div>
              </div>
              <div className="bg-white/[0.04] rounded-lg p-2.5 text-center">
                <div className="text-xs font-bold text-white/80">
                  {recyclablePosts.filter(p => p.recycleScore >= 60).length}
                </div>
                <div className="text-[9px] text-white/25">High Score</div>
              </div>
              <div className="bg-white/[0.04] rounded-lg p-2.5 text-center">
                <div className="text-xs font-bold text-white/80">
                  {recyclablePosts.filter(p => p.isEvergreen).length}
                </div>
                <div className="text-[9px] text-white/25">Evergreen</div>
              </div>
            </div>
          )}

          {analytics?.lastFetched && (
            <p className="text-[9px] text-white/15 mt-2 text-center">
              Data from {new Date(analytics.lastFetched).toLocaleDateString('ro-RO')} | Period: {analytics.period}
            </p>
          )}
        </div>

        {/* Selection info */}
        <AnimatePresence>
          {selectedPosts.size > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="glass rounded-xl p-3 border border-emerald-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold text-emerald-400">
                    {selectionStats.count}/5 selected | Avg score: {selectionStats.avgScore}
                  </span>
                  <button
                    onClick={() => setSelectedPosts(new Set())}
                    className="text-[9px] text-white/25 hover:text-white/50 transition-colors"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  {selectionStats.platforms.map(p => {
                    const cfg = PLATFORM_CONFIG[p]
                    const Icon = cfg.icon
                    return (
                      <span
                        key={p}
                        className="px-2 py-0.5 rounded-md text-[9px] font-medium"
                        style={{ background: `${cfg.color}15`, color: cfg.color }}
                      >
                        <Icon size={9} className="inline mr-1" />
                        {cfg.label}
                      </span>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recyclable Post Cards */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Recycle size={14} className="text-emerald-400" />
            <span className="text-xs font-semibold text-white/70">Recyclable Posts</span>
            <span className="text-[9px] text-white/20 ml-auto">{recyclablePosts.length} posts</span>
          </div>

          {recyclablePosts.length === 0 ? (
            <p className="text-xs text-white/25 text-center py-4">
              No posts with enough content to recycle.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {recyclablePosts.slice(0, 15).map((post, i) => {
                const platform = PLATFORM_CONFIG[post.platform]
                const PlatformIcon = platform.icon
                const isSelected = selectedPosts.has(post.metaPostId)
                const isExpanded = expandedPost === post.metaPostId

                return (
                  <motion.div
                    key={post.metaPostId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`
                      bg-white/[0.03] border rounded-lg p-3 group transition-all cursor-pointer
                      ${isSelected
                        ? 'border-emerald-500/30 bg-emerald-500/[0.05]'
                        : 'border-white/[0.06] hover:border-white/[0.1]'
                      }
                    `}
                    onClick={() => togglePost(post.metaPostId)}
                  >
                    {/* Top row: platform + score + checkbox */}
                    <div className="flex items-start gap-2.5 mb-2">
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

                      <CircularScore score={post.recycleScore} size={36} />

                      {/* Checkbox */}
                      <div
                        className={`
                          w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-all
                          ${isSelected
                            ? 'bg-emerald-500/30 border border-emerald-500/50'
                            : 'bg-white/[0.04] border border-white/[0.08]'
                          }
                        `}
                      >
                        {isSelected && <Check size={10} className="text-emerald-400" />}
                      </div>
                    </div>

                    {/* Stats + badges row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center gap-1 text-[10px] text-white/30">
                          <Heart size={9} className="text-rose-400/60" />
                          {formatNumber(post.likes)}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-white/30">
                          <MessageCircle size={9} className="text-blue-400/60" />
                          {formatNumber(post.comments)}
                        </div>
                        {post.shares > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-white/30">
                            <Share2 size={9} className="text-green-400/60" />
                            {formatNumber(post.shares)}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 ml-auto">
                        {post.isEvergreen && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-medium bg-emerald-500/15 text-emerald-400/70 border border-emerald-500/10">
                            Evergreen
                          </span>
                        )}
                        <span className="text-[9px] text-white/15">
                          {relativeTime(post.daysSincePosted)}
                        </span>
                      </div>
                    </div>

                    {/* Expandable: best time + engagement rate */}
                    <div
                      className="mt-1.5 flex items-center justify-between"
                      onClick={(e) => { e.stopPropagation(); setExpandedPost(isExpanded ? null : post.metaPostId) }}
                    >
                      <button className="flex items-center gap-1 text-[9px] text-white/20 hover:text-white/40 transition-colors">
                        {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                        {isExpanded ? 'Less details' : 'More details'}
                      </button>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 pt-2 border-t border-white/[0.06] grid grid-cols-2 gap-2">
                            <div className="bg-white/[0.03] rounded-md p-2">
                              <div className="flex items-center gap-1 text-[9px] text-white/25 mb-0.5">
                                <Calendar size={8} />
                                Best day
                              </div>
                              <div className="text-[10px] text-white/50 font-medium">{post.bestDay}</div>
                            </div>
                            <div className="bg-white/[0.03] rounded-md p-2">
                              <div className="flex items-center gap-1 text-[9px] text-white/25 mb-0.5">
                                <Clock size={8} />
                                Best time
                              </div>
                              <div className="text-[10px] text-white/50 font-medium">{post.bestHour}:00</div>
                            </div>
                            <div className="bg-white/[0.03] rounded-md p-2">
                              <div className="flex items-center gap-1 text-[9px] text-white/25 mb-0.5">
                                <BarChart3 size={8} />
                                Eng. rate
                              </div>
                              <div className="text-[10px] text-white/50 font-medium">{post.engagementRate}%</div>
                            </div>
                            <div className="bg-white/[0.03] rounded-md p-2">
                              <div className="flex items-center gap-1 text-[9px] text-white/25 mb-0.5">
                                <Zap size={8} />
                                Total eng.
                              </div>
                              <div className="text-[10px] text-white/50 font-medium">{formatNumber(post.engagement)}</div>
                            </div>
                          </div>
                          {post.permalink && (
                            <a
                              href={post.permalink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="mt-2 flex items-center gap-1 text-[9px] text-white/20 hover:text-white/40 transition-colors"
                            >
                              View original post
                            </a>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Right Panel: Strategy + AI Results ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex-1 min-w-0 overflow-y-auto scroll-area flex flex-col gap-3"
      >
        {/* Strategy Selector */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-emerald-400" />
            <span className="text-xs font-semibold text-white/70">Recycling Strategy</span>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {STRATEGIES.map(s => {
              const Icon = s.icon
              const active = selectedStrategies.has(s.id)
              return (
                <button
                  key={s.id}
                  onClick={() => toggleStrategy(s.id)}
                  className={`
                    px-3 py-1.5 rounded-lg text-[10px] font-medium flex items-center gap-1.5 transition-all
                    ${active
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-white/[0.04] text-white/30 border border-white/[0.06] hover:border-white/[0.1]'
                    }
                  `}
                  title={s.desc}
                >
                  <Icon size={10} />
                  {s.label}
                </button>
              )
            })}
          </div>

          {/* Recycle button */}
          <button
            onClick={handleRecycle}
            disabled={streaming || selectedPosts.size === 0}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-emerald-600/80 to-green-600/80 hover:from-emerald-600 hover:to-green-600 disabled:opacity-30 disabled:cursor-not-allowed text-white text-[11px] font-semibold flex items-center justify-center gap-2 transition-all"
          >
            {streaming ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Recycle size={14} />
            )}
            {streaming
              ? 'Se reciclează...'
              : selectedPosts.size === 0
                ? 'Selectează postări pentru reciclare'
                : `Reciclează ${selectedPosts.size} ${selectedPosts.size === 1 ? 'postare' : 'postări'}`
            }
          </button>

          {selectedPosts.size > 0 && !streaming && (
            <p className="text-[9px] text-white/15 mt-2 text-center">
              {Array.from(selectedStrategies).length} {Array.from(selectedStrategies).length === 1 ? 'strategy' : 'strategies'} selected | ~{selectedPosts.size * 2}-{selectedPosts.size * 3} variants will be generated
            </p>
          )}
        </div>

        {/* AI Results */}
        {!result && !streaming ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-xs">
              <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center mx-auto mb-5">
                <Recycle size={32} className="text-white/[0.06]" />
              </div>
              <h3 className="text-sm font-semibold text-white/25 mb-2">Smart Content Recycling</h3>
              <p className="text-xs text-white/15 leading-relaxed">
                Select posts from the recyclable list on the left, choose your recycling strategies, and click "Recycle" to generate refreshed content variants.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-left">
                <div className="bg-white/[0.03] rounded-lg p-2.5">
                  <div className="text-[9px] text-emerald-400/60 font-medium mb-0.5">High Score</div>
                  <div className="text-[9px] text-white/20">60+ means great candidate for recycling</div>
                </div>
                <div className="bg-white/[0.03] rounded-lg p-2.5">
                  <div className="text-[9px] text-emerald-400/60 font-medium mb-0.5">Evergreen</div>
                  <div className="text-[9px] text-white/20">Educational content that stays relevant</div>
                </div>
                <div className="bg-white/[0.03] rounded-lg p-2.5">
                  <div className="text-[9px] text-emerald-400/60 font-medium mb-0.5">Age Bonus</div>
                  <div className="text-[9px] text-white/20">Older posts ({'>'}60d) score higher</div>
                </div>
                <div className="bg-white/[0.03] rounded-lg p-2.5">
                  <div className="text-[9px] text-emerald-400/60 font-medium mb-0.5">Best Time</div>
                  <div className="text-[9px] text-white/20">Repost when original performed best</div>
                </div>
              </div>
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
                  streaming ? 'bg-emerald-500/15' : 'bg-emerald-500/20'
                }`}>
                  {streaming ? (
                    <Loader2 size={18} className="animate-spin text-emerald-400" />
                  ) : (
                    <Check size={18} className="text-emerald-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Recycled Content
                  </h3>
                  <p className="text-[10px] text-white/25">
                    {streaming
                      ? 'Generating recycled variants...'
                      : `${selectedPosts.size} posts recycled with ${Array.from(selectedStrategies).length} strategies`
                    }
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
                    title="Reset"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </motion.div>

            {/* Streaming output */}
            {streaming && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Loader2 size={14} className="animate-spin text-emerald-400" />
                  <span className="text-xs text-white/30">Se generează variante reciclate...</span>
                </div>
                <div className="text-sm text-white/60 whitespace-pre-wrap leading-relaxed">{result}</div>
                <div className="mt-3 h-0.5 w-10 bg-emerald-500/40 animate-pulse rounded-full" />
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

                  return sections.map((section, i) => {
                    const isCalendar = section.title.toLowerCase().includes('calendar')
                    const isVariant = section.title.toLowerCase().includes('variant')

                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`glass rounded-xl p-5 ${isCalendar ? 'border border-emerald-500/20' : ''}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                              isCalendar
                                ? 'bg-emerald-500/15'
                                : isVariant
                                  ? 'bg-green-500/15'
                                  : 'bg-emerald-500/10'
                            }`}>
                              {isCalendar ? (
                                <Calendar size={13} className="text-emerald-400/80" />
                              ) : isVariant ? (
                                <Recycle size={13} className="text-green-400/80" />
                              ) : (
                                <FileText size={13} className="text-emerald-400/60" />
                              )}
                            </div>
                            <span className="text-sm font-semibold text-white">
                              {section.title || `Section ${i + 1}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => copyText(section.content, i)}
                              className="p-1.5 rounded-lg glass-hover text-white/30 hover:text-white/60 transition-colors"
                              title="Copy section"
                            >
                              {copiedIdx === i ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                            </button>
                          </div>
                        </div>
                        <div className="text-sm text-white/55 whitespace-pre-wrap leading-relaxed">
                          {section.content}
                        </div>
                      </motion.div>
                    )
                  })
                })()}
              </AnimatePresence>
            )}

            {/* Recycling calendar hint */}
            {generationDone && !streaming && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass rounded-xl p-4 border border-emerald-500/10"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={14} className="text-emerald-400/60" />
                  <span className="text-xs font-semibold text-white/60">Recycling Timing</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(() => {
                    const selected = recyclablePosts.filter(p => selectedPosts.has(p.metaPostId))
                    const dayFreq: Record<string, number> = {}
                    const hourFreq: Record<number, number> = {}
                    selected.forEach(p => {
                      dayFreq[p.bestDay] = (dayFreq[p.bestDay] || 0) + 1
                      hourFreq[p.bestHour] = (hourFreq[p.bestHour] || 0) + 1
                    })
                    const topDay = Object.entries(dayFreq).sort((a, b) => b[1] - a[1])[0]
                    const topHour = Object.entries(hourFreq).sort((a, b) => b[1] - a[1])[0]

                    return (
                      <>
                        <div className="bg-white/[0.03] rounded-lg p-2.5">
                          <div className="text-[9px] text-white/25 mb-0.5">Best day to repost</div>
                          <div className="text-xs text-white/60 font-medium">
                            {topDay ? topDay[0] : 'N/A'}
                          </div>
                        </div>
                        <div className="bg-white/[0.03] rounded-lg p-2.5">
                          <div className="text-[9px] text-white/25 mb-0.5">Best time to repost</div>
                          <div className="text-xs text-white/60 font-medium">
                            {topHour ? `${topHour[0]}:00` : 'N/A'}
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </div>
                <p className="text-[9px] text-white/15 mt-2 text-center">
                  Based on original posting times of selected posts
                </p>
              </motion.div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}
