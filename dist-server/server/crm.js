import { Router } from 'express';
import { resolve } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { scanClients } from './scanner.js';
const router = Router();
const CRM_FILE = resolve(import.meta.dirname, '..', 'data', 'crm.json');
// ── Persistence ────────────────────────────────────────
function readCRM() {
    try {
        if (existsSync(CRM_FILE)) {
            return JSON.parse(readFileSync(CRM_FILE, 'utf-8'));
        }
    }
    catch { /* ignore */ }
    return { profiles: {}, activities: [], tasks: [], contracts: [], invoices: [] };
}
function writeCRM(data) {
    writeFileSync(CRM_FILE, JSON.stringify(data, null, 2), 'utf-8');
}
function genId(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
// ── Routes ─────────────────────────────────────────────
// Get all CRM data
router.get('/', (_req, res) => {
    res.json(readCRM());
});
// ── Profiles ───────────────────────────────────────────
router.put('/profiles', (req, res) => {
    const profile = req.body;
    if (!profile.clientId) {
        res.status(400).json({ error: 'Missing clientId' });
        return;
    }
    const crm = readCRM();
    crm.profiles[profile.clientId] = profile;
    writeCRM(crm);
    res.json({ success: true, profile });
});
router.get('/profiles/:clientId', (req, res) => {
    const crm = readCRM();
    const profile = crm.profiles[req.params.clientId];
    res.json({ profile: profile || null });
});
// ── Activities ─────────────────────────────────────────
router.post('/activities', (req, res) => {
    const { clientId, type, title, description, date } = req.body;
    if (!clientId || !title) {
        res.status(400).json({ error: 'Missing clientId or title' });
        return;
    }
    const activity = {
        id: genId('act'),
        clientId,
        type: type || 'note',
        title,
        description,
        date: date || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
    };
    const crm = readCRM();
    crm.activities.unshift(activity);
    writeCRM(crm);
    res.json({ success: true, activity });
});
router.delete('/activities/:id', (req, res) => {
    const crm = readCRM();
    crm.activities = crm.activities.filter(a => a.id !== req.params.id);
    writeCRM(crm);
    res.json({ success: true });
});
// ── Tasks ──────────────────────────────────────────────
router.post('/tasks', (req, res) => {
    const { clientId, title, description, status, priority, dueDate, assignee } = req.body;
    if (!clientId || !title) {
        res.status(400).json({ error: 'Missing clientId or title' });
        return;
    }
    const task = {
        id: genId('task'),
        clientId,
        title,
        description,
        status: status || 'todo',
        priority: priority || 'medium',
        dueDate,
        assignee,
        createdAt: new Date().toISOString(),
    };
    const crm = readCRM();
    crm.tasks.unshift(task);
    writeCRM(crm);
    res.json({ success: true, task });
});
router.patch('/tasks/:id', (req, res) => {
    const crm = readCRM();
    const task = crm.tasks.find(t => t.id === req.params.id);
    if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
    }
    const updates = req.body;
    Object.assign(task, updates);
    if (updates.status === 'done' && !task.completedAt) {
        task.completedAt = new Date().toISOString();
    }
    if (updates.status && updates.status !== 'done') {
        task.completedAt = undefined;
    }
    writeCRM(crm);
    res.json({ success: true, task });
});
router.delete('/tasks/:id', (req, res) => {
    const crm = readCRM();
    crm.tasks = crm.tasks.filter(t => t.id !== req.params.id);
    writeCRM(crm);
    res.json({ success: true });
});
// ── Contracts ──────────────────────────────────────────
router.post('/contracts', (req, res) => {
    const { clientId, title, startDate, endDate, monthlyValue, status, notes } = req.body;
    if (!clientId || !title || !startDate) {
        res.status(400).json({ error: 'Missing clientId, title, or startDate' });
        return;
    }
    const contract = {
        id: genId('ctr'),
        clientId,
        title,
        startDate,
        endDate,
        monthlyValue,
        status: status || 'pending',
        notes,
        createdAt: new Date().toISOString(),
    };
    const crm = readCRM();
    crm.contracts.unshift(contract);
    writeCRM(crm);
    res.json({ success: true, contract });
});
router.patch('/contracts/:id', (req, res) => {
    const crm = readCRM();
    const contract = crm.contracts.find(c => c.id === req.params.id);
    if (!contract) {
        res.status(404).json({ error: 'Contract not found' });
        return;
    }
    Object.assign(contract, req.body);
    writeCRM(crm);
    res.json({ success: true, contract });
});
router.delete('/contracts/:id', (req, res) => {
    const crm = readCRM();
    crm.contracts = crm.contracts.filter(c => c.id !== req.params.id);
    writeCRM(crm);
    res.json({ success: true });
});
// ── Invoices ───────────────────────────────────────────
router.post('/invoices', (req, res) => {
    const { clientId, number, amount, currency, status, issuedDate, dueDate, paidDate, description } = req.body;
    if (!clientId || !number || amount === undefined || !issuedDate || !dueDate) {
        res.status(400).json({ error: 'Missing required invoice fields' });
        return;
    }
    const invoice = {
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
    };
    const crm = readCRM();
    crm.invoices.unshift(invoice);
    writeCRM(crm);
    res.json({ success: true, invoice });
});
router.patch('/invoices/:id', (req, res) => {
    const crm = readCRM();
    const invoice = crm.invoices.find(i => i.id === req.params.id);
    if (!invoice) {
        res.status(404).json({ error: 'Invoice not found' });
        return;
    }
    Object.assign(invoice, req.body);
    writeCRM(crm);
    res.json({ success: true, invoice });
});
router.delete('/invoices/:id', (req, res) => {
    const crm = readCRM();
    crm.invoices = crm.invoices.filter(i => i.id !== req.params.id);
    writeCRM(crm);
    res.json({ success: true });
});
// ── Contract PDF Data ──────────────────────────────────
router.get('/contracts/:id/pdf-data', (req, res) => {
    const crm = readCRM();
    const contract = crm.contracts.find(c => c.id === req.params.id);
    if (!contract) {
        res.status(404).json({ error: 'Contract not found' });
        return;
    }
    const profile = crm.profiles[contract.clientId] || null;
    // Try to get client display name from scanner data
    // Fallback: convert clientId to title case (e.g., "autosiena-oradea" → "AutoSiena Oradea")
    let clientName = contract.clientId
        .split(/[-_]/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    let clientColor = '#7c3aed';
    let postCount = 0;
    try {
        const PROJECT_ROOT = resolve(import.meta.dirname, '..', '..', '..');
        const data = scanClients(PROJECT_ROOT);
        const client = data.clients.find((c) => c.id === contract.clientId);
        if (client) {
            clientName = client.displayName;
            clientColor = client.color;
            postCount = client.stats.total;
        }
    }
    catch { /* ignore */ }
    res.json({ contract, profile, clientName, clientColor, postCount });
});
export default router;
