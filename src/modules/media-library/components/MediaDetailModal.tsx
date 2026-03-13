import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Download, Trash2, Tag, Plus, Calendar, HardDrive, FileType,
  Copy, Check, Image as ImageIcon, Film,
} from 'lucide-react'
import type { MediaFile } from '../hooks/useMedia'

const API = ''

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function isVideo(filename: string): boolean {
  return /\.(mp4|mov|webm)$/i.test(filename)
}

export function MediaDetailModal({
  file,
  onClose,
  onDelete,
  onUpdateMeta,
  allTags,
}: {
  file: MediaFile | null
  onClose: () => void
  onDelete: (clientId: string, filename: string) => void
  onUpdateMeta: (clientId: string, filename: string, meta: { tags?: string[]; description?: string }) => void
  allTags: string[]
}) {
  const [newTag, setNewTag] = useState('')
  const [description, setDescription] = useState('')
  const [copied, setCopied] = useState(false)
  const [showTagSuggestions, setShowTagSuggestions] = useState(false)
  const tagInputRef = useRef<HTMLInputElement>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (file) {
      setDescription(file.description || '')
      setConfirmDelete(false)
      setCopied(false)
    }
  }, [file])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  if (!file) return null

  const fileUrl = `${API}${file.url}`
  const isVid = isVideo(file.filename)

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase()
    if (!trimmed || file.tags.includes(trimmed)) return
    const updated = [...file.tags, trimmed]
    onUpdateMeta(file.clientId, file.filename, { tags: updated })
    setNewTag('')
    setShowTagSuggestions(false)
  }

  const removeTag = (tag: string) => {
    const updated = file.tags.filter(t => t !== tag)
    onUpdateMeta(file.clientId, file.filename, { tags: updated })
  }

  const saveDescription = () => {
    if (description !== file.description) {
      onUpdateMeta(file.clientId, file.filename, { description })
    }
  }

  const copyUrl = () => {
    navigator.clipboard.writeText(fileUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const suggestedTags = allTags.filter(t =>
    !file.tags.includes(t) && t.includes(newTag.toLowerCase())
  ).slice(0, 8)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-[900px] max-w-[92vw] max-h-[88vh] glass rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/60 flex overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-black/40 hover:bg-white/[0.08] text-white/40 hover:text-white/80 transition-all"
          >
            <X size={16} />
          </button>

          {/* Preview pane */}
          <div className="flex-1 min-w-0 bg-black/30 flex items-center justify-center p-6">
            {isVid ? (
              <video
                src={fileUrl}
                controls
                className="max-w-full max-h-[70vh] rounded-lg"
              />
            ) : (
              <img
                src={fileUrl}
                alt={file.originalName}
                className="max-w-full max-h-[70vh] rounded-lg object-contain"
              />
            )}
          </div>

          {/* Details sidebar */}
          <div className="w-[300px] shrink-0 border-l border-white/[0.06] flex flex-col overflow-y-auto scroll-area">
            {/* File info */}
            <div className="p-5 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white truncate mb-3">
                {file.originalName || file.filename}
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-white/40">
                  {isVid ? <Film size={13} /> : <ImageIcon size={13} />}
                  <span className="uppercase">{file.filename.split('.').pop()}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <HardDrive size={13} />
                  <span>{formatBytes(file.size)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <Calendar size={13} />
                  <span>{formatDate(file.uploadedAt)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <FileType size={13} />
                  <span className="truncate">{file.clientId}</span>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="p-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-2 mb-3">
                <Tag size={13} className="text-accent-violet" />
                <span className="text-[11px] uppercase tracking-wider text-white/30 font-semibold">Tags</span>
              </div>

              {/* Existing tags */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {file.tags.length === 0 && (
                  <span className="text-[11px] text-white/20 italic">No tags</span>
                )}
                {file.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-accent-violet/10 text-accent-violet/80 border border-accent-violet/20"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:text-white transition-colors"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add tag */}
              <div className="relative">
                <div className="flex gap-1.5">
                  <input
                    ref={tagInputRef}
                    type="text"
                    value={newTag}
                    onChange={(e) => { setNewTag(e.target.value); setShowTagSuggestions(true) }}
                    onFocus={() => setShowTagSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); addTag(newTag) }
                    }}
                    placeholder="Add tag..."
                    className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white/80 placeholder:text-white/20 focus:outline-none focus:border-accent-violet/40"
                  />
                  <button
                    onClick={() => addTag(newTag)}
                    className="p-1.5 rounded-lg bg-accent-violet/15 text-accent-violet hover:bg-accent-violet/25 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Tag suggestions */}
                {showTagSuggestions && suggestedTags.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 glass rounded-lg border border-white/[0.08] py-1 z-10 max-h-[140px] overflow-y-auto">
                    {suggestedTags.map(tag => (
                      <button
                        key={tag}
                        onMouseDown={(e) => { e.preventDefault(); addTag(tag) }}
                        className="w-full text-left px-3 py-1.5 text-xs text-white/50 hover:text-white/80 hover:bg-white/[0.04] transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="p-5 border-b border-white/[0.06]">
              <span className="text-[11px] uppercase tracking-wider text-white/30 font-semibold mb-2 block">
                Notes
              </span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={saveDescription}
                placeholder="Add notes..."
                rows={3}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white/70 placeholder:text-white/20 focus:outline-none focus:border-accent-violet/40 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="p-5 mt-auto space-y-2">
              {/* Copy URL */}
              <button
                onClick={copyUrl}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-white/50 bg-white/[0.04] hover:bg-white/[0.08] hover:text-white/70 transition-all border border-white/[0.06]"
              >
                {copied ? <Check size={13} className="text-status-published" /> : <Copy size={13} />}
                {copied ? 'Copied!' : 'Copy URL'}
              </button>

              {/* Download */}
              <a
                href={fileUrl}
                download={file.originalName || file.filename}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-white/50 bg-white/[0.04] hover:bg-white/[0.08] hover:text-white/70 transition-all border border-white/[0.06]"
              >
                <Download size={13} />
                Download
              </a>

              {/* Delete */}
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-400/60 bg-red-500/[0.04] hover:bg-red-500/[0.08] hover:text-red-400 transition-all border border-red-500/[0.08]"
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              ) : (
                <div className="flex gap-1.5">
                  <button
                    onClick={() => { onDelete(file.clientId, file.filename); onClose() }}
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold text-red-400 bg-red-500/15 hover:bg-red-500/25 transition-all border border-red-500/20"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-medium text-white/40 bg-white/[0.04] hover:bg-white/[0.08] transition-all border border-white/[0.06]"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
