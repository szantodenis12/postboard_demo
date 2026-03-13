import { useState, useRef, useEffect, useSyncExternalStore } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye, Loader2, RotateCcw, Copy, Check, Trash2,
  Target, Clock, BarChart3, TrendingUp, Lightbulb, Search,
  History, ChevronRight, Globe, FileText, CalendarDays,
  Plus, X, Megaphone, Users, Palette, MessageCircle, Play,
  Save, ChevronDown
} from 'lucide-react'

// ── Background stream manager (persists across navigations) ──
interface BGTask {
  name: string
  text: string
  streaming: boolean
  done: boolean
}

const bgTasks: Record<string, BGTask> = {}
const listeners = new Set<() => void>()
function notify() { listeners.forEach(l => l()) }

function startBGStream(key: string, name: string, url: string, body: any, onDone?: (text: string) => void) {
  if (bgTasks[key]?.streaming) return
  bgTasks[key] = { name, text: '', streaming: true, done: false }
  notify()

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(async (res) => {
    if (!res.ok) {
      bgTasks[key] = { name, text: 'Error: request failed', streaming: false, done: true }
      notify()
      return
    }
    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      for (const line of chunk.split('\n')) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            bgTasks[key] = { ...bgTasks[key]!, streaming: false, done: true }
            onDone?.(bgTasks[key]!.text)
            notify()
            return
          }
          try {
            const parsed = JSON.parse(data)
            if (parsed.text) {
              bgTasks[key]!.text += parsed.text
              notify()
            }
          } catch {}
        }
      }
    }
    bgTasks[key] = { ...bgTasks[key]!, streaming: false, done: true }
    onDone?.(bgTasks[key]!.text)
    notify()
  }).catch(() => {
    bgTasks[key] = { name, text: 'Error: connection failed', streaming: false, done: true }
    notify()
  })
}

function clearBGTask(key: string) {
  delete bgTasks[key]
  notify()
}

function useBGTask(key: string) {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb) },
    () => bgTasks[key] || null,
  )
}

// ── Focus areas config ──
const FOCUS_AREAS = [
  { id: 'content-strategy', label: 'Content Strategy', desc: 'Posting frequency, types, themes', icon: Target, color: '#3b82f6' },
  { id: 'engagement', label: 'Engagement Patterns', desc: 'What gets most interaction', icon: MessageCircle, color: '#10b981' },
  { id: 'visual', label: 'Visual Style', desc: 'Branding, colors, imagery', icon: Palette, color: '#f59e0b' },
  { id: 'audience', label: 'Audience Targeting', desc: 'Who they reach', icon: Users, color: '#8b5cf6' },
  { id: 'ads', label: 'Ad Activity', desc: 'Sponsored content & offers', icon: Megaphone, color: '#ef4444' },
] as const

type FocusId = typeof FOCUS_AREAS[number]['id']

// ── Saved analyses (localStorage) ──
interface SavedAnalysis {
  id: string
  competitors: string[]
  focus: FocusId[]
  result: string
  date: string
}

const ANALYSES_KEY = (id: string) => `postboard-competitor-analyses-${id}`

function loadAnalyses(clientId: string): SavedAnalysis[] {
  try { return JSON.parse(localStorage.getItem(ANALYSES_KEY(clientId)) || '[]') }
  catch { return [] }
}
function saveAnalysesLS(clientId: string, list: SavedAnalysis[]) {
  localStorage.setItem(ANALYSES_KEY(clientId), JSON.stringify(list))
}

// ── Section icons for result formatting ──
const SECTION_ICONS: Record<string, typeof Target> = {
  'overview': Globe, 'compet': Eye, 'strateg': Target, 'frecven': Clock, 'posting': Clock,
  'tip': BarChart3, 'content': BarChart3, 'engage': TrendingUp,
  'recom': Lightbulb, 'platform': Globe, 'gap': Search, 'opportunit': Search,
  'compar': BarChart3, 'differ': ChevronRight, 'strength': TrendingUp,
  'weakness': Target, 'action': Play, 'punct': BarChart3,
}

function getSectionIcon(heading: string) {
  const lower = heading.toLowerCase()
  for (const [key, Icon] of Object.entries(SECTION_ICONS)) {
    if (lower.includes(key)) return Icon
  }
  return Target
}

function formatResult(text: string) {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    const h1 = line.match(/^#\s+(.+)/)
    if (h1) {
      return (
        <div key={i} className="flex items-center gap-2.5 mt-6 mb-3 first:mt-0 pb-2 border-b border-white/[0.06]">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/15 flex items-center justify-center shrink-0">
            {(() => { const Icon = getSectionIcon(h1[1]); return <Icon size={14} className="text-cyan-400" /> })()}
          </div>
          <span className="text-base font-bold text-white">{h1[1]}</span>
        </div>
      )
    }
    const h2 = line.match(/^#{2,3}\s+(.+)/)
    if (h2) {
      const Icon = getSectionIcon(h2[1])
      return (
        <div key={i} className="flex items-center gap-2 mt-4 mb-2">
          <Icon size={13} className="text-cyan-400/70 shrink-0" />
          <span className="text-sm font-semibold text-white/90">{h2[1]}</span>
        </div>
      )
    }
    if (line.match(/^\*\*(.+?)\*\*/)) {
      const cleaned = line.replace(/\*\*(.+?)\*\*/g, '$1')
      return <p key={i} className="text-sm text-white/70 font-medium leading-relaxed">{cleaned}</p>
    }
    if (line.match(/^[-*]\s/)) {
      return (
        <div key={i} className="flex gap-2.5 ml-4 mb-1.5">
          <span className="shrink-0 mt-2 w-1.5 h-1.5 rounded-full bg-cyan-500/40" />
          <span className="text-sm text-white/55 leading-relaxed">{line.replace(/^[-*]\s/, '')}</span>
        </div>
      )
    }
    if (line.match(/^\d+\.\s/)) {
      const num = line.match(/^(\d+)\.\s(.+)/)
      if (num) {
        return (
          <div key={i} className="flex gap-2.5 ml-3 mb-1.5">
            <span className="shrink-0 w-5 h-5 rounded-md bg-cyan-500/10 flex items-center justify-center text-[10px] font-bold text-cyan-400/70">{num[1]}</span>
            <span className="text-sm text-white/55 leading-relaxed">{num[2]}</span>
          </div>
        )
      }
    }
    // Table rows
    if (line.includes('|') && line.trim().startsWith('|')) {
      const cells = line.split('|').filter(c => c.trim()).map(c => c.trim())
      if (cells.every(c => c.match(/^[-:]+$/))) return null // separator row
      const isHeader = i > 0 && lines[i + 1]?.includes('---')
      return (
        <div key={i} className={`grid gap-2 py-1.5 px-2 rounded-md text-xs ${isHeader ? 'bg-white/[0.04] font-semibold text-white/60' : 'text-white/45'}`}
          style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}>
          {cells.map((cell, ci) => <span key={ci}>{cell}</span>)}
        </div>
      )
    }
    if (line.trim() === '') return <div key={i} className="h-2" />
    return <p key={i} className="text-sm text-white/45 leading-relaxed">{line}</p>
  })
}

// ── Component ──
export function CompetitorMonitor({ clientId }: { clientId: string }) {
  const [competitorInputs, setCompetitorInputs] = useState<string[]>([''])
  const [selectedFocus, setSelectedFocus] = useState<FocusId[]>(['content-strategy', 'engagement'])
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>(() => loadAnalyses(clientId))
  const [viewingAnalysis, setViewingAnalysis] = useState<SavedAnalysis | null>(null)
  const [copied, setCopied] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [saved, setSaved] = useState(false)
  const resultEndRef = useRef<HTMLDivElement>(null)

  const taskKey = `competitor-${clientId}`
  const task = useBGTask(taskKey)
  const streaming = task?.streaming || false
  const result = task?.text || ''
  const analyzingName = task?.name || ''

  // Track the competitors and focus from the current/last analysis for saving
  const lastAnalysisRef = useRef<{ competitors: string[], focus: FocusId[] }>({ competitors: [], focus: [] })

  useEffect(() => {
    setAnalyses(loadAnalyses(clientId))
    setViewingAnalysis(null)
  }, [clientId])

  useEffect(() => {
    if (streaming) resultEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [result, streaming])

  // ── Competitor inputs management ──
  const addCompetitorSlot = () => {
    if (competitorInputs.length >= 5) return
    setCompetitorInputs([...competitorInputs, ''])
  }

  const removeCompetitorSlot = (idx: number) => {
    if (competitorInputs.length <= 1) return
    setCompetitorInputs(competitorInputs.filter((_, i) => i !== idx))
  }

  const updateCompetitorInput = (idx: number, value: string) => {
    const updated = [...competitorInputs]
    updated[idx] = value
    setCompetitorInputs(updated)
  }

  // ── Focus toggle ──
  const toggleFocus = (id: FocusId) => {
    setSelectedFocus(prev =>
      prev.includes(id)
        ? prev.filter(f => f !== id)
        : [...prev, id]
    )
  }

  // ── Analysis ──
  const validCompetitors = competitorInputs.filter(c => c.trim())

  const saveAnalysis = (competitors: string[], focus: FocusId[], text: string) => {
    if (!text || text.startsWith('Error:')) return
    const entry: SavedAnalysis = {
      id: Date.now().toString(),
      competitors,
      focus,
      result: text,
      date: new Date().toISOString(),
    }
    const updated = [entry, ...analyses].slice(0, 50)
    setAnalyses(updated)
    saveAnalysesLS(clientId, updated)
  }

  const handleAnalyze = () => {
    if (validCompetitors.length === 0) return
    setViewingAnalysis(null)
    setSaved(false)

    const comps = [...validCompetitors]
    const foc = [...selectedFocus]
    lastAnalysisRef.current = { competitors: comps, focus: foc }

    const label = comps.length === 1
      ? comps[0]
      : `${comps.length} competitors`

    startBGStream(taskKey, label,
      '/api/intelligence/competitor-analyze',
      { clientId, competitors: comps, focus: foc },
      (text) => saveAnalysis(comps, foc, text),
    )
  }

  const handleReset = () => {
    clearBGTask(taskKey)
    setViewingAnalysis(null)
    setSaved(false)
  }

  const deleteAnalysis = (id: string) => {
    const updated = analyses.filter(a => a.id !== id)
    setAnalyses(updated)
    saveAnalysesLS(clientId, updated)
    if (viewingAnalysis?.id === id) setViewingAnalysis(null)
  }

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleManualSave = () => {
    if (!result || result.startsWith('Error:') || streaming) return
    const { competitors, focus } = lastAnalysisRef.current
    if (competitors.length === 0) return
    // Check if already saved (auto-save fires on completion too)
    const alreadyExists = analyses.some(a =>
      a.result === result && a.competitors.join(',') === competitors.join(',')
    )
    if (!alreadyExists) {
      saveAnalysis(competitors, focus, result)
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const displayResult = viewingAnalysis?.result || result
  const displayName = viewingAnalysis
    ? (viewingAnalysis.competitors.length === 1
      ? viewingAnalysis.competitors[0]
      : `${viewingAnalysis.competitors.length} competitors`)
    : analyzingName
  const isViewing = !!viewingAnalysis
  const hasContent = !!displayResult || streaming

  return (
    <div className="h-full flex gap-4">
      {/* Left Panel */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-[340px] shrink-0 flex flex-col gap-3 overflow-y-auto scroll-area"
      >
        {/* New Analysis Form */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
              <Eye size={18} className="text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Competitor Monitor</h3>
              <p className="text-[10px] text-white/25">Multi-competitor AI analysis</p>
            </div>
          </div>

          {/* Competitor Inputs */}
          <label className="text-[10px] font-medium text-white/30 uppercase tracking-wider mb-2 block">
            Competitors (up to 5)
          </label>
          <div className="flex flex-col gap-2 mb-3">
            <AnimatePresence initial={false}>
              {competitorInputs.map((val, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex gap-1.5 items-center"
                >
                  <div className="flex-1 relative">
                    <Globe size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/15" />
                    <input
                      value={val}
                      onChange={e => updateCompetitorInput(idx, e.target.value)}
                      placeholder={idx === 0 ? 'URL, Facebook page, or name...' : 'Another competitor...'}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-cyan-500/40 transition-colors"
                      onKeyDown={e => {
                        if (e.key === 'Enter' && val.trim() && competitorInputs.length < 5) {
                          addCompetitorSlot()
                        }
                      }}
                    />
                  </div>
                  {competitorInputs.length > 1 && (
                    <button
                      onClick={() => removeCompetitorSlot(idx)}
                      className="p-1.5 rounded-lg text-white/15 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
                    >
                      <X size={14} />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {competitorInputs.length < 5 && (
              <button
                onClick={addCompetitorSlot}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-white/25 hover:text-white/50 hover:bg-white/[0.03] transition-all self-start"
              >
                <Plus size={12} />
                Add competitor
              </button>
            )}
          </div>

          {/* Focus Area Checkboxes */}
          <label className="text-[10px] font-medium text-white/30 uppercase tracking-wider mb-2 block">
            Analysis Focus
          </label>
          <div className="flex flex-col gap-1.5 mb-4">
            {FOCUS_AREAS.map(area => {
              const Icon = area.icon
              const active = selectedFocus.includes(area.id)
              return (
                <button
                  key={area.id}
                  onClick={() => toggleFocus(area.id)}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all ${
                    active
                      ? 'bg-white/[0.06] border border-white/[0.1]'
                      : 'hover:bg-white/[0.02] border border-transparent'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all ${
                      active ? 'bg-cyan-500/30' : 'bg-white/[0.06]'
                    }`}
                  >
                    {active && <Check size={10} className="text-cyan-400" />}
                  </div>
                  <Icon size={13} style={{ color: active ? area.color : 'rgba(255,255,255,0.2)' }} className="shrink-0 transition-colors" />
                  <div className="min-w-0">
                    <div className={`text-xs font-medium transition-colors ${active ? 'text-white/70' : 'text-white/30'}`}>
                      {area.label}
                    </div>
                    <div className="text-[9px] text-white/15 truncate">{area.desc}</div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={validCompetitors.length === 0 || selectedFocus.length === 0 || streaming}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-25 disabled:cursor-not-allowed text-white text-sm font-medium flex items-center justify-center gap-2 transition-all"
          >
            {streaming ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            {streaming
              ? 'Analyzing...'
              : validCompetitors.length <= 1
                ? 'Analyze Competitor'
                : `Analyze ${validCompetitors.length} Competitors`
            }
          </button>

          {streaming && (
            <p className="text-[10px] text-cyan-400/40 mt-2 text-center">
              Runs in background -- navigate freely
            </p>
          )}

          {/* Quick summary under the button */}
          {validCompetitors.length > 0 && selectedFocus.length > 0 && !streaming && (
            <p className="text-[9px] text-white/15 mt-2 text-center">
              {validCompetitors.length} competitor{validCompetitors.length > 1 ? 's' : ''} / {selectedFocus.length} focus area{selectedFocus.length > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Analysis History */}
        {analyses.length > 0 && (
          <div className="glass rounded-xl p-3">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between px-1 mb-1"
            >
              <span className="text-[10px] font-medium text-white/25 uppercase tracking-wider flex items-center gap-1.5">
                <History size={10} />
                Saved Analyses
              </span>
              <span className="flex items-center gap-1">
                <span className="text-[9px] text-white/15 bg-white/[0.04] px-1.5 py-0.5 rounded">{analyses.length}</span>
                <ChevronDown size={10} className={`text-white/15 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
              </span>
            </button>
            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col gap-1 mt-2 max-h-[300px] overflow-y-auto scroll-area">
                    {analyses.map((a) => (
                      <div
                        key={a.id}
                        onClick={() => { setViewingAnalysis(a); clearBGTask(taskKey) }}
                        className={`group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all ${
                          viewingAnalysis?.id === a.id ? 'bg-cyan-500/10 border border-cyan-500/20' : 'hover:bg-white/[0.03]'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-md bg-white/[0.04] flex items-center justify-center shrink-0">
                          <FileText size={12} className="text-white/25" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-white/50 truncate">
                            {a.competitors.length === 1
                              ? a.competitors[0]
                              : `${a.competitors.length} competitors`
                            }
                          </div>
                          <div className="flex items-center gap-1.5 text-[9px] text-white/15">
                            <CalendarDays size={8} />
                            {new Date(a.date).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' })}
                            <span className="text-white/10">|</span>
                            <span className="truncate">
                              {a.focus.length} focus area{a.focus.length > 1 ? 's' : ''}
                            </span>
                          </div>
                          {a.competitors.length > 1 && (
                            <div className="text-[8px] text-white/10 truncate mt-0.5">
                              {a.competitors.join(', ')}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); deleteAnalysis(a.id) }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-white/15 hover:text-red-400 transition-all"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Right Panel -- Result */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex-1 min-w-0 overflow-y-auto scroll-area"
      >
        {!hasContent && !isViewing ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-xs">
              <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center mx-auto mb-5">
                <Eye size={32} className="text-white/[0.06]" />
              </div>
              <h3 className="text-sm font-semibold text-white/25 mb-2">Competitor Intelligence</h3>
              <p className="text-xs text-white/15 leading-relaxed">
                Add competitors, select focus areas, and run an AI-powered analysis. Results are saved automatically.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Header Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  streaming ? 'bg-cyan-500/15' : 'bg-emerald-500/15'
                }`}>
                  {streaming ? (
                    <Loader2 size={18} className="animate-spin text-cyan-400" />
                  ) : (
                    <Check size={18} className="text-emerald-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{displayName}</h3>
                  <p className="text-[10px] text-white/25">
                    {streaming ? 'Researching online...' :
                     isViewing ? new Date(viewingAnalysis!.date).toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' }) :
                     'Analysis complete'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {/* Save button */}
                {!streaming && displayResult && !isViewing && (
                  <button
                    onClick={handleManualSave}
                    className="p-2 rounded-lg glass-hover text-white/25 hover:text-white/50 transition-colors"
                    title="Save analysis"
                  >
                    {saved ? <Check size={14} className="text-emerald-400" /> : <Save size={14} />}
                  </button>
                )}
                {/* Copy button */}
                {!streaming && displayResult && (
                  <button
                    onClick={() => copyText(displayResult)}
                    className="p-2 rounded-lg glass-hover text-white/25 hover:text-white/50 transition-colors"
                    title="Copy analysis"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                )}
                {/* Reset button */}
                {!isViewing && (result || streaming) && (
                  <button
                    onClick={handleReset}
                    className="p-2 rounded-lg glass-hover text-white/25 hover:text-white/50 transition-colors"
                    title="Clear"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
                {/* Close viewing */}
                {isViewing && (
                  <button
                    onClick={() => setViewingAnalysis(null)}
                    className="px-3 py-1.5 rounded-lg glass-hover text-[10px] text-white/30 hover:text-white/50 transition-colors"
                  >
                    Close
                  </button>
                )}
              </div>
            </motion.div>

            {/* Competitor Pills (when viewing a multi-competitor analysis) */}
            {isViewing && viewingAnalysis!.competitors.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 }}
                className="flex flex-wrap gap-1.5"
              >
                {viewingAnalysis!.competitors.map((c, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[11px] text-white/40 flex items-center gap-1.5"
                  >
                    <Globe size={10} className="text-cyan-400/50" />
                    {c}
                  </span>
                ))}
              </motion.div>
            )}

            {/* Focus area badges (when viewing) */}
            {isViewing && viewingAnalysis!.focus.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="flex flex-wrap gap-1"
              >
                {viewingAnalysis!.focus.map(fId => {
                  const area = FOCUS_AREAS.find(a => a.id === fId)
                  if (!area) return null
                  const Icon = area.icon
                  return (
                    <span
                      key={fId}
                      className="px-2 py-0.5 rounded-md bg-white/[0.03] text-[9px] text-white/25 flex items-center gap-1"
                    >
                      <Icon size={9} style={{ color: area.color }} />
                      {area.label}
                    </span>
                  )
                })}
              </motion.div>
            )}

            {/* Analysis Content */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="glass rounded-xl p-5"
            >
              {streaming && !result ? (
                <div className="flex flex-col items-center py-12">
                  <div className="relative mb-4">
                    <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
                    <Search size={16} className="text-cyan-400/60 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-sm text-white/30">Researching {analyzingName}...</p>
                  <p className="text-[10px] text-white/15 mt-1">Searching web, social media, reviews</p>
                </div>
              ) : streaming ? (
                <>
                  <div className="text-sm text-white/60 whitespace-pre-wrap leading-relaxed">{result}</div>
                  <div className="mt-3 h-0.5 w-10 bg-cyan-500/40 animate-pulse rounded-full" />
                </>
              ) : (
                <div>{formatResult(displayResult)}</div>
              )}
              <div ref={resultEndRef} />
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
