import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Link2, Trash2, Copy, Check, ExternalLink,
  Plus, AlertCircle, Loader2,
} from 'lucide-react'
import { useApp } from '../../../core/context'
import { useAnalytics } from '../hooks/useAnalytics'

export function MonthlyReport() {
  const { data, selectedClient } = useApp()
  const { analytics, reports, loading, loadAnalytics, generateReport, deleteReport } = useAnalytics()

  const [generating, setGenerating] = useState(false)
  const [label, setLabel] = useState('')
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [lastGenerated, setLastGenerated] = useState<{ token: string; url: string } | null>(null)

  useEffect(() => {
    if (selectedClient) loadAnalytics(selectedClient)
  }, [selectedClient, loadAnalytics])

  const client = selectedClient ? data.clients.find(c => c.id === selectedClient) : null
  const clientReports = reports.filter(r => !selectedClient || r.clientId === selectedClient)
  const formatReportPeriod = (report: { period: string; periodLabel?: string }) => report.periodLabel || report.period

  async function handleGenerate() {
    if (!selectedClient || !analytics) return
    setGenerating(true)
    const result = await generateReport(selectedClient, analytics.period, label || undefined)
    if (result) {
      setLastGenerated({ token: result.token, url: result.url })
      setLabel('')
    }
    setGenerating(false)
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/report/${token}`
    navigator.clipboard.writeText(url)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  async function handleDelete(token: string) {
    await deleteReport(token)
    if (lastGenerated?.token === token) setLastGenerated(null)
  }

  if (!selectedClient) {
    return (
      <div className="h-full flex flex-col">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-1">Reports</h2>
          <p className="text-sm text-white/30">Select a client from the sidebar</p>
        </motion.div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FileText size={48} className="text-white/10 mx-auto mb-4" />
            <p className="text-white/20 text-xs">Choose a client to generate monthly reports</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h2 className="text-2xl font-bold text-white mb-1">Monthly Reports</h2>
        <p className="text-sm text-white/30">
          {client?.displayName} — Generate shareable analytics reports
        </p>
      </motion.div>

      <div className="flex-1 scroll-area pr-2 pb-6">
        {/* Generate new report */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-6 mb-6"
        >
          <h3 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
            <Plus size={14} className="text-accent-violet" />
            Generate New Report
          </h3>

          {!analytics ? (
            <div className="flex items-center gap-3 py-4">
              <AlertCircle size={16} className="text-amber-400/60" />
              <p className="text-xs text-white/40">
                No analytics data available. Go to the Analytics tab and fetch data first.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4 text-xs text-white/40">
                <span>Period: <strong className="text-white/60">{analytics.period}</strong></span>
                <span>&middot;</span>
                <span>{analytics.combined.totalPosts} posts</span>
                <span>&middot;</span>
                <span>{analytics.combined.totalEngagement.toLocaleString('ro-RO')} total engagement</span>
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Report label (optional)"
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent-violet/40 transition-colors"
                />
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent-violet/20 text-accent-violet text-sm font-medium hover:bg-accent-violet/30 transition-colors disabled:opacity-50"
                >
                  {generating ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                  {generating ? 'Generating...' : 'Generate Report'}
                </button>
              </div>
            </>
          )}

          {/* Success message */}
          <AnimatePresence>
            {lastGenerated && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Check size={14} className="text-emerald-400" />
                  <span className="text-xs text-emerald-300 flex-1">Report generated successfully!</span>
                  <a
                    href={lastGenerated.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <ExternalLink size={12} /> Open
                  </a>
                  <button
                    onClick={() => copyLink(lastGenerated.token)}
                    className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    {copiedToken === lastGenerated.token ? <Check size={12} /> : <Copy size={12} />}
                    {copiedToken === lastGenerated.token ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Existing reports */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-sm font-semibold text-white/50 mb-4 uppercase tracking-wider flex items-center gap-2">
            <Link2 size={14} />
            Generated Reports
            <span className="text-white/20">({clientReports.length})</span>
          </h3>

          {clientReports.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center">
              <FileText size={32} className="text-white/10 mx-auto mb-3" />
              <p className="text-xs text-white/25">No reports generated yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {clientReports.map((report, i) => (
                <motion.div
                  key={report.token}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="glass glass-hover rounded-xl p-4 flex items-center gap-4 group"
                >
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-lg bg-accent-violet/10 flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-accent-violet" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white/80">
                      {report.label || `Report — ${formatReportPeriod(report)}`}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-white/30 mt-0.5">
                      <span>{report.pageName || report.clientId}</span>
                      <span>&middot;</span>
                      <span>{formatReportPeriod(report)}</span>
                      <span>&middot;</span>
                      <span>{new Date(report.createdAt).toLocaleDateString('ro-RO')}</span>
                      {report.totalPosts !== undefined && (
                        <>
                          <span>&middot;</span>
                          <span>{report.totalPosts} posts</span>
                        </>
                      )}
                      {report.totalEngagement !== undefined && (
                        <>
                          <span>&middot;</span>
                          <span>{report.totalEngagement.toLocaleString('ro-RO')} engagement</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={`/report/${report.token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/[0.04] transition-colors"
                      title="Open report"
                    >
                      <ExternalLink size={14} />
                    </a>
                    <button
                      onClick={() => copyLink(report.token)}
                      className="p-2 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/[0.04] transition-colors"
                      title="Copy link"
                    >
                      {copiedToken === report.token ? (
                        <Check size={14} className="text-emerald-400" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(report.token)}
                      className="p-2 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete report"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
