import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Image, Upload, Search, Tag, Trash2, CheckSquare, Square, X,
  Film, Grid3X3, LayoutList, FolderOpen, CloudUpload, RefreshCw,
} from 'lucide-react'
import { useApp } from '../../../core/context'
import { useToast } from '../../../core/ui/ToastProvider'
import { useMedia, type MediaFile } from '../hooks/useMedia'
import { MediaDetailModal } from './MediaDetailModal'

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

function isVideo(filename: string): boolean {
  return /\.(mp4|mov|webm)$/i.test(filename)
}

const API = ''

type ViewMode = 'grid' | 'list'

export function MediaLibrary() {
  const { data, selectedClient } = useApp()
  const { toast } = useToast()
  const {
    files, loading, uploading, uploadProgress, allTags,
    upload, deleteFile, bulkDelete, updateMeta, refresh,
  } = useMedia(selectedClient)

  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [selectMode, setSelectMode] = useState(false)
  const [detailFile, setDetailFile] = useState<MediaFile | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Upload client — if client selected use that, otherwise prompt or use "general"
  const uploadClientId = selectedClient || 'general'
  const clients = data.clients

  // Filtered files
  const filtered = files.filter(f => {
    if (search) {
      const q = search.toLowerCase()
      const matchesName = (f.originalName || f.filename).toLowerCase().includes(q)
      const matchesTags = f.tags.some(t => t.includes(q))
      const matchesDesc = f.description.toLowerCase().includes(q)
      if (!matchesName && !matchesTags && !matchesDesc) return false
    }
    if (tagFilter && !f.tags.includes(tagFilter)) return false
    return true
  })

  // Group by client for display when no client filter
  const groupedByClient = !selectedClient
    ? filtered.reduce<Record<string, MediaFile[]>>((acc, f) => {
        const key = f.clientId
        if (!acc[key]) acc[key] = []
        acc[key].push(f)
        return acc
      }, {})
    : null

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    return client?.displayName || clientId
  }

  const getClientColor = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    return client?.color || '#6366f1'
  }

  // Selection helpers
  const toggleSelect = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const selectAll = () => {
    setSelected(new Set(filtered.map(f => `${f.clientId}/${f.filename}`)))
  }

  const clearSelection = () => {
    setSelected(new Set())
    setSelectMode(false)
  }

  // Upload handlers
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length === 0) return
    try {
      await upload(uploadClientId, droppedFiles)
      toast('success', `${droppedFiles.length} file${droppedFiles.length > 1 ? 's' : ''} uploaded`)
    } catch {
      toast('error', 'Upload failed')
    }
  }, [upload, uploadClientId, toast])

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles || selectedFiles.length === 0) return
    try {
      await upload(uploadClientId, selectedFiles)
      toast('success', `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} uploaded`)
    } catch {
      toast('error', 'Upload failed')
    }
    e.target.value = ''
  }, [upload, uploadClientId, toast])

  const handleBulkDelete = async () => {
    const items = Array.from(selected).map(key => {
      const [clientId, ...rest] = key.split('/')
      return { clientId, filename: rest.join('/') }
    })
    try {
      await bulkDelete(items)
      toast('success', `${items.length} file${items.length > 1 ? 's' : ''} deleted`)
      clearSelection()
    } catch {
      toast('error', 'Failed to delete files')
    }
  }

  const totalSize = files.reduce((s, f) => s + f.size, 0)

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center">
              <Image size={18} className="text-accent-cyan" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Media Library</h2>
              <p className="text-xs text-white/30">
                {files.length} file{files.length !== 1 ? 's' : ''} · {formatBytes(totalSize)}
                {selectedClient && (
                  <span className="ml-1">
                    · <span style={{ color: getClientColor(selectedClient) }}>{getClientName(selectedClient)}</span>
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh */}
            <button
              onClick={refresh}
              disabled={loading}
              className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>

            {/* View toggles */}
            <div className="flex items-center gap-0.5 bg-white/[0.03] rounded-lg p-0.5 border border-white/[0.06]">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'grid' ? 'bg-white/[0.08] text-white/70' : 'text-white/25 hover:text-white/50'
                }`}
              >
                <Grid3X3 size={14} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'list' ? 'bg-white/[0.08] text-white/70' : 'text-white/25 hover:text-white/50'
                }`}
              >
                <LayoutList size={14} />
              </button>
            </div>

            {/* Select mode */}
            <button
              onClick={() => { setSelectMode(!selectMode); if (selectMode) clearSelection() }}
              className={`p-2 rounded-lg transition-all ${
                selectMode ? 'bg-accent-violet/15 text-accent-violet' : 'text-white/30 hover:text-white/60 hover:bg-white/[0.04]'
              }`}
            >
              <CheckSquare size={15} />
            </button>

            {/* Upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-accent-violet/15 text-accent-violet hover:bg-accent-violet/25 transition-all border border-accent-violet/20"
            >
              <Upload size={14} />
              Upload
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,.svg"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* Search + Filters */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files, tags..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white/70 placeholder:text-white/20 focus:outline-none focus:border-white/[0.12]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/[0.06]"
              >
                <X size={12} className="text-white/30" />
              </button>
            )}
          </div>

          {/* Tag filter chips */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <Tag size={12} className="text-white/15 shrink-0" />
              {allTags.slice(0, 12).map(tag => (
                <button
                  key={tag}
                  onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-all border ${
                    tagFilter === tag
                      ? 'bg-accent-violet/15 text-accent-violet border-accent-violet/25'
                      : 'bg-white/[0.02] text-white/30 border-white/[0.06] hover:text-white/50 hover:bg-white/[0.04]'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bulk actions bar */}
        <AnimatePresence>
          {selectMode && selected.size > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 flex items-center gap-3 px-4 py-2.5 rounded-xl glass border border-accent-violet/20"
            >
              <span className="text-xs font-medium text-accent-violet">
                {selected.size} selected
              </span>
              <div className="flex-1" />
              <button onClick={selectAll} className="text-[11px] text-white/40 hover:text-white/70 transition-colors">
                Select all
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all border border-red-500/15"
              >
                <Trash2 size={12} />
                Delete
              </button>
              <button onClick={clearSelection} className="p-1 rounded hover:bg-white/[0.06]">
                <X size={14} className="text-white/30" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Upload progress */}
      <AnimatePresence>
        {uploading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="shrink-0 mb-4"
          >
            <div className="glass rounded-xl p-4 border border-accent-cyan/20">
              <div className="flex items-center gap-3 mb-2">
                <CloudUpload size={16} className="text-accent-cyan animate-pulse" />
                <span className="text-xs text-white/60">Uploading... {uploadProgress}%</span>
              </div>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-accent-violet to-accent-cyan rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content area */}
      <div
        className={`flex-1 overflow-y-auto scroll-area relative ${dragOver ? 'ring-2 ring-accent-cyan/30 ring-inset rounded-2xl' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        <AnimatePresence>
          {dragOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-surface/80 backdrop-blur-sm rounded-2xl"
            >
              <div className="text-center">
                <CloudUpload size={40} className="text-accent-cyan mx-auto mb-3" />
                <p className="text-sm font-semibold text-white/70">Drop files to upload</p>
                <p className="text-xs text-white/30 mt-1">
                  to <span style={{ color: getClientColor(uploadClientId) }}>{getClientName(uploadClientId)}</span>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw size={20} className="text-white/20 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            hasFiles={files.length > 0}
            onUpload={() => fileInputRef.current?.click()}
          />
        ) : groupedByClient ? (
          // Grouped by client (no client filter)
          <div className="space-y-6">
            {Object.entries(groupedByClient)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([clientId, clientFiles]) => (
                <div key={clientId}>
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: getClientColor(clientId) }}
                    />
                    <span className="text-xs font-semibold text-white/50">{getClientName(clientId)}</span>
                    <span className="text-[10px] text-white/20">{clientFiles.length}</span>
                  </div>
                  {viewMode === 'grid' ? (
                    <FileGrid
                      files={clientFiles}
                      selected={selected}
                      selectMode={selectMode}
                      onSelect={toggleSelect}
                      onClick={setDetailFile}
                    />
                  ) : (
                    <FileList
                      files={clientFiles}
                      selected={selected}
                      selectMode={selectMode}
                      onSelect={toggleSelect}
                      onClick={setDetailFile}
                    />
                  )}
                </div>
              ))}
          </div>
        ) : (
          // Single client view
          viewMode === 'grid' ? (
            <FileGrid
              files={filtered}
              selected={selected}
              selectMode={selectMode}
              onSelect={toggleSelect}
              onClick={setDetailFile}
            />
          ) : (
            <FileList
              files={filtered}
              selected={selected}
              selectMode={selectMode}
              onSelect={toggleSelect}
              onClick={setDetailFile}
            />
          )
        )}
      </div>

      {/* Detail modal */}
      {detailFile && (
        <MediaDetailModal
          file={detailFile}
          onClose={() => setDetailFile(null)}
          onDelete={(cid, fn) => { deleteFile(cid, fn); toast('info', 'File deleted') }}
          onUpdateMeta={updateMeta}
          allTags={allTags}
        />
      )}
    </div>
  )
}

// ── Grid View ────────────────────────────────────────────

function FileGrid({
  files,
  selected,
  selectMode,
  onSelect,
  onClick,
}: {
  files: MediaFile[]
  selected: Set<string>
  selectMode: boolean
  onSelect: (key: string) => void
  onClick: (file: MediaFile) => void
}) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
      {files.map((file, i) => {
        const key = `${file.clientId}/${file.filename}`
        const isSelected = selected.has(key)
        const isVid = isVideo(file.filename)
        const fileUrl = `${API}${file.url}`

        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.02 }}
            onClick={() => selectMode ? onSelect(key) : onClick(file)}
            className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all border ${
              isSelected
                ? 'border-accent-violet/50 ring-2 ring-accent-violet/20'
                : 'border-white/[0.06] hover:border-white/[0.12]'
            }`}
          >
            {/* Thumbnail */}
            {isVid ? (
              <div className="absolute inset-0 bg-surface-100 flex items-center justify-center">
                <Film size={28} className="text-white/15" />
                <video
                  src={fileUrl}
                  className="absolute inset-0 w-full h-full object-cover opacity-60"
                  muted
                  preload="metadata"
                />
              </div>
            ) : (
              <img
                src={fileUrl}
                alt={file.originalName || file.filename}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* File info on hover */}
            <div className="absolute bottom-0 left-0 right-0 p-2.5 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
              <p className="text-[11px] font-medium text-white/90 truncate">
                {file.originalName || file.filename}
              </p>
              <p className="text-[10px] text-white/40">{formatBytes(file.size)}</p>
              {file.tags.length > 0 && (
                <div className="flex gap-1 mt-1 overflow-hidden">
                  {file.tags.slice(0, 2).map(t => (
                    <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-accent-violet/20 text-accent-violet/70">
                      {t}
                    </span>
                  ))}
                  {file.tags.length > 2 && (
                    <span className="text-[9px] text-white/30">+{file.tags.length - 2}</span>
                  )}
                </div>
              )}
            </div>

            {/* Selection checkbox */}
            {selectMode && (
              <div className="absolute top-2 left-2">
                {isSelected ? (
                  <CheckSquare size={18} className="text-accent-violet drop-shadow-lg" />
                ) : (
                  <Square size={18} className="text-white/40 drop-shadow-lg" />
                )}
              </div>
            )}

            {/* Video badge */}
            {isVid && (
              <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/50 text-[9px] font-semibold text-white/70 uppercase">
                Video
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

// ── List View ────────────────────────────────────────────

function FileList({
  files,
  selected,
  selectMode,
  onSelect,
  onClick,
}: {
  files: MediaFile[]
  selected: Set<string>
  selectMode: boolean
  onSelect: (key: string) => void
  onClick: (file: MediaFile) => void
}) {
  return (
    <div className="space-y-1">
      {files.map((file, i) => {
        const key = `${file.clientId}/${file.filename}`
        const isSelected = selected.has(key)
        const isVid = isVideo(file.filename)
        const fileUrl = `${API}${file.url}`

        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.015 }}
            onClick={() => selectMode ? onSelect(key) : onClick(file)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all border ${
              isSelected
                ? 'border-accent-violet/30 bg-accent-violet/[0.04]'
                : 'border-transparent hover:bg-white/[0.02]'
            }`}
          >
            {/* Selection */}
            {selectMode && (
              isSelected
                ? <CheckSquare size={15} className="text-accent-violet shrink-0" />
                : <Square size={15} className="text-white/20 shrink-0" />
            )}

            {/* Thumbnail */}
            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-surface-100 flex items-center justify-center border border-white/[0.06]">
              {isVid ? (
                <Film size={16} className="text-white/20" />
              ) : (
                <img
                  src={fileUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white/70 truncate">
                {file.originalName || file.filename}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-white/25">{formatBytes(file.size)}</span>
                <span className="text-[10px] text-white/15">·</span>
                <span className="text-[10px] text-white/25">
                  {new Date(file.uploadedAt).toLocaleDateString('ro-RO')}
                </span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex gap-1 shrink-0">
              {file.tags.slice(0, 3).map(t => (
                <span key={t} className="text-[10px] px-2 py-0.5 rounded-md bg-accent-violet/10 text-accent-violet/60">
                  {t}
                </span>
              ))}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// ── Empty State ──────────────────────────────────────────

function EmptyState({ hasFiles, onUpload }: { hasFiles: boolean; onUpload: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
        {hasFiles ? (
          <Search size={22} className="text-white/15" />
        ) : (
          <FolderOpen size={22} className="text-white/15" />
        )}
      </div>
      <p className="text-sm font-medium text-white/30 mb-1">
        {hasFiles ? 'No files match your search' : 'No media files yet'}
      </p>
      <p className="text-xs text-white/15 mb-4">
        {hasFiles ? 'Try different search terms or filters' : 'Upload images and videos to get started'}
      </p>
      {!hasFiles && (
        <button
          onClick={onUpload}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-accent-violet/15 text-accent-violet hover:bg-accent-violet/25 transition-all border border-accent-violet/20"
        >
          <Upload size={14} />
          Upload Files
        </button>
      )}
    </div>
  )
}
