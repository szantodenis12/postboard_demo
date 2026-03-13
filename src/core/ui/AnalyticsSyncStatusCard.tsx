import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, RefreshCw, XCircle } from 'lucide-react'

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

interface SchedulerConfigResponse {
  analyticsSync?: AnalyticsSyncConfig
}

type CardTone = 'inactive' | 'scheduled' | 'success' | 'partial' | 'failed'

const DEFAULT_CONFIG: AnalyticsSyncConfig = {
  enabled: false,
  runAt: '23:30',
  includeMeta: true,
  includeGoogle: true,
}

const TONE_STYLES: Record<CardTone, { label: string; icon: typeof Clock3; pill: string; accent: string }> = {
  inactive: {
    label: 'Inactive',
    icon: Clock3,
    pill: 'text-white/40 bg-white/5',
    accent: 'from-white/10 to-white/0',
  },
  scheduled: {
    label: 'Waiting first sync',
    icon: Clock3,
    pill: 'text-cyan-300 bg-cyan-400/10',
    accent: 'from-cyan-400/15 to-cyan-400/0',
  },
  success: {
    label: 'Healthy',
    icon: CheckCircle2,
    pill: 'text-emerald-300 bg-emerald-400/10',
    accent: 'from-emerald-400/15 to-emerald-400/0',
  },
  partial: {
    label: 'Partial',
    icon: AlertTriangle,
    pill: 'text-amber-300 bg-amber-400/10',
    accent: 'from-amber-400/15 to-amber-400/0',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    pill: 'text-red-300 bg-red-400/10',
    accent: 'from-red-400/15 to-red-400/0',
  },
}

function formatTimestamp(iso?: string) {
  if (!iso) return 'Never'

  return new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

function getStatusTone(config: AnalyticsSyncConfig): CardTone {
  if (!config.enabled) return 'inactive'
  if (!config.lastRunAt || !config.lastRunSummary) return 'scheduled'

  const { metaFailed, googleFailed, metaSuccess, googleSuccess } = config.lastRunSummary
  const failed = metaFailed + googleFailed
  const successful = metaSuccess + googleSuccess

  if (failed > 0 && successful === 0) return 'failed'
  if (failed > 0) return 'partial'
  return 'success'
}

export function AnalyticsSyncStatusCard({ compact = false }: { compact?: boolean }) {
  const [config, setConfig] = useState<AnalyticsSyncConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)

  const fetchConfig = useCallback(() => {
    fetch('/api/scheduler/config')
      .then(r => r.json())
      .then((data: SchedulerConfigResponse) => {
        setConfig({
          ...DEFAULT_CONFIG,
          ...(data.analyticsSync || {}),
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchConfig()
    const interval = window.setInterval(fetchConfig, 60000)
    return () => window.clearInterval(interval)
  }, [fetchConfig])

  const tone = useMemo(() => getStatusTone(config), [config])
  const toneStyle = TONE_STYLES[tone]
  const ToneIcon = toneStyle.icon
  const summary = config.lastRunSummary

  const description = (() => {
    if (!config.enabled) return `Daily sync is off. Current slot: ${config.runAt}`
    if (!config.lastRunAt) return `First automatic run is scheduled for ${config.runAt}`
    if (tone === 'success') return `Last run completed successfully at ${formatTimestamp(config.lastRunAt)}`
    if (tone === 'partial') return `Last run finished with provider errors at ${formatTimestamp(config.lastRunAt)}`
    if (tone === 'failed') return `Last run failed at ${formatTimestamp(config.lastRunAt)}`
    return `Next automatic run is scheduled for ${config.runAt}`
  })()

  const providerSummary = [
    config.includeMeta ? `Meta ${summary ? `${summary.metaSuccess}/${summary.metaFailed}` : 'on'}` : 'Meta off',
    config.includeGoogle ? `Google ${summary ? `${summary.googleSuccess}/${summary.googleFailed}` : 'on'}` : 'Google off',
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className={`glass glass-hover rounded-2xl p-5 relative overflow-hidden ${compact ? '' : ''}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${toneStyle.accent} pointer-events-none`} />

      <div className="relative">
        <div className={`flex ${compact ? 'flex-col gap-4' : 'flex-col gap-5 xl:flex-row xl:items-center xl:justify-between'}`}>
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                {loading ? (
                  <RefreshCw size={18} className="text-white/40 animate-spin" />
                ) : (
                  <ToneIcon size={18} className="text-white/80" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-white">Daily Analytics Sync</h3>
                  <span className={`text-[10px] font-semibold uppercase tracking-[0.18em] px-2 py-1 rounded-full ${toneStyle.pill}`}>
                    {toneStyle.label}
                  </span>
                </div>
                <p className="text-xs text-white/35 mt-1">{description}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 text-white/55">
                Daily at {config.runAt}
              </span>
              {providerSummary.map(item => (
                <span key={item} className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 text-white/55">
                  {item}
                </span>
              ))}
              {config.lastRunAt && (
                <span className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 text-white/55">
                  Last run {formatTimestamp(config.lastRunAt)}
                </span>
              )}
            </div>
          </div>

          <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'} shrink-0`}>
            <div className="rounded-xl bg-white/[0.04] px-3 py-2.5 border border-white/5 min-w-[112px]">
              <div className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Clients</div>
              <div className="text-lg font-bold text-white">{summary?.processedClients ?? 0}</div>
            </div>
            <div className="rounded-xl bg-white/[0.04] px-3 py-2.5 border border-white/5 min-w-[112px]">
              <div className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Meta</div>
              <div className="text-lg font-bold text-white">
                {config.includeMeta ? `${summary?.metaSuccess ?? 0}/${summary?.metaFailed ?? 0}` : 'Off'}
              </div>
            </div>
            <div className="rounded-xl bg-white/[0.04] px-3 py-2.5 border border-white/5 min-w-[112px]">
              <div className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Google</div>
              <div className="text-lg font-bold text-white">
                {config.includeGoogle ? `${summary?.googleSuccess ?? 0}/${summary?.googleFailed ?? 0}` : 'Off'}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => window.dispatchEvent(new CustomEvent('postboard:navigate', { detail: 'scheduler' }))}
          className="mt-4 inline-flex items-center gap-2 text-xs text-accent-cyan hover:text-cyan-200 transition-colors"
        >
          Open analytics sync settings
          <ArrowRight size={13} />
        </button>
      </div>
    </motion.div>
  )
}
