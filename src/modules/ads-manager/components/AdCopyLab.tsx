import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Send, Copy, Check, Loader2, AlertCircle, RotateCcw,
  Target, History, Clipboard, X, Square,
} from 'lucide-react'
import { useApp } from '../../../core/context'
import { useAIStream, useAIStatus } from '../../content-intelligence/hooks/useAI'
import type { CampaignObjective, AdPlatform } from '../types'
import { OBJECTIVES } from '../types'

// ── Types ────────────────────────────────────────────────

interface AdVariantCard {
  label: string
  angle: string
  headline: string
  primaryText: string
  description: string
  cta: string
  extendedText: string
}

interface GenerationEntry {
  id: string
  timestamp: number
  clientName: string
  platform: AdPlatform
  objective: CampaignObjective
  product: string
  tone: string
  rawOutput: string
  variants: AdVariantCard[]
}

type ToneOption = { id: string; label: string }

// ── Constants ────────────────────────────────────────────

const TONES: ToneOption[] = [
  { id: 'professional', label: 'Professional' },
  { id: 'casual', label: 'Casual' },
  { id: 'urgent', label: 'Urgent' },
  { id: 'playful', label: 'Playful' },
  { id: 'luxury', label: 'Luxury' },
]

const PLATFORM_OPTIONS: { value: AdPlatform | 'both'; label: string; color: string }[] = [
  { value: 'facebook', label: 'Facebook', color: '#1877F2' },
  { value: 'instagram', label: 'Instagram', color: '#E4405F' },
  { value: 'both' as any, label: 'Both', color: '#7c3aed' },
]

// ── Variant Parser ───────────────────────────────────────

function parseVariants(raw: string): AdVariantCard[] {
  const variants: AdVariantCard[] = []

  // Split on "Variant A", "Variant B", etc. or "**Variant A", "### Variant A"
  const variantBlocks = raw.split(/(?=(?:\*{0,2}#{0,3}\s*)?Variant\s+[A-E]\s*[—–\-:]+)/i)

  for (const block of variantBlocks) {
    if (!block.trim()) continue

    // Extract variant label and angle
    const headerMatch = block.match(/Variant\s+([A-E])\s*[—–\-:]+\s*\*{0,2}\s*(.+?)(?:\*{0,2})\s*[—–\-:]+/i)
      || block.match(/Variant\s+([A-E])\s*[—–\-:]+\s*\*{0,2}\s*(.+?)(?:\*{0,2})\s*$/im)
    if (!headerMatch) continue

    const label = headerMatch[1].toUpperCase()
    const angle = headerMatch[2].replace(/\*+/g, '').trim()

    // Extract fields with flexible matching
    const headline = extractField(block, 'Headline')
    const primaryText = extractField(block, 'Primary Text')
    const description = extractField(block, 'Description')
    const cta = extractField(block, 'CTA Button') || extractField(block, 'CTA')
    const extendedText = extractField(block, 'Extended Primary Text') || extractField(block, 'Extended Text')

    // Only add if we got at least a headline and primary text
    if (headline || primaryText) {
      variants.push({
        label,
        angle,
        headline: headline || '',
        primaryText: primaryText || '',
        description: description || '',
        cta: cta || '',
        extendedText: extendedText || '',
      })
    }
  }

  return variants
}

function extractField(block: string, fieldName: string): string {
  // Match patterns like: **Headline**: text, **Headline:** text, 1. **Headline** — text
  const patterns = [
    new RegExp(`\\*{0,2}${fieldName}\\*{0,2}\\s*[:\\-—–]+\\s*(.+?)(?=\\n\\s*(?:\\d+\\.|\\*{2}|$))`, 'is'),
    new RegExp(`\\*{0,2}${fieldName}\\*{0,2}\\s*[:\\-—–]+\\s*(.+)`, 'i'),
  ]
  for (const pat of patterns) {
    const m = block.match(pat)
    if (m) {
      return m[1]
        .replace(/^\*+|\*+$/g, '')
        .replace(/^[""]|[""]$/g, '')
        .trim()
    }
  }
  return ''
}

// ── Component ────────────────────────────────────────────

export function AdCopyLab() {
  const { data, selectedClient } = useApp()
  const { stream, streaming, abort } = useAIStream()
  const { configured, check } = useAIStatus()

  // Form state
  const [clientId, setClientId] = useState(selectedClient || data.clients[0]?.id || '')
  const [platform, setPlatform] = useState<AdPlatform | 'both'>('facebook')
  const [objective, setObjective] = useState<CampaignObjective>('traffic')
  const [product, setProduct] = useState('')
  const [audience, setAudience] = useState('')
  const [keyMessage, setKeyMessage] = useState('')
  const [tone, setTone] = useState('')
  const [numVariants, setNumVariants] = useState(3)

  // Output state
  const [rawOutput, setRawOutput] = useState('')
  const [variants, setVariants] = useState<AdVariantCard[]>([])
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)
  const rawRef = useRef('')
  const outputEndRef = useRef<HTMLDivElement>(null)

  // History
  const [history, setHistory] = useState<GenerationEntry[]>([])
  const [showHistory, setShowHistory] = useState(false)

  // Init
  useEffect(() => { check() }, [check])
  useEffect(() => { if (selectedClient) setClientId(selectedClient) }, [selectedClient])

  // Parse variants when streaming finishes
  useEffect(() => {
    if (!streaming && rawOutput) {
      const parsed = parseVariants(rawOutput)
      setVariants(parsed)
    }
  }, [streaming, rawOutput])

  const generate = useCallback(async () => {
    if (!clientId || !product.trim() || streaming) return

    setRawOutput('')
    setVariants([])
    rawRef.current = ''

    const platformVal = platform === 'both' ? 'Facebook & Instagram' : platform

    await stream(
      '/api/ai/adcopy',
      {
        clientId,
        platform: platformVal,
        objective,
        product: product.trim(),
        audience: audience.trim() || undefined,
        keyMessage: keyMessage.trim() || undefined,
        tone: tone || undefined,
        numVariants,
      },
      (chunk) => {
        rawRef.current += chunk
        setRawOutput(rawRef.current)
        outputEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      },
      () => {
        // On done — save to history
        const clientObj = data.clients.find(c => c.id === clientId)
        const parsed = parseVariants(rawRef.current)
        const entry: GenerationEntry = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          clientName: clientObj?.displayName || clientId,
          platform: platform === 'both' ? 'facebook' : platform,
          objective,
          product: product.trim(),
          tone,
          rawOutput: rawRef.current,
          variants: parsed,
        }
        setHistory(prev => [entry, ...prev].slice(0, 5))
      },
    )
  }, [clientId, platform, objective, product, audience, keyMessage, tone, numVariants, streaming, stream, data.clients])

  const handleStop = () => { abort() }

  const copyVariant = (idx: number) => {
    const v = variants[idx]
    if (!v) return
    const text = [
      `Headline: ${v.headline}`,
      `Primary Text: ${v.primaryText}`,
      v.description && `Description: ${v.description}`,
      `CTA: ${v.cta}`,
      v.extendedText && `\nExtended Primary Text:\n${v.extendedText}`,
    ].filter(Boolean).join('\n')
    navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  const copyAll = () => {
    navigator.clipboard.writeText(rawOutput)
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2000)
  }

  const restoreFromHistory = (entry: GenerationEntry) => {
    setRawOutput(entry.rawOutput)
    setVariants(entry.variants)
    setShowHistory(false)
  }

  const reset = () => {
    abort()
    setRawOutput('')
    setVariants([])
    rawRef.current = ''
  }

  // ── Render states ──────────────────────────────────────

  if (configured === null) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={24} className="text-white/20 animate-spin" />
      </div>
    )
  }

  if (configured === false) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl p-8 max-w-md text-center">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} className="text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">AI Not Configured</h3>
          <p className="text-sm text-white/40 mb-4">
            Claude Code CLI is required for ad copy generation. Make sure it's installed and accessible.
          </p>
          <div className="glass rounded-lg p-3 text-left">
            <code className="text-xs text-white/60">npm install -g @anthropic-ai/claude-code</code>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── Main layout ────────────────────────────────────────

  return (
    <div className="flex-1 overflow-hidden flex flex-col p-6 pr-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-violet to-accent-cyan flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Ad Copy Lab</h2>
              <p className="text-xs text-white/25">Generate high-converting ad copy with AI</p>
            </div>
          </div>

          {/* History toggle */}
          {history.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                showHistory
                  ? 'glass-active text-white'
                  : 'text-white/30 hover:text-white/50 hover:bg-white/[0.03]'
              }`}
            >
              <History size={13} />
              History ({history.length})
            </button>
          )}
        </div>
      </motion.div>

      {/* History panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="glass rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-white/30 font-medium">Recent Generations</span>
                <button onClick={() => setShowHistory(false)} className="p-1 rounded hover:bg-white/[0.05]">
                  <X size={12} className="text-white/30" />
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {history.map(entry => (
                  <button
                    key={entry.id}
                    onClick={() => restoreFromHistory(entry)}
                    className="shrink-0 glass glass-hover rounded-lg p-3 text-left transition-all min-w-[200px] max-w-[240px]"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-semibold text-accent-violet/70 uppercase tracking-wider">{entry.clientName}</span>
                      <span className="text-[10px] text-white/15">{entry.platform}</span>
                    </div>
                    <p className="text-xs text-white/50 truncate">{entry.product}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-white/20">
                        {new Date(entry.timestamp).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[10px] text-white/20">{entry.variants.length} variants</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
        {/* ── Input Panel ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 }}
          className="w-[360px] shrink-0 overflow-y-auto scroll-area"
        >
          <div className="glass rounded-xl p-5 space-y-4">
            {/* Client */}
            <div>
              <label className="text-[10px] text-white/25 uppercase tracking-wider font-semibold mb-1.5 block">Client</label>
              <select
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                className="w-full glass rounded-lg px-3 py-2 text-sm text-white/80 bg-transparent border border-white/[0.08] outline-none focus:border-accent-violet/40 transition-colors"
              >
                {data.clients.map(c => (
                  <option key={c.id} value={c.id} className="bg-surface-200 text-white">{c.displayName}</option>
                ))}
              </select>
            </div>

            {/* Platform */}
            <div>
              <label className="text-[10px] text-white/25 uppercase tracking-wider font-semibold mb-1.5 block">Platform</label>
              <div className="flex gap-1.5">
                {PLATFORM_OPTIONS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => setPlatform(p.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      platform === p.value
                        ? 'glass-active text-white'
                        : 'text-white/30 hover:text-white/50 hover:bg-white/[0.03]'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Objective */}
            <div>
              <label className="text-[10px] text-white/25 uppercase tracking-wider font-semibold mb-1.5 block">Objective</label>
              <div className="grid grid-cols-3 gap-1.5">
                {OBJECTIVES.map(obj => (
                  <button
                    key={obj.value}
                    onClick={() => setObjective(obj.value)}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                      objective === obj.value
                        ? 'glass-active text-white'
                        : 'text-white/30 hover:text-white/50 hover:bg-white/[0.03]'
                    }`}
                  >
                    {obj.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Product / Service */}
            <div>
              <label className="text-[10px] text-white/25 uppercase tracking-wider font-semibold mb-1.5 block">Product / Service</label>
              <input
                type="text"
                value={product}
                onChange={e => setProduct(e.target.value)}
                placeholder="e.g. Implant dentar, Servicii topografice..."
                className="w-full glass rounded-lg px-3 py-2.5 text-sm text-white/80 bg-transparent border border-white/[0.08] outline-none focus:border-accent-violet/40 transition-colors placeholder:text-white/20"
              />
            </div>

            {/* Target Audience */}
            <div>
              <label className="text-[10px] text-white/25 uppercase tracking-wider font-semibold mb-1.5 block">
                Target Audience <span className="text-white/15">(optional)</span>
              </label>
              <input
                type="text"
                value={audience}
                onChange={e => setAudience(e.target.value)}
                placeholder="e.g. Femei 25-45, proprietari de case..."
                className="w-full glass rounded-lg px-3 py-2.5 text-sm text-white/80 bg-transparent border border-white/[0.08] outline-none focus:border-accent-violet/40 transition-colors placeholder:text-white/20"
              />
            </div>

            {/* Key Message */}
            <div>
              <label className="text-[10px] text-white/25 uppercase tracking-wider font-semibold mb-1.5 block">
                Key Message / Offer <span className="text-white/15">(optional)</span>
              </label>
              <textarea
                value={keyMessage}
                onChange={e => setKeyMessage(e.target.value)}
                placeholder="Main selling point, offer, or benefit..."
                rows={2}
                className="w-full glass rounded-lg px-3 py-2.5 text-sm text-white/80 bg-transparent border border-white/[0.08] outline-none focus:border-accent-violet/40 transition-colors placeholder:text-white/20 resize-none"
              />
            </div>

            {/* Tone */}
            <div>
              <label className="text-[10px] text-white/25 uppercase tracking-wider font-semibold mb-1.5 block">
                Tone <span className="text-white/15">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {TONES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTone(tone === t.id ? '' : t.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                      tone === t.id
                        ? 'glass-active text-white'
                        : 'text-white/25 hover:text-white/50 hover:bg-white/[0.03]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Number of Variants */}
            <div>
              <label className="text-[10px] text-white/25 uppercase tracking-wider font-semibold mb-1.5 block">Variants</label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setNumVariants(n)}
                    className={`w-9 h-9 rounded-lg text-xs font-semibold transition-all ${
                      numVariants === n
                        ? 'glass-active text-white'
                        : 'text-white/25 hover:text-white/50 hover:bg-white/[0.03]'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={streaming ? handleStop : generate}
              disabled={!product.trim() || !clientId}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                streaming
                  ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20'
                  : 'bg-gradient-to-r from-accent-violet to-accent-indigo text-white hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed'
              }`}
            >
              {streaming ? (
                <>
                  <Square size={14} />
                  Stop Generating
                </>
              ) : (
                <>
                  <Send size={16} />
                  Generate Ad Copy
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* ── Output Panel ────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 flex flex-col min-w-0 min-h-0"
        >
          {/* Output header */}
          {(rawOutput || streaming) && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-white/30 font-medium">
                {streaming ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={12} className="animate-spin text-accent-violet" />
                    Generating...
                  </span>
                ) : (
                  `${variants.length} variant${variants.length !== 1 ? 's' : ''} generated`
                )}
              </span>
              <div className="flex items-center gap-2">
                {rawOutput && !streaming && (
                  <button
                    onClick={copyAll}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] text-white/30 hover:text-white/50 glass glass-hover transition-all"
                  >
                    {copiedAll ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                    {copiedAll ? 'Copied' : 'Copy all'}
                  </button>
                )}
                <button
                  onClick={reset}
                  className="p-1.5 rounded-lg glass glass-hover transition-all"
                  title="Reset output"
                >
                  <RotateCcw size={12} className="text-white/30" />
                </button>
              </div>
            </div>
          )}

          {/* Content area */}
          <div className="flex-1 overflow-y-auto scroll-area min-h-0">
            {!rawOutput && !streaming ? (
              /* Empty state */
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-sm">
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                    <Target size={28} className="text-white/10" />
                  </div>
                  <p className="text-sm text-white/25 mb-1">Ready to generate</p>
                  <p className="text-xs text-white/15 leading-relaxed">
                    Fill in the details on the left and click Generate to create
                    high-converting ad copy variants in Romanian
                  </p>
                </div>
              </div>
            ) : !streaming && variants.length > 0 ? (
              /* Parsed variant cards */
              <div className="space-y-4 pb-4">
                {variants.map((v, idx) => (
                  <VariantCard
                    key={v.label}
                    variant={v}
                    index={idx}
                    copied={copiedIdx === idx}
                    onCopy={() => copyVariant(idx)}
                  />
                ))}
              </div>
            ) : (
              /* Raw streaming output (while streaming or when variants couldn't be parsed) */
              <div className="glass rounded-xl p-5 min-h-[200px]">
                <div className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed break-words">
                  {rawOutput}
                </div>
                {streaming && (
                  <span className="inline-block w-2 h-4 bg-accent-violet/60 animate-pulse ml-0.5 align-baseline" />
                )}
                <div ref={outputEndRef} />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// ── Variant Card Component ───────────────────────────────

function VariantCard({
  variant,
  index,
  copied,
  onCopy,
}: {
  variant: AdVariantCard
  index: number
  copied: boolean
  onCopy: () => void
}) {
  const [clipCopied, setClipCopied] = useState(false)

  const handleUseInCampaign = () => {
    const text = [
      variant.headline,
      variant.primaryText,
      variant.extendedText,
      variant.description && `Description: ${variant.description}`,
      variant.cta && `CTA: ${variant.cta}`,
    ].filter(Boolean).join('\n\n')
    navigator.clipboard.writeText(text)
    setClipCopied(true)
    setTimeout(() => setClipCopied(false), 2000)
  }

  const angleColors: Record<string, string> = {
    A: 'from-accent-violet/20 to-accent-indigo/10 border-accent-violet/15',
    B: 'from-accent-cyan/20 to-blue-500/10 border-accent-cyan/15',
    C: 'from-accent-orange/20 to-amber-500/10 border-accent-orange/15',
    D: 'from-accent-pink/20 to-rose-500/10 border-accent-pink/15',
    E: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/15',
  }
  const colorClass = angleColors[variant.label] || angleColors['A']

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={`rounded-xl border bg-gradient-to-br ${colorClass} overflow-hidden`}
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-lg bg-white/[0.08] flex items-center justify-center text-xs font-bold text-white/70">
            {variant.label}
          </span>
          <span className="text-xs text-white/40 font-medium">{variant.angle}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onCopy}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-white/30 hover:text-white/50 hover:bg-white/[0.05] transition-all"
            title="Copy variant"
          >
            {copied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={handleUseInCampaign}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-white/30 hover:text-white/50 hover:bg-white/[0.05] transition-all"
            title="Copy formatted for campaign use"
          >
            {clipCopied ? <Check size={10} className="text-emerald-400" /> : <Clipboard size={10} />}
            {clipCopied ? 'Ready' : 'Use in campaign'}
          </button>
        </div>
      </div>

      {/* Card body */}
      <div className="p-5 space-y-3">
        {/* Headline */}
        {variant.headline && (
          <div>
            <span className="text-[10px] text-white/20 uppercase tracking-wider font-semibold block mb-0.5">Headline</span>
            <p className="text-base font-semibold text-white/90 leading-snug">{variant.headline}</p>
          </div>
        )}

        {/* Primary Text */}
        {variant.primaryText && (
          <div>
            <span className="text-[10px] text-white/20 uppercase tracking-wider font-semibold block mb-0.5">Primary Text</span>
            <p className="text-sm text-white/70 leading-relaxed">{variant.primaryText}</p>
          </div>
        )}

        {/* Description */}
        {variant.description && (
          <div>
            <span className="text-[10px] text-white/20 uppercase tracking-wider font-semibold block mb-0.5">Description</span>
            <p className="text-sm text-white/50">{variant.description}</p>
          </div>
        )}

        {/* CTA */}
        {variant.cta && (
          <div>
            <span className="text-[10px] text-white/20 uppercase tracking-wider font-semibold block mb-0.5">CTA</span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/[0.08] text-white/60 border border-white/[0.08]">
              {variant.cta}
            </span>
          </div>
        )}

        {/* Extended Text */}
        {variant.extendedText && (
          <div className="pt-2 border-t border-white/[0.04]">
            <span className="text-[10px] text-white/20 uppercase tracking-wider font-semibold block mb-0.5">Extended Primary Text</span>
            <p className="text-sm text-white/50 leading-relaxed">{variant.extendedText}</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
