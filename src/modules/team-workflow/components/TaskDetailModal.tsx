import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Trash2,
  AlertCircle,
  Clock,
  Calendar,
  User,
  Briefcase,
  FileText,
  Pencil,
  Palette,
  Eye,
  CheckCircle2,
  CalendarCheck,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Zap,
  ChevronRight,
  Save,
  SquarePen,
} from 'lucide-react'
import { useApp } from '../../../core/context'
import { CustomSelect } from '../../../core/ui/CustomSelect'
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

const PRIORITY_CONFIG: Record<string, { icon: typeof ArrowUp; color: string; label: string }> = {
  urgent: { icon: Zap, color: '#ef4444', label: 'Urgent' },
  high: { icon: ArrowUp, color: '#f87171', label: 'High' },
  medium: { icon: ArrowRight, color: '#fbbf24', label: 'Medium' },
  low: { icon: ArrowDown, color: 'rgba(255,255,255,0.25)', label: 'Low' },
}

interface TaskDetailModalProps {
  task: WorkflowTask
  onClose: () => void
  onUpdate: (id: string, updates: Partial<WorkflowTask>) => Promise<any>
  onDelete: (id: string) => Promise<void>
  members: TeamMember[]
}

export function TaskDetailModal({ task, onClose, onUpdate, onDelete, members }: TaskDetailModalProps) {
  const { data } = useApp()

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Editable fields
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [assignee, setAssignee] = useState(task.assignedTo)
  const [clientId, setClientId] = useState(task.clientId)
  const [priority, setPriority] = useState(task.priority)
  const [stage, setStage] = useState(task.stage)
  const [dueDate, setDueDate] = useState(task.dueDate || '')

  // Reset state when task changes
  useEffect(() => {
    setTitle(task.title)
    setDescription(task.description || '')
    setAssignee(task.assignedTo)
    setClientId(task.clientId)
    setPriority(task.priority)
    setStage(task.stage)
    setDueDate(task.dueDate || '')
    setEditing(false)
    setConfirmDelete(false)
  }, [task])

  const member = members.find(m => m.id === task.assignedTo)
  const client = data.clients.find(c => c.id === task.clientId)
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !['approved', 'scheduled'].includes(task.stage)
  const priCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium

  const hasChanges =
    title !== task.title ||
    description !== (task.description || '') ||
    assignee !== task.assignedTo ||
    clientId !== task.clientId ||
    priority !== task.priority ||
    stage !== task.stage ||
    dueDate !== (task.dueDate || '')

  const handleSave = async () => {
    if (!title.trim() || !assignee || !clientId) return
    setSaving(true)
    try {
      await onUpdate(task.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        assignedTo: assignee,
        clientId,
        priority,
        stage,
        dueDate: dueDate || undefined,
      })
      setEditing(false)
    } catch { /* silent */ }
    setSaving(false)
  }

  const handleStageClick = async (newStage: WorkflowStage) => {
    if (editing) {
      setStage(newStage)
    } else {
      // Quick-advance without entering edit mode
      setSaving(true)
      try {
        await onUpdate(task.id, { stage: newStage })
      } catch { /* silent */ }
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 4000)
      return
    }
    setSaving(true)
    try {
      await onDelete(task.id)
      onClose()
    } catch { /* silent */ }
    setSaving(false)
  }

  const handleCancel = () => {
    setTitle(task.title)
    setDescription(task.description || '')
    setAssignee(task.assignedTo)
    setClientId(task.clientId)
    setPriority(task.priority)
    setStage(task.stage)
    setDueDate(task.dueDate || '')
    setEditing(false)
  }

  const currentStage = editing ? stage : task.stage
  const currentPriority = editing ? priority : task.priority
  const currentPriCfg = PRIORITY_CONFIG[currentPriority] || PRIORITY_CONFIG.medium
  const CurrentPriIcon = currentPriCfg.icon

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
          className="relative w-full max-w-2xl glass rounded-2xl shadow-2xl shadow-black/50 overflow-hidden"
        >
          {/* Top color bar */}
          <div
            className="h-1 w-full"
            style={{ background: STAGE_COLORS[currentStage] }}
          />

          {/* Header */}
          <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {editing ? (
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-lg text-white font-semibold placeholder:text-white/20 outline-none focus:border-accent-violet/40"
                  placeholder="Task title"
                  autoFocus
                />
              ) : (
                <h2 className="text-lg font-semibold text-white leading-snug">{task.title}</h2>
              )}

              {/* Meta row */}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {client && (
                  <span className="flex items-center gap-1.5 text-xs text-white/40">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: client.color }}
                    />
                    {client.displayName}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs" style={{ color: currentPriCfg.color }}>
                  <CurrentPriIcon size={11} />
                  {currentPriCfg.label}
                </span>
                {isOverdue && !editing && (
                  <span className="flex items-center gap-1 text-xs text-red-400">
                    <AlertCircle size={11} />
                    Overdue
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="p-2 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/[0.04] transition-all"
                  title="Edit task"
                >
                  <SquarePen size={16} />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/[0.04] transition-all"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Stage pipeline */}
          <div className="px-6 pb-4">
            <label className="text-[10px] uppercase tracking-widest text-white/20 font-semibold mb-2.5 block">
              Pipeline
            </label>
            <div className="flex items-center gap-1">
              {WORKFLOW_STAGES.map((s, i) => {
                const StIcon = STAGE_ICONS[s.id]
                const isActive = s.id === currentStage
                const stageIdx = WORKFLOW_STAGES.findIndex(x => x.id === currentStage)
                const isPast = i < stageIdx
                const color = STAGE_COLORS[s.id]

                return (
                  <div key={s.id} className="flex items-center gap-1 flex-1">
                    <button
                      onClick={() => handleStageClick(s.id)}
                      disabled={saving}
                      className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all w-full justify-center ${
                        isActive
                          ? 'border'
                          : isPast
                            ? 'opacity-50 hover:opacity-80'
                            : 'opacity-30 hover:opacity-60'
                      }`}
                      style={{
                        background: isActive ? `${color}15` : isPast ? `${color}08` : 'rgba(255,255,255,0.02)',
                        borderColor: isActive ? `${color}40` : 'transparent',
                        color: isActive || isPast ? color : 'rgba(255,255,255,0.3)',
                      }}
                    >
                      <StIcon size={12} />
                      <span className="hidden sm:inline">{s.label}</span>
                    </button>
                    {i < WORKFLOW_STAGES.length - 1 && (
                      <ChevronRight size={10} className="text-white/10 shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Body content */}
          <div className="px-6 pb-6 space-y-4">
            {/* Description */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-white/20 font-semibold mb-2 block">
                Description
              </label>
              {editing ? (
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Add a description..."
                  rows={3}
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-accent-violet/40 resize-none"
                />
              ) : (
                <p className="text-sm text-white/40 leading-relaxed min-h-[40px]">
                  {task.description || 'No description'}
                </p>
              )}
            </div>

            {/* Fields grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Assignee */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/20 font-semibold mb-2 flex items-center gap-1.5">
                  <User size={10} />
                  Assignee
                </label>
                {editing ? (
                  <CustomSelect
                    value={assignee}
                    onChange={setAssignee}
                    options={[
                      { value: '', label: 'Unassigned' },
                      ...members.map(m => ({ value: m.id, label: m.name }))
                    ]}
                    placeholder="Assignee"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    {member ? (
                      <>
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-[10px] shrink-0"
                          style={{ background: `${member.color}30`, color: member.color }}
                        >
                          {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm text-white/60">{member.name}</span>
                      </>
                    ) : (
                      <span className="text-sm text-white/25">Unassigned</span>
                    )}
                  </div>
                )}
              </div>

              {/* Client */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/20 font-semibold mb-2 flex items-center gap-1.5">
                  <Briefcase size={10} />
                  Client
                </label>
                {editing ? (
                  <CustomSelect
                    value={clientId}
                    onChange={setClientId}
                    options={[
                      { value: '', label: 'Select client...' },
                      ...data.clients.map(c => ({ value: c.id, label: c.displayName }))
                    ]}
                    placeholder="Client"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    {client ? (
                      <>
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: client.color }}
                        />
                        <span className="text-sm text-white/60">{client.displayName}</span>
                      </>
                    ) : (
                      <span className="text-sm text-white/25">No client</span>
                    )}
                  </div>
                )}
              </div>

              {/* Priority */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/20 font-semibold mb-2 flex items-center gap-1.5">
                  <ArrowUp size={10} />
                  Priority
                </label>
                {editing ? (
                  <div className="flex gap-1.5">
                    {(['low', 'medium', 'high', 'urgent'] as const).map(p => {
                      const cfg = PRIORITY_CONFIG[p]
                      const PIcon = cfg.icon
                      const active = priority === p
                      return (
                        <button
                          key={p}
                          onClick={() => setPriority(p as any)}
                          className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                            active
                              ? 'border'
                              : 'opacity-40 hover:opacity-70'
                          }`}
                          style={{
                            background: active ? `${cfg.color}15` : 'rgba(255,255,255,0.02)',
                            borderColor: active ? `${cfg.color}40` : 'transparent',
                            color: cfg.color,
                          }}
                        >
                          <PIcon size={12} />
                          {cfg.label}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <CurrentPriIcon size={13} style={{ color: priCfg.color }} />
                    <span className="text-sm" style={{ color: priCfg.color }}>
                      {priCfg.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Due date */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/20 font-semibold mb-2 flex items-center gap-1.5">
                  <Calendar size={10} />
                  Due Date
                </label>
                {editing ? (
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white/60 outline-none focus:border-accent-violet/40"
                  />
                ) : (
                  <span className={`text-sm flex items-center gap-1.5 ${isOverdue ? 'text-red-400' : 'text-white/40'}`}>
                    <Clock size={12} />
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })
                      : 'No due date'
                    }
                  </span>
                )}
              </div>
            </div>

            {/* Timestamps */}
            <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4 text-[10px] text-white/15">
                <span>Created: {new Date(task.createdAt).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <span>Updated: {new Date(task.updatedAt).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                {editing ? (
                  <>
                    <button
                      onClick={handleCancel}
                      className="px-3 py-2 rounded-lg text-xs text-white/30 hover:text-white/50 hover:bg-white/[0.04] transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={!title.trim() || !assignee || !clientId || saving || !hasChanges}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-violet/20 text-accent-violet text-xs font-medium hover:bg-accent-violet/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Save size={12} />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleDelete}
                    disabled={saving}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all ${
                      confirmDelete
                        ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                        : 'text-white/20 hover:text-red-400 hover:bg-red-500/10'
                    }`}
                  >
                    {confirmDelete ? (
                      <>
                        <AlertCircle size={12} />
                        Click again to delete
                      </>
                    ) : (
                      <>
                        <Trash2 size={12} />
                        Delete
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
