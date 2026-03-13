import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowUpDown, ArrowUp, ArrowDown, BarChart3, ExternalLink,
  Facebook, Instagram, Heart, MessageCircle, Share2, Filter,
  AlertCircle,
} from 'lucide-react'
import { useApp } from '../../../core/context'
import { useAnalytics, type PostMetric, type ClientAnalytics } from '../hooks/useAnalytics'

type SortKey = 'date' | 'likes' | 'comments' | 'shares' | 'engagement'
type SortDir = 'asc' | 'desc'
type PlatformFilter = 'all' | 'facebook' | 'instagram'

export function PostPerformance() {
  const { data, selectedClient } = useApp()
  const { analytics, loading, loadAnalytics } = useAnalytics()

  const [sortKey, setSortKey] = useState<SortKey>('engagement')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all')

  useEffect(() => {
    if (selectedClient) loadAnalytics(selectedClient)
  }, [selectedClient, loadAnalytics])

  const client = selectedClient ? data.clients.find(c => c.id === selectedClient) : null

  const allPosts = useMemo(() => {
    if (!analytics) return []
    return [...analytics.facebook.posts, ...analytics.instagram.posts]
  }, [analytics])

  const filteredPosts = useMemo(() => {
    let posts = allPosts
    if (platformFilter !== 'all') {
      posts = posts.filter(p => p.platform === platformFilter)
    }
    posts.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'date':
          cmp = new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
          break
        case 'likes': cmp = a.likes - b.likes; break
        case 'comments': cmp = a.comments - b.comments; break
        case 'shares': cmp = a.shares - b.shares; break
        case 'engagement': cmp = a.engagement - b.engagement; break
      }
      return sortDir === 'desc' ? -cmp : cmp
    })
    return posts
  }, [allPosts, platformFilter, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column) return <ArrowUpDown size={11} className="text-white/15" />
    return sortDir === 'desc'
      ? <ArrowDown size={11} className="text-accent-violet" />
      : <ArrowUp size={11} className="text-accent-violet" />
  }

  if (!selectedClient) {
    return (
      <div className="h-full flex flex-col">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-1">Post Performance</h2>
          <p className="text-sm text-white/30">Select a client from the sidebar</p>
        </motion.div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <BarChart3 size={48} className="text-white/10 mx-auto mb-4" />
            <p className="text-white/20 text-xs">Choose a client to see post metrics</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-start justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Post Performance</h2>
          <p className="text-sm text-white/30">
            {client?.displayName} — {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''}
            {analytics?.period ? ` (${analytics.period})` : ''}
          </p>
        </div>

        {/* Platform filter */}
        <div className="flex items-center gap-1 glass rounded-lg p-1">
          {(['all', 'facebook', 'instagram'] as const).map(f => (
            <button
              key={f}
              onClick={() => setPlatformFilter(f)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                platformFilter === f ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'
              }`}
            >
              {f === 'all' ? <Filter size={12} /> : f === 'facebook' ? <Facebook size={12} /> : <Instagram size={12} />}
              {f === 'all' ? 'All' : f === 'facebook' ? 'FB' : 'IG'}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Table */}
      <div className="flex-1 scroll-area pb-6">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="glass rounded-lg h-14 shimmer" />
            ))}
          </div>
        ) : !analytics ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="text-center">
              <AlertCircle size={40} className="text-white/10 mx-auto mb-3" />
              <p className="text-white/30 text-sm mb-1">No analytics data</p>
              <p className="text-white/15 text-xs">Go to the Analytics tab and fetch data first.</p>
            </div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <p className="text-white/20 text-sm">No posts found for this filter</p>
          </div>
        ) : (
          <div>
            {/* Table header */}
            <div className="grid grid-cols-[1fr_80px_80px_80px_90px] gap-2 px-4 py-2 text-[10px] uppercase tracking-wider text-white/25 font-semibold mb-1">
              <button onClick={() => toggleSort('date')} className="flex items-center gap-1 text-left hover:text-white/50 transition-colors">
                Post <SortIcon column="date" />
              </button>
              <button onClick={() => toggleSort('likes')} className="flex items-center gap-1 justify-end hover:text-white/50 transition-colors">
                Likes <SortIcon column="likes" />
              </button>
              <button onClick={() => toggleSort('comments')} className="flex items-center gap-1 justify-end hover:text-white/50 transition-colors">
                Comments <SortIcon column="comments" />
              </button>
              <button onClick={() => toggleSort('shares')} className="flex items-center gap-1 justify-end hover:text-white/50 transition-colors">
                Shares <SortIcon column="shares" />
              </button>
              <button onClick={() => toggleSort('engagement')} className="flex items-center gap-1 justify-end hover:text-white/50 transition-colors">
                Engagement <SortIcon column="engagement" />
              </button>
            </div>

            {/* Rows */}
            <div className="space-y-1">
              {filteredPosts.map((post, i) => (
                <PostRow key={post.metaPostId} post={post} index={i} />
              ))}
            </div>

            {/* Summary */}
            <div className="grid grid-cols-[1fr_80px_80px_80px_90px] gap-2 px-4 py-3 mt-3 border-t border-white/[0.06]">
              <div className="text-xs font-semibold text-white/50">
                Total ({filteredPosts.length} posts)
              </div>
              <div className="text-xs font-bold text-pink-400/70 text-right tabular-nums">
                {filteredPosts.reduce((s, p) => s + p.likes, 0).toLocaleString('ro-RO')}
              </div>
              <div className="text-xs font-bold text-cyan-400/70 text-right tabular-nums">
                {filteredPosts.reduce((s, p) => s + p.comments, 0).toLocaleString('ro-RO')}
              </div>
              <div className="text-xs font-bold text-emerald-400/70 text-right tabular-nums">
                {filteredPosts.reduce((s, p) => s + p.shares, 0).toLocaleString('ro-RO')}
              </div>
              <div className="text-xs font-bold text-accent-violet text-right tabular-nums">
                {filteredPosts.reduce((s, p) => s + p.engagement, 0).toLocaleString('ro-RO')}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function PostRow({ post, index }: { post: PostMetric; index: number }) {
  const isFB = post.platform === 'facebook'
  const PlatformIcon = isFB ? Facebook : Instagram
  const platformColor = isFB ? '#1877F2' : '#E4405F'

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.015 }}
      className="grid grid-cols-[1fr_80px_80px_80px_90px] gap-2 glass glass-hover rounded-lg px-4 py-3 items-center group"
    >
      {/* Post info */}
      <div className="flex items-center gap-3 min-w-0">
        {post.imageUrl && (
          <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-white/5">
            <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs text-white/60 truncate">{post.message || '(no caption)'}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <PlatformIcon size={10} style={{ color: platformColor }} />
            <span className="text-[10px] text-white/25">
              {new Date(post.publishedAt).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            {post.permalink && (
              <a
                href={post.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden group-hover:flex items-center gap-0.5 text-[10px] text-white/20 hover:text-white/50 transition-colors"
              >
                <ExternalLink size={9} />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Likes */}
      <div className="text-right">
        <span className="text-xs font-semibold text-pink-400/80 tabular-nums">{post.likes.toLocaleString('ro-RO')}</span>
      </div>

      {/* Comments */}
      <div className="text-right">
        <span className="text-xs font-semibold text-cyan-400/80 tabular-nums">{post.comments.toLocaleString('ro-RO')}</span>
      </div>

      {/* Shares */}
      <div className="text-right">
        <span className="text-xs font-semibold text-emerald-400/80 tabular-nums">{post.shares.toLocaleString('ro-RO')}</span>
      </div>

      {/* Engagement */}
      <div className="text-right">
        <span className="text-xs font-bold text-accent-violet tabular-nums">{post.engagement.toLocaleString('ro-RO')}</span>
      </div>
    </motion.div>
  )
}
