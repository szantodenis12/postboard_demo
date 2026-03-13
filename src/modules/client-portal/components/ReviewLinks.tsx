import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Link2,
  Plus,
  Copy,
  Trash2,
  Check,
  AlertCircle,
  Clock,
  ExternalLink,
  MessageSquare,
  CheckCircle2,
  LayoutDashboard,
} from 'lucide-react'
import { useApp } from '../../../core/context'
import { appUrl } from '../../../core/config'
import { useReview } from '../hooks/useReview'

export function ReviewLinks() {
  const { data } = useApp()
  const { tokens, loading, createToken, deleteToken, feedbackCountByToken } = useReview()
  const [creating, setCreating] = useState(false)
  const [formClient, setFormClient] = useState('')
  const [formLabel, setFormLabel] = useState('')
  const [formExpiry, setFormExpiry] = useState('0')
  const [copied, setCopied] = useState<string | null>(null)
  const [portalCopied, setPortalCopied] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!formClient) return
    setCreating(true)
    try {
      await createToken(formClient, formLabel || undefined, Number(formExpiry) || undefined)
      setFormLabel('')
      setFormExpiry('0')
    } catch { /* handled by toast later */ }
    setCreating(false)
  }

  const handleCopy = async (token: string) => {
    const url = appUrl(`/review/${token}`)
    await navigator.clipboard.writeText(url)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleCopyPortal = async (token: string) => {
    const url = appUrl(`/portal/${token}`)
    await navigator.clipboard.writeText(url)
    setPortalCopied(token)
    setTimeout(() => setPortalCopied(null), 2000)
  }

  const handleDelete = async (token: string) => {
    if (deleting === token) {
      await deleteToken(token)
      setDeleting(null)
    } else {
      setDeleting(token)
      setTimeout(() => setDeleting(null), 3000)
    }
  }

  const getClientName = (clientId: string) => {
    return data.clients.find(c => c.id === clientId)?.displayName || clientId
  }
  const getClientColor = (clientId: string) => {
    return data.clients.find(c => c.id === clientId)?.color || '#7c3aed'
  }

  const isExpired = (expiresAt?: string) => {
    return expiresAt ? new Date(expiresAt) < new Date() : false
  }

  const activeTokens = tokens.filter(t => !isExpired(t.expiresAt))
  const expiredTokens = tokens.filter(t => isExpired(t.expiresAt))

  return (
    <div className="h-full overflow-auto scroll-area">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-white">Review Links</h2>
          <p className="text-sm text-white/30 mt-1">
            Share links with clients to review and approve content
          </p>
        </div>

        {/* Create form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-5 space-y-4"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-white/60">
            <Plus size={14} />
            New Review Link
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={formClient}
              onChange={e => setFormClient(e.target.value)}
              className="bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-accent-violet/40"
            >
              <option value="">Select client...</option>
              {data.clients.map(c => (
                <option key={c.id} value={c.id}>{c.displayName}</option>
              ))}
            </select>

            <input
              type="text"
              value={formLabel}
              onChange={e => setFormLabel(e.target.value)}
              placeholder="Label (optional)"
              className="bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-accent-violet/40"
            />

            <select
              value={formExpiry}
              onChange={e => setFormExpiry(e.target.value)}
              className="bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-accent-violet/40"
            >
              <option value="0">No expiry</option>
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
            </select>
          </div>

          <button
            onClick={handleCreate}
            disabled={!formClient || creating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent-violet/20 text-accent-violet text-sm font-medium hover:bg-accent-violet/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Link2 size={14} />
            {creating ? 'Generating...' : 'Generate Link'}
          </button>
        </motion.div>

        {/* Active links */}
        {loading && tokens.length === 0 ? (
          <div className="text-center py-12 text-white/20 text-sm">Loading...</div>
        ) : activeTokens.length === 0 ? (
          <div className="text-center py-12 text-white/20 text-sm">
            No active review links yet. Create one above.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-[10px] uppercase tracking-widest text-white/20 font-semibold">
              Active Links ({activeTokens.length})
            </div>
            <AnimatePresence>
              {activeTokens.map((t, i) => {
                const fb = feedbackCountByToken[t.token]
                return (
                  <motion.div
                    key={t.token}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.04 }}
                    className="glass rounded-xl p-4 group"
                  >
                    <div className="flex items-start gap-3">
                      {/* Client indicator */}
                      <div
                        className="w-2 h-2 rounded-full mt-2 shrink-0"
                        style={{ background: getClientColor(t.clientId) }}
                      />

                      <div className="flex-1 min-w-0">
                        {/* Top row */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-white">
                            {getClientName(t.clientId)}
                          </span>
                          {t.label && (
                            <span className="text-xs text-white/30 px-2 py-0.5 rounded-md bg-white/[0.04]">
                              {t.label}
                            </span>
                          )}
                        </div>

                        {/* Meta row */}
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-white/25">
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {new Date(t.createdAt).toLocaleDateString('ro-RO')}
                          </span>
                          {t.expiresAt && (
                            <span>
                              Expires {new Date(t.expiresAt).toLocaleDateString('ro-RO')}
                            </span>
                          )}
                        </div>

                        {/* Feedback summary */}
                        {fb && fb.total > 0 && (
                          <div className="flex items-center gap-3 mt-2">
                            {fb.approved > 0 && (
                              <span className="flex items-center gap-1 text-[11px] text-status-published">
                                <CheckCircle2 size={11} />
                                {fb.approved} approved
                              </span>
                            )}
                            {fb.changesRequested > 0 && (
                              <span className="flex items-center gap-1 text-[11px] text-status-draft">
                                <MessageSquare size={11} />
                                {fb.changesRequested} changes
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={`${REVIEW_BASE}/review/${t.token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg text-white/20 hover:text-white/60 hover:bg-white/[0.04] transition-all"
                          title="Open review page"
                        >
                          <ExternalLink size={14} />
                        </a>
                        <button
                          onClick={() => handleCopy(t.token)}
                          className="p-2 rounded-lg text-white/20 hover:text-accent-cyan hover:bg-accent-cyan/10 transition-all"
                          title="Copy review link"
                        >
                          {copied === t.token ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                        <button
                          onClick={() => handleCopyPortal(t.token)}
                          className="p-2 rounded-lg text-white/20 hover:text-accent-violet hover:bg-accent-violet/10 transition-all"
                          title="Copy portal link"
                        >
                          {portalCopied === t.token ? <Check size={14} /> : <LayoutDashboard size={14} />}
                        </button>
                        <button
                          onClick={() => handleDelete(t.token)}
                          className={`p-2 rounded-lg transition-all ${
                            deleting === t.token
                              ? 'text-red-400 bg-red-500/10'
                              : 'text-white/20 hover:text-red-400 hover:bg-red-500/10'
                          }`}
                          title={deleting === t.token ? 'Click again to confirm' : 'Delete link'}
                        >
                          {deleting === t.token ? <AlertCircle size={14} /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Expired links */}
        {expiredTokens.length > 0 && (
          <div className="space-y-3 opacity-50">
            <div className="text-[10px] uppercase tracking-widest text-white/15 font-semibold">
              Expired ({expiredTokens.length})
            </div>
            {expiredTokens.map(t => (
              <div key={t.token} className="glass rounded-xl p-4 flex items-center gap-3">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: getClientColor(t.clientId) }}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-white/40">{getClientName(t.clientId)}</span>
                  {t.label && <span className="text-xs text-white/20 ml-2">{t.label}</span>}
                </div>
                <span className="text-[10px] text-white/15">
                  Expired {new Date(t.expiresAt!).toLocaleDateString('ro-RO')}
                </span>
                <button
                  onClick={() => deleteToken(t.token)}
                  className="p-2 rounded-lg text-white/15 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
