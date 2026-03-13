import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'

interface HealthData {
  score: number
  grade: string
  factors: {
    postingConsistency: number
    engagementTrend: number
    approvalSpeed: number
    contractStatus: number
  }
  alerts: string[]
}

const GRADE_COLORS: Record<string, string> = {
  excellent: '#10b981',
  good: '#3b82f6',
  fair: '#f59e0b',
  'at-risk': '#f97316',
  critical: '#ef4444',
}

// Cache to avoid refetching the same client's score
const scoreCache = new Map<string, HealthData>()

export function HealthScoreBadge({
  clientId,
  size = 'sm',
}: {
  clientId: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const [data, setData] = useState<HealthData | null>(scoreCache.get(clientId) || null)
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    if (scoreCache.has(clientId)) {
      setData(scoreCache.get(clientId)!)
      return
    }
    fetch(`/api/intelligence/health-scores?clientId=${encodeURIComponent(clientId)}`)
      .then(r => r.json())
      .then(res => {
        if (res.scores?.[0]) {
          scoreCache.set(clientId, res.scores[0])
          setData(res.scores[0])
        }
      })
      .catch(() => {})
  }, [clientId])

  if (!data) return null

  const color = GRADE_COLORS[data.grade] || '#64748b'

  if (size === 'sm') {
    return (
      <div
        className="relative"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold"
          style={{ background: `${color}20`, color, border: `1.5px solid ${color}40` }}
        >
          {data.score}
        </div>
        {hovering && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap">
            <div className="glass rounded-lg px-3 py-2 text-[10px] shadow-xl">
              <div className="font-semibold text-white mb-1" style={{ color }}>
                {data.grade.charAt(0).toUpperCase() + data.grade.slice(1)} ({data.score}/100)
              </div>
              {data.alerts.length > 0 && (
                <div className="text-amber-400/70">{data.alerts[0]}</div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (size === 'md') {
    return (
      <div className="flex items-center gap-2">
        <div
          className="w-12 h-12 rounded-full flex flex-col items-center justify-center"
          style={{ background: `${color}15`, border: `2px solid ${color}40` }}
        >
          <span className="text-sm font-bold" style={{ color }}>{data.score}</span>
        </div>
        <span className="text-[10px] font-medium capitalize" style={{ color }}>{data.grade}</span>
      </div>
    )
  }

  // Large variant with progress ring and factor breakdown
  const ringSize = 80
  const ringStroke = 6
  const ringRadius = (ringSize - ringStroke) / 2
  const ringCircumference = 2 * Math.PI * ringRadius
  const ringProgress = (data.score / 100) * ringCircumference

  const factors = [
    { label: 'Posting', value: data.factors.postingConsistency, max: 25 },
    { label: 'Engagement', value: data.factors.engagementTrend, max: 25 },
    { label: 'Approvals', value: data.factors.approvalSpeed, max: 25 },
    { label: 'Contract', value: data.factors.contractStatus, max: 25 },
  ]

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center gap-4">
        {/* Ring */}
        <div className="relative shrink-0">
          <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`}>
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={ringRadius}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={ringStroke}
            />
            <motion.circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={ringRadius}
              fill="none"
              stroke={color}
              strokeWidth={ringStroke}
              strokeLinecap="round"
              strokeDasharray={`${ringProgress} ${ringCircumference - ringProgress}`}
              transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
              initial={{ strokeDasharray: `0 ${ringCircumference}` }}
              animate={{ strokeDasharray: `${ringProgress} ${ringCircumference - ringProgress}` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              opacity={0.8}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold" style={{ color }}>{data.score}</span>
            <span className="text-[8px] text-white/30 capitalize">{data.grade}</span>
          </div>
        </div>

        {/* Factors */}
        <div className="flex-1 space-y-2">
          {factors.map(f => (
            <div key={f.label} className="flex items-center gap-2">
              <span className="text-[10px] text-white/40 w-16 shrink-0">{f.label}</span>
              <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(f.value / f.max) * 100}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              <span className="text-[10px] text-white/30 tabular-nums w-8 text-right">{f.value}/{f.max}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-1">
          {data.alerts.map((alert, i) => (
            <div key={i} className="flex items-start gap-1.5 text-[10px] text-amber-400/60">
              <Heart size={9} className="shrink-0 mt-0.5" />
              {alert}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
