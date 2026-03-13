import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign, TrendingUp, Target, BarChart3, PieChart,
  Calendar, ArrowUpRight, ArrowDownRight,
} from 'lucide-react'
import { useApp } from '../../../core/context'
import { useCampaigns } from '../hooks/useCampaigns'
import type { Campaign, AdPlatform } from '../types'
import { AD_PLATFORMS, STATUS_CONFIG } from '../types'

export function SpendTracker() {
  const { data, selectedClient } = useApp()
  const { campaigns, loading, getTotalSpend } = useCampaigns()

  const [period, setPeriod] = useState<'all' | 'month' | 'week'>('all')

  // Filter campaigns by selected client
  const filtered = selectedClient
    ? campaigns.filter(c => c.clientId === selectedClient)
    : campaigns

  // Aggregate all spend entries from filtered campaigns
  const allEntries = useMemo(() => {
    const entries = filtered.flatMap(c =>
      c.spendEntries.map(e => ({ ...e, campaignId: c.id, campaignName: c.name, clientId: c.clientId }))
    )

    // Period filter
    const now = new Date()
    if (period === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      return entries.filter(e => new Date(e.date) >= monthStart)
    }
    if (period === 'week') {
      const weekStart = new Date(now.getTime() - 7 * 86400000)
      return entries.filter(e => new Date(e.date) >= weekStart)
    }
    return entries
  }, [filtered, period])

  // Totals
  const totalBudget = filtered.reduce((s, c) => s + c.budget, 0)
  const totalSpent = allEntries.reduce((s, e) => s + e.amount, 0)
  const avgDaily = allEntries.length > 0
    ? totalSpent / new Set(allEntries.map(e => e.date)).size
    : 0
  const activeCampaigns = filtered.filter(c => c.status === 'active').length

  // Spend by platform
  const byPlatform = useMemo(() => {
    const map: Record<string, number> = {}
    allEntries.forEach(e => {
      map[e.platform] = (map[e.platform] || 0) + e.amount
    })
    return AD_PLATFORMS
      .map(p => ({ ...p, total: map[p.value] || 0 }))
      .filter(p => p.total > 0)
      .sort((a, b) => b.total - a.total)
  }, [allEntries])

  // Spend by client
  const byClient = useMemo(() => {
    const map: Record<string, number> = {}
    allEntries.forEach(e => {
      map[e.clientId] = (map[e.clientId] || 0) + e.amount
    })
    return Object.entries(map)
      .map(([clientId, total]) => {
        const client = data.clients.find(c => c.id === clientId)
        return { clientId, name: client?.displayName || clientId, color: client?.color || '#7c3aed', total }
      })
      .sort((a, b) => b.total - a.total)
  }, [allEntries, data.clients])

  // Spend by day (last 14 days)
  const dailySpend = useMemo(() => {
    const days: { date: string; amount: number }[] = []
    const now = new Date()
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000)
      const dateStr = d.toISOString().slice(0, 10)
      const amount = allEntries
        .filter(e => e.date === dateStr)
        .reduce((s, e) => s + e.amount, 0)
      days.push({ date: dateStr, amount })
    }
    return days
  }, [allEntries])

  const maxDaily = Math.max(...dailySpend.map(d => d.amount), 1)

  // Campaign budget utilization ranking
  const campaignRanking = useMemo(() => {
    return filtered
      .filter(c => c.budget > 0)
      .map(c => {
        const spent = getTotalSpend(c)
        return { ...c, spent, utilization: (spent / c.budget) * 100 }
      })
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 8)
  }, [filtered, getTotalSpend])

  if (loading) {
    return (
      <div className="flex-1 p-6 pr-8 space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="glass rounded-xl h-32 shimmer" />)}
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto scroll-area p-6 pr-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
              <DollarSign size={16} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Spend Tracker</h2>
          </div>
          <p className="text-sm text-white/30 ml-11">Track ad spend across all campaigns</p>
        </div>
        <div className="flex gap-1">
          {([
            { id: 'all' as const, label: 'All Time' },
            { id: 'month' as const, label: 'This Month' },
            { id: 'week' as const, label: 'This Week' },
          ]).map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                period === p.id
                  ? 'glass-active text-white'
                  : 'text-white/35 hover:text-white/60 hover:bg-white/[0.03]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Top Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
      >
        {[
          { label: 'Total Spent', value: `${totalSpent.toLocaleString('ro-RO')} lei`, icon: DollarSign, gradient: 'from-orange-500 to-pink-500' },
          { label: 'Total Budget', value: `${totalBudget.toLocaleString('ro-RO')} lei`, icon: Target, gradient: 'from-accent-violet to-accent-indigo' },
          { label: 'Avg / Day', value: `${avgDaily.toLocaleString('ro-RO', { maximumFractionDigits: 0 })} lei`, icon: TrendingUp, gradient: 'from-cyan-500 to-blue-500' },
          { label: 'Active Campaigns', value: activeCampaigns, icon: BarChart3, gradient: 'from-emerald-500 to-emerald-600' },
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Daily Spend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 glass rounded-xl p-5"
        >
          <h3 className="text-sm font-semibold text-white/60 mb-4">Daily Spend (14 days)</h3>
          <div className="flex items-end gap-1.5 h-[140px]">
            {dailySpend.map((day, i) => {
              const height = maxDaily > 0 ? (day.amount / maxDaily) * 100 : 0
              const isToday = day.date === new Date().toISOString().slice(0, 10)
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(height, 2)}%` }}
                    transition={{ duration: 0.5, delay: i * 0.03 }}
                    className={`w-full rounded-t-sm min-h-[2px] transition-colors ${
                      isToday
                        ? 'bg-accent-violet'
                        : day.amount > 0
                          ? 'bg-white/15 group-hover:bg-white/25'
                          : 'bg-white/[0.04]'
                    }`}
                  />
                  {/* Tooltip */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                    <div className="glass rounded px-2 py-1 text-[10px] text-white/70 whitespace-nowrap shadow-lg">
                      {new Date(day.date).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}
                      : {day.amount.toLocaleString('ro-RO')} lei
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-white/20">
              {new Date(dailySpend[0]?.date).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}
            </span>
            <span className="text-[10px] text-white/20">Today</span>
          </div>
        </motion.div>

        {/* Platform Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass rounded-xl p-5"
        >
          <h3 className="text-sm font-semibold text-white/60 mb-4">By Platform</h3>
          {byPlatform.length === 0 ? (
            <div className="flex items-center justify-center h-[140px]">
              <p className="text-xs text-white/20">No spend data</p>
            </div>
          ) : (
            <div className="space-y-3">
              {byPlatform.map(p => {
                const pct = totalSpent > 0 ? (p.total / totalSpent) * 100 : 0
                return (
                  <div key={p.value}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                        <span className="text-xs text-white/60 font-medium">{p.label}</span>
                      </div>
                      <span className="text-xs text-white/50 tabular-nums font-semibold">{p.total.toLocaleString('ro-RO')} lei</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full rounded-full"
                        style={{ background: p.color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Spend Breakdown */}
        {!selectedClient && byClient.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-xl p-5"
          >
            <h3 className="text-sm font-semibold text-white/60 mb-4">By Client</h3>
            <div className="space-y-3">
              {byClient.map(c => {
                const pct = totalSpent > 0 ? (c.total / totalSpent) * 100 : 0
                return (
                  <div key={c.clientId}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                        <span className="text-xs text-white/60 font-medium">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-white/25">{pct.toFixed(1)}%</span>
                        <span className="text-xs text-white/50 tabular-nums font-semibold">{c.total.toLocaleString('ro-RO')} lei</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full rounded-full"
                        style={{ background: c.color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Campaign Budget Utilization */}
        {campaignRanking.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass rounded-xl p-5"
          >
            <h3 className="text-sm font-semibold text-white/60 mb-4">Budget Utilization</h3>
            <div className="space-y-3">
              {campaignRanking.map(c => {
                const statusCfg = STATUS_CONFIG[c.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.planning
                return (
                  <div key={c.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-white/60 font-medium truncate">{c.name}</span>
                        <span
                          className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase shrink-0"
                          style={{ color: statusCfg.color, background: `${statusCfg.color}15` }}
                        >
                          {statusCfg.label}
                        </span>
                      </div>
                      <span className="text-[11px] text-white/40 tabular-nums shrink-0 ml-2">
                        {c.utilization.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(c.utilization, 100)}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full rounded-full"
                        style={{
                          background: c.utilization > 90
                            ? 'linear-gradient(90deg, #ef4444, #f97316)'
                            : c.utilization > 70
                              ? 'linear-gradient(90deg, #f97316, #f59e0b)'
                              : 'linear-gradient(90deg, #7c3aed, #06b6d4)',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center max-w-sm">
            <DollarSign size={48} className="text-white/10 mx-auto mb-4" />
            <p className="text-white/40 text-sm mb-2">No spend data</p>
            <p className="text-white/20 text-xs">Create campaigns and log spend entries to see your dashboard</p>
          </div>
        </div>
      )}
    </div>
  )
}
