import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Palette, Save, Loader2, Check, AlertCircle, Eye } from 'lucide-react'

interface WhiteLabelData {
  agencyName: string
  agencyLogo: string
  primaryColor: string
  secondaryColor: string
  footerText: string
}

const DEFAULTS: WhiteLabelData = {
  agencyName: 'Epic Digital Hub',
  agencyLogo: '',
  primaryColor: '#8b5cf6',
  secondaryColor: '#06b6d4',
  footerText: 'Powered by Epic Digital Hub',
}

export function WhiteLabelConfig() {
  const [config, setConfig] = useState<WhiteLabelData>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/intelligence/white-label')
      .then(r => r.json())
      .then(d => setConfig({ ...DEFAULTS, ...d }))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const r = await fetch('/api/intelligence/white-label', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (!r.ok) throw new Error('Failed to save')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const update = (key: keyof WhiteLabelData, val: string) => {
    setConfig(prev => ({ ...prev, [key]: val }))
    setSaved(false)
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-white/20" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">White-Label Branding</h2>
        <p className="text-sm text-white/30">Customize report branding for your agency</p>
      </motion.div>

      <div className="flex-1 overflow-y-auto scroll-area">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Config Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass rounded-xl p-5"
          >
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Palette size={14} className="text-violet-400" />
              Configuration
            </h3>

            <div className="flex flex-col gap-4">
              {/* Agency Name */}
              <div>
                <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2 block">Agency Name</label>
                <input
                  value={config.agencyName}
                  onChange={e => update('agencyName', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50"
                />
              </div>

              {/* Logo URL */}
              <div>
                <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2 block">Logo URL</label>
                <input
                  value={config.agencyLogo}
                  onChange={e => update('agencyLogo', e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50"
                />
              </div>

              {/* Colors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2 block">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.primaryColor}
                      onChange={e => update('primaryColor', e.target.value)}
                      className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent"
                    />
                    <input
                      value={config.primaryColor}
                      onChange={e => update('primaryColor', e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-violet-500/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2 block">Secondary Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.secondaryColor}
                      onChange={e => update('secondaryColor', e.target.value)}
                      className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent"
                    />
                    <input
                      value={config.secondaryColor}
                      onChange={e => update('secondaryColor', e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-violet-500/50"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Text */}
              <div>
                <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2 block">Footer Text</label>
                <input
                  value={config.footerText}
                  onChange={e => update('footerText', e.target.value)}
                  placeholder="Powered by Your Agency"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50"
                />
              </div>

              {/* Save Button */}
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-xs">
                  <AlertCircle size={12} />
                  {error}
                </div>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-2.5 rounded-lg bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Configuration'}
              </button>
            </div>
          </motion.div>

          {/* Live Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-xl p-5"
          >
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Eye size={14} className="text-cyan-400" />
              Live Preview
            </h3>

            {/* Report Preview Card */}
            <div className="rounded-xl overflow-hidden border border-white/10">
              {/* Header */}
              <div
                className="p-4 flex items-center gap-3"
                style={{ background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})` }}
              >
                {config.agencyLogo ? (
                  <img src={config.agencyLogo} alt="Logo" className="w-10 h-10 rounded-lg object-contain bg-white/20" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center text-white text-sm font-bold">
                    {config.agencyName.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="text-sm font-bold text-white">{config.agencyName || 'Agency Name'}</div>
                  <div className="text-xs text-white/70">Monthly Performance Report</div>
                </div>
              </div>

              {/* Body */}
              <div className="bg-white/[0.03] p-4">
                <div className="flex gap-3 mb-3">
                  {['Posts', 'Engagement', 'Reach'].map((label, i) => (
                    <div key={label} className="flex-1 rounded-lg p-3" style={{ backgroundColor: `${config.primaryColor}15` }}>
                      <div className="text-[10px] uppercase tracking-wider" style={{ color: `${config.primaryColor}99` }}>{label}</div>
                      <div className="text-lg font-bold text-white/70">{[24, '1.2K', '8.5K'][i]}</div>
                    </div>
                  ))}
                </div>
                <div className="h-16 rounded-lg mb-3" style={{ background: `linear-gradient(90deg, ${config.primaryColor}30, ${config.secondaryColor}30)` }} />
                <div className="space-y-1.5">
                  <div className="h-2 rounded bg-white/5 w-full" />
                  <div className="h-2 rounded bg-white/5 w-3/4" />
                  <div className="h-2 rounded bg-white/5 w-5/6" />
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-white/5 flex items-center justify-between" style={{ backgroundColor: `${config.primaryColor}10` }}>
                <span className="text-[10px]" style={{ color: `${config.primaryColor}80` }}>
                  {config.footerText || 'Footer text'}
                </span>
                <span className="text-[10px] text-white/20">March 2026</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
