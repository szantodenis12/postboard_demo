import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import {
  Plus,
  Clock,
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
  GripVertical,
  LayoutGrid,
} from 'lucide-react'
import { useApp } from '../../../core/context'
import { useTeamWorkflow } from '../hooks/useTeamWorkflow'
import { WORKFLOW_STAGES } from '../../../core/types'
import { TaskDetailModal } from './TaskDetailModal'
import { CreateTaskModal } from './CreateTaskModal'
import type { WorkflowStage, WorkflowTask } from '../../../core/types'

// ── Config maps ─────────────────────────────────────────

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

const PRIORITY_ICON: Record<string, typeof ArrowUp> = {
  urgent: Zap,
  high: ArrowUp,
  medium: ArrowRight,
  low: ArrowDown,
}

const PRIORITY_COLOR: Record<string, string> = {
  urgent: 'text-red-500',
  high: 'text-red-400',
  medium: 'text-amber-400',
  low: 'text-white/20',
}

const PRIORITY_SORT: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
}

// ── Droppable Column ────────────────────────────────────

function DroppableColumn({
  stageId,
  children,
  isOver,
}: {
  stageId: WorkflowStage
  children: React.ReactNode
  isOver: boolean
}) {
  const { setNodeRef } = useDroppable({ id: stageId })
  const color = STAGE_COLORS[stageId]

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 space-y-2 min-h-[120px] rounded-xl p-1.5 transition-all duration-200 ${
        isOver ? 'ring-1' : ''
      }`}
      style={{
        background: isOver ? `${color}06` : 'transparent',
        ...(isOver ? { boxShadow: `inset 0 0 0 1px ${color}30` } : {}),
      }}
    >
      {children}
    </div>
  )
}

// ── Draggable Task Card ─────────────────────────────────

function DraggableTaskCard({
  task,
  memberName,
  memberColor,
  clientName,
  clientColor,
  onClick,
  isDragOverlay,
}: {
  task: WorkflowTask
  memberName?: string
  memberColor?: string
  clientName: string
  clientColor: string
  onClick: () => void
  isDragOverlay?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  })

  const PIcon = PRIORITY_ICON[task.priority] || PRIORITY_ICON.medium
  const pColor = PRIORITY_COLOR[task.priority] || PRIORITY_COLOR.medium
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !['approved', 'scheduled'].includes(task.stage)

  const style = isDragOverlay
    ? {}
    : {
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
        opacity: isDragging ? 0.3 : 1,
      }

  return (
    <div
      ref={isDragOverlay ? undefined : setNodeRef}
      style={style}
      className={`glass rounded-xl p-3 group cursor-pointer transition-all hover:bg-white/[0.04] ${
        isDragOverlay ? 'shadow-2xl shadow-black/60 ring-1 ring-white/[0.08]' : ''
      } ${isOverdue ? 'border-red-500/20' : ''}`}
      onClick={isDragging ? undefined : onClick}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <div
          {...(isDragOverlay ? {} : { ...attributes, ...listeners })}
          className="mt-0.5 p-0.5 rounded text-white/[0.06] hover:text-white/20 cursor-grab active:cursor-grabbing transition-colors shrink-0"
          onClick={e => e.stopPropagation()}
        >
          <GripVertical size={12} />
        </div>

        {/* Priority icon */}
        <PIcon size={12} className={`mt-0.5 shrink-0 ${pColor}`} />

        {/* Title */}
        <span className="text-sm text-white font-medium leading-snug flex-1 line-clamp-2">
          {task.title}
        </span>
      </div>

      {/* Description preview */}
      {task.description && (
        <p className="text-[11px] text-white/20 mt-1.5 ml-[44px] line-clamp-1">
          {task.description}
        </p>
      )}

      {/* Meta row */}
      <div className="flex items-center gap-2 mt-2.5 ml-[44px] flex-wrap">
        {/* Client badge */}
        <span className="flex items-center gap-1 text-[10px] text-white/30 px-1.5 py-0.5 rounded-md bg-white/[0.04]">
          <div
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: clientColor }}
          />
          {clientName}
        </span>

        {/* Assignee badge */}
        {memberName && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-md"
            style={{ background: `${memberColor || '#7c3aed'}15`, color: memberColor || '#7c3aed' }}
          >
            {memberName.split(' ')[0]}
          </span>
        )}

        {/* Due date */}
        {task.dueDate && (
          <span className={`flex items-center gap-0.5 text-[10px] ${isOverdue ? 'text-red-400 font-medium' : 'text-white/20'}`}>
            <Clock size={9} />
            {new Date(task.dueDate).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Static Card (for DragOverlay, no hooks) ────────────

function StaticTaskCard({
  task,
  memberName,
  memberColor,
  clientName,
  clientColor,
}: {
  task: WorkflowTask
  memberName?: string
  memberColor?: string
  clientName: string
  clientColor: string
}) {
  const PIcon = PRIORITY_ICON[task.priority] || PRIORITY_ICON.medium
  const pColor = PRIORITY_COLOR[task.priority] || PRIORITY_COLOR.medium
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !['approved', 'scheduled'].includes(task.stage)

  return (
    <div className="glass rounded-xl p-3 shadow-2xl shadow-black/60 ring-1 ring-white/[0.08] cursor-grabbing">
      <div className="flex items-start gap-2">
        <div className="mt-0.5 p-0.5 shrink-0 text-white/20">
          <GripVertical size={12} />
        </div>
        <PIcon size={12} className={`mt-0.5 shrink-0 ${pColor}`} />
        <span className="text-sm text-white font-medium leading-snug flex-1 line-clamp-2">
          {task.title}
        </span>
      </div>

      <div className="flex items-center gap-2 mt-2.5 ml-[44px] flex-wrap">
        <span className="flex items-center gap-1 text-[10px] text-white/30 px-1.5 py-0.5 rounded-md bg-white/[0.04]">
          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: clientColor }} />
          {clientName}
        </span>
        {memberName && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-md"
            style={{ background: `${memberColor || '#7c3aed'}15`, color: memberColor || '#7c3aed' }}
          >
            {memberName.split(' ')[0]}
          </span>
        )}
        {task.dueDate && (
          <span className={`flex items-center gap-0.5 text-[10px] ${isOverdue ? 'text-red-400' : 'text-white/20'}`}>
            <Clock size={9} />
            {new Date(task.dueDate).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Main Board Component ────────────────────────────────

export function WorkflowBoard() {
  const { data } = useApp()
  const { members, tasks, tasksByStage, addTask, updateTask, deleteTask, moveTask, getMember } = useTeamWorkflow()

  const [selectedTask, setSelectedTask] = useState<WorkflowTask | null>(null)
  const [showCreate, setShowCreate] = useState<WorkflowStage | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overColumnId, setOverColumnId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  const getClientName = (clientId: string) =>
    data.clients.find(c => c.id === clientId)?.displayName || clientId
  const getClientColor = (clientId: string) =>
    data.clients.find(c => c.id === clientId)?.color || '#7c3aed'

  // Sort tasks: by priority weight, then by due date (earliest first), then by creation
  const sortTasks = useCallback((tasks: WorkflowTask[]) => {
    return [...tasks].sort((a, b) => {
      const pa = PRIORITY_SORT[a.priority] ?? 2
      const pb = PRIORITY_SORT[b.priority] ?? 2
      if (pa !== pb) return pa - pb
      if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      if (a.dueDate) return -1
      if (b.dueDate) return 1
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })
  }, [])

  // Drag handlers
  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(e.active.id as string)
  }

  const handleDragOver = (e: DragOverEvent) => {
    const overId = e.over?.id as string | null
    if (overId && WORKFLOW_STAGES.some(s => s.id === overId)) {
      setOverColumnId(overId)
    } else {
      setOverColumnId(null)
    }
  }

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveId(null)
    setOverColumnId(null)

    const taskId = e.active.id as string
    const overId = e.over?.id as string | undefined

    if (!overId) return

    // Check if dropped on a column
    const targetStage = WORKFLOW_STAGES.find(s => s.id === overId)
    if (!targetStage) return

    const task = tasks.find(t => t.id === taskId)
    if (!task || task.stage === targetStage.id) return

    await moveTask(taskId, targetStage.id)
  }

  const handleDragCancel = () => {
    setActiveId(null)
    setOverColumnId(null)
  }

  // Find active task for overlay
  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null

  // Compute total active tasks
  const totalTasks = tasks.length
  const activeTasks = tasks.filter(t => !['approved', 'scheduled'].includes(t.stage)).length
  const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && !['approved', 'scheduled'].includes(t.stage)).length

  return (
    <div className="h-full overflow-auto scroll-area">
      <div className="space-y-5 min-h-full">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent-violet/15 flex items-center justify-center">
              <LayoutGrid size={16} className="text-accent-violet" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Workflow Pipeline</h2>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-white/25">{totalTasks} total</span>
                <span className="text-xs text-accent-cyan/60">{activeTasks} active</span>
                {overdueTasks > 0 && (
                  <span className="text-xs text-red-400/80">{overdueTasks} overdue</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowCreate('brief')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent-violet/20 text-accent-violet text-sm font-medium hover:bg-accent-violet/30 transition-colors"
          >
            <Plus size={14} />
            New Task
          </button>
        </div>

        {/* Kanban board with drag-and-drop */}
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="flex gap-3 overflow-x-auto pb-4 min-h-[550px]">
            {WORKFLOW_STAGES.map(stage => {
              const stageTasks = sortTasks(tasksByStage[stage.id] || [])
              const StageIcon = STAGE_ICONS[stage.id]
              const stageColor = STAGE_COLORS[stage.id]
              const isColumnOver = overColumnId === stage.id

              return (
                <div
                  key={stage.id}
                  className="flex-1 min-w-[220px] max-w-[300px] flex flex-col"
                >
                  {/* Column header */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <StageIcon size={14} style={{ color: stageColor }} />
                      <span className="text-sm font-semibold text-white/60">{stage.label}</span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                        style={{ background: `${stageColor}20`, color: stageColor }}
                      >
                        {stageTasks.length}
                      </span>
                    </div>
                    <button
                      onClick={() => setShowCreate(stage.id)}
                      className="p-1 rounded-md text-white/15 hover:text-white/40 hover:bg-white/[0.04] transition-all"
                      title={`Add task to ${stage.label}`}
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Droppable column body */}
                  <DroppableColumn stageId={stage.id} isOver={isColumnOver}>
                    <AnimatePresence>
                      {stageTasks.map((task, i) => {
                        const member = getMember(task.assignedTo)
                        return (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: i * 0.02 }}
                          >
                            <DraggableTaskCard
                              task={task}
                              memberName={member?.name}
                              memberColor={member?.color}
                              clientName={getClientName(task.clientId)}
                              clientColor={getClientColor(task.clientId)}
                              onClick={() => setSelectedTask(task)}
                            />
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>

                    {/* Empty state */}
                    {stageTasks.length === 0 && (
                      <div
                        className="text-center py-8 text-[11px] rounded-lg border border-dashed transition-colors"
                        style={{
                          color: isColumnOver ? stageColor : 'rgba(255,255,255,0.08)',
                          borderColor: isColumnOver ? `${stageColor}30` : 'rgba(255,255,255,0.04)',
                        }}
                      >
                        {isColumnOver ? 'Drop here' : 'No tasks'}
                      </div>
                    )}
                  </DroppableColumn>
                </div>
              )
            })}
          </div>

          {/* Drag overlay */}
          <DragOverlay dropAnimation={null}>
            {activeTask && (
              <div style={{ width: 260 }}>
                <StaticTaskCard
                  task={activeTask}
                  memberName={getMember(activeTask.assignedTo)?.name}
                  memberColor={getMember(activeTask.assignedTo)?.color}
                  clientName={getClientName(activeTask.clientId)}
                  clientColor={getClientColor(activeTask.clientId)}
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={async (id, updates) => {
            const updated = await updateTask(id, updates)
            // Keep the modal synced with the latest data
            setSelectedTask(updated)
          }}
          onDelete={deleteTask}
          members={members}
        />
      )}

      {/* Create Task Modal */}
      {showCreate && (
        <CreateTaskModal
          initialStage={showCreate}
          onClose={() => setShowCreate(null)}
          onSubmit={addTask}
          members={members}
        />
      )}
    </div>
  )
}
