import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, X, Calendar, Hash,
  Image, Layers, Video, BookImage, Type,
} from 'lucide-react'
import { PlatformBadge } from './PlatformBadge'
import { StatusBadge } from './StatusBadge'
import type { Client, Post } from '../types'

const FORMAT_ICONS: Record<string, typeof Image> = {
  'single-image': Image,
  'carousel': Layers,
  'reel': Video,
  'video': Video,
  'stories': BookImage,
  'text': Type,
}

export function SearchModal({
  open,
  onClose,
  clients,
  onPostClick,
  onClientClick,
}: {
  open: boolean
  onClose: () => void
  clients: Client[]
  onPostClick: (post: Post) => void
  onClientClick: (clientId: string) => void
}) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Search logic
  const results = useMemo(() => {
    if (!query.trim()) return { posts: [], clients: [] as Client[] }

    const q = query.toLowerCase().trim()
    const words = q.split(/\s+/)

    // Search clients
    const matchedClients = clients.filter(c =>
      c.displayName.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q)
    )

    // Search posts
    const matchedPosts: (Post & { color: string })[] = []
    for (const client of clients) {
      for (const post of client.posts) {
        const searchable = [
          post.caption,
          post.clientName,
          post.platform,
          post.format,
          post.pillar || '',
          post.cta || '',
          post.visualDescription || '',
          ...post.hashtags,
        ].join(' ').toLowerCase()

        const matches = words.every(w => searchable.includes(w))
        if (matches) {
          matchedPosts.push({ ...post, color: client.color })
        }
      }
    }

    // Sort: most recent first
    matchedPosts.sort((a, b) => b.date.localeCompare(a.date))

    return { posts: matchedPosts.slice(0, 20), clients: matchedClients }
  }, [query, clients])

  const totalResults = results.clients.length + results.posts.length

  // Keyboard navigation
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, totalResults - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && totalResults > 0) {
        e.preventDefault()
        // Select the item at selectedIndex
        if (selectedIndex < results.clients.length) {
          onClientClick(results.clients[selectedIndex].id)
          onClose()
        } else {
          const postIndex = selectedIndex - results.clients.length
          if (results.posts[postIndex]) {
            onPostClick(results.posts[postIndex])
            onClose()
          }
        }
      } else if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, selectedIndex, totalResults, results, onClose, onPostClick, onClientClick])

  // Scroll selected into view
  useEffect(() => {
    if (!listRef.current) return
    const items = listRef.current.querySelectorAll('[data-result]')
    items[selectedIndex]?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  // Reset index when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-xl glass rounded-2xl overflow-hidden shadow-2xl shadow-black/60"
          style={{ border: '1px solid rgba(255,255,255,0.12)' }}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
            <Search size={18} className="text-white/30 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search posts, clients, hashtags..."
              className="flex-1 bg-transparent text-sm text-white/80 outline-none placeholder:text-white/20"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 rounded hover:bg-white/[0.06] transition-colors"
              >
                <X size={14} className="text-white/30" />
              </button>
            )}
            <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/[0.06] text-[10px] text-white/25 font-mono">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[50vh] overflow-y-auto">
            {query.trim() === '' ? (
              <div className="p-8 text-center">
                <Search size={24} className="text-white/10 mx-auto mb-3" />
                <p className="text-xs text-white/25">
                  Search by caption, hashtag, client, platform, or format
                </p>
                <p className="text-[10px] text-white/15 mt-1">
                  Use multiple words to narrow results
                </p>
              </div>
            ) : totalResults === 0 ? (
              <div className="p-8 text-center">
                <p className="text-xs text-white/30">No results for "{query}"</p>
              </div>
            ) : (
              <div className="py-2">
                {/* Client results */}
                {results.clients.length > 0 && (
                  <>
                    <div className="px-5 py-1.5">
                      <span className="text-[10px] uppercase tracking-wider text-white/20 font-medium">
                        Clients ({results.clients.length})
                      </span>
                    </div>
                    {results.clients.map((client, i) => (
                      <button
                        key={client.id}
                        data-result
                        onClick={() => { onClientClick(client.id); onClose() }}
                        className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors ${
                          selectedIndex === i ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ background: client.color }}
                        />
                        <span className="text-sm text-white/70 font-medium flex-1">{client.displayName}</span>
                        <span className="text-xs text-white/25">{client.stats.total} posts</span>
                      </button>
                    ))}
                  </>
                )}

                {/* Post results */}
                {results.posts.length > 0 && (
                  <>
                    <div className="px-5 py-1.5 mt-1">
                      <span className="text-[10px] uppercase tracking-wider text-white/20 font-medium">
                        Posts ({results.posts.length})
                      </span>
                    </div>
                    {results.posts.map((post, i) => {
                      const globalIdx = results.clients.length + i
                      const FormatIcon = FORMAT_ICONS[post.format] || Image
                      return (
                        <button
                          key={post.id}
                          data-result
                          onClick={() => { onPostClick(post); onClose() }}
                          className={`w-full px-5 py-3 text-left transition-colors ${
                            selectedIndex === globalIdx ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ background: (post as any).color }}
                            />
                            <span className="text-[10px] font-medium" style={{ color: (post as any).color }}>
                              {post.clientName}
                            </span>
                            <PlatformBadge platform={post.platform} />
                            <span className="text-[10px] text-white/20 flex items-center gap-0.5">
                              <FormatIcon size={9} />
                            </span>
                            <span className="ml-auto flex items-center gap-2">
                              <span className="text-[10px] text-white/25 flex items-center gap-1">
                                <Calendar size={9} />
                                {new Date(post.date).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}
                              </span>
                              <StatusBadge status={post.status} />
                            </span>
                          </div>
                          <p className="text-xs text-white/50 line-clamp-2 leading-relaxed">
                            {highlightMatch(post.caption, query)}
                          </p>
                          {post.hashtags.length > 0 && (
                            <div className="flex items-center gap-1 mt-1.5">
                              <Hash size={9} className="text-white/15" />
                              {post.hashtags.slice(0, 4).map(tag => (
                                <span key={tag} className="text-[9px] text-accent-cyan/40">
                                  {tag}
                                </span>
                              ))}
                              {post.hashtags.length > 4 && (
                                <span className="text-[9px] text-white/15">+{post.hashtags.length - 4}</span>
                              )}
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer hints */}
          {totalResults > 0 && (
            <div className="px-5 py-2.5 border-t border-white/[0.04] flex items-center gap-4 text-[10px] text-white/20">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-white/[0.06] font-mono">↑↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-white/[0.06] font-mono">↵</kbd>
                open
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-white/[0.06] font-mono">esc</kbd>
                close
              </span>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Highlight matching text fragments
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text

  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  // Build a regex that matches any of the search words
  const escaped = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi')

  const parts = text.split(regex)
  return parts.map((part, i) => {
    const isMatch = words.some(w => part.toLowerCase() === w)
    return isMatch ? (
      <span key={i} className="text-accent-cyan/80 font-medium">{part}</span>
    ) : (
      <span key={i}>{part}</span>
    )
  })
}
