import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect, useCallback } from 'react'
import {
  X, Calendar, Clock, Image, Layers, Video, BookImage, Type, Hash,
  FileEdit, CheckCircle2, Send, Eye,
  Facebook, Instagram, Loader2, AlertCircle, Check,
  Copy, ExternalLink, Pencil, Save, RotateCcw,
  Upload, Trash2, ImagePlus, TrendingUp, FolderOpen, CheckCircle, Sparkles,
} from 'lucide-react'
import { PlatformBadge } from '../../../core/ui/PlatformBadge'
import { useApp } from '../../../core/context'
import type { Post, PostStatus, PublishConfig } from '../../../core/types'
import { ImageGenerator } from './ImageGenerator'

interface LibraryFile {
  filename: string
  url: string
  size: number
  uploadedAt: string
  originalName?: string
  type: 'image' | 'video'
  mimeType?: string
}

const FORMAT_META: Record<string, { icon: typeof Image; label: string }> = {
  'single-image': { icon: Image, label: 'Single Image' },
  'carousel':     { icon: Layers, label: 'Carousel' },
  'reel':         { icon: Video, label: 'Reel' },
  'video':        { icon: Video, label: 'Video' },
  'stories':      { icon: BookImage, label: 'Stories' },
  'text':         { icon: Type, label: 'Text Post' },
}

const STATUS_FLOW: { id: PostStatus; icon: typeof FileEdit; color: string; label: string }[] = [
  { id: 'draft',     icon: FileEdit,     color: '#f59e0b', label: 'Draft' },
  { id: 'approved',  icon: CheckCircle2, color: '#3b82f6', label: 'Approved' },
  { id: 'scheduled', icon: Clock,        color: '#8b5cf6', label: 'Scheduled' },
  { id: 'published', icon: Send,         color: '#10b981', label: 'Published' },
]

type PublishState = 'idle' | 'publishing' | 'success' | 'error'

function inferMediaType(value: string): 'image' | 'video' {
  return /\.(mp4|mov)$/i.test(value) ? 'video' : 'image'
}

function formatMediaLabel(count: number) {
  if (count === 1) return '1 asset'
  return `${count} assets`
}

export function PostDetailModal({
  post,
  clientColor,
  onClose,
  onStatusChange,
  onCaptionSave,
  publishConfig,
  onPublish,
}: {
  post: Post
  clientColor?: string
  onClose: () => void
  onStatusChange?: (postId: string, status: PostStatus) => void
  onCaptionSave?: (postId: string, caption: string, hashtags: string[]) => void
  publishConfig?: PublishConfig | null
  onPublish?: (postId: string, platform: 'facebook' | 'instagram', caption: string) => Promise<{ success: boolean; error?: string }>
}) {
  const { refreshImages, deletePost, getPostMedia, updatePostPublishOptions } = useApp()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [fbState, setFbState] = useState<PublishState>('idle')
  const [igState, setIgState] = useState<PublishState>('idle')
  const [publishError, setPublishError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Edit mode state
  const [editing, setEditing] = useState(false)
  const [editCaption, setEditCaption] = useState(post.caption)
  const [editHashtags, setEditHashtags] = useState(post.hashtags.join(', '))
  const [saved, setSaved] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Media attachment state
  const [mediaLoading, setMediaLoading] = useState(false)
  const [mediaDragOver, setMediaDragOver] = useState(false)
  const mediaInputRef = useRef<HTMLInputElement>(null)

  // Library picker state
  const [mediaTab, setMediaTab] = useState<'upload' | 'library'>('upload')
  const [libraryFiles, setLibraryFiles] = useState<LibraryFile[]>([])
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [libraryAttaching, setLibraryAttaching] = useState<string | null>(null)

  // Image generator state
  const [showImageGenerator, setShowImageGenerator] = useState(false)
  const [requiresInstagramMusic, setRequiresInstagramMusic] = useState(!!post.requiresInstagramMusic)
  const [musicSaving, setMusicSaving] = useState(false)

  // Performance prediction state
  const [prediction, setPrediction] = useState<{
    expectedReach: { min: number; max: number }
    expectedEngagement: { min: number; max: number }
    engagementRate: number
    confidence: 'low' | 'medium' | 'high'
    factors: string[]
  } | null>(null)

  const postMedia = getPostMedia(post.id)

  // Fetch prediction on mount
  useEffect(() => {
    fetch('/api/intelligence/predict-performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: post.clientId,
        caption: post.caption,
        platform: post.platform,
        format: post.format,
        hashtags: post.hashtags,
        pillar: post.pillar,
      }),
    })
      .then(r => r.json())
      .then(data => { if (data.expectedReach) setPrediction(data) })
      .catch(() => {})
  }, [post.clientId, post.caption, post.platform, post.format, post.hashtags, post.pillar])

  const handleMediaUpload = useCallback(async (input: FileList | File[]) => {
    const files = Array.from(input).filter(file => /\.(jpg|jpeg|png|gif|webp|svg|mp4|mov)$/i.test(file.name))
    if (files.length === 0) return

    setMediaLoading(true)
    try {
      const formData = new FormData()
      for (const file of files) {
        formData.append('files', file)
      }
      const res = await fetch(`/api/posts/${post.id}/media/${post.clientId}`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.success) {
        refreshImages()
      }
    } catch { /* ignore */ }
    setMediaLoading(false)
  }, [post.id, post.clientId, refreshImages])

  const handleMediaRemove = useCallback(async (filename: string) => {
    await fetch(`/api/posts/${post.id}/media?filename=${encodeURIComponent(filename)}`, { method: 'DELETE' })
    refreshImages()
  }, [post.id, refreshImages])

  const handleMediaDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setMediaDragOver(false)
    if (e.dataTransfer.files?.length) {
      handleMediaUpload(e.dataTransfer.files)
    }
  }, [handleMediaUpload])

  const handleMediaFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files?.length) handleMediaUpload(files)
    e.target.value = ''
  }, [handleMediaUpload])

  // Fetch library files when Library tab is active
  const fetchLibraryFiles = useCallback(async () => {
    if (!post.clientId) return
    setLibraryLoading(true)
    try {
      const [filesRes, metaRes] = await Promise.all([
        fetch(`/api/uploads/${post.clientId}`),
        fetch('/api/media/meta'),
      ])
      const filesData = await filesRes.json()
      const metaData = await metaRes.json()
      const enriched = (filesData.files || [])
        .map((f: any) => {
          const metaKey = `${post.clientId}/${f.filename}`
          const meta = metaData[metaKey]
          return {
            ...f,
            originalName: meta?.originalName || f.originalName || f.filename,
            type: meta?.mimeType?.startsWith?.('video/') ? 'video' : inferMediaType(f.filename),
            mimeType: meta?.mimeType,
          }
        })
      setLibraryFiles(enriched)
    } catch {
      setLibraryFiles([])
    }
    setLibraryLoading(false)
  }, [post.clientId])

  useEffect(() => {
    if (mediaTab === 'library') {
      fetchLibraryFiles()
    }
  }, [mediaTab, fetchLibraryFiles])

  const handleLibraryPick = useCallback(async (file: LibraryFile) => {
    setLibraryAttaching(file.filename)
    try {
      const res = await fetch(`/api/posts/${post.id}/media`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: post.clientId,
          filename: file.filename,
          url: file.url,
          type: file.type,
          mimeType: file.mimeType,
          originalName: file.originalName,
        }),
      })
      const data = await res.json()
      if (data.success) {
        refreshImages()
      }
    } catch { /* ignore */ }
    setLibraryAttaching(null)
  }, [post.id, post.clientId, refreshImages])

  // Sync when post changes externally
  useEffect(() => {
    setEditCaption(post.caption)
    setEditHashtags(post.hashtags.join(', '))
  }, [post.caption, post.hashtags])

  useEffect(() => {
    setRequiresInstagramMusic(!!post.requiresInstagramMusic)
  }, [post.id, post.requiresInstagramMusic])

  // Auto-resize textarea
  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
      textareaRef.current.focus()
    }
  }, [editing, editCaption])

  const fmt = FORMAT_META[post.format] || FORMAT_META['single-image']
  const FormatIcon = fmt.icon

  const fullCaption = post.hashtags.length > 0
    ? `${post.caption}\n\n${post.hashtags.map(t => `#${t}`).join(' ')}`
    : post.caption
  const isInstagramStory = post.platform === 'stories' || post.format === 'stories'
  const supportsInstagramMusicToggle = post.platform === 'instagram' || post.platform === 'stories'

  const canPublish = publishConfig && onPublish && post.status !== 'published'
  const showPublish = canPublish && (post.status === 'approved' || post.status === 'scheduled')

  const handleInstagramMusicToggle = useCallback(async () => {
    const next = !requiresInstagramMusic
    setRequiresInstagramMusic(next)
    setMusicSaving(true)
    const ok = await updatePostPublishOptions(post.id, { requiresInstagramMusic: next })
    if (!ok) setRequiresInstagramMusic(!next)
    setMusicSaving(false)
  }, [post.id, requiresInstagramMusic, updatePostPublishOptions])

  const handlePublish = async (platform: 'facebook' | 'instagram') => {
    if (!onPublish) return
    const setState = platform === 'facebook' ? setFbState : setIgState
    setState('publishing')
    setPublishError(null)
    try {
      const result = await onPublish(post.id, platform, fullCaption)
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

  const copyCaption = () => {
    navigator.clipboard.writeText(fullCaption)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleEditToggle = () => {
    if (editing) {
      // Cancel — reset to original
      setEditCaption(post.caption)
      setEditHashtags(post.hashtags.join(', '))
    }
    setEditing(!editing)
  }

  const handleSave = () => {
    const newHashtags = editHashtags
      .split(/[,\s]+/)
      .map(t => t.replace(/^#/, '').trim())
      .filter(Boolean)

    onCaptionSave?.(post.id, editCaption, newHashtags)
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const hasChanges = editCaption !== post.caption ||
    editHashtags !== post.hashtags.join(', ')

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-6"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl max-h-[85vh] glass rounded-2xl overflow-hidden flex flex-col"
          style={{ border: '1px solid rgba(255,255,255,0.1)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3 min-w-0">
              {clientColor && (
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white/90 shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${clientColor}40, ${clientColor}15)`,
                    border: `1px solid ${clientColor}40`,
                  }}
                >
                  {post.clientName?.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white truncate">{post.clientName}</span>
                  <PlatformBadge platform={post.platform} />
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    {new Date(post.date).toLocaleDateString('ro-RO', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  {post.time && (
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {post.time}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors shrink-0"
            >
              <X size={18} className="text-white/40" />
            </button>
          </div>

          {/* Body — scrollable */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Status + Format row */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs text-white/40">
                <FormatIcon size={13} />
                {fmt.label}
              </span>
              {post.pillar && (
                <span className="px-2 py-0.5 rounded-md bg-white/[0.04] text-[11px] text-white/40">
                  {post.pillar}
                </span>
              )}
              <div className="ml-auto flex items-center gap-1.5">
                {STATUS_FLOW.map(s => {
                  const Icon = s.icon
                  const isActive = post.status === s.id
                  return (
                    <button
                      key={s.id}
                      onClick={() => onStatusChange?.(post.id, s.id)}
                      className="p-2 rounded-lg transition-all hover:scale-110 active:scale-95"
                      style={{
                        background: isActive ? `${s.color}20` : 'transparent',
                        border: isActive ? `1px solid ${s.color}40` : '1px solid transparent',
                      }}
                      title={s.label}
                    >
                      <Icon size={15} style={{ color: isActive ? s.color : 'rgba(255,255,255,0.2)' }} />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Caption */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider text-white/25 font-medium">Caption</span>
                <div className="flex items-center gap-2">
                  {saved && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400/80">
                      <Check size={11} />
                      Saved
                    </span>
                  )}
                  {editing ? (
                    <>
                      <button
                        onClick={handleEditToggle}
                        className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/60 transition-colors"
                      >
                        <RotateCcw size={11} />
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={!hasChanges}
                        className="flex items-center gap-1 text-[10px] text-accent-cyan/70 hover:text-accent-cyan transition-colors disabled:opacity-30"
                      >
                        <Save size={11} />
                        Save
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleEditToggle}
                        className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/60 transition-colors"
                      >
                        <Pencil size={11} />
                        Edit
                      </button>
                      <button
                        onClick={copyCaption}
                        className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/60 transition-colors"
                      >
                        {copied ? <Check size={11} /> : <Copy size={11} />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] transition-colors"
                style={editing ? { borderColor: 'rgba(6,182,212,0.2)' } : {}}
              >
                {editing ? (
                  <textarea
                    ref={textareaRef}
                    value={editCaption}
                    onChange={(e) => setEditCaption(e.target.value)}
                    className="w-full bg-transparent text-sm text-white/75 leading-relaxed outline-none resize-none min-h-[80px]"
                    placeholder="Write your caption..."
                  />
                ) : (
                  <p className="text-sm text-white/75 leading-relaxed whitespace-pre-wrap">
                    {post.caption}
                  </p>
                )}
              </div>
            </div>

            {/* Hashtags */}
            <div>
              <span className="text-[10px] uppercase tracking-wider text-white/25 font-medium flex items-center gap-1 mb-2">
                <Hash size={11} />
                Hashtags ({post.hashtags.length})
              </span>
              {editing ? (
                <input
                  type="text"
                  value={editHashtags}
                  onChange={(e) => setEditHashtags(e.target.value)}
                  className="w-full bg-white/[0.03] border border-accent-cyan/20 rounded-xl px-4 py-3 text-xs text-white/70 outline-none focus:border-accent-cyan/40 transition-colors"
                  placeholder="tag1, tag2, tag3..."
                />
              ) : post.hashtags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {post.hashtags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 rounded-md text-[11px] font-medium"
                      style={{ background: 'rgba(6,182,212,0.08)', color: 'rgba(6,182,212,0.7)' }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-white/20">No hashtags</p>
              )}
            </div>

            {/* Visual description */}
            {post.visualDescription && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-wider text-white/25 font-medium flex items-center gap-1">
                    <Eye size={11} />
                    Visual Description
                  </span>
                  {!showImageGenerator && (
                    <button
                      onClick={() => setShowImageGenerator(true)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(6,182,212,0.12))',
                        border: '1px solid rgba(139,92,246,0.2)',
                        color: 'rgba(139,92,246,0.8)',
                      }}
                    >
                      <Sparkles size={10} />
                      Generate Image Prompt
                    </button>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <p className="text-xs text-white/50 leading-relaxed">{post.visualDescription}</p>
                </div>

                {/* Image Prompt Generator */}
                <AnimatePresence>
                  {showImageGenerator && (
                    <div className="mt-3">
                      <ImageGenerator
                        post={post}
                        onClose={() => setShowImageGenerator(false)}
                      />
                    </div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* CTA */}
            {post.cta && (
              <div>
                <span className="text-[10px] uppercase tracking-wider text-white/25 font-medium flex items-center gap-1 mb-2">
                  <ExternalLink size={11} />
                  Call to Action
                </span>
                <p className="text-xs text-white/50">{post.cta}</p>
              </div>
            )}

            {/* Media Attachments */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider text-white/25 font-medium flex items-center gap-1">
                  <Image size={11} />
                  Media ({formatMediaLabel(postMedia.length)})
                </span>
                <div className="flex items-center gap-0.5 bg-white/[0.03] rounded-lg p-0.5 border border-white/[0.06]">
                  {([
                    { id: 'upload' as const, icon: Upload, label: 'Upload' },
                    { id: 'library' as const, icon: FolderOpen, label: 'Library' },
                  ]).map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setMediaTab(tab.id)}
                      className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
                        mediaTab === tab.id
                          ? 'text-white/70'
                          : 'text-white/25 hover:text-white/50'
                      }`}
                    >
                      {mediaTab === tab.id && (
                        <motion.div
                          layoutId="image-tab-bg"
                          className="absolute inset-0 bg-white/[0.08] rounded-md"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      <tab.icon size={11} className="relative z-10" />
                      <span className="relative z-10">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-[10px] text-white/25 mb-3">
                {post.format === 'carousel'
                  ? 'Attach 2 to 10 images or videos for this carousel. Instagram carousel publishing uses the attached media order.'
                  : post.format === 'stories'
                    ? 'Attach exactly 1 image or 1 video for this story. Multi-frame story sequences are not yet auto-published.'
                  : 'You can attach images or videos. This step prepares the post media stack for richer publishing flows.'}
              </div>

              {supportsInstagramMusicToggle && (
                <div className="mb-3 rounded-xl border border-amber-500/15 bg-amber-500/[0.04] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold text-amber-200/85">Muzică Instagram</div>
                      <div className="mt-1 text-[10px] leading-relaxed text-white/38">
                        {requiresInstagramMusic
                          ? 'Postarea va fi finalizată manual în aplicația Instagram. Auto-publish și publish direct din PostBoard sunt dezactivate pentru Instagram.'
                          : 'Lasă oprit dacă vrei publicare normală din PostBoard fără muzică din librăria Instagram.'}
                      </div>
                    </div>
                    <button
                      onClick={handleInstagramMusicToggle}
                      disabled={musicSaving}
                      className={`inline-flex min-w-[132px] items-center justify-center rounded-lg border px-3 py-2 text-[10px] font-semibold transition-all ${
                        requiresInstagramMusic
                          ? 'border-amber-400/35 bg-amber-500/15 text-amber-200'
                          : 'border-white/[0.08] bg-white/[0.03] text-white/45 hover:text-white/70'
                      } ${musicSaving ? 'opacity-60' : ''}`}
                    >
                      {musicSaving ? <Loader2 size={12} className="animate-spin" /> : (requiresInstagramMusic ? 'Manual cu muzică' : 'Fără muzică IG')}
                    </button>
                  </div>
                </div>
              )}

              {postMedia.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                  {postMedia.map((item, index) => (
                    <div
                      key={`${item.filename}-${index}`}
                      className="relative group rounded-xl overflow-hidden border border-white/[0.06] bg-white/[0.02]"
                    >
                      <div className="aspect-square bg-black/20">
                        {item.type === 'video' ? (
                          <video
                            src={item.url}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                            preload="metadata"
                          />
                        ) : (
                          <img
                            src={item.url}
                            alt={item.originalName || item.filename}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/85 via-black/20 to-transparent">
                        <div className="text-[9px] font-medium text-white/80 truncate">
                          {item.originalName || item.filename}
                        </div>
                        <div className="text-[9px] text-white/35 uppercase tracking-wide">
                          {item.type}
                        </div>
                      </div>
                      <button
                        onClick={() => handleMediaRemove(item.filename)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/55 hover:bg-red-500/70 text-white/70 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                        title="Remove asset"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mb-3 flex flex-col items-center justify-center py-6 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01]">
                  <ImagePlus size={20} className="text-white/12 mb-2" />
                  <p className="text-[11px] text-white/28 font-medium">No media attached yet</p>
                  <p className="text-[10px] text-white/15 mt-0.5">Upload files or attach assets from the library below</p>
                </div>
              )}

              <AnimatePresence mode="wait">
                {mediaTab === 'upload' ? (
                  <motion.div
                    key="upload-tab"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div
                      onDragOver={(e) => { e.preventDefault(); setMediaDragOver(true) }}
                      onDragLeave={() => setMediaDragOver(false)}
                      onDrop={handleMediaDrop}
                      onClick={() => mediaInputRef.current?.click()}
                      className={`flex flex-col items-center justify-center py-8 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                        mediaDragOver
                          ? 'border-accent-cyan/40 bg-accent-cyan/[0.04]'
                          : 'border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.02]'
                      }`}
                    >
                      {mediaLoading ? (
                        <Loader2 size={20} className="text-white/30 animate-spin" />
                      ) : (
                        <>
                          <ImagePlus size={22} className="text-white/15 mb-2" />
                          <p className="text-[11px] text-white/30 font-medium">Drop media or click to upload</p>
                          <p className="text-[10px] text-white/15 mt-0.5">Images: JPG, PNG, WebP, GIF, SVG • Videos: MP4, MOV</p>
                        </>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="library-tab"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.15 }}
                  >
                    {libraryLoading ? (
                      <div className="flex items-center justify-center py-10">
                        <Loader2 size={20} className="text-white/25 animate-spin" />
                      </div>
                    ) : libraryFiles.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 rounded-xl border border-white/[0.06] bg-white/[0.01]">
                        <FolderOpen size={22} className="text-white/10 mb-2" />
                        <p className="text-[11px] text-white/25 font-medium">No media in library</p>
                        <p className="text-[10px] text-white/15 mt-0.5">Upload assets first via the Upload tab or Media Library</p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-2 max-h-[260px] overflow-y-auto scroll-area">
                        <div className="grid grid-cols-4 gap-1.5">
                          {libraryFiles.map((file, i) => {
                            const isAttached = postMedia.some(item => item.filename === file.filename && item.url === file.url)
                            const isAttaching = libraryAttaching === file.filename

                            return (
                              <motion.button
                                key={file.filename}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.02, duration: 0.15 }}
                                onClick={() => !isAttached && handleLibraryPick(file)}
                                disabled={isAttaching || !!libraryAttaching}
                                className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all border group ${
                                  isAttached
                                    ? 'border-accent-cyan/50 ring-2 ring-accent-cyan/20'
                                    : 'border-white/[0.06] hover:border-white/[0.18] hover:scale-[1.03]'
                                } ${isAttaching ? 'opacity-60' : ''}`}
                                title={file.originalName || file.filename}
                              >
                                {file.type === 'video' ? (
                                  <video
                                    src={file.url}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    muted
                                    playsInline
                                    preload="metadata"
                                  />
                                ) : (
                                  <img
                                    src={file.url}
                                    alt={file.originalName || file.filename}
                                    loading="lazy"
                                    className="absolute inset-0 w-full h-full object-cover"
                                  />
                                )}

                                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-[8px] text-white/70 uppercase tracking-wide">
                                  {file.type}
                                </div>

                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute bottom-0 left-0 right-0 p-1.5 translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                                  <p className="text-[9px] font-medium text-white/80 truncate">
                                    {file.originalName || file.filename}
                                  </p>
                                </div>

                                {isAttaching && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                    <Loader2 size={16} className="text-accent-cyan animate-spin" />
                                  </div>
                                )}

                                {isAttached && !isAttaching && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                    <div className="w-7 h-7 rounded-full bg-accent-cyan/20 border border-accent-cyan/40 flex items-center justify-center backdrop-blur-sm">
                                      <CheckCircle size={16} className="text-accent-cyan" />
                                    </div>
                                  </div>
                                )}
                              </motion.button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <input
                ref={mediaInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleMediaFileSelect}
                className="hidden"
              />
            </div>

            {/* Performance Prediction */}
            {prediction && (
              <div>
                <span className="text-[10px] uppercase tracking-wider text-white/25 font-medium flex items-center gap-1 mb-2">
                  <TrendingUp size={11} />
                  Performance Prediction
                  <span className={`ml-1 px-1.5 py-0.5 rounded text-[8px] font-semibold ${
                    prediction.confidence === 'high' ? 'bg-emerald-500/15 text-emerald-400' :
                    prediction.confidence === 'medium' ? 'bg-amber-500/15 text-amber-400' :
                    'bg-white/5 text-white/30'
                  }`}>
                    {prediction.confidence} confidence
                  </span>
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.04] text-center">
                    <div className="text-xs font-semibold text-accent-cyan">
                      {prediction.expectedReach.min.toLocaleString('ro-RO')}–{prediction.expectedReach.max.toLocaleString('ro-RO')}
                    </div>
                    <div className="text-[9px] text-white/25 mt-0.5">Expected Reach</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.04] text-center">
                    <div className="text-xs font-semibold text-accent-violet">
                      {prediction.expectedEngagement.min}–{prediction.expectedEngagement.max}
                    </div>
                    <div className="text-[9px] text-white/25 mt-0.5">Engagements</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.04] text-center">
                    <div className="text-xs font-semibold text-accent-orange">
                      {prediction.engagementRate.toFixed(1)}%
                    </div>
                    <div className="text-[9px] text-white/25 mt-0.5">Eng. Rate</div>
                  </div>
                </div>
                {prediction.factors.length > 0 && (
                  <div className="mt-2 space-y-0.5">
                    {prediction.factors.map((f, i) => (
                      <div key={i} className="text-[10px] text-white/30 flex items-start gap-1.5">
                        <span className="text-accent-cyan/50 mt-0.5">•</span>
                        {f}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Source file */}
            <div className="text-[10px] text-white/20">
              Source: {post.sourceFile}
            </div>
          </div>

          {/* Footer — Publish actions + Delete */}
          <div className="p-5 pt-4 border-t border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                {showPublish ? (
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-white/30 font-medium">Publish to</span>
                      {!isInstagramStory && (
                        <PublishBtn
                          icon={Facebook}
                          label="Facebook"
                          color="#1877F2"
                          state={fbState}
                          onClick={() => handlePublish('facebook')}
                        />
                      )}
                      {publishConfig?.hasInstagram && !requiresInstagramMusic && (
                        <PublishBtn
                          icon={Instagram}
                          label={isInstagramStory ? 'IG Story' : 'Instagram'}
                          color="#E4405F"
                          state={igState}
                          onClick={() => handlePublish('instagram')}
                        />
                      )}
                      {publishConfig?.hasInstagram && requiresInstagramMusic && (
                        <span className="inline-flex items-center rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[11px] font-semibold text-amber-300/80">
                          IG manual + music
                        </span>
                      )}
                      <span className="ml-auto text-[10px] text-white/20">
                        via {publishConfig?.pageName}
                      </span>
                    </div>
                    {requiresInstagramMusic && (
                      <div className="mt-2 text-[11px] text-amber-300/70">
                        Postarea rămâne pentru finalizare manuală în Instagram, unde poți adăuga muzica înainte de publicare.
                      </div>
                    )}
                    {publishError && (
                      <div className="flex items-center gap-1.5 mt-2 text-[11px] text-red-400/80">
                        <AlertCircle size={12} />
                        {publishError}
                      </div>
                    )}
                  </div>
                ) : post.status === 'published' && publishConfig ? (
                  <div className="flex items-center gap-1.5 text-[11px] text-status-published/60">
                    <Check size={12} />
                    Published via {publishConfig.pageName}
                  </div>
                ) : post.status === 'draft' ? (
                  <div className="text-[11px] text-white/25">
                    Change status to <span className="text-blue-400">Approved</span> or <span className="text-purple-400">Scheduled</span> to enable publishing
                  </div>
                ) : !publishConfig ? (
                  <div className="text-[11px] text-white/25">
                    Link a Meta page to this client in Settings to enable publishing
                  </div>
                ) : null}
              </div>

              {/* Delete button */}
              {confirmDelete ? (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-red-400/70">Remove?</span>
                  <button
                    onClick={() => { deletePost(post.id); onClose() }}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25 transition-all"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-white/30 hover:text-white/60 bg-white/[0.04] hover:bg-white/[0.08] transition-all"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="p-2 rounded-lg text-white/15 hover:text-red-400/60 hover:bg-red-500/[0.06] transition-all shrink-0"
                  title="Remove post"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function PublishBtn({
  icon: Icon, label, color, state, onClick,
}: {
  icon: typeof Facebook; label: string; color: string; state: PublishState; onClick: () => void
}) {
  const isLoading = state === 'publishing'
  const isSuccess = state === 'success'
  const isError = state === 'error'

  return (
    <button
      onClick={onClick}
      disabled={isLoading || isSuccess}
      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] font-semibold transition-all hover:scale-105 active:scale-95 disabled:hover:scale-100"
      style={{
        background: isSuccess ? '#10b98120' : isError ? '#ef444420' : `${color}15`,
        color: isSuccess ? '#10b981' : isError ? '#ef4444' : color,
        border: `1px solid ${isSuccess ? '#10b98130' : isError ? '#ef444430' : `${color}25`}`,
        opacity: isLoading ? 0.7 : 1,
      }}
    >
      {isLoading ? <Loader2 size={12} className="animate-spin" /> :
       isSuccess ? <Check size={12} /> :
       isError ? <AlertCircle size={12} /> : <Icon size={12} />}
      {isLoading ? 'Posting...' : isSuccess ? 'Done!' : isError ? 'Failed' : label}
    </button>
  )
}
