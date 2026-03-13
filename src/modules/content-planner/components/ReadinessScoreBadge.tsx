import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react'
import type { Factor, Grade } from '../hooks/useReadinessScore'
import { GRADE_COLORS } from '../hooks/useReadinessScore'

// ── Full badge with score number + tooltip ──────────────

export function ReadinessScoreBadge({
  score,
  grade,
  factors,
}: {
  score: number
  grade: Grade
  factors: Factor[]
}) {
  const [showTooltip, setShowTooltip] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const badgeRef = useRef<HTMLDivElement>(null)
  const color = GRADE_COLORS[grade]

  // Close tooltip on click outside
  useEffect(() => {
    if (!showTooltip) return
    const handler = (e: MouseEvent) => {
      if (
        tooltipRef.current && !tooltipRef.current.contains(e.target as Node) &&
        badgeRef.current && !badgeRef.current.contains(e.target as Node)
      ) {
        setShowTooltip(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showTooltip])

  return (
    <div className="relative" style={{ zIndex: showTooltip ? 60 : 'auto' }}>
      <div
        ref={badgeRef}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={(e) => { e.stopPropagation(); setShowTooltip(prev => !prev) }}
        className="flex items-center justify-center rounded-full cursor-pointer transition-all hover:scale-110 active:scale-95"
        style={{
          width: 28,
          height: 28,
          background: `${color}15`,
          border: `1.5px solid ${color}40`,
        }}
      >
        <span
          className="text-[10px] font-bold tabular-nums"
          style={{ color }}
        >
          {score}
        </span>
      </div>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.92, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 4 }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            className="absolute right-0 top-full mt-2 w-[260px] rounded-xl shadow-2xl shadow-black/60 overflow-hidden"
            style={{
              background: 'rgba(15, 15, 20, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="px-3.5 py-2.5 flex items-center gap-2.5"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div
                className="flex items-center justify-center rounded-lg"
                style={{
                  width: 32,
                  height: 32,
                  background: `${color}18`,
                }}
              >
                <span className="text-sm font-bold" style={{ color }}>
                  {grade}
                </span>
              </div>
              <div>
                <div className="text-xs font-semibold text-white/80">
                  Readiness Score
                </div>
                <div className="text-[10px] text-white/35">
                  {score}/100 — {gradeLabel(grade)}
                </div>
              </div>
              <div className="ml-auto">
                <TrendingUp size={13} style={{ color }} />
              </div>
            </div>

            {/* Factors */}
            <div className="px-3.5 py-2.5 space-y-2">
              {factors.map((factor) => {
                const pct = factor.maxScore > 0 ? (factor.score / factor.maxScore) * 100 : 0
                const factorColor = pct >= 80 ? '#10b981' : pct >= 50 ? '#eab308' : '#ef4444'

                return (
                  <div key={factor.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-white/50">{factor.name}</span>
                      <span className="text-[10px] font-mono tabular-nums" style={{ color: factorColor }}>
                        {factor.score}/{factor.maxScore}
                      </span>
                    </div>
                    <div
                      className="h-1 rounded-full overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1], delay: 0.05 }}
                        className="h-full rounded-full"
                        style={{ background: factorColor }}
                      />
                    </div>
                    {factor.tip && (
                      <div className="flex items-start gap-1.5 mt-1">
                        <Lightbulb size={9} className="text-white/20 shrink-0 mt-0.5" />
                        <span className="text-[9px] text-white/30 leading-relaxed">
                          {factor.tip}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Footer tip */}
            {score < 65 && (
              <div
                className="px-3.5 py-2 flex items-center gap-2"
                style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.015)' }}
              >
                <AlertTriangle size={10} className="text-white/25 shrink-0" />
                <span className="text-[9px] text-white/30">
                  Improve the highlighted areas to boost engagement.
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Compact dot indicator (for kanban cards) ────────────

export function ReadinessScoreDot({
  score,
  grade,
}: {
  score: number
  grade: Grade
}) {
  const color = GRADE_COLORS[grade]

  return (
    <div
      className="flex items-center gap-1.5"
      title={`Readiness: ${score}/100 (${grade})`}
    >
      <div
        className="rounded-full"
        style={{
          width: 6,
          height: 6,
          background: color,
          boxShadow: `0 0 4px ${color}50`,
        }}
      />
    </div>
  )
}

// ── Thin bar indicator (alternative for kanban) ─────────

export function ReadinessScoreBar({
  score,
  grade,
}: {
  score: number
  grade: Grade
}) {
  const color = GRADE_COLORS[grade]

  return (
    <div
      className="w-full h-[2px] rounded-full mt-auto"
      style={{ background: 'rgba(255,255,255,0.04)' }}
      title={`Readiness: ${score}/100 (${grade})`}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${score}%`,
          background: color,
        }}
      />
    </div>
  )
}

// ── Helpers ─────────────────────────────────────────────

function gradeLabel(grade: Grade): string {
  switch (grade) {
    case 'A': return 'Excellent'
    case 'B': return 'Good'
    case 'C': return 'Fair'
    case 'D': return 'Needs work'
    case 'F': return 'Incomplete'
  }
}
