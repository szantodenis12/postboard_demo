import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { PieChart, AlertTriangle } from 'lucide-react'

interface PillarData {
  pillar: string
  count: number
  percentage: number
  color: string
}

interface BalanceData {
  clientId: string
  total: number
  pillars: PillarData[]
  untagged: number
}

export function PillarBalance({ clientId }: { clientId?: string } = {}) {
  const [balances, setBalances] = useState<BalanceData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const url = clientId
      ? `/api/intelligence/pillar-balance?clientId=${encodeURIComponent(clientId)}`
      : '/api/intelligence/pillar-balance'
    fetch(url)
      .then(r => r.json())
      .then(data => setBalances(data.balances || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [clientId])

  // Aggregate all clients
  const aggregated = useMemo(() => {
    if (balances.length === 0) return null
    const pillarMap = new Map<string, { count: number; color: string }>()
    let total = 0
    let untagged = 0
    for (const b of balances) {
      total += b.total
      untagged += b.untagged
      for (const p of b.pillars) {
        const existing = pillarMap.get(p.pillar) || { count: 0, color: p.color }
        existing.count += p.count
        pillarMap.set(p.pillar, existing)
      }
    }
    const pillars = Array.from(pillarMap.entries())
      .map(([pillar, { count, color }]) => ({
        pillar,
        count,
        percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
        color,
      }))
      .sort((a, b) => b.count - a.count)
    return { total, pillars, untagged }
  }, [balances])

  // Warnings
  const warnings = useMemo(() => {
    if (!aggregated) return []
    const w: string[] = []
    for (const p of aggregated.pillars) {
      if (p.percentage > 50) w.push(`Heavy on ${p.pillar} (${p.percentage}%) — consider diversifying`)
    }
    const hasEdu = aggregated.pillars.some(p =>
      p.pillar.toLowerCase().includes('educ') || p.pillar.toLowerCase().includes('informativ')
    )
    if (!hasEdu && aggregated.total > 5) {
      w.push('No educational content — add authority-building posts')
    }
    if (aggregated.untagged > aggregated.total * 0.3) {
      w.push(`${aggregated.untagged} posts have no pillar tag`)
    }
    return w
  }, [aggregated])

  if (loading) {
    return <div className="glass rounded-xl p-6 h-[200px] shimmer" />
  }

  if (!aggregated || aggregated.total === 0) {
    return (
      <div className="glass rounded-xl p-6 text-center">
        <PieChart size={24} className="text-white/10 mx-auto mb-2" />
        <p className="text-xs text-white/20">No pillar data available</p>
      </div>
    )
  }

  // SVG donut chart
  const size = 140
  const strokeWidth = 24
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <PieChart size={14} className="text-accent-violet" />
        <h3 className="text-sm font-semibold text-white/70">Content Pillar Balance</h3>
        <span className="text-[10px] text-white/20 ml-auto">{aggregated.total} posts</span>
      </div>

      <div className="flex items-start gap-6">
        {/* Donut Chart */}
        <div className="relative shrink-0">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth={strokeWidth}
            />
            {aggregated.pillars.map((p, i) => {
              const segmentLength = (p.count / aggregated.total) * circumference
              const currentOffset = offset
              offset += segmentLength
              return (
                <motion.circle
                  key={p.pillar}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={p.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                  strokeDashoffset={-currentOffset}
                  strokeLinecap="butt"
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.8 }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                />
              )
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-white">{aggregated.pillars.length}</span>
            <span className="text-[9px] text-white/30">pillars</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-1.5 min-w-0">
          {aggregated.pillars.map((p, i) => (
            <motion.div
              key={p.pillar}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-2"
            >
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: p.color }} />
              <span className="text-[11px] text-white/60 capitalize truncate flex-1">{p.pillar}</span>
              <span className="text-[11px] text-white/40 tabular-nums shrink-0">{p.count}</span>
              <span className="text-[10px] text-white/20 tabular-nums shrink-0 w-10 text-right">
                {p.percentage}%
              </span>
            </motion.div>
          ))}
          {aggregated.untagged > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm shrink-0 bg-white/10" />
              <span className="text-[11px] text-white/30 italic flex-1">untagged</span>
              <span className="text-[11px] text-white/20 tabular-nums shrink-0">{aggregated.untagged}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stacked bar */}
      <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden flex mt-4">
        {aggregated.pillars.map((p, i) => (
          <motion.div
            key={p.pillar}
            initial={{ width: 0 }}
            animate={{ width: `${p.percentage}%` }}
            transition={{ delay: 0.3 + i * 0.05, duration: 0.5, ease: 'easeOut' }}
            className="h-full"
            style={{ background: p.color, opacity: 0.7 }}
          />
        ))}
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="mt-3 space-y-1">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-1.5 text-[10px] text-amber-400/70">
              <AlertTriangle size={10} className="shrink-0 mt-0.5" />
              {w}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
