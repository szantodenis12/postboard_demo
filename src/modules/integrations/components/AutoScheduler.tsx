import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Timer,
  Power,
  Clock,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  SkipForward,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  History,
} from 'lucide-react'
import { useApp } from '../../../core/context'

interface ClientConfig {
  autoPublish: boolean
  publishWindowStart: string
  publishWindowEnd: string
}

interface AnalyticsSyncSummary {
  processedClients: number
  metaSuccess: number
  metaFailed: number
  googleSuccess: number
  googleFailed: number
}

interface AnalyticsSyncConfig {
  enabled: boolean
  runAt: string
  includeMeta: boolean
  includeGoogle: boolean
  lastRunDate?: string
  lastRunAt?: string
  lastRunSummary?: AnalyticsSyncSummary
}

interface SchedulerConfig {
  enabled: boolean
  clients: Record<string, ClientConfig>
  checkIntervalMinutes: number
  analyticsSync: AnalyticsSyncConfig
}

interface LogEntry {
  id: string
  postId: string
  clientId: string
  clientName?: string
  platform: string
  caption?: string
  action: 'published' | 'failed' | 'skipped'
  message: string
  timestamp: string
}

export function AutoScheduler() {
  const { data } = useApp()
  const [config, setConfig] = useState<SchedulerConfig>({
    enabled: false,
    clients: {},
    checkIntervalMinutes: 5,
    analyticsSync: {
      enabled: false,
      runAt: '23:30',
      includeMeta: true,
      includeGoogle: true,
    },
  })
  const [log, setLog] = useState<LogEntry[]>([])
  const [showLog, setShowLog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [running, setRunning] = useState(false)
  const [runningAnalytics, setRunningAnalytics] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)

  const fetchConfig = useCallback(() => {
    fetch('/api/scheduler/config').then(r => r.json()).then(setConfig).catch(() => {})
  }, [])

  const fetchLog = useCallback(() => {
    fetch('/api/scheduler/log').then(r => r.json()).then(setLog).catch(() => {})
  }, [])

  useEffect(() => {
    fetchConfig()
    fetchLog()
  }, [fetchConfig, fetchLog])

  const saveConfig = async (newConfig: SchedulerConfig) => {
    setSaving(true)
    try {
      await fetch('/api/scheduler/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      })
      setConfig(newConfig)
      setLastSaved(new Date().toLocaleTimeString())
      setTimeout(() => setLastSaved(null), 2000)
    } catch { /* ignore */ }
    setSaving(false)
  }

  const toggleGlobal = () => {
    saveConfig({ ...config, enabled: !config.enabled })
  }

  const toggleClient = (clientId: string) => {
    const current = config.clients[clientId] || {
      autoPublish: false,
      publishWindowStart: '09:00',
      publishWindowEnd: '21:00',
    }
    saveConfig({
      ...config,
      clients: {
        ...config.clients,
        [clientId]: { ...current, autoPublish: !current.autoPublish },
      },
    })
  }

  const updateClientWindow = (clientId: string, field: 'publishWindowStart' | 'publishWindowEnd', value: string) => {
    const current = config.clients[clientId] || {
      autoPublish: true,
      publishWindowStart: '09:00',
      publishWindowEnd: '21:00',
    }
    saveConfig({
      ...config,
      clients: {
        ...config.clients,
        [clientId]: { ...current, [field]: value },
      },
    })
  }

  const updateInterval = (mins: number) => {
    saveConfig({ ...config, checkIntervalMinutes: mins })
  }

  const updateAnalyticsSync = (patch: Partial<AnalyticsSyncConfig>) => {
    saveConfig({
      ...config,
      analyticsSync: {
        ...config.analyticsSync,
        ...patch,
      },
    })
  }

  const runNow = async () => {
    setRunning(true)
    try {
      await fetch('/api/scheduler/run', { method: 'POST' })
      fetchLog()
    } catch { /* ignore */ }
    setRunning(false)
  }

  const runAnalyticsNow = async () => {
    setRunningAnalytics(true)
    try {
      await fetch('/api/scheduler/analytics-sync/run', { method: 'POST' })
      fetchConfig()
    } catch { /* ignore */ }
    setRunningAnalytics(false)
  }

  const scheduledCount = data.clients.reduce((sum, c) =>
    sum + c.posts.filter(p => p.status === 'scheduled').length, 0
  )

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

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
            <div className="w-10 h-10 rounded-xl bg-accent-violet/20 flex items-center justify-center">
              <Timer className="w-5 h-5 text-accent-violet" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Auto-Publish</h1>
              <p className="text-sm text-white/40">Automatically publish scheduled posts when their date arrives</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastSaved && (
              <span className="text-xs text-emerald-400 animate-pulse">Saved</span>
            )}
            <button
              onClick={runNow}
              disabled={running || !config.enabled}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-sm transition-colors disabled:opacity-30"
            >
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Run Now
            </button>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scroll-area px-8 pb-8">
        {/* Global Toggle + Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleGlobal}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  config.enabled ? 'bg-emerald-500' : 'bg-white/10'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-lg transition-transform ${
                    config.enabled ? 'translate-x-7.5 left-0.5' : 'left-0.5'
                  }`}
                  style={{ transform: config.enabled ? 'translateX(28px)' : 'translateX(0)' }}
                />
              </button>
              <div>
                <h3 className="text-white font-semibold">
                  Auto-Publish is {config.enabled ? 'Active' : 'Off'}
                </h3>
                <p className="text-xs text-white/40">
                  {config.enabled
                    ? `Checking every ${config.checkIntervalMinutes} minutes for posts ready to publish`
                    : 'Enable to automatically publish scheduled posts'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{scheduledCount}</p>
                <p className="text-[10px] text-white/30 uppercase tracking-wider">Scheduled</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{data.totals.published}</p>
                <p className="text-[10px] text-white/30 uppercase tracking-wider">Published</p>
              </div>
            </div>
          </div>

          {/* Check Interval */}
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-white/30" />
            <span className="text-sm text-white/50">Check every</span>
            <div className="flex gap-1">
              {[1, 5, 10, 15, 30].map(mins => (
                <button
                  key={mins}
                  onClick={() => updateInterval(mins)}
                  className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                    config.checkIntervalMinutes === mins
                      ? 'bg-accent-violet/20 text-accent-violet border border-accent-violet/30'
                      : 'bg-white/5 text-white/40 hover:text-white/60'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Daily Analytics Sync */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => updateAnalyticsSync({ enabled: !config.analyticsSync.enabled })}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  config.analyticsSync.enabled ? 'bg-emerald-500' : 'bg-white/10'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-lg transition-transform ${
                    config.analyticsSync.enabled ? 'translate-x-7.5 left-0.5' : 'left-0.5'
                  }`}
                  style={{ transform: config.analyticsSync.enabled ? 'translateX(28px)' : 'translateX(0)' }}
                />
              </button>
              <div>
                <h3 className="text-white font-semibold">
                  Daily Analytics Sync is {config.analyticsSync.enabled ? 'Active' : 'Off'}
                </h3>
                <p className="text-xs text-white/40">
                  Pull Meta and Google analytics automatically once per day without opening the dashboard
                </p>
              </div>
            </div>

            <button
              onClick={runAnalyticsNow}
              disabled={runningAnalytics}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-sm transition-colors disabled:opacity-30"
            >
              {runningAnalytics ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Run Sync Now
            </button>
          </div>

          <div className={`grid grid-cols-1 lg:grid-cols-3 gap-4 ${!config.analyticsSync.enabled ? 'opacity-60' : ''}`}>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
              <p className="text-[10px] uppercase tracking-wider text-white/30 mb-2">Run Time</p>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-white/30" />
                <input
                  type="time"
                  value={config.analyticsSync.runAt}
                  onChange={e => updateAnalyticsSync({ runAt: e.target.value })}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-accent-violet/50"
                />
              </div>
              <p className="text-xs text-white/30 mt-2">Bucharest time. Recommended for end of day: 23:30-23:55.</p>
            </div>

            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
              <p className="text-[10px] uppercase tracking-wider text-white/30 mb-2">Providers</p>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-white/60">
                  <input
                    type="checkbox"
                    checked={config.analyticsSync.includeMeta}
                    onChange={e => updateAnalyticsSync({ includeMeta: e.target.checked })}
                    className="rounded border-white/10 bg-white/5"
                  />
                  Sync Meta analytics
                </label>
                <label className="flex items-center gap-2 text-sm text-white/60">
                  <input
                    type="checkbox"
                    checked={config.analyticsSync.includeGoogle}
                    onChange={e => updateAnalyticsSync({ includeGoogle: e.target.checked })}
                    className="rounded border-white/10 bg-white/5"
                  />
                  Sync Google Business analytics
                </label>
              </div>
            </div>

            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
              <p className="text-[10px] uppercase tracking-wider text-white/30 mb-2">Last Run</p>
              <p className="text-sm text-white/70">
                {config.analyticsSync.lastRunAt
                  ? new Date(config.analyticsSync.lastRunAt).toLocaleString('ro-RO')
                  : 'Not run yet'}
              </p>
              {config.analyticsSync.lastRunSummary && (
                <p className="text-xs text-white/35 mt-2 leading-relaxed">
                  {config.analyticsSync.lastRunSummary.processedClients} client{config.analyticsSync.lastRunSummary.processedClients !== 1 ? 's' : ''} processed
                  {' · '}Meta {config.analyticsSync.lastRunSummary.metaSuccess} ok / {config.analyticsSync.lastRunSummary.metaFailed} failed
                  {' · '}Google {config.analyticsSync.lastRunSummary.googleSuccess} ok / {config.analyticsSync.lastRunSummary.googleFailed} failed
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Per-Client Config */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
            Client Configuration
          </h2>
          <div className="space-y-2">
            {data.clients.map((client, i) => {
              const clientConfig = config.clients[client.id] || {
                autoPublish: false,
                publishWindowStart: '09:00',
                publishWindowEnd: '21:00',
              }
              const scheduledPosts = client.posts.filter(p => p.status === 'scheduled').length

              return (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.03 }}
                  className={`glass rounded-xl p-4 ${!config.enabled ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ background: client.color }}
                      />
                      <div>
                        <h3 className="text-white font-medium text-sm">{client.displayName}</h3>
                        <p className="text-xs text-white/30">
                          {scheduledPosts} scheduled post{scheduledPosts !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Publish Window */}
                      <AnimatePresence>
                        {clientConfig.autoPublish && (
                          <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            className="flex items-center gap-2 overflow-hidden"
                          >
                            <Clock className="w-3.5 h-3.5 text-white/20 shrink-0" />
                            <input
                              type="time"
                              value={clientConfig.publishWindowStart}
                              onChange={e => updateClientWindow(client.id, 'publishWindowStart', e.target.value)}
                              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white/60 focus:outline-none focus:border-accent-violet/50 w-[80px]"
                            />
                            <span className="text-white/20 text-xs">to</span>
                            <input
                              type="time"
                              value={clientConfig.publishWindowEnd}
                              onChange={e => updateClientWindow(client.id, 'publishWindowEnd', e.target.value)}
                              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white/60 focus:outline-none focus:border-accent-violet/50 w-[80px]"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Toggle */}
                      <button
                        onClick={() => toggleClient(client.id)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${
                          clientConfig.autoPublish ? 'bg-emerald-500' : 'bg-white/10'
                        }`}
                      >
                        <div
                          className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                          style={{ transform: clientConfig.autoPublish ? 'translateX(20px)' : 'translateX(2px)' }}
                        />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-6 mb-6"
        >
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            How Auto-Publish Works
          </h3>
          <div className="space-y-2 text-sm text-white/50">
            <p>
              <span className="text-white/70">1.</span> Posts with status <span className="text-status-scheduled font-medium">"scheduled"</span> and a date that has passed will be auto-published.
            </p>
            <p>
              <span className="text-white/70">2.</span> Only clients with auto-publish <span className="text-emerald-400 font-medium">enabled</span> and within their publish window are processed.
            </p>
            <p>
              <span className="text-white/70">3.</span> The client must have a <span className="text-white/70">Meta page mapped</span> in Settings for publishing to work.
            </p>
            <p>
              <span className="text-white/70">4.</span> After publishing, the post status changes to <span className="text-status-published font-medium">"published"</span> automatically.
            </p>
          </div>
        </motion.div>

        {/* Activity Log */}
        <div>
          <button
            onClick={() => { setShowLog(!showLog); if (!showLog) fetchLog() }}
            className="flex items-center gap-2 text-sm text-white/50 hover:text-white/70 transition-colors mb-3"
          >
            <History className="w-4 h-4" />
            Activity Log ({log.length})
            {showLog ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <AnimatePresence>
            {showLog && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                {log.length === 0 ? (
                  <div className="glass rounded-xl p-6 text-center text-white/20 text-sm">
                    No scheduler activity yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {log.slice(0, 30).map(entry => (
                      <div
                        key={entry.id}
                        className="glass rounded-xl px-4 py-3 flex items-center gap-3"
                      >
                        {entry.action === 'published' && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                        {entry.action === 'failed' && (
                          <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                        )}
                        {entry.action === 'skipped' && (
                          <SkipForward className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white/70 truncate">{entry.message}</p>
                          <p className="text-xs text-white/30">
                            {entry.clientName || entry.clientId} · {entry.platform}
                            {entry.caption && ` · "${entry.caption.slice(0, 40)}..."`}
                          </p>
                        </div>
                        <span className="text-xs text-white/20 shrink-0">
                          {timeAgo(entry.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
