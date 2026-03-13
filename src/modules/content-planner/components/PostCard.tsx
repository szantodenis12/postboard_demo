import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import {
  Calendar, Clock, Image, Layers, Video, BookImage, Type, Hash,
  FileEdit, CheckCircle2, Send, ChevronRight,
  Facebook, Instagram, Loader2, AlertCircle, Check, Maximize2,
} from 'lucide-react'
import { PlatformBadge } from '../../../core/ui/PlatformBadge'
import { useReadinessScore } from '../hooks/useReadinessScore'
import { ReadinessScoreBadge } from './ReadinessScoreBadge'
import type { Post, PostStatus, PublishConfig } from '../../../core/types'

const FORMAT_ICONS: Record<string, typeof Image> = {
  'single-image': Image,
  'carousel': Layers,
  'reel': Video,
  'video': Video,
  'stories': BookImage,
  'text': Type,
}

const FORMAT_LABELS: Record<string, string> = {
  'single-image': 'Image',
  'carousel': 'Carousel',
  'reel': 'Reel',
  'video': 'Video',
  'stories': 'Stories',
  'text': 'Text',
}

const STATUS_FLOW: { id: PostStatus; icon: typeof FileEdit; color: string; label: string }[] = [
  { id: 'draft',     icon: FileEdit,     color: '#f59e0b', label: 'Draft' },
  { id: 'approved',  icon: CheckCircle2, color: '#3b82f6', label: 'Approved' },
  { id: 'scheduled', icon: Clock,        color: '#8b5cf6', label: 'Scheduled' },
  { id: 'published', icon: Send,         color: '#10b981', label: 'Published' },
]

type PublishState = 'idle' | 'publishing' | 'success' | 'error'

export function PostCard({
  post,
  index,
  clientColor,
  showClient = false,
  onStatusChange,
  onClick,
  publishConfig,
  onPublish,
  imageUrl,
  hasVisual = false,
}: {
  post: Post
  index: number
  clientColor?: string
  showClient?: boolean
  onStatusChange?: (postId: string, status: PostStatus) => void
  onClick?: () => void
  publishConfig?: PublishConfig | null
  onPublish?: (postId: string, platform: 'facebook' | 'instagram', caption: string) => Promise<{ success: boolean; error?: string }>
  imageUrl?: string | null
  hasVisual?: boolean
}) {
  const [showStatusPicker, setShowStatusPicker] = useState(false)
  const [fbState, setFbState] = useState<PublishState>('idle')
  const [igState, setIgState] = useState<PublishState>('idle')
  const [publishError, setPublishError] = useState<string | null>(null)
  const FormatIcon = FORMAT_ICONS[post.format] || Image
  const currentStatus = STATUS_FLOW.find(s => s.id === post.status) || STATUS_FLOW[0]
  const CurrentIcon = currentStatus.icon
  const readiness = useReadinessScore(post, hasVisual)
  const isInstagramStory = post.platform === 'stories' || post.format === 'stories'
  const requiresInstagramMusic = !!post.requiresInstagramMusic && (post.platform === 'instagram' || post.platform === 'stories')

  const handleStatusClick = (status: PostStatus) => {
    onStatusChange?.(post.id, status)
    setShowStatusPicker(false)
  }

  const canPublish = publishConfig && onPublish && post.status !== 'published'
  const showPublishRow = canPublish && (post.status === 'approved' || post.status === 'scheduled')

  const handlePublish = async (platform: 'facebook' | 'instagram') => {
    if (!onPublish) return
    const setState = platform === 'facebook' ? setFbState : setIgState
    setState('publishing')
    setPublishError(null)
    try {
      const caption = post.hashtags.length > 0
        ? `${post.caption}\n\n${post.hashtags.map(t => `#${t}`).join(' ')}`
        : post.caption
      const result = await onPublish(post.id, platform, caption)
      if (result.success) {
        setState('success')
        setTimeout(() => setState('idle'), 3000)
      } else {
        setState('error')
        setPublishError(result.error || 'Failed to publish')
        setTimeout(() => { setState('idle'); setPublishError(null) }, 4000)
      }
    } catch (err: any) {
      setState('error')
      setPublishError(err.message || 'Unexpected error')
      setTimeout(() => { setState('idle'); setPublishError(null) }, 4000)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className={`glass glass-hover rounded-xl overflow-hidden group relative ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
      onClick={onClick}
    >
      {imageUrl && (
        <div className="w-full h-[120px] overflow-hidden">
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4">
      {/* Top row: platform + status + format + readiness */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <PlatformBadge platform={post.platform} />
          <span className="flex items-center gap-1 text-[10px] text-white/30 font-medium">
            <FormatIcon size={11} />
            {FORMAT_LABELS[post.format]}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Readiness score badge */}
          <ReadinessScoreBadge
            score={readiness.score}
            grade={readiness.grade}
            factors={readiness.factors}
          />

          {/* Open detail icon */}
          {onClick && (
            <button
              onClick={(e) => { e.stopPropagation(); onClick() }}
              className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-white/[0.06] transition-all"
              title="View details"
            >
              <Maximize2 size={11} className="text-white/30" />
            </button>
          )}

          {/* Status button */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowStatusPicker(!showStatusPicker) }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide transition-all hover:scale-105 active:scale-95"
              style={{
                background: `${currentStatus.color}15`,
                color: currentStatus.color,
                border: `1px solid ${currentStatus.color}30`,
              }}
            >
              <CurrentIcon size={11} />
              {currentStatus.label}
              <ChevronRight
                size={10}
                className={`transition-transform duration-200 ${showStatusPicker ? 'rotate-90' : ''}`}
              />
            </button>

            {/* Status picker dropdown */}
            <AnimatePresence>
              {showStatusPicker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1.5 z-50 glass rounded-xl p-1.5 min-w-[160px] shadow-2xl shadow-black/50"
                  style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  {STATUS_FLOW.map((status) => {
                    const Icon = status.icon
                    const isActive = post.status === status.id
                    return (
                      <button
                        key={status.id}
                        onClick={(e) => { e.stopPropagation(); handleStatusClick(status.id) }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all
                          ${isActive
                            ? 'bg-white/[0.06]'
                            : 'hover:bg-white/[0.04]'
                          }`}
                      >
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center"
                          style={{ background: `${status.color}20` }}
                        >
                          <Icon size={13} style={{ color: status.color }} />
                        </div>
                        <span style={{ color: isActive ? status.color : 'rgba(255,255,255,0.6)' }}>
                          {status.label}
                        </span>
                        {isActive && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: status.color }} />
                        )}
                      </button>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Click outside to close picker */}
      {showStatusPicker && (
        <div
          className="fixed inset-0 z-40"
          onClick={(e) => { e.stopPropagation(); setShowStatusPicker(false) }}
        />
      )}

      {/* Client name (when showing all) */}
      {showClient && clientColor && (
        <div className="flex items-center gap-2 mb-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: clientColor }}
          />
          <span className="text-[11px] font-medium" style={{ color: clientColor }}>
            {post.clientName}
          </span>
        </div>
      )}

      {/* Date & time */}
      <div className="flex items-center gap-3 mb-3 text-xs text-white/50">
        <span className="flex items-center gap-1">
          <Calendar size={12} />
          {new Date(post.date).toLocaleDateString('ro-RO', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          })}
        </span>
        {post.time && (
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {post.time}
          </span>
        )}
        {post.pillar && (
          <span className="px-1.5 py-0.5 rounded bg-white/[0.04] text-[10px] text-white/35">
            {post.pillar}
          </span>
        )}
      </div>

      {/* Caption */}
      <p className="text-sm text-white/70 leading-relaxed line-clamp-3 mb-3">
        {post.caption}
      </p>

      {/* Hashtags */}
      {post.hashtags.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          <Hash size={11} className="text-white/20" />
          {post.hashtags.slice(0, 5).map(tag => (
            <span key={tag} className="text-[10px] text-accent-cyan/60">
              {tag}
            </span>
          ))}
          {post.hashtags.length > 5 && (
            <span className="text-[10px] text-white/25">+{post.hashtags.length - 5}</span>
          )}
        </div>
      )}

      {/* Publish buttons */}
      {showPublishRow && (
        <div className="mt-3 pt-3 border-t border-white/[0.06]" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/25 uppercase tracking-wider font-medium mr-1">
              Publish to
            </span>
            {!isInstagramStory && (
              <PublishButton
                icon={Facebook}
                label="Facebook"
                color="#1877F2"
                state={fbState}
                onClick={() => handlePublish('facebook')}
              />
            )}
            {publishConfig?.hasInstagram && !requiresInstagramMusic && (
              <PublishButton
                icon={Instagram}
                label={isInstagramStory ? 'IG Story' : 'Instagram'}
                color="#E4405F"
                state={igState}
                onClick={() => handlePublish('instagram')}
              />
            )}
            {publishConfig?.hasInstagram && requiresInstagramMusic && (
              <span className="inline-flex items-center rounded-lg border border-amber-500/25 bg-amber-500/10 px-2.5 py-1.5 text-[10px] font-semibold text-amber-300/80">
                IG manual + music
              </span>
            )}
            <span className="ml-auto text-[9px] text-white/15 truncate max-w-[100px]">
              via {publishConfig?.pageName}
            </span>
          </div>

          <AnimatePresence>
            {publishError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-1.5 mt-2 text-[10px] text-red-400/80"
              >
                <AlertCircle size={11} />
                <span className="truncate">{publishError}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Already published indicator */}
      {publishConfig && post.status === 'published' && (
        <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center gap-1.5 text-[10px] text-status-published/50">
          <Check size={11} />
          <span>Published via {publishConfig.pageName}</span>
        </div>
      )}
      </div>
    </motion.div>
  )
}

function PublishButton({
  icon: Icon,
  label,
  color,
  state,
  onClick,
}: {
  icon: typeof Facebook
  label: string
  color: string
  state: PublishState
  onClick: () => void
}) {
  const isLoading = state === 'publishing'
  const isSuccess = state === 'success'
  const isError = state === 'error'

  return (
    <button
      onClick={onClick}
      disabled={isLoading || isSuccess}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all hover:scale-105 active:scale-95 disabled:hover:scale-100"
      style={{
        background: isSuccess ? '#10b98120' : isError ? '#ef444420' : `${color}15`,
        color: isSuccess ? '#10b981' : isError ? '#ef4444' : color,
        border: `1px solid ${isSuccess ? '#10b98130' : isError ? '#ef444430' : `${color}25`}`,
        opacity: isLoading ? 0.7 : 1,
      }}
    >
      {isLoading ? (
        <Loader2 size={11} className="animate-spin" />
      ) : isSuccess ? (
        <Check size={11} />
      ) : isError ? (
        <AlertCircle size={11} />
      ) : (
        <Icon size={11} />
      )}
      {isLoading ? 'Posting...' : isSuccess ? 'Done!' : isError ? 'Failed' : label}
    </button>
  )
}
