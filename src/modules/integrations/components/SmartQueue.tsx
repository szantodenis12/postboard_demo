import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import {
  Workflow,
  Calendar,
  Clock,
  Play,
  CheckCircle2,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Trash2,
  Facebook,
  Instagram,
  Linkedin,
  FileText,
  AlertTriangle,
  Zap,
  ArrowUpDown,
  Ban,
  Settings2,
  Eye,
  Sparkles,
  CircleDot,
  BarChart3,
  CalendarOff,
  ListFilter,
} from 'lucide-react'
import { useApp } from '../../../core/context'
import type { Post, Platform } from '../../../core/types'

// ── Constants ──────────────────────────────────────────

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

const PLATFORM_COLORS: Record<string, string> = {
  facebook: '#1877F2',
  instagram: '#E4405F',
  linkedin: '#0A66C2',
  tiktok: '#ff0050',
  google: '#4285F4',
  stories: '#C13584',
}

const PLATFORM_ICONS: Record<string, typeof Facebook> = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  tiktok: FileText,
  google: FileText,
  stories: Instagram,
}

const PLATFORMS: Platform[] = ['facebook', 'instagram', 'linkedin', 'tiktok', 'google']

const DEFAULT_TIME_SLOTS = [
  { hour: 9, label: '09:00', quality: 'good' },
  { hour: 10, label: '10:00', quality: 'optimal' },
  { hour: 12, label: '12:00', quality: 'good' },
  { hour: 13, label: '13:00', quality: 'optimal' },
  { hour: 17, label: '17:00', quality: 'good' },
  { hour: 18, label: '18:00', quality: 'optimal' },
  { hour: 19, label: '19:00', quality: 'good' },
  { hour: 20, label: '20:00', quality: 'optimal' },
] as const

// ── Types ──────────────────────────────────────────────

interface BestTimeSlot {
  day: string
  hour: number
  avgEngagement: number
  postCount: number
  score: number
}

interface QueueSlot {
  id: string
  post: Post
  date: string       // YYYY-MM-DD
  time: string       // HH:MM
  quality: 'optimal' | 'good' | 'poor'
  dayOfWeek: string
}

interface QueueConfig {
  clientId: string | null
  startDate: string
  endDate: string
  postsPerDay: number
  platformPriority: Platform[]
  blackoutDates: string[]
  useOptimalTimes: boolean
}

// ── Helpers ────────────────────────────────────────────

function toISO(d: Date): string {
  return d.toISOString().split('T')[0]
}

function getDayName(d: Date): string {
  return ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][d.getDay()]
}

function getDayLabel(d: string): string {
  const map: Record<string, string> = {
    sunday: 'Sun', monday: 'Mon', tuesday: 'Tue',
    wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat',
  }
  return map[d] || d
}

function formatDateDisplay(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  const day = d.getDate()
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${day} ${months[d.getMonth()]}`
}

function getEndOfMonth(): string {
  const now = new Date()
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return toISO(last)
}

function getDateRange(start: string, end: string): string[] {
  const dates: string[] = []
  const d = new Date(start + 'T12:00:00')
  const endD = new Date(end + 'T12:00:00')
  while (d <= endD) {
    dates.push(toISO(d))
    d.setDate(d.getDate() + 1)
  }
  return dates
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str
  return str.slice(0, max) + '...'
}

// ── Component ──────────────────────────────────────────

export function SmartQueue() {
  const { data, updatePostDate, updatePostStatus, refresh } = useApp()

  // ── State ──────────────────────────────────────────
  const [config, setConfig] = useState<QueueConfig>({
    clientId: null,
    startDate: toISO(new Date()),
    endDate: getEndOfMonth(),
    postsPerDay: 2,
    platformPriority: ['facebook', 'instagram', 'linkedin'],
    blackoutDates: [],
    useOptimalTimes: true,
  })

  const [bestTimes, setBestTimes] = useState<BestTimeSlot[]>([])
  const [queue, setQueue] = useState<QueueSlot[]>([])
  const [showConfig, setShowConfig] = useState(true)
  const [showBlackouts, setShowBlackouts] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [applyProgress, setApplyProgress] = useState({ current: 0, total: 0 })
  const [applyResult, setApplyResult] = useState<{ count: number; days: number } | null>(null)
  const [setStatusOnApply, setSetStatusOnApply] = useState(true)
  const [addingBlackout, setAddingBlackout] = useState('')

  // ── Derived data ───────────────────────────────────

  const clients = data.clients

  const unscheduledPosts = useMemo(() => {
    let posts = data.clients.flatMap(c => c.posts)

    // Filter by client
    if (config.clientId) {
      posts = posts.filter(p => p.clientId === config.clientId)
    }

    // Only draft or approved posts without a future date assignment
    // (we treat posts that are still "draft" or "approved" as queue candidates)
    return posts.filter(p =>
      (p.status === 'draft' || p.status === 'approved')
    )
  }, [data.clients, config.clientId])

  const existingScheduled = useMemo(() => {
    let posts = data.clients.flatMap(c => c.posts)
    if (config.clientId) {
      posts = posts.filter(p => p.clientId === config.clientId)
    }
    return posts.filter(p => p.status === 'scheduled' || p.status === 'published')
  }, [data.clients, config.clientId])

  // ── Fetch best times ───────────────────────────────

  const fetchBestTimes = useCallback(async () => {
    if (!config.clientId) {
      setBestTimes([])
      return
    }
    try {
      const res = await fetch(`/api/intelligence/best-times?clientId=${config.clientId}`)
      const json = await res.json()
      setBestTimes(json.slots || [])
    } catch {
      setBestTimes([])
    }
  }, [config.clientId])

  useEffect(() => {
    fetchBestTimes()
  }, [fetchBestTimes])

  // ── Queue generation algorithm ─────────────────────

  const generateQueue = useCallback(() => {
    setIsGenerating(true)
    setApplyResult(null)

    // Small delay for UI feedback
    setTimeout(() => {
      const dates = getDateRange(config.startDate, config.endDate)
        .filter(d => !config.blackoutDates.includes(d))

      // Build a map of existing posts per date (to respect existing schedules)
      const postsPerDateMap = new Map<string, number>()
      for (const p of existingScheduled) {
        const count = postsPerDateMap.get(p.date) || 0
        postsPerDateMap.set(p.date, count + 1)
      }

      // Build best-time lookup: day → sorted hours
      const bestTimeMap = new Map<string, { hour: number; score: number }[]>()
      for (const slot of bestTimes) {
        const existing = bestTimeMap.get(slot.day) || []
        existing.push({ hour: slot.hour, score: slot.score })
        bestTimeMap.set(slot.day, existing)
      }
      // Sort each day's hours by score descending
      for (const [, hours] of bestTimeMap) {
        hours.sort((a, b) => b.score - a.score)
      }

      // Sort posts: approved first, then by pillar balance needs, then by platform priority
      // Count how many posts exist per pillar to determine under-represented ones
      const pillarCounts = new Map<string, number>()
      for (const p of unscheduledPosts) {
        if (p.pillar) {
          pillarCounts.set(p.pillar, (pillarCounts.get(p.pillar) || 0) + 1)
        }
      }
      const maxPillarCount = Math.max(...Array.from(pillarCounts.values()), 1)

      const sortedPosts = [...unscheduledPosts].sort((a, b) => {
        // Approved first
        if (a.status === 'approved' && b.status !== 'approved') return -1
        if (b.status === 'approved' && a.status !== 'approved') return 1

        // Prefer posts from under-represented pillars (lower count = higher priority)
        const aCount = a.pillar ? (pillarCounts.get(a.pillar) || 0) : maxPillarCount
        const bCount = b.pillar ? (pillarCounts.get(b.pillar) || 0) : maxPillarCount
        if (aCount !== bCount) return aCount - bCount

        // Prefer posts from higher-priority platforms
        const aPri = config.platformPriority.indexOf(a.platform as Platform)
        const bPri = config.platformPriority.indexOf(b.platform as Platform)
        const aIdx = aPri === -1 ? 999 : aPri
        const bIdx = bPri === -1 ? 999 : bPri
        if (aIdx !== bIdx) return aIdx - bIdx

        return 0
      })

      // Distribute posts across dates
      const newQueue: QueueSlot[] = []
      let lastPillar = ''
      let lastPlatform = ''

      for (const date of dates) {
        if (sortedPosts.length === 0) break

        const existingCount = postsPerDateMap.get(date) || 0
        const availableSlots = Math.max(0, config.postsPerDay - existingCount)

        if (availableSlots === 0) continue

        const dateObj = new Date(date + 'T12:00:00')
        const dayName = getDayName(dateObj)

        // Get best hours for this day
        const dayBestHours = bestTimeMap.get(dayName) || []
        const defaultHours = DEFAULT_TIME_SLOTS.map(s => ({
          hour: s.hour,
          score: s.quality === 'optimal' ? 80 : 50,
        }))
        const availableHours = config.useOptimalTimes && dayBestHours.length > 0
          ? dayBestHours
          : defaultHours

        let slotsUsed = 0

        for (let h = 0; h < availableHours.length && slotsUsed < availableSlots; h++) {
          if (sortedPosts.length === 0) break

          // Pick next post, respecting pillar variety AND platform spread
          let picked: Post | null = null
          let pickedIdx = -1
          let bestScore = -1

          for (let j = 0; j < sortedPosts.length; j++) {
            const candidate = sortedPosts[j]
            let score = 0

            // Pillar variety: strongly prefer different pillar than last
            if (!lastPillar || candidate.pillar !== lastPillar) score += 10
            // Platform spread: prefer different platform than last
            if (!lastPlatform || candidate.platform !== lastPlatform) score += 5
            // Approved posts get a small boost
            if (candidate.status === 'approved') score += 2

            if (score > bestScore) {
              bestScore = score
              picked = candidate
              pickedIdx = j
            }

            // Perfect match — no need to keep searching
            if (score >= 17) break
          }

          // Fallback: just take the first one
          if (!picked) {
            picked = sortedPosts[0]
            pickedIdx = 0
          }

          // Remove picked post from sortedPosts
          sortedPosts.splice(pickedIdx, 1)

          const hourData = availableHours[h]
          const quality: QueueSlot['quality'] =
            hourData.score >= 70 ? 'optimal' :
            hourData.score >= 40 ? 'good' : 'poor'

          newQueue.push({
            id: `${picked.id}-${date}`,
            post: picked,
            date,
            time: `${String(hourData.hour).padStart(2, '0')}:00`,
            quality,
            dayOfWeek: dayName,
          })

          lastPillar = picked.pillar || ''
          lastPlatform = picked.platform || ''
          slotsUsed++
        }
      }

      setQueue(newQueue)
      setIsGenerating(false)
    }, 300)
  }, [config, unscheduledPosts, existingScheduled, bestTimes])

  // ── Apply queue ────────────────────────────────────

  const applyQueue = async () => {
    if (queue.length === 0) return
    setIsApplying(true)
    setApplyProgress({ current: 0, total: queue.length })

    const uniqueDays = new Set<string>()
    let successCount = 0

    for (let i = 0; i < queue.length; i++) {
      const slot = queue[i]
      try {
        // Update the date
        await updatePostDate(slot.post.id, slot.date)

        // Optionally update status to scheduled
        if (setStatusOnApply) {
          await updatePostStatus(slot.post.id, 'scheduled')
        }

        uniqueDays.add(slot.date)
        successCount++
      } catch {
        // Continue with next post on failure
      }
      setApplyProgress({ current: i + 1, total: queue.length })
    }

    setApplyResult({ count: successCount, days: uniqueDays.size })
    setIsApplying(false)
    setQueue([])
    refresh()
  }

  // ── Remove from queue ──────────────────────────────

  const removeFromQueue = (slotId: string) => {
    setQueue(prev => prev.filter(s => s.id !== slotId))
  }

  // ── Stats ──────────────────────────────────────────

  const queueStats = useMemo(() => {
    const platforms = new Map<string, number>()
    const pillars = new Map<string, number>()
    const days = new Set<string>()

    for (const slot of queue) {
      platforms.set(slot.post.platform, (platforms.get(slot.post.platform) || 0) + 1)
      if (slot.post.pillar) {
        pillars.set(slot.post.pillar, (pillars.get(slot.post.pillar) || 0) + 1)
      }
      days.add(slot.date)
    }

    return {
      totalPosts: queue.length,
      totalDays: days.size,
      platforms: Array.from(platforms.entries()),
      pillars: Array.from(pillars.entries()),
      optimalSlots: queue.filter(s => s.quality === 'optimal').length,
    }
  }, [queue])

  // ── Group queue by date for timeline ───────────────

  const groupedQueue = useMemo(() => {
    const groups = new Map<string, QueueSlot[]>()
    for (const slot of queue) {
      const existing = groups.get(slot.date) || []
      existing.push(slot)
      groups.set(slot.date, existing)
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [queue])

  // ── Platform icon helper ───────────────────────────

  const PlatformIcon = ({ platform, size = 14 }: { platform: string; size?: number }) => {
    const Icon = PLATFORM_ICONS[platform] || FileText
    return <Icon size={size} style={{ color: PLATFORM_COLORS[platform] || '#64748b' }} />
  }

  // ── Render ─────────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-8 pt-8 pb-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-cyan/20 flex items-center justify-center">
              <Workflow className="w-5 h-5 text-accent-cyan" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Smart Queue</h1>
              <p className="text-sm text-white/40">
                Distribute posts across optimal time slots automatically
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {queue.length > 0 && !isApplying && (
              <button
                onClick={() => setQueue([])}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-sm transition-colors"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            )}
            <button
              onClick={generateQueue}
              disabled={isGenerating || unscheduledPosts.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-cyan/20 hover:bg-accent-cyan/30 text-accent-cyan text-sm font-medium transition-colors disabled:opacity-30"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Generate Queue
            </button>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scroll-area px-8 pb-8">
        {/* Configuration Panel */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl mb-6 overflow-hidden"
        >
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-3">
              <Settings2 className="w-4 h-4 text-white/40" />
              <span className="text-white font-semibold text-sm">Queue Configuration</span>
              <span className="text-xs text-white/20 ml-2">
                {unscheduledPosts.length} posts available
              </span>
            </div>
            {showConfig ? (
              <ChevronUp className="w-4 h-4 text-white/30" />
            ) : (
              <ChevronDown className="w-4 h-4 text-white/30" />
            )}
          </button>

          <AnimatePresence>
            {showConfig && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6 space-y-5 border-t border-white/5 pt-5">
                  {/* Row 1: Client + Date Range */}
                  <div className="grid grid-cols-3 gap-4">
                    {/* Client */}
                    <div>
                      <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">
                        Client
                      </label>
                      <select
                        value={config.clientId || ''}
                        onChange={e => setConfig(c => ({
                          ...c,
                          clientId: e.target.value || null,
                        }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent-cyan/50 transition-colors appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-[#1a1a2e]">All Clients</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id} className="bg-[#1a1a2e]">
                            {c.displayName}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Start Date */}
                    <div>
                      <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={config.startDate}
                        onChange={e => setConfig(c => ({ ...c, startDate: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent-cyan/50 transition-colors"
                      />
                    </div>

                    {/* End Date */}
                    <div>
                      <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={config.endDate}
                        onChange={e => setConfig(c => ({ ...c, endDate: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent-cyan/50 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Row 2: Posts per day + Optimal times toggle */}
                  <div className="flex items-end gap-6">
                    {/* Posts per day */}
                    <div>
                      <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">
                        Posts / Day
                      </label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button
                            key={n}
                            onClick={() => setConfig(c => ({ ...c, postsPerDay: n }))}
                            className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${
                              config.postsPerDay === n
                                ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30'
                                : 'bg-white/5 text-white/40 hover:text-white/60 border border-transparent'
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Optimal times toggle */}
                    <div className="flex items-center gap-3 pb-1">
                      <button
                        onClick={() => setConfig(c => ({ ...c, useOptimalTimes: !c.useOptimalTimes }))}
                        className={`relative w-10 h-5 rounded-full transition-colors ${
                          config.useOptimalTimes ? 'bg-accent-cyan' : 'bg-white/10'
                        }`}
                      >
                        <div
                          className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                          style={{ transform: config.useOptimalTimes ? 'translateX(20px)' : 'translateX(2px)' }}
                        />
                      </button>
                      <div>
                        <span className="text-sm text-white/70">Use best-times data</span>
                        {bestTimes.length > 0 && config.useOptimalTimes && (
                          <span className="ml-2 text-xs text-accent-cyan/60">
                            {bestTimes.length} slots loaded
                          </span>
                        )}
                        {bestTimes.length === 0 && config.useOptimalTimes && config.clientId && (
                          <span className="ml-2 text-xs text-amber-400/60">
                            No data — using defaults
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Platform Priority */}
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                      <ArrowUpDown className="w-3 h-3" />
                      Platform Priority
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PLATFORMS.map(p => {
                        const isActive = config.platformPriority.includes(p)
                        const rank = config.platformPriority.indexOf(p)
                        return (
                          <button
                            key={p}
                            onClick={() => {
                              setConfig(c => {
                                const next = [...c.platformPriority]
                                if (isActive) {
                                  return { ...c, platformPriority: next.filter(x => x !== p) }
                                }
                                return { ...c, platformPriority: [...next, p] }
                              })
                            }}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors border ${
                              isActive
                                ? 'border-white/20 bg-white/5 text-white/80'
                                : 'border-white/5 bg-white/[0.02] text-white/25 hover:text-white/40'
                            }`}
                          >
                            {isActive && (
                              <span className="w-4 h-4 rounded-full bg-accent-cyan/20 text-accent-cyan text-[10px] flex items-center justify-center font-bold">
                                {rank + 1}
                              </span>
                            )}
                            <PlatformIcon platform={p} size={12} />
                            <span className="capitalize">{p}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Row 4: Blackout Dates */}
                  <div>
                    <button
                      onClick={() => setShowBlackouts(!showBlackouts)}
                      className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 transition-colors mb-2"
                    >
                      <CalendarOff className="w-3 h-3" />
                      Blackout Dates ({config.blackoutDates.length})
                      {showBlackouts ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>

                    <AnimatePresence>
                      {showBlackouts && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <input
                              type="date"
                              value={addingBlackout}
                              onChange={e => setAddingBlackout(e.target.value)}
                              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent-cyan/50 transition-colors"
                            />
                            <button
                              onClick={() => {
                                if (addingBlackout && !config.blackoutDates.includes(addingBlackout)) {
                                  setConfig(c => ({
                                    ...c,
                                    blackoutDates: [...c.blackoutDates, addingBlackout].sort(),
                                  }))
                                  setAddingBlackout('')
                                }
                              }}
                              disabled={!addingBlackout}
                              className="px-3 py-1.5 rounded-lg bg-white/5 text-xs text-white/60 hover:bg-white/10 transition-colors disabled:opacity-30"
                            >
                              Add
                            </button>
                          </div>
                          {config.blackoutDates.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {config.blackoutDates.map(d => (
                                <span
                                  key={d}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/10 text-red-400/80 text-xs"
                                >
                                  <Ban className="w-3 h-3" />
                                  {formatDateDisplay(d)}
                                  <button
                                    onClick={() => setConfig(c => ({
                                      ...c,
                                      blackoutDates: c.blackoutDates.filter(x => x !== d),
                                    }))}
                                    className="ml-0.5 hover:text-red-300 transition-colors"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Stats bar (when queue has items) */}
        <AnimatePresence>
          {queue.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass rounded-2xl p-5 mb-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-accent-cyan" />
                  Queue Summary
                </h3>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-white/40">
                    <span className="text-white font-bold text-base mr-1">
                      {queueStats.totalPosts}
                    </span>
                    posts
                  </span>
                  <span className="text-white/40">
                    <span className="text-white font-bold text-base mr-1">
                      {queueStats.totalDays}
                    </span>
                    days
                  </span>
                  <span className="text-white/40">
                    <span className="text-emerald-400 font-bold text-base mr-1">
                      {queueStats.optimalSlots}
                    </span>
                    optimal
                  </span>
                </div>
              </div>

              {/* Distribution bars */}
              <div className="grid grid-cols-2 gap-4">
                {/* Platform distribution */}
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Platforms</p>
                  <div className="flex gap-1.5">
                    {queueStats.platforms.map(([platform, count]) => (
                      <div
                        key={platform}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs"
                        style={{ background: `${PLATFORM_COLORS[platform] || '#64748b'}15` }}
                      >
                        <PlatformIcon platform={platform} size={11} />
                        <span style={{ color: PLATFORM_COLORS[platform] || '#64748b' }}>
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pillar distribution */}
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Pillars</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {queueStats.pillars.map(([pillar, count]) => (
                      <div
                        key={pillar}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs"
                        style={{ background: `${PILLAR_COLORS[pillar] || '#64748b'}15` }}
                      >
                        <CircleDot
                          className="w-2.5 h-2.5"
                          style={{ color: PILLAR_COLORS[pillar] || '#64748b' }}
                        />
                        <span
                          className="capitalize"
                          style={{ color: PILLAR_COLORS[pillar] || '#64748b' }}
                        >
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Queue Timeline */}
        {queue.length > 0 && !isApplying && !applyResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Queue Preview
              </h2>
              <span className="text-xs text-white/20">
                Drag to reorder within days
              </span>
            </div>

            <div className="space-y-1">
              {groupedQueue.map(([date, slots], groupIdx) => {
                const dateObj = new Date(date + 'T12:00:00')
                const dayName = getDayName(dateObj)
                const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6

                return (
                  <motion.div
                    key={date}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * groupIdx }}
                    className="flex gap-3"
                  >
                    {/* Date column */}
                    <div className="w-16 shrink-0 pt-3 text-right">
                      <p className={`text-sm font-bold ${isWeekend ? 'text-white/30' : 'text-white/70'}`}>
                        {formatDateDisplay(date)}
                      </p>
                      <p className="text-[10px] text-white/20 uppercase">
                        {getDayLabel(dayName)}
                      </p>
                    </div>

                    {/* Timeline line */}
                    <div className="flex flex-col items-center pt-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-accent-cyan/40 border-2 border-accent-cyan/20 shrink-0" />
                      <div className="w-[1px] flex-1 bg-white/5" />
                    </div>

                    {/* Posts for this day */}
                    <div className="flex-1 pb-3 pt-1 space-y-1.5">
                      <Reorder.Group
                        axis="y"
                        values={slots}
                        onReorder={newOrder => {
                          setQueue(prev => {
                            const other = prev.filter(s => s.date !== date)
                            return [...other, ...newOrder].sort((a, b) => {
                              if (a.date !== b.date) return a.date.localeCompare(b.date)
                              return a.time.localeCompare(b.time)
                            })
                          })
                        }}
                        className="space-y-1.5"
                      >
                        {slots.map(slot => (
                          <Reorder.Item
                            key={slot.id}
                            value={slot}
                            className="glass rounded-xl p-3 cursor-grab active:cursor-grabbing group"
                            whileDrag={{ scale: 1.02, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
                          >
                            <div className="flex items-center gap-3">
                              {/* Drag handle */}
                              <GripVertical className="w-3.5 h-3.5 text-white/10 group-hover:text-white/25 transition-colors shrink-0" />

                              {/* Time + quality */}
                              <div className="flex items-center gap-1.5 w-16 shrink-0">
                                <div
                                  className="w-1.5 h-1.5 rounded-full shrink-0"
                                  style={{
                                    background:
                                      slot.quality === 'optimal' ? '#10b981' :
                                      slot.quality === 'good' ? '#f59e0b' : '#ef4444',
                                  }}
                                />
                                <Clock className="w-3 h-3 text-white/20" />
                                <span className="text-xs text-white/50 font-mono">{slot.time}</span>
                              </div>

                              {/* Platform */}
                              <div className="shrink-0">
                                <PlatformIcon platform={slot.post.platform} size={14} />
                              </div>

                              {/* Pillar dot */}
                              {slot.post.pillar && (
                                <div
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ background: PILLAR_COLORS[slot.post.pillar] || '#64748b' }}
                                  title={slot.post.pillar}
                                />
                              )}

                              {/* Caption preview */}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-white/60 truncate">
                                  {truncate(slot.post.caption, 80)}
                                </p>
                              </div>

                              {/* Client name (if showing all) */}
                              {!config.clientId && (
                                <span className="text-[10px] text-white/20 shrink-0 max-w-[80px] truncate">
                                  {slot.post.clientName}
                                </span>
                              )}

                              {/* Pillar tag */}
                              {slot.post.pillar && (
                                <span
                                  className="text-[10px] px-1.5 py-0.5 rounded-md shrink-0 capitalize"
                                  style={{
                                    background: `${PILLAR_COLORS[slot.post.pillar] || '#64748b'}15`,
                                    color: `${PILLAR_COLORS[slot.post.pillar] || '#64748b'}cc`,
                                  }}
                                >
                                  {slot.post.pillar}
                                </span>
                              )}

                              {/* Status badge */}
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-md shrink-0 ${
                                slot.post.status === 'approved'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : 'bg-white/5 text-white/30'
                              }`}>
                                {slot.post.status}
                              </span>

                              {/* Remove */}
                              <button
                                onClick={() => removeFromQueue(slot.id)}
                                className="p-1 rounded-lg text-white/10 hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </Reorder.Item>
                        ))}
                      </Reorder.Group>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Apply section */}
        <AnimatePresence>
          {queue.length > 0 && !isApplying && !applyResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass rounded-2xl p-6 mt-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSetStatusOnApply(!setStatusOnApply)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${
                        setStatusOnApply ? 'bg-accent-cyan' : 'bg-white/10'
                      }`}
                    >
                      <div
                        className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                        style={{ transform: setStatusOnApply ? 'translateX(20px)' : 'translateX(2px)' }}
                      />
                    </button>
                    <span className="text-sm text-white/50">
                      Also set status to "scheduled"
                    </span>
                  </div>
                </div>

                <button
                  onClick={applyQueue}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-cyan hover:bg-accent-cyan/80 text-white font-medium text-sm transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Schedule All ({queue.length} posts)
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress bar */}
        <AnimatePresence>
          {isApplying && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass rounded-2xl p-6 mt-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <Loader2 className="w-5 h-5 text-accent-cyan animate-spin" />
                <span className="text-white font-semibold text-sm">
                  Scheduling posts...
                </span>
                <span className="text-white/40 text-sm">
                  {applyProgress.current} / {applyProgress.total}
                </span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full bg-accent-cyan rounded-full"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${applyProgress.total > 0 ? (applyProgress.current / applyProgress.total) * 100 : 0}%`,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success result */}
        <AnimatePresence>
          {applyResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="glass rounded-2xl p-8 mt-6 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </motion.div>
              <h3 className="text-white font-bold text-lg mb-1">Queue Applied</h3>
              <p className="text-white/50 text-sm">
                Scheduled <span className="text-white font-semibold">{applyResult.count}</span> posts
                across <span className="text-white font-semibold">{applyResult.days}</span> days
              </p>
              <button
                onClick={() => setApplyResult(null)}
                className="mt-4 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-sm transition-colors"
              >
                Done
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {queue.length === 0 && !isApplying && !applyResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-12 text-center"
          >
            {unscheduledPosts.length === 0 ? (
              <>
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <ListFilter className="w-7 h-7 text-white/15" />
                </div>
                <h3 className="text-white/40 font-semibold mb-1">No posts to queue</h3>
                <p className="text-white/20 text-sm max-w-sm mx-auto">
                  {config.clientId
                    ? 'This client has no draft or approved posts available for scheduling.'
                    : 'There are no draft or approved posts across any client. Create some content first.'}
                </p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-accent-cyan/10 flex items-center justify-center mx-auto mb-4">
                  <Workflow className="w-7 h-7 text-accent-cyan/40" />
                </div>
                <h3 className="text-white/50 font-semibold mb-1">Ready to generate</h3>
                <p className="text-white/25 text-sm max-w-sm mx-auto">
                  {unscheduledPosts.length} unscheduled post{unscheduledPosts.length !== 1 ? 's' : ''} available.
                  Configure your preferences above, then hit "Generate Queue" to distribute them optimally.
                </p>
              </>
            )}
          </motion.div>
        )}

        {/* How it works */}
        {queue.length === 0 && !isApplying && !applyResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-2xl p-6 mt-6"
          >
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              How Smart Queue Works
            </h3>
            <div className="space-y-2 text-sm text-white/50">
              <p>
                <span className="text-white/70">1.</span> Collects all
                <span className="text-emerald-400 font-medium"> draft</span> and
                <span className="text-accent-cyan font-medium"> approved</span> posts
                for the selected client.
              </p>
              <p>
                <span className="text-white/70">2.</span> Fetches
                <span className="text-white/70"> best-times engagement data</span> to
                pick optimal time slots per day of the week.
              </p>
              <p>
                <span className="text-white/70">3.</span> Distributes posts across the date range
                while ensuring <span className="text-white/70">pillar variety</span> (no consecutive same pillar)
                and <span className="text-white/70">platform spread</span>.
              </p>
              <p>
                <span className="text-white/70">4.</span> Respects existing scheduled posts — won't
                <span className="text-white/70"> double-book</span> time slots beyond your daily limit.
              </p>
              <p>
                <span className="text-white/70">5.</span> Review the preview, drag to reorder, then
                <span className="text-accent-cyan font-medium"> Schedule All</span> to apply dates
                to each post via the API.
              </p>
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-4 text-xs text-white/30">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                Optimal slot
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                Good slot
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                Off-peak slot
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
