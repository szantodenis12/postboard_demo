import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3, Heart, MessageCircle, Share2, TrendingUp, RefreshCw,
  ChevronLeft, ChevronRight, Zap, AlertCircle,
  Facebook, Instagram, ExternalLink, Search, Map, Globe, Phone, Navigation,
} from 'lucide-react'
import { useApp } from '../../../core/context'
import { useAnalytics, type AnalyticsDataState, type ClientAnalytics, type GoogleInsightsData, type GoogleRetryStatus, type PostMetric } from '../hooks/useAnalytics'

const MONTHS = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie',
]

export function AnalyticsOverview() {
  const { data, selectedClient, meta, pageMapping } = useApp()
  const {
    analytics, googleAnalytics, metaState, googleState, googleRetry, loading, fetching, fetchingGoogle, error,
    loadAnalytics, fetchFresh, fetchGoogleFresh,
  } = useAnalytics()

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const period = `${year}-${String(month).padStart(2, '0')}`

  const [hasGoogleMapping, setHasGoogleMapping] = useState(false)
  const lastGoogleAutoFetchKeyRef = useRef<string | null>(null)
  const [googleFetchSlow, setGoogleFetchSlow] = useState(false)

  // Check if client has Google mapping
  useEffect(() => {
    if (!selectedClient) return
    fetch('/api/google/mapping')
      .then(r => r.json())
      .then(mapping => setHasGoogleMapping(!!mapping[selectedClient]))
      .catch(() => setHasGoogleMapping(false))
  }, [selectedClient])

  // Auto-load analytics when client changes
  useEffect(() => {
    if (selectedClient) loadAnalytics(selectedClient, period)
  }, [selectedClient, period, loadAnalytics])

  useEffect(() => {
    if (!selectedClient || !googleRetry || googleRetry.period !== period) return
    const interval = window.setInterval(() => {
      void loadAnalytics(selectedClient, period, { background: true })
    }, 60000)
    return () => window.clearInterval(interval)
  }, [selectedClient, period, googleRetry, loadAnalytics])

  useEffect(() => {
    if (!fetchingGoogle) {
      setGoogleFetchSlow(false)
      return
    }

    const timer = window.setTimeout(() => setGoogleFetchSlow(true), 12000)
    return () => window.clearTimeout(timer)
  }, [fetchingGoogle])

  useEffect(() => {
    if (!selectedClient || !hasGoogleMapping) return

    const autoFetchKey = `${selectedClient}:${period}`
    if (googleAnalytics?.period === period) {
      lastGoogleAutoFetchKeyRef.current = autoFetchKey
      return
    }
    if (googleRetry?.period === period && new Date(googleRetry.nextRetryAt).getTime() > Date.now()) {
      lastGoogleAutoFetchKeyRef.current = autoFetchKey
      return
    }
    if (fetchingGoogle) return
    if (lastGoogleAutoFetchKeyRef.current === autoFetchKey) return

    lastGoogleAutoFetchKeyRef.current = autoFetchKey
    void fetchGoogleFresh(selectedClient, period)
  }, [selectedClient, hasGoogleMapping, period, googleAnalytics?.period, googleRetry, fetchingGoogle, fetchGoogleFresh])

  const client = selectedClient ? data.clients.find(c => c.id === selectedClient) : null
  const hasMeta = meta.connected && selectedClient && pageMapping[selectedClient]
  const metaPeriodMismatch = !!analytics && analytics.period !== period
  const googlePeriodMismatch = !!googleAnalytics && googleAnalytics.period !== period

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  // No client selected
  if (!selectedClient) {
    return <NoClientSelected clientCount={data.clients.length} />
  }

  const hasAnyConnection = hasMeta || hasGoogleMapping

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-start justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Analytics</h2>
          <p className="text-sm text-white/30">
            {client?.displayName} — Performance metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period selector */}
          <div className="flex items-center gap-1 glass rounded-lg px-1 py-1">
            <button onClick={prevMonth} className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors">
              <ChevronLeft size={14} />
            </button>
            <span className="text-sm font-medium text-white/70 min-w-[120px] text-center">
              {MONTHS[month - 1]} {year}
            </span>
            <button onClick={nextMonth} className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors">
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Fetch buttons */}
          <div className="flex items-center gap-1">
            {hasMeta && (
              <button
                onClick={() => fetchFresh(selectedClient, period)}
                disabled={fetching}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all bg-accent-violet/20 text-accent-violet hover:bg-accent-violet/30 disabled:opacity-50"
              >
                <RefreshCw size={14} className={fetching ? 'animate-spin' : ''} />
                {fetching ? 'Meta...' : 'Fetch Meta'}
              </button>
            )}
            {hasGoogleMapping && (
              <button
                onClick={() => fetchGoogleFresh(selectedClient, period)}
                disabled={fetchingGoogle}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all bg-[#4285F4]/20 text-[#4285F4] hover:bg-[#4285F4]/30 disabled:opacity-50"
              >
                <RefreshCw size={14} className={fetchingGoogle ? 'animate-spin' : ''} />
                {fetchingGoogle ? 'Google...' : 'Fetch Google'}
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
        >
          <AlertCircle size={14} />
          {error}
        </motion.div>
      )}

      {analytics?.warnings?.facebook && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm"
        >
          <AlertCircle size={14} />
          Facebook analytics nu au putut fi încărcate: {analytics.warnings.facebook}
        </motion.div>
      )}

      {analytics?.warnings?.instagram && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm"
        >
          <AlertCircle size={14} />
          Instagram analytics nu au putut fi încărcate: {analytics.warnings.instagram}
        </motion.div>
      )}

      {googleFetchSlow && !error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-[#4285F4]/10 border border-[#4285F4]/20 text-[#8ab4f8] text-sm"
        >
          <AlertCircle size={14} />
          Google răspunde lent sau este limitat temporar. Dacă nu apare nimic în 1-2 minute, intră în Settings și apasă Fetch Locations pe contul Google.
        </motion.div>
      )}

      {googleRetry?.period === period && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-[#4285F4]/10 border border-[#4285F4]/20 text-[#8ab4f8] text-sm"
        >
          <AlertCircle size={14} />
          Google retry programat automat la {new Date(googleRetry.nextRetryAt).toLocaleString('ro-RO')}
          {googleRetry.attempts > 0 ? ` după ${googleRetry.attempts} încercări eșuate.` : '.'}
        </motion.div>
      )}

      {/* Content */}
      <div className="flex-1 scroll-area pr-2 pb-6">
        {!hasAnyConnection ? (
          <NoConnection />
        ) : loading ? (
          <LoadingSkeleton />
        ) : !analytics && !googleAnalytics ? (
          <EmptyState
            hasMeta={!!hasMeta}
            hasGoogle={hasGoogleMapping}
            onFetchMeta={() => fetchFresh(selectedClient, period)}
            onFetchGoogle={() => fetchGoogleFresh(selectedClient, period)}
            fetching={fetching}
            fetchingGoogle={fetchingGoogle}
          />
        ) : (
          <>
            {analytics && (
              <>
                <ProviderSnapshotNotice
                  provider="Meta"
                  state={metaState}
                  requestedPeriod={period}
                  dataPeriod={analytics.period}
                  lastFetched={analytics.lastFetched}
                />
                <MetaAnalyticsContent analytics={analytics} />
              </>
            )}
            {googleAnalytics && (
              <>
                <ProviderSnapshotNotice
                  provider="Google"
                  state={googleState}
                  requestedPeriod={period}
                  dataPeriod={googleAnalytics.period}
                  lastFetched={googleAnalytics.lastFetched}
                  retry={googleRetry}
                />
                <GoogleAnalyticsContent data={googleAnalytics} />
              </>
            )}

            {/* Last fetched info */}
            <div className="mt-8 text-center text-xs text-white/20 space-y-0.5">
              {analytics && (
                <div>
                  Meta: {metaState.source === 'live' ? 'live' : 'cached'} &middot; {new Date(analytics.lastFetched).toLocaleString('ro-RO')} &middot; {analytics.period}
                  {metaPeriodMismatch && (
                    <span> &middot; viewing fallback for {analytics.period}</span>
                  )}
                </div>
              )}
              {googleAnalytics && (
                <div>
                  Google: {googleState.source === 'live' ? 'live' : 'cached'} &middot; {new Date(googleAnalytics.lastFetched).toLocaleString('ro-RO')} &middot; {googleAnalytics.period}
                  {googlePeriodMismatch && (
                    <span> &middot; viewing fallback for {googleAnalytics.period}</span>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function formatPeriodLabel(period: string) {
  const [year, month] = period.split('-').map(Number)
  if (!year || !month) return period
  return `${MONTHS[month - 1]} ${year}`
}

function ProviderSnapshotNotice({
  provider,
  state,
  requestedPeriod,
  dataPeriod,
  lastFetched,
  retry,
}: {
  provider: 'Meta' | 'Google'
  state: AnalyticsDataState
  requestedPeriod: string
  dataPeriod: string
  lastFetched: string
  retry?: GoogleRetryStatus | null
}) {
  const hasFallbackReason = !!state.message && state.source === 'cached'
  const hasPeriodMismatch = dataPeriod !== requestedPeriod

  if (!hasFallbackReason && !hasPeriodMismatch) {
    return null
  }

  const isWarning = hasFallbackReason
  const title = hasFallbackReason
    ? `${provider} live fetch indisponibil`
    : `${provider} afișează un snapshot salvat`

  const description = hasFallbackReason
    ? `${state.message} Afișăm ultimul snapshot salvat pentru ${formatPeriodLabel(dataPeriod)}.`
    : `Perioada selectată este ${formatPeriodLabel(requestedPeriod)}, dar momentan vezi snapshotul salvat pentru ${formatPeriodLabel(dataPeriod)}.`

  const retryMessage = retry && retry.period === requestedPeriod
    ? ` Reîncercare automată la ${new Date(retry.nextRetryAt).toLocaleString('ro-RO')}.`
    : ''

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-4 flex items-start gap-3 px-4 py-3 rounded-lg border text-sm ${
        isWarning
          ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
          : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-200'
      }`}
    >
      <AlertCircle size={15} className="mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="font-medium">{title}</div>
        <div className="text-xs opacity-90 mt-1">
          {description}
          {retryMessage}
        </div>
        <div className="text-[11px] opacity-60 mt-1.5">
          Snapshot salvat la {new Date(lastFetched).toLocaleString('ro-RO')}
        </div>
      </div>
    </motion.div>
  )
}

// ── Meta analytics content ──────────────────────────────
function MetaAnalyticsContent({ analytics }: { analytics: ClientAnalytics }) {
  const c = analytics.combined
  const fb = analytics.facebook
  const ig = analytics.instagram

  const metrics = [
    { label: 'Total Posts', value: c.totalPosts, icon: BarChart3, gradient: 'from-violet-500 to-indigo-500' },
    { label: 'Total Likes', value: c.totalLikes, icon: Heart, gradient: 'from-pink-500 to-rose-500' },
    { label: 'Comments', value: c.totalComments, icon: MessageCircle, gradient: 'from-cyan-500 to-blue-500' },
    { label: 'Shares', value: c.totalShares, icon: Share2, gradient: 'from-emerald-500 to-teal-500' },
    { label: 'Engagement', value: c.totalEngagement, icon: TrendingUp, gradient: 'from-amber-500 to-orange-500' },
    { label: 'Avg / Post', value: c.avgEngagement, icon: Zap, gradient: 'from-purple-500 to-violet-500' },
  ]

  return (
    <>
      {/* Section title */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Facebook size={14} className="text-[#1877F2]" />
          <Instagram size={14} className="text-[#E4405F]" />
        </div>
        <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider">Meta (Facebook + Instagram)</h3>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {metrics.map((m, i) => {
          const Icon = m.icon
          return (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass glass-hover rounded-xl p-4 cursor-default"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${m.gradient} bg-opacity-10`}>
                  <Icon size={16} className="text-white/90" />
                </div>
                <div>
                  <div className="text-xl font-bold text-white">{m.value.toLocaleString('ro-RO')}</div>
                  <div className="text-[11px] text-white/40 uppercase tracking-wider font-medium">{m.label}</div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Engagement chart */}
      {c.engagementByDay.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h3 className="text-sm font-semibold text-white/50 mb-4 uppercase tracking-wider">Engagement by Day</h3>
          <EngagementChart data={c.engagementByDay} />
        </motion.div>
      )}

      {/* Platform breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-8"
      >
        <h3 className="text-sm font-semibold text-white/50 mb-4 uppercase tracking-wider">Platform Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PlatformCard platform="facebook" data={fb} />
          <PlatformCard platform="instagram" data={ig} />
        </div>
      </motion.div>

      {/* Top posts */}
      {c.topPosts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <h3 className="text-sm font-semibold text-white/50 mb-4 uppercase tracking-wider">Top Performing Posts</h3>
          <div className="space-y-2">
            {c.topPosts.slice(0, 5).map((post, i) => (
              <TopPostCard key={post.metaPostId} post={post} rank={i + 1} />
            ))}
          </div>
        </motion.div>
      )}
    </>
  )
}

// ── Google Business Profile analytics ───────────────────
function GoogleAnalyticsContent({ data }: { data: GoogleInsightsData }) {
  const m = data.metrics

  const metrics = [
    { label: 'Search Views', value: m.searchViews, icon: Search, gradient: 'from-blue-500 to-cyan-500' },
    { label: 'Map Views', value: m.mapViews, icon: Map, gradient: 'from-emerald-500 to-green-500' },
    { label: 'Website Clicks', value: m.websiteClicks, icon: Globe, gradient: 'from-violet-500 to-purple-500' },
    { label: 'Phone Calls', value: m.phoneClicks, icon: Phone, gradient: 'from-amber-500 to-yellow-500' },
    { label: 'Directions', value: m.directionRequests, icon: Navigation, gradient: 'from-rose-500 to-pink-500' },
    { label: 'Total', value: m.totalInteractions, icon: TrendingUp, gradient: 'from-[#4285F4] to-[#34A853]' },
  ]

  return (
    <>
      {/* Section title */}
      <div className="flex items-center gap-2 mb-4 mt-2">
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="none">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider">Google Business Profile</h3>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {metrics.map((mi, i) => {
          const Icon = mi.icon
          return (
            <motion.div
              key={mi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass glass-hover rounded-xl p-4 cursor-default"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${mi.gradient} bg-opacity-10`}>
                  <Icon size={16} className="text-white/90" />
                </div>
                <div>
                  <div className="text-xl font-bold text-white">{mi.value.toLocaleString('ro-RO')}</div>
                  <div className="text-[11px] text-white/40 uppercase tracking-wider font-medium">{mi.label}</div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Daily chart */}
      {data.dailyMetrics.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h3 className="text-sm font-semibold text-white/50 mb-4 uppercase tracking-wider">Google Daily Metrics</h3>
          <GoogleDailyChart data={data.dailyMetrics} />
        </motion.div>
      )}

      {/* Breakdown card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-8"
      >
        <h3 className="text-sm font-semibold text-white/50 mb-4 uppercase tracking-wider">Interaction Breakdown</h3>
        <div className="glass rounded-xl p-5">
          <div className="space-y-0">
            {[
              { label: 'Search Impressions', value: m.searchViews, color: '#4285F4', pct: m.totalInteractions ? (m.searchViews / m.totalInteractions * 100) : 0 },
              { label: 'Map Impressions', value: m.mapViews, color: '#34A853', pct: m.totalInteractions ? (m.mapViews / m.totalInteractions * 100) : 0 },
              { label: 'Website Clicks', value: m.websiteClicks, color: '#7c3aed', pct: m.totalInteractions ? (m.websiteClicks / m.totalInteractions * 100) : 0 },
              { label: 'Phone Calls', value: m.phoneClicks, color: '#FBBC05', pct: m.totalInteractions ? (m.phoneClicks / m.totalInteractions * 100) : 0 },
              { label: 'Direction Requests', value: m.directionRequests, color: '#EA4335', pct: m.totalInteractions ? (m.directionRequests / m.totalInteractions * 100) : 0 },
            ].map(item => (
              <div key={item.label} className="py-3 border-b border-white/[0.04] last:border-0">
                <div className="flex justify-between mb-1.5">
                  <span className="text-xs text-white/50">{item.label}</span>
                  <span className="text-xs font-semibold text-white/80 tabular-nums">
                    {item.value.toLocaleString('ro-RO')}
                    <span className="text-white/25 ml-1">({item.pct.toFixed(1)}%)</span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.pct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </>
  )
}

// ── Google daily stacked bar chart ──────────────────────
function GoogleDailyChart({ data }: { data: GoogleInsightsData['dailyMetrics'] }) {
  const maxVal = Math.max(...data.map(d => d.searches + d.maps + d.website + d.phone + d.directions), 1)
  const barWidth = Math.max(8, Math.min(32, 600 / data.length - 4))

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-end gap-1 h-[140px]" style={{ justifyContent: data.length < 15 ? 'center' : 'flex-start' }}>
        {data.map((d, i) => {
          const total = d.searches + d.maps + d.website + d.phone + d.directions
          const h = Math.max(2, (total / maxVal) * 120)
          const day = new Date(d.date).getDate()
          return (
            <div key={d.date} className="flex flex-col items-center gap-1 group" style={{ flex: data.length > 20 ? 1 : 'none' }}>
              <div className="relative">
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                  <div className="glass rounded-lg px-3 py-2 text-[10px] text-white/70 whitespace-nowrap shadow-xl">
                    <div className="font-medium text-white mb-1">
                      {new Date(d.date).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}
                    </div>
                    <div>{d.searches} search &middot; {d.maps} maps</div>
                    <div>{d.website} web &middot; {d.phone} phone &middot; {d.directions} dir</div>
                    <div className="text-[#4285F4] font-semibold mt-0.5">{total} total</div>
                  </div>
                </div>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: h }}
                  transition={{ delay: i * 0.02, duration: 0.4, ease: 'easeOut' }}
                  className="rounded-t cursor-default"
                  style={{
                    width: barWidth,
                    background: `linear-gradient(to top, #4285F4, #34A853)`,
                    opacity: 0.7 + (total / maxVal) * 0.3,
                  }}
                />
              </div>
              <span className="text-[9px] text-white/25 tabular-nums">{day}</span>
            </div>
          )
        })}
      </div>
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-white/30">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: '#4285F4' }} />Search</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: '#34A853' }} />Maps</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: '#7c3aed' }} />Website</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: '#FBBC05' }} />Phone</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: '#EA4335' }} />Directions</span>
      </div>
    </div>
  )
}

// ── Engagement chart (SVG bar chart) ─────────────────────
function EngagementChart({ data }: { data: { date: string; engagement: number; likes: number; comments: number; shares: number }[] }) {
  const maxVal = Math.max(...data.map(d => d.engagement), 1)
  const barWidth = Math.max(8, Math.min(32, 600 / data.length - 4))

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-end gap-1 h-[140px]" style={{ justifyContent: data.length < 15 ? 'center' : 'flex-start' }}>
        {data.map((d, i) => {
          const h = Math.max(2, (d.engagement / maxVal) * 120)
          const day = new Date(d.date).getDate()
          return (
            <div key={d.date} className="flex flex-col items-center gap-1 group" style={{ flex: data.length > 20 ? 1 : 'none' }}>
              <div className="relative">
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                  <div className="glass rounded-lg px-3 py-2 text-[10px] text-white/70 whitespace-nowrap shadow-xl">
                    <div className="font-medium text-white mb-1">{new Date(d.date).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}</div>
                    <div>{d.likes} likes &middot; {d.comments} comments{d.shares > 0 ? ` · ${d.shares} shares` : ''}</div>
                    <div className="text-accent-violet font-semibold mt-0.5">{d.engagement} total</div>
                  </div>
                </div>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: h }}
                  transition={{ delay: i * 0.02, duration: 0.4, ease: 'easeOut' }}
                  className="rounded-t cursor-default"
                  style={{
                    width: barWidth,
                    background: `linear-gradient(to top, #7c3aed, #06b6d4)`,
                    opacity: 0.7 + (d.engagement / maxVal) * 0.3,
                  }}
                />
              </div>
              <span className="text-[9px] text-white/25 tabular-nums">{day}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Platform card ────────────────────────────────────────
function PlatformCard({ platform, data }: {
  platform: 'facebook' | 'instagram'
  data: { posts: any[]; totalLikes: number; totalComments: number; totalShares: number; totalEngagement: number; avgEngagement: number }
}) {
  const isFB = platform === 'facebook'
  const Icon = isFB ? Facebook : Instagram
  const color = isFB ? '#1877F2' : '#E4405F'

  const stats = [
    { label: 'Posts', value: data.posts.length },
    { label: 'Likes', value: data.totalLikes },
    { label: 'Comments', value: data.totalComments },
    ...(isFB ? [{ label: 'Shares', value: data.totalShares }] : []),
    { label: 'Total Engagement', value: data.totalEngagement },
    { label: 'Avg per Post', value: data.avgEngagement },
  ]

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={18} style={{ color }} />
        <span className="text-sm font-semibold" style={{ color }}>
          {isFB ? 'Facebook' : 'Instagram'}
        </span>
        {data.posts.length === 0 && (
          <span className="text-[10px] text-white/20 ml-auto">No data</span>
        )}
      </div>
      <div className="space-y-0">
        {stats.map(s => (
          <div key={s.label} className="flex justify-between py-2 border-b border-white/[0.04] last:border-0">
            <span className="text-xs text-white/40">{s.label}</span>
            <span className="text-xs font-semibold text-white/80 tabular-nums">{s.value.toLocaleString('ro-RO')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Top post card ────────────────────────────────────────
function TopPostCard({ post, rank }: { post: PostMetric; rank: number }) {
  const isFB = post.platform === 'facebook'
  const PlatformIcon = isFB ? Facebook : Instagram
  const platformColor = isFB ? '#1877F2' : '#E4405F'

  return (
    <div className="glass glass-hover rounded-xl p-4 flex gap-4 group">
      {/* Rank */}
      <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
        <span className="text-sm font-bold gradient-text">#{rank}</span>
      </div>

      {/* Thumbnail */}
      {post.imageUrl && (
        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-white/5">
          <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white/60 line-clamp-2 mb-1.5">
          {post.message.slice(0, 150)}{post.message.length > 150 ? '...' : ''}
        </p>
        <div className="flex items-center gap-3 text-[10px] text-white/30">
          <span className="flex items-center gap-1">
            <PlatformIcon size={10} style={{ color: platformColor }} />
            {isFB ? 'Facebook' : 'Instagram'}
          </span>
          <span>{new Date(post.publishedAt).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}</span>
          {post.permalink && (
            <a
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-0.5 hover:text-white/60 transition-colors"
              onClick={e => e.stopPropagation()}
            >
              <ExternalLink size={9} /> View
            </a>
          )}
        </div>
      </div>

      {/* Engagement metrics */}
      <div className="flex items-center gap-4 shrink-0 text-xs">
        <div className="text-center">
          <div className="font-semibold text-pink-400 tabular-nums">{post.likes.toLocaleString('ro-RO')}</div>
          <div className="text-[9px] text-white/25">likes</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-cyan-400 tabular-nums">{post.comments.toLocaleString('ro-RO')}</div>
          <div className="text-[9px] text-white/25">comments</div>
        </div>
        {post.shares > 0 && (
          <div className="text-center">
            <div className="font-semibold text-emerald-400 tabular-nums">{post.shares.toLocaleString('ro-RO')}</div>
            <div className="text-[9px] text-white/25">shares</div>
          </div>
        )}
        <div className="text-center pl-2 border-l border-white/[0.06]">
          <div className="font-bold text-accent-violet tabular-nums">{post.engagement.toLocaleString('ro-RO')}</div>
          <div className="text-[9px] text-white/25">total</div>
        </div>
      </div>
    </div>
  )
}

// ── Empty states ─────────────────────────────────────────
function NoClientSelected({ clientCount }: { clientCount: number }) {
  return (
    <div className="h-full flex flex-col">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">Analytics</h2>
        <p className="text-sm text-white/30">Select a client from the sidebar to view analytics</p>
      </motion.div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 size={48} className="text-white/10 mx-auto mb-4" />
          <p className="text-white/30 text-sm mb-1">No client selected</p>
          <p className="text-white/15 text-xs">
            Choose one of your {clientCount} client{clientCount !== 1 ? 's' : ''} to see performance data
          </p>
        </div>
      </div>
    </div>
  )
}

function NoConnection() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-sm">
        <AlertCircle size={48} className="text-white/10 mx-auto mb-4" />
        <p className="text-white/40 text-sm mb-2">No platform connected</p>
        <p className="text-white/20 text-xs">
          Connect Meta or Google in Settings and map a page/location to this client to fetch analytics.
        </p>
      </div>
    </div>
  )
}

function EmptyState({ hasMeta, hasGoogle, onFetchMeta, onFetchGoogle, fetching, fetchingGoogle }: {
  hasMeta: boolean; hasGoogle: boolean
  onFetchMeta: () => void; onFetchGoogle: () => void
  fetching: boolean; fetchingGoogle: boolean
}) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[400px]">
      <div className="text-center max-w-sm">
        <TrendingUp size={48} className="text-white/10 mx-auto mb-4" />
        <p className="text-white/40 text-sm mb-2">No analytics data yet</p>
        <p className="text-white/20 text-xs mb-6">
          Click below to fetch engagement data for this client.
        </p>
        <div className="flex items-center justify-center gap-3">
          {hasMeta && (
            <button
              onClick={onFetchMeta}
              disabled={fetching}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent-violet/20 text-accent-violet text-sm font-medium hover:bg-accent-violet/30 transition-colors"
            >
              <RefreshCw size={14} className={fetching ? 'animate-spin' : ''} />
              {fetching ? 'Fetching...' : 'Fetch Meta'}
            </button>
          )}
          {hasGoogle && (
            <button
              onClick={onFetchGoogle}
              disabled={fetchingGoogle}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#4285F4]/20 text-[#4285F4] text-sm font-medium hover:bg-[#4285F4]/30 transition-colors"
            >
              <RefreshCw size={14} className={fetchingGoogle ? 'animate-spin' : ''} />
              {fetchingGoogle ? 'Fetching...' : 'Fetch Google'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass rounded-xl p-4 h-20 shimmer" />
        ))}
      </div>
      <div className="glass rounded-xl h-[200px] shimmer" />
      <div className="grid grid-cols-2 gap-4">
        <div className="glass rounded-xl h-[240px] shimmer" />
        <div className="glass rounded-xl h-[240px] shimmer" />
      </div>
    </div>
  )
}
