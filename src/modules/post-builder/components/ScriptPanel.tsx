import { useState } from 'react'
import {
  ChevronDown, ChevronUp, FileText, Copy, Check,
  Hash, Eye, ExternalLink, Calendar,
} from 'lucide-react'
import { PlatformBadge } from '../../../core/ui/PlatformBadge'
import type { Post } from '../../../core/types'

export function ScriptPanel({ posts }: { posts: Post[] }) {
  const [expanded, setExpanded] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const selectedPost = selectedPostId ? posts.find(p => p.id === selectedPostId) : null

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  if (posts.length === 0) return null

  return (
    <div className="mb-2">
      {/* Toggle bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg glass text-xs text-white/40 hover:text-white/60 transition-colors"
      >
        <FileText size={12} />
        <span className="font-medium">Script</span>
        {selectedPost && (
          <span className="text-white/20 truncate max-w-[300px]">
            — {selectedPost.caption.slice(0, 60)}...
          </span>
        )}
        <div className="flex-1" />
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div className="mt-1 glass rounded-xl p-3 space-y-3">
          {/* Post selector */}
          <div className="flex items-center gap-2">
            <select
              value={selectedPostId || ''}
              onChange={e => setSelectedPostId(e.target.value || null)}
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-md px-2 py-1.5 text-xs text-white/60 outline-none focus:border-accent-violet/30"
            >
              <option value="">Select a post...</option>
              {posts.map(p => (
                <option key={p.id} value={p.id}>
                  {new Date(p.date).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}
                  {' — '}
                  {p.platform}
                  {' — '}
                  {p.caption.slice(0, 50)}...
                </option>
              ))}
            </select>
          </div>

          {/* Post details */}
          {selectedPost && (
            <div className="flex gap-4 text-xs">
              {/* Caption — main column */}
              <div className="flex-1 min-w-0 space-y-2">
                {/* Meta row */}
                <div className="flex items-center gap-2 text-white/30">
                  <PlatformBadge platform={selectedPost.platform} />
                  <span className="flex items-center gap-1">
                    <Calendar size={10} />
                    {new Date(selectedPost.date).toLocaleDateString('ro-RO', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </span>
                  {selectedPost.pillar && (
                    <span className="px-1.5 py-0.5 rounded bg-white/[0.04] text-[10px]">{selectedPost.pillar}</span>
                  )}
                </div>

                {/* Caption */}
                <div className="relative group">
                  <p className="text-white/60 leading-relaxed whitespace-pre-wrap max-h-[120px] overflow-y-auto scroll-area pr-6">
                    {selectedPost.caption}
                  </p>
                  <button
                    onClick={() => copyText(selectedPost.caption, 'caption')}
                    className="absolute top-0 right-0 p-1 rounded text-white/15 hover:text-white/50 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Copy caption"
                  >
                    {copied === 'caption' ? <Check size={11} /> : <Copy size={11} />}
                  </button>
                </div>
              </div>

              {/* Side info */}
              <div className="w-[180px] shrink-0 space-y-2 border-l border-white/[0.04] pl-3">
                {/* Visual description */}
                {selectedPost.visualDescription && (
                  <div>
                    <span className="flex items-center gap-1 text-[10px] text-white/20 uppercase tracking-wider mb-1">
                      <Eye size={9} /> Visual
                    </span>
                    <p className="text-white/40 text-[11px] leading-relaxed max-h-[60px] overflow-y-auto scroll-area">
                      {selectedPost.visualDescription}
                    </p>
                  </div>
                )}

                {/* CTA */}
                {selectedPost.cta && (
                  <div>
                    <span className="flex items-center gap-1 text-[10px] text-white/20 uppercase tracking-wider mb-1">
                      <ExternalLink size={9} /> CTA
                    </span>
                    <p className="text-white/40 text-[11px]">{selectedPost.cta}</p>
                  </div>
                )}

                {/* Hashtags */}
                {selectedPost.hashtags.length > 0 && (
                  <div className="relative group/hash">
                    <span className="flex items-center gap-1 text-[10px] text-white/20 uppercase tracking-wider mb-1">
                      <Hash size={9} /> Hashtags
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {selectedPost.hashtags.slice(0, 6).map(tag => (
                        <span
                          key={tag}
                          className="text-[10px] text-accent-cyan/50"
                        >
                          #{tag}
                        </span>
                      ))}
                      {selectedPost.hashtags.length > 6 && (
                        <span className="text-[10px] text-white/15">+{selectedPost.hashtags.length - 6}</span>
                      )}
                    </div>
                    <button
                      onClick={() => copyText(selectedPost.hashtags.map(t => `#${t}`).join(' '), 'hashtags')}
                      className="absolute top-0 right-0 p-0.5 rounded text-white/15 hover:text-white/50 opacity-0 group-hover/hash:opacity-100 transition-opacity"
                      title="Copy hashtags"
                    >
                      {copied === 'hashtags' ? <Check size={10} /> : <Copy size={10} />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {!selectedPost && (
            <p className="text-[11px] text-white/15 text-center py-2">
              Select a post to see its script while designing
            </p>
          )}
        </div>
      )}
    </div>
  )
}
