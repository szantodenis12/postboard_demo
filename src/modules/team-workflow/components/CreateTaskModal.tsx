import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Check,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Zap,
  FileText,
  Pencil,
  Palette,
  Eye,
  CheckCircle2,
  CalendarCheck,
} from 'lucide-react'
import { useApp } from '../../../core/context'
import { WORKFLOW_STAGES } from '../../../core/types'
import type { WorkflowStage, WorkflowTask, TeamMember } from '../../../core/types'

const STAGE_ICONS: Record<WorkflowStage, typeof FileText> = {
  brief: FileText,
  copy: Pencil,
  design: Palette,
  review: Eye,
  approved: CheckCircle2,
  scheduled: CalendarCheck,
}

const STAGE_COLORS: Record<WorkflowStage, string> = {
  brief: '#f59e0b',
  copy: '#06b6d4',
  design: '#ec4899',
  review: '#8b5cf6',
  approved: '#10b981',
  scheduled: '#6366f1',
}

const PRIORITIES = [
  { id: 'low' as const, label: 'Low', icon: ArrowDown, color: 'rgba(255,255,255,0.25)' },
  { id: 'medium' as const, label: 'Medium', icon: ArrowRight, color: '#fbbf24' },
  { id: 'high' as const, label: 'High', icon: ArrowUp, color: '#f87171' },
  { id: 'urgent' as const, label: 'Urgent', icon: Zap, color: '#ef4444' },
]

interface CreateTaskModalProps {
  initialStage?: WorkflowStage
  onClose: () => void
  onSubmit: (task: Omit<WorkflowTask, 'id' | 'createdAt' | 'updatedAt'>) => Promise<any>
  members: TeamMember[]
}

export function CreateTaskModal({ initialStage, onClose, onSubmit, members }: CreateTaskModalProps) {
  const { data } = useApp()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignee, setAssignee] = useState('')
  const [clientId, setClientId] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [stage, setStage] = useState<WorkflowStage>(initialStage || 'brief')
  const [dueDate, setDueDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  const validate = () => {
    const errs: Record<string, boolean> = {}
    if (!title.trim()) errs.title = true
    if (!assignee) errs.assignee = true
    if (!clientId) errs.clientId = true
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        assignedTo: assignee,
        clientId,
        priority,
        stage,
        dueDate: dueDate || undefined,
      })
      onClose()
    } catch { /* silent */ }
    setSaving(false)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          onClick={e => e.stopPropagation()}
          className="relative w-full max-w-lg glass rounded-2xl shadow-2xl shadow-black/50 overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 pt-5 pb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">New Task</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/[0.04] transition-all"
            >
              <X size={16} />
            </button>
          </div>

          {/* Form */}
          <div className="px-6 pb-6 space-y-4">
            {/* Title */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-white/20 font-semibold mb-1.5 block">
                Title <span className="text-red-400/60">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => { setTitle(e.target.value); setErrors(p => ({ ...p, title: false })) }}
                placeholder="What needs to be done?"
                autoFocus
                className={`w-full bg-white/[0.04] border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-accent-violet/40 ${
                  errors.title ? 'border-red-500/40' : 'border-white/[0.06]'
                }`}
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-white/20 font-semibold mb-1.5 block">
                Description
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Details, context, links..."
                rows={3}
                className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-accent-violet/40 resize-none"
              />
            </div>

            {/* Two-col: Assignee + Client */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/20 font-semibold mb-1.5 block">
                  Assignee <span className="text-red-400/60">*</span>
                </label>
                <select
                  value={assignee}
                  onChange={e => { setAssignee(e.target.value); setErrors(p => ({ ...p, assignee: false })) }}
                  className={`w-full bg-white/[0.04] border rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-accent-violet/40 ${
                    errors.assignee ? 'border-red-500/40' : 'border-white/[0.06]'
                  }`}
                >
                  <option value="">Select...</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/20 font-semibold mb-1.5 block">
                  Client <span className="text-red-400/60">*</span>
                </label>
                <select
                  value={clientId}
                  onChange={e => { setClientId(e.target.value); setErrors(p => ({ ...p, clientId: false })) }}
                  className={`w-full bg-white/[0.04] border rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-accent-violet/40 ${
                    errors.clientId ? 'border-red-500/40' : 'border-white/[0.06]'
                  }`}
                >
                  <option value="">Select...</option>
                  {data.clients.map(c => (
                    <option key={c.id} value={c.id}>{c.displayName}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Stage selector */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-white/20 font-semibold mb-2 block">
                Starting Stage
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {WORKFLOW_STAGES.map(s => {
                  const StIcon = STAGE_ICONS[s.id]
                  const active = stage === s.id
                  const color = STAGE_COLORS[s.id]
                  return (
                    <button
                      key={s.id}
                      onClick={() => setStage(s.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                        active ? 'border' : 'opacity-35 hover:opacity-60'
                      }`}
                      style={{
                        background: active ? `${color}15` : 'rgba(255,255,255,0.02)',
                        borderColor: active ? `${color}40` : 'transparent',
                        color: active ? color : 'rgba(255,255,255,0.4)',
                      }}
                    >
                      <StIcon size={12} />
                      {s.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Priority + Due date row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/20 font-semibold mb-2 block">
                  Priority
                </label>
                <div className="flex gap-1">
                  {PRIORITIES.map(p => {
                    const PIcon = p.icon
                    const active = priority === p.id
                    return (
                      <button
                        key={p.id}
                        onClick={() => setPriority(p.id as any)}
                        className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                          active ? 'border' : 'opacity-35 hover:opacity-60'
                        }`}
                        style={{
                          background: active ? `${p.color}15` : 'rgba(255,255,255,0.02)',
                          borderColor: active ? `${p.color}40` : 'transparent',
                          color: p.color,
                        }}
                        title={p.label}
                      >
                        <PIcon size={11} />
                        <span className="hidden sm:inline">{p.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/20 font-semibold mb-2 block">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/50 outline-none focus:border-accent-violet/40"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg text-sm text-white/30 hover:text-white/50 hover:bg-white/[0.04] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent-violet/20 text-accent-violet text-sm font-medium hover:bg-accent-violet/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Check size={14} />
                {saving ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
