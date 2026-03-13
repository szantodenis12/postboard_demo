import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Target, Calendar, DollarSign, Plus, Trash2, Edit3,
  Trophy, TrendingUp, TrendingDown, BarChart3, MousePointerClick,
  Eye, Users, Save, X, Check,
} from 'lucide-react'
import { useApp } from '../../../core/context'
import type { Campaign, AdVariant, SpendEntry, AdPlatform } from '../types'
import { STATUS_CONFIG, VARIANT_STATUS_CONFIG, AD_PLATFORMS, EMPTY_METRICS } from '../types'

interface Props {
  campaign: Campaign
  campaignHook: any
  onBack: () => void
}

export function CampaignDetail({ campaign, campaignHook, onBack }: Props) {
  const { data } = useApp()
  const [activeTab, setActiveTab] = useState<'variants' | 'spend'>('variants')
  const [showAddVariant, setShowAddVariant] = useState(false)
  const [showAddSpend, setShowAddSpend] = useState(false)
  const [editingMetrics, setEditingMetrics] = useState<string | null>(null)

  const client = data.clients.find(c => c.id === campaign.clientId)
  const statusCfg = STATUS_CONFIG[campaign.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.planning
  const totalSpend = campaign.spendEntries.reduce((s, e) => s + e.amount, 0)
  const utilization = campaign.budget > 0 ? Math.min((totalSpend / campaign.budget) * 100, 100) : 0

  const daysTotal = Math.ceil((new Date(campaign.endDate).getTime() - new Date(campaign.startDate).getTime()) / 86400000)
  const daysElapsed = Math.max(0, Math.ceil((Date.now() - new Date(campaign.startDate).getTime()) / 86400000))
  const daysRemaining = Math.max(0, daysTotal - daysElapsed)

  return (
    <div className="flex-1 overflow-y-auto scroll-area p-6 pr-8">
      {/* Back + Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors mb-4"
        >
          <ArrowLeft size={14} /> Back to Campaigns
        </button>

        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-white">{campaign.name}</h2>
              <span
                className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: statusCfg.color, background: `${statusCfg.color}15` }}
              >
                {statusCfg.label}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-white/30">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: client?.color || '#7c3aed' }} />
                {client?.displayName || campaign.clientId}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={12} />
                {new Date(campaign.startDate).toLocaleDateString('ro-RO')} — {new Date(campaign.endDate).toLocaleDateString('ro-RO')}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6"
      >
        {[
          { label: 'Budget', value: `${campaign.budget.toLocaleString('ro-RO')} lei`, icon: Target, gradient: 'from-accent-violet to-accent-indigo' },
          { label: 'Spent', value: `${totalSpend.toLocaleString('ro-RO')} lei`, icon: DollarSign, gradient: 'from-orange-500 to-pink-500' },
          { label: 'Remaining', value: `${Math.max(0, campaign.budget - totalSpend).toLocaleString('ro-RO')} lei`, icon: BarChart3, gradient: 'from-emerald-500 to-emerald-600' },
          { label: 'Days Left', value: daysRemaining, icon: Calendar, gradient: 'from-cyan-500 to-blue-500' },
          { label: 'Variants', value: campaign.variants.length, icon: Users, gradient: 'from-pink-500 to-rose-500' },
        ].map(m => {
          const Icon = m.icon
          return (
            <div key={m.label} className="glass rounded-xl p-4 cursor-default">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${m.gradient} bg-opacity-10`}>
                  <Icon size={14} className="text-white/90" />
                </div>
                <div className="min-w-0">
                  <div className="text-base font-bold text-white truncate">{m.value}</div>
                  <div className="text-[10px] text-white/35 uppercase tracking-wider font-medium">{m.label}</div>
                </div>
              </div>
            </div>
          )
        })}
      </motion.div>

      {/* Budget Progress */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-xl p-4 mb-6"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white/40 font-medium">Budget Utilization</span>
          <span className="text-xs text-white/60 font-bold tabular-nums">{utilization.toFixed(1)}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${utilization}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
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
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {[
          { id: 'variants' as const, label: 'Ad Variants', icon: Users },
          { id: 'spend' as const, label: 'Spend Log', icon: DollarSign },
        ].map(tab => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${active ? 'glass-active text-white' : 'text-white/35 hover:text-white/60 hover:bg-white/[0.03]'}`}
            >
              <Icon size={14} className={active ? 'text-accent-violet' : ''} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Variants Tab */}
      {activeTab === 'variants' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-white/30">
              {campaign.variants.length} variant{campaign.variants.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => setShowAddVariant(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-accent-violet hover:bg-accent-violet/10 transition-colors font-medium"
            >
              <Plus size={13} /> Add Variant
            </button>
          </div>

          {campaign.variants.length === 0 ? (
            <div className="glass rounded-xl p-12 text-center">
              <Users size={36} className="text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/40 mb-1">No ad variants yet</p>
              <p className="text-xs text-white/20 mb-4">Create A/B variants to track ad performance</p>
              <button
                onClick={() => setShowAddVariant(true)}
                className="px-4 py-2 rounded-lg bg-accent-violet/20 text-accent-violet text-sm font-medium hover:bg-accent-violet/30 transition-colors"
              >
                Add First Variant
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {campaign.variants.map((variant, i) => {
                const vCfg = VARIANT_STATUS_CONFIG[variant.status] || VARIANT_STATUS_CONFIG.draft
                const isEditing = editingMetrics === variant.id
                return (
                  <VariantCard
                    key={variant.id}
                    variant={variant}
                    index={i}
                    vCfg={vCfg}
                    isEditing={isEditing}
                    onEditMetrics={() => setEditingMetrics(isEditing ? null : variant.id)}
                    onUpdateVariant={(updates) => campaignHook.updateVariant(campaign.id, variant.id, updates)}
                    onDeleteVariant={() => campaignHook.deleteVariant(campaign.id, variant.id)}
                  />
                )
              })}
            </div>
          )}

          <AnimatePresence>
            {showAddVariant && (
              <AddVariantModal
                campaignId={campaign.id}
                nextLabel={String.fromCharCode(65 + campaign.variants.length)}
                onAdd={async (v) => { await campaignHook.addVariant(campaign.id, v); setShowAddVariant(false) }}
                onClose={() => setShowAddVariant(false)}
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Spend Tab */}
      {activeTab === 'spend' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-white/30">
              {campaign.spendEntries.length} entr{campaign.spendEntries.length !== 1 ? 'ies' : 'y'}
            </span>
            <button
              onClick={() => setShowAddSpend(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-accent-violet hover:bg-accent-violet/10 transition-colors font-medium"
            >
              <Plus size={13} /> Add Spend
            </button>
          </div>

          {campaign.spendEntries.length === 0 ? (
            <div className="glass rounded-xl p-12 text-center">
              <DollarSign size={36} className="text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/40 mb-1">No spend entries</p>
              <p className="text-xs text-white/20 mb-4">Log your ad spend to track budget utilization</p>
              <button
                onClick={() => setShowAddSpend(true)}
                className="px-4 py-2 rounded-lg bg-accent-violet/20 text-accent-violet text-sm font-medium hover:bg-accent-violet/30 transition-colors"
              >
                Log Spend
              </button>
            </div>
          ) : (
            <div className="glass rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left text-[11px] text-white/30 uppercase tracking-wider font-medium px-4 py-3">Date</th>
                    <th className="text-left text-[11px] text-white/30 uppercase tracking-wider font-medium px-4 py-3">Platform</th>
                    <th className="text-right text-[11px] text-white/30 uppercase tracking-wider font-medium px-4 py-3">Amount</th>
                    <th className="text-left text-[11px] text-white/30 uppercase tracking-wider font-medium px-4 py-3">Notes</th>
                    <th className="w-10 px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {[...campaign.spendEntries].sort((a, b) => b.date.localeCompare(a.date)).map(entry => {
                    const plat = AD_PLATFORMS.find(p => p.value === entry.platform)
                    return (
                      <tr key={entry.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 text-xs text-white/60 tabular-nums">
                          {new Date(entry.date).toLocaleDateString('ro-RO')}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] font-medium" style={{ color: plat?.color || '#fff' }}>
                            {plat?.label || entry.platform}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-semibold text-white/80 tabular-nums">
                          {entry.amount.toLocaleString('ro-RO')} lei
                        </td>
                        <td className="px-4 py-3 text-xs text-white/40 truncate max-w-[200px]">
                          {entry.notes || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => campaignHook.deleteSpendEntry(campaign.id, entry.id)}
                            className="p-1 rounded text-white/15 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-white/[0.08]">
                    <td className="px-4 py-3 text-xs text-white/40 font-semibold">Total</td>
                    <td></td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-white tabular-nums">
                      {totalSpend.toLocaleString('ro-RO')} lei
                    </td>
                    <td></td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          <AnimatePresence>
            {showAddSpend && (
              <AddSpendModal
                campaign={campaign}
                onAdd={async (e) => { await campaignHook.addSpendEntry(campaign.id, e); setShowAddSpend(false) }}
                onClose={() => setShowAddSpend(false)}
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {campaign.notes && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="glass rounded-xl p-4 mt-6"
        >
          <h4 className="text-xs text-white/30 uppercase tracking-wider font-medium mb-2">Notes</h4>
          <p className="text-sm text-white/50 whitespace-pre-wrap">{campaign.notes}</p>
        </motion.div>
      )}
    </div>
  )
}

// ── Variant Card ──────────────────────────────────────

function VariantCard({
  variant,
  index,
  vCfg,
  isEditing,
  onEditMetrics,
  onUpdateVariant,
  onDeleteVariant,
}: {
  variant: AdVariant
  index: number
  vCfg: { label: string; color: string }
  isEditing: boolean
  onEditMetrics: () => void
  onUpdateVariant: (updates: Partial<AdVariant>) => Promise<void>
  onDeleteVariant: () => Promise<void>
}) {
  const [metrics, setMetrics] = useState(variant.metrics)
  const hasMetrics = variant.metrics.impressions > 0 || variant.metrics.clicks > 0

  const handleSaveMetrics = async () => {
    const ctr = metrics.impressions > 0 ? (metrics.clicks / metrics.impressions) * 100 : 0
    const cpc = metrics.clicks > 0 ? metrics.spend / metrics.clicks : 0
    await onUpdateVariant({
      metrics: { ...metrics, ctr: Number(ctr.toFixed(2)), cpc: Number(cpc.toFixed(2)) },
    })
    onEditMetrics()
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className="glass rounded-xl p-5"
    >
      {/* Variant header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-sm font-bold text-white/60">
            {variant.label}
          </div>
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: vCfg.color, background: `${vCfg.color}15` }}
          >
            {vCfg.label}
          </span>
          {variant.status === 'winner' && <Trophy size={14} className="text-amber-400" />}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onEditMetrics}
            className="p-1.5 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/[0.05] transition-all"
            title="Edit metrics"
          >
            <Edit3 size={12} />
          </button>
          <button
            onClick={onDeleteVariant}
            className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-white/[0.05] transition-all"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Ad Copy */}
      <div className="space-y-2 mb-4">
        <div>
          <span className="text-[10px] text-white/25 uppercase tracking-wider">Headline</span>
          <p className="text-sm font-semibold text-white/80">{variant.headline || '—'}</p>
        </div>
        <div>
          <span className="text-[10px] text-white/25 uppercase tracking-wider">Primary Text</span>
          <p className="text-xs text-white/50 line-clamp-3">{variant.primaryText || '—'}</p>
        </div>
        {variant.cta && (
          <div>
            <span className="text-[10px] text-white/25 uppercase tracking-wider">CTA</span>
            <p className="text-xs text-white/40">{variant.cta}</p>
          </div>
        )}
      </div>

      {/* Metrics */}
      {isEditing ? (
        <div className="space-y-2 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'impressions', label: 'Impressions' },
              { key: 'clicks', label: 'Clicks' },
              { key: 'conversions', label: 'Conversions' },
              { key: 'spend', label: 'Spend (RON)' },
            ].map(m => (
              <div key={m.key}>
                <label className="text-[10px] text-white/30 block mb-0.5">{m.label}</label>
                <input
                  type="number"
                  value={(metrics as any)[m.key]}
                  onChange={e => setMetrics(prev => ({ ...prev, [m.key]: Number(e.target.value) }))}
                  className="w-full rounded px-2 py-1.5 text-xs text-white/80 bg-white/[0.04] border border-white/[0.08] outline-none focus:border-accent-violet/40"
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 justify-end mt-2">
            <button onClick={onEditMetrics} className="p-1.5 rounded text-white/30 hover:text-white/60">
              <X size={14} />
            </button>
            <button
              onClick={handleSaveMetrics}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-accent-violet/20 text-accent-violet text-xs font-medium hover:bg-accent-violet/30 transition-colors"
            >
              <Save size={12} /> Save
            </button>
          </div>
        </div>
      ) : hasMetrics ? (
        <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-white/[0.02]">
          {[
            { label: 'Impressions', value: variant.metrics.impressions.toLocaleString('ro-RO'), icon: Eye },
            { label: 'Clicks', value: variant.metrics.clicks.toLocaleString('ro-RO'), icon: MousePointerClick },
            { label: 'CTR', value: `${variant.metrics.ctr}%`, icon: TrendingUp },
            { label: 'CPC', value: `${variant.metrics.cpc.toFixed(2)} lei`, icon: DollarSign },
            { label: 'Conversions', value: variant.metrics.conversions.toLocaleString('ro-RO'), icon: Check },
            { label: 'Spend', value: `${variant.metrics.spend.toLocaleString('ro-RO')} lei`, icon: BarChart3 },
          ].map(m => {
            const Icon = m.icon
            return (
              <div key={m.label} className="text-center">
                <Icon size={11} className="text-white/20 mx-auto mb-1" />
                <div className="text-xs font-semibold text-white/70 tabular-nums">{m.value}</div>
                <div className="text-[9px] text-white/25">{m.label}</div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="p-3 rounded-lg bg-white/[0.02] text-center">
          <p className="text-[11px] text-white/20">No metrics yet — click edit to add</p>
        </div>
      )}

      {/* Status change buttons */}
      <div className="flex gap-1.5 mt-3">
        {(['draft', 'active', 'winner', 'loser'] as const).map(s => (
          <button
            key={s}
            onClick={() => onUpdateVariant({ status: s })}
            className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
              variant.status === s
                ? 'bg-white/[0.08] text-white/70'
                : 'text-white/20 hover:text-white/40 hover:bg-white/[0.04]'
            }`}
          >
            {VARIANT_STATUS_CONFIG[s].label}
          </button>
        ))}
      </div>
    </motion.div>
  )
}

// ── Add Variant Modal ─────────────────────────────────

function AddVariantModal({
  campaignId,
  nextLabel,
  onAdd,
  onClose,
}: {
  campaignId: string
  nextLabel: string
  onAdd: (v: Omit<AdVariant, 'id'>) => Promise<void>
  onClose: () => void
}) {
  const [headline, setHeadline] = useState('')
  const [primaryText, setPrimaryText] = useState('')
  const [description, setDescription] = useState('')
  const [cta, setCta] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!headline.trim()) return
    setSaving(true)
    try {
      await onAdd({
        label: nextLabel,
        headline: headline.trim(),
        primaryText: primaryText.trim(),
        description: description.trim() || undefined,
        cta: cta.trim(),
        status: 'draft',
        metrics: EMPTY_METRICS,
      })
    } finally {
      setSaving(false)
    }
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
        className="glass rounded-2xl w-full max-w-md border border-white/[0.08]"
      >
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h3 className="text-base font-semibold text-white">Add Variant {nextLabel}</h3>
          <button onClick={onClose} className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.05]">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider font-medium mb-1.5 block">Headline</label>
            <input
              type="text"
              value={headline}
              onChange={e => setHeadline(e.target.value)}
              placeholder="Ad headline..."
              autoFocus
              className="w-full glass rounded-lg px-3 py-2.5 text-sm text-white/80 bg-transparent border border-white/[0.08] outline-none focus:border-accent-violet/40 transition-colors placeholder:text-white/20"
            />
          </div>
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider font-medium mb-1.5 block">Primary Text</label>
            <textarea
              value={primaryText}
              onChange={e => setPrimaryText(e.target.value)}
              placeholder="Main ad copy..."
              rows={3}
              className="w-full glass rounded-lg px-3 py-2.5 text-sm text-white/80 bg-transparent border border-white/[0.08] outline-none focus:border-accent-violet/40 transition-colors placeholder:text-white/20 resize-none"
            />
          </div>
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider font-medium mb-1.5 block">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Link description..."
              className="w-full glass rounded-lg px-3 py-2.5 text-sm text-white/80 bg-transparent border border-white/[0.08] outline-none focus:border-accent-violet/40 transition-colors placeholder:text-white/20"
            />
          </div>
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider font-medium mb-1.5 block">CTA</label>
            <input
              type="text"
              value={cta}
              onChange={e => setCta(e.target.value)}
              placeholder="e.g. Learn More, Shop Now, Sign Up..."
              className="w-full glass rounded-lg px-3 py-2.5 text-sm text-white/80 bg-transparent border border-white/[0.08] outline-none focus:border-accent-violet/40 transition-colors placeholder:text-white/20"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 p-5 border-t border-white/[0.06]">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-white/40 hover:text-white/60">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!headline.trim() || saving}
            className="px-5 py-2 rounded-lg bg-gradient-to-r from-accent-violet to-accent-indigo text-white text-sm font-medium hover:opacity-90 disabled:opacity-40"
          >
            {saving ? 'Adding...' : 'Add Variant'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Add Spend Modal ───────────────────────────────────

function AddSpendModal({
  campaign,
  onAdd,
  onClose,
}: {
  campaign: Campaign
  onAdd: (entry: Omit<SpendEntry, 'id'>) => Promise<void>
  onClose: () => void
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [amount, setAmount] = useState('')
  const [platform, setPlatform] = useState<AdPlatform>(campaign.platforms[0] as AdPlatform || 'facebook')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) return
    setSaving(true)
    try {
      await onAdd({ date, amount: Number(amount), platform, notes: notes.trim() || undefined })
    } finally {
      setSaving(false)
    }
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
        className="glass rounded-2xl w-full max-w-sm border border-white/[0.08]"
      >
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h3 className="text-base font-semibold text-white">Log Spend</h3>
          <button onClick={onClose} className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.05]">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider font-medium mb-1.5 block">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full glass rounded-lg px-3 py-2.5 text-sm text-white/80 bg-transparent border border-white/[0.08] outline-none focus:border-accent-violet/40"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider font-medium mb-1.5 block">Amount (RON)</label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="150"
                autoFocus
                className="w-full glass rounded-lg px-3 py-2.5 text-sm text-white/80 bg-transparent border border-white/[0.08] outline-none focus:border-accent-violet/40 placeholder:text-white/20"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider font-medium mb-1.5 block">Platform</label>
            <div className="flex gap-2">
              {AD_PLATFORMS.map(p => (
                <button
                  key={p.value}
                  onClick={() => setPlatform(p.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    platform === p.value ? 'glass-active text-white' : 'glass text-white/30 hover:text-white/50'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider font-medium mb-1.5 block">Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ad set name, description..."
              className="w-full glass rounded-lg px-3 py-2.5 text-sm text-white/80 bg-transparent border border-white/[0.08] outline-none focus:border-accent-violet/40 placeholder:text-white/20"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 p-5 border-t border-white/[0.06]">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-white/40 hover:text-white/60">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!amount || Number(amount) <= 0 || saving}
            className="px-5 py-2 rounded-lg bg-gradient-to-r from-accent-violet to-accent-indigo text-white text-sm font-medium hover:opacity-90 disabled:opacity-40"
          >
            {saving ? 'Saving...' : 'Log Spend'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
