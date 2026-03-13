import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Zap,
} from 'lucide-react'
import { useApp } from '../../../core/context'
import { useTeamWorkflow } from '../hooks/useTeamWorkflow'
import { WORKFLOW_STAGES } from '../../../core/types'
import { TaskDetailModal } from './TaskDetailModal'
import type { WorkflowStage, WorkflowTask } from '../../../core/types'

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

export function WorkloadView() {
  const { data } = useApp()
  const { members, tasks, tasksByMember, updateTask, deleteTask } = useTeamWorkflow()
  const [selectedTask, setSelectedTask] = useState<WorkflowTask | null>(null)

  const stats = useMemo(() => {
    const now = new Date()
    return members.map(m => {
      const memberTasks = tasksByMember[m.id] || []
      const active = memberTasks.filter(t => !['approved', 'scheduled'].includes(t.stage))
      const overdue = memberTasks.filter(t => t.dueDate && new Date(t.dueDate) < now && !['approved', 'scheduled'].includes(t.stage))
      const completed = memberTasks.filter(t => ['approved', 'scheduled'].includes(t.stage))
      const byStage: Record<WorkflowStage, number> = { brief: 0, copy: 0, design: 0, review: 0, approved: 0, scheduled: 0 }
      for (const t of memberTasks) byStage[t.stage]++
      const highPriority = active.filter(t => t.priority === 'high' || t.priority === 'urgent').length
      return { member: m, total: memberTasks.length, active, overdue, completed, byStage, highPriority }
    })
  }, [members, tasksByMember])

  const totalTasks = tasks.length
  const totalActive = tasks.filter(t => !['approved', 'scheduled'].includes(t.stage)).length
  const totalOverdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && !['approved', 'scheduled'].includes(t.stage)).length
  const totalCompleted = tasks.filter(t => ['approved', 'scheduled'].includes(t.stage)).length

  const getClientName = (clientId: string) =>
    data.clients.find(c => c.id === clientId)?.displayName || clientId

  return (
    <div className="h-full overflow-auto scroll-area">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-white">Workload Overview</h2>
          <p className="text-sm text-white/30 mt-1">
            Team capacity and task distribution
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Tasks', value: totalTasks, color: 'text-white/60' },
            { label: 'Active', value: totalActive, color: 'text-accent-cyan' },
            { label: 'Overdue', value: totalOverdue, color: totalOverdue > 0 ? 'text-red-400' : 'text-white/20' },
            { label: 'Completed', value: totalCompleted, color: 'text-emerald-400' },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-xl p-4"
            >
              <div className="text-[10px] uppercase tracking-widest text-white/20 font-semibold">
                {card.label}
              </div>
              <div className={`text-2xl font-bold mt-1 ${card.color}`}>
                {card.value}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Per-member breakdown */}
        {members.length === 0 ? (
          <div className="text-center py-16 text-white/20 text-sm">
            Add team members to see workload distribution.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-[10px] uppercase tracking-widest text-white/20 font-semibold">
              Per Member
            </div>
            {stats.map((s, i) => {
              return (
                <motion.div
                  key={s.member.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="glass rounded-xl p-4 space-y-3"
                >
                  {/* Member header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                        style={{ background: `${s.member.color}30`, color: s.member.color }}
                      >
                        {s.member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{s.member.name}</div>
                        <div className="text-[11px] text-white/25 capitalize">{s.member.role}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-[11px]">
                      {s.highPriority > 0 && (
                        <span className="flex items-center gap-1 text-red-400">
                          <ArrowUp size={10} />
                          {s.highPriority} high
                        </span>
                      )}
                      {s.overdue.length > 0 && (
                        <span className="flex items-center gap-1 text-red-400">
                          <AlertTriangle size={10} />
                          {s.overdue.length} overdue
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 size={10} />
                        {s.completed.length}
                      </span>
                      <span className="text-white/30">
                        {s.active.length} active
                      </span>
                    </div>
                  </div>

                  {/* Stage distribution bar */}
                  {s.total > 0 && (
                    <div className="space-y-1.5">
                      <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden flex">
                        {WORKFLOW_STAGES.map(stage => {
                          const count = s.byStage[stage.id]
                          if (count === 0) return null
                          const width = (count / s.total) * 100
                          return (
                            <div
                              key={stage.id}
                              className="h-full first:rounded-l-full last:rounded-r-full"
                              style={{
                                width: `${width}%`,
                                background: STAGE_COLORS[stage.id],
                                opacity: 0.7,
                              }}
                              title={`${stage.label}: ${count}`}
                            />
                          )
                        })}
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        {WORKFLOW_STAGES.map(stage => {
                          const count = s.byStage[stage.id]
                          if (count === 0) return null
                          return (
                            <span
                              key={stage.id}
                              className="flex items-center gap-1 text-[10px]"
                              style={{ color: STAGE_COLORS[stage.id] }}
                            >
                              <div
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ background: STAGE_COLORS[stage.id] }}
                              />
                              {stage.label} {count}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Active task list */}
                  {s.active.length > 0 && (
                    <div className="space-y-1">
                      {s.active.map(task => {
                        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date()
                        const PIcon = PRIORITY_ICONS[task.priority] || PRIORITY_ICONS.medium
                        const pColor = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium
                        return (
                          <button
                            key={task.id}
                            onClick={() => setSelectedTask(task)}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors text-left"
                          >
                            <PIcon size={10} className={pColor} />
                            <span className="text-xs text-white/50 flex-1 truncate">
                              {task.title}
                            </span>
                            <span
                              className="text-[9px] px-1.5 py-0.5 rounded-md"
                              style={{
                                background: `${STAGE_COLORS[task.stage]}15`,
                                color: STAGE_COLORS[task.stage],
                              }}
                            >
                              {WORKFLOW_STAGES.find(ws => ws.id === task.stage)?.label}
                            </span>
                            <span className="text-[10px] text-white/20">
                              {getClientName(task.clientId)}
                            </span>
                            {task.dueDate && (
                              <span className={`flex items-center gap-0.5 text-[9px] ${isOverdue ? 'text-red-400' : 'text-white/15'}`}>
                                <Clock size={8} />
                                {new Date(task.dueDate).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </motion.div>
              )
            })}
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
