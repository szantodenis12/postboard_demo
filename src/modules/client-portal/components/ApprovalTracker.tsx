import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Timer,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Send,
  Plus,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Settings,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Zap,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'
import { useApp } from '../../../core/context'
import { appUrl } from '../../../core/config'

// ── Types ────────────────────────────────────────────────

interface SLAConfig {
  defaultDeadlineHours: number
  reminderIntervals: number[]
  clients: Record<string, { deadlineHours: number }>
}

interface SLAEntry {
  token: string
  clientId: string
  clientName: string
  label?: string
  totalPosts: number
  approvedCount: number
  changesRequestedCount: number
  pendingCount: number
  createdAt: string
  deadlineAt: string
  hoursRemaining: number
  status: 'on-track' | 'warning' | 'urgent' | 'overdue'
  lastActivity: string | null
}

type TabId = 'dashboard' | 'timeline' | 'stats'

// ── Color utilities ──────────────────────────────────────

const STATUS_COLORS: Record<SLAEntry['status'], { bg: string; text: string; border: string; dot: string }> = {
  'on-track': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-400' },
  warning: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', dot: 'bg-yellow-400' },
  urgent: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', dot: 'bg-orange-400' },
  overdue: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', dot: 'bg-red-400' },
}

function formatCountdown(hours: number): string {
  if (hours < 0) {
    const abs = Math.abs(hours)
    if (abs >= 24) return `${Math.floor(abs / 24)}d ${Math.floor(abs % 24)}h overdue`
    return `${Math.floor(abs)}h ${Math.floor((abs % 1) * 60)}m overdue`
  }
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${Math.floor(hours % 24)}h left`
  if (hours >= 1) return `${Math.floor(hours)}h ${Math.floor((hours % 1) * 60)}m left`
  return `${Math.floor(hours * 60)}m left`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(hours: number): string {
  if (hours >= 24) return `${Math.round(hours / 24)}d`
  return `${Math.round(hours)}h`
}

// ── Hook ─────────────────────────────────────────────────

function useSLA() {
  const [entries, setEntries] = useState<SLAEntry[]>([])
  const [config, setConfig] = useState<SLAConfig>({
    defaultDeadlineHours: 48,
    reminderIntervals: [24, 6, 1],
    clients: {},
  })
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/sla/status')
      if (res.ok) {
        const data = await res.json()
        setEntries(data.statuses || [])
        if (data.config) setConfig(data.config)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  const updateConfig = useCallback(async (partial: Partial<SLAConfig>) => {
    try {
      const res = await fetch('/api/sla/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partial),
      })
      if (res.ok) {
        const data = await res.json()
        setConfig(data.config)
        await refresh()
      }
    } catch {
      // silent
    }
  }, [refresh])

  const sendReminder = useCallback(async (token: string) => {
    try {
      const res = await fetch(`/api/sla/remind/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      return res.ok
    } catch {
      return false
    }
  }, [])

  const extendDeadline = useCallback(async (token: string, hours: number) => {
    try {
      const res = await fetch(`/api/sla/extend/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours }),
      })
      if (res.ok) await refresh()
      return res.ok
    } catch {
      return false
    }
  }, [refresh])

  useEffect(() => { refresh() }, [refresh])

  // Auto-refresh every 60 seconds to keep countdowns accurate
  useEffect(() => {
    const timer = setInterval(refresh, 60_000)
    return () => clearInterval(timer)
  }, [refresh])

  return { entries, config, loading, refresh, updateConfig, sendReminder, extendDeadline }
}

// ── Main Component ───────────────────────────────────────

export function ApprovalTracker() {
  const { data } = useApp()
  const { entries, config, loading, refresh, updateConfig, sendReminder, extendDeadline } = useSLA()
  const [tab, setTab] = useState<TabId>('dashboard')
  const [configOpen, setConfigOpen] = useState(false)
  const [reminderSent, setReminderSent] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  // Sort: overdue first, then urgent, warning, on-track
  const sorted = useMemo(() => {
    const order: Record<string, number> = { overdue: 0, urgent: 1, warning: 2, 'on-track': 3 }
    return [...entries].sort((a, b) => (order[a.status] ?? 4) - (order[b.status] ?? 4))
  }, [entries])

  // Aggregated stats
  const stats = useMemo(() => {
    const total = entries.length
    const overdue = entries.filter(e => e.status === 'overdue').length
    const urgent = entries.filter(e => e.status === 'urgent').length
    const onTrack = entries.filter(e => e.status === 'on-track').length

    // Per-client average response time (based on lastActivity - createdAt)
    const clientTimes: Record<string, { total: number; count: number; name: string }> = {}
    for (const e of entries) {
      if (e.lastActivity) {
        const responseHours = (new Date(e.lastActivity).getTime() - new Date(e.createdAt).getTime()) / (1000 * 60 * 60)
        if (!clientTimes[e.clientId]) clientTimes[e.clientId] = { total: 0, count: 0, name: e.clientName }
        clientTimes[e.clientId].total += responseHours
        clientTimes[e.clientId].count++
      }
    }

    const clientAvgs = Object.entries(clientTimes)
      .map(([id, ct]) => ({ clientId: id, clientName: ct.name, avgHours: ct.total / ct.count }))
      .sort((a, b) => a.avgHours - b.avgHours)

    const totalPosts = entries.reduce((s, e) => s + e.totalPosts, 0)
    const approvedPosts = entries.reduce((s, e) => s + e.approvedCount, 0)
    const approvalRate = totalPosts > 0 ? Math.round((approvedPosts / totalPosts) * 100) : 0

    return { total, overdue, urgent, onTrack, clientAvgs, approvalRate, totalPosts, approvedPosts }
  }, [entries])

  // Bottleneck alerts
  const bottlenecks = useMemo(() => {
    return entries.filter(e => e.status === 'overdue' && e.pendingCount > 0)
  }, [entries])

  const handleCopyLink = async (token: string) => {
    await navigator.clipboard.writeText(appUrl(`/review/${token}`))
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleSendReminder = async (token: string) => {
    const ok = await sendReminder(token)
    if (ok) {
      setReminderSent(token)
      setTimeout(() => setReminderSent(null), 3000)
    }
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'stats', label: 'Stats' },
  ]

  return (
    <div className="h-full overflow-auto scroll-area">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Approval Tracker</h2>
            <p className="text-sm text-white/30 mt-1">
              Monitor SLA deadlines, bottlenecks, and approval velocity
            </p>
          </div>
          <button
            onClick={refresh}
            className="p-2 rounded-lg text-white/20 hover:text-white/60 hover:bg-white/[0.04] transition-all"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard value={stats.total} label="Active Reviews" color="text-white" />
          <SummaryCard value={stats.overdue} label="Overdue" color="text-red-400" pulse={stats.overdue > 0} />
          <SummaryCard value={stats.urgent} label="Urgent" color="text-orange-400" />
          <SummaryCard value={`${stats.approvalRate}%`} label="Approval Rate" color="text-emerald-400" />
        </div>

        {/* Bottleneck Alerts */}
        <AnimatePresence>
          {bottlenecks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              {bottlenecks.map(b => (
                <motion.div
                  key={b.token}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/[0.06] border border-red-500/10"
                >
                  <AlertTriangle size={15} className="text-red-400 shrink-0" />
                  <span className="text-sm text-red-300/80 flex-1">
                    <strong className="text-red-300">{b.clientName}</strong> hasn't responded in{' '}
                    {formatDuration(Math.abs(b.hoursRemaining))} — {b.pendingCount} post{b.pendingCount !== 1 ? 's' : ''} overdue
                  </span>
                  <button
                    onClick={() => handleSendReminder(b.token)}
                    className="px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 text-xs font-medium hover:bg-red-500/25 transition-colors flex items-center gap-1.5"
                  >
                    <Send size={11} />
                    Remind
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab bar */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] w-fit">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                tab === t.id
                  ? 'bg-white/[0.08] text-white'
                  : 'text-white/30 hover:text-white/50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'dashboard' && (
          <DashboardTab
            entries={sorted}
            loading={loading}
            onRemind={handleSendReminder}
            onExtend={extendDeadline}
            onCopy={handleCopyLink}
            reminderSent={reminderSent}
            copied={copied}
          />
        )}
        {tab === 'timeline' && <TimelineTab entries={sorted} />}
        {tab === 'stats' && <StatsTab stats={stats} entries={entries} />}

        {/* SLA Config Panel */}
        <div className="glass rounded-2xl overflow-hidden">
          <button
            onClick={() => setConfigOpen(!configOpen)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-white/50">
              <Settings size={14} />
              SLA Configuration
            </div>
            {configOpen ? <ChevronUp size={14} className="text-white/20" /> : <ChevronDown size={14} className="text-white/20" />}
          </button>
          <AnimatePresence>
            {configOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <ConfigPanel config={config} clients={data.clients} onUpdate={updateConfig} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// ── Sub-Components ───────────────────────────────────────

function SummaryCard({ value, label, color, pulse }: { value: number | string; label: string; color: string; pulse?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass rounded-xl p-4 text-center ${pulse ? 'animate-pulse-subtle' : ''}`}
    >
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-white/25 mt-1">{label}</div>
    </motion.div>
  )
}

// ── Dashboard Tab ────────────────────────────────────────

function DashboardTab({
  entries,
  loading,
  onRemind,
  onExtend,
  onCopy,
  reminderSent,
  copied,
}: {
  entries: SLAEntry[]
  loading: boolean
  onRemind: (token: string) => void
  onExtend: (token: string, hours: number) => Promise<boolean>
  onCopy: (token: string) => void
  reminderSent: string | null
  copied: string | null
}) {
  const [expandedExtend, setExpandedExtend] = useState<string | null>(null)

  if (loading && entries.length === 0) {
    return <div className="text-center py-12 text-white/20 text-sm">Loading...</div>
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-white/20 text-sm">
        No active review links. Create one in Review Links to start tracking.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {entries.map((entry, i) => {
          const sc = STATUS_COLORS[entry.status]
          const progressPct = entry.totalPosts > 0 ? (entry.approvedCount / entry.totalPosts) * 100 : 0

          return (
            <motion.div
              key={entry.token}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.04 }}
              className={`glass rounded-xl p-4 border ${sc.border} ${entry.status === 'overdue' ? 'sla-overdue-pulse' : ''}`}
            >
              {/* Top row: client name + status badge + countdown */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className={`w-2 h-2 rounded-full ${sc.dot}`} />
                    <span className="text-sm font-medium text-white">{entry.clientName}</span>
                    {entry.label && (
                      <span className="text-[11px] text-white/25 px-2 py-0.5 rounded-md bg-white/[0.04]">
                        {entry.label}
                      </span>
                    )}
                    <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md ${sc.bg} ${sc.text}`}>
                      {entry.status}
                    </span>
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-white/25 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      Sent {formatDate(entry.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <ArrowRight size={10} />
                      Due {formatDate(entry.deadlineAt)}
                    </span>
                  </div>
                </div>

                {/* Countdown */}
                <div className={`text-right shrink-0 ${sc.text}`}>
                  <div className="text-sm font-bold tabular-nums">
                    {formatCountdown(entry.hoursRemaining)}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-white/25">
                    {entry.approvedCount}/{entry.totalPosts} approved
                    {entry.changesRequestedCount > 0 && (
                      <span className="text-yellow-500/60 ml-2">
                        {entry.changesRequestedCount} changes requested
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-white/20">
                    {entry.pendingCount} pending
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-emerald-500/60"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Last activity */}
              {entry.lastActivity && (
                <div className="mt-2 text-[10px] text-white/15">
                  Last response: {formatDate(entry.lastActivity)}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.04]">
                <button
                  onClick={() => onRemind(entry.token)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    reminderSent === entry.token
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-white/[0.04] text-white/40 hover:text-white/70 hover:bg-white/[0.08]'
                  }`}
                >
                  {reminderSent === entry.token ? (
                    <><Check size={11} /> Sent</>
                  ) : (
                    <><Send size={11} /> Send Reminder</>
                  )}
                </button>

                <div className="relative">
                  <button
                    onClick={() => setExpandedExtend(expandedExtend === entry.token ? null : entry.token)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.04] text-white/40 hover:text-white/70 hover:bg-white/[0.08] transition-all"
                  >
                    <Plus size={11} />
                    Extend
                  </button>
                  <AnimatePresence>
                    {expandedExtend === entry.token && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.95 }}
                        className="absolute top-full left-0 mt-1 flex gap-1 z-10"
                      >
                        {[24, 48].map(h => (
                          <button
                            key={h}
                            onClick={async () => {
                              await onExtend(entry.token, h)
                              setExpandedExtend(null)
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-white/[0.08] text-white/50 hover:text-white hover:bg-white/[0.12] transition-all whitespace-nowrap backdrop-blur-xl border border-white/[0.06]"
                          >
                            +{h}h
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={() => onCopy(entry.token)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    copied === entry.token
                      ? 'bg-accent-cyan/15 text-accent-cyan'
                      : 'bg-white/[0.04] text-white/40 hover:text-white/70 hover:bg-white/[0.08]'
                  }`}
                >
                  {copied === entry.token ? (
                    <><Check size={11} /> Copied</>
                  ) : (
                    <><Copy size={11} /> Resend Link</>
                  )}
                </button>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

// ── Timeline Tab ─────────────────────────────────────────

function TimelineTab({ entries }: { entries: SLAEntry[] }) {
  // Build timeline events from entries
  const events = useMemo(() => {
    const items: {
      time: string
      type: 'sent' | 'response' | 'overdue'
      clientName: string
      label?: string
      detail: string
    }[] = []

    for (const e of entries) {
      items.push({
        time: e.createdAt,
        type: 'sent',
        clientName: e.clientName,
        label: e.label,
        detail: `Review link sent — ${e.totalPosts} posts`,
      })
      if (e.lastActivity) {
        const responseHours = (new Date(e.lastActivity).getTime() - new Date(e.createdAt).getTime()) / (1000 * 60 * 60)
        items.push({
          time: e.lastActivity,
          type: 'response',
          clientName: e.clientName,
          label: e.label,
          detail: `Responded after ${formatDuration(responseHours)} — ${e.approvedCount} approved, ${e.changesRequestedCount} changes`,
        })
      }
      if (e.status === 'overdue') {
        items.push({
          time: e.deadlineAt,
          type: 'overdue',
          clientName: e.clientName,
          label: e.label,
          detail: `Deadline passed — ${e.pendingCount} posts still pending`,
        })
      }
    }

    return items.sort((a, b) => b.time.localeCompare(a.time))
  }, [entries])

  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-white/20 text-sm">
        No timeline events yet.
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[18px] top-3 bottom-3 w-px bg-white/[0.06]" />

      <div className="space-y-1">
        {events.map((ev, i) => {
          const colors = {
            sent: 'bg-accent-violet/20 text-accent-violet border-accent-violet/30',
            response: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            overdue: 'bg-red-500/20 text-red-400 border-red-500/30',
          }
          const dotColors = {
            sent: 'bg-accent-violet',
            response: 'bg-emerald-400',
            overdue: 'bg-red-400',
          }

          return (
            <motion.div
              key={`${ev.time}-${ev.type}-${i}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-start gap-3 py-2 pl-0"
            >
              {/* Dot */}
              <div className="relative z-10 mt-1.5 shrink-0">
                <div className={`w-[9px] h-[9px] rounded-full ${dotColors[ev.type]} ring-2 ring-[#0e0e12]`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 glass rounded-lg p-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white/70">{ev.clientName}</span>
                  {ev.label && (
                    <span className="text-[10px] text-white/20 px-1.5 py-0.5 rounded bg-white/[0.04]">{ev.label}</span>
                  )}
                  <span className={`text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded ${colors[ev.type]}`}>
                    {ev.type}
                  </span>
                </div>
                <p className="text-[11px] text-white/35 mt-1">{ev.detail}</p>
                <div className="text-[10px] text-white/15 mt-1 flex items-center gap-1">
                  <Clock size={9} />
                  {formatDate(ev.time)}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ── Stats Tab ────────────────────────────────────────────

function StatsTab({
  stats,
  entries,
}: {
  stats: {
    total: number
    overdue: number
    urgent: number
    onTrack: number
    clientAvgs: { clientId: string; clientName: string; avgHours: number }[]
    approvalRate: number
    totalPosts: number
    approvedPosts: number
  }
  entries: SLAEntry[]
}) {
  return (
    <div className="space-y-6">
      {/* Overview stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-4"
        >
          <div className="flex items-center gap-2 text-white/25 text-[10px] uppercase tracking-wider mb-2">
            <BarChart3 size={12} />
            Total Posts
          </div>
          <div className="text-xl font-bold text-white">{stats.totalPosts}</div>
          <div className="text-[11px] text-emerald-400/60 mt-1">
            {stats.approvedPosts} approved
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass rounded-xl p-4"
        >
          <div className="flex items-center gap-2 text-white/25 text-[10px] uppercase tracking-wider mb-2">
            <Zap size={12} />
            Approval Rate
          </div>
          <div className="text-xl font-bold text-emerald-400">{stats.approvalRate}%</div>
          <div className="h-1 rounded-full bg-white/[0.06] mt-2 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-emerald-500/50"
              initial={{ width: 0 }}
              animate={{ width: `${stats.approvalRate}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-4"
        >
          <div className="flex items-center gap-2 text-white/25 text-[10px] uppercase tracking-wider mb-2">
            <Timer size={12} />
            Active Reviews
          </div>
          <div className="text-xl font-bold text-white">{stats.total}</div>
          <div className="text-[11px] text-white/25 mt-1">
            {stats.overdue > 0 && <span className="text-red-400/60">{stats.overdue} overdue</span>}
            {stats.overdue > 0 && stats.urgent > 0 && ' · '}
            {stats.urgent > 0 && <span className="text-orange-400/60">{stats.urgent} urgent</span>}
          </div>
        </motion.div>
      </div>

      {/* Client Response Rankings */}
      <div className="glass rounded-xl p-5">
        <div className="text-[10px] uppercase tracking-widest text-white/20 font-semibold mb-4">
          Client Response Time
        </div>
        {stats.clientAvgs.length === 0 ? (
          <div className="text-sm text-white/20 text-center py-4">
            No response data yet
          </div>
        ) : (
          <div className="space-y-3">
            {stats.clientAvgs.map((c, i) => {
              const isFastest = i === 0
              const isSlowest = i === stats.clientAvgs.length - 1 && stats.clientAvgs.length > 1
              return (
                <motion.div
                  key={c.clientId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-[11px] text-white/20 w-5 text-right tabular-nums">
                    #{i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white/70">{c.clientName}</span>
                      {isFastest && (
                        <span className="flex items-center gap-0.5 text-[10px] text-emerald-400/60">
                          <TrendingUp size={10} /> Fastest
                        </span>
                      )}
                      {isSlowest && (
                        <span className="flex items-center gap-0.5 text-[10px] text-red-400/60">
                          <TrendingDown size={10} /> Slowest
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-white/40 tabular-nums">
                    {formatDuration(c.avgHours)}
                  </span>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Status distribution */}
      <div className="glass rounded-xl p-5">
        <div className="text-[10px] uppercase tracking-widest text-white/20 font-semibold mb-4">
          Status Distribution
        </div>
        <div className="grid grid-cols-4 gap-3">
          {(['on-track', 'warning', 'urgent', 'overdue'] as const).map(status => {
            const count = entries.filter(e => e.status === status).length
            const sc = STATUS_COLORS[status]
            return (
              <div key={status} className={`rounded-lg p-3 text-center ${sc.bg}`}>
                <div className={`text-lg font-bold ${sc.text}`}>{count}</div>
                <div className={`text-[10px] uppercase tracking-wider ${sc.text} opacity-60 mt-0.5`}>
                  {status}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Config Panel ─────────────────────────────────────────

function ConfigPanel({
  config,
  clients,
  onUpdate,
}: {
  config: SLAConfig
  clients: { id: string; displayName: string }[]
  onUpdate: (partial: Partial<SLAConfig>) => void
}) {
  const [deadline, setDeadline] = useState(String(config.defaultDeadlineHours))
  const [reminders, setReminders] = useState(config.reminderIntervals.join(', '))
  const [clientOverrides, setClientOverrides] = useState<Record<string, string>>(() => {
    const overrides: Record<string, string> = {}
    for (const [id, val] of Object.entries(config.clients)) {
      overrides[id] = String(val.deadlineHours)
    }
    return overrides
  })
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    const parsedReminders = reminders
      .split(',')
      .map(s => Number(s.trim()))
      .filter(n => !isNaN(n) && n > 0)
      .sort((a, b) => b - a)

    const parsedClients: Record<string, { deadlineHours: number }> = {}
    for (const [id, val] of Object.entries(clientOverrides)) {
      const hours = Number(val)
      if (!isNaN(hours) && hours > 0) {
        parsedClients[id] = { deadlineHours: hours }
      }
    }

    onUpdate({
      defaultDeadlineHours: Number(deadline) || 48,
      reminderIntervals: parsedReminders.length > 0 ? parsedReminders : [24, 6, 1],
      clients: parsedClients,
    })

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="px-4 pb-4 space-y-4 border-t border-white/[0.04]">
      {/* Default deadline */}
      <div className="mt-4">
        <label className="text-[10px] uppercase tracking-wider text-white/25 font-semibold block mb-1.5">
          Default Deadline (hours)
        </label>
        <div className="flex gap-2">
          {['24', '48', '72'].map(h => (
            <button
              key={h}
              onClick={() => setDeadline(h)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                deadline === h
                  ? 'bg-accent-violet/20 text-accent-violet'
                  : 'bg-white/[0.04] text-white/30 hover:text-white/50'
              }`}
            >
              {h}h
            </button>
          ))}
          <input
            type="number"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
            className="w-20 bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-accent-violet/40 tabular-nums"
            placeholder="Custom"
          />
        </div>
      </div>

      {/* Reminder schedule */}
      <div>
        <label className="text-[10px] uppercase tracking-wider text-white/25 font-semibold block mb-1.5">
          Reminder Schedule (hours before deadline, comma separated)
        </label>
        <input
          type="text"
          value={reminders}
          onChange={e => setReminders(e.target.value)}
          className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-xs text-white placeholder:text-white/20 outline-none focus:border-accent-violet/40"
          placeholder="24, 6, 1"
        />
      </div>

      {/* Per-client overrides */}
      <div>
        <label className="text-[10px] uppercase tracking-wider text-white/25 font-semibold block mb-2">
          Per-Client Deadline Overrides
        </label>
        <div className="space-y-2 max-h-48 overflow-auto scroll-area">
          {clients.map(c => (
            <div key={c.id} className="flex items-center gap-3">
              <span className="text-xs text-white/40 w-32 truncate">{c.displayName}</span>
              <input
                type="number"
                value={clientOverrides[c.id] || ''}
                onChange={e => setClientOverrides(prev => ({ ...prev, [c.id]: e.target.value }))}
                className="w-20 bg-white/[0.04] border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-accent-violet/40 tabular-nums"
                placeholder={String(config.defaultDeadlineHours)}
              />
              <span className="text-[10px] text-white/15">hours</span>
            </div>
          ))}
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
          saved
            ? 'bg-emerald-500/20 text-emerald-400'
            : 'bg-accent-violet/20 text-accent-violet hover:bg-accent-violet/30'
        }`}
      >
        {saved ? <><Check size={14} /> Saved</> : <><Settings size={14} /> Save Configuration</>}
      </button>
    </div>
  )
}
