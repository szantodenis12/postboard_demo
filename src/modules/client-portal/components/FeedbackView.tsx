import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Filter,
  User,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useApp } from '../../../core/context'
import { useReview } from '../hooks/useReview'
import type { ReviewFeedback, FeedbackAction } from '../../../core/types'

export function FeedbackView() {
  const { data } = useApp()
  const { feedback, tokens, loading } = useReview()
  const [filterClient, setFilterClient] = useState<string>('all')
  const [filterAction, setFilterAction] = useState<FeedbackAction | 'all'>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  // Build client lookup
  const clientMap = useMemo(() => {
    const map: Record<string, { name: string; color: string }> = {}
    for (const c of data.clients) {
      map[c.id] = { name: c.displayName, color: c.color }
    }
    return map
  }, [data.clients])

  // Build post lookup
  const postMap = useMemo(() => {
    const map: Record<string, { caption: string; platform: string; date: string; clientId: string }> = {}
    for (const c of data.clients) {
      for (const p of c.posts) {
        map[p.id] = { caption: p.caption, platform: p.platform, date: p.date, clientId: c.id }
      }
    }
    return map
  }, [data.clients])

  // Token → clientId lookup
  const tokenClientMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const t of tokens) map[t.token] = t.clientId
    return map
  }, [tokens])

  // Enrich + filter feedback
  const enriched = useMemo(() => {
    return feedback
      .map(fb => {
        const clientId = tokenClientMap[fb.token] || ''
        const post = postMap[fb.postId]
        const client = clientMap[clientId]
        return { ...fb, clientId, clientName: client?.name || clientId, clientColor: client?.color || '#7c3aed', post }
      })
      .filter(fb => {
        if (filterClient !== 'all' && fb.clientId !== filterClient) return false
        if (filterAction !== 'all' && fb.action !== filterAction) return false
        return true
      })
  }, [feedback, tokenClientMap, postMap, clientMap, filterClient, filterAction])

  // Stats
  const stats = useMemo(() => {
    const total = feedback.length
    const approved = feedback.filter(f => f.action === 'approved').length
    const changes = feedback.filter(f => f.action === 'changes-requested').length
    return { total, approved, changes }
  }, [feedback])

  if (loading && feedback.length === 0) {
    return <div className="h-full flex items-center justify-center text-white/20 text-sm">Loading...</div>
  }

  return (
    <div className="h-full overflow-auto scroll-area">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-white">Client Feedback</h2>
          <p className="text-sm text-white/30 mt-1">
            Approvals and change requests from review links
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-[10px] uppercase tracking-wider text-white/25 mt-1">Total</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-status-published">{stats.approved}</div>
            <div className="text-[10px] uppercase tracking-wider text-white/25 mt-1">Approved</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-status-draft">{stats.changes}</div>
            <div className="text-[10px] uppercase tracking-wider text-white/25 mt-1">Changes</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Filter size={13} className="text-white/20" />
          <select
            value={filterClient}
            onChange={e => setFilterClient(e.target.value)}
            className="bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-accent-violet/40"
          >
            <option value="all">All clients</option>
            {data.clients.map(c => (
              <option key={c.id} value={c.id}>{c.displayName}</option>
            ))}
          </select>
          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value as FeedbackAction | 'all')}
            className="bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-accent-violet/40"
          >
            <option value="all">All feedback</option>
            <option value="approved">Approved</option>
            <option value="changes-requested">Changes requested</option>
          </select>
        </div>

        {/* Feedback list */}
        {enriched.length === 0 ? (
          <div className="text-center py-12 text-white/20 text-sm">
            {feedback.length === 0 ? 'No feedback yet. Share review links with clients to get started.' : 'No feedback matches the current filters.'}
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {enriched.map((fb, i) => (
                <motion.div
                  key={fb.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="glass rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setExpanded(expanded === fb.id ? null : fb.id)}
                    className="w-full p-4 flex items-start gap-3 text-left hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Action icon */}
                    <div className={`mt-0.5 shrink-0 ${
                      fb.action === 'approved' ? 'text-status-published' : 'text-status-draft'
                    }`}>
                      {fb.action === 'approved' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Post caption preview */}
                      <p className="text-sm text-white/70 line-clamp-1">
                        {fb.post?.caption || fb.postId}
                      </p>

                      {/* Meta row */}
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-white/25 flex-wrap">
                        <span className="flex items-center gap-1">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: fb.clientColor }}
                          />
                          {fb.clientName}
                        </span>
                        {fb.post?.platform && (
                          <span className="uppercase text-[10px]">{fb.post.platform}</span>
                        )}
                        {fb.reviewerName && (
                          <span className="flex items-center gap-1">
                            <User size={9} />
                            {fb.reviewerName}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock size={9} />
                          {new Date(fb.createdAt).toLocaleDateString('ro-RO')},{' '}
                          {new Date(fb.createdAt).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Comment indicator */}
                      {fb.comment && (
                        <div className="flex items-center gap-1 mt-1.5 text-[11px] text-accent-cyan/60">
                          <MessageSquare size={10} />
                          Has comment
                        </div>
                      )}
                    </div>

                    {/* Expand arrow */}
                    <div className="text-white/15 mt-1 shrink-0">
                      {expanded === fb.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </button>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {expanded === fb.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-0 space-y-3 border-t border-white/[0.04]">
                          {/* Full caption */}
                          {fb.post?.caption && (
                            <div className="mt-3">
                              <div className="text-[10px] uppercase tracking-wider text-white/20 mb-1">Caption</div>
                              <p className="text-xs text-white/50 whitespace-pre-wrap leading-relaxed">
                                {fb.post.caption}
                              </p>
                            </div>
                          )}

                          {/* Client comment */}
                          {fb.comment && (
                            <div className="bg-accent-cyan/[0.05] border border-accent-cyan/10 rounded-lg p-3">
                              <div className="text-[10px] uppercase tracking-wider text-accent-cyan/40 mb-1">
                                Client Comment
                              </div>
                              <p className="text-xs text-white/60 whitespace-pre-wrap">
                                {fb.comment}
                              </p>
                            </div>
                          )}

                          {/* Status badge */}
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                            fb.action === 'approved'
                              ? 'bg-status-published/10 text-status-published'
                              : 'bg-status-draft/10 text-status-draft'
                          }`}>
                            {fb.action === 'approved' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                            {fb.action === 'approved' ? 'Approved' : 'Changes Requested'}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
