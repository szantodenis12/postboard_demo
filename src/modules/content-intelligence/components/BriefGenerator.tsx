import { motion } from 'framer-motion'
import { useState, useRef, useCallback } from 'react'
import { FileText, Loader2, Copy, Check, RotateCcw } from 'lucide-react'
import { useAIStream } from '../hooks/useAI'

const PLATFORMS = ['facebook', 'instagram', 'linkedin', 'tiktok', 'stories']
const FORMATS = ['single-image', 'carousel', 'reel', 'video', 'stories', 'text']

export function BriefGenerator({ clientId }: { clientId: string }) {
  const { stream, streaming, abort } = useAIStream()
  const [platform, setPlatform] = useState('instagram')
  const [format, setFormat] = useState('single-image')
  const [topic, setTopic] = useState('')
  const [notes, setNotes] = useState('')
  const [result, setResult] = useState('')
  const [copied, setCopied] = useState(false)
  const resultRef = useRef('')
  const resultEndRef = useRef<HTMLDivElement>(null)

  const generate = useCallback(async () => {
    if (!topic.trim() || streaming) return

    setResult('')
    resultRef.current = ''

    await stream(
      '/api/ai/brief',
      { clientId, platform, format, topic: topic.trim(), notes: notes.trim() || undefined },
      (chunk) => {
        resultRef.current += chunk
        setResult(resultRef.current)
        resultEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      },
    )
  }, [clientId, platform, format, topic, notes, streaming, stream])

  const copyResult = () => {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const reset = () => {
    abort()
    setResult('')
    setTopic('')
    setNotes('')
    resultRef.current = ''
  }

  return (
    <div className="h-full flex gap-4">
      {/* Form */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-[320px] shrink-0 flex flex-col"
      >
        <div className="glass rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <FileText size={16} className="text-accent-violet" />
            <h3 className="text-sm font-semibold text-white/70">Content Brief</h3>
          </div>

          {/* Platform */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/25 font-semibold block mb-1.5">
              Platform
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PLATFORMS.map(p => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                    ${platform === p
                      ? 'glass-active text-white'
                      : 'text-white/30 hover:text-white/50 hover:bg-white/[0.03]'
                    }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Format */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/25 font-semibold block mb-1.5">
              Format
            </label>
            <div className="flex flex-wrap gap-1.5">
              {FORMATS.map(f => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                    ${format === f
                      ? 'glass-active text-white'
                      : 'text-white/30 hover:text-white/50 hover:bg-white/[0.03]'
                    }`}
                >
                  {f.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Topic */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/25 font-semibold block mb-1.5">
              Topic / Theme
            </label>
            <input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g., Promoție de primăvară, Beneficii produs..."
              className="w-full px-3 py-2 rounded-lg glass text-sm text-white/80 placeholder:text-white/20 outline-none border border-white/[0.06] focus:border-accent-violet/30 transition-colors"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/25 font-semibold block mb-1.5">
              Additional Notes <span className="text-white/15">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Target audience, specific angle, mood..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg glass text-sm text-white/80 placeholder:text-white/20 outline-none border border-white/[0.06] focus:border-accent-violet/30 transition-colors resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={generate}
              disabled={!topic.trim() || streaming}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent-violet/15 hover:bg-accent-violet/25 text-accent-violet text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              {streaming ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Brief'
              )}
            </button>
            {result && (
              <button
                onClick={reset}
                className="p-2.5 rounded-lg glass glass-hover transition-all"
                title="Reset"
              >
                <RotateCcw size={14} className="text-white/40" />
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Result */}
      <div className="flex-1 min-w-0 flex flex-col">
        {!result && !streaming ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText size={32} className="text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/25">Fill in the form and generate a content brief</p>
              <p className="text-xs text-white/15 mt-1">
                The AI loads only the relevant client documents for this task
              </p>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col min-h-0"
          >
            {/* Result header */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-white/30">
                Brief — {platform} / {format.replace('-', ' ')}
              </span>
              {result && !streaming && (
                <button
                  onClick={copyResult}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-white/30 hover:text-white/50 glass glass-hover transition-all"
                >
                  {copied ? <Check size={11} /> : <Copy size={11} />}
                  {copied ? 'Copied' : 'Copy all'}
                </button>
              )}
            </div>

            {/* Result content */}
            <div className="flex-1 scroll-area glass rounded-xl p-5">
              <div className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap break-words">
                {result}
              </div>
              {streaming && (
                <span className="inline-block w-2 h-4 bg-accent-violet/50 animate-pulse ml-0.5" />
              )}
              <div ref={resultEndRef} />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
