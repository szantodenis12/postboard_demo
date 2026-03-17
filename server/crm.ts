import { Router } from 'express'
import { db } from './firebase.js'
import { scanClients } from './scanner.js'

const router = Router()

// ── Types ──────────────────────────────────────────────

interface CRMProfile {
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

interface CRMActivity {
  id: string
  clientId: string
  type: string
  title: string
  description?: string
  date: string
  createdAt: string
}

interface CRMTask {
  id: string
  clientId: string
  title: string
  description?: string
  status: string
  priority: string
  dueDate?: string
  assignee?: string
  createdAt: string
  completedAt?: string
}

interface CRMContract {
  id: string
  clientId: string
  title: string
  startDate: string
  endDate?: string
  monthlyValue?: number
  status: string
  notes?: string
  createdAt: string
}

interface CRMInvoice {
  id: string
  clientId: string
  number: string
  amount: number
  currency: string
  status: string
  issuedDate: string
  dueDate: string
  paidDate?: string
  description?: string
  createdAt: string
}

function genId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

// Helper to fetch all docs from a collection as type T[]
async function fetchCollection<T>(collectionName: string): Promise<T[]> {
  const snap = await db.collection(collectionName).get()
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as T))
}

// Helper to fetch a dictionary of profiles
async function fetchProfiles(): Promise<Record<string, CRMProfile>> {
  const snap = await db.collection('crm_profiles').get()
  const profiles: Record<string, CRMProfile> = {}
  snap.docs.forEach(doc => {
    profiles[doc.id] = doc.data() as CRMProfile
  })
  return profiles
}

// ── Routes ─────────────────────────────────────────────

// Get all CRM data
router.get('/', async (_req, res) => {
  try {
    const [profiles, activities, tasks, contracts, invoices] = await Promise.all([
      fetchProfiles(),
      fetchCollection<CRMActivity>('crm_activities'),
      fetchCollection<CRMTask>('crm_tasks'),
      fetchCollection<CRMContract>('crm_contracts'),
      fetchCollection<CRMInvoice>('crm_invoices')
    ])

    // Sort arrays (newest first for activities/contracts/invoices, based on original behavior)
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    contracts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    invoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    res.json({ profiles, activities, tasks, contracts, invoices })
  } catch (error: any) {
    console.error('Failed to fetch CRM data:', error)
    res.status(500).json({ error: 'Failed to fetch CRM data' })
  }
})

// ── Profiles ───────────────────────────────────────────

router.put('/profiles', async (req, res) => {
  const profile = req.body as CRMProfile
  if (!profile.clientId) {
    res.status(400).json({ error: 'Missing clientId' })
    return
  }
  try {
    await db.collection('crm_profiles').doc(profile.clientId).set(profile, { merge: true })
    res.json({ success: true, profile })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

router.get('/profiles/:clientId', async (req, res) => {
  try {
    const doc = await db.collection('crm_profiles').doc(req.params.clientId).get()
    res.json({ profile: doc.exists ? doc.data() : null })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' })
  }
})

// ── Activities ─────────────────────────────────────────

router.post('/activities', async (req, res) => {
  const { clientId, type, title, description, date } = req.body
  if (!clientId || !title) {
    res.status(400).json({ error: 'Missing clientId or title' })
    return
  }
  const activity: CRMActivity = {
    id: genId('act'),
    clientId,
    type: type || 'note',
    title,
    description,
    date: date || new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  }
  try {
    await db.collection('crm_activities').doc(activity.id).set(activity)
    res.json({ success: true, activity })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create activity' })
  }
})

router.delete('/activities/:id', async (req, res) => {
  try {
    await db.collection('crm_activities').doc(req.params.id).delete()
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete activity' })
  }
})

// ── Tasks ──────────────────────────────────────────────

router.post('/tasks', async (req, res) => {
  const { clientId, title, description, status, priority, dueDate, assignee } = req.body
  if (!clientId || !title) {
    res.status(400).json({ error: 'Missing clientId or title' })
    return
  }
  const task: CRMTask = {
    id: genId('task'),
    clientId,
    title,
    description,
    status: status || 'todo',
    priority: priority || 'medium',
    dueDate,
    assignee,
    createdAt: new Date().toISOString(),
  }
  try {
    await db.collection('crm_tasks').doc(task.id).set(task)
    res.json({ success: true, task })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' })
  }
})

router.patch('/tasks/:id', async (req, res) => {
  try {
    const taskRef = db.collection('crm_tasks').doc(req.params.id)
    const doc = await taskRef.get()
    if (!doc.exists) {
      res.status(404).json({ error: 'Task not found' })
      return
    }
    const updates = req.body
    if (updates.status === 'done' && !doc.data()?.completedAt) {
      updates.completedAt = new Date().toISOString()
    }
    if (updates.status && updates.status !== 'done') {
      updates.completedAt = null // Use null to remove in Firestore merge
    }
    await taskRef.set(updates, { merge: true })
    
    // Fetch fresh task to return
    const updatedDoc = await taskRef.get()
    res.json({ success: true, task: updatedDoc.data() })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' })
  }
})

router.delete('/tasks/:id', async (req, res) => {
  try {
    await db.collection('crm_tasks').doc(req.params.id).delete()
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' })
  }
})

// ── Contracts ──────────────────────────────────────────

router.post('/contracts', async (req, res) => {
  const { clientId, title, startDate, endDate, monthlyValue, status, notes } = req.body
  if (!clientId || !title || !startDate) {
    res.status(400).json({ error: 'Missing clientId, title, or startDate' })
    return
  }
  const contract: CRMContract = {
    id: genId('ctr'),
    clientId,
    title,
    startDate,
    endDate,
    monthlyValue,
    status: status || 'pending',
    notes,
    createdAt: new Date().toISOString(),
  }
  try {
    await db.collection('crm_contracts').doc(contract.id).set(contract)
    res.json({ success: true, contract })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create contract' })
  }
})

router.patch('/contracts/:id', async (req, res) => {
  try {
    const ref = db.collection('crm_contracts').doc(req.params.id)
    const doc = await ref.get()
    if (!doc.exists) {
      res.status(404).json({ error: 'Contract not found' })
      return
    }
    await ref.set(req.body, { merge: true })
    const updatedDoc = await ref.get()
    res.json({ success: true, contract: updatedDoc.data() })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update contract' })
  }
})

router.delete('/contracts/:id', async (req, res) => {
  try {
    await db.collection('crm_contracts').doc(req.params.id).delete()
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete contract' })
  }
})

// ── Invoices ───────────────────────────────────────────

router.post('/invoices', async (req, res) => {
  const { clientId, number, amount, currency, status, issuedDate, dueDate, paidDate, description } = req.body
  if (!clientId || !number || amount === undefined || !issuedDate || !dueDate) {
    res.status(400).json({ error: 'Missing required invoice fields' })
    return
  }
  const invoice: CRMInvoice = {
    id: genId('inv'),
    clientId,
    number,
    amount,
    currency: currency || 'RON',
    status: status || 'draft',
    issuedDate,
    dueDate,
    paidDate,
    description,
    createdAt: new Date().toISOString(),
  }
  try {
    await db.collection('crm_invoices').doc(invoice.id).set(invoice)
    res.json({ success: true, invoice })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create invoice' })
  }
})

router.patch('/invoices/:id', async (req, res) => {
  try {
    const ref = db.collection('crm_invoices').doc(req.params.id)
    const doc = await ref.get()
    if (!doc.exists) {
      res.status(404).json({ error: 'Invoice not found' })
      return
    }
    await ref.set(req.body, { merge: true })
    const updatedDoc = await ref.get()
    res.json({ success: true, invoice: updatedDoc.data() })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update invoice' })
  }
})

router.delete('/invoices/:id', async (req, res) => {
  try {
    await db.collection('crm_invoices').doc(req.params.id).delete()
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete invoice' })
  }
})

// ── Contract PDF Data ──────────────────────────────────

router.get('/contracts/:id/pdf-data', async (req, res) => {
  try {
    const contractDoc = await db.collection('crm_contracts').doc(req.params.id).get()
    if (!contractDoc.exists) {
      res.status(404).json({ error: 'Contract not found' })
      return
    }
    const contract = contractDoc.data() as CRMContract

    const profileDoc = await db.collection('crm_profiles').doc(contract.clientId).get()
    const profile = profileDoc.exists ? profileDoc.data() : null

    // Try to get client display name from scanner data
    let clientName = contract.clientId
      .split(/[-_]/)
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
    let clientColor = '#7c3aed'
    let postCount = 0
    
    try {
      const PROJECT_ROOT = process.cwd()
      const data = scanClients(PROJECT_ROOT)
      const client = data.clients.find((c: any) => c.id === contract.clientId)
      if (client) {
        clientName = client.displayName
        clientColor = client.color
        postCount = client.stats.total
      }
    } catch { /* ignore */ }

    res.json({ contract, profile, clientName, clientColor, postCount })
  } catch (error) {
    console.error('Failed to generate PDF data:', error)
    res.status(500).json({ error: 'Failed to gather PDF data' })
  }
})

export default router
