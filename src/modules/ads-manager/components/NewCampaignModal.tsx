import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Megaphone } from 'lucide-react'
import { useApp } from '../../../core/context'
import type { Campaign, CampaignObjective, AdPlatform } from '../types'
import { OBJECTIVES, AD_PLATFORMS } from '../types'

type NewCampaignData = Omit<Campaign, 'id' | 'createdAt' | 'updatedAt' | 'variants' | 'spendEntries'>

interface Props {
  onClose: () => void
  onCreate: (data: NewCampaignData) => Promise<void>
}

export function NewCampaignModal({ onClose, onCreate }: Props) {
  const { data, selectedClient } = useApp()

  const [name, setName] = useState('')
  const [clientId, setClientId] = useState(selectedClient || data.clients[0]?.id || '')
  const [objective, setObjective] = useState<CampaignObjective>('traffic')
  const [platforms, setPlatforms] = useState<AdPlatform[]>(['facebook'])
  const [budget, setBudget] = useState('')
  const [dailyBudget, setDailyBudget] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const togglePlatform = (p: AdPlatform) => {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  const handleSubmit = async () => {
    if (!name.trim() || !clientId) return
    setSaving(true)
    try {
      await onCreate({
        clientId,
        name: name.trim(),
        objective,
        platforms,
        budget: Number(budget) || 0,
        dailyBudget: Number(dailyBudget) || undefined,
        startDate,
        endDate,
        status: 'planning',
        notes: notes.trim() || undefined,
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
        className="glass rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-white/[0.08]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
              <Megaphone size={16} className="text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">New Campaign</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Campaign Name */}
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider font-medium mb-1.5 block">Campaign Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Spring Promo - Facebook Ads"
              className="w-full glass rounded-lg px-3 py-2.5 text-sm text-white/80 bg-transparent border border-white/[0.08] outline-none focus:border-accent-violet/40 transition-colors placeholder:text-white/20"
              autoFocus
            />
          </div>

          {/* Client */}
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider font-medium mb-1.5 block">Client</label>
            <select
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              className="w-full glass rounded-lg px-3 py-2.5 text-sm text-white/80 bg-transparent border border-white/[0.08] outline-none focus:border-accent-violet/40 transition-colors"
            >
              {data.clients.map(c => (
                <option key={c.id} value={c.id} className="bg-surface-200 text-white">{c.displayName}</option>
              ))}
            </select>
          </div>

          {/* Objective */}
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider font-medium mb-1.5 block">Objective</label>
            <div className="grid grid-cols-3 gap-2">
              {OBJECTIVES.map(obj => (
                <button
                  key={obj.value}
                  onClick={() => setObjective(obj.value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg text-xs font-medium transition-all ${
                    objective === obj.value
                      ? 'glass-active text-white border border-accent-violet/30'
                      : 'glass text-white/40 hover:text-white/60'
                  }`}
                >
                  {obj.label}
                </button>
              ))}
            </div>
          </div>

          {/* Platforms */}
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider font-medium mb-1.5 block">Platforms</label>
            <div className="flex gap-2">
              {AD_PLATFORMS.map(p => (
                <button
                  key={p.value}
                  onClick={() => togglePlatform(p.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    platforms.includes(p.value)
                      ? 'glass-active text-white'
                      : 'glass text-white/30 hover:text-white/50'
                  }`}
                  style={platforms.includes(p.value) ? { borderColor: `${p.color}40`, borderWidth: 1 } : {}}
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Budget Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider font-medium mb-1.5 block">Total Budget (RON)</label>
              <input
                type="number"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                placeholder="5000"
                className="w-full glass rounded-lg px-3 py-2.5 text-sm text-white/80 bg-transparent border border-white/[0.08] outline-none focus:border-accent-violet/40 transition-colors placeholder:text-white/20"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider font-medium mb-1.5 block">Daily Budget (RON)</label>
              <input
                type="number"
                value={dailyBudget}
                onChange={e => setDailyBudget(e.target.value)}
                placeholder="150"
                className="w-full glass rounded-lg px-3 py-2.5 text-sm text-white/80 bg-transparent border border-white/[0.08] outline-none focus:border-accent-violet/40 transition-colors placeholder:text-white/20"
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider font-medium mb-1.5 block">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full glass rounded-lg px-3 py-2.5 text-sm text-white/80 bg-transparent border border-white/[0.08] outline-none focus:border-accent-violet/40 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider font-medium mb-1.5 block">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full glass rounded-lg px-3 py-2.5 text-sm text-white/80 bg-transparent border border-white/[0.08] outline-none focus:border-accent-violet/40 transition-colors"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider font-medium mb-1.5 block">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Campaign goals, target audience, key messages..."
              rows={3}
              className="w-full glass rounded-lg px-3 py-2.5 text-sm text-white/80 bg-transparent border border-white/[0.08] outline-none focus:border-accent-violet/40 transition-colors placeholder:text-white/20 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-white/[0.06]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-white/40 hover:text-white/60 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || !clientId || saving}
            className="px-5 py-2 rounded-lg bg-gradient-to-r from-accent-violet to-accent-indigo text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {saving ? 'Creating...' : 'Create Campaign'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
