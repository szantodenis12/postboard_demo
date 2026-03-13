import { useState, useEffect, useCallback, useMemo } from 'react'
import type { TeamMember, WorkflowTask, WorkflowStage } from '../../../core/types'

export function useTeamWorkflow() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [tasks, setTasks] = useState<WorkflowTask[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const [membersRes, tasksRes] = await Promise.all([
        fetch('/api/team/members'),
        fetch('/api/team/tasks'),
      ])
      if (membersRes.ok) setMembers(await membersRes.json())
      if (tasksRes.ok) setTasks(await tasksRes.json())
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  // ── Member CRUD ──
  const addMember = useCallback(async (member: Omit<TeamMember, 'id' | 'createdAt'>) => {
    const res = await fetch('/api/team/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member),
    })
    if (!res.ok) throw new Error('Failed to add member')
    const data = await res.json()
    setMembers(prev => [...prev, data])
    return data
  }, [])

  const updateMember = useCallback(async (id: string, updates: Partial<TeamMember>) => {
    const res = await fetch(`/api/team/members/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) throw new Error('Failed to update member')
    const data = await res.json()
    setMembers(prev => prev.map(m => m.id === id ? data : m))
    return data
  }, [])

  const deleteMember = useCallback(async (id: string) => {
    const res = await fetch(`/api/team/members/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete member')
    setMembers(prev => prev.filter(m => m.id !== id))
  }, [])

  // ── Task CRUD ──
  const addTask = useCallback(async (task: Omit<WorkflowTask, 'id' | 'createdAt' | 'updatedAt'>) => {
    const res = await fetch('/api/team/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    })
    if (!res.ok) throw new Error('Failed to add task')
    const data = await res.json()
    setTasks(prev => [...prev, data])
    return data
  }, [])

  const updateTask = useCallback(async (id: string, updates: Partial<WorkflowTask>) => {
    const res = await fetch(`/api/team/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) throw new Error('Failed to update task')
    const data = await res.json()
    setTasks(prev => prev.map(t => t.id === id ? data : t))
    return data
  }, [])

  const deleteTask = useCallback(async (id: string) => {
    const res = await fetch(`/api/team/tasks/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete task')
    setTasks(prev => prev.filter(t => t.id !== id))
  }, [])

  const moveTask = useCallback(async (id: string, stage: WorkflowStage) => {
    return updateTask(id, { stage })
  }, [updateTask])

  // ── Derived data ──
  const tasksByStage = useMemo(() => {
    const map: Record<WorkflowStage, WorkflowTask[]> = {
      brief: [], copy: [], design: [], review: [], approved: [], scheduled: [],
    }
    for (const t of tasks) {
      if (map[t.stage]) map[t.stage].push(t)
    }
    return map
  }, [tasks])

  const tasksByMember = useMemo(() => {
    const map: Record<string, WorkflowTask[]> = {}
    for (const m of members) map[m.id] = []
    for (const t of tasks) {
      if (!map[t.assignedTo]) map[t.assignedTo] = []
      map[t.assignedTo].push(t)
    }
    return map
  }, [tasks, members])

  const getMember = useCallback((id: string) => {
    return members.find(m => m.id === id)
  }, [members])

  return {
    members,
    tasks,
    loading,
    refresh,
    addMember,
    updateMember,
    deleteMember,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    tasksByStage,
    tasksByMember,
    getMember,
  }
}
