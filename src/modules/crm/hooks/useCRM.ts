import { useState, useEffect, useCallback } from 'react'
import { apiUrl } from '../../../core/config'

const API = apiUrl('/api/crm')

// ── Types ──────────────────────────────────────────────

export interface CRMProfile {
  clientId: string
  contactPerson?: string
  email?: string
  phone?: string
  website?: string
  address?: string
  industry?: string
  services?: string[]
  notes?: string
}

export interface CRMActivity {
  id: string
  clientId: string
  type: 'note' | 'meeting' | 'call' | 'email' | 'task-completed' | 'post-published' | 'invoice-sent' | 'contract-signed' | 'other'
  title: string
  description?: string
  date: string
  createdAt: string
}

export type TaskStatus = 'todo' | 'in-progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface CRMTask {
  id: string
  clientId: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string
  assignee?: string
  createdAt: string
  completedAt?: string
}

export type ContractStatus = 'active' | 'expired' | 'pending'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue'

export interface CRMContract {
  id: string
  clientId: string
  title: string
  startDate: string
  endDate?: string
  monthlyValue?: number
  status: ContractStatus
  notes?: string
  createdAt: string
}

export interface CRMInvoice {
  id: string
  clientId: string
  number: string
  amount: number
  currency: string
  status: InvoiceStatus
  issuedDate: string
  dueDate: string
  paidDate?: string
  description?: string
  createdAt: string
}

export interface CRMData {
  profiles: Record<string, CRMProfile>
  activities: CRMActivity[]
  tasks: CRMTask[]
  contracts: CRMContract[]
  invoices: CRMInvoice[]
}

// ── Hook ───────────────────────────────────────────────

export function useCRM() {
  const [data, setData] = useState<CRMData>({
    profiles: {},
    activities: [],
    tasks: [],
    contracts: [],
    invoices: [],
  })
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch(API)
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error('CRM load error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Profile ────────────────────────────────────────
  const saveProfile = useCallback(async (profile: CRMProfile) => {
    setData(prev => ({
      ...prev,
      profiles: { ...prev.profiles, [profile.clientId]: profile },
    }))
    await fetch(`${API}/profiles`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    })
  }, [])

  // ── Activities ─────────────────────────────────────
  const addActivity = useCallback(async (activity: Omit<CRMActivity, 'id' | 'createdAt'>) => {
    const res = await fetch(`${API}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activity),
    })
    const { activity: created } = await res.json()
    setData(prev => ({
      ...prev,
      activities: [created, ...prev.activities],
    }))
    return created
  }, [])

  const deleteActivity = useCallback(async (id: string) => {
    setData(prev => ({
      ...prev,
      activities: prev.activities.filter(a => a.id !== id),
    }))
    await fetch(`${API}/activities/${id}`, { method: 'DELETE' })
  }, [])

  // ── Tasks ──────────────────────────────────────────
  const addTask = useCallback(async (task: Omit<CRMTask, 'id' | 'createdAt'>) => {
    const res = await fetch(`${API}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    })
    const { task: created } = await res.json()
    setData(prev => ({
      ...prev,
      tasks: [created, ...prev.tasks],
    }))
    return created
  }, [])

  const updateTask = useCallback(async (id: string, updates: Partial<CRMTask>) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, ...updates } : t),
    }))
    await fetch(`${API}/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
  }, [])

  const deleteTask = useCallback(async (id: string) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== id),
    }))
    await fetch(`${API}/tasks/${id}`, { method: 'DELETE' })
  }, [])

  // ── Contracts ──────────────────────────────────────
  const addContract = useCallback(async (contract: Omit<CRMContract, 'id' | 'createdAt'>) => {
    console.log('CRM: Adding contract...', contract)
    const res = await fetch(`${API}/contracts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contract),
    })
    if (!res.ok) {
      console.error('CRM: Add contract failed:', res.status, await res.text())
      throw new Error(`Add contract failed: ${res.status}`)
    }
    const { contract: created } = await res.json()
    console.log('CRM: Contract created:', created)
    setData(prev => ({
      ...prev,
      contracts: [created, ...prev.contracts],
    }))
    return created
  }, [])

  const updateContract = useCallback(async (id: string, updates: Partial<CRMContract>) => {
    setData(prev => ({
      ...prev,
      contracts: prev.contracts.map(c => c.id === id ? { ...c, ...updates } : c),
    }))
    await fetch(`${API}/contracts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
  }, [])

  const deleteContract = useCallback(async (id: string) => {
    setData(prev => ({
      ...prev,
      contracts: prev.contracts.filter(c => c.id !== id),
    }))
    await fetch(`${API}/contracts/${id}`, { method: 'DELETE' })
  }, [])

  // ── Invoices ───────────────────────────────────────
  const addInvoice = useCallback(async (invoice: Omit<CRMInvoice, 'id' | 'createdAt'>) => {
    console.log('CRM: Adding invoice...', invoice)
    const res = await fetch(`${API}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoice),
    })
    if (!res.ok) {
      console.error('CRM: Add invoice failed:', res.status, await res.text())
      throw new Error(`Add invoice failed: ${res.status}`)
    }
    const { invoice: created } = await res.json()
    console.log('CRM: Invoice created:', created)
    setData(prev => ({
      ...prev,
      invoices: [created, ...prev.invoices],
    }))
    return created
  }, [])

  const updateInvoice = useCallback(async (id: string, updates: Partial<CRMInvoice>) => {
    setData(prev => ({
      ...prev,
      invoices: prev.invoices.map(inv => inv.id === id ? { ...inv, ...updates } : inv),
    }))
    await fetch(`${API}/invoices/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
  }, [])

  const deleteInvoice = useCallback(async (id: string) => {
    setData(prev => ({
      ...prev,
      invoices: prev.invoices.filter(inv => inv.id !== id),
    }))
    await fetch(`${API}/invoices/${id}`, { method: 'DELETE' })
  }, [])

  return {
    data,
    loading,
    reload: load,
    // Profile
    saveProfile,
    // Activities
    addActivity,
    deleteActivity,
    // Tasks
    addTask,
    updateTask,
    deleteTask,
    // Contracts
    addContract,
    updateContract,
    deleteContract,
    // Invoices
    addInvoice,
    updateInvoice,
    deleteInvoice,
  }
}
