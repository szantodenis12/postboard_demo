import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { ArrowRight, FileText, Activity, Zap, CheckCircle, FileSignature } from 'lucide-react'
import { PlatformDot } from '../../../core/ui/PlatformBadge'
import type { Client, HealthScore, Platform } from '../../../core/types'

const HEALTH_COLORS: Record<string, string> = {
  excellent: '#10b981',
  good: '#3b82f6',
  fair: '#f59e0b',
  'at-risk': '#f97316',
  critical: '#ef4444',
}

const HEALTH_LABELS: Record<string, string> = {
  excellent: 'Healthy',
  good: 'Healthy',
  fair: 'Attention',
  'at-risk': 'At Risk',
  critical: 'At Risk',
}

const FORMAT_LABELS: Record<string, string> = {
  'single-image': 'Image',
  'carousel': 'Carousel',
  'reel': 'Reel',
  'video': 'Video',
  'stories': 'Story',
  'text': 'Text',
}

interface HealthTooltipProps {
  health: HealthScore
  color: string
}

function HealthTooltip({ health, color }: HealthTooltipProps) {
  const factors = [
    { label: 'Posting', value: health.factors.postingConsistency, max: 25, icon: FileText },
    { label: 'Engagement', value: health.factors.engagementTrend, max: 25, icon: Zap },
    { label: 'Approvals', value: health.factors.approvalSpeed, max: 25, icon: CheckCircle },
    { label: 'Contract', value: health.factors.contractStatus, max: 25, icon: FileSignature },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 4, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      className="absolute bottom-full mb-2 right-0 z-50"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="rounded-xl px-3.5 py-3 shadow-2xl min-w-[180px]"
        style={{
          background: 'rgba(15, 15, 25, 0.92)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">
            Health Score
          </span>
          <span className="text-xs font-bold tabular-nums" style={{ color }}>
            {health.score}/100
          </span>
        </div>

        <div className="space-y-2">
          {factors.map(f => {
            const pct = (f.value / f.max) * 100
            return (
              <div key={f.label}>
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <f.icon size={9} className="text-white/30" />
                    <span className="text-[10px] text-white/45">{f.label}</span>
                  </div>
                  <span className="text-[10px] text-white/30 tabular-nums">{f.value}/{f.max}</span>
                </div>
                <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${pct}%`, background: color, opacity: 0.7 }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {health.alerts.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-white/[0.06]">
            {health.alerts.slice(0, 2).map((alert, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[9px] text-amber-400/60 mt-0.5">
                <Activity size={8} className="shrink-0 mt-0.5" />
                {alert}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export function ClientCard({
  client,
  index,
  onClick,
  healthScore,
}: {
  client: Client
  index: number
  onClick: () => void
  healthScore?: HealthScore | null
}) {
  const [tooltipOpen, setTooltipOpen] = useState(false)

  const activePlatforms = (Object.entries(client.stats.platforms) as [Platform, number][])
    .filter(([, count]) => count > 0)

  // Progress bar segments
  const total = client.stats.total || 1
  const segments = [
    { key: 'published', count: client.stats.published, color: '#10b981' },
    { key: 'scheduled', count: client.stats.scheduled, color: '#8b5cf6' },
    { key: 'approved', count: client.stats.approved, color: '#3b82f6' },
    { key: 'draft', count: client.stats.draft, color: '#f59e0b' },
  ]

  // Format breakdown
  const formats: Record<string, number> = {}
  for (const post of client.posts) {
    formats[post.format] = (formats[post.format] || 0) + 1
  }

  // Next upcoming post
  const now = new Date().toISOString().split('T')[0]
  const upcoming = client.posts
    .filter(p => p.date >= now)
    .sort((a, b) => a.date.localeCompare(b.date))[0]

  // Health badge color and label
  const healthColor = healthScore ? HEALTH_COLORS[healthScore.grade] || '#64748b' : null
  const healthLabel = healthScore ? HEALTH_LABELS[healthScore.grade] || healthScore.grade : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="glass glow-border rounded-2xl p-5 cursor-pointer group transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Client avatar */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white/90 shrink-0"
            style={{
              background: `linear-gradient(135deg, ${client.color}40, ${client.color}15)`,
              border: `1px solid ${client.color}40`,
            }}
          >
            {client.displayName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm group-hover:text-white transition-colors">
              {client.displayName}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              {activePlatforms.map(([platform]) => (
                <PlatformDot key={platform} platform={platform} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {healthScore && healthColor && healthLabel && (
            <div
              className="relative"
              onMouseEnter={() => setTooltipOpen(true)}
              onMouseLeave={() => setTooltipOpen(false)}
            >
              <div
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors"
                style={{
                  background: `${healthColor}15`,
                  color: healthColor,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: healthColor }}
                />
                {healthScore.score}
              </div>
              <AnimatePresence>
                {tooltipOpen && (
                  <HealthTooltip health={healthScore} color={healthColor} />
                )}
              </AnimatePresence>
            </div>
          )}
          <ArrowRight
            size={16}
            className="text-white/20 group-hover:text-white/60 transition-all group-hover:translate-x-0.5"
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <FileText size={13} className="text-white/30" />
          <span className="text-lg font-bold text-white">{client.stats.total}</span>
          <span className="text-[11px] text-white/40">posts</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-white/40">
          {Object.entries(formats).slice(0, 3).map(([format, count]) => (
            <span key={format}>
              {count} {FORMAT_LABELS[format] || format}
            </span>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden flex mb-3">
        {segments.map(seg => (
          seg.count > 0 ? (
            <motion.div
              key={seg.key}
              initial={{ width: 0 }}
              animate={{ width: `${(seg.count / total) * 100}%` }}
              transition={{ delay: index * 0.06 + 0.3, duration: 0.6, ease: 'easeOut' }}
              className="h-full"
              style={{ background: seg.color }}
            />
          ) : null
        ))}
      </div>

      {/* Status legend */}
      <div className="flex items-center gap-3 text-[10px] text-white/35">
        {segments.map(seg => (
          seg.count > 0 ? (
            <span key={seg.key} className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: seg.color }} />
              {seg.count} {seg.key}
            </span>
          ) : null
        ))}
      </div>

      {/* Upcoming post */}
      {upcoming && (
        <div className="mt-4 pt-3 border-t border-white/[0.04]">
          <div className="text-[10px] uppercase tracking-wider text-white/25 mb-1.5 font-medium">
            Next up
          </div>
          <div className="text-xs text-white/60 line-clamp-1">
            {new Date(upcoming.date).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}
            {upcoming.time ? ` ${upcoming.time}` : ''} — {upcoming.caption.slice(0, 60)}...
          </div>
        </div>
      )}
    </motion.div>
  )
}
