import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Megaphone, Plus, Search, Filter, Eye, MousePointerClick, Heart,
  UserPlus, ShoppingCart, DollarSign, Calendar, Target, MoreVertical,
  Trash2, Pause, Play, CheckCircle2, X, ChevronRight, RefreshCw, Download,
  Loader2, AlertCircle,
} from 'lucide-react'
import { useApp } from '../../../core/context'
import { apiUrl } from '../../../core/config'
import { useCampaigns } from '../hooks/useCampaigns'
import { useMetaAds } from '../hooks/useMetaAds'
import type { Campaign, CampaignStatus, CampaignObjective, AdPlatform } from '../types'
import { OBJECTIVES, AD_PLATFORMS, STATUS_CONFIG } from '../types'
import { CampaignDetail } from './CampaignDetail'
import { NewCampaignModal } from './NewCampaignModal'

const OBJECTIVE_ICONS: Record<CampaignObjective, typeof Eye> = {
  awareness: Eye,
  traffic: MousePointerClick,
  engagement: Heart,
  leads: UserPlus,
  conversions: ShoppingCart,
  sales: DollarSign,
}

export function CampaignList() {
  const { data, selectedClient, meta } = useApp()
  const campaignHook = useCampaigns()
  const { campaigns, loading, getTotalSpend, getBudgetUtilization } = campaignHook
  const metaAds = useMetaAds()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all')
  const [showNew, setShowNew] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)

  const handleSync = async () => {
    const clientId = selectedClient || data.clients[0]?.id
    if (!clientId) return

    // Check if this client has an ad account mapped
    if (!metaAds.mapping[clientId]) {
      setSyncResult('No ad account mapped. Map one below first.')
      return
    }

    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch(apiUrl(`/api/ads/sync/${clientId}`), { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setSyncResult(`Synced ${data.synced} campaigns from ${data.adAccountName}`)
        campaignHook.refresh()
      } else {
        setSyncResult(data.error || 'Sync failed')
      }
    } catch (err: any) {
      setSyncResult(err.message || 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  const handleSyncAll = async () => {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch(apiUrl('/api/ads/sync-all'), { method: 'POST' })
      const data = await res.json()
      const total = data.results?.reduce((s: number, r: any) => s + (r.synced || 0), 0) || 0
      const errors = data.results?.filter((r: any) => !r.success).length || 0
      setSyncResult(`Synced ${total} campaigns${errors > 0 ? ` (${errors} errors)` : ''}`)
      campaignHook.refresh()
    } catch (err: any) {
      setSyncResult(err.message || 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  // Filter campaigns
  const filtered = campaigns.filter(c => {
    if (selectedClient && c.clientId !== selectedClient) return false
    if (statusFilter !== 'all' && c.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return c.name.toLowerCase().includes(q) || c.clientId.toLowerCase().includes(q)
    }
    return true
  })

  // Stats
  const totalBudget = filtered.reduce((s, c) => s + c.budget, 0)
  const totalSpent = filtered.reduce((s, c) => s + getTotalSpend(c), 0)
  const activeCampaigns = filtered.filter(c => c.status === 'active').length
  const totalVariants = filtered.reduce((s, c) => s + c.variants.length, 0)

  const getClientName = (clientId: string) => {
    const client = data.clients.find(c => c.id === clientId)
    return client?.displayName || clientId
  }

  const getClientColor = (clientId: string) => {
    const client = data.clients.find(c => c.id === clientId)
    return client?.color || '#7c3aed'
  }

  const handleStatusChange = async (campaign: Campaign, newStatus: CampaignStatus) => {
    await campaignHook.updateStatus(campaign.id, newStatus)
    setMenuOpen(null)
  }

  const handleDelete = async (id: string) => {
    await campaignHook.deleteCampaign(id)
    setMenuOpen(null)
  }

  if (selectedCampaign) {
    const fresh = campaigns.find(c => c.id === selectedCampaign.id) || selectedCampaign
    return (
      <CampaignDetail
        campaign={fresh}
        campaignHook={campaignHook}
        onBack={() => setSelectedCampaign(null)}
      />
    )
  }

  return (
    <div className="flex-1 overflow-y-auto scroll-area p-6 pr-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-start justify-between"
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
              <Megaphone size={16} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Campaigns</h2>
          </div>
          <p className="text-sm text-white/30 ml-11">Plan, track, and optimize ad campaigns</p>
        </div>
        <div className="flex items-center gap-2">
          {meta.connected && (
            <button
              onClick={selectedClient ? handleSync : handleSyncAll}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass glass-hover text-white/60 hover:text-white text-sm font-medium transition-all disabled:opacity-40"
            >
              {syncing ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {syncing ? 'Syncing...' : selectedClient ? 'Sync from Meta' : 'Sync All'}
            </button>
          )}
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-accent-violet to-accent-indigo text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            New Campaign
          </button>
        </div>
      </motion.div>

      {/* Sync Result / Ad Account Mapping */}
      {syncResult && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-4 flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium ${
            syncResult.includes('failed') || syncResult.includes('No ad account')
              ? 'bg-red-500/10 text-red-400'
              : 'bg-emerald-500/10 text-emerald-400'
          }`}
        >
          {syncResult.includes('failed') || syncResult.includes('No ad account')
            ? <AlertCircle size={14} />
            : <CheckCircle2 size={14} />}
          {syncResult}
          <button onClick={() => setSyncResult(null)} className="ml-auto p-0.5 hover:text-white/60">
            <X size={12} />
          </button>
        </motion.div>
      )}

      {/* Ad Account Mapping (show when no mapping exists for selected client) */}
      {meta.connected && selectedClient && !metaAds.mapping[selectedClient] && metaAds.accounts.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 glass rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={14} className="text-amber-400" />
            <span className="text-xs text-white/50 font-medium">Map an ad account to sync campaigns</span>
          </div>
          <select
            onChange={async (e) => {
              if (e.target.value) {
                await metaAds.setMapping(selectedClient, e.target.value)
              }
            }}
            defaultValue=""
            className="w-full glass rounded-lg px-3 py-2 text-sm text-white/80 bg-transparent border border-white/[0.08] outline-none focus:border-accent-violet/40"
          >
            <option value="" className="bg-surface-200">Select ad account...</option>
            {metaAds.accounts.map(a => (
              <option key={a.id} value={a.id} className="bg-surface-200">
                {a.name} ({a.id}) — {a.currency}
              </option>
            ))}
          </select>
        </motion.div>
      )}

      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
      >
        {[
          { label: 'Active', value: activeCampaigns, gradient: 'from-emerald-500 to-emerald-600', icon: Play },
          { label: 'Total Budget', value: `${totalBudget.toLocaleString('ro-RO')} lei`, gradient: 'from-accent-violet to-accent-indigo', icon: Target },
          { label: 'Total Spent', value: `${totalSpent.toLocaleString('ro-RO')} lei`, gradient: 'from-orange-500 to-pink-500', icon: DollarSign },
          { label: 'Ad Variants', value: totalVariants, gradient: 'from-cyan-500 to-blue-500', icon: Filter },
        ].map(m => {
          const Icon = m.icon
          return (
            <div key={m.label} className="glass glass-hover rounded-xl p-4 cursor-default">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${m.gradient} bg-opacity-10`}>
                  <Icon size={16} className="text-white/90" />
                </div>
                <div className="min-w-0">
                  <div className="text-lg font-bold text-white truncate">{m.value}</div>
                  <div className="text-[11px] text-white/40 uppercase tracking-wider font-medium">{m.label}</div>
                </div>
              </div>
            </div>
          )
        })}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-3 mb-6"
      >
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full glass rounded-lg pl-9 pr-3 py-2 text-sm text-white/80 bg-transparent border border-white/[0.08] outline-none focus:border-accent-violet/40 transition-colors placeholder:text-white/20"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'planning', 'active', 'paused', 'completed'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === s
                  ? 'glass-active text-white'
                  : 'text-white/35 hover:text-white/60 hover:bg-white/[0.03]'
              }`}
            >
              {s === 'all' ? 'All' : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Campaign Cards */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="glass rounded-xl h-52 shimmer" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-sm">
            <Megaphone size={48} className="text-white/10 mx-auto mb-4" />
            <p className="text-white/40 text-sm mb-2">No campaigns yet</p>
            <p className="text-white/20 text-xs mb-6">Create your first ad campaign to start tracking performance</p>
            <button
              onClick={() => setShowNew(true)}
              className="px-4 py-2 rounded-lg bg-accent-violet/20 text-accent-violet text-sm font-medium hover:bg-accent-violet/30 transition-colors"
            >
              Create Campaign
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((campaign, i) => {
              const ObjIcon = OBJECTIVE_ICONS[campaign.objective as CampaignObjective] || Target
              const spent = getTotalSpend(campaign)
              const utilization = getBudgetUtilization(campaign)
              const statusCfg = STATUS_CONFIG[campaign.status as CampaignStatus] || STATUS_CONFIG.planning

              return (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setSelectedCampaign(campaign)}
                  className="glass glass-hover rounded-xl p-5 cursor-pointer group relative"
                >
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-white/[0.04]">
                      <ObjIcon size={16} className="text-white/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate group-hover:text-white/90">{campaign.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: getClientColor(campaign.clientId) }} />
                        <span className="text-[11px] text-white/40 truncate">{getClientName(campaign.clientId)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                        style={{ color: statusCfg.color, background: `${statusCfg.color}15` }}
                      >
                        {statusCfg.label}
                      </span>
                      <div className="relative">
                        <button
                          onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === campaign.id ? null : campaign.id) }}
                          className="p-1 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/[0.05] transition-all opacity-0 group-hover:opacity-100"
                        >
                          <MoreVertical size={14} />
                        </button>
                        {menuOpen === campaign.id && (
                          <div className="absolute right-0 top-8 z-50 glass rounded-lg py-1 min-w-[160px] shadow-2xl border border-white/[0.08]" onClick={e => e.stopPropagation()}>
                            {campaign.status !== 'active' && (
                              <button onClick={() => handleStatusChange(campaign, 'active')} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/60 hover:text-white hover:bg-white/[0.05]">
                                <Play size={12} /> Activate
                              </button>
                            )}
                            {campaign.status === 'active' && (
                              <button onClick={() => handleStatusChange(campaign, 'paused')} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/60 hover:text-white hover:bg-white/[0.05]">
                                <Pause size={12} /> Pause
                              </button>
                            )}
                            {campaign.status !== 'completed' && (
                              <button onClick={() => handleStatusChange(campaign, 'completed')} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/60 hover:text-white hover:bg-white/[0.05]">
                                <CheckCircle2 size={12} /> Complete
                              </button>
                            )}
                            <div className="h-px bg-white/[0.06] my-1" />
                            <button onClick={() => handleDelete(campaign.id)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400/80 hover:text-red-400 hover:bg-white/[0.05]">
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Platforms */}
                  <div className="flex items-center gap-1.5 mb-4">
                    {campaign.platforms.map(p => {
                      const plat = AD_PLATFORMS.find(ap => ap.value === p)
                      return (
                        <span
                          key={p}
                          className="px-2 py-0.5 rounded text-[10px] font-medium"
                          style={{ color: plat?.color || '#fff', background: `${plat?.color || '#fff'}15` }}
                        >
                          {plat?.label || p}
                        </span>
                      )
                    })}
                    {campaign.variants.length > 0 && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium text-white/30 bg-white/[0.04]">
                        {campaign.variants.length} variant{campaign.variants.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Budget Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] text-white/30">Budget</span>
                      <span className="text-[11px] text-white/50 tabular-nums">
                        {spent.toLocaleString('ro-RO')} / {campaign.budget.toLocaleString('ro-RO')} lei
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${utilization}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{
                          background: utilization > 90
                            ? 'linear-gradient(90deg, #ef4444, #f97316)'
                            : utilization > 70
                              ? 'linear-gradient(90deg, #f97316, #f59e0b)'
                              : 'linear-gradient(90deg, #7c3aed, #06b6d4)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] text-white/25">
                      <Calendar size={11} />
                      <span>{new Date(campaign.startDate).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}</span>
                      <span>—</span>
                      <span>{new Date(campaign.endDate).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    <ChevronRight size={14} className="text-white/15 group-hover:text-white/40 transition-colors" />
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* New Campaign Modal */}
      <AnimatePresence>
        {showNew && (
          <NewCampaignModal
            onClose={() => setShowNew(false)}
            onCreate={async (data) => {
              await campaignHook.createCampaign(data)
              setShowNew(false)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
