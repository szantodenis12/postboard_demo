import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Rocket, ChevronLeft, Loader2, Check, X, Calendar,
  Pencil, Trash2, Facebook, Instagram, Linkedin,
  Hash, Clock, MessageSquare, BarChart3, Sparkles,
  FileText, ArrowRight, CheckCircle2, AlertCircle,
  type LucideIcon,
} from 'lucide-react'
import { useApp } from '../../../core/context'

// ── Types ────────────────────────────────────────────────
interface CalendarPost {
  id: string
  date: string       // DD.MM.YYYY
  time?: string
  platform: string
  format: string
  pillar: string
  caption: string
  hashtags: string[]
  visualDescription?: string
  cta?: string
}

type WizardStep = 'brief' | 'generating' | 'review' | 'applying' | 'done'

// ── Constants ────────────────────────────────────────────
const PLATFORMS = [
  { id: 'facebook', label: 'Facebook', icon: Facebook, color: '#1877f2' },
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: '#e4405f' },
  { id: 'tiktok', label: 'TikTok', icon: Hash, color: '#00f2ea' },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: '#0a66c2' },
] as const

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

const PILLAR_LABELS: Record<string, string> = {
  educational: 'Educational',
  promotional: 'Promotional',
  engagement: 'Engagement',
  'behind-the-scenes': 'Behind the Scenes',
}

const FORMAT_LABELS: Record<string, string> = {
  'single-image': 'Image',
  carousel: 'Carousel',
  reel: 'Reel',
  stories: 'Stories',
  video: 'Video',
  text: 'Text',
}

const MONTH_NAMES = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie',
]

// ── Helpers ──────────────────────────────────────────────
function uid(): string {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function platformOf(id: string) {
  return PLATFORMS.find(p => p.id === id)
}

function parseDateParts(dateStr: string): { day: number; month: number; year: number } | null {
  const m = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (m) return { day: parseInt(m[1]), month: parseInt(m[2]), year: parseInt(m[3]) }
  // ISO fallback
  const iso = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (iso) return { day: parseInt(iso[3]), month: parseInt(iso[2]), year: parseInt(iso[1]) }
  return null
}

function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate()
}

function getFirstDayOfWeek(month: number, year: number): number {
  // 0 = Sunday, we want Monday = 0
  const day = new Date(year, month - 1, 1).getDay()
  return day === 0 ? 6 : day - 1
}

// ── Step Indicator ───────────────────────────────────────
const STEPS: { id: WizardStep; label: string; icon: LucideIcon }[] = [
  { id: 'brief', label: 'Brief', icon: FileText },
  { id: 'generating', label: 'Generate', icon: Sparkles },
  { id: 'review', label: 'Review', icon: Calendar },
  { id: 'done', label: 'Apply', icon: CheckCircle2 },
]

function StepIndicator({ current }: { current: WizardStep }) {
  const stepOrder: WizardStep[] = ['brief', 'generating', 'review', 'done']
  const currentIdx = current === 'applying' ? 3 : stepOrder.indexOf(current)

  return (
    <div className="flex items-center gap-1">
      {STEPS.map((step, i) => {
        const Icon = step.icon
        const isActive = i === currentIdx
        const isDone = i < currentIdx
        return (
          <div key={step.id} className="flex items-center gap-1">
            {i > 0 && (
              <div className={`w-8 h-px ${isDone ? 'bg-emerald-500/40' : 'bg-white/[0.06]'}`} />
            )}
            <div className="flex items-center gap-1.5">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-br from-accent-violet to-accent-cyan shadow-lg shadow-accent-violet/20'
                  : isDone
                    ? 'bg-emerald-500/20'
                    : 'bg-white/[0.04]'
              }`}>
                {isDone ? (
                  <Check size={12} className="text-emerald-400" />
                ) : (
                  <Icon size={12} className={isActive ? 'text-white' : 'text-white/20'} />
                )}
              </div>
              <span className={`text-[10px] font-medium hidden sm:inline ${
                isActive ? 'text-white/80' : isDone ? 'text-emerald-400/60' : 'text-white/20'
              }`}>
                {step.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Pillar Slider ────────────────────────────────────────
function PillarSliders({
  values,
  onChange,
}: {
  values: Record<string, number>
  onChange: (key: string, val: number) => void
}) {
  const total = Object.values(values).reduce((s, v) => s + v, 0)

  return (
    <div className="space-y-2.5">
      {Object.entries(values).map(([key, val]) => (
        <div key={key} className="flex items-center gap-2.5">
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: PILLAR_COLORS[key] || '#64748b' }}
          />
          <span className="text-[10px] text-white/40 w-28 truncate capitalize">
            {PILLAR_LABELS[key] || key}
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={val}
            onChange={e => onChange(key, parseInt(e.target.value))}
            className="flex-1 h-1 accent-white/40 cursor-pointer"
            style={{
              accentColor: PILLAR_COLORS[key] || '#64748b',
            }}
          />
          <span className={`text-[10px] w-8 text-right font-mono ${
            total > 100 ? 'text-red-400' : 'text-white/30'
          }`}>
            {val}%
          </span>
        </div>
      ))}
      <div className={`text-[9px] text-right font-mono ${
        total === 100 ? 'text-emerald-400/60' : total > 100 ? 'text-red-400/80' : 'text-amber-400/60'
      }`}>
        Total: {total}%
        {total !== 100 && <span className="ml-1">(should be 100%)</span>}
      </div>
    </div>
  )
}

// ── Post Card ────────────────────────────────────────────
function PostCard({
  post,
  onEdit,
  onRemove,
  compact = false,
}: {
  post: CalendarPost
  onEdit: () => void
  onRemove: () => void
  compact?: boolean
}) {
  const plat = platformOf(post.platform)
  const PlatIcon = plat?.icon || Hash
  const pillarColor = PILLAR_COLORS[post.pillar] || '#64748b'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`group relative bg-white/[0.03] border border-white/[0.06] rounded-lg overflow-hidden hover:border-white/[0.12] transition-all ${
        compact ? 'p-2' : 'p-3'
      }`}
    >
      {/* Pillar accent bar */}
      <div
        className="absolute top-0 left-0 w-full h-0.5"
        style={{ background: pillarColor }}
      />

      {/* Header */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <PlatIcon size={compact ? 10 : 12} style={{ color: plat?.color || '#999' }} />
        <span className="text-[9px] font-medium text-white/50 capitalize">{post.platform}</span>
        <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/[0.05] text-white/30 capitalize">
          {FORMAT_LABELS[post.format] || post.format}
        </span>
        <div className="flex-1" />
        {post.time && (
          <span className="text-[8px] text-white/20 flex items-center gap-0.5">
            <Clock size={7} />
            {post.time}
          </span>
        )}
      </div>

      {/* Caption preview */}
      <p className={`text-white/60 leading-relaxed mb-1.5 ${
        compact ? 'text-[9px] line-clamp-2' : 'text-[11px] line-clamp-3'
      }`}>
        {post.caption}
      </p>

      {/* Pillar tag */}
      <div className="flex items-center gap-1 mb-1.5">
        <span
          className="text-[8px] px-1.5 py-0.5 rounded-full font-medium capitalize"
          style={{
            background: `${pillarColor}15`,
            color: `${pillarColor}cc`,
          }}
        >
          {post.pillar}
        </span>
        {post.hashtags.length > 0 && (
          <span className="text-[8px] text-white/15">
            {post.hashtags.length} tags
          </span>
        )}
      </div>

      {/* Actions — show on hover */}
      <div className="absolute top-1.5 right-1.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="w-5 h-5 rounded flex items-center justify-center bg-white/[0.08] hover:bg-white/[0.15] text-white/40 hover:text-white/70 transition-all"
        >
          <Pencil size={9} />
        </button>
        <button
          onClick={onRemove}
          className="w-5 h-5 rounded flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400/50 hover:text-red-400/80 transition-all"
        >
          <Trash2 size={9} />
        </button>
      </div>
    </motion.div>
  )
}

// ── Post Editor Modal ────────────────────────────────────
function PostEditorModal({
  post,
  onSave,
  onClose,
}: {
  post: CalendarPost
  onSave: (updated: CalendarPost) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState<CalendarPost>({ ...post })
  const [hashInput, setHashInput] = useState(post.hashtags.join(', '))

  const handleSave = () => {
    const hashtags = hashInput
      .split(/[,\s]+/)
      .map(t => t.replace(/^#/, '').trim())
      .filter(Boolean)
    onSave({ ...draft, hashtags })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="glass rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto scroll-area border border-white/[0.08]"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-white">Edit Post</h3>
          <button onClick={onClose} className="p-1 rounded-lg glass-hover text-white/30 hover:text-white/60">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/25 font-semibold block mb-1">Date</label>
              <input
                value={draft.date}
                onChange={e => setDraft(d => ({ ...d, date: e.target.value }))}
                placeholder="DD.MM.YYYY"
                className="w-full px-3 py-2 rounded-lg glass text-sm text-white/80 placeholder:text-white/20 outline-none border border-white/[0.06] focus:border-accent-violet/30 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/25 font-semibold block mb-1">Time</label>
              <input
                value={draft.time || ''}
                onChange={e => setDraft(d => ({ ...d, time: e.target.value }))}
                placeholder="HH:MM"
                className="w-full px-3 py-2 rounded-lg glass text-sm text-white/80 placeholder:text-white/20 outline-none border border-white/[0.06] focus:border-accent-violet/30 transition-colors"
              />
            </div>
          </div>

          {/* Platform + Format */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/25 font-semibold block mb-1">Platform</label>
              <select
                value={draft.platform}
                onChange={e => setDraft(d => ({ ...d, platform: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg glass text-sm text-white/80 bg-transparent outline-none border border-white/[0.06] focus:border-accent-violet/30 transition-colors"
              >
                {PLATFORMS.map(p => (
                  <option key={p.id} value={p.id} className="bg-[#12121a] text-white">{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/25 font-semibold block mb-1">Format</label>
              <select
                value={draft.format}
                onChange={e => setDraft(d => ({ ...d, format: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg glass text-sm text-white/80 bg-transparent outline-none border border-white/[0.06] focus:border-accent-violet/30 transition-colors"
              >
                {Object.entries(FORMAT_LABELS).map(([val, label]) => (
                  <option key={val} value={val} className="bg-[#12121a] text-white">{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Pillar */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/25 font-semibold block mb-1">Pillar</label>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(PILLAR_COLORS).map(p => (
                <button
                  key={p}
                  onClick={() => setDraft(d => ({ ...d, pillar: p }))}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium capitalize transition-all ${
                    draft.pillar === p
                      ? 'ring-1 ring-white/20 text-white'
                      : 'text-white/30 hover:text-white/50'
                  }`}
                  style={draft.pillar === p ? {
                    background: `${PILLAR_COLORS[p]}25`,
                    color: PILLAR_COLORS[p],
                  } : {
                    background: 'rgba(255,255,255,0.03)',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Caption */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/25 font-semibold block mb-1">Caption</label>
            <textarea
              value={draft.caption}
              onChange={e => setDraft(d => ({ ...d, caption: e.target.value }))}
              rows={5}
              className="w-full px-3 py-2 rounded-lg glass text-sm text-white/80 placeholder:text-white/20 outline-none border border-white/[0.06] focus:border-accent-violet/30 transition-colors resize-none"
            />
            <div className="text-[9px] text-white/15 text-right mt-0.5">{draft.caption.length} chars</div>
          </div>

          {/* Hashtags */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/25 font-semibold block mb-1">Hashtags</label>
            <input
              value={hashInput}
              onChange={e => setHashInput(e.target.value)}
              placeholder="tag1, tag2, tag3"
              className="w-full px-3 py-2 rounded-lg glass text-sm text-white/80 placeholder:text-white/20 outline-none border border-white/[0.06] focus:border-accent-violet/30 transition-colors"
            />
          </div>

          {/* Visual Description */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/25 font-semibold block mb-1">Visual Description</label>
            <textarea
              value={draft.visualDescription || ''}
              onChange={e => setDraft(d => ({ ...d, visualDescription: e.target.value }))}
              rows={2}
              placeholder="Describe the visual..."
              className="w-full px-3 py-2 rounded-lg glass text-sm text-white/80 placeholder:text-white/20 outline-none border border-white/[0.06] focus:border-accent-violet/30 transition-colors resize-none"
            />
          </div>

          {/* CTA */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/25 font-semibold block mb-1">CTA</label>
            <input
              value={draft.cta || ''}
              onChange={e => setDraft(d => ({ ...d, cta: e.target.value }))}
              placeholder="Call to action..."
              className="w-full px-3 py-2 rounded-lg glass text-sm text-white/80 placeholder:text-white/20 outline-none border border-white/[0.06] focus:border-accent-violet/30 transition-colors"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-5 pt-4 border-t border-white/[0.06]">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg glass glass-hover text-white/40 text-sm font-medium transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-lg bg-accent-violet/20 hover:bg-accent-violet/30 text-accent-violet text-sm font-medium transition-all"
          >
            Save Changes
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Stats Bar ────────────────────────────────────────────
function StatsBar({ posts }: { posts: CalendarPost[] }) {
  const pillarCounts = useMemo(() => {
    const m = new Map<string, number>()
    for (const p of posts) {
      m.set(p.pillar, (m.get(p.pillar) || 0) + 1)
    }
    return Array.from(m.entries())
      .map(([pillar, count]) => ({ pillar, count, pct: Math.round((count / posts.length) * 100) }))
      .sort((a, b) => b.count - a.count)
  }, [posts])

  const platformCounts = useMemo(() => {
    const m = new Map<string, number>()
    for (const p of posts) {
      m.set(p.platform, (m.get(p.platform) || 0) + 1)
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1])
  }, [posts])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-4"
    >
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Total */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-violet/20 to-accent-cyan/20 flex items-center justify-center">
            <BarChart3 size={18} className="text-accent-violet" />
          </div>
          <div>
            <div className="text-lg font-bold text-white">{posts.length}</div>
            <div className="text-[9px] text-white/25 uppercase tracking-wider">Total Posts</div>
          </div>
        </div>

        {/* Pillar Distribution */}
        <div className="flex items-center gap-2">
          {pillarCounts.slice(0, 5).map(({ pillar, count, pct }) => (
            <div
              key={pillar}
              className="px-2 py-1 rounded-lg text-center"
              style={{ background: `${PILLAR_COLORS[pillar] || '#64748b'}12` }}
            >
              <div className="text-[10px] font-bold" style={{ color: PILLAR_COLORS[pillar] || '#64748b' }}>
                {count}
              </div>
              <div className="text-[7px] text-white/25 capitalize whitespace-nowrap">{pillar}</div>
            </div>
          ))}
        </div>

        {/* Platform Breakdown */}
        <div className="flex items-center gap-2">
          {platformCounts.map(([platform, count]) => {
            const plat = platformOf(platform)
            const PlatIcon = plat?.icon || Hash
            return (
              <div key={platform} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.04]">
                <PlatIcon size={10} style={{ color: plat?.color || '#999' }} />
                <span className="text-[10px] font-medium text-white/50">{count}</span>
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

// ── Calendar Grid ────────────────────────────────────────
function CalendarGrid({
  posts,
  month,
  year,
  onEditPost,
  onRemovePost,
}: {
  posts: CalendarPost[]
  month: number
  year: number
  onEditPost: (post: CalendarPost) => void
  onRemovePost: (id: string) => void
}) {
  const daysInMonth = getDaysInMonth(month, year)
  const firstDay = getFirstDayOfWeek(month, year)
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  // Group posts by day
  const postsByDay = useMemo(() => {
    const m = new Map<number, CalendarPost[]>()
    for (const p of posts) {
      const parts = parseDateParts(p.date)
      if (parts && parts.month === month && parts.year === year) {
        const existing = m.get(parts.day) || []
        existing.push(p)
        m.set(parts.day, existing)
      }
    }
    return m
  }, [posts, month, year])

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  // Fill remaining cells to complete the grid
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="flex flex-col gap-px">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px mb-1">
        {dayLabels.map(d => (
          <div key={d} className="text-center text-[9px] font-semibold text-white/20 uppercase tracking-wider py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar cells */}
      <div className="grid grid-cols-7 gap-px">
        {cells.map((day, i) => {
          const dayPosts = day ? (postsByDay.get(day) || []) : []
          const isToday = (() => {
            const now = new Date()
            return day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear()
          })()

          return (
            <div
              key={i}
              className={`min-h-[100px] rounded-lg p-1.5 transition-colors ${
                day
                  ? 'bg-white/[0.02] hover:bg-white/[0.04]'
                  : ''
              } ${isToday ? 'ring-1 ring-accent-violet/30' : ''}`}
            >
              {day && (
                <>
                  <div className={`text-[10px] font-medium mb-1 ${
                    isToday ? 'text-accent-violet' : 'text-white/25'
                  }`}>
                    {day}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <AnimatePresence>
                      {dayPosts.map(post => (
                        <PostCard
                          key={post.id}
                          post={post}
                          onEdit={() => onEditPost(post)}
                          onRemove={() => onRemovePost(post.id)}
                          compact
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────
export function ContentPipeline() {
  const { data, selectedClient: globalClient, refresh } = useApp()

  // ── Brief state ──
  const [clientId, setClientId] = useState('')
  const [month, setMonth] = useState(() => {
    const next = new Date()
    next.setMonth(next.getMonth() + 1)
    return next.getMonth() + 1
  })
  const [year, setYear] = useState(() => {
    const next = new Date()
    next.setMonth(next.getMonth() + 1)
    return next.getFullYear()
  })
  const [brief, setBrief] = useState('')
  const [postsPerWeek, setPostsPerWeek] = useState(4)
  const [platforms, setPlatforms] = useState<Set<string>>(new Set(['facebook', 'instagram']))
  const [pillarBalance, setPillarBalance] = useState<Record<string, number>>({
    educational: 25,
    promotional: 25,
    engagement: 25,
    'behind-the-scenes': 25,
  })

  // ── Wizard state ──
  const [step, setStep] = useState<WizardStep>('brief')
  const [posts, setPosts] = useState<CalendarPost[]>([])
  const [streamText, setStreamText] = useState('')
  const [streamProgress, setStreamProgress] = useState(0)
  const [editingPost, setEditingPost] = useState<CalendarPost | null>(null)
  const [applyResult, setApplyResult] = useState<{ created: number; clientName: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  const streamRef = useRef('')

  // Sync with global client selector
  useEffect(() => {
    if (globalClient) setClientId(globalClient)
    else if (!clientId && data.clients.length > 0) setClientId(data.clients[0].id)
  }, [globalClient, data.clients, clientId])

  const selectedClient = data.clients.find(c => c.id === clientId)

  // ── Toggle platform ──
  const togglePlatform = (id: string) => {
    setPlatforms(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        if (next.size > 1) next.delete(id) // Keep at least one
      } else {
        next.add(id)
      }
      return next
    })
  }

  // ── Generate ──
  const handleGenerate = useCallback(async () => {
    if (!clientId) return

    setStep('generating')
    setStreamText('')
    setStreamProgress(0)
    setPosts([])
    setError(null)
    streamRef.current = ''

    const controller = new AbortController()
    abortRef.current = controller

    const platformList = Array.from(platforms).join(', ')
    const pillarStr = Object.entries(pillarBalance)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${k}: ${v}%`)
      .join(', ')

    // Build enhanced body — the server accepts clientId, month, year, postsPerWeek
    // We pass extra info via a brief-enhanced prompt approach:
    // The server prompt already reads client context, so we add brief/platforms/pillars
    // We can append to the prompt via the `brief` field which will be appended
    const body = {
      clientId,
      month,
      year,
      postsPerWeek,
      // These are consumed by a custom prompt build below
      platforms: platformList,
      pillarBalance: pillarStr,
      brief: brief.trim() || undefined,
    }

    try {
      const res = await fetch('/api/intelligence/calendar-fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        setError(err.error || 'Failed to start generation')
        setStep('brief')
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let parsedPosts: CalendarPost[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const dataStr = line.slice(6)
          if (dataStr === '[DONE]') break

          try {
            const parsed = JSON.parse(dataStr)

            if (parsed.text) {
              streamRef.current += parsed.text
              setStreamText(streamRef.current)
              // Estimate progress from text length
              const estimated = postsPerWeek * 4.3 // ~posts in month
              const jsonMatches = (streamRef.current.match(/```json/g) || []).length
              setStreamProgress(Math.min(95, Math.round((jsonMatches / estimated) * 100)))
            }

            if (parsed.type === 'complete' && Array.isArray(parsed.posts)) {
              parsedPosts = parsed.posts.map((p: any) => ({
                ...p,
                id: uid(),
              }))
            }

            if (parsed.error) {
              setError(parsed.error)
            }
          } catch {
            // skip parse errors
          }
        }
      }

      if (parsedPosts.length > 0) {
        setPosts(parsedPosts)
        setStreamProgress(100)
        // Short delay before showing review
        setTimeout(() => setStep('review'), 600)
      } else {
        // Try client-side parsing as fallback
        const fallbackPosts = tryParsePostsFromText(streamRef.current)
        if (fallbackPosts.length > 0) {
          setPosts(fallbackPosts)
          setStreamProgress(100)
          setTimeout(() => setStep('review'), 600)
        } else {
          setError('Could not parse generated posts. Try again.')
          setStep('brief')
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError(err instanceof Error ? err.message : 'Generation failed')
        setStep('brief')
      }
    }
  }, [clientId, month, year, postsPerWeek, platforms, pillarBalance, brief])

  // ── Fallback parser ──
  function tryParsePostsFromText(text: string): CalendarPost[] {
    const jsonBlocks = [...text.matchAll(/```json(?::complete)?\s*\n([\s\S]*?)```/g)]
    const found: CalendarPost[] = []

    for (const match of jsonBlocks) {
      try {
        const parsed = JSON.parse(match[1].trim())
        if (Array.isArray(parsed)) {
          found.push(...parsed.filter((p: any) => p.date && p.platform && p.caption).map((p: any) => ({ ...p, id: uid() })))
        } else if (parsed.date && parsed.platform && parsed.caption) {
          found.push({ ...parsed, id: uid() })
        }
      } catch { /* skip */ }
    }
    return found
  }

  // ── Abort ──
  const handleAbort = () => {
    abortRef.current?.abort()
    setStep('brief')
  }

  // ── Post operations ──
  const handleRemovePost = (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  const handleSavePost = (updated: CalendarPost) => {
    setPosts(prev => prev.map(p => p.id === updated.id ? updated : p))
    setEditingPost(null)
  }

  // ── Apply ──
  const handleApply = async () => {
    if (posts.length === 0) return

    setStep('applying')
    setError(null)

    try {
      const res = await fetch('/api/intelligence/calendar-fill/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          posts: posts.map(({ id, ...rest }) => rest), // strip client-side id
        }),
      })

      const result = await res.json()

      if (result.success) {
        setApplyResult({
          created: result.created,
          clientName: selectedClient?.displayName || clientId,
        })
        setStep('done')
        refresh() // Refresh dashboard data
      } else {
        setError(result.error || 'Failed to write posts')
        setStep('review')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Apply failed')
      setStep('review')
    }
  }

  // ── Navigate to calendar ──
  const navigateToCalendar = () => {
    window.dispatchEvent(new CustomEvent('postboard:navigate', { detail: 'calendar' }))
  }

  // ── Reset everything ──
  const handleReset = () => {
    abortRef.current?.abort()
    setStep('brief')
    setPosts([])
    setStreamText('')
    setStreamProgress(0)
    setApplyResult(null)
    setError(null)
    setBrief('')
    streamRef.current = ''
  }

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500/30 to-rose-500/30 flex items-center justify-center shadow-lg shadow-orange-500/10">
            <Rocket size={18} className="text-orange-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Content Pipeline</h2>
            <p className="text-[10px] text-white/25">One brief, one month of posts</p>
          </div>
        </div>

        <StepIndicator current={step} />
      </motion.div>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 overflow-hidden"
          >
            <div className="glass rounded-xl p-3 border border-red-500/20 flex items-center gap-3">
              <AlertCircle size={16} className="text-red-400 shrink-0" />
              <p className="text-xs text-red-400/80 flex-1">{error}</p>
              <button onClick={() => setError(null)} className="text-white/20 hover:text-white/40">
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content area */}
      <div className="flex-1 min-h-0 overflow-y-auto scroll-area">
        <AnimatePresence mode="wait">
          {/* ═══ STEP 1: Brief Input ═══ */}
          {step === 'brief' && (
            <motion.div
              key="brief"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex gap-5 h-full"
            >
              {/* Left — Form */}
              <div className="w-[380px] shrink-0 flex flex-col gap-3">
                {/* Client Selector */}
                <div className="glass rounded-xl p-4">
                  <label className="text-[10px] uppercase tracking-wider text-white/25 font-semibold block mb-2">
                    Client
                  </label>
                  <select
                    value={clientId}
                    onChange={e => setClientId(e.target.value)}
                    className="w-full glass rounded-lg px-3 py-2.5 text-sm text-white/80 bg-transparent border border-white/[0.08] outline-none focus:border-accent-violet/40 transition-colors"
                  >
                    {data.clients.map(c => (
                      <option key={c.id} value={c.id} className="bg-[#12121a] text-white">
                        {c.displayName}
                      </option>
                    ))}
                  </select>
                  {selectedClient && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: selectedClient.color }} />
                      <span className="text-[10px] text-white/25">{selectedClient.stats.total} existing posts</span>
                    </div>
                  )}
                </div>

                {/* Month / Year */}
                <div className="glass rounded-xl p-4">
                  <label className="text-[10px] uppercase tracking-wider text-white/25 font-semibold block mb-2">
                    Month & Year
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={month}
                      onChange={e => setMonth(parseInt(e.target.value))}
                      className="flex-1 glass rounded-lg px-3 py-2 text-sm text-white/80 bg-transparent border border-white/[0.08] outline-none focus:border-accent-violet/40 transition-colors"
                    >
                      {MONTH_NAMES.map((name, i) => (
                        <option key={i} value={i + 1} className="bg-[#12121a] text-white">{name}</option>
                      ))}
                    </select>
                    <select
                      value={year}
                      onChange={e => setYear(parseInt(e.target.value))}
                      className="w-24 glass rounded-lg px-3 py-2 text-sm text-white/80 bg-transparent border border-white/[0.08] outline-none focus:border-accent-violet/40 transition-colors"
                    >
                      {[2025, 2026, 2027].map(y => (
                        <option key={y} value={y} className="bg-[#12121a] text-white">{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Posts per week */}
                <div className="glass rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] uppercase tracking-wider text-white/25 font-semibold">
                      Posts Per Week
                    </label>
                    <span className="text-sm font-bold text-accent-violet">{postsPerWeek}</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={7}
                    value={postsPerWeek}
                    onChange={e => setPostsPerWeek(parseInt(e.target.value))}
                    className="w-full h-1.5 accent-accent-violet cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] text-white/15 mt-1">
                    <span>2</span>
                    <span>~{Math.round(postsPerWeek * 4.3)} posts/month</span>
                    <span>7</span>
                  </div>
                </div>

                {/* Platforms */}
                <div className="glass rounded-xl p-4">
                  <label className="text-[10px] uppercase tracking-wider text-white/25 font-semibold block mb-2">
                    Platforms
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {PLATFORMS.map(p => {
                      const active = platforms.has(p.id)
                      const Icon = p.icon
                      return (
                        <button
                          key={p.id}
                          onClick={() => togglePlatform(p.id)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            active
                              ? 'glass-active text-white'
                              : 'text-white/25 hover:text-white/40 hover:bg-white/[0.03]'
                          }`}
                        >
                          <Icon size={12} style={active ? { color: p.color } : undefined} />
                          {p.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Pillar Balance */}
                <div className="glass rounded-xl p-4">
                  <label className="text-[10px] uppercase tracking-wider text-white/25 font-semibold block mb-2.5">
                    Content Pillar Balance
                  </label>
                  <PillarSliders
                    values={pillarBalance}
                    onChange={(key, val) => setPillarBalance(prev => ({ ...prev, [key]: val }))}
                  />
                </div>
              </div>

              {/* Right — Brief + CTA */}
              <div className="flex-1 flex flex-col gap-3">
                <div className="glass rounded-xl p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare size={14} className="text-accent-violet" />
                    <label className="text-[10px] uppercase tracking-wider text-white/25 font-semibold">
                      Campaign Brief
                    </label>
                    <span className="text-[9px] text-white/15 ml-auto">(optional)</span>
                  </div>
                  <textarea
                    value={brief}
                    onChange={e => setBrief(e.target.value)}
                    placeholder="Describe the campaign focus, promotions, events...

Example: Spring promotion -20% on all outdoor products. Easter campaign — family moments. Focus on outdoor activities and seasonal transitions. Highlight new arrivals from the spring collection."
                    className="flex-1 w-full px-4 py-3 rounded-xl glass text-sm text-white/70 placeholder:text-white/15 outline-none border border-white/[0.06] focus:border-accent-violet/30 transition-colors resize-none leading-relaxed"
                  />
                  <div className="text-[9px] text-white/15 text-right mt-1">{brief.length} chars</div>
                </div>

                {/* Preview summary */}
                <div className="glass rounded-xl p-4">
                  <div className="text-[10px] text-white/25 uppercase tracking-wider font-semibold mb-2">Plan Summary</div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/[0.03] rounded-lg p-2.5 text-center">
                      <div className="text-sm font-bold text-white/80">{Math.round(postsPerWeek * 4.3)}</div>
                      <div className="text-[8px] text-white/20">Posts</div>
                    </div>
                    <div className="bg-white/[0.03] rounded-lg p-2.5 text-center">
                      <div className="text-sm font-bold text-white/80">{platforms.size}</div>
                      <div className="text-[8px] text-white/20">Platforms</div>
                    </div>
                    <div className="bg-white/[0.03] rounded-lg p-2.5 text-center">
                      <div className="text-sm font-bold text-white/80">{MONTH_NAMES[month - 1]}</div>
                      <div className="text-[8px] text-white/20">{year}</div>
                    </div>
                  </div>
                </div>

                {/* Generate button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleGenerate}
                  disabled={!clientId}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all"
                >
                  <Sparkles size={16} />
                  Generate Content Plan
                  <ArrowRight size={14} />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ═══ STEP 2: Generating (Streaming) ═══ */}
          {step === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex flex-col items-center justify-center min-h-[400px] gap-6"
            >
              {/* Progress ring */}
              <div className="relative w-32 h-32">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
                  <circle
                    cx="64" cy="64" r="56"
                    fill="none"
                    stroke="rgba(255,255,255,0.04)"
                    strokeWidth="6"
                  />
                  <motion.circle
                    cx="64" cy="64" r="56"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 56}
                    strokeDashoffset={2 * Math.PI * 56 * (1 - streamProgress / 100)}
                    initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 56 * (1 - streamProgress / 100) }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#e11d48" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-white">{streamProgress}%</span>
                  <span className="text-[9px] text-white/25">generating</span>
                </div>
              </div>

              {/* Status text */}
              <div className="text-center">
                <h3 className="text-sm font-semibold text-white mb-1">
                  Generating content plan for {MONTH_NAMES[month - 1]} {year}
                </h3>
                <p className="text-xs text-white/30">
                  {selectedClient?.displayName} &middot; {postsPerWeek} posts/week &middot; {Array.from(platforms).join(', ')}
                </p>
              </div>

              {/* Streaming text preview */}
              <div className="w-full max-w-2xl">
                <div className="glass rounded-xl p-4 max-h-[200px] overflow-y-auto scroll-area">
                  <div className="text-[11px] text-white/40 leading-relaxed whitespace-pre-wrap font-mono">
                    {streamText.slice(-800)}
                  </div>
                  <span className="inline-block w-1.5 h-3 bg-orange-500/60 animate-pulse ml-0.5 rounded-sm" />
                </div>
              </div>

              {/* Abort */}
              <button
                onClick={handleAbort}
                className="px-4 py-2 rounded-lg glass glass-hover text-white/30 text-xs font-medium hover:text-white/50 transition-all"
              >
                Cancel
              </button>
            </motion.div>
          )}

          {/* ═══ STEP 3: Review & Edit ═══ */}
          {step === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col gap-3"
            >
              {/* Stats bar */}
              <StatsBar posts={posts} />

              {/* View toggle + Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setStep('brief')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg glass glass-hover text-white/30 text-xs font-medium hover:text-white/50 transition-all"
                  >
                    <ChevronLeft size={12} />
                    Back to Brief
                  </button>
                  <span className="text-[10px] text-white/20">
                    {posts.length} posts for {MONTH_NAMES[month - 1]} {year}
                  </span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleApply}
                  disabled={posts.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-30 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <CheckCircle2 size={14} />
                  Write to Calendar
                  <span className="text-[10px] opacity-70">({posts.length} posts)</span>
                </motion.button>
              </div>

              {/* Calendar Grid */}
              <div className="glass rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={14} className="text-white/30" />
                  <span className="text-xs font-semibold text-white/60">
                    {MONTH_NAMES[month - 1]} {year}
                  </span>
                </div>
                <CalendarGrid
                  posts={posts}
                  month={month}
                  year={year}
                  onEditPost={setEditingPost}
                  onRemovePost={handleRemovePost}
                />
              </div>

              {/* List view for posts outside the month (edge case) */}
              {(() => {
                const outsidePosts = posts.filter(p => {
                  const parts = parseDateParts(p.date)
                  return !parts || parts.month !== month || parts.year !== year
                })
                if (outsidePosts.length === 0) return null
                return (
                  <div className="glass rounded-xl p-4">
                    <div className="text-[10px] text-white/25 uppercase tracking-wider font-semibold mb-2">
                      Other Dates ({outsidePosts.length})
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {outsidePosts.map(post => (
                        <div key={post.id} className="relative">
                          <div className="text-[9px] text-white/20 mb-0.5">{post.date}</div>
                          <PostCard
                            post={post}
                            onEdit={() => setEditingPost(post)}
                            onRemove={() => handleRemovePost(post.id)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </motion.div>
          )}

          {/* ═══ STEP 3b: Applying ═══ */}
          {step === 'applying' && (
            <motion.div
              key="applying"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[400px] gap-5"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
                <Loader2 size={28} className="animate-spin text-emerald-400" />
              </div>
              <div className="text-center">
                <h3 className="text-sm font-semibold text-white mb-1">
                  Creating {posts.length} posts...
                </h3>
                <p className="text-xs text-white/30">Writing markdown files to {selectedClient?.displayName} folder</p>
              </div>
            </motion.div>
          )}

          {/* ═══ STEP 4: Done ═══ */}
          {step === 'done' && applyResult && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[400px] gap-5"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center"
              >
                <CheckCircle2 size={36} className="text-emerald-400" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <h3 className="text-lg font-bold text-white mb-1">
                  Created {applyResult.created} posts!
                </h3>
                <p className="text-sm text-white/40">
                  Content for {applyResult.clientName} &middot; {MONTH_NAMES[month - 1]} {year}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="flex gap-3"
              >
                <button
                  onClick={navigateToCalendar}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-violet/15 hover:bg-accent-violet/25 text-accent-violet text-sm font-medium transition-all"
                >
                  <Calendar size={14} />
                  View in Calendar
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass glass-hover text-white/40 text-sm font-medium hover:text-white/60 transition-all"
                >
                  <Rocket size={14} />
                  New Pipeline
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Post Editor Modal */}
      <AnimatePresence>
        {editingPost && (
          <PostEditorModal
            post={editingPost}
            onSave={handleSavePost}
            onClose={() => setEditingPost(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
