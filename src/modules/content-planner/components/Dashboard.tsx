import { motion } from 'framer-motion'
import { useState, useCallback, useEffect } from 'react'
import { TrendingUp, Rocket, Trash2, Plus } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import { useApp } from '../../../core/context'
import { StatsBar } from '../../../core/ui/StatsBar'
import { AnalyticsSyncStatusCard } from '../../../core/ui/AnalyticsSyncStatusCard'
import { PlatformBadge } from '../../../core/ui/PlatformBadge'
import { StatusBadge } from '../../../core/ui/StatusBadge'
import { ClientCard } from './ClientCard'
import { ClientDetail } from './ClientDetail'
import { PostDetailModal } from './PostDetailModal'
import { PillarBalance } from './PillarBalance'
import { PostFormModal } from '../../../core/ui/PostFormModal'
import { usePublish } from '../hooks/usePublish'
import { useHealthScores } from '../hooks/useHealthScores'
import type { Post } from '../../../core/types'

export function Dashboard() {
  const { data, selectedClient, setSelectedClient, updatePostStatus, updatePostCaption, getPublishConfig, deletePost, getImageUrl, createPost } = useApp()
  const handlePublish = usePublish()
  const { getScore } = useHealthScores()
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const client = selectedClient
    ? data.clients.find(c => c.id === selectedClient)
    : null

  const getClientColor = useCallback((post: Post) => {
    const c = data.clients.find(cl => cl.id === post.clientId)
    return c?.color
  }, [data.clients])

  // If a client is selected, show detail view
  if (client) {
    return (
      <>
        <ClientDetail
          client={client}
          onBack={() => setSelectedClient(null)}
          onStatusChange={updatePostStatus}
          onPostClick={setSelectedPost}
          getPublishConfig={getPublishConfig}
          onPublish={handlePublish}
        />
        <AnimatePresence>
          {selectedPost && (
            <PostDetailModal
              post={selectedPost}
              clientColor={getClientColor(selectedPost)}
              onClose={() => setSelectedPost(null)}
              onStatusChange={(postId, status) => {
                updatePostStatus(postId, status)
                setSelectedPost(prev => prev ? { ...prev, status } : null)
              }}
              onCaptionSave={(postId, caption, hashtags) => {
                updatePostCaption(postId, caption, hashtags)
                setSelectedPost(prev => prev ? { ...prev, caption, hashtags } : null)
              }}
              publishConfig={getPublishConfig(selectedPost.clientId)}
              onPublish={handlePublish}
            />
          )}
        </AnimatePresence>
      </>
    )
  }

  // Get all posts with client info
  const allPosts = data.clients.flatMap(c =>
    c.posts.map(p => ({ ...p, color: c.color }))
  ).sort((a, b) => a.date.localeCompare(b.date))

  const now = new Date().toISOString().split('T')[0]
  const upcoming = allPosts.filter(p => p.date >= now).slice(0, 5)

  // Posts ready to publish (approved or scheduled, with a Meta page mapped)
  const readyToPublish = allPosts.filter(p => {
    if (p.status !== 'approved' && p.status !== 'scheduled') return false
    return !!getPublishConfig(p.clientId)
  }).slice(0, 6)

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Dashboard</h2>
            <p className="text-sm text-white/30">
              Manage social media content across all your clients
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent-violet to-accent-cyan hover:shadow-lg hover:shadow-accent-cyan/20 text-white rounded-xl font-bold transition-all active:scale-95"
          >
            <Plus size={18} />
            <span>New Post</span>
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="mb-6">
        <StatsBar stats={data.totals} />
      </div>

      <div className="mb-6">
        <AnalyticsSyncStatusCard />
      </div>

      {/* Content area */}
      <div className="flex-1 scroll-area pr-2 pb-6">
        {/* Ready to Publish */}
        {readyToPublish.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <Rocket size={16} className="text-accent-orange" />
              <h3 className="text-sm font-semibold text-white/70">Ready to Publish</h3>
              <span className="text-xs text-white/20">({readyToPublish.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {readyToPublish.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25 + i * 0.04 }}
                  onClick={() => setSelectedPost(post)}
                  className="glass glass-hover rounded-xl p-4 cursor-pointer group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: (post as any).color }}
                    />
                    <span className="text-[11px] font-medium truncate" style={{ color: (post as any).color }}>
                      {post.clientName}
                    </span>
                    <div className="ml-auto flex items-center gap-1.5">
                      <PlatformBadge platform={post.platform} />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm('Sigur vrei să ștergi această postare?')) {
                            deletePost(post.id)
                          }
                        }}
                        className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400/50 hover:text-red-400/80 transition-all opacity-0 group-hover:opacity-100"
                        title="Șterge"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-white/60 line-clamp-2 mb-2">{post.caption.slice(0, 100)}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/30">
                      {new Date(post.date).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}
                    </span>
                    <StatusBadge status={post.status} />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Upcoming timeline */}
        {upcoming.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-accent-cyan" />
              <h3 className="text-sm font-semibold text-white/70">Upcoming Posts</h3>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {upcoming.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.35 + i * 0.05 }}
                  onClick={() => setSelectedPost(post)}
                  className="glass glass-hover rounded-xl p-4 min-w-[220px] max-w-[260px] cursor-pointer shrink-0"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: (post as any).color }}
                    />
                    <span className="text-[11px] font-medium" style={{ color: (post as any).color }}>
                      {post.clientName}
                    </span>
                    <div className="ml-auto flex items-center gap-1.5">
                      <PlatformBadge platform={post.platform} />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm('Sigur vrei să ștergi această postare?')) {
                            deletePost(post.id)
                          }
                        }}
                        className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400/50 hover:text-red-400/80 transition-all opacity-0 group-hover:opacity-100"
                        title="Șterge"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                  <div className="text-[11px] text-white/40 mb-1.5">
                    {new Date(post.date).toLocaleDateString('ro-RO', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                    {post.time ? ` ${post.time}` : ''}
                  </div>
                  <p className="text-xs text-white/60 line-clamp-2">
                    {post.caption.slice(0, 80)}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Content Pillar Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-8"
        >
          <PillarBalance />
        </motion.div>

        {/* Client grid */}
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-semibold text-white/70">All Clients</h3>
          <span className="text-xs text-white/20">({data.clients.length})</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.clients.map((client, i) => (
            <ClientCard
              key={client.id}
              client={client}
              index={i}
              onClick={() => setSelectedClient(client.id)}
              healthScore={getScore(client.id)}
            />
          ))}
        </div>

        {data.clients.length === 0 && (
          <div className="text-center py-20">
            <div className="text-white/15 text-lg mb-2">No content found</div>
            <div className="text-white/10 text-sm">
              Add editorial calendars or batch files to your CLIENTI/ folders
            </div>
          </div>
        )}
      </div>

      {/* Post Detail Modal */}
      <AnimatePresence>
        {selectedPost && !client && (
          <PostDetailModal
            post={selectedPost}
            clientColor={getClientColor(selectedPost)}
            onClose={() => setSelectedPost(null)}
            onStatusChange={(postId, status) => {
              updatePostStatus(postId, status)
              setSelectedPost(prev => prev ? { ...prev, status } : null)
            }}
            onCaptionSave={(postId, caption, hashtags) => {
              updatePostCaption(postId, caption, hashtags)
              setSelectedPost(prev => prev ? { ...prev, caption, hashtags } : null)
            }}
            publishConfig={getPublishConfig(selectedPost.clientId)}
            onPublish={handlePublish}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreateModal && (
          <PostFormModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSave={createPost}
            clients={data.clients}
            selectedClientId={selectedClient || undefined}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
