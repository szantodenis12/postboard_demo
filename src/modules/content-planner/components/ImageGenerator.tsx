import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useCallback } from 'react'
import {
  Sparkles, Copy, Check, Wand2, ChevronUp,
  Camera, Paintbrush, Minus, Bold, Heart,
  Clipboard, History, X, Loader2, RotateCcw,
} from 'lucide-react'
import type { Post } from '../../../core/types'

// ── Types ─────────────────────────────────────────────────

interface PromptHistoryEntry {
  id: string
  prompt: string
  aspectRatio: string
  style: string
  timestamp: number
}

type StylePreset = 'photography' | 'illustration' | 'minimalist' | 'bold-graphic' | 'lifestyle'

const STYLE_PRESETS: { id: StylePreset; label: string; icon: typeof Camera; desc: string }[] = [
  { id: 'photography', label: 'Photography', icon: Camera, desc: 'Realistic photo style' },
  { id: 'illustration', label: 'Illustration', icon: Paintbrush, desc: 'Drawn / illustrated' },
  { id: 'minimalist', label: 'Minimalist', icon: Minus, desc: 'Clean and simple' },
  { id: 'bold-graphic', label: 'Bold / Graphic', icon: Bold, desc: 'Strong visual impact' },
  { id: 'lifestyle', label: 'Lifestyle', icon: Heart, desc: 'Authentic and warm' },
]

const ASPECT_RATIOS: { value: string; label: string; platforms: string }[] = [
  { value: '1:1', label: '1:1', platforms: 'IG Feed' },
  { value: '4:5', label: '4:5', platforms: 'IG Portrait' },
  { value: '9:16', label: '9:16', platforms: 'Stories / Reels' },
  { value: '16:9', label: '16:9', platforms: 'FB / LinkedIn' },
]

function getDefaultAspectRatio(platform: string, format: string): string {
  if (format === 'stories' || format === 'reel') return '9:16'
  if (platform === 'instagram') return '1:1'
  if (platform === 'facebook') return '16:9'
  if (platform === 'linkedin') return '16:9'
  if (platform === 'tiktok') return '9:16'
  return '1:1'
}

// ── Component ─────────────────────────────────────────────

export function ImageGenerator({
  post,
  onClose,
}: {
  post: Post
  onClose: () => void
}) {
  const [enhancedPrompt, setEnhancedPrompt] = useState('')
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [aspectRatio, setAspectRatio] = useState(() =>
    getDefaultAspectRatio(post.platform, post.format),
  )
  const [activeStyle, setActiveStyle] = useState<StylePreset>('photography')
  const [copied, setCopied] = useState<'prompt' | 'midjourney' | null>(null)
  const [history, setHistory] = useState<PromptHistoryEntry[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ── Enhance prompt via AI ──────────────────────────────

  const handleEnhance = useCallback(async () => {
    if (isEnhancing) {
      // Cancel ongoing request
      abortRef.current?.abort()
      setIsEnhancing(false)
      return
    }

    setIsEnhancing(true)
    setEnhancedPrompt('')

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch('/api/ai/image-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visualDescription: post.visualDescription,
          clientName: post.clientName,
          platform: post.platform,
          format: post.format,
          pillar: post.pillar,
        }),
        signal: controller.signal,
      })

      if (!res.ok) {
        throw new Error('Failed to enhance prompt')
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response stream')

      const decoder = new TextDecoder()
      let fullText = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Parse SSE events from the buffer
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6)
          if (payload === '[DONE]') continue

          try {
            const data = JSON.parse(payload)
            if (data.text) {
              fullText += data.text
              // Extract only the prompt portion (before the JSON block)
              const jsonBlockStart = fullText.indexOf('```json')
              const displayText = jsonBlockStart > -1
                ? fullText.slice(0, jsonBlockStart).trim()
                : fullText.trim()
              setEnhancedPrompt(displayText)
            }
          } catch {
            // Ignore parse errors in stream chunks
          }
        }
      }

      // Try to extract the final JSON block
      const jsonMatch = fullText.match(/```json\s*(\{[\s\S]*?\})\s*```/)
      if (jsonMatch) {
        try {
          const result = JSON.parse(jsonMatch[1])
          if (result.prompt) setEnhancedPrompt(result.prompt)
          if (result.aspectRatio) setAspectRatio(result.aspectRatio)
          if (result.style) {
            const normalized = result.style as StylePreset
            if (STYLE_PRESETS.some(s => s.id === normalized)) {
              setActiveStyle(normalized)
            }
          }

          // Add to history
          const entry: PromptHistoryEntry = {
            id: Date.now().toString(),
            prompt: result.prompt || enhancedPrompt,
            aspectRatio: result.aspectRatio || aspectRatio,
            style: result.style || activeStyle,
            timestamp: Date.now(),
          }
          setHistory(prev => [entry, ...prev].slice(0, 20))
        } catch {
          // If JSON parsing fails, still save the streamed text
          if (fullText.trim()) {
            const jsonBlockStart = fullText.indexOf('```json')
            const cleanText = jsonBlockStart > -1
              ? fullText.slice(0, jsonBlockStart).trim()
              : fullText.trim()
            setEnhancedPrompt(cleanText)
            setHistory(prev => [{
              id: Date.now().toString(),
              prompt: cleanText,
              aspectRatio,
              style: activeStyle,
              timestamp: Date.now(),
            }, ...prev].slice(0, 20))
          }
        }
      } else if (fullText.trim()) {
        // No JSON block found, use full text as prompt
        setHistory(prev => [{
          id: Date.now().toString(),
          prompt: fullText.trim(),
          aspectRatio,
          style: activeStyle,
          timestamp: Date.now(),
        }, ...prev].slice(0, 20))
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Image prompt enhancement failed:', err)
      }
    }

    setIsEnhancing(false)
  }, [isEnhancing, post, aspectRatio, activeStyle, enhancedPrompt])

  // ── Copy functions ─────────────────────────────────────

  const currentPrompt = enhancedPrompt || post.visualDescription || ''

  const copyPrompt = useCallback(() => {
    navigator.clipboard.writeText(currentPrompt)
    setCopied('prompt')
    setTimeout(() => setCopied(null), 2000)
  }, [currentPrompt])

  const copyForMidjourney = useCallback(() => {
    const mjPrompt = `/imagine ${currentPrompt} --ar ${aspectRatio} --style raw --v 6.1`
    navigator.clipboard.writeText(mjPrompt)
    setCopied('midjourney')
    setTimeout(() => setCopied(null), 2000)
  }, [currentPrompt, aspectRatio])

  // ── Restore from history ───────────────────────────────

  const restoreFromHistory = useCallback((entry: PromptHistoryEntry) => {
    setEnhancedPrompt(entry.prompt)
    setAspectRatio(entry.aspectRatio)
    const normalized = entry.style as StylePreset
    if (STYLE_PRESETS.some(s => s.id === normalized)) {
      setActiveStyle(normalized)
    }
    setShowHistory(false)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="overflow-hidden"
    >
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.06), rgba(6,182,212,0.06))',
          border: '1px solid rgba(139,92,246,0.15)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(6,182,212,0.25))',
              }}
            >
              <Sparkles size={12} className="text-violet-400" />
            </div>
            <span className="text-xs font-semibold text-white/70">Image Prompt Generator</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-white/[0.06] transition-colors"
          >
            <X size={14} className="text-white/30" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Source visual description */}
          <div>
            <span className="text-[10px] uppercase tracking-wider text-white/25 font-medium mb-1.5 block">
              Source Description
            </span>
            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]">
              <p className="text-[11px] text-white/40 leading-relaxed">
                {post.visualDescription}
              </p>
            </div>
          </div>

          {/* Style presets */}
          <div>
            <span className="text-[10px] uppercase tracking-wider text-white/25 font-medium mb-2 block">
              Style Preset
            </span>
            <div className="flex flex-wrap gap-1.5">
              {STYLE_PRESETS.map(style => {
                const Icon = style.icon
                const isActive = activeStyle === style.id
                return (
                  <button
                    key={style.id}
                    onClick={() => setActiveStyle(style.id)}
                    className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all"
                    style={{
                      background: isActive ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isActive ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.06)'}`,
                      color: isActive ? 'rgba(139,92,246,0.9)' : 'rgba(255,255,255,0.35)',
                    }}
                    title={style.desc}
                  >
                    <Icon size={11} />
                    {style.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Aspect ratio selector */}
          <div>
            <span className="text-[10px] uppercase tracking-wider text-white/25 font-medium mb-2 block">
              Aspect Ratio
            </span>
            <div className="flex gap-1.5">
              {ASPECT_RATIOS.map(ar => {
                const isActive = aspectRatio === ar.value
                return (
                  <button
                    key={ar.value}
                    onClick={() => setAspectRatio(ar.value)}
                    className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg transition-all"
                    style={{
                      background: isActive ? 'rgba(6,182,212,0.12)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isActive ? 'rgba(6,182,212,0.25)' : 'rgba(255,255,255,0.06)'}`,
                    }}
                  >
                    <span
                      className="text-[11px] font-semibold"
                      style={{ color: isActive ? 'rgba(6,182,212,0.9)' : 'rgba(255,255,255,0.4)' }}
                    >
                      {ar.label}
                    </span>
                    <span
                      className="text-[9px]"
                      style={{ color: isActive ? 'rgba(6,182,212,0.5)' : 'rgba(255,255,255,0.2)' }}
                    >
                      {ar.platforms}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Enhance button */}
          <button
            onClick={handleEnhance}
            disabled={!post.visualDescription}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-30 disabled:hover:scale-100"
            style={{
              background: isEnhancing
                ? 'rgba(239,68,68,0.12)'
                : 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(6,182,212,0.2))',
              border: `1px solid ${isEnhancing ? 'rgba(239,68,68,0.25)' : 'rgba(139,92,246,0.25)'}`,
              color: isEnhancing ? 'rgba(239,68,68,0.8)' : 'rgba(255,255,255,0.8)',
            }}
          >
            {isEnhancing ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Cancel Enhancing
              </>
            ) : (
              <>
                <Wand2 size={13} />
                {enhancedPrompt ? 'Re-enhance Prompt' : 'Enhance with AI'}
              </>
            )}
          </button>

          {/* Enhanced prompt textarea */}
          <AnimatePresence>
            {(enhancedPrompt || isEnhancing) && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-white/25 font-medium">
                    Enhanced Prompt
                  </span>
                  {isEnhancing && (
                    <span className="flex items-center gap-1 text-[10px] text-violet-400/60">
                      <Loader2 size={10} className="animate-spin" />
                      Generating...
                    </span>
                  )}
                </div>
                <div
                  className="rounded-lg overflow-hidden"
                  style={{
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid rgba(139,92,246,0.12)',
                  }}
                >
                  <textarea
                    ref={textareaRef}
                    value={enhancedPrompt}
                    onChange={(e) => setEnhancedPrompt(e.target.value)}
                    className="w-full bg-transparent text-[11px] text-white/70 leading-relaxed outline-none resize-none p-3 min-h-[80px]"
                    placeholder={isEnhancing ? 'AI is enhancing your description...' : 'Enhanced prompt will appear here...'}
                    disabled={isEnhancing}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action buttons */}
          {enhancedPrompt && !isEnhancing && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2"
            >
              <button
                onClick={copyPrompt}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background: copied === 'prompt' ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${copied === 'prompt' ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.08)'}`,
                  color: copied === 'prompt' ? 'rgba(16,185,129,0.9)' : 'rgba(255,255,255,0.5)',
                }}
              >
                {copied === 'prompt' ? <Check size={12} /> : <Copy size={12} />}
                {copied === 'prompt' ? 'Copied!' : 'Copy Prompt'}
              </button>

              <button
                onClick={copyForMidjourney}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background: copied === 'midjourney'
                    ? 'rgba(16,185,129,0.12)'
                    : 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(6,182,212,0.1))',
                  border: `1px solid ${copied === 'midjourney' ? 'rgba(16,185,129,0.25)' : 'rgba(139,92,246,0.15)'}`,
                  color: copied === 'midjourney' ? 'rgba(16,185,129,0.9)' : 'rgba(139,92,246,0.8)',
                }}
              >
                {copied === 'midjourney' ? <Check size={12} /> : <Clipboard size={12} />}
                {copied === 'midjourney' ? 'Copied!' : 'Copy for Midjourney'}
              </button>

              <button
                onClick={() => setShowHistory(!showHistory)}
                className="p-2 rounded-lg transition-all hover:bg-white/[0.06]"
                style={{
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: showHistory ? 'rgba(139,92,246,0.7)' : 'rgba(255,255,255,0.3)',
                }}
                title="Prompt History"
              >
                <History size={13} />
              </button>
            </motion.div>
          )}

          {/* Midjourney preview */}
          {enhancedPrompt && !isEnhancing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <span className="text-[10px] uppercase tracking-wider text-white/20 font-medium mb-1.5 block">
                Midjourney Command Preview
              </span>
              <div
                className="p-3 rounded-lg text-[10px] font-mono leading-relaxed break-all"
                style={{
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  color: 'rgba(139,92,246,0.5)',
                }}
              >
                <span className="text-cyan-500/50">/imagine</span>{' '}
                <span className="text-white/40">{currentPrompt}</span>{' '}
                <span className="text-violet-400/50">--ar {aspectRatio}</span>{' '}
                <span className="text-violet-400/50">--style raw</span>{' '}
                <span className="text-violet-400/50">--v 6.1</span>
              </div>
            </motion.div>
          )}

          {/* History panel */}
          <AnimatePresence>
            {showHistory && history.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-wider text-white/25 font-medium flex items-center gap-1">
                    <History size={10} />
                    Prompt History ({history.length})
                  </span>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="text-[10px] text-white/25 hover:text-white/50 transition-colors"
                  >
                    <ChevronUp size={12} />
                  </button>
                </div>
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto scroll-area">
                  {history.map(entry => (
                    <button
                      key={entry.id}
                      onClick={() => restoreFromHistory(entry)}
                      className="w-full text-left p-2.5 rounded-lg transition-all hover:bg-white/[0.04] group"
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.04)',
                      }}
                    >
                      <p className="text-[10px] text-white/40 leading-relaxed line-clamp-2">
                        {entry.prompt}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[9px] text-white/20">{entry.aspectRatio}</span>
                        <span className="text-[9px] text-violet-400/30">{entry.style}</span>
                        <span className="text-[9px] text-white/15 ml-auto">
                          {new Date(entry.timestamp).toLocaleTimeString('ro-RO', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <RotateCcw
                          size={10}
                          className="text-white/15 group-hover:text-violet-400/50 transition-colors"
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty history state */}
          <AnimatePresence>
            {showHistory && history.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center py-4"
              >
                <History size={16} className="text-white/10 mb-1.5" />
                <p className="text-[10px] text-white/20">No prompts generated yet</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
