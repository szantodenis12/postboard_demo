import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Trash2,
  AlertCircle,
  Shield,
  User,
  Briefcase,
  Mail,
  Pencil,
  X,
  Check,
  Clock,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Zap,
} from 'lucide-react'
import { useApp } from '../../../core/context'
import { useTeamWorkflow } from '../hooks/useTeamWorkflow'
import { TaskDetailModal } from './TaskDetailModal'
import { WORKFLOW_STAGES } from '../../../core/types'
import type { TeamRole, WorkflowTask, WorkflowStage } from '../../../core/types'

const STAGE_COLORS: Record<WorkflowStage, string> = {
  brief: '#f59e0b',
  copy: '#06b6d4',
  design: '#ec4899',
  review: '#8b5cf6',
  approved: '#10b981',
  scheduled: '#6366f1',
}

const PRIORITY_ICONS: Record<string, typeof ArrowUp> = {
  urgent: Zap,
  high: ArrowUp,
  medium: ArrowRight,
  low: ArrowDown,
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'text-red-500',
  high: 'text-red-400',
  medium: 'text-amber-400',
  low: 'text-white/15',
}

const ROLE_CONFIG: Record<TeamRole, { label: string; color: string; icon: typeof Shield }> = {
  admin: { label: 'Admin', color: 'text-amber-400', icon: Shield },
  manager: { label: 'Manager', color: 'text-accent-violet', icon: Briefcase },
  operator: { label: 'Operator', color: 'text-accent-cyan', icon: User },
}

const AVATAR_COLORS = [
  '#7c3aed', '#06b6d4', '#f59e0b', '#ef4444', '#10b981',
  '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#6366f1',
]

export function TeamMembers() {
  const { data } = useApp()
  const { members, loading, addMember, updateMember, deleteMember, updateTask, deleteTask, tasksByMember } = useTeamWorkflow()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<WorkflowTask | null>(null)

  // Form state
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formRole, setFormRole] = useState<TeamRole>('operator')
  const [formClients, setFormClients] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const resetForm = () => {
    setFormName('')
    setFormEmail('')
    setFormRole('operator')
    setFormClients([])
    setShowForm(false)
    setEditing(null)
  }

  const handleAdd = async () => {
    if (!formName.trim()) return
    setSaving(true)
    try {
      await addMember({
        name: formName.trim(),
        email: formEmail.trim(),
        role: formRole,
        color: AVATAR_COLORS[members.length % AVATAR_COLORS.length],
        clients: formClients,
      })
      resetForm()
    } catch { /* silent */ }
    setSaving(false)
  }

  const handleEdit = (m: typeof members[0]) => {
    setEditing(m.id)
    setFormName(m.name)
    setFormEmail(m.email)
    setFormRole(m.role)
    setFormClients(m.clients)
    setShowForm(false)
  }

  const handleSaveEdit = async () => {
    if (!editing || !formName.trim()) return
    setSaving(true)
    try {
      await updateMember(editing, {
        name: formName.trim(),
        email: formEmail.trim(),
        role: formRole,
        clients: formClients,
      })
      resetForm()
    } catch { /* silent */ }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (deleting === id) {
      await deleteMember(id)
      setDeleting(null)
    } else {
      setDeleting(id)
      setTimeout(() => setDeleting(null), 3000)
    }
  }

  const toggleClient = (clientId: string) => {
    setFormClients(prev =>
      prev.includes(clientId) ? prev.filter(c => c !== clientId) : [...prev, clientId]
    )
  }

  const getClientName = (clientId: string) =>
    data.clients.find(c => c.id === clientId)?.displayName || clientId
  const getClientColor = (clientId: string) =>
    data.clients.find(c => c.id === clientId)?.color || '#7c3aed'

  return (
    <div className="h-full overflow-auto scroll-area">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Team Members</h2>
            <p className="text-sm text-white/30 mt-1">
              Manage your team and assign client responsibilities
            </p>
          </div>
          {!showForm && !editing && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent-violet/20 text-accent-violet text-sm font-medium hover:bg-accent-violet/30 transition-colors"
            >
              <Plus size={14} />
              Add Member
            </button>
          )}
        </div>

        {/* Add / Edit form */}
        <AnimatePresence>
          {(showForm || editing) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass rounded-2xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white/60">
                  {editing ? 'Edit Member' : 'New Member'}
                </span>
                <button onClick={resetForm} className="p-1.5 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/[0.04]">
                  <X size={14} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Name"
                  className="bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-accent-violet/40"
                />
                <input
                  type="email"
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  placeholder="Email"
                  className="bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-accent-violet/40"
                />
              </div>

              {/* Role selector */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/20 font-semibold mb-2 block">
                  Role
                </label>
                <div className="flex gap-2">
                  {(Object.entries(ROLE_CONFIG) as [TeamRole, typeof ROLE_CONFIG[TeamRole]][]).map(([role, cfg]) => {
                    const Icon = cfg.icon
                    const active = formRole === role
                    return (
                      <button
                        key={role}
                        onClick={() => setFormRole(role)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                          active
                            ? `bg-white/[0.08] ${cfg.color} border border-white/[0.1]`
                            : 'text-white/30 hover:text-white/50 hover:bg-white/[0.03]'
                        }`}
                      >
                        <Icon size={13} />
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Client assignment */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/20 font-semibold mb-2 block">
                  Assigned Clients
                </label>
                <div className="flex flex-wrap gap-2">
                  {data.clients.map(c => {
                    const active = formClients.includes(c.id)
                    return (
                      <button
                        key={c.id}
                        onClick={() => toggleClient(c.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                          active
                            ? 'bg-white/[0.08] text-white border border-white/[0.1]'
                            : 'text-white/25 hover:text-white/40 hover:bg-white/[0.03]'
                        }`}
                      >
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: active ? c.color : 'rgba(255,255,255,0.1)' }}
                        />
                        {c.displayName}
                      </button>
                    )
                  })}
                </div>
              </div>

              <button
                onClick={editing ? handleSaveEdit : handleAdd}
                disabled={!formName.trim() || saving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent-violet/20 text-accent-violet text-sm font-medium hover:bg-accent-violet/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Check size={14} />
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Member'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Members list */}
        {loading && members.length === 0 ? (
          <div className="text-center py-12 text-white/20 text-sm">Loading...</div>
        ) : members.length === 0 ? (
          <div className="text-center py-16 text-white/20 text-sm">
            No team members yet. Add your first team member above.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-[10px] uppercase tracking-widest text-white/20 font-semibold">
              Team ({members.length})
            </div>
            <AnimatePresence>
              {members.map((m, i) => {
                const cfg = ROLE_CONFIG[m.role]
                const RoleIcon = cfg.icon
                const memberTasks = tasksByMember[m.id] || []
                const activeTasks = memberTasks.filter(t => !['approved', 'scheduled'].includes(t.stage))
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.04 }}
                    className="glass rounded-xl p-4 group"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                        style={{ background: `${m.color}30`, color: m.color }}
                      >
                        {m.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Name + role */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-white">{m.name}</span>
                          <span className={`flex items-center gap-1 text-[11px] ${cfg.color}`}>
                            <RoleIcon size={10} />
                            {cfg.label}
                          </span>
                        </div>

                        {/* Email */}
                        {m.email && (
                          <div className="flex items-center gap-1 mt-0.5 text-[11px] text-white/25">
                            <Mail size={10} />
                            {m.email}
                          </div>
                        )}

                        {/* Assigned clients */}
                        {m.clients.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            {m.clients.map(cid => (
                              <span
                                key={cid}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] text-white/40 bg-white/[0.04]"
                              >
                                <div
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ background: getClientColor(cid) }}
                                />
                                {getClientName(cid)}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Active tasks — clickable */}
                        {activeTasks.length > 0 && (
                          <div className="mt-2.5 space-y-1">
                            <div className="text-[10px] text-white/20 font-medium mb-1">
                              {activeTasks.length} active task{activeTasks.length !== 1 ? 's' : ''}
                            </div>
                            {activeTasks.slice(0, 3).map(task => {
                              const PIcon = PRIORITY_ICONS[task.priority] || PRIORITY_ICONS.medium
                              const pColor = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium
                              const isOverdue = task.dueDate && new Date(task.dueDate) < new Date()
                              return (
                                <button
                                  key={task.id}
                                  onClick={(e) => { e.stopPropagation(); setSelectedTask(task) }}
                                  className="w-full flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.02] hover:bg-white/[0.05] transition-colors text-left"
                                >
                                  <PIcon size={9} className={pColor} />
                                  <span className="text-[11px] text-white/40 flex-1 truncate">{task.title}</span>
                                  <span
                                    className="text-[8px] px-1 py-0.5 rounded"
                                    style={{
                                      background: `${STAGE_COLORS[task.stage]}15`,
                                      color: STAGE_COLORS[task.stage],
                                    }}
                                  >
                                    {WORKFLOW_STAGES.find(ws => ws.id === task.stage)?.label}
                                  </span>
                                  {task.dueDate && (
                                    <span className={`text-[9px] ${isOverdue ? 'text-red-400' : 'text-white/15'}`}>
                                      <Clock size={8} />
                                    </span>
                                  )}
                                </button>
                              )
                            })}
                            {activeTasks.length > 3 && (
                              <div className="text-[10px] text-white/15 pl-2">
                                +{activeTasks.length - 3} more
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(m)}
                          className="p-2 rounded-lg text-white/20 hover:text-white/60 hover:bg-white/[0.04] transition-all"
                          title="Edit member"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className={`p-2 rounded-lg transition-all ${
                            deleting === m.id
                              ? 'text-red-400 bg-red-500/10'
                              : 'text-white/20 hover:text-red-400 hover:bg-red-500/10'
                          }`}
                          title={deleting === m.id ? 'Click again to confirm' : 'Remove member'}
                        >
                          {deleting === m.id ? <AlertCircle size={14} /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={async (id, updates) => {
            const updated = await updateTask(id, updates)
            setSelectedTask(updated)
          }}
          onDelete={deleteTask}
          members={members}
        />
      )}
    </div>
  )
}
