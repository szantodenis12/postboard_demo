import { motion } from 'framer-motion'
import { ArrowLeft, FileText, Filter } from 'lucide-react'
import { useState } from 'react'
import { PostCard } from './PostCard'
import { PlatformBadge } from '../../../core/ui/PlatformBadge'
import { useApp } from '../../../core/context'
import type { Client, Platform, Post, PostStatus, PublishConfig } from '../../../core/types'

export function ClientDetail({
  client,
  onBack,
  onStatusChange,
  onPostClick,
  getPublishConfig,
  onPublish,
}: {
  client: Client
  onBack: () => void
  onStatusChange?: (postId: string, status: PostStatus) => void
  onPostClick?: (post: Post) => void
  getPublishConfig?: (clientId: string) => PublishConfig | null
  onPublish?: (postId: string, platform: 'facebook' | 'instagram', caption: string) => Promise<{ success: boolean; error?: string }>
}) {
  const { getImageUrl, hasPostMedia } = useApp()
  const [platformFilter, setPlatformFilter] = useState<Platform | null>(null)
  const [statusFilter, setStatusFilter] = useState<PostStatus | null>(null)

  const filteredPosts = client.posts.filter(post => {
    if (platformFilter && post.platform !== platformFilter) return false
    if (statusFilter && post.status !== statusFilter) return false
    return true
  })

  const activePlatforms = (Object.entries(client.stats.platforms) as [Platform, number][])
    .filter(([, count]) => count > 0)

  const publishConfig = getPublishConfig?.(client.id)

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-6"
      >
        <button
          onClick={onBack}
          className="p-2 rounded-lg glass glass-hover transition-all"
        >
          <ArrowLeft size={16} className="text-white/60" />
        </button>

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold text-white/90 shrink-0"
            style={{
              background: `linear-gradient(135deg, ${client.color}40, ${client.color}15)`,
              border: `1px solid ${client.color}40`,
            }}
          >
            {client.displayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-white truncate">{client.displayName}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <FileText size={12} className="text-white/30" />
              <span className="text-sm text-white/40">
                {client.stats.total} posts across {client.files.length} files
              </span>
              {publishConfig && (
                <span className="text-[10px] text-status-published/50 ml-1">
                  Publishing via {publishConfig.pageName}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-4 gap-3 mb-5"
      >
        {[
          { label: 'Draft', count: client.stats.draft, color: '#f59e0b' },
          { label: 'Approved', count: client.stats.approved, color: '#3b82f6' },
          { label: 'Scheduled', count: client.stats.scheduled, color: '#8b5cf6' },
          { label: 'Published', count: client.stats.published, color: '#10b981' },
        ].map(item => (
          <button
            key={item.label}
            onClick={() => {
              const status = item.label.toLowerCase() as PostStatus
              setStatusFilter(statusFilter === status ? null : status)
            }}
            className={`glass rounded-lg p-3 text-center transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
              statusFilter === item.label.toLowerCase() ? 'ring-1' : ''
            }`}
            style={{
              borderColor: statusFilter === item.label.toLowerCase() ? `${item.color}40` : undefined,
              boxShadow: statusFilter === item.label.toLowerCase() ? `0 0 12px ${item.color}10` : undefined,
            }}
          >
            <div className="text-lg font-bold" style={{ color: item.color }}>{item.count}</div>
            <div className="text-[10px] text-white/30 uppercase tracking-wider">{item.label}</div>
          </button>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex items-center gap-2 mb-4 flex-wrap"
      >
        <Filter size={13} className="text-white/20" />
        <span className="text-[10px] text-white/25 uppercase tracking-wider mr-1">Platform:</span>
        <button
          onClick={() => setPlatformFilter(null)}
          className={`text-[11px] px-2 py-1 rounded-md transition-all ${
            platformFilter === null ? 'glass-active text-white' : 'text-white/30 hover:text-white/50'
          }`}
        >
          All
        </button>
        {activePlatforms.map(([platform]) => (
          <button
            key={platform}
            onClick={() => setPlatformFilter(platform === platformFilter ? null : platform)}
            className={`transition-all ${platformFilter === platform ? 'scale-105' : 'opacity-60 hover:opacity-100'}`}
          >
            <PlatformBadge platform={platform} />
          </button>
        ))}

        {statusFilter && (
          <>
            <span className="text-white/[0.06] mx-1">|</span>
            <button
              onClick={() => setStatusFilter(null)}
              className="text-[10px] text-white/30 hover:text-white/50 transition-colors"
            >
              Clear status filter
            </button>
          </>
        )}
      </motion.div>

      {/* Post count */}
      <div className="text-xs text-white/30 mb-3">
        Showing {filteredPosts.length} of {client.stats.total} posts
      </div>

      {/* Posts list */}
      <div className="scroll-area flex-1 space-y-3 pr-2 pb-6">
        {filteredPosts
          .sort((a, b) => a.date.localeCompare(b.date))
          .map((post, i) => (
            <PostCard
              key={post.id}
              post={post}
              index={i}
              clientColor={client.color}
              onStatusChange={onStatusChange}
              onClick={() => onPostClick?.(post)}
              publishConfig={publishConfig}
              onPublish={onPublish}
              imageUrl={getImageUrl(post.id)}
              hasVisual={hasPostMedia(post.id)}
            />
          ))}
        {filteredPosts.length === 0 && (
          <div className="text-center py-12 text-white/20 text-sm">
            No posts match the current filters
          </div>
        )}
      </div>
    </div>
  )
}
