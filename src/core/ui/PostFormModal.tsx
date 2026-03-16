import React, { useState, useEffect } from 'react'
import { X, Calendar, MessageSquare, Image, Send, Layout, Hash, Plus, Clock, Sparkles, Video } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { CustomSelect } from './CustomSelect'

interface PostFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (postData: any) => Promise<void>
  initialData?: any
  clients: any[]
  selectedClientId?: string
}

const PLATFORMS = ['facebook', 'instagram', 'linkedin', 'tiktok', 'google']
const FORMATS = ['single-image', 'carousel', 'reel', 'stories', 'video', 'text']
const PILLARS = [
  'educational', 'promotional', 'engagement', 'behind-the-scenes', 
  'testimonial', 'inspirational', 'informational', 'entertainment'
]
const STATUSES = ['draft', 'approved', 'scheduled', 'published']

export function PostFormModal({ isOpen, onClose, onSave, initialData, clients, selectedClientId }: PostFormModalProps) {
  const [clientId, setClientId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('10:00')
  const [platform, setPlatform] = useState('facebook')
  const [format, setFormat] = useState('single-image')
  const [pillar, setPillar] = useState('educational')
  const [status, setStatus] = useState('draft')
  const [caption, setCaption] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [imagePrompt, setImagePrompt] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialData) {
      setClientId(initialData.clientId || '')
      setDate(initialData.date || '')
      setTime(initialData.time || '10:00')
      setPlatform(initialData.platform || 'facebook')
      setFormat(initialData.format || 'single-image')
      setPillar(initialData.pillar || 'educational')
      setStatus(initialData.status || 'draft')
      setCaption(initialData.caption || '')
      setHashtags(Array.isArray(initialData.hashtags) ? initialData.hashtags.join(', ') : (initialData.hashtags || ''))
      setImagePrompt(initialData.imagePrompt || '')
    } else {
      setClientId(selectedClientId || (clients[0]?.id || ''))
      setDate(new Date().toISOString().split('T')[0])
      setTime('10:00')
      setPlatform('facebook')
      setFormat('single-image')
      setPillar('educational')
      setStatus('draft')
      setCaption('')
      setHashtags('')
      setImagePrompt('')
    }
  }, [initialData, isOpen, selectedClientId, clients])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const hashtagArray = hashtags.split(',').map(h => h.trim().replace(/^#/, '')).filter(Boolean)
      await onSave({
        clientId,
        date,
        time,
        platform,
        format,
        pillar,
        status,
        caption,
        hashtags: hashtagArray,
        imagePrompt,
        files: selectedFiles
      })
      onClose()
    } catch (error) {
      console.error('Failed to save post', error)
      alert('Failed to save post. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#07070e]/80 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass relative w-full max-w-3xl overflow-hidden rounded-[32px] shadow-2xl z-10 flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-8 py-6 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02] shrink-0">
          <h2 className="text-2xl font-bold gradient-text">
            {initialData ? 'Edit Content' : 'Craft New Post'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
          <div className="grid grid-cols-2 gap-8">
            {/* Client Selection */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-white/25 font-bold flex items-center gap-1.5 ml-1">
                <Send size={12} className="text-accent-cyan/60" />
                Target Client
              </label>
              <CustomSelect
                required
                value={clientId}
                onChange={setClientId}
                options={clients.map(c => ({ value: c.id, label: c.displayName }))}
                placeholder="Target Client"
              />
            </div>

            {/* Date Selection */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-white/25 font-bold flex items-center gap-1.5 ml-1">
                <Calendar size={12} className="text-accent-violet/60" />
                Scheduling
              </label>
              <div className="flex gap-3">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-2xl px-5 py-3.5 text-white outline-none focus:border-accent-violet/30 transition-all"
                />
                <div className="relative">
                  <input
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-32 bg-white/[0.03] border border-white/[0.08] rounded-2xl px-5 py-3.5 text-white outline-none focus:border-accent-violet/30 transition-all"
                  />
                  <Clock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Platform */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-white/25 font-bold flex items-center gap-1.5 ml-1">
                <Layout size={12} className="text-pink-500/60" />
                Platform
              </label>
              <CustomSelect
                value={platform}
                onChange={setPlatform}
                options={PLATFORMS.map(p => ({ value: p, label: p }))}
                className="capitalize"
              />
            </div>

            {/* Format */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-white/25 font-bold ml-1">Format</label>
              <CustomSelect
                value={format}
                onChange={setFormat}
                options={FORMATS.map(f => ({ value: f, label: f.replace('-', ' ') }))}
                className="capitalize"
              />
            </div>

            {/* Pillar */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-white/25 font-bold ml-1">Content Pillar</label>
              <CustomSelect
                value={pillar}
                onChange={setPillar}
                options={PILLARS.map(p => ({ value: p, label: p.replace('-', ' ') }))}
                className="capitalize"
              />
            </div>
          </div>

          {/* Caption */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-wider text-white/25 font-bold flex items-center gap-1.5 ml-1">
              <MessageSquare size={12} className="text-accent-cyan/60" />
              Primary Caption
            </label>
            <textarea
              required
              rows={5}
              value={caption}
              onChange={e => setCaption(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl px-5 py-4 text-sm text-white placeholder-white/10 outline-none focus:border-accent-cyan/30 transition-all resize-none"
              placeholder="Tell your story..."
            />
          </div>

          {/* Hashtags */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-wider text-white/25 font-bold flex items-center gap-1.5 ml-1">
              <Hash size={12} className="text-accent-violet/60" />
              Hashtag Strategy
            </label>
            <input
              type="text"
              value={hashtags}
              onChange={e => setHashtags(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl px-5 py-3.5 text-sm text-white placeholder-white/10 outline-none focus:border-accent-violet/30 transition-all"
              placeholder="marketing, viral, strategy"
            />
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* Status */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-white/25 font-bold ml-1">Workflow Status</label>
              <CustomSelect
                value={status}
                onChange={setStatus}
                options={STATUSES.map(s => ({ value: s, label: s }))}
                className="capitalize"
              />
            </div>

            {/* Visual Description */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-white/25 font-bold flex items-center gap-1.5 ml-1">
                <Sparkles size={12} className="text-amber-400/60" />
                Visual Concept / Prompt
              </label>
              <input
                type="text"
                value={imagePrompt}
                onChange={e => setImagePrompt(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl px-5 py-3.5 text-sm text-white placeholder-white/10 outline-none focus:border-amber-400/20 transition-all"
                placeholder="Describe the desired visual..."
              />
            </div>
          </div>

          {/* Media Upload */}
          <div className="space-y-4">
            <label className="text-[10px] uppercase tracking-wider text-white/25 font-bold flex items-center gap-1.5 ml-1">
              <Image size={12} className="text-emerald-500/60" />
              Media Assets
            </label>
            
            <div className="grid grid-cols-4 gap-4">
              <label className="col-span-1 aspect-square flex flex-col items-center justify-center border-2 border-dashed border-white/[0.06] rounded-2xl hover:border-accent-cyan/40 hover:bg-accent-cyan/5 cursor-pointer transition-all group">
                <input 
                  type="file" 
                  multiple 
                  accept="image/*,video/*"
                  onChange={e => setSelectedFiles(prev => [...prev, ...Array.from(e.target.files || [])])}
                  className="hidden" 
                />
                <Plus size={24} className="text-white/20 group-hover:text-accent-cyan transition-colors mb-2" />
                <span className="text-[10px] text-white/20 font-bold uppercase tracking-tight">Upload</span>
              </label>

              {selectedFiles.map((file, i) => (
                <div key={i} className="group relative aspect-square rounded-2xl overflow-hidden glass border border-white/10">
                  {file.type.startsWith('image/') ? (
                    <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/5">
                      <Video size={20} className="text-white/20" />
                    </div>
                  )}
                  <button 
                    type="button"
                    onClick={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={18} className="text-white" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </form>

        <div className="px-8 py-6 border-t border-white/[0.06] flex justify-end gap-4 bg-white/[0.01] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-2xl font-bold text-white/40 hover:text-white hover:bg-white/5 transition-all text-sm"
          >
            Discard
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !caption || !clientId || !date}
            className="px-8 py-3 bg-gradient-to-r from-accent-violet to-accent-cyan hover:shadow-lg hover:shadow-accent-cyan/20 disabled:opacity-30 disabled:grayscale text-white rounded-2xl font-bold transition-all text-sm active:scale-95 flex items-center gap-2"
          >
            {loading ? 'Finalizing...' : (initialData ? 'Update Post' : 'Generate Content')}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

