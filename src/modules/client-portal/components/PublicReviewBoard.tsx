import { useState, useEffect, useCallback, useMemo } from 'react'
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
  CheckCircle2, Clock, Send, GripVertical,
  Calendar, Hash, Image, Layers, Video, BookImage, Type,
  MessageSquare, Layout, LogOut, ChevronRight, X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { PostDetailModal } from '../../content-planner/components/PostDetailModal'
import { PlatformBadge } from '../../../core/ui/PlatformBadge'
import type { Post, PostStatus } from '../../../core/types'
import { LoadingScreen } from '../../../core/ui/LoadingScreen'

// Lanes for the public review board
const REVIEW_LANES: { id: PostStatus; label: string; color: string; icon: any }[] = [
  { id: 'draft', label: 'To Review', color: '#f59e0b', icon: Clock },
  { id: 'approved', label: 'Approved', color: '#10b981', icon: CheckCircle2 },
]

// Mapping for internal status -> UI lanes
// For simplicity, we'll treat any non-approved as 'To Review' for the client
// unless we want to support 'Changes Requested' as a status too.
// Let's check the PostStatus type.
// type PostStatus = 'draft' | 'approved' | 'scheduled' | 'published'

const FORMAT_ICONS: Record<string, any> = {
  'single-image': Image, carousel: Layers, reel: Video, video: Video, stories: BookImage, text: Type,
}

export function PublicReviewBoard() {
  const [token, setToken] = useState<string | null>(null)
  const [data, setData] = useState<{ client: any; posts: Post[]; whiteLabel: any } | null>(null)


  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overColumn, setOverColumn] = useState<PostStatus | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  useEffect(() => {
    const path = window.location.pathname
    const match = path.match(/\/review\/([^\/]+)/)
    if (match) {
      setToken(match[1])
      fetchData(match[1])
    } else {
      setError('Invalid review link')
      setLoading(false)
    }
  }, [])

  const fetchData = async (tk: string) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/portal/${tk}/data`)
      if (!res.ok) throw new Error('Link expired or invalid')
      const json = await res.json()
      // Map API structure to component state
      setData({
        client: json.client,
        posts: json.client.posts,
        whiteLabel: json.whiteLabel
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (postId: string, status: PostStatus) => {
    if (!token) return
    try {
      // Optimistic update
      setData(prev => {
        if (!prev) return prev
        return {
          ...prev,
          posts: prev.posts.map(p => p.id === postId ? { ...p, status } : p)
        }
      })

      const res = await fetch(`/api/review/${token}/posts/${postId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: status === 'approved' ? 'approved' : 'changes-requested',
          comment: status === 'approved' ? 'Approved via review board' : 'Moved back to review'
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        const errorText = JSON.stringify(errorData)
        console.error('[PublicReviewBoard] Status update failed:', res.status, errorText)
        throw new Error(`Failed to update status: ${res.status} ${errorText}`)
      }

    } catch (err: any) {
      console.error('[PublicReviewBoard] Error during status update:', err)
      alert(err.message)
      if (token) fetchData(token) // Rollback
    }
  }

  const postsByStatus = useMemo(() => {
    const result: Record<string, Post[]> = { draft: [], approved: [] }
    if (!data || !data.posts) return result
    for (const p of data.posts) {
      if (p.status === 'approved') result.approved.push(p)
      else result.draft.push(p)
    }
    return result
  }, [data])

  const activePost = activeId ? data?.posts.find(p => p.id === activeId) : null

  const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string)

  const handleDragOver = (e: DragOverEvent) => {
    const { over } = e
    if (!over) { setOverColumn(null); return }
    const id = over.id as string
    if (['draft', 'approved'].includes(id)) {
      setOverColumn(id as PostStatus)
    } else {
      const p = data?.posts.find(x => x.id === id)
      setOverColumn(p?.status === 'approved' ? 'approved' : 'draft')
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
    
    if (overId === 'draft' || overId === 'approved') {
      target = overId as PostStatus
    } else {
      const p = data?.posts.find(x => x.id === overId)
      if (p) target = p.status === 'approved' ? 'approved' : 'draft'
    }

    if (!target) return
    const post = data?.posts.find(p => p.id === postId)
    const currentStatus = post?.status === 'approved' ? 'approved' : 'draft'
    
    if (!post || currentStatus === target) return
    updateStatus(postId, target)
  }

  if (loading) return <LoadingScreen />
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-[#07070e] p-6 text-center">
      <div className="glass p-8 rounded-3xl border border-red-500/20 max-w-md">
        <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Review Link Error</h2>
        <p className="text-white/40 mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 transition-colors">
          Retry
        </button>
      </div>
    </div>
  )
  if (!data) return null

  const { client, whiteLabel } = data

  return (
    <div className="h-screen flex flex-col bg-[#07070e] text-white selection:bg-accent-violet/30 overflow-hidden">

      {/* Header */}
      <header className="h-20 flex items-center justify-between px-8 border-b border-white/[0.04] sticky top-0 bg-[#07070e]/80 backdrop-blur-xl z-30">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-violet to-accent-cyan flex items-center justify-center overflow-hidden">
            {whiteLabel?.agencyLogo ? <img src={whiteLabel.agencyLogo} alt="" className="w-full h-full object-contain" /> : <Layout size={20} className="text-white" />}
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">PostBoard Review</h1>
            <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-medium">{client.displayName} — {whiteLabel?.agencyName || 'Epic Digital Hub'}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.04]">
             <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: client.color || '#7c3aed' }} />
             <span className="text-xs font-medium text-white/50">Active Session</span>
           </div>
        </div>
      </header>

      {/* Main Board */}
      <main className="flex-1 p-8 overflow-hidden flex flex-col min-h-0">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white">Post Approval Board</h2>
            <p className="text-white/30 mt-1 flex items-center gap-2">
              Drag posts to the Approved column to schedule them for publishing
              <ChevronRight size={14} className="text-white/10" />
            </p>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={() => { setActiveId(null); setOverColumn(null) }}
        >
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch min-h-0">


            {REVIEW_LANES.map(lane => (
              <div key={lane.id} className="flex flex-col h-full min-h-0">
                <div className="flex items-center gap-3 mb-4 px-2">
                  <div className="p-2 rounded-xl" style={{ background: `${lane.color}15` }}>
                    <lane.icon size={16} style={{ color: lane.color }} />
                  </div>
                  <span className="font-bold text-white/80">{lane.label}</span>
                  <span className="ml-auto text-xs font-mono font-bold px-3 py-1 rounded-full bg-white/[0.04] text-white/40">
                    {postsByStatus[lane.id]?.length || 0}
                  </span>
                </div>

                <DroppableLane
                  id={lane.id}
                  posts={postsByStatus[lane.id] || []}
                  isOver={overColumn === lane.id}
                  isValidDrop={!!activeId && (activePost?.status === 'approved' ? 'approved' : 'draft') !== lane.id}
                  color={lane.color}
                  onPostClick={setSelectedPost}
                />
              </div>
            ))}
          </div>

          <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18,0.67,0.6,1.22)' }}>
            {activePost && <ReviewDragCard post={activePost} clientColor={client.color} />}
          </DragOverlay>
        </DndContext>
      </main>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedPost && (
          <PostDetailModal
            post={selectedPost}
            clientColor={client.color}
            onClose={() => setSelectedPost(null)}
            onStatusChange={(postId, status) => {
              updateStatus(postId, status)
              setSelectedPost(prev => prev ? { ...prev, status } : null)
            }}
            onCaptionSave={undefined} // Read-only for client
            publishConfig={undefined} // Not needed for client
            onPublish={undefined}   // Not needed for client
            isPublicReview={true}   // We'll need to update PostDetailModal to handle this prop
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function DroppableLane({ id, posts, isOver, isValidDrop, color, onPostClick }: { id: PostStatus; posts: Post[]; isOver: boolean; isValidDrop: boolean; color: string; onPostClick: any }) {
  const { setNodeRef } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      className="flex-1 overflow-y-auto scroll-area space-y-4 p-4 rounded-3xl border transition-all duration-300 min-h-[500px]"
      style={{
        background: isOver && isValidDrop ? `${color}10` : 'rgba(255,255,255,0.02)',
        borderColor: isOver && isValidDrop ? `${color}40` : 'rgba(255,255,255,0.04)',
        boxShadow: isOver && isValidDrop ? `0 0 40px ${color}10` : 'none'
      }}
    >
      <SortableContext items={posts.map((p: any) => p.id)} strategy={verticalListSortingStrategy}>
        {posts.map((post: any) => (
          <ReviewCard
            key={post.id}
            post={post}
            onPostClick={onPostClick}
            imageUrl={post.sourceFile}
          />
        ))}
      </SortableContext>
      {posts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-white/10 italic">
          <p className="text-sm">No posts here</p>
        </div>
      )}
    </div>
  )
}

function ReviewCard({ post, onPostClick, imageUrl }: any) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: post.id })
  const FormatIcon = FORMAT_ICONS[post.format] || Image

  return (
    <motion.div
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0.3 : 1 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden cursor-pointer hover:bg-white/[0.05] hover:border-white/[0.1] transition-all group"
      onClick={() => onPostClick(post)}
    >
      {(post.imageUrl || imageUrl) && (
        <div className="aspect-video w-full overflow-hidden relative">
          <img src={post.imageUrl || imageUrl} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
             <span className="text-[10px] font-bold text-white uppercase tracking-widest bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">View Details</span>
          </div>
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <button {...attributes} {...listeners} className="p-1 rounded-lg bg-white/5 text-white/20 hover:text-white/50 cursor-grab active:cursor-grabbing transition-colors" onClick={e => e.stopPropagation()}>
            <GripVertical size={14} />
          </button>
          <PlatformBadge platform={post.platform} />
          <div className="flex items-center gap-1.5 text-white/30">
            <FormatIcon size={12} />
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-4 text-[11px] text-white/40 font-medium bg-white/[0.02] w-fit px-3 py-1.5 rounded-lg border border-white/[0.03]">
          <Calendar size={10} className="text-accent-violet/60" />
          {new Date(post.date).toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric', month: 'short' })}
        </div>
        
        <p className="text-sm text-white/70 leading-relaxed line-clamp-3 font-normal">{post.caption}</p>
      </div>
    </motion.div>
  )
}

function ReviewDragCard({ post, clientColor }: any) {
  return (
    <div className="bg-[#0a0a0f] border rounded-2xl p-5 w-[320px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] rotate-3 scale-105"
      style={{ borderColor: `${clientColor}40` }}>
      <div className="flex items-center gap-3 mb-4">
        <PlatformBadge platform={post.platform} />
        <span className="text-white/20 text-xs font-mono uppercase tracking-[0.2em]">{post.format}</span>
      </div>
      <p className="text-sm text-white/60 leading-relaxed line-clamp-2">{post.caption}</p>
    </div>
  )
}
