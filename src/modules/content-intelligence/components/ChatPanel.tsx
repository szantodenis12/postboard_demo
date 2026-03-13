import { motion } from 'framer-motion'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Square, User, Bot, Copy, Check } from 'lucide-react'
import { useAIStream, type ChatMessage } from '../hooks/useAI'

export function ChatPanel({ clientId }: { clientId: string }) {
  const { stream, streaming, abort } = useAIStream()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [sourceHints, setSourceHints] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const streamingTextRef = useRef('')

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Reset chat when client changes
  useEffect(() => {
    setMessages([])
    streamingTextRef.current = ''
    setSourceHints([])
  }, [clientId])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || streaming) return

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
    }

    const assistantMsg: ChatMessage = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: '',
    }

    setMessages(prev => [...prev, userMsg, assistantMsg])
    setInput('')
    streamingTextRef.current = ''
    setSourceHints([])

    // Build message history for API
    const apiMessages = [...messages, userMsg].map(m => ({
      role: m.role,
      content: m.content,
    }))

    await stream(
      '/api/ai/chat',
      { clientId, messages: apiMessages },
      (chunk) => {
        streamingTextRef.current += chunk
        setMessages(prev => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          if (last && last.role === 'assistant') {
            updated[updated.length - 1] = { ...last, content: streamingTextRef.current }
          }
          return updated
        })
      },
      undefined,
      undefined,
      (event) => {
        if (Array.isArray(event?.sources)) setSourceHints(event.sources)
      },
    )
  }, [input, streaming, messages, clientId, stream])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const copyMessage = (msg: ChatMessage) => {
    navigator.clipboard.writeText(msg.content)
    setCopiedId(msg.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Messages */}
      <div className="flex-1 scroll-area pr-2 pb-4">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-sm">
              <Bot size={32} className="text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/25 mb-1">Ask anything about your client</p>
              <p className="text-xs text-white/15">
                Brainstorm ideas, summarize client documentation, or get content suggestions grounded in internal docs.
                For live competitor research, use Competitor Monitor.
              </p>
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {[
                  'Rezumă documentele cheie ale clientului',
                  'Sugerează 5 idei de postări pentru luna asta',
                  'Ce mesaje sunt consecvente cu brandul clientului?',
                  'Ce conținut a funcționat cel mai bine?',
                ].map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => { setInput(suggestion); inputRef.current?.focus() }}
                    className="px-3 py-1.5 rounded-lg text-[11px] text-white/30 glass glass-hover transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i === messages.length - 1 ? 0 : 0 }}
            className={`mb-3 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] group relative ${msg.role === 'user' ? 'order-1' : ''}`}>
              {/* Avatar */}
              <div className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  msg.role === 'user'
                    ? 'bg-accent-violet/15'
                    : 'bg-gradient-to-br from-accent-violet/20 to-accent-cyan/20'
                }`}>
                  {msg.role === 'user'
                    ? <User size={13} className="text-accent-violet" />
                    : <Bot size={13} className="text-accent-cyan" />
                  }
                </div>

                {/* Message bubble */}
                <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-accent-violet/10 border border-accent-violet/15 text-white/80'
                    : 'glass border border-white/[0.06] text-white/70'
                }`}>
                  <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                  {msg.role === 'assistant' && msg.content && !streaming && (
                    <button
                      onClick={() => copyMessage(msg)}
                      className="mt-2 flex items-center gap-1 text-[10px] text-white/20 hover:text-white/40 transition-colors"
                    >
                      {copiedId === msg.id ? <Check size={10} /> : <Copy size={10} />}
                      {copiedId === msg.id ? 'Copied' : 'Copy'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {streaming && (
          <div className="flex items-center gap-2 ml-10 mt-1">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan/40 animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan/40 animate-pulse" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan/40 animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="pt-3 border-t border-white/[0.04]">
        <div className="glass rounded-xl flex items-end gap-2 p-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your client, brainstorm ideas..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-white/80 placeholder:text-white/20 outline-none resize-none px-2 py-1.5 max-h-32"
            style={{ minHeight: '36px' }}
            onInput={e => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = Math.min(el.scrollHeight, 128) + 'px'
            }}
          />
          {streaming ? (
            <button
              onClick={abort}
              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors shrink-0"
            >
              <Square size={14} className="text-red-400" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="p-2 rounded-lg bg-accent-violet/15 hover:bg-accent-violet/25 disabled:opacity-20 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              <Send size={14} className="text-accent-violet" />
            </button>
          )}
        </div>
        {sourceHints.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2 px-1">
            {sourceHints.slice(0, 4).map(source => (
              <span
                key={source}
                className="px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] text-[10px] text-white/35"
              >
                {source.split('/').slice(-2).join('/')}
              </span>
            ))}
          </div>
        )}
        <p className="text-[10px] text-white/15 mt-1.5 px-1">
          Shift+Enter pentru linie nouă. AI încarcă documentele relevante la cerere.
        </p>
      </div>
    </div>
  )
}
