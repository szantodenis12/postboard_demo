import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Webhook,
  Plus,
  Trash2,
  Play,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Copy,
  Loader2,
  AlertCircle,
  History,
  Pencil,
  Check,
  X,
  Send,
  Eye,
  EyeOff,
  Shield,
  RefreshCw,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────

interface WebhookData {
  id: string
  name: string
  url: string
  events: string[]
  enabled: boolean
  secret?: string
  createdAt: string
  lastTriggered?: string
}

interface LogEntry {
  id: string
  webhookId: string
  webhookName: string
  event: string
  status: number | null
  success: boolean
  error?: string
  timestamp: string
}

interface TestResult {
  webhookId: string
  success: boolean
  message: string
}

const ALL_EVENTS = [
  { value: 'post.status_changed', label: 'Status Changed' },
  { value: 'post.published', label: 'Published' },
  { value: 'post.approved', label: 'Approved' },
  { value: 'post.scheduled', label: 'Scheduled' },
  { value: 'feedback.received', label: 'Feedback' },
  { value: 'review.created', label: 'Review Created' },
  { value: 'report.generated', label: 'Report Generated' },
]

// ── Component ────────────────────────────────────────────

export function WebhookManager() {
  const [webhooks, setWebhooks] = useState<WebhookData[]>([])
  const [log, setLog] = useState<LogEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showLog, setShowLog] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loadingList, setLoadingList] = useState(true)

  // Form state (create)
  const [formName, setFormName] = useState('')
  const [formUrl, setFormUrl] = useState('')
  const [formEvents, setFormEvents] = useState<string[]>([])
  const [formSecret, setFormSecret] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Edit state (inline)
  const [editName, setEditName] = useState('')
  const [editUrl, setEditUrl] = useState('')
  const [editEvents, setEditEvents] = useState<string[]>([])
  const [editSecret, setEditSecret] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [showEditSecret, setShowEditSecret] = useState(false)

  const testTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Data fetching ───────────────────────────────────────

  const fetchWebhooks = useCallback(async () => {
    try {
      const res = await fetch('/api/webhooks')
      const data = await res.json()
      setWebhooks(data)
    } catch { /* ignore */ }
    setLoadingList(false)
  }, [])

  const fetchLog = useCallback(async () => {
    try {
      const res = await fetch('/api/webhooks/log')
      const data = await res.json()
      setLog(data)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    fetchWebhooks()
    fetchLog()
  }, [fetchWebhooks, fetchLog])

  // Clean up test result timeout
  useEffect(() => {
    return () => {
      if (testTimeoutRef.current) clearTimeout(testTimeoutRef.current)
    }
  }, [])

  // ── Create ──────────────────────────────────────────────

  const handleCreate = async () => {
    setFormError(null)
    if (!formName.trim()) { setFormError('Name is required'); return }
    if (!formUrl.trim()) { setFormError('URL is required'); return }
    try { new URL(formUrl) } catch { setFormError('Invalid URL format'); return }
    if (formEvents.length === 0) { setFormError('Select at least one event'); return }

    setSaving(true)
    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          url: formUrl.trim(),
          events: formEvents,
          secret: formSecret.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setFormError(data.error || 'Failed to create webhook')
        return
      }
      resetForm()
      setShowForm(false)
      fetchWebhooks()
    } catch {
      setFormError('Network error — check your connection')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormName('')
    setFormUrl('')
    setFormEvents([])
    setFormSecret('')
    setFormError(null)
  }

  // ── Toggle ──────────────────────────────────────────────

  const handleToggle = async (id: string, enabled: boolean) => {
    // Optimistic update
    setWebhooks(prev => prev.map(w => w.id === id ? { ...w, enabled } : w))
    try {
      await fetch(`/api/webhooks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      })
    } catch {
      // Revert on failure
      setWebhooks(prev => prev.map(w => w.id === id ? { ...w, enabled: !enabled } : w))
    }
  }

  // ── Delete ──────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    setWebhooks(prev => prev.filter(w => w.id !== id))
    setConfirmDelete(null)
    try {
      await fetch(`/api/webhooks/${id}`, { method: 'DELETE' })
    } catch {
      fetchWebhooks() // re-fetch on failure
    }
  }

  // ── Test ────────────────────────────────────────────────

  const handleTest = async (id: string) => {
    setTesting(id)
    setTestResult(null)
    try {
      const res = await fetch(`/api/webhooks/${id}/test`, { method: 'POST' })
      const data = await res.json()
      const result: TestResult = {
        webhookId: id,
        success: res.ok,
        message: res.ok ? 'Test delivered successfully' : (data.error || 'Test failed'),
      }
      setTestResult(result)
      fetchLog()

      // Auto-dismiss after 4 seconds
      if (testTimeoutRef.current) clearTimeout(testTimeoutRef.current)
      testTimeoutRef.current = setTimeout(() => setTestResult(null), 4000)
    } catch {
      setTestResult({
        webhookId: id,
        success: false,
        message: 'Network error — could not send test',
      })
      if (testTimeoutRef.current) clearTimeout(testTimeoutRef.current)
      testTimeoutRef.current = setTimeout(() => setTestResult(null), 4000)
    }
    setTesting(null)
  }

  // ── Inline edit ─────────────────────────────────────────

  const startEditing = (wh: WebhookData) => {
    setEditingId(wh.id)
    setEditName(wh.name)
    setEditUrl(wh.url)
    setEditEvents([...wh.events])
    setEditSecret(wh.secret || '')
    setEditError(null)
    setShowEditSecret(false)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditError(null)
  }

  const saveEdit = async () => {
    setEditError(null)
    if (!editName.trim()) { setEditError('Name is required'); return }
    if (!editUrl.trim()) { setEditError('URL is required'); return }
    try { new URL(editUrl) } catch { setEditError('Invalid URL format'); return }
    if (editEvents.length === 0) { setEditError('Select at least one event'); return }

    setEditSaving(true)
    try {
      const res = await fetch(`/api/webhooks/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          url: editUrl.trim(),
          events: editEvents,
          secret: editSecret.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setEditError(data.error || 'Failed to save changes')
        return
      }
      setEditingId(null)
      fetchWebhooks()
    } catch {
      setEditError('Network error')
    } finally {
      setEditSaving(false)
    }
  }

  const toggleEditEvent = (event: string) => {
    setEditEvents(prev =>
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
    )
  }

  // ── Helpers ─────────────────────────────────────────────

  const toggleFormEvent = (event: string) => {
    setFormEvents(prev =>
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
    )
  }

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const eventLabel = (value: string) =>
    ALL_EVENTS.find(e => e.value === value)?.label || value

  // ── Render ──────────────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-8 pt-8 pb-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <Webhook className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Webhooks</h1>
              <p className="text-sm text-white/40">
                Send real-time event notifications to external services
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { fetchWebhooks(); fetchLog() }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/60 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setShowForm(!showForm); if (showForm) resetForm() }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-violet hover:bg-accent-violet/80 text-white text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Webhook
            </button>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scroll-area px-8 pb-8">

        {/* ── Create Form ──────────────────────────────────── */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="glass rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Send className="w-4 h-4 text-accent-violet" />
                  New Webhook
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-white/40 block mb-1.5">Name</label>
                    <input
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      placeholder="e.g. Slack Notifications"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent-violet/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 block mb-1.5">Endpoint URL</label>
                    <input
                      value={formUrl}
                      onChange={e => setFormUrl(e.target.value)}
                      placeholder="https://hooks.slack.com/services/..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent-violet/50 transition-colors"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-xs text-white/40 block mb-2">Events to subscribe</label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_EVENTS.map(ev => (
                      <button
                        key={ev.value}
                        onClick={() => toggleFormEvent(ev.value)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                          formEvents.includes(ev.value)
                            ? 'bg-accent-violet/20 border-accent-violet/50 text-accent-violet'
                            : 'bg-white/[0.03] border-white/10 text-white/40 hover:text-white/60 hover:border-white/20'
                        }`}
                      >
                        {ev.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-5">
                  <label className="text-xs text-white/40 mb-1.5 flex items-center gap-1.5">
                    <Shield className="w-3 h-3" />
                    Signing Secret
                    <span className="text-white/20">(optional)</span>
                  </label>
                  <input
                    value={formSecret}
                    onChange={e => setFormSecret(e.target.value)}
                    placeholder="Sent as X-Webhook-Secret header for verification"
                    className="w-full max-w-lg bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent-violet/50 transition-colors"
                  />
                </div>

                {formError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-red-400 text-sm mb-4"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {formError}
                  </motion.div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleCreate}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-violet hover:bg-accent-violet/80 text-white text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Create Webhook
                  </button>
                  <button
                    onClick={() => { setShowForm(false); resetForm() }}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Webhook List ─────────────────────────────────── */}
        <div className="space-y-3 mb-8">
          {loadingList ? (
            // Loading skeleton
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="glass rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="h-5 w-40 shimmer rounded mb-3" />
                      <div className="h-4 w-64 shimmer rounded mb-3" />
                      <div className="flex gap-2">
                        <div className="h-5 w-20 shimmer rounded" />
                        <div className="h-5 w-16 shimmer rounded" />
                        <div className="h-5 w-24 shimmer rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : webhooks.length === 0 ? (
            // Empty state
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-2xl p-16 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
                <Webhook className="w-8 h-8 text-orange-400/40" />
              </div>
              <p className="text-white/40 text-sm font-medium mb-1">No webhooks configured</p>
              <p className="text-white/20 text-xs max-w-sm mx-auto mb-5">
                Webhooks let you send real-time notifications to Slack, Zapier, Discord,
                or any service that accepts HTTP POST requests when events happen in PostBoard.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-violet/20 hover:bg-accent-violet/30 text-accent-violet text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create your first webhook
              </button>
            </motion.div>
          ) : (
            webhooks.map((wh, i) => (
              <motion.div
                key={wh.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                layout
                className={`glass rounded-2xl overflow-hidden transition-opacity ${
                  !wh.enabled && editingId !== wh.id ? 'opacity-50' : ''
                }`}
              >
                {editingId === wh.id ? (
                  // ── Inline Edit Mode ──────────────────────
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                        <Pencil className="w-3.5 h-3.5 text-accent-violet" />
                        Editing Webhook
                      </h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={saveEdit}
                          disabled={editSaving}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-violet hover:bg-accent-violet/80 text-white text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          {editSaving ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 text-xs transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          Cancel
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-[10px] text-white/30 uppercase tracking-wider block mb-1">Name</label>
                        <input
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent-violet/50 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-white/30 uppercase tracking-wider block mb-1">URL</label>
                        <input
                          value={editUrl}
                          onChange={e => setEditUrl(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent-violet/50 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="text-[10px] text-white/30 uppercase tracking-wider block mb-1.5">Events</label>
                      <div className="flex flex-wrap gap-1.5">
                        {ALL_EVENTS.map(ev => (
                          <button
                            key={ev.value}
                            onClick={() => toggleEditEvent(ev.value)}
                            className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                              editEvents.includes(ev.value)
                                ? 'bg-accent-violet/20 border-accent-violet/50 text-accent-violet'
                                : 'bg-white/[0.03] border-white/10 text-white/30 hover:text-white/50 hover:border-white/20'
                            }`}
                          >
                            {ev.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Secret
                      </label>
                      <div className="relative max-w-md">
                        <input
                          type={showEditSecret ? 'text' : 'password'}
                          value={editSecret}
                          onChange={e => setEditSecret(e.target.value)}
                          placeholder="Leave empty to remove"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent-violet/50 transition-colors pr-10"
                        />
                        <button
                          onClick={() => setShowEditSecret(!showEditSecret)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40 transition-colors"
                        >
                          {showEditSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {editError && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 text-red-400 text-xs mt-3"
                      >
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {editError}
                      </motion.div>
                    )}
                  </div>
                ) : (
                  // ── Display Mode ──────────────────────────
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Name + toggle */}
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-white font-semibold text-[15px]">{wh.name}</h3>
                          <button
                            onClick={() => handleToggle(wh.id, !wh.enabled)}
                            className="transition-colors shrink-0"
                            title={wh.enabled ? 'Disable webhook' : 'Enable webhook'}
                          >
                            {wh.enabled ? (
                              <ToggleRight className="w-6 h-6 text-emerald-400" />
                            ) : (
                              <ToggleLeft className="w-6 h-6 text-white/30" />
                            )}
                          </button>
                        </div>

                        {/* URL */}
                        <div className="flex items-center gap-2 mb-2.5">
                          <code className="text-xs text-white/30 bg-white/[0.04] px-2.5 py-1 rounded-lg max-w-[420px] truncate block font-mono">
                            {wh.url}
                          </code>
                          <button
                            onClick={() => navigator.clipboard.writeText(wh.url)}
                            className="text-white/15 hover:text-white/40 transition-colors shrink-0"
                            title="Copy URL"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Event badges */}
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {wh.events.map(ev => (
                            <span
                              key={ev}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-accent-violet/10 text-accent-violet/70 font-medium"
                            >
                              {eventLabel(ev)}
                            </span>
                          ))}
                        </div>

                        {/* Meta info */}
                        <div className="flex items-center gap-3 text-xs text-white/20">
                          {wh.secret && (
                            <span className="flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              Signed
                            </span>
                          )}
                          {wh.lastTriggered && (
                            <span>Last triggered {timeAgo(wh.lastTriggered)}</span>
                          )}
                          <span>Created {timeAgo(wh.createdAt)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Edit */}
                        <button
                          onClick={() => startEditing(wh)}
                          className="p-2 rounded-lg hover:bg-white/[0.06] text-white/25 hover:text-white/60 transition-colors"
                          title="Edit webhook"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        {/* Test */}
                        <button
                          onClick={() => handleTest(wh.id)}
                          disabled={testing === wh.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/50 hover:text-white/70 text-xs transition-colors disabled:opacity-40"
                          title="Send test payload"
                        >
                          {testing === wh.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Play className="w-3.5 h-3.5" />
                          )}
                          Test
                        </button>

                        {/* Delete / Confirm */}
                        <AnimatePresence mode="wait">
                          {confirmDelete === wh.id ? (
                            <motion.div
                              key="confirm"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="flex items-center gap-1 ml-1"
                            >
                              <span className="text-xs text-red-400/80 mr-1">Delete?</span>
                              <button
                                onClick={() => handleDelete(wh.id)}
                                className="px-2 py-1 rounded-md bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium transition-colors"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setConfirmDelete(null)}
                                className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-white/50 text-xs transition-colors"
                              >
                                No
                              </button>
                            </motion.div>
                          ) : (
                            <motion.button
                              key="trash"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              onClick={() => setConfirmDelete(wh.id)}
                              className="p-2 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors"
                              title="Delete webhook"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Test result feedback */}
                    <AnimatePresence>
                      {testResult && testResult.webhookId === wh.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          className="overflow-hidden"
                        >
                          <div
                            className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
                              testResult.success
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}
                          >
                            {testResult.success ? (
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 shrink-0" />
                            )}
                            {testResult.message}
                            <button
                              onClick={() => setTestResult(null)}
                              className="ml-auto opacity-60 hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>

        {/* ── Delivery Log ─────────────────────────────────── */}
        {!loadingList && (
          <div>
            <button
              onClick={() => { setShowLog(!showLog); if (!showLog) fetchLog() }}
              className="flex items-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors mb-3 group"
            >
              <History className="w-4 h-4" />
              <span>Delivery Log</span>
              <span className="text-white/20 group-hover:text-white/40 transition-colors">
                ({log.length})
              </span>
              {showLog ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <AnimatePresence>
              {showLog && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  {log.length === 0 ? (
                    <div className="glass rounded-xl p-8 text-center">
                      <History className="w-8 h-8 text-white/10 mx-auto mb-2" />
                      <p className="text-white/25 text-sm">No deliveries recorded yet</p>
                      <p className="text-white/15 text-xs mt-1">
                        Test a webhook or wait for events to fire
                      </p>
                    </div>
                  ) : (
                    <div className="glass rounded-xl overflow-hidden">
                      <div className="max-h-[340px] overflow-y-auto scroll-area">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-white/25 text-[10px] uppercase tracking-wider border-b border-white/[0.06]">
                              <th className="text-left py-2.5 px-4 w-10" />
                              <th className="text-left py-2.5 px-4">Webhook</th>
                              <th className="text-left py-2.5 px-4">Event</th>
                              <th className="text-left py-2.5 px-4">Response</th>
                              <th className="text-left py-2.5 px-4">Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            {log.slice(0, 50).map((entry, idx) => (
                              <motion.tr
                                key={entry.id}
                                initial={idx < 5 ? { opacity: 0 } : false}
                                animate={{ opacity: 1 }}
                                transition={{ delay: idx < 5 ? idx * 0.03 : 0 }}
                                className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                              >
                                <td className="py-2.5 px-4">
                                  {entry.success ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-red-400" />
                                  )}
                                </td>
                                <td className="py-2.5 px-4 text-white/50 text-xs">
                                  {entry.webhookName}
                                </td>
                                <td className="py-2.5 px-4">
                                  <span className="text-[10px] text-accent-violet/70 bg-accent-violet/10 px-2 py-0.5 rounded font-medium">
                                    {eventLabel(entry.event)}
                                  </span>
                                </td>
                                <td className="py-2.5 px-4">
                                  {entry.success ? (
                                    <span className="text-xs text-emerald-400/70">{entry.status}</span>
                                  ) : (
                                    <span className="text-xs text-red-400/70">
                                      {entry.status ? `HTTP ${entry.status}` : entry.error || 'Failed'}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-4 text-white/20 text-xs whitespace-nowrap">
                                  {timeAgo(entry.timestamp)}
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {log.length > 50 && (
                        <div className="px-4 py-2 border-t border-white/[0.04] text-center">
                          <span className="text-[10px] text-white/20">
                            Showing 50 of {log.length} entries
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
