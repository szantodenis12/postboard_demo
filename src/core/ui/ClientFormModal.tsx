import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface ClientFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (clientData: any) => Promise<void>
  initialData?: any
}

const COLORS = [
  '#7c3aed', '#06b6d4', '#f97316', '#ec4899', '#10b981', '#3b82f6',
  '#f43f5e', '#8b5cf6', '#14b8a6', '#eab308', '#6366f1', '#ef4444',
]

export function ClientFormModal({ isOpen, onClose, onSave, initialData }: ClientFormModalProps) {
  const [name, setName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '')
      setDisplayName(initialData.displayName || '')
      setColor(initialData.color || COLORS[0])
    } else {
      setName('')
      setDisplayName('')
      setColor(COLORS[0])
    }
  }, [initialData, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave({ name, displayName, color })
      onClose()
    } catch (error) {
      console.error('Failed to save client', error)
      alert('Failed to save client. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Only allow editing the internal ID/Name if it's a new client
  const isEditing = !!initialData

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 pl-64">
      <div 
        className="bg-[#1a1c23] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <h2 className="text-xl font-semibold text-white">
            {isEditing ? 'Edit Client' : 'New Client'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                Internal ID (e.g., brand-name)
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'))}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="epic-digital"
              />
              <p className="text-xs text-white/40 mt-1">This will be used as the URL slug.</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
              Display Name
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="Epic Digital Hub"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-3">
              Brand Color
            </label>
            <div className="grid grid-cols-6 gap-3">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    color === c 
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1a1c23] scale-110' 
                      : 'hover:scale-110 opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !displayName || (!isEditing && !name)}
              className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              {loading ? 'Saving...' : 'Save Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
