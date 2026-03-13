import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Building2, Users, FileText, Wallet, Heart,
  TrendingUp, PieChart,
} from 'lucide-react'
import { useApp } from '../../../core/context'
import { AnalyticsSyncStatusCard } from '../../../core/ui/AnalyticsSyncStatusCard'

interface AgencyData {
  totalClients: number
  totalPosts: number
  postsThisMonth: number
  mrr: number
  clientBreakdown: { clientId: string; displayName: string; color: string; posts: number; mrr: number }[]
  pillarBalance: { pillar: string; count: number; percentage: number; color: string }[]
  statusBreakdown: Record<string, number>
}

interface HealthEntry { clientId: string; score: number; grade: string; alerts: string[] }

const GRADE_COLORS: Record<string, string> = {
  excellent: '#10b981', good: '#3b82f6', fair: '#f59e0b', 'at-risk': '#f97316', critical: '#ef4444',
}

export function AgencyDashboard() {
  const { setSelectedClient } = useApp()
  const [data, setData] = useState<AgencyData | null>(null)
  const [healthScores, setHealthScores] = useState<HealthEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/intelligence/agency-metrics').then(r => r.json()),
      fetch('/api/intelligence/health-scores').then(r => r.json()),
    ]).then(([metrics, health]) => {
      setData(metrics)
      setHealthScores((health.scores || []).sort((a: HealthEntry, b: HealthEntry) => a.score - b.score))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="h-full flex flex-col gap-4">
        <div className="grid grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="glass rounded-xl h-24 shimmer" />)}
        </div>
        <div className="glass rounded-xl h-[200px] shimmer" />
        <div className="glass rounded-xl flex-1 shimmer" />
      </div>
    )
  }

  if (!data) return <div className="text-white/20 text-center py-20">Failed to load agency data</div>

  const avgHealth = healthScores.length > 0
    ? Math.round(healthScores.reduce((s, h) => s + h.score, 0) / healthScores.length)
    : 0
  const avgGrade = avgHealth >= 80 ? 'excellent' : avgHealth >= 65 ? 'good' : avgHealth >= 50 ? 'fair' : avgHealth >= 35 ? 'at-risk' : 'critical'

  const navigateToClient = (clientId: string) => {
    setSelectedClient(clientId)
    window.dispatchEvent(new CustomEvent('postboard:navigate', { detail: 'dashboard' }))
  }

  return (
    <div className="h-full flex flex-col">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-violet to-accent-cyan flex items-center justify-center">
            <Building2 size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Agency Dashboard</h2>
            <p className="text-xs text-white/25">Overview across all clients</p>
          </div>
        </div>
      </motion.div>

      <div className="flex-1 scroll-area pr-2 pb-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total Clients', value: data.totalClients, icon: Users, gradient: 'from-violet-500 to-indigo-500' },
            { label: 'Posts This Month', value: data.postsThisMonth, icon: FileText, gradient: 'from-cyan-500 to-blue-500' },
            { label: 'MRR', value: `${data.mrr.toLocaleString('ro-RO')} RON`, icon: Wallet, gradient: 'from-emerald-500 to-teal-500' },
            { label: 'Avg Health', value: avgHealth, icon: Heart, gradient: 'from-pink-500 to-rose-500', color: GRADE_COLORS[avgGrade] },
          ].map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass glass-hover rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${m.gradient}`}>
                  <m.icon size={16} className="text-white/90" />
                </div>
                <div>
                  <div className="text-xl font-bold text-white" style={m.color ? { color: m.color } : {}}>
                    {m.value}
                  </div>
                  <div className="text-[10px] text-white/30 uppercase tracking-wider">{m.label}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <AnalyticsSyncStatusCard compact />

        {/* Health Scores */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center gap-2 mb-3">
            <Heart size={14} className="text-accent-violet" />
            <h3 className="text-sm font-semibold text-white/60">Client Health</h3>
            <span className="text-[10px] text-white/20">sorted by risk</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {healthScores.map((h, i) => {
              const client = data.clientBreakdown.find(c => c.clientId === h.clientId)
              if (!client) return null
              const color = GRADE_COLORS[h.grade] || '#64748b'
              return (
                <motion.button
                  key={h.clientId}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25 + i * 0.03 }}
                  onClick={() => navigateToClient(h.clientId)}
                  className="glass glass-hover rounded-xl p-3 min-w-[140px] shrink-0 text-left"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ background: `${client.color}30`, border: `1px solid ${client.color}50` }}
                    >
                      {client.displayName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-white/70 font-medium truncate">{client.displayName}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div
                      className="text-lg font-bold"
                      style={{ color }}
                    >
                      {h.score}
                    </div>
                    <span className="text-[9px] capitalize font-medium px-1.5 py-0.5 rounded" style={{ background: `${color}15`, color }}>
                      {h.grade}
                    </span>
                  </div>
                  {h.alerts[0] && (
                    <p className="text-[9px] text-amber-400/60 mt-1 truncate">{h.alerts[0]}</p>
                  )}
                </motion.button>
              )
            })}
          </div>
        </motion.div>

        {/* Pillar Balance + Status */}
        <div className="grid grid-cols-2 gap-4">
          {/* Pillar */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <PieChart size={14} className="text-accent-cyan" />
              <h3 className="text-sm font-semibold text-white/60">Content Pillars</h3>
            </div>
            {/* Stacked bar */}
            <div className="h-3 rounded-full bg-white/[0.04] overflow-hidden flex mb-3">
              {data.pillarBalance.map(p => (
                <motion.div
                  key={p.pillar}
                  initial={{ width: 0 }}
                  animate={{ width: `${p.percentage}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="h-full"
                  style={{ background: p.color, opacity: 0.7 }}
                />
              ))}
            </div>
            <div className="space-y-1">
              {data.pillarBalance.slice(0, 6).map(p => (
                <div key={p.pillar} className="flex items-center gap-2 text-[11px]">
                  <span className="w-2 h-2 rounded-sm" style={{ background: p.color }} />
                  <span className="text-white/50 capitalize flex-1">{p.pillar}</span>
                  <span className="text-white/30 tabular-nums">{p.percentage}%</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Status */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-accent-orange" />
              <h3 className="text-sm font-semibold text-white/60">Post Status</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Draft', count: data.statusBreakdown.draft, color: '#f59e0b' },
                { label: 'Approved', count: data.statusBreakdown.approved, color: '#3b82f6' },
                { label: 'Scheduled', count: data.statusBreakdown.scheduled, color: '#8b5cf6' },
                { label: 'Published', count: data.statusBreakdown.published, color: '#10b981' },
              ].map(s => (
                <div key={s.label}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-white/50">{s.label}</span>
                    <span className="text-white/40 tabular-nums">{s.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: s.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${data.totalPosts > 0 ? (s.count / data.totalPosts) * 100 : 0}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Client Revenue Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h3 className="text-sm font-semibold text-white/60 mb-3">Client Overview</h3>
          <div className="glass rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] text-white/25 uppercase tracking-wider">
                  <th className="text-left p-3 pb-2">Client</th>
                  <th className="text-right p-3 pb-2">Retainer</th>
                  <th className="text-right p-3 pb-2">Posts/Mo</th>
                  <th className="text-right p-3 pb-2">Health</th>
                </tr>
              </thead>
              <tbody>
                {data.clientBreakdown
                  .sort((a, b) => b.mrr - a.mrr)
                  .map((c, i) => {
                    const h = healthScores.find(s => s.clientId === c.clientId)
                    const hColor = h ? GRADE_COLORS[h.grade] || '#64748b' : '#64748b'
                    return (
                      <tr
                        key={c.clientId}
                        onClick={() => navigateToClient(c.clientId)}
                        className="border-t border-white/[0.04] hover:bg-white/[0.03] cursor-pointer transition-colors"
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                            <span className="text-xs text-white/70 font-medium">{c.displayName}</span>
                          </div>
                        </td>
                        <td className="p-3 text-right text-xs text-white/40 tabular-nums">
                          {c.mrr > 0 ? `${c.mrr.toLocaleString('ro-RO')} RON` : '—'}
                        </td>
                        <td className="p-3 text-right text-xs text-white/40 tabular-nums">{c.posts}</td>
                        <td className="p-3 text-right">
                          {h ? (
                            <span className="text-xs font-bold tabular-nums" style={{ color: hColor }}>{h.score}</span>
                          ) : (
                            <span className="text-xs text-white/20">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
