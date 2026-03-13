import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calculator, Loader2, AlertCircle, TrendingUp, DollarSign, FileText, Heart, BarChart3 } from 'lucide-react'
import { useApp } from '../../../core/context'

interface ROIData {
  monthlyRetainer: number
  postsDelivered: number
  costPerPost: number
  totalEngagement: number
  costPerEngagement: number
  estimatedAdValue: number
  roi: number
}

function formatRON(val: number): string {
  return val.toLocaleString('ro-RO', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' RON'
}

export function ROICalculator() {
  const { selectedClient, data } = useApp()
  const [roi, setRoi] = useState<ROIData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [overrides, setOverrides] = useState<Partial<ROIData>>({})

  useEffect(() => {
    if (!selectedClient) { setRoi(null); return }
    setLoading(true)
    setError(null)
    setOverrides({})
    fetch(`/api/intelligence/roi?clientId=${selectedClient}`)
      .then(r => { if (!r.ok) throw new Error('No ROI data available'); return r.json() })
      .then(d => setRoi(d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [selectedClient])

  const clientName = selectedClient
    ? data.clients.find(c => c.id === selectedClient)?.displayName || selectedClient
    : null

  // Merge overrides with API data
  const effective = roi ? {
    ...roi,
    monthlyRetainer: overrides.monthlyRetainer ?? roi.monthlyRetainer,
    postsDelivered: overrides.postsDelivered ?? roi.postsDelivered,
    totalEngagement: overrides.totalEngagement ?? roi.totalEngagement,
  } : null

  // Recalculate derived metrics when overrides change
  const computed = effective ? (() => {
    const cpp = effective.postsDelivered > 0 ? effective.monthlyRetainer / effective.postsDelivered : 0
    const cpe = effective.totalEngagement > 0 ? effective.monthlyRetainer / effective.totalEngagement : 0
    const adValue = effective.totalEngagement * 0.15
    const roiPct = effective.monthlyRetainer > 0 ? ((adValue - effective.monthlyRetainer) / effective.monthlyRetainer) * 100 : 0
    return { ...effective, costPerPost: cpp, costPerEngagement: cpe, estimatedAdValue: adValue, roi: roiPct }
  })() : null

  const METRICS = computed ? [
    { label: 'Monthly Retainer', value: formatRON(computed.monthlyRetainer), icon: DollarSign, color: 'text-violet-400', bg: 'bg-violet-500/20' },
    { label: 'Posts Delivered', value: computed.postsDelivered.toString(), icon: FileText, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
    { label: 'Cost per Post', value: formatRON(computed.costPerPost), icon: BarChart3, color: 'text-amber-400', bg: 'bg-amber-500/20' },
    { label: 'Total Engagement', value: computed.totalEngagement.toLocaleString('ro-RO'), icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/20' },
    { label: 'Cost per Engagement', value: formatRON(computed.costPerEngagement), icon: TrendingUp, color: 'text-orange-400', bg: 'bg-orange-500/20' },
    { label: 'Est. Ad Value', value: formatRON(computed.estimatedAdValue), icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  ] : []

  return (
    <div className="h-full flex flex-col">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">ROI Calculator</h2>
        <p className="text-sm text-white/30">
          {clientName ? `Return on investment for ${clientName}` : 'Select a client to calculate ROI'}
        </p>
      </motion.div>

      {!selectedClient ? (
        <div className="flex-1 flex items-center justify-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl p-12 text-center max-w-sm">
            <Calculator size={48} className="text-white/10 mx-auto mb-4" />
            <h3 className="text-sm font-semibold text-white/40 mb-2">No client selected</h3>
            <p className="text-xs text-white/20">Select a client from the sidebar to see ROI metrics.</p>
          </motion.div>
        </div>
      ) : loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-white/20" />
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-8 text-center max-w-sm">
            <AlertCircle size={32} className="text-red-400/60 mx-auto mb-3" />
            <p className="text-sm text-white/40">{error}</p>
          </motion.div>
        </div>
      ) : computed ? (
        <div className="flex-1 overflow-y-auto scroll-area flex flex-col gap-4">
          {/* ROI Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-5 flex items-center gap-4"
          >
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
              computed.roi >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'
            }`}>
              <TrendingUp size={28} className={computed.roi >= 0 ? 'text-emerald-400' : 'text-red-400'} />
            </div>
            <div>
              <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Return on Investment</div>
              <div className={`text-3xl font-bold ${computed.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {computed.roi >= 0 ? '+' : ''}{computed.roi.toFixed(1)}%
              </div>
            </div>
            <div className="flex-1" />
            <div className="text-right">
              <div className="text-xs text-white/30">Ad value vs Retainer</div>
              <div className="text-sm text-white/60">
                {formatRON(computed.estimatedAdValue)} / {formatRON(computed.monthlyRetainer)}
              </div>
            </div>
          </motion.div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-3 gap-3">
            {METRICS.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.04 }}
                className="glass rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-7 h-7 rounded-lg ${m.bg} flex items-center justify-center`}>
                    <m.icon size={14} className={m.color} />
                  </div>
                  <span className="text-[10px] text-white/30 uppercase tracking-wider">{m.label}</span>
                </div>
                <div className="text-lg font-bold text-white/80">{m.value}</div>
              </motion.div>
            ))}
          </div>

          {/* Visual Comparison Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-xl p-5"
          >
            <h3 className="text-sm font-semibold text-white mb-4">Retainer vs Estimated Ad Value</h3>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Monthly Retainer', value: computed.monthlyRetainer, color: 'bg-violet-500', textColor: 'text-violet-400' },
                { label: 'Estimated Ad Value', value: computed.estimatedAdValue, color: 'bg-emerald-500', textColor: 'text-emerald-400' },
              ].map((bar) => {
                const max = Math.max(computed.monthlyRetainer, computed.estimatedAdValue, 1)
                const pct = (bar.value / max) * 100
                return (
                  <div key={bar.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-white/40">{bar.label}</span>
                      <span className={`text-xs font-medium ${bar.textColor}`}>{formatRON(bar.value)}</span>
                    </div>
                    <div className="h-6 rounded-lg bg-white/5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
                        className={`h-full rounded-lg ${bar.color}/60`}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* Manual Override */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-xl p-5"
          >
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Calculator size={14} className="text-amber-400" />
              Manual Adjustments
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5 block">Retainer (RON)</label>
                <input
                  type="number"
                  value={overrides.monthlyRetainer ?? computed.monthlyRetainer}
                  onChange={e => setOverrides(p => ({ ...p, monthlyRetainer: Number(e.target.value) || 0 }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>
              <div>
                <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5 block">Posts Delivered</label>
                <input
                  type="number"
                  value={overrides.postsDelivered ?? computed.postsDelivered}
                  onChange={e => setOverrides(p => ({ ...p, postsDelivered: Number(e.target.value) || 0 }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>
              <div>
                <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5 block">Total Engagement</label>
                <input
                  type="number"
                  value={overrides.totalEngagement ?? computed.totalEngagement}
                  onChange={e => setOverrides(p => ({ ...p, totalEngagement: Number(e.target.value) || 0 }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>
            </div>
            {Object.keys(overrides).length > 0 && (
              <button
                onClick={() => setOverrides({})}
                className="mt-3 text-xs text-white/30 hover:text-white/50 transition-colors"
              >
                Reset to original values
              </button>
            )}
          </motion.div>
        </div>
      ) : null}
    </div>
  )
}
