import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Link2, Copy, Check, Trash2, ExternalLink, MousePointerClick,
  Globe, BarChart3, TrendingUp, Users, ArrowUpDown, ArrowUp, ArrowDown,
  Loader2, AlertCircle, Zap, Target, Layers, DollarSign, Calculator,
  ChevronDown,
} from 'lucide-react'
import { useApp } from '../../../core/context'

// ── Types ────────────────────────────────────────────────

interface UtmLink {
  id: string
  postId: string
  clientId: string
  clientName: string
  platform: string
  pillar: string
  campaignName: string
  websiteUrl: string
  fullUrl: string
  shortCode: string
  createdAt: string
  clicks: number
}

interface ClientStats {
  clientId: string
  clientName: string
  links: UtmLink[]
  totalClicks: number
}

interface ClickDay {
  date: string
  count: number
}

interface PlatformClicks {
  platform: string
  clicks: number
}

interface PillarClicks {
  pillar: string
  clicks: number
}

interface AllStats {
  clients: ClientStats[]
  totalLinks: number
  totalClicks: number
  clicksByDay: ClickDay[]
}

interface ClientUtmStats {
  clientId: string
  links: UtmLink[]
  totalClicks: number
  byPlatform: PlatformClicks[]
  byPillar: PillarClicks[]
  clicksByDay: ClickDay[]
  topPosts: UtmLink[]
}

type Tab = 'generator' | 'dashboard' | 'links'
type LinkSort = 'clicks' | 'date'
type LinkSortDir = 'asc' | 'desc'

// ── Platform colors ──────────────────────────────────────

const PLATFORM_COLORS: Record<string, string> = {
  facebook: '#1877F2',
  instagram: '#E4405F',
  linkedin: '#0A66C2',
  tiktok: '#00f2ea',
  google: '#4285F4',
  stories: '#FF6B35',
}

const PILLAR_COLORS = [
  '#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1',
]

// ── Main Component ───────────────────────────────────────

export function RevenueAttribution() {
  const { data, selectedClient } = useApp()
  const [tab, setTab] = useState<Tab>('generator')

  const tabs: { id: Tab; label: string; icon: typeof Link2 }[] = [
    { id: 'generator', label: 'UTM Generator', icon: Link2 },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'links', label: 'Link Management', icon: Layers },
  ]

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-start justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Revenue Attribution</h2>
          <p className="text-sm text-white/30">
            UTM tracking & click analytics for social posts
          </p>
        </div>
        <div className="flex items-center gap-1 glass rounded-lg p-1">
          {tabs.map(t => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  tab === t.id ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'
                }`}
              >
                <Icon size={12} />
                {t.label}
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* Content */}
      <div className="flex-1 scroll-area pr-2 pb-6">
        <AnimatePresence mode="wait">
          {tab === 'generator' && (
            <motion.div key="gen" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <UtmGenerator clients={data.clients} selectedClient={selectedClient} />
            </motion.div>
          )}
          {tab === 'dashboard' && (
            <motion.div key="dash" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <AttributionDashboard selectedClient={selectedClient} />
            </motion.div>
          )}
          {tab === 'links' && (
            <motion.div key="links" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <LinkManagement selectedClient={selectedClient} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── UTM Generator Panel ─────────────────────────────────

function UtmGenerator({ clients, selectedClient }: {
  clients: { id: string; name: string; displayName: string; posts: any[] }[]
  selectedClient: string | null
}) {
  const [clientId, setClientId] = useState(selectedClient || '')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [campaignName, setCampaignName] = useState('')
  const [postId, setPostId] = useState('')
  const [generating, setGenerating] = useState(false)
  const [bulkGenerating, setBulkGenerating] = useState(false)
  const [result, setResult] = useState<UtmLink | null>(null)
  const [bulkResult, setBulkResult] = useState<{ generated: number; total: number } | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    if (selectedClient) setClientId(selectedClient)
  }, [selectedClient])

  const client = clients.find(c => c.id === clientId)
  const selectedPost = client?.posts.find((p: any) => p.id === postId)

  // Auto-build preview URL
  const previewUrl = useMemo(() => {
    if (!websiteUrl || !postId || !selectedPost) return ''
    try {
      const url = new URL(websiteUrl)
      url.searchParams.set('utm_source', selectedPost.platform?.toLowerCase() || '')
      url.searchParams.set('utm_medium', 'social')
      const now = new Date()
      const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
      const cName = campaignName || `${(client?.displayName || client?.name || '').toLowerCase().replace(/\s+/g, '-')}_${months[now.getMonth()]}_${now.getFullYear()}`
      url.searchParams.set('utm_campaign', cName)
      url.searchParams.set('utm_content', postId)
      if (selectedPost.pillar) url.searchParams.set('utm_term', selectedPost.pillar.toLowerCase())
      return url.toString()
    } catch {
      return ''
    }
  }, [websiteUrl, postId, selectedPost, campaignName, client])

  async function handleGenerate() {
    if (!postId || !clientId || !websiteUrl) return
    setGenerating(true)
    setError('')
    setResult(null)
    try {
      const r = await fetch('/api/utm/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          clientId,
          platform: selectedPost?.platform || 'facebook',
          pillar: selectedPost?.pillar || '',
          campaignName: campaignName || undefined,
          websiteUrl,
        }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error)
      setResult(data.link)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  async function handleBulkGenerate() {
    if (!clientId || !websiteUrl) return
    setBulkGenerating(true)
    setError('')
    setBulkResult(null)
    try {
      const r = await fetch('/api/utm/generate-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          websiteUrl,
          campaignName: campaignName || undefined,
        }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error)
      setBulkResult(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBulkGenerating(false)
    }
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Config row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Client selector */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-white/30 font-semibold mb-2">Client</label>
          <select
            value={clientId}
            onChange={e => { setClientId(e.target.value); setPostId('') }}
            className="w-full glass rounded-lg px-3 py-2.5 text-sm text-white bg-transparent border border-white/[0.06] focus:border-accent-violet/50 focus:outline-none transition-colors appearance-none"
          >
            <option value="" className="bg-[#1a1a2e]">Select a client...</option>
            {clients.map(c => (
              <option key={c.id} value={c.id} className="bg-[#1a1a2e]">{c.displayName || c.name}</option>
            ))}
          </select>
        </div>

        {/* Website URL */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-white/30 font-semibold mb-2">Website URL</label>
          <div className="relative">
            <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
            <input
              type="url"
              value={websiteUrl}
              onChange={e => setWebsiteUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full glass rounded-lg pl-9 pr-3 py-2.5 text-sm text-white bg-transparent border border-white/[0.06] focus:border-accent-violet/50 focus:outline-none transition-colors placeholder:text-white/15"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Post selector */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-white/30 font-semibold mb-2">Post</label>
          <select
            value={postId}
            onChange={e => setPostId(e.target.value)}
            disabled={!clientId}
            className="w-full glass rounded-lg px-3 py-2.5 text-sm text-white bg-transparent border border-white/[0.06] focus:border-accent-violet/50 focus:outline-none transition-colors appearance-none disabled:opacity-30"
          >
            <option value="" className="bg-[#1a1a2e]">Select a post...</option>
            {client?.posts.map((p: any) => (
              <option key={p.id} value={p.id} className="bg-[#1a1a2e]">
                [{p.platform}] {p.caption?.slice(0, 60) || '(no caption)'}...
              </option>
            ))}
          </select>
        </div>

        {/* Campaign name (optional) */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-white/30 font-semibold mb-2">Campaign Name <span className="text-white/15">(optional)</span></label>
          <input
            type="text"
            value={campaignName}
            onChange={e => setCampaignName(e.target.value)}
            placeholder="Auto-generated if empty"
            className="w-full glass rounded-lg px-3 py-2.5 text-sm text-white bg-transparent border border-white/[0.06] focus:border-accent-violet/50 focus:outline-none transition-colors placeholder:text-white/15"
          />
        </div>
      </div>

      {/* Preview */}
      {previewUrl && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <ExternalLink size={12} className="text-accent-violet" />
            <span className="text-[11px] uppercase tracking-wider text-white/30 font-semibold">UTM Preview</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs text-cyan-400/80 bg-white/[0.03] rounded-lg px-3 py-2 font-mono break-all">
              {previewUrl}
            </code>
            <button
              onClick={() => copyToClipboard(previewUrl, 'preview')}
              className="p-2 rounded-lg glass glass-hover text-white/40 hover:text-white transition-colors shrink-0"
            >
              {copied === 'preview' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
          </div>
        </motion.div>
      )}

      {/* Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleGenerate}
          disabled={!postId || !clientId || !websiteUrl || generating}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all bg-accent-violet/20 text-accent-violet hover:bg-accent-violet/30 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {generating ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
          Generate Link
        </button>
        <button
          onClick={handleBulkGenerate}
          disabled={!clientId || !websiteUrl || bulkGenerating}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {bulkGenerating ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
          Generate for All Posts
        </button>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
        >
          <AlertCircle size={14} />
          {error}
        </motion.div>
      )}

      {/* Single result */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <Check size={14} className="text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-400">Link Generated</span>
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-white/25 font-semibold">Full UTM URL</span>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 text-xs text-cyan-400/80 bg-white/[0.03] rounded-lg px-3 py-2 font-mono break-all">
                  {result.fullUrl}
                </code>
                <button
                  onClick={() => copyToClipboard(result.fullUrl, 'full')}
                  className="p-2 rounded-lg glass glass-hover text-white/40 hover:text-white transition-colors shrink-0"
                >
                  {copied === 'full' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-white/25 font-semibold">Tracking URL</span>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 text-xs text-amber-400/80 bg-white/[0.03] rounded-lg px-3 py-2 font-mono break-all">
                  {window.location.origin}/api/utm/track/{result.shortCode}
                </code>
                <button
                  onClick={() => copyToClipboard(`${window.location.origin}/api/utm/track/${result.shortCode}`, 'short')}
                  className="p-2 rounded-lg glass glass-hover text-white/40 hover:text-white transition-colors shrink-0"
                >
                  {copied === 'short' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Bulk result */}
      {bulkResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20"
        >
          <Zap size={14} className="text-cyan-400" />
          <span className="text-sm text-cyan-400">
            Generated <strong>{bulkResult.generated}</strong> new link{bulkResult.generated !== 1 ? 's' : ''}. Total: {bulkResult.total} links for this client.
          </span>
        </motion.div>
      )}
    </div>
  )
}

// ── Attribution Dashboard ────────────────────────────────

function AttributionDashboard({ selectedClient }: { selectedClient: string | null }) {
  const [allStats, setAllStats] = useState<AllStats | null>(null)
  const [clientStats, setClientStats] = useState<ClientUtmStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [adSpend, setAdSpend] = useState('')
  const [revenue, setRevenue] = useState('')

  const loadStats = useCallback(async () => {
    setLoading(true)
    try {
      const [allRes, clientRes] = await Promise.all([
        fetch('/api/utm/stats'),
        selectedClient ? fetch(`/api/utm/stats/${selectedClient}`) : Promise.resolve(null),
      ])
      const allData = await allRes.json()
      setAllStats(allData)
      if (clientRes) {
        const cData = await clientRes.json()
        setClientStats(cData)
      } else {
        setClientStats(null)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [selectedClient])

  useEffect(() => { loadStats() }, [loadStats])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass rounded-xl p-4 h-20 shimmer" />
          ))}
        </div>
        <div className="glass rounded-xl h-[200px] shimmer" />
      </div>
    )
  }

  if (!allStats || allStats.totalLinks === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <MousePointerClick size={48} className="text-white/10 mx-auto mb-4" />
          <p className="text-white/30 text-sm mb-1">No UTM links generated yet</p>
          <p className="text-white/15 text-xs">Go to the UTM Generator tab to create tracking links</p>
        </div>
      </div>
    )
  }

  const stats = clientStats || {
    totalClicks: allStats.totalClicks,
    byPlatform: aggregatePlatforms(allStats.clients),
    byPillar: aggregatePillars(allStats.clients),
    clicksByDay: allStats.clicksByDay,
    topPosts: aggregateTopPosts(allStats.clients),
    links: allStats.clients.flatMap(c => c.links),
  }

  const totalLinks = clientStats ? clientStats.links.length : allStats.totalLinks
  const roas = adSpend && revenue ? (parseFloat(revenue) / parseFloat(adSpend)).toFixed(2) : null

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Clicks', value: stats.totalClicks, icon: MousePointerClick, gradient: 'from-violet-500 to-indigo-500' },
          { label: 'Links Created', value: totalLinks, icon: Link2, gradient: 'from-cyan-500 to-blue-500' },
          { label: 'Platforms', value: stats.byPlatform.length, icon: Globe, gradient: 'from-emerald-500 to-teal-500' },
          { label: 'Clients', value: allStats.clients.length, icon: Users, gradient: 'from-amber-500 to-orange-500' },
        ].map((m, i) => {
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

      {/* Clicks by platform */}
      {stats.byPlatform.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 className="text-sm font-semibold text-white/50 mb-4 uppercase tracking-wider">Clicks by Platform</h3>
          <div className="glass rounded-xl p-5">
            <HorizontalBarChart
              data={stats.byPlatform.map(p => ({
                label: p.platform.charAt(0).toUpperCase() + p.platform.slice(1),
                value: p.clicks,
                color: PLATFORM_COLORS[p.platform] || '#7c3aed',
              }))}
              maxValue={Math.max(...stats.byPlatform.map(p => p.clicks), 1)}
            />
          </div>
        </motion.div>
      )}

      {/* Clicks by pillar */}
      {stats.byPillar.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 className="text-sm font-semibold text-white/50 mb-4 uppercase tracking-wider">Clicks by Pillar</h3>
          <div className="glass rounded-xl p-5">
            <HorizontalBarChart
              data={stats.byPillar.map((p, i) => ({
                label: p.pillar.charAt(0).toUpperCase() + p.pillar.slice(1),
                value: p.clicks,
                color: PILLAR_COLORS[i % PILLAR_COLORS.length],
              }))}
              maxValue={Math.max(...stats.byPillar.map(p => p.clicks), 1)}
            />
          </div>
        </motion.div>
      )}

      {/* Click timeline */}
      {stats.clicksByDay.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <h3 className="text-sm font-semibold text-white/50 mb-4 uppercase tracking-wider">Click Timeline</h3>
          <ClickTimelineChart data={stats.clicksByDay} />
        </motion.div>
      )}

      {/* Top performing posts */}
      {stats.topPosts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h3 className="text-sm font-semibold text-white/50 mb-4 uppercase tracking-wider">Top Posts by Clicks</h3>
          <div className="space-y-2">
            {stats.topPosts.slice(0, 5).map((link, i) => (
              <div key={link.id} className="glass glass-hover rounded-xl p-4 flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold gradient-text">#{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/60 truncate">{link.postId}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-white/25">
                    <span style={{ color: PLATFORM_COLORS[link.platform] || '#fff' }}>{link.platform}</span>
                    {link.pillar && <span className="text-white/15">{link.pillar}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-accent-violet tabular-nums">{link.clicks.toLocaleString('ro-RO')}</div>
                  <div className="text-[9px] text-white/25">clicks</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Client comparison */}
      {!selectedClient && allStats.clients.length > 1 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <h3 className="text-sm font-semibold text-white/50 mb-4 uppercase tracking-wider">Client Comparison</h3>
          <div className="glass rounded-xl p-5">
            <HorizontalBarChart
              data={allStats.clients
                .sort((a, b) => b.totalClicks - a.totalClicks)
                .map((c, i) => ({
                  label: c.clientName,
                  value: c.totalClicks,
                  color: PILLAR_COLORS[i % PILLAR_COLORS.length],
                }))}
              maxValue={Math.max(...allStats.clients.map(c => c.totalClicks), 1)}
            />
          </div>
        </motion.div>
      )}

      {/* ROI Calculator */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <h3 className="text-sm font-semibold text-white/50 mb-4 uppercase tracking-wider">ROI Estimation</h3>
        <div className="glass rounded-xl p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/25 font-semibold mb-1.5">Ad Spend (RON)</label>
              <div className="relative">
                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                <input
                  type="number"
                  value={adSpend}
                  onChange={e => setAdSpend(e.target.value)}
                  placeholder="0"
                  className="w-full glass rounded-lg pl-9 pr-3 py-2 text-sm text-white bg-transparent border border-white/[0.06] focus:border-accent-violet/50 focus:outline-none transition-colors placeholder:text-white/15 tabular-nums"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/25 font-semibold mb-1.5">Revenue (RON)</label>
              <div className="relative">
                <TrendingUp size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                <input
                  type="number"
                  value={revenue}
                  onChange={e => setRevenue(e.target.value)}
                  placeholder="0"
                  className="w-full glass rounded-lg pl-9 pr-3 py-2 text-sm text-white bg-transparent border border-white/[0.06] focus:border-accent-violet/50 focus:outline-none transition-colors placeholder:text-white/15 tabular-nums"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/25 font-semibold mb-1.5">ROAS</label>
              <div className="glass rounded-lg px-4 py-2 flex items-center gap-2">
                <Calculator size={14} className="text-white/20" />
                {roas ? (
                  <span className={`text-lg font-bold tabular-nums ${parseFloat(roas) >= 1 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {roas}x
                  </span>
                ) : (
                  <span className="text-sm text-white/15">Enter values</span>
                )}
              </div>
            </div>
          </div>
          {roas && (
            <div className="mt-3 text-xs text-white/30">
              For every 1 RON spent, you get {roas} RON back.
              {stats.totalClicks > 0 && adSpend && (
                <> Cost per click: {(parseFloat(adSpend) / stats.totalClicks).toFixed(2)} RON.</>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// ── Link Management Table ────────────────────────────────

function LinkManagement({ selectedClient }: { selectedClient: string | null }) {
  const [links, setLinks] = useState<UtmLink[]>([])
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState<LinkSort>('date')
  const [sortDir, setSortDir] = useState<LinkSortDir>('desc')
  const [copied, setCopied] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const loadLinks = useCallback(async () => {
    setLoading(true)
    try {
      const endpoint = selectedClient ? `/api/utm/stats/${selectedClient}` : '/api/utm/stats'
      const r = await fetch(endpoint)
      const data = await r.json()
      if (selectedClient) {
        setLinks(data.links || [])
      } else {
        setLinks(data.clients?.flatMap((c: ClientStats) => c.links) || [])
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [selectedClient])

  useEffect(() => { loadLinks() }, [loadLinks])

  const sortedLinks = useMemo(() => {
    const sorted = [...links]
    sorted.sort((a, b) => {
      if (sortKey === 'clicks') {
        return sortDir === 'desc' ? b.clicks - a.clicks : a.clicks - b.clicks
      }
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return sortDir === 'desc' ? dateB - dateA : dateA - dateB
    })
    return sorted
  }, [links, sortKey, sortDir])

  function toggleSort(key: LinkSort) {
    if (sortKey === key) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  async function handleDelete(linkId: string) {
    setDeleting(linkId)
    try {
      await fetch(`/api/utm/${linkId}`, { method: 'DELETE' })
      setLinks(prev => prev.filter(l => l.id !== linkId))
    } catch { /* ignore */ }
    setDeleting(null)
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  function SortIcon({ column }: { column: LinkSort }) {
    if (sortKey !== column) return <ArrowUpDown size={11} className="text-white/15" />
    return sortDir === 'desc'
      ? <ArrowDown size={11} className="text-accent-violet" />
      : <ArrowUp size={11} className="text-accent-violet" />
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass rounded-lg h-16 shimmer" />
        ))}
      </div>
    )
  }

  if (links.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Link2 size={48} className="text-white/10 mx-auto mb-4" />
          <p className="text-white/30 text-sm mb-1">No UTM links yet</p>
          <p className="text-white/15 text-xs">Generate links from the UTM Generator tab</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Table header */}
      <div className="grid grid-cols-[1fr_90px_90px_80px_60px] gap-2 px-4 py-2 text-[10px] uppercase tracking-wider text-white/25 font-semibold mb-1">
        <span>Post / Link</span>
        <span>Platform</span>
        <button onClick={() => toggleSort('date')} className="flex items-center gap-1 hover:text-white/50 transition-colors">
          Created <SortIcon column="date" />
        </button>
        <button onClick={() => toggleSort('clicks')} className="flex items-center gap-1 justify-end hover:text-white/50 transition-colors">
          Clicks <SortIcon column="clicks" />
        </button>
        <span />
      </div>

      {/* Rows */}
      <div className="space-y-1">
        {sortedLinks.map((link, i) => (
          <motion.div
            key={link.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.015 }}
            className="grid grid-cols-[1fr_90px_90px_80px_60px] gap-2 glass glass-hover rounded-lg px-4 py-3 items-center group"
          >
            {/* Post info */}
            <div className="min-w-0">
              <p className="text-xs text-white/60 truncate">{link.postId}</p>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-[10px] text-cyan-400/50 font-mono truncate max-w-[280px]">
                  {link.fullUrl}
                </code>
                <button
                  onClick={() => copyToClipboard(link.fullUrl, link.id)}
                  className="hidden group-hover:flex p-0.5 text-white/20 hover:text-white/60 transition-colors"
                >
                  {copied === link.id ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                </button>
              </div>
            </div>

            {/* Platform */}
            <div>
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium"
                style={{
                  backgroundColor: `${PLATFORM_COLORS[link.platform] || '#7c3aed'}15`,
                  color: PLATFORM_COLORS[link.platform] || '#7c3aed',
                }}
              >
                {link.platform}
              </span>
            </div>

            {/* Created */}
            <div className="text-xs text-white/30 tabular-nums">
              {new Date(link.createdAt).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}
            </div>

            {/* Clicks */}
            <div className="text-right">
              <span className="text-xs font-bold text-accent-violet tabular-nums">
                {link.clicks.toLocaleString('ro-RO')}
              </span>
            </div>

            {/* Delete */}
            <div className="text-right">
              <button
                onClick={() => handleDelete(link.id)}
                disabled={deleting === link.id}
                className="hidden group-hover:inline-flex p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                {deleting === link.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-[1fr_90px_90px_80px_60px] gap-2 px-4 py-3 mt-3 border-t border-white/[0.06]">
        <div className="text-xs font-semibold text-white/50">
          Total ({sortedLinks.length} link{sortedLinks.length !== 1 ? 's' : ''})
        </div>
        <div />
        <div />
        <div className="text-xs font-bold text-accent-violet text-right tabular-nums">
          {sortedLinks.reduce((s, l) => s + l.clicks, 0).toLocaleString('ro-RO')}
        </div>
        <div />
      </div>
    </div>
  )
}

// ── Chart Components ─────────────────────────────────────

function HorizontalBarChart({ data, maxValue }: {
  data: { label: string; value: number; color: string }[]
  maxValue: number
}) {
  return (
    <div className="space-y-0">
      {data.map((item, i) => (
        <div key={item.label} className="py-3 border-b border-white/[0.04] last:border-0">
          <div className="flex justify-between mb-1.5">
            <span className="text-xs text-white/50">{item.label}</span>
            <span className="text-xs font-semibold text-white/80 tabular-nums">
              {item.value.toLocaleString('ro-RO')}
              <span className="text-white/25 ml-1">
                ({maxValue > 0 ? ((item.value / maxValue) * 100).toFixed(1) : 0}%)
              </span>
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.05 }}
              className="h-full rounded-full"
              style={{ backgroundColor: item.color }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function ClickTimelineChart({ data }: { data: ClickDay[] }) {
  const maxVal = Math.max(...data.map(d => d.count), 1)
  const barWidth = Math.max(8, Math.min(32, 600 / data.length - 4))

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-end gap-1 h-[140px]" style={{ justifyContent: data.length < 15 ? 'center' : 'flex-start' }}>
        {data.map((d, i) => {
          const h = Math.max(2, (d.count / maxVal) * 120)
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
                    <div className="text-accent-violet font-semibold">{d.count} click{d.count !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: h }}
                  transition={{ delay: i * 0.02, duration: 0.4, ease: 'easeOut' }}
                  className="rounded-t cursor-default"
                  style={{
                    width: barWidth,
                    background: 'linear-gradient(to top, #7c3aed, #06b6d4)',
                    opacity: 0.7 + (d.count / maxVal) * 0.3,
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

// ── Aggregation helpers ──────────────────────────────────

function aggregatePlatforms(clients: ClientStats[]): PlatformClicks[] {
  const map: Record<string, number> = {}
  for (const client of clients) {
    for (const link of client.links) {
      map[link.platform] = (map[link.platform] || 0) + link.clicks
    }
  }
  return Object.entries(map).map(([platform, clicks]) => ({ platform, clicks }))
}

function aggregatePillars(clients: ClientStats[]): PillarClicks[] {
  const map: Record<string, number> = {}
  for (const client of clients) {
    for (const link of client.links) {
      if (link.pillar) {
        map[link.pillar] = (map[link.pillar] || 0) + link.clicks
      }
    }
  }
  return Object.entries(map).map(([pillar, clicks]) => ({ pillar, clicks }))
}

function aggregateTopPosts(clients: ClientStats[]): UtmLink[] {
  return clients
    .flatMap(c => c.links)
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10)
}
