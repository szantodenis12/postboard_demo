import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Repeat, Copy, Check, Loader2, RotateCcw, Facebook, Instagram, Linkedin,
  Hash, ChevronDown, Type, Megaphone, Sparkles, Zap, ClipboardList,
  FileText, MessageSquare, Layout, Wand2, AlertCircle,
} from 'lucide-react'
import { useAIStream } from '../hooks/useAI'
import { useApp } from '../../../core/context'
import type { Post } from '../../../core/types'

// ── Platform definitions ──────────────────────────────────
const PLATFORMS = [
  { id: 'facebook', label: 'Facebook', icon: Facebook, color: '#1877f2', bg: 'rgba(24,119,242,0.12)', charLimit: 500, hashtagRange: '0-3' },
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: '#e4405f', bg: 'rgba(228,64,95,0.12)', charLimit: 2200, hashtagRange: '5-15' },
  { id: 'tiktok', label: 'TikTok', icon: Zap, color: '#00f2ea', bg: 'rgba(0,242,234,0.12)', charLimit: 300, hashtagRange: '3-8' },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: '#0a66c2', bg: 'rgba(10,102,194,0.12)', charLimit: 1300, hashtagRange: '0-3' },
  { id: 'stories', label: 'Stories', icon: Layout, color: '#c13584', bg: 'rgba(193,53,132,0.12)', charLimit: 100, hashtagRange: '0' },
] as const

type PlatformId = (typeof PLATFORMS)[number]['id']

const TONE_OPTIONS = [
  { id: 'auto', label: 'Auto', icon: Sparkles },
  { id: 'professional', label: 'Professional', icon: FileText },
  { id: 'casual', label: 'Casual', icon: MessageSquare },
  { id: 'playful', label: 'Playful', icon: Wand2 },
  { id: 'urgent', label: 'Urgent', icon: Megaphone },
] as const

type ToneId = (typeof TONE_OPTIONS)[number]['id']

// ── Types ─────────────────────────────────────────────────
interface Adaptation {
  platform: PlatformId
  caption: string
  hashtags: string[]
  suggestedFormat: string
  cta: string
  charCount: number
}

interface AdaptationResult {
  adaptations: Adaptation[]
}

interface ToneOverrides {
  [platformId: string]: ToneId
}

// ── JSON parser for AI output ─────────────────────────────
function parseAdaptationsFromStream(raw: string): AdaptationResult | null {
  // Strategy 1: Look for ```json block with the structured output
  const jsonBlockMatch = raw.match(/```json\s*\n([\s\S]*?)```/)
  if (jsonBlockMatch) {
    try {
      const parsed = JSON.parse(jsonBlockMatch[1].trim())
      if (parsed.adaptations && Array.isArray(parsed.adaptations)) {
        return validateAdaptations(parsed)
      }
    } catch { /* fall through */ }
  }

  // Strategy 2: Try to find a raw JSON object with "adaptations" key
  const objMatch = raw.match(/\{[\s\S]*"adaptations"\s*:\s*\[[\s\S]*\]\s*\}/)
  if (objMatch) {
    try {
      const parsed = JSON.parse(objMatch[0])
      if (parsed.adaptations && Array.isArray(parsed.adaptations)) {
        return validateAdaptations(parsed)
      }
    } catch { /* fall through */ }
  }

  // Strategy 3: Try to find just the array
  const arrMatch = raw.match(/\[\s*\{[\s\S]*?"platform"[\s\S]*?\}\s*\]/)
  if (arrMatch) {
    try {
      const arr = JSON.parse(arrMatch[0])
      if (Array.isArray(arr) && arr.length > 0) {
        return validateAdaptations({ adaptations: arr })
      }
    } catch { /* fall through */ }
  }

  // Strategy 4: Parse markdown sections (fallback for free-form server output)
  // The server may return ## Facebook, ## Instagram Feed, etc.
  const markdownAdaptations = parseMarkdownSections(raw)
  if (markdownAdaptations.length > 0) {
    return { adaptations: markdownAdaptations }
  }

  return null
}

function parseMarkdownSections(text: string): Adaptation[] {
  const sections: { name: string; lines: string[] }[] = []
  const lines = text.split('\n')
  let current: { name: string; lines: string[] } | null = null

  for (const line of lines) {
    const headerMatch = line.match(/^#{1,3}\s+(?:\d+\.\s*)?(?:\*\*)?(.+?)(?:\*\*)?$/i)
    if (headerMatch) {
      const name = headerMatch[1].trim().replace(/\*\*/g, '')
      // Check if this looks like a platform section header
      const lowerName = name.toLowerCase()
      const isPlatform = ['facebook', 'instagram', 'tiktok', 'linkedin', 'stories'].some(p => lowerName.includes(p))
      if (isPlatform) {
        if (current) sections.push(current)
        current = { name, lines: [] }
        continue
      }
    }
    if (current) current.lines.push(line)
  }
  if (current) sections.push(current)

  const platformMap: Record<string, PlatformId> = {
    facebook: 'facebook',
    'instagram feed': 'instagram',
    'instagram stories': 'stories',
    'instagram reels': 'instagram',
    'ig stories': 'stories',
    'ig reels': 'instagram',
    instagram: 'instagram',
    linkedin: 'linkedin',
    tiktok: 'tiktok',
    stories: 'stories',
  }

  return sections.map(section => {
    const lowerName = section.name.toLowerCase()
    let platformId: PlatformId = 'facebook'
    for (const [key, id] of Object.entries(platformMap)) {
      if (lowerName.includes(key)) { platformId = id; break }
    }
    const content = section.lines.join('\n').trim()
    // Try to extract hashtags from the content
    const hashtagMatches = content.match(/#[\wăâîșțĂÂÎȘȚ]+/g) || []
    const hashtags = hashtagMatches.map(h => h.replace(/^#/, ''))
    // Try to extract CTA
    const ctaMatch = content.match(/(?:CTA|Call to action)[:\s]*(.+)/i)
    const cta = ctaMatch ? ctaMatch[1].trim() : ''

    return {
      platform: platformId,
      caption: content,
      hashtags,
      suggestedFormat: 'post',
      cta,
      charCount: content.length,
    }
  }).filter(a => a.caption.length > 0)
}

function validateAdaptations(data: any): AdaptationResult {
  const validPlatforms = new Set(PLATFORMS.map(p => p.id))
  const adaptations: Adaptation[] = data.adaptations
    .filter((a: any) => a && typeof a === 'object' && a.platform && a.caption)
    .map((a: any) => ({
      platform: validPlatforms.has(a.platform?.toLowerCase()) ? a.platform.toLowerCase() as PlatformId : 'facebook' as PlatformId,
      caption: String(a.caption || ''),
      hashtags: Array.isArray(a.hashtags) ? a.hashtags.map((h: any) => String(h).replace(/^#/, '')) : [],
      suggestedFormat: String(a.suggestedFormat || a.suggested_format || 'post'),
      cta: String(a.cta || ''),
      charCount: typeof a.charCount === 'number' ? a.charCount : String(a.caption || '').length,
    }))
  return { adaptations }
}

// ── Platform char limit indicator ─────────────────────────
function CharLimitBar({ current, limit }: { current: number; limit: number }) {
  const pct = Math.min((current / limit) * 100, 100)
  const over = current > limit
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className={`h-full rounded-full ${over ? 'bg-red-400' : pct > 80 ? 'bg-amber-400' : 'bg-emerald-400'}`}
        />
      </div>
      <span className={`text-[10px] tabular-nums ${over ? 'text-red-400' : 'text-white/30'}`}>
        {current}/{limit}
      </span>
    </div>
  )
}

// ── Post selector dropdown ────────────────────────────────
function PostSelector({
  posts,
  onSelect,
}: {
  posts: Post[]
  onSelect: (post: Post) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const platformIcon = (p: string) => {
    if (p === 'facebook') return Facebook
    if (p === 'instagram') return Instagram
    if (p === 'linkedin') return Linkedin
    return FileText
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white/50 text-left flex items-center justify-between hover:border-white/20 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <ClipboardList size={12} />
          Pick from existing posts ({posts.length})
        </span>
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full left-0 right-0 mt-1 max-h-[240px] overflow-y-auto rounded-xl glass border border-white/10 p-1 scroll-area"
          >
            {posts.length === 0 ? (
              <div className="px-3 py-4 text-xs text-white/20 text-center">No posts available</div>
            ) : (
              posts.slice(0, 50).map(post => {
                const Icon = platformIcon(post.platform)
                return (
                  <button
                    key={post.id}
                    onClick={() => { onSelect(post); setOpen(false) }}
                    className="w-full px-3 py-2 rounded-lg text-left hover:bg-white/5 transition-colors flex items-start gap-2 group"
                  >
                    <Icon size={12} className="text-white/20 mt-0.5 shrink-0 group-hover:text-white/40" />
                    <div className="min-w-0">
                      <div className="text-[11px] text-white/60 line-clamp-2 group-hover:text-white/80">
                        {post.caption.slice(0, 120)}{post.caption.length > 120 ? '...' : ''}
                      </div>
                      <div className="text-[10px] text-white/20 mt-0.5">
                        {post.platform} &middot; {post.date}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main component ────────────────────────────────────────
export function RepurposeEngine({ clientId }: { clientId: string }) {
  const { data } = useApp()

  // Input state
  const [caption, setCaption] = useState('')
  const [sourcePlatform, setSourcePlatform] = useState<PlatformId>('facebook')
  const [hashtags, setHashtags] = useState('')
  const [targetPlatforms, setTargetPlatforms] = useState<Set<PlatformId>>(
    new Set(['facebook', 'instagram', 'tiktok', 'linkedin', 'stories'])
  )
  const [globalTone, setGlobalTone] = useState<ToneId>('auto')
  const [toneOverrides, setToneOverrides] = useState<ToneOverrides>({})
  const [optimizeHashtags, setOptimizeHashtags] = useState(true)
  const [optimizeLength, setOptimizeLength] = useState(true)
  const [adaptCTA, setAdaptCTA] = useState(true)

  // Output state
  const [rawResult, setRawResult] = useState('')
  const [adaptations, setAdaptations] = useState<Adaptation[]>([])
  const [parseError, setParseError] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)

  const rawRef = useRef('')
  const resultEndRef = useRef<HTMLDivElement>(null)
  const { stream, streaming, abort } = useAIStream()

  // Available posts from all clients
  const allPosts = useMemo(() => {
    const client = data.clients.find(c => c.id === clientId)
    if (!client) return [] as Post[]
    return client.posts.filter(p => p.caption && p.caption.trim().length > 0)
  }, [data.clients, clientId])

  // Filter target platforms to exclude source
  const availableTargets = useMemo(
    () => PLATFORMS.filter(p => p.id !== sourcePlatform),
    [sourcePlatform]
  )

  // When source changes, remove it from targets and add it if it was a target
  useEffect(() => {
    setTargetPlatforms(prev => {
      const next = new Set(prev)
      next.delete(sourcePlatform)
      // Ensure at least one target
      if (next.size === 0) {
        const fallback = PLATFORMS.find(p => p.id !== sourcePlatform)
        if (fallback) next.add(fallback.id)
      }
      return next
    })
  }, [sourcePlatform])

  // Auto-scroll while streaming
  useEffect(() => {
    if (streaming) resultEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [rawResult, streaming])

  // Parse result when streaming completes
  useEffect(() => {
    if (!streaming && rawResult) {
      const parsed = parseAdaptationsFromStream(rawResult)
      if (parsed && parsed.adaptations.length > 0) {
        // Filter to only the requested target platforms
        const filtered = parsed.adaptations.filter(a => targetPlatforms.has(a.platform))
        setAdaptations(filtered.length > 0 ? filtered : parsed.adaptations)
        setParseError(false)
      } else {
        setAdaptations([])
        setParseError(true)
      }
    }
  }, [streaming, rawResult, targetPlatforms])

  const toggleTarget = useCallback((id: PlatformId) => {
    setTargetPlatforms(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        if (next.size > 1) next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const setToneForPlatform = useCallback((platformId: string, tone: ToneId) => {
    setToneOverrides(prev => ({ ...prev, [platformId]: tone }))
  }, [])

  const getEffectiveTone = useCallback((platformId: string): ToneId => {
    return toneOverrides[platformId] || globalTone
  }, [toneOverrides, globalTone])

  const handleSelectPost = useCallback((post: Post) => {
    setCaption(post.caption)
    const platformMap: Record<string, PlatformId> = {
      facebook: 'facebook', instagram: 'instagram', linkedin: 'linkedin', tiktok: 'tiktok', stories: 'stories',
    }
    const mapped = platformMap[post.platform]
    if (mapped) setSourcePlatform(mapped)
    if (post.hashtags.length > 0) {
      setHashtags(post.hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' '))
    }
  }, [])

  const handleAdapt = useCallback(() => {
    if (!caption.trim() || targetPlatforms.size === 0) return

    rawRef.current = ''
    setRawResult('')
    setAdaptations([])
    setParseError(false)

    const targets = Array.from(targetPlatforms)
    const toneInstructions = targets.map(tid => {
      const tone = getEffectiveTone(tid)
      return tone !== 'auto' ? `- ${tid}: use ${tone} tone` : null
    }).filter(Boolean).join('\n')

    const platformRules = `
PLATFORM-SPECIFIC RULES (STRICT):
- Instagram: max 2200 chars, 5-15 hashtags, hook-first opening, emoji-friendly, CTA: "Link in bio" or similar. Best as carousel/reel when visual.
- Facebook: ideal 500 chars, 0-3 hashtags, conversational tone, CTA can include direct links. Best as single image or video.
- TikTok: max 300 chars, 3-8 hashtags, hook in first 3 words, trend-aware language, ultra-casual. Best as reel/short video.
- LinkedIn: professional tone, ideal 1300 chars, 0-3 hashtags, industry jargon OK, NO emoji. Best as text post or document.
- Stories: ultra-short 50-100 chars, question or poll format preferred, NO hashtags. Best as story with sticker/poll.`

    const prompt = `You are a senior social media content strategist at a Romanian marketing agency.

TASK: Adapt the following ${sourcePlatform} post for these target platforms: ${targets.join(', ')}.

ORIGINAL POST (${sourcePlatform}):
"""
${caption.trim()}
${hashtags.trim() ? `\nHashtags: ${hashtags.trim()}` : ''}
"""

${platformRules}

${toneInstructions ? `TONE OVERRIDES:\n${toneInstructions}` : ''}

${optimizeHashtags ? 'HASHTAG OPTIMIZATION: Generate platform-optimized hashtags in Romanian. Use relevant, trending Romanian hashtags. Respect each platform\'s hashtag count range.' : 'HASHTAGS: Keep original hashtags where applicable.'}
${optimizeLength ? 'LENGTH OPTIMIZATION: Trim or expand content to match each platform\'s ideal character count. Never exceed the max.' : 'LENGTH: Adapt naturally without strict length constraints.'}
${adaptCTA ? 'CTA ADAPTATION: Create platform-appropriate CTAs. Instagram = "Link in bio", Facebook = direct link CTA, TikTok = "Follow for more", LinkedIn = professional CTA, Stories = swipe up / poll engagement.' : 'CTA: Keep original CTA where applicable.'}

LANGUAGE: ALL content MUST be in Romanian with proper diacritics (ă, â, î, ș, ț).

OUTPUT FORMAT: You MUST output ONLY a valid JSON object in the following structure, wrapped in a \`\`\`json code fence. No other text before or after.

\`\`\`json
{
  "adaptations": [
    {
      "platform": "instagram",
      "caption": "Adapted caption text here...",
      "hashtags": ["hashtag1", "hashtag2"],
      "suggestedFormat": "carousel",
      "cta": "Link in bio!",
      "charCount": 342
    }
  ]
}
\`\`\`

Generate one adaptation object per target platform: ${targets.join(', ')}.
Each "charCount" must be the actual character count of the "caption" field.
Hashtags should NOT include the # prefix in the array.`

    stream(
      '/api/intelligence/repurpose',
      { clientId, caption: caption.trim(), platform: sourcePlatform, hashtags: hashtags.trim(), prompt },
      (chunk) => { rawRef.current += chunk; setRawResult(rawRef.current) },
    )
  }, [caption, hashtags, sourcePlatform, targetPlatforms, clientId, stream, getEffectiveTone, optimizeHashtags, optimizeLength, adaptCTA])

  const handleReset = useCallback(() => {
    abort()
    setCaption('')
    setHashtags('')
    setRawResult('')
    setAdaptations([])
    setParseError(false)
    rawRef.current = ''
    setCopiedId(null)
    setCopiedAll(false)
  }, [abort])

  const copyText = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }, [])

  const copyAllAdaptations = useCallback(() => {
    const allText = adaptations.map(a => {
      const p = PLATFORMS.find(pl => pl.id === a.platform)
      const hashStr = a.hashtags.length > 0 ? `\n\n${a.hashtags.map(h => `#${h}`).join(' ')}` : ''
      return `=== ${p?.label || a.platform.toUpperCase()} ===\n${a.caption}${hashStr}${a.cta ? `\n\nCTA: ${a.cta}` : ''}`
    }).join('\n\n---\n\n')
    navigator.clipboard.writeText(allText)
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2000)
  }, [adaptations])

  const hasOutput = rawResult || streaming || adaptations.length > 0

  return (
    <div className="h-full flex gap-4">
      {/* ── Sidebar ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-[360px] shrink-0 flex flex-col gap-3 overflow-y-auto scroll-area pr-1"
      >
        {/* Header */}
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Repeat size={20} className="text-violet-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Repurpose Engine</h3>
              <p className="text-xs text-white/30">Auto-adapt for all platforms</p>
            </div>
          </div>

          {/* Source platform */}
          <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-2 block">
            Source Platform
          </label>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {PLATFORMS.map(p => (
              <button
                key={p.id}
                onClick={() => setSourcePlatform(p.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  sourcePlatform === p.id
                    ? 'glass-active text-white'
                    : 'glass-hover text-white/40 hover:text-white/60'
                }`}
              >
                <p.icon size={12} style={sourcePlatform === p.id ? { color: p.color } : undefined} />
                {p.label}
              </button>
            ))}
          </div>

          {/* Post selector */}
          <PostSelector posts={allPosts} onSelect={handleSelectPost} />

          {/* Caption */}
          <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-2 mt-4 block">
            Original Caption
          </label>
          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Paste or select a post above..."
            rows={5}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 resize-none mb-1"
          />
          <div className="text-[10px] text-white/20 text-right mb-3">{caption.length} chars</div>

          {/* Hashtags */}
          <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-2 block">
            <Hash size={10} className="inline mr-1" />
            Hashtags (optional)
          </label>
          <input
            value={hashtags}
            onChange={e => setHashtags(e.target.value)}
            placeholder="#marketing #romania"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50"
          />
        </div>

        {/* Target platforms */}
        <div className="glass rounded-xl p-4">
          <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-2.5 block">
            Target Platforms
          </label>
          <div className="flex flex-col gap-1.5">
            {availableTargets.map(p => {
              const selected = targetPlatforms.has(p.id)
              return (
                <button
                  key={p.id}
                  onClick={() => toggleTarget(p.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                    selected
                      ? 'text-white border border-white/15'
                      : 'text-white/25 hover:text-white/40 border border-transparent'
                  }`}
                  style={selected ? { backgroundColor: p.bg, borderColor: `${p.color}30` } : {}}
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      selected ? 'border-transparent' : 'border-white/15'
                    }`}
                    style={selected ? { backgroundColor: p.color } : {}}
                  >
                    {selected && <Check size={10} className="text-white" />}
                  </div>
                  <p.icon size={14} style={selected ? { color: p.color } : undefined} />
                  <span className="flex-1 text-left">{p.label}</span>
                  <span className="text-[10px] text-white/20">{p.charLimit} max</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Adaptation options */}
        <div className="glass rounded-xl p-4">
          <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-3 block">
            Adaptation Options
          </label>

          {/* Global tone */}
          <div className="mb-3">
            <span className="text-[10px] text-white/30 block mb-1.5">
              <Type size={10} className="inline mr-1" />
              Global Tone
            </span>
            <div className="flex flex-wrap gap-1">
              {TONE_OPTIONS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setGlobalTone(t.id)}
                  className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all flex items-center gap-1 ${
                    globalTone === t.id
                      ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                      : 'bg-white/5 text-white/30 hover:text-white/50 border border-transparent'
                  }`}
                >
                  <t.icon size={10} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Per-platform tone overrides (collapsible) */}
          {Array.from(targetPlatforms).length > 0 && (
            <ToneOverridesSection
              targets={Array.from(targetPlatforms)}
              overrides={toneOverrides}
              onChange={setToneForPlatform}
            />
          )}

          {/* Toggle options */}
          <div className="mt-3 flex flex-col gap-2">
            <ToggleOption
              label="Hashtag optimization"
              enabled={optimizeHashtags}
              onToggle={() => setOptimizeHashtags(v => !v)}
            />
            <ToggleOption
              label="Caption length optimization"
              enabled={optimizeLength}
              onToggle={() => setOptimizeLength(v => !v)}
            />
            <ToggleOption
              label="CTA adaptation"
              enabled={adaptCTA}
              onToggle={() => setAdaptCTA(v => !v)}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 sticky bottom-0 pb-1">
          <button
            onClick={handleAdapt}
            disabled={!caption.trim() || targetPlatforms.size === 0 || streaming}
            className="flex-1 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          >
            {streaming ? <Loader2 size={14} className="animate-spin" /> : <Repeat size={14} />}
            {streaming ? 'Adapting...' : `Adapt for ${targetPlatforms.size} Platform${targetPlatforms.size !== 1 ? 's' : ''}`}
          </button>
          {hasOutput && (
            <button
              onClick={handleReset}
              className="px-3 py-2.5 rounded-xl glass-hover text-white/40 hover:text-white/60 transition-colors"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      </motion.div>

      {/* ── Output area ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex-1 min-w-0 overflow-y-auto scroll-area"
      >
        {/* Empty state */}
        {!hasOutput && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mx-auto mb-4">
                <Repeat size={28} className="text-white/10" />
              </div>
              <p className="text-sm text-white/20 max-w-[300px]">
                Paste a caption or pick an existing post, select target platforms, and hit Adapt to generate optimized versions for each.
              </p>
            </div>
          </div>
        )}

        {/* Streaming state */}
        {streaming && (
          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Loader2 size={14} className="animate-spin text-violet-400" />
              <span className="text-xs text-white/40">Generating platform adaptations...</span>
            </div>
            <div className="text-sm text-white/50 whitespace-pre-wrap leading-relaxed font-mono text-[12px] max-h-[400px] overflow-y-auto">
              {rawResult}
            </div>
            <div className="mt-2 h-0.5 w-8 bg-violet-500/50 animate-pulse rounded-full" />
            <div ref={resultEndRef} />
          </div>
        )}

        {/* Parsed adaptations */}
        {!streaming && adaptations.length > 0 && (
          <div className="flex flex-col gap-4">
            {/* Original comparison header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {(() => {
                    const sp = PLATFORMS.find(p => p.id === sourcePlatform)
                    return sp ? <sp.icon size={14} style={{ color: sp.color }} /> : null
                  })()}
                  <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Original ({sourcePlatform})</span>
                </div>
                <span className="text-[10px] text-white/20">{caption.length} chars</span>
              </div>
              <div className="text-sm text-white/40 line-clamp-3 leading-relaxed">{caption}</div>
              {hashtags && (
                <div className="mt-2 text-[11px] text-violet-400/50">{hashtags}</div>
              )}
            </motion.div>

            {/* Action bar */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-white/30">
                {adaptations.length} adaptation{adaptations.length !== 1 ? 's' : ''} generated
              </span>
              <button
                onClick={copyAllAdaptations}
                className="px-3 py-1.5 rounded-lg glass-hover text-xs text-white/40 hover:text-white/60 flex items-center gap-1.5 transition-colors"
              >
                {copiedAll ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                {copiedAll ? 'Copied all' : 'Copy all'}
              </button>
            </div>

            {/* Platform cards grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              <AnimatePresence>
                {adaptations.map((adaptation, i) => {
                  const platform = PLATFORMS.find(p => p.id === adaptation.platform)
                  if (!platform) return null
                  const fullCaption = adaptation.caption + (adaptation.hashtags.length > 0
                    ? `\n\n${adaptation.hashtags.map(h => `#${h}`).join(' ')}`
                    : '')
                  const copyKey = `card-${adaptation.platform}`

                  return (
                    <motion.div
                      key={adaptation.platform}
                      initial={{ opacity: 0, y: 20, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: i * 0.06, duration: 0.3, ease: 'easeOut' }}
                      className="glass rounded-xl overflow-hidden"
                      style={{ borderLeft: `3px solid ${platform.color}40` }}
                    >
                      {/* Card header */}
                      <div
                        className="px-4 py-3 flex items-center justify-between"
                        style={{ background: `linear-gradient(135deg, ${platform.bg}, transparent)` }}
                      >
                        <div className="flex items-center gap-2">
                          <platform.icon size={16} style={{ color: platform.color }} />
                          <span className="text-sm font-semibold text-white">{platform.label}</span>
                        </div>
                        <button
                          onClick={() => copyText(fullCaption + (adaptation.cta ? `\n\n${adaptation.cta}` : ''), copyKey)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors"
                          title="Copy adaptation"
                        >
                          {copiedId === copyKey ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        </button>
                      </div>

                      {/* Card body */}
                      <div className="px-4 py-3">
                        {/* Caption */}
                        <div className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed mb-2">
                          {adaptation.caption}
                        </div>

                        {/* Char limit bar */}
                        <CharLimitBar current={adaptation.charCount || adaptation.caption.length} limit={platform.charLimit} />

                        {/* Hashtags */}
                        {adaptation.hashtags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {adaptation.hashtags.map((tag, j) => (
                              <span
                                key={j}
                                className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                                style={{ backgroundColor: `${platform.color}15`, color: `${platform.color}cc` }}
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Footer: format + CTA */}
                        <div className="mt-3 pt-3 border-t border-white/5 flex items-start justify-between gap-3">
                          {adaptation.suggestedFormat && (
                            <div className="flex items-center gap-1.5">
                              <Sparkles size={10} className="text-white/20" />
                              <span className="text-[10px] text-white/30">
                                Best as <span className="text-white/50 font-medium">{adaptation.suggestedFormat}</span>
                              </span>
                            </div>
                          )}
                          {adaptation.cta && (
                            <div className="flex items-center gap-1.5 text-right">
                              <Megaphone size={10} className="text-white/20 shrink-0" />
                              <span className="text-[10px] text-white/40 italic">{adaptation.cta}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Parse error fallback — show raw */}
        {!streaming && parseError && rawResult && (
          <div className="flex flex-col gap-3">
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle size={14} className="text-amber-400" />
                <span className="text-xs text-amber-400/80">Could not parse structured output. Showing raw result.</span>
              </div>
              <div className="text-sm text-white/60 whitespace-pre-wrap leading-relaxed">{rawResult}</div>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => copyText(rawResult, 'raw')}
                  className="px-3 py-1.5 rounded-lg glass-hover text-xs text-white/40 hover:text-white/60 flex items-center gap-1.5 transition-colors"
                >
                  {copiedId === 'raw' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  Copy
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────

function ToggleOption({ label, enabled, onToggle }: { label: string; enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center justify-between py-1 group"
    >
      <span className={`text-[11px] transition-colors ${enabled ? 'text-white/50' : 'text-white/20'}`}>
        {label}
      </span>
      <div
        className={`w-7 h-4 rounded-full transition-colors relative ${
          enabled ? 'bg-violet-500/50' : 'bg-white/10'
        }`}
      >
        <motion.div
          animate={{ x: enabled ? 14 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`w-2.5 h-2.5 rounded-full absolute top-[3px] transition-colors ${
            enabled ? 'bg-violet-300' : 'bg-white/20'
          }`}
        />
      </div>
    </button>
  )
}

function ToneOverridesSection({
  targets,
  overrides,
  onChange,
}: {
  targets: PlatformId[]
  overrides: ToneOverrides
  onChange: (platformId: string, tone: ToneId) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const hasOverrides = Object.keys(overrides).length > 0

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-[10px] text-white/25 hover:text-white/40 transition-colors flex items-center gap-1 mb-1"
      >
        <ChevronDown size={10} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
        Per-platform tone{hasOverrides ? ` (${Object.keys(overrides).length} set)` : ''}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-1.5 pt-1">
              {targets.map(tid => {
                const p = PLATFORMS.find(pl => pl.id === tid)
                if (!p) return null
                const current = overrides[tid] || 'auto'
                return (
                  <div key={tid} className="flex items-center gap-2">
                    <p.icon size={10} style={{ color: p.color }} className="shrink-0" />
                    <span className="text-[10px] text-white/30 w-16 shrink-0">{p.label}</span>
                    <div className="flex gap-0.5 flex-1">
                      {TONE_OPTIONS.map(t => (
                        <button
                          key={t.id}
                          onClick={() => onChange(tid, t.id)}
                          className={`px-1.5 py-0.5 rounded text-[9px] transition-all ${
                            current === t.id
                              ? 'bg-violet-500/20 text-violet-300'
                              : 'text-white/15 hover:text-white/30'
                          }`}
                          title={t.label}
                        >
                          {t.label.slice(0, 4)}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
