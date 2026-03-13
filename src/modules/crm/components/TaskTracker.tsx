import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ListTodo, Plus, X, Calendar, User, Flag, ChevronDown,
  CheckCircle2, Circle, Clock, Trash2, GripVertical,
  AlertTriangle, ArrowUp, ArrowRight, ArrowDown, Filter,
} from 'lucide-react'
import { useApp } from '../../../core/context'
import { useCRM, type CRMTask, type TaskStatus, type TaskPriority } from '../hooks/useCRM'

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; icon: typeof Circle }> = {
  'todo': { label: 'To Do', color: '#f59e0b', icon: Circle },
  'in-progress': { label: 'In Progress', color: '#3b82f6', icon: Clock },
  'done': { label: 'Done', color: '#10b981', icon: CheckCircle2 },
}

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; icon: typeof Flag }> = {
  high: { label: 'High', color: '#ef4444', icon: ArrowUp },
  medium: { label: 'Medium', color: '#f59e0b', icon: ArrowRight },
  low: { label: 'Low', color: '#64748b', icon: ArrowDown },
}

const COLUMNS: TaskStatus[] = ['todo', 'in-progress', 'done']

export function TaskTracker() {
  const { data, selectedClient } = useApp()
  const crm = useCRM()
  const [showAdd, setShowAdd] = useState(false)
  const [addToColumn, setAddToColumn] = useState<TaskStatus>('todo')
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all')
  const [newTask, setNewTask] = useState({
    title: '', description: '', priority: 'medium' as TaskPriority, dueDate: '', assignee: '',
  })

  const allTasks = useMemo(() => {
    let tasks = crm.data.tasks
    if (selectedClient) tasks = tasks.filter(t => t.clientId === selectedClient)
    if (filterPriority !== 'all') tasks = tasks.filter(t => t.priority === filterPriority)
    return tasks
  }, [crm.data.tasks, selectedClient, filterPriority])

  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, CRMTask[]> = { todo: [], 'in-progress': [], done: [] }
    for (const task of allTasks) {
      if (map[task.status as TaskStatus]) {
        map[task.status as TaskStatus].push(task)
      }
    }
    // Sort: high priority first, then by due date
    for (const status of COLUMNS) {
      map[status].sort((a, b) => {
        const pOrder = { high: 0, medium: 1, low: 2 }
        const diff = (pOrder[a.priority as TaskPriority] ?? 1) - (pOrder[b.priority as TaskPriority] ?? 1)
        if (diff !== 0) return diff
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate)
        if (a.dueDate) return -1
        if (b.dueDate) return 1
        return b.createdAt.localeCompare(a.createdAt)
      })
    }
    return map
  }, [allTasks])

  const clientLookup = useMemo(() => {
    const map: Record<string, { name: string; color: string }> = {}
    for (const c of data.clients) map[c.id] = { name: c.displayName, color: c.color }
    return map
  }, [data.clients])

  function openAdd(column: TaskStatus) {
    setAddToColumn(column)
    setNewTask({ title: '', description: '', priority: 'medium', dueDate: '', assignee: '' })
    setShowAdd(true)
  }

  async function submitTask() {
    if (!newTask.title.trim()) return
    const clientId = selectedClient || data.clients[0]?.id
    if (!clientId) return
    await crm.addTask({
      clientId,
      title: newTask.title,
      description: newTask.description || undefined,
      status: addToColumn,
      priority: newTask.priority,
      dueDate: newTask.dueDate || undefined,
      assignee: newTask.assignee || undefined,
    })
    setShowAdd(false)
  }

  async function cycleStatus(task: CRMTask) {
    const next: Record<TaskStatus, TaskStatus> = { todo: 'in-progress', 'in-progress': 'done', done: 'todo' }
    await crm.updateTask(task.id, { status: next[task.status as TaskStatus] || 'todo' })
  }

  async function cyclePriority(task: CRMTask) {
    const next: Record<TaskPriority, TaskPriority> = { low: 'medium', medium: 'high', high: 'low' }
    await crm.updateTask(task.id, { priority: next[task.priority as TaskPriority] || 'medium' })
  }

  const isOverdue = (task: CRMTask) => task.dueDate && task.status !== 'done' && new Date(task.dueDate) < new Date()

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Task Tracker</h2>
          <p className="text-sm text-white/30">
            {allTasks.length} tasks {selectedClient ? `for ${clientLookup[selectedClient]?.name}` : 'across all clients'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Priority filter */}
          <div className="flex items-center gap-1 glass rounded-lg px-1 py-1">
            <Filter size={13} className="text-white/30 ml-2" />
            {(['all', 'high', 'medium', 'low'] as const).map(p => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={`px-2.5 py-1.5 rounded text-[11px] font-medium transition-all ${
                  filterPriority === p ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'
                }`}
              >
                {p === 'all' ? 'All' : PRIORITY_CONFIG[p].label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* No client selected */}
      {!selectedClient && data.clients.length > 0 && allTasks.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <ListTodo size={40} className="text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm mb-1">Select a client to view tasks</p>
            <p className="text-white/15 text-xs">or tasks will show across all clients</p>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex-1 grid grid-cols-3 gap-4 min-h-0">
        {COLUMNS.map(status => {
          const config = STATUS_CONFIG[status]
          const Icon = config.icon
          const tasks = tasksByStatus[status]

          return (
            <motion.div
              key={status}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col min-h-0"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <Icon size={14} style={{ color: config.color }} />
                  <span className="text-sm font-semibold text-white/60">{config.label}</span>
                  <span className="text-[11px] font-mono text-white/20 bg-white/[0.04] px-1.5 rounded">
                    {tasks.length}
                  </span>
                </div>
                <button
                  onClick={() => openAdd(status)}
                  className="p-1 rounded hover:bg-white/[0.06] text-white/20 hover:text-white/50 transition-all"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto scroll-area space-y-2 pr-1">
                <AnimatePresence mode="popLayout">
                  {tasks.map(task => {
                    const pConfig = PRIORITY_CONFIG[task.priority as TaskPriority] || PRIORITY_CONFIG.medium
                    const PIcon = pConfig.icon
                    const client = clientLookup[task.clientId]
                    const overdue = isOverdue(task)

                    return (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`glass rounded-lg p-3.5 group cursor-default ${
                          overdue ? 'border border-red-500/20' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <button
                            onClick={() => cycleStatus(task)}
                            className="mt-0.5 shrink-0 transition-transform hover:scale-110"
                            title={`Move to ${STATUS_CONFIG[({ todo: 'in-progress', 'in-progress': 'done', done: 'todo' } as const)[status]]?.label}`}
                          >
                            <Icon size={16} style={{ color: config.color }} />
                          </button>
                          <p className={`text-sm font-medium flex-1 ${status === 'done' ? 'text-white/30 line-through' : 'text-white/80'}`}>
                            {task.title}
                          </p>
                          <button
                            onClick={() => crm.deleteTask(task.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded text-white/20 hover:text-red-400 transition-all shrink-0"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>

                        {task.description && (
                          <p className="text-xs text-white/25 mb-2 ml-6 line-clamp-2">{task.description}</p>
                        )}

                        <div className="flex items-center gap-2 ml-6 flex-wrap">
                          {/* Priority */}
                          <button
                            onClick={() => cyclePriority(task)}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-all hover:brightness-125"
                            style={{ background: `${pConfig.color}15`, color: pConfig.color }}
                          >
                            <PIcon size={10} />
                            {pConfig.label}
                          </button>

                          {/* Client badge */}
                          {!selectedClient && client && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                              style={{ background: `${client.color}15`, color: `${client.color}cc` }}
                            >
                              {client.name}
                            </span>
                          )}

                          {/* Due date */}
                          {task.dueDate && (
                            <span className={`flex items-center gap-1 text-[10px] ${overdue ? 'text-red-400' : 'text-white/25'}`}>
                              {overdue && <AlertTriangle size={10} />}
                              <Calendar size={10} />
                              {new Date(task.dueDate).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}
                            </span>
                          )}

                          {/* Assignee */}
                          {task.assignee && (
                            <span className="flex items-center gap-1 text-[10px] text-white/25">
                              <User size={10} />{task.assignee}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>

                {/* Empty column */}
                {tasks.length === 0 && (
                  <div className="flex items-center justify-center h-24 rounded-lg border border-dashed border-white/[0.06]">
                    <p className="text-xs text-white/15">No tasks</p>
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Add Task Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowAdd(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white">
                  New Task — {STATUS_CONFIG[addToColumn].label}
                </h3>
                <button onClick={() => setShowAdd(false)} className="p-1 rounded text-white/30 hover:text-white/60">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[11px] text-white/30 font-medium mb-1 block">Title</label>
                  <input
                    value={newTask.title}
                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Task title..."
                    className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-accent-violet/40"
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && submitTask()}
                  />
                </div>

                <div>
                  <label className="text-[11px] text-white/30 font-medium mb-1 block">Description</label>
                  <textarea
                    value={newTask.description}
                    onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Optional details..."
                    rows={2}
                    className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-accent-violet/40 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-white/30 font-medium mb-1 block">Priority</label>
                    <select
                      value={newTask.priority}
                      onChange={e => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
                      className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-accent-violet/40"
                    >
                      <option value="low" className="bg-surface-100">Low</option>
                      <option value="medium" className="bg-surface-100">Medium</option>
                      <option value="high" className="bg-surface-100">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-white/30 font-medium mb-1 block">Due Date</label>
                    <input
                      type="date"
                      value={newTask.dueDate}
                      onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-accent-violet/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-white/30 font-medium mb-1 block">Assignee</label>
                  <input
                    value={newTask.assignee}
                    onChange={e => setNewTask({ ...newTask, assignee: e.target.value })}
                    placeholder="Who's responsible..."
                    className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-accent-violet/40"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowAdd(false)}
                    className="px-4 py-2 rounded-lg text-sm text-white/40 hover:text-white/60 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitTask}
                    disabled={!newTask.title.trim()}
                    className="px-5 py-2 rounded-lg text-sm font-medium bg-accent-violet text-white hover:bg-accent-violet/80 transition-all disabled:opacity-30"
                  >
                    Create Task
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
