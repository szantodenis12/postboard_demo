import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, Loader2, AlertCircle, Lightbulb, Zap } from 'lucide-react'
import { useApp } from '../../../core/context'

interface TimeSlot {
  day: string
  hour: number
  avgEngagement: number
  postCount: number
  score: number
}

interface BestTimesData {
  slots: TimeSlot[]
  recommendation: string
}

const DAYS = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică']
const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

function scoreColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 60) return 'bg-emerald-500/70'
  if (score >= 40) return 'bg-amber-500/60'
  if (score >= 20) return 'bg-orange-500/40'
  if (score > 0) return 'bg-white/10'
  return 'bg-white/[0.03]'
}

function scoreOpacity(score: number): string {
  if (score >= 80) return 'opacity-100'
  if (score >= 60) return 'opacity-80'
  if (score >= 40) return 'opacity-60'
  if (score >= 20) return 'opacity-40'
  return 'opacity-20'
}

export function SmartScheduling() {
  const { selectedClient, data } = useApp()
  const [bestTimes, setBestTimes] = useState<BestTimesData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedClient) {
      setBestTimes(null)
      return
    }
    setLoading(true)
    setError(null)
    fetch(`/api/intelligence/best-times?clientId=${selectedClient}`)
      .then(r => { if (!r.ok) throw new Error('Failed to load'); return r.json() })
      .then(d => setBestTimes(d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [selectedClient])

  // Build heatmap grid from slots
  const grid: Record<string, Record<number, TimeSlot>> = {}
  if (bestTimes) {
    for (const slot of bestTimes.slots) {
      if (!grid[slot.day]) grid[slot.day] = {}
      grid[slot.day][slot.hour] = slot
    }
  }

  // Top 5 slots
  const topSlots = bestTimes
    ? [...bestTimes.slots].sort((a, b) => b.score - a.score).slice(0, 5)
    : []

  const clientName = selectedClient
    ? data.clients.find(c => c.id === selectedClient)?.displayName || selectedClient
    : null

  return (
    <div className="h-full flex flex-col">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">Best Times to Post</h2>
        <p className="text-sm text-white/30">
          {clientName ? `Smart scheduling for ${clientName}` : 'Select a client to see recommendations'}
        </p>
      </motion.div>

      {!selectedClient ? (
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-12 text-center max-w-sm"
          >
            <Clock size={48} className="text-white/10 mx-auto mb-4" />
            <h3 className="text-sm font-semibold text-white/40 mb-2">No client selected</h3>
            <p className="text-xs text-white/20 leading-relaxed">
              Select a client from the sidebar to see optimal posting times.
            </p>
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
      ) : bestTimes ? (
        <div className="flex-1 overflow-y-auto scroll-area flex flex-col gap-4">
          {/* Recommendation */}
          {bestTimes.recommendation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-4 flex items-start gap-3"
            >
              <Lightbulb size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-white/60 leading-relaxed">{bestTimes.recommendation}</p>
            </motion.div>
          )}

          {/* Heatmap */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-xl p-5"
          >
            <h3 className="text-sm font-semibold text-white mb-4">Engagement Heatmap</h3>
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                {/* Hour labels */}
                <div className="flex gap-[2px] mb-1 ml-[80px]">
                  {HOURS.map(h => (
                    <div key={h} className="flex-1 text-center text-[9px] text-white/20">
                      {h % 3 === 0 ? `${h}:00` : ''}
                    </div>
                  ))}
                </div>
                {/* Grid rows */}
                {DAY_KEYS.map((dayKey, di) => (
                  <div key={dayKey} className="flex gap-[2px] items-center mb-[2px]">
                    <span className="w-[80px] text-xs text-white/40 shrink-0 pr-2 text-right">{DAYS[di]}</span>
                    {HOURS.map(h => {
                      const slot = grid[dayKey]?.[h]
                      const score = slot?.score || 0
                      return (
                        <div
                          key={h}
                          className={`flex-1 aspect-square rounded-sm ${scoreColor(score)} transition-all hover:ring-1 hover:ring-white/30 cursor-default`}
                          title={`${DAYS[di]} ${h}:00 — Score: ${score}${slot ? `, Avg: ${slot.avgEngagement.toFixed(0)}, Posts: ${slot.postCount}` : ''}`}
                        />
                      )
                    })}
                  </div>
                ))}
                {/* Legend */}
                <div className="flex items-center gap-3 mt-3 ml-[80px]">
                  <span className="text-[10px] text-white/20">Low</span>
                  <div className="flex gap-[2px]">
                    {[5, 20, 40, 60, 80].map(s => (
                      <div key={s} className={`w-4 h-3 rounded-sm ${scoreColor(s)}`} />
                    ))}
                  </div>
                  <span className="text-[10px] text-white/20">High</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Top Slots */}
          {topSlots.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-xl p-5"
            >
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Zap size={14} className="text-amber-400" />
                Top Posting Slots
              </h3>
              <div className="flex flex-col gap-2">
                {topSlots.map((slot, i) => {
                  const dayIdx = DAY_KEYS.indexOf(slot.day)
                  const dayLabel = dayIdx >= 0 ? DAYS[dayIdx] : slot.day
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + i * 0.05 }}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.03]"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        i === 0 ? 'bg-emerald-500/20 text-emerald-400' :
                        i === 1 ? 'bg-emerald-500/15 text-emerald-400/70' :
                        'bg-white/5 text-white/30'
                      }`}>
                        #{i + 1}
                      </div>
                      <div className="flex-1">
                        <span className="text-sm text-white/70 font-medium">{dayLabel}</span>
                        <span className="text-white/30 mx-1.5">at</span>
                        <span className="text-sm text-white/70 font-medium">{slot.hour}:00</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-white/40">Score: <span className="text-white/60 font-medium">{slot.score}</span></div>
                        <div className="text-[10px] text-white/20">{slot.postCount} posts, avg {slot.avgEngagement.toFixed(0)} eng.</div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </div>
      ) : null}
    </div>
  )
}
