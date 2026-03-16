import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, X, GripVertical,
  CalendarDays, LayoutGrid, Flag, Sparkles,
  Wand2, Loader2, Trash2,
} from 'lucide-react'
import { useState, useMemo, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { useApp } from '../../../core/context'
import { useToast } from '../../../core/ui/ToastProvider'
import { PlatformDot, PlatformBadge } from '../../../core/ui/PlatformBadge'
import { StatusBadge } from '../../../core/ui/StatusBadge'
import { PostDetailModal } from './PostDetailModal'
import { usePublish } from '../hooks/usePublish'
import type { Post } from '../../../core/types'
import {
  getEventsForYear, getPillarColor, getMondayOf, getWeekDates,
  type CalendarEvent,
} from './calendar-utils'

interface CalendarPost extends Post {
  color: string
}

type ViewMode = 'month' | 'week'

// ═══════════════════════════════════════════════════════════
// CalendarView — Main Component
// ═══════════════════════════════════════════════════════════

export function CalendarView() {
  const {
    data, selectedClient, setSelectedClient,
    updatePostStatus, updatePostCaption, updatePostDate, getPublishConfig, getImageUrl, deletePost,
  } = useApp()
  const { toast } = useToast()
  const handlePublish = usePublish()
  const clients = data.clients

  // ── View state ─────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [selectedPillars, setSelectedPillars] = useState<Set<string>>(new Set())
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overDate, setOverDate] = useState<string | null>(null)

  // ── Month state ────────────────────────────────────
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  // ── AI Auto-Fill state ───────────────────────────────
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiResult, setAiResult] = useState('')
  const [showAiPanel, setShowAiPanel] = useState(false)

  const handleAiCalendarFill = useCallback(async () => {
    const clientId = selectedClient || clients[0]?.id
    if (!clientId) return
    setAiGenerating(true)
    setAiResult('')
    setShowAiPanel(true)
    try {
      const res = await fetch('/api/intelligence/calendar-fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          month: currentMonth.month + 1,
          year: currentMonth.year,
          postsPerWeek: 3,
        }),
      })
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            const d = line.slice(6)
            if (d === '[DONE]') break
            try {
              const parsed = JSON.parse(d)
              if (parsed.text) setAiResult(prev => prev + parsed.text)
            } catch {}
          }
        }
      }
    } catch (err) {
      console.error('AI calendar fill error:', err)
    }
    setAiGenerating(false)
  }, [selectedClient, clients, currentMonth])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // ── Week state ─────────────────────────────────────
  const [weekStart, setWeekStart] = useState<Date>(() => getMondayOf(new Date()))

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  // ── Data ───────────────────────────────────────────
  const allPosts = useMemo<CalendarPost[]>(() => {
    const filtered = selectedClient
      ? clients.filter(c => c.id === selectedClient)
      : clients
    return filtered.flatMap(c =>
      c.posts.map(p => ({ ...p, color: c.color }))
    )
  }, [clients, selectedClient])

  // ── Pillars ────────────────────────────────────────
  const allPillars = useMemo(() => {
    const set = new Set<string>()
    allPosts.forEach(p => { if (p.pillar) set.add(p.pillar) })
    return Array.from(set).sort()
  }, [allPosts])

  const filteredPosts = useMemo(() => {
    if (selectedPillars.size === 0) return allPosts
    return allPosts.filter(p => p.pillar && selectedPillars.has(p.pillar))
  }, [allPosts, selectedPillars])

  // ── Posts by date ──────────────────────────────────
  const postsByDate = useMemo(() => {
    const map: Record<string, CalendarPost[]> = {}
    for (const post of filteredPosts) {
      if (!map[post.date]) map[post.date] = []
      map[post.date].push(post)
    }
    return map
  }, [filteredPosts])

  // ── Calendar geometry ──────────────────────────────
  const { year, month } = currentMonth
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPad = (firstDay.getDay() + 6) % 7
  const totalDays = lastDay.getDate()
  const today = new Date().toISOString().split('T')[0]
  const selectedDayPosts = selectedDate ? (postsByDate[selectedDate] || []) : []
  const activePost = activeId ? filteredPosts.find(p => p.id === activeId) : null

  // ── Holidays ───────────────────────────────────────
  const eventsMap = useMemo(() => {
    const years = new Set<number>()
    if (viewMode === 'month') {
      years.add(year)
    } else {
      getWeekDates(weekStart).forEach(d => years.add(new Date(d).getFullYear()))
    }
    const result: Record<string, CalendarEvent[]> = {}
    for (const y of years) {
      Object.assign(result, getEventsForYear(y))
    }
    return result
  }, [viewMode, year, weekStart])

  // ── Week data ──────────────────────────────────────
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart])

  // ── Post count for current view ────────────────────
  const postsInView = useMemo(() => {
    if (viewMode === 'month') {
      const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
      return filteredPosts.filter(p => p.date.startsWith(prefix)).length
    }
    const dates = new Set(weekDates)
    return filteredPosts.filter(p => dates.has(p.date)).length
  }, [filteredPosts, viewMode, year, month, weekDates])

  // ── Labels ─────────────────────────────────────────
  const monthLabel = firstDay.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })
  const weekLabel = useMemo(() => {
    const first = new Date(weekDates[0])
    const last = new Date(weekDates[6])
    if (first.getMonth() === last.getMonth()) {
      return `${first.getDate()}–${last.getDate()} ${first.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })}`
    }
    return `${first.getDate()} ${first.toLocaleDateString('ro-RO', { month: 'short' })} – ${last.getDate()} ${last.toLocaleDateString('ro-RO', { month: 'short', year: 'numeric' })}`
  }, [weekDates])

  // ── Navigation ─────────────────────────────────────
  const prevMonth = () =>
    setCurrentMonth(prev => {
      const d = new Date(prev.year, prev.month - 1, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  const nextMonth = () =>
    setCurrentMonth(prev => {
      const d = new Date(prev.year, prev.month + 1, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  const prevWeek = () =>
    setWeekStart(prev => { const d = new Date(prev); d.setDate(d.getDate() - 7); return d })
  const nextWeek = () =>
    setWeekStart(prev => { const d = new Date(prev); d.setDate(d.getDate() + 7); return d })

  const goToday = () => {
    const now = new Date()
    if (viewMode === 'month') {
      setCurrentMonth({ year: now.getFullYear(), month: now.getMonth() })
    } else {
      setWeekStart(getMondayOf(now))
    }
  }

  const switchToWeek = () => {
    setViewMode('week')
    if (selectedDate) {
      setWeekStart(getMondayOf(new Date(selectedDate)))
    } else {
      const now = new Date()
      if (now.getFullYear() === year && now.getMonth() === month) {
        setWeekStart(getMondayOf(now))
      } else {
        setWeekStart(getMondayOf(new Date(year, month, 1)))
      }
    }
    setSelectedDate(null)
  }

  const switchToMonth = () => {
    setViewMode('month')
    const d = new Date(weekDates[0])
    setCurrentMonth({ year: d.getFullYear(), month: d.getMonth() })
  }

  const togglePillar = (pillar: string) => {
    setSelectedPillars(prev => {
      const next = new Set(prev)
      if (next.has(pillar)) next.delete(pillar)
      else next.add(pillar)
      return next
    })
  }

  const getClientColor = (post: Post) => data.clients.find(cl => cl.id === post.clientId)?.color

  const prev = viewMode === 'month' ? prevMonth : prevWeek
  const next = viewMode === 'month' ? nextMonth : nextWeek

  // ── DnD handlers ───────────────────────────────────
  const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string)

  const handleDragOver = (e: DragOverEvent) => {
    const { over } = e
    if (!over) { setOverDate(null); return }
    const id = over.id as string
    if (id.match(/^\d{4}-\d{2}-\d{2}$/)) {
      setOverDate(id)
    } else {
      const p = filteredPosts.find(x => x.id === id)
      setOverDate(p?.date || null)
    }
  }

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    setActiveId(null)
    setOverDate(null)
    if (!over) return

    const postId = active.id as string
    const overId = over.id as string
    let targetDate: string | null = null

    if (overId.match(/^\d{4}-\d{2}-\d{2}$/)) {
      targetDate = overId
    } else {
      const p = filteredPosts.find(x => x.id === overId)
      if (p) targetDate = p.date
    }

    if (!targetDate) return
    const post = filteredPosts.find(p => p.id === postId)
    if (!post || post.date === targetDate) return

    updatePostDate(postId, targetDate)
    const dateLabel = new Date(targetDate).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })
    toast('info', `Moved to ${dateLabel}`)
  }

  // ═════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════

  return (
    <div className="h-full flex gap-4">
      {/* Calendar grid */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ── Header ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-4"
        >
          <div>
            <h2 className="text-2xl font-bold text-white capitalize">
              {viewMode === 'month' ? monthLabel : weekLabel}
            </h2>
            <p className="text-sm text-white/30 mt-0.5">
              {postsInView} post{postsInView !== 1 ? 's' : ''} this {viewMode === 'month' ? 'month' : 'week'}
              <span className="text-white/15 ml-2">— drag posts to reschedule</span>
              {selectedClient && (
                <button
                  onClick={() => setSelectedClient(null)}
                  className="ml-2 text-accent-cyan hover:underline"
                >
                  show all
                </button>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* AI Calendar Fill */}
            <button
              onClick={handleAiCalendarFill}
              disabled={aiGenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-accent-violet/20 to-accent-cyan/20 text-accent-cyan hover:from-accent-violet/30 hover:to-accent-cyan/30 border border-accent-cyan/20 transition-all disabled:opacity-50"
            >
              {aiGenerating ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
              AI Fill Month
            </button>

            <div className="w-px h-5 bg-white/[0.06]" />

            {/* View mode toggle */}
            <div className="flex items-center glass rounded-lg p-0.5">
              <button
                onClick={switchToMonth}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all
                  ${viewMode === 'month' ? 'bg-white/[0.08] text-white' : 'text-white/35 hover:text-white/60'}`}
              >
                <LayoutGrid size={13} />
                Month
              </button>
              <button
                onClick={switchToWeek}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all
                  ${viewMode === 'week' ? 'bg-white/[0.08] text-white' : 'text-white/35 hover:text-white/60'}`}
              >
                <CalendarDays size={13} />
                Week
              </button>
            </div>

            <div className="w-px h-5 bg-white/[0.06]" />

            <button
              onClick={goToday}
              className="px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/70 glass glass-hover transition-all"
            >
              Today
            </button>
            <button onClick={prev} className="p-2 rounded-lg glass glass-hover transition-all">
              <ChevronLeft size={16} className="text-white/50" />
            </button>
            <button onClick={next} className="p-2 rounded-lg glass glass-hover transition-all">
              <ChevronRight size={16} className="text-white/50" />
            </button>
          </div>
        </motion.div>

        {/* ── Pillar filter ───────────────────────── */}
        {allPillars.length > 0 && (
          <div className="flex items-center gap-1.5 mb-3 overflow-x-auto no-scrollbar pb-0.5">
            <Sparkles size={12} className="text-white/20 shrink-0" />
            {allPillars.map(pillar => {
              const active = selectedPillars.has(pillar)
              const color = getPillarColor(pillar)
              return (
                <button
                  key={pillar}
                  onClick={() => togglePillar(pillar)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all shrink-0"
                  style={{
                    background: active ? `${color}20` : 'transparent',
                    border: `1px solid ${active ? `${color}40` : 'rgba(255,255,255,0.06)'}`,
                    color: active ? color : 'rgba(255,255,255,0.35)',
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: active ? color : 'rgba(255,255,255,0.2)' }}
                  />
                  {pillar}
                </button>
              )
            })}
            {selectedPillars.size > 0 && (
              <button
                onClick={() => setSelectedPillars(new Set())}
                className="text-[10px] text-white/25 hover:text-white/50 ml-1 shrink-0 transition-colors"
              >
                clear
              </button>
            )}
          </div>
        )}

        {/* ── DnD Calendar ────────────────────────── */}
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={() => { setActiveId(null); setOverDate(null) }}
        >
          {viewMode === 'month' ? (
            <>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'].map(day => (
                  <div key={day} className="text-center text-[10px] uppercase tracking-wider text-white/20 font-semibold py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Month grid */}
              <div className="grid grid-cols-7 gap-1 flex-1 auto-rows-fr">
                {Array.from({ length: startPad }).map((_, i) => (
                  <div key={`pad-${i}`} className="rounded-lg bg-white/[0.01] min-h-[80px]" />
                ))}
                {Array.from({ length: totalDays }).map((_, i) => {
                  const day = i + 1
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const dayPosts = postsByDate[dateStr] || []
                  const isToday = dateStr === today
                  const isWeekend = ((startPad + i) % 7) >= 5
                  const isSelected = dateStr === selectedDate
                  const isDragOver = dateStr === overDate && activePost?.date !== dateStr
                  const events = eventsMap[dateStr]

                  return (
                    <DroppableDay
                      key={dateStr}
                      dateStr={dateStr}
                      day={day}
                      dayPosts={dayPosts}
                      isToday={isToday}
                      isWeekend={isWeekend}
                      isSelected={isSelected}
                      isDragOver={isDragOver}
                      activeId={activeId}
                      events={events}
                      onSelectDate={() => dayPosts.length > 0 && setSelectedDate(isSelected ? null : dateStr)}
                      index={i}
                    />
                  )
                })}
              </div>
            </>
          ) : (
            /* ── Week view ──────────────────────────── */
            <div className="flex-1 grid grid-cols-7 gap-2 min-h-0">
              {weekDates.map((dateStr, i) => {
                const d = new Date(dateStr)
                const dayPosts = postsByDate[dateStr] || []
                const isToday = dateStr === today
                const isWeekend = i >= 5
                const isDragOver = dateStr === overDate && activePost?.date !== dateStr
                const events = eventsMap[dateStr]

                return (
                  <DroppableWeekDay
                    key={dateStr}
                    dateStr={dateStr}
                    date={d}
                    dayPosts={dayPosts}
                    isToday={isToday}
                    isWeekend={isWeekend}
                    isDragOver={isDragOver}
                    activeId={activeId}
                    events={events}
                    onPostClick={setSelectedPost}
                    onRemovePost={deletePost}
                    getImageUrl={getImageUrl}
                  />
                )
              })}
            </div>
          )}

          <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18,0.67,0.6,1.22)' }}>
            {activePost && <DragPill post={activePost} />}
          </DragOverlay>
        </DndContext>
      </div>

      {/* ── Day detail sidebar (month view) ─────── */}
      <AnimatePresence>
        {viewMode === 'month' && selectedDate && selectedDayPosts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20, width: 0 }}
            animate={{ opacity: 1, x: 0, width: 320 }}
            exit={{ opacity: 0, x: 20, width: 0 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="h-full flex flex-col shrink-0 overflow-hidden"
          >
            <div className="glass rounded-2xl h-full flex flex-col overflow-hidden">
              <div className="p-4 pb-3 border-b border-white/[0.06] flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">
                    {new Date(selectedDate).toLocaleDateString('ro-RO', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-white/30">
                      {selectedDayPosts.length} post{selectedDayPosts.length !== 1 ? 's' : ''}
                    </span>
                    {eventsMap[selectedDate] && (
                      <span className={`text-[10px] flex items-center gap-1 ${
                        eventsMap[selectedDate][0].type === 'public' ? 'text-red-400/60' : 'text-accent-cyan/50'
                      }`}>
                        <Flag size={9} />
                        {eventsMap[selectedDate].map(e => e.name).join(', ')}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
                >
                  <X size={14} className="text-white/40" />
                </button>
              </div>

              <div className="flex-1 scroll-area p-3 space-y-2">
                {selectedDayPosts.map((post, i) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedPost(post)}
                    className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] cursor-pointer transition-all group/day-post"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: post.color }}
                      />
                      <span className="text-[11px] font-medium truncate" style={{ color: post.color }}>
                        {post.clientName}
                      </span>
                      <div className="ml-auto">
                        <PlatformBadge platform={post.platform} />
                      </div>
                    </div>
                    {getImageUrl(post.id) && (
                      <div className="mb-2 rounded-lg overflow-hidden h-[80px]">
                        <img src={getImageUrl(post.id)!} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <p className="text-xs text-white/55 line-clamp-2 mb-2 leading-relaxed">
                      {post.caption.slice(0, 120)}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={post.status} />
                        {post.pillar && (
                          <span
                            className="text-[8px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{
                              background: `${getPillarColor(post.pillar)}15`,
                              color: `${getPillarColor(post.pillar)}90`,
                            }}
                          >
                            {post.pillar}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {post.time && (
                          <span className="text-[10px] text-white/25">{post.time}</span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm('Sigur vrei să ștergi această postare?')) {
                              deletePost(post.id)
                            }
                          }}
                          className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400/50 hover:text-red-400/80 transition-all opacity-0 group-hover/day-post:opacity-100"
                          title="Șterge postarea"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── AI Calendar Fill Panel ──────────────────── */}
      <AnimatePresence>
        {showAiPanel && (
          <motion.div
            initial={{ opacity: 0, x: 20, width: 0 }}
            animate={{ opacity: 1, x: 0, width: 380 }}
            exit={{ opacity: 0, x: 20, width: 0 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="h-full flex flex-col shrink-0 overflow-hidden"
          >
            <div className="glass rounded-2xl h-full flex flex-col overflow-hidden">
              <div className="p-4 pb-3 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wand2 size={14} className="text-accent-cyan" />
                  <span className="text-sm font-semibold text-white">AI Calendar Suggestions</span>
                </div>
                <button
                  onClick={() => setShowAiPanel(false)}
                  className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
                >
                  <X size={14} className="text-white/40" />
                </button>
              </div>
              <div className="flex-1 scroll-area p-4">
                {aiGenerating && !aiResult && (
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <Loader2 size={12} className="animate-spin" />
                    Generating content plan...
                  </div>
                )}
                {aiResult && (
                  <div className="text-xs text-white/60 leading-relaxed whitespace-pre-wrap">
                    {aiResult}
                    {aiGenerating && <span className="inline-block w-1.5 h-3 bg-accent-cyan/60 animate-pulse ml-0.5" />}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Post Detail Modal ─────────────────────── */}
      <AnimatePresence>
        {selectedPost && (
          <PostDetailModal
            post={selectedPost}
            clientColor={getClientColor(selectedPost)}
            onClose={() => setSelectedPost(null)}
            onStatusChange={(postId, status) => {
              updatePostStatus(postId, status)
              setSelectedPost(prev => prev ? { ...prev, status } : null)
            }}
            onCaptionSave={(postId, caption, hashtags) => {
              updatePostCaption(postId, caption, hashtags)
              setSelectedPost(prev => prev ? { ...prev, caption, hashtags } : null)
            }}
            publishConfig={getPublishConfig(selectedPost.clientId)}
            onPublish={handlePublish}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// DroppableDay — Month grid cell
// ═══════════════════════════════════════════════════════════

function DroppableDay({
  dateStr, day, dayPosts, isToday, isWeekend, isSelected, isDragOver,
  activeId, events, onSelectDate, index,
}: {
  dateStr: string; day: number; dayPosts: CalendarPost[]; isToday: boolean
  isWeekend: boolean; isSelected: boolean; isDragOver: boolean
  activeId: string | null; events?: CalendarEvent[]; onSelectDate: () => void; index: number
}) {
  const { setNodeRef } = useDroppable({ id: dateStr })
  const hasPublicHoliday = events?.some(e => e.type === 'public')

  return (
    <motion.div
      ref={setNodeRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.01 }}
      onClick={onSelectDate}
      className={`rounded-lg p-1.5 min-h-[80px] transition-all duration-200 overflow-hidden
        ${isToday ? 'ring-1 ring-accent-violet/50 bg-accent-violet/[0.05]' : ''}
        ${isSelected ? 'ring-1 ring-accent-cyan/50 bg-accent-cyan/[0.05]' : ''}
        ${isDragOver ? 'ring-1 ring-accent-cyan/60 bg-accent-cyan/[0.08]' : ''}
        ${hasPublicHoliday && !isToday && !isSelected && !isDragOver ? 'bg-red-500/[0.03]' : ''}
        ${isWeekend && !isToday && !isSelected && !isDragOver && !hasPublicHoliday ? 'bg-white/[0.008]' : ''}
        ${!isToday && !isSelected && !isDragOver && !hasPublicHoliday && !isWeekend ? 'bg-white/[0.015]' : ''}
        ${dayPosts.length > 0 || isDragOver ? 'hover:bg-white/[0.04] cursor-pointer' : ''}
      `}
    >
      <div className="flex items-center gap-1 mb-1 px-1">
        <span className={`text-[11px] font-medium shrink-0 ${
          isToday ? 'text-accent-violet' : isSelected ? 'text-accent-cyan' : isDragOver ? 'text-accent-cyan' : 'text-white/30'
        }`}>
          {day}
        </span>
        {events && events.length > 0 && (
          <span
            className={`text-[8px] truncate ${
              events[0].type === 'public' ? 'text-red-400/60' : 'text-accent-cyan/50'
            }`}
            title={events.map(e => e.name).join(', ')}
          >
            {events[0].name}
          </span>
        )}
        {dayPosts.length > 0 && (
          <span className="text-[9px] text-white/25 font-normal ml-auto shrink-0">{dayPosts.length}</span>
        )}
      </div>

      <div className="space-y-0.5">
        {dayPosts.slice(0, 4).map(post => (
          <DraggablePostPill key={post.id} post={post} isDragging={post.id === activeId} />
        ))}
        {dayPosts.length > 4 && (
          <div className="text-[9px] text-white/20 px-1">+{dayPosts.length - 4} more</div>
        )}
        {isDragOver && dayPosts.length === 0 && (
          <div className="text-[9px] text-accent-cyan/60 px-1 py-1">Drop here</div>
        )}
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════
// DroppableWeekDay — Week view column
// ═══════════════════════════════════════════════════════════

function DroppableWeekDay({
  dateStr, date, dayPosts, isToday, isWeekend, isDragOver,
  activeId, events, onPostClick, onRemovePost, getImageUrl,
}: {
  dateStr: string; date: Date; dayPosts: CalendarPost[]; isToday: boolean
  isWeekend: boolean; isDragOver: boolean; activeId: string | null
  events?: CalendarEvent[]; onPostClick: (post: Post) => void
  onRemovePost: (postId: string) => void
  getImageUrl: (postId: string) => string | null
}) {
  const { setNodeRef } = useDroppable({ id: dateStr })
  const hasPublicHoliday = events?.some(e => e.type === 'public')

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl flex flex-col overflow-hidden transition-all duration-200 min-h-0
        ${isToday ? 'ring-1 ring-accent-violet/50' : ''}
        ${isDragOver ? 'ring-1 ring-accent-cyan/60 bg-accent-cyan/[0.05]' : ''}
        ${hasPublicHoliday && !isToday && !isDragOver ? 'bg-red-500/[0.02]' : ''}
        ${isWeekend && !isToday && !isDragOver && !hasPublicHoliday ? 'bg-white/[0.008]' : ''}
        ${!isToday && !isDragOver && !hasPublicHoliday && !isWeekend ? 'bg-white/[0.015]' : ''}
      `}
    >
      {/* Day header */}
      <div className={`px-2.5 py-2 border-b border-white/[0.04] shrink-0 ${isToday ? 'bg-accent-violet/[0.06]' : ''}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-[10px] uppercase tracking-wider font-semibold ${
              isToday ? 'text-accent-violet' : 'text-white/25'
            }`}>
              {date.toLocaleDateString('ro-RO', { weekday: 'short' })}
            </div>
            <div className={`text-lg font-bold -mt-0.5 ${isToday ? 'text-accent-violet' : 'text-white/60'}`}>
              {date.getDate()}
            </div>
          </div>
          {dayPosts.length > 0 && (
            <span className="text-[10px] text-white/20 font-mono">{dayPosts.length}</span>
          )}
        </div>
        {events && events.length > 0 && (
          <div className="mt-1 space-y-0.5">
            {events.map((ev, i) => (
              <div
                key={i}
                className={`flex items-center gap-1 text-[9px] ${
                  ev.type === 'public' ? 'text-red-400/70' : 'text-accent-cyan/60'
                }`}
              >
                <Flag size={8} className="shrink-0" />
                <span className="truncate">{ev.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Posts */}
      <div className="flex-1 scroll-area p-1.5 space-y-1.5 min-h-0">
        {dayPosts.map(post => (
          <WeekPostCard
            key={post.id}
            post={post}
            isDragging={post.id === activeId}
            onClick={() => onPostClick(post)}
            onRemove={() => onRemovePost(post.id)}
            imageUrl={getImageUrl(post.id)}
          />
        ))}
        {isDragOver && dayPosts.length === 0 && (
          <div className="text-[10px] text-accent-cyan/60 text-center py-4">Drop here</div>
        )}
        {dayPosts.length === 0 && !isDragOver && (
          <div className="text-[10px] text-white/10 text-center py-6">—</div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// WeekPostCard — Detailed post card for week view
// ═══════════════════════════════════════════════════════════

function WeekPostCard({ post, isDragging, onClick, onRemove, imageUrl }: {
  post: CalendarPost; isDragging: boolean; onClick: () => void; onRemove: () => void; imageUrl?: string | null
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: post.id })

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className="rounded-lg overflow-hidden transition-all cursor-pointer group/wcard hover:bg-white/[0.04]"
      style={{
        opacity: isDragging ? 0.3 : 1,
        borderLeft: `2px solid ${post.color}`,
        background: `${post.color}06`,
      }}
    >
      {imageUrl && (
        <div className="h-[60px] overflow-hidden">
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-2">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: post.color }} />
          <span className="text-[10px] font-medium truncate" style={{ color: `${post.color}cc` }}>
            {post.clientName}
          </span>
          <div className="ml-auto flex items-center gap-1">
            <PlatformDot platform={post.platform} />
            <button
              {...attributes}
              {...listeners}
              className="p-0 opacity-0 group-hover/wcard:opacity-100 cursor-grab active:cursor-grabbing transition-opacity touch-none"
              onClick={e => e.stopPropagation()}
            >
              <GripVertical size={10} className="text-white/25" />
            </button>
          </div>
        </div>

        <p className="text-[10px] text-white/45 line-clamp-2 leading-relaxed mb-1.5">
          {post.caption.slice(0, 100)}
        </p>

        <div className="flex items-center gap-1 flex-wrap">
          <StatusBadge status={post.status} />
          {post.pillar && (
            <span
              className="text-[8px] px-1.5 py-0.5 rounded-full font-medium"
              style={{
                background: `${getPillarColor(post.pillar)}15`,
                color: `${getPillarColor(post.pillar)}90`,
              }}
            >
              {post.pillar}
            </span>
          )}
          <div className="ml-auto flex items-center gap-1.5">
            {post.time && (
              <span className="text-[9px] text-white/20">{post.time}</span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (confirm('Sigur vrei să ștergi această postare?')) {
                  onRemove()
                }
              }}
              className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400/50 hover:text-red-400/80 transition-all opacity-0 group-hover/wcard:opacity-100"
              title="Șterge"
            >
              <Trash2 size={9} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// DraggablePostPill — Compact pill for month view
// ═══════════════════════════════════════════════════════════

function DraggablePostPill({ post, isDragging }: { post: CalendarPost; isDragging: boolean }) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: post.id })

  return (
    <div
      ref={setNodeRef}
      className="flex items-center gap-1 px-1 py-0.5 rounded text-[9px] truncate group/post"
      style={{
        background: `${post.color}10`,
        opacity: isDragging ? 0.3 : 1,
        borderBottom: post.pillar ? `1px solid ${getPillarColor(post.pillar)}30` : undefined,
      }}
      title={`${post.clientName} — ${post.platform}${post.pillar ? ` [${post.pillar}]` : ''}: ${post.caption.slice(0, 60)}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="p-0 opacity-0 group-hover/post:opacity-100 cursor-grab active:cursor-grabbing transition-opacity touch-none shrink-0"
        onClick={e => e.stopPropagation()}
      >
        <GripVertical size={9} className="text-white/25" />
      </button>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: post.color }} />
      <PlatformDot platform={post.platform} />
      <span className="truncate text-white/40 group-hover/post:text-white/60">
        {post.clientName.split(' ')[0]}
      </span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// DragPill — Overlay shown while dragging
// ═══════════════════════════════════════════════════════════

function DragPill({ post }: { post: CalendarPost }) {
  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] shadow-xl shadow-black/50 scale-110"
      style={{ background: `${post.color}25`, border: `1px solid ${post.color}40` }}
    >
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: post.color }} />
      <PlatformDot platform={post.platform} />
      <span className="text-white/70 font-medium">{post.clientName.split(' ')[0]}</span>
      <span className="text-white/35 truncate max-w-[120px]">{post.caption.slice(0, 40)}</span>
    </div>
  )
}
