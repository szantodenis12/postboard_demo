import { motion } from 'framer-motion'
import { useState, useRef, useCallback } from 'react'
import { Sparkles, Hash, Loader2, Copy, Check, RotateCcw } from 'lucide-react'
import { useAIStream } from '../hooks/useAI'

const PLATFORMS = ['facebook', 'instagram', 'linkedin', 'tiktok']
const TONES = [
  { id: '', label: 'Auto (brand voice)' },
  { id: 'playful', label: 'Playful' },
  { id: 'professional', label: 'Professional' },
  { id: 'urgent', label: 'Urgent' },
  { id: 'inspirational', label: 'Inspirational' },
]

type Mode = 'rewrite' | 'hashtags'

export function CaptionLab({ clientId }: { clientId: string }) {
  const { stream, streaming, abort } = useAIStream()
  const [mode, setMode] = useState<Mode>('rewrite')
  const [caption, setCaption] = useState('')
  const [platform, setPlatform] = useState('instagram')
  const [tone, setTone] = useState('')
  const [hashtagTopic, setHashtagTopic] = useState('')
  const [result, setResult] = useState('')
  const [copied, setCopied] = useState(false)
  const resultRef = useRef('')
  const resultEndRef = useRef<HTMLDivElement>(null)

  const handleRewrite = useCallback(async () => {
    if (!caption.trim() || streaming) return
    setResult('')
    resultRef.current = ''

    await stream(
      '/api/ai/rewrite',
      { clientId, caption: caption.trim(), platform, tone: tone || undefined },
      (chunk) => {
        resultRef.current += chunk
        setResult(resultRef.current)
        resultEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      },
    )
  }, [clientId, caption, platform, tone, streaming, stream])

  const handleHashtags = useCallback(async () => {
    if (!hashtagTopic.trim() || streaming) return
    setResult('')
    resultRef.current = ''

    await stream(
      '/api/ai/hashtags',
      { clientId, topic: hashtagTopic.trim(), platform },
      (chunk) => {
        resultRef.current += chunk
        setResult(resultRef.current)
        resultEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      },
    )
  }, [clientId, hashtagTopic, platform, streaming, stream])

  const copyResult = () => {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const reset = () => {
    abort()
    setResult('')
    resultRef.current = ''
  }

  return (
    <div className="h-full flex gap-4">
      {/* Form */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-[320px] shrink-0 flex flex-col gap-4"
      >
        {/* Mode toggle */}
        <div className="flex gap-1 glass rounded-xl p-1">
          <button
            onClick={() => { setMode('rewrite'); reset() }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all
              ${mode === 'rewrite' ? 'glass-active text-white' : 'text-white/30 hover:text-white/50'}`}
          >
            <Sparkles size={13} />
            Caption Rewriter
          </button>
          <button
            onClick={() => { setMode('hashtags'); reset() }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all
              ${mode === 'hashtags' ? 'glass-active text-white' : 'text-white/30 hover:text-white/50'}`}
          >
            <Hash size={13} />
            Hashtags
          </button>
        </div>

        {/* Platform selector (shared) */}
        <div className="glass rounded-xl p-5 space-y-4">
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

          {mode === 'rewrite' ? (
            <>
              {/* Caption input */}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-white/25 font-semibold block mb-1.5">
                  Original Caption
                </label>
                <textarea
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="Paste your draft caption here..."
                  rows={5}
                  className="w-full px-3 py-2 rounded-lg glass text-sm text-white/80 placeholder:text-white/20 outline-none border border-white/[0.06] focus:border-accent-violet/30 transition-colors resize-none"
                />
              </div>

              {/* Tone */}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-white/25 font-semibold block mb-1.5">
                  Tone
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {TONES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTone(t.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                        ${tone === t.id
                          ? 'glass-active text-white'
                          : 'text-white/30 hover:text-white/50 hover:bg-white/[0.03]'
                        }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate */}
              <button
                onClick={handleRewrite}
                disabled={!caption.trim() || streaming}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent-violet/15 hover:bg-accent-violet/25 text-accent-violet text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                {streaming ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Rewriting...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    Rewrite Caption
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              {/* Hashtag topic */}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-white/25 font-semibold block mb-1.5">
                  Topic / Post Subject
                </label>
                <textarea
                  value={hashtagTopic}
                  onChange={e => setHashtagTopic(e.target.value)}
                  placeholder="Describe the post topic for hashtag suggestions..."
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg glass text-sm text-white/80 placeholder:text-white/20 outline-none border border-white/[0.06] focus:border-accent-violet/30 transition-colors resize-none"
                />
              </div>

              {/* Generate */}
              <button
                onClick={handleHashtags}
                disabled={!hashtagTopic.trim() || streaming}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent-cyan/15 hover:bg-accent-cyan/25 text-accent-cyan text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                {streaming ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Suggesting...
                  </>
                ) : (
                  <>
                    <Hash size={14} />
                    Suggest Hashtags
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </motion.div>

      {/* Result */}
      <div className="flex-1 min-w-0 flex flex-col">
        {!result && !streaming ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              {mode === 'rewrite' ? (
                <>
                  <Sparkles size={32} className="text-white/10 mx-auto mb-3" />
                  <p className="text-sm text-white/25">Paste a caption and get 3 variants</p>
                  <p className="text-xs text-white/15 mt-1">
                    Each variant matches your client's brand voice
                  </p>
                </>
              ) : (
                <>
                  <Hash size={32} className="text-white/10 mx-auto mb-3" />
                  <p className="text-sm text-white/25">Describe a topic for hashtag suggestions</p>
                  <p className="text-xs text-white/15 mt-1">
                    Get categorized hashtags grounded in the client context and Romanian market
                  </p>
                </>
              )}
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
                {mode === 'rewrite' ? 'Caption Variants' : 'Hashtag Suggestions'} — {platform}
              </span>
              <div className="flex items-center gap-2">
                {result && !streaming && (
                  <button
                    onClick={copyResult}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-white/30 hover:text-white/50 glass glass-hover transition-all"
                  >
                    {copied ? <Check size={11} /> : <Copy size={11} />}
                    {copied ? 'Copied' : 'Copy all'}
                  </button>
                )}
                <button
                  onClick={reset}
                  className="p-1 rounded-lg glass glass-hover transition-all"
                  title="Reset"
                >
                  <RotateCcw size={12} className="text-white/30" />
                </button>
              </div>
            </div>

            {/* Result content */}
            <div className="flex-1 scroll-area glass rounded-xl p-5">
              <div className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap break-words">
                {result}
              </div>
              {streaming && (
                <span className="inline-block w-2 h-4 bg-accent-cyan/50 animate-pulse ml-0.5" />
              )}
              <div ref={resultEndRef} />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
