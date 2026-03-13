import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  FileEdit, CheckCircle2, Clock, Send, GripVertical,
  Calendar, Hash,
  Image, Layers, Video, BookImage, Type,
} from 'lucide-react'
import { useApp } from '../../../core/context'
import { useToast } from '../../../core/ui/ToastProvider'
import { PostDetailModal } from './PostDetailModal'
import { PlatformBadge } from '../../../core/ui/PlatformBadge'
import { usePublish } from '../hooks/usePublish'
import { computeReadinessScore } from '../hooks/useReadinessScore'
import { ReadinessScoreBar } from './ReadinessScoreBadge'
import type { Post, PostStatus } from '../../../core/types'

interface KanbanPost extends Post {
  color: string
}

const COLUMNS: { id: PostStatus; label: string; icon: typeof FileEdit; color: string }[] = [
  { id: 'draft', label: 'Draft', icon: FileEdit, color: '#f59e0b' },
  { id: 'approved', label: 'Approved', icon: CheckCircle2, color: '#3b82f6' },
  { id: 'scheduled', label: 'Scheduled', icon: Clock, color: '#8b5cf6' },
  { id: 'published', label: 'Published', icon: Send, color: '#10b981' },
]

const FORMAT_ICONS: Record<string, typeof Image> = {
  'single-image': Image, carousel: Layers, reel: Video, video: Video, stories: BookImage, text: Type,
}

export function KanbanView() {
  const { data, selectedClient, updatePostStatus, updatePostCaption, getPublishConfig, getImageUrl, hasPostMedia } = useApp()
  const { toast } = useToast()
  const handlePublish = usePublish()
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overColumn, setOverColumn] = useState<PostStatus | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const filtered = selectedClient
    ? data.clients.filter(c => c.id === selectedClient)
    : data.clients

  const allPosts: KanbanPost[] = useMemo(() =>
    filtered.flatMap(c => c.posts.map(p => ({ ...p, color: c.color }))),
    [filtered]
  )

  const byStatus: Record<PostStatus, KanbanPost[]> = useMemo(() => {
    const result: Record<PostStatus, KanbanPost[]> = { draft: [], approved: [], scheduled: [], published: [] }
    for (const post of allPosts) result[post.status].push(post)
    for (const status of Object.keys(result) as PostStatus[]) {
      result[status].sort((a, b) => a.date.localeCompare(b.date))
    }
    return result
  }, [allPosts])

  const activePost = activeId ? allPosts.find(p => p.id === activeId) : null

  const getClientColor = (post: Post) => data.clients.find(cl => cl.id === post.clientId)?.color

  const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string)

  const handleDragOver = (e: DragOverEvent) => {
    const { over } = e
    if (!over) { setOverColumn(null); return }
    const id = over.id as string
    if (['draft', 'approved', 'scheduled', 'published'].includes(id)) {
      setOverColumn(id as PostStatus)
    } else {
      const p = allPosts.find(x => x.id === id)
      setOverColumn(p?.status || null)
    }
  }

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    setActiveId(null)
    setOverColumn(null)
    if (!over) return

    const postId = active.id as string
    const overId = over.id as string
    let target: PostStatus | null = null
    if (['draft', 'approved', 'scheduled', 'published'].includes(overId)) {
      target = overId as PostStatus
    } else {
      const p = allPosts.find(x => x.id === overId)
      if (p) target = p.status
    }
    if (!target) return
    const post = allPosts.find(p => p.id === postId)
    if (!post || post.status === target) return
    updatePostStatus(postId, target)
    toast('info', `Status changed to ${target}`)
  }

  return (
    <div className="h-full flex flex-col">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h2 className="text-2xl font-bold text-white">Board</h2>
        <p className="text-sm text-white/30 mt-0.5">
          {allPosts.length} posts across {filtered.length} clients
          <span className="text-white/15 ml-2">— drag cards to change status</span>
        </p>
      </motion.div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => { setActiveId(null); setOverColumn(null) }}
      >
        <div className="flex-1 grid grid-cols-4 gap-4 min-h-0">
          {COLUMNS.map((col, i) => {
            const Icon = col.icon
            const posts = byStatus[col.id]
            const isOver = overColumn === col.id
            const isValid = !!activeId && activePost?.status !== col.id

            return (
              <motion.div
                key={col.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex flex-col min-h-0"
              >
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="p-1.5 rounded-md" style={{ background: `${col.color}15` }}>
                    <Icon size={14} style={{ color: col.color }} />
                  </div>
                  <span className="text-sm font-semibold text-white/70">{col.label}</span>
                  <span className="ml-auto text-xs font-mono px-2 py-0.5 rounded-full"
                    style={{ background: `${col.color}10`, color: col.color }}>
                    {posts.length}
                  </span>
                </div>

                <DroppableColumn
                  id={col.id}
                  posts={posts}
                  isOver={isOver}
                  isValidDrop={isValid}
                  columnColor={col.color}
                  showClient={!selectedClient}
                  onPostClick={setSelectedPost}
                  getPublishConfig={getPublishConfig}
                  getImageUrl={getImageUrl}
                  hasPostMedia={hasPostMedia}
                />
              </motion.div>
            )
          })}
        </div>

        <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18,0.67,0.6,1.22)' }}>
          {activePost && <DragCard post={activePost} />}
        </DragOverlay>
      </DndContext>

      <AnimatePresence>
        {selectedPost && (
          <PostDetailModal
            post={selectedPost}
            clientColor={getClientColor(selectedPost)}
            onClose={() => setSelectedPost(null)}
            onStatusChange={(postId, status) => {
              updatePostStatus(postId, status)
              setSelectedPost(prev => prev ? { ...prev, status } : null)
              toast('info', `Status changed to ${status}`)
            }}
            onCaptionSave={(postId, caption, hashtags) => {
              updatePostCaption(postId, caption, hashtags)
              setSelectedPost(prev => prev ? { ...prev, caption, hashtags } : null)
              toast('success', 'Caption saved')
            }}
            publishConfig={getPublishConfig(selectedPost.clientId)}
            onPublish={handlePublish}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Droppable Column ─────────────────────────────────────
function DroppableColumn({ id, posts, isOver, isValidDrop, columnColor, showClient, onPostClick, getPublishConfig, getImageUrl, hasPostMedia }: {
  id: PostStatus; posts: KanbanPost[]; isOver: boolean; isValidDrop: boolean; columnColor: string
  showClient: boolean; onPostClick: (p: Post) => void; getPublishConfig: (id: string) => any; getImageUrl: (postId: string) => string | null; hasPostMedia: (postId: string) => boolean
}) {
  const { setNodeRef } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      className="flex-1 scroll-area space-y-2.5 pr-1 pb-4 rounded-xl p-2 transition-all duration-200"
      style={{
        background: isOver && isValidDrop ? `${columnColor}08` : 'rgba(255,255,255,0.01)',
        border: isOver && isValidDrop ? `2px dashed ${columnColor}40` : '2px dashed transparent',
      }}
    >
      <SortableContext items={posts.map(p => p.id)} strategy={verticalListSortingStrategy}>
        {posts.map((post, i) => (
          <DraggableCard
            key={post.id}
            post={post}
            showClient={showClient}
            onPostClick={onPostClick}
            getPublishConfig={getPublishConfig}
            imageUrl={getImageUrl(post.id)}
            hasVisual={hasPostMedia(post.id)}
          />
        ))}
      </SortableContext>
      {posts.length === 0 && (
        <div className="text-center py-8 text-xs transition-colors"
          style={{ color: isOver && isValidDrop ? `${columnColor}90` : 'rgba(255,255,255,0.1)' }}>
          {isOver && isValidDrop ? 'Drop here' : 'No posts'}
        </div>
      )}
    </div>
  )
}

// ── Draggable Card ───────────────────────────────────────
function DraggableCard({ post, showClient, onPostClick, getPublishConfig, imageUrl, hasVisual }: {
  post: KanbanPost; showClient: boolean; onPostClick: (p: Post) => void; getPublishConfig: (id: string) => any; imageUrl: string | null; hasVisual: boolean
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: post.id })
  const FormatIcon = FORMAT_ICONS[post.format] || Image
  const config = getPublishConfig(post.clientId)
  const readiness = useMemo(() => computeReadinessScore(post, hasVisual), [
    post.caption, post.hashtags, post.platform, post.format,
    post.date, post.time, post.visualDescription, post.cta, post.pillar,
    hasVisual,
  ])

  return (
    <div
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0.3 : 1 }}
      className="glass rounded-xl overflow-hidden group cursor-pointer transition-colors hover:bg-white/[0.04]"
      onClick={() => onPostClick(post)}
    >
      {imageUrl && (
        <div className="w-full h-[100px] overflow-hidden">
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-3.5">
        <div className="flex items-center gap-2 mb-2.5">
          <button {...attributes} {...listeners}
            className="p-0.5 rounded opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity touch-none"
            onClick={e => e.stopPropagation()}>
            <GripVertical size={12} className="text-white/25" />
          </button>
          <PlatformBadge platform={post.platform} />
          <span className="flex items-center gap-1 text-[10px] text-white/30"><FormatIcon size={11} /></span>
          {config && <span className="ml-auto text-[9px] text-white/15 truncate max-w-[80px]">{config.pageName}</span>}
        </div>
        {showClient && post.color && (
          <div className="flex items-center gap-1.5 mb-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: post.color }} />
            <span className="text-[10px] font-medium truncate" style={{ color: post.color }}>{post.clientName}</span>
          </div>
        )}
        <div className="flex items-center gap-2 mb-2 text-[11px] text-white/40">
          <Calendar size={10} />
          {new Date(post.date).toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric', month: 'short' })}
          {post.time && <span className="flex items-center gap-1"><Clock size={10} />{post.time}</span>}
        </div>
        <p className="text-xs text-white/60 leading-relaxed line-clamp-3 mb-2">{post.caption}</p>
        {post.hashtags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap mb-2">
            <Hash size={10} className="text-white/15" />
            {post.hashtags.slice(0, 3).map(t => <span key={t} className="text-[9px] text-accent-cyan/50">{t}</span>)}
            {post.hashtags.length > 3 && <span className="text-[9px] text-white/20">+{post.hashtags.length - 3}</span>}
          </div>
        )}
        <ReadinessScoreBar score={readiness.score} grade={readiness.grade} />
      </div>
    </div>
  )
}

// ── Drag Overlay Card ────────────────────────────────────
function DragCard({ post }: { post: KanbanPost }) {
  const FormatIcon = FORMAT_ICONS[post.format] || Image
  return (
    <div className="glass rounded-xl p-3.5 w-[280px] shadow-2xl shadow-black/60 rotate-2 scale-105"
      style={{ border: `1px solid ${post.color}40` }}>
      <div className="flex items-center gap-2 mb-2">
        <PlatformBadge platform={post.platform} />
        <span className="flex items-center gap-1 text-[10px] text-white/30"><FormatIcon size={11} /></span>
      </div>
      {post.color && (
        <div className="flex items-center gap-1.5 mb-2">
          <span className="w-2 h-2 rounded-full" style={{ background: post.color }} />
          <span className="text-[10px] font-medium" style={{ color: post.color }}>{post.clientName}</span>
        </div>
      )}
      <p className="text-xs text-white/60 leading-relaxed line-clamp-2">{post.caption}</p>
    </div>
  )
}
