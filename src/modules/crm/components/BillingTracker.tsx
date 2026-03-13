import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Receipt, FileSignature, Plus, X, Calendar, DollarSign,
  CheckCircle2, Clock, AlertTriangle, Send, FileText, Trash2,
  ChevronDown, ChevronRight, Filter, TrendingUp, Wallet,
  Download, Eye, EyeOff,
} from 'lucide-react'
import { useApp } from '../../../core/context'
import { appUrl } from '../../../core/config'
import {
  useCRM,
  type CRMContract, type CRMInvoice,
  type ContractStatus, type InvoiceStatus,
} from '../hooks/useCRM'

const CONTRACT_STATUS: Record<ContractStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: '#10b981' },
  pending: { label: 'Pending', color: '#f59e0b' },
  expired: { label: 'Expired', color: '#64748b' },
}

const INVOICE_STATUS: Record<InvoiceStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: '#64748b' },
  sent: { label: 'Sent', color: '#3b82f6' },
  paid: { label: 'Paid', color: '#10b981' },
  overdue: { label: 'Overdue', color: '#ef4444' },
}

type Tab = 'contracts' | 'invoices'

export function BillingTracker() {
  const { data, selectedClient } = useApp()
  const crm = useCRM()
  const [tab, setTab] = useState<Tab>('contracts')
  const [showFree, setShowFree] = useState(false)
  const [showAddContract, setShowAddContract] = useState(false)
  const [showAddInvoice, setShowAddInvoice] = useState(false)
  const [newContract, setNewContract] = useState({
    title: '', startDate: '', endDate: '', monthlyValue: '', status: 'pending' as ContractStatus, notes: '',
  })
  const [newInvoice, setNewInvoice] = useState({
    number: '', amount: '', currency: 'RON', status: 'draft' as InvoiceStatus,
    issuedDate: new Date().toISOString().split('T')[0], dueDate: '', description: '',
  })

  const clientLookup = useMemo(() => {
    const map: Record<string, { name: string; color: string }> = {}
    for (const c of data.clients) map[c.id] = { name: c.displayName, color: c.color }
    return map
  }, [data.clients])

  const contracts = useMemo(() => {
    let list = crm.data.contracts
    if (selectedClient) list = list.filter(c => c.clientId === selectedClient)
    if (!showFree) list = list.filter(c => c.status === 'active' && (c.monthlyValue || 0) > 0)
    return list.sort((a, b) => {
      const order: Record<string, number> = { active: 0, pending: 1, expired: 2 }
      return (order[a.status] ?? 1) - (order[b.status] ?? 1)
    })
  }, [crm.data.contracts, selectedClient, showFree])

  const hiddenCount = useMemo(() => {
    let list = crm.data.contracts
    if (selectedClient) list = list.filter(c => c.clientId === selectedClient)
    return list.filter(c => c.status !== 'active' || (c.monthlyValue || 0) === 0).length
  }, [crm.data.contracts, selectedClient])

  const invoices = useMemo(() => {
    let list = crm.data.invoices
    if (selectedClient) list = list.filter(i => i.clientId === selectedClient)
    return list.sort((a, b) => b.issuedDate.localeCompare(a.issuedDate))
  }, [crm.data.invoices, selectedClient])

  // Summary stats
  const monthlyRevenue = contracts
    .filter(c => c.status === 'active')
    .reduce((sum, c) => sum + (c.monthlyValue || 0), 0)

  const totalOutstanding = invoices
    .filter(i => i.status === 'sent' || i.status === 'overdue')
    .reduce((sum, i) => sum + i.amount, 0)

  const totalPaid = invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + i.amount, 0)

  const overdueCount = invoices.filter(i => i.status === 'overdue').length

  async function submitContract() {
    const clientId = selectedClient || data.clients[0]?.id
    if (!clientId || !newContract.title || !newContract.startDate) return
    await crm.addContract({
      clientId,
      title: newContract.title,
      startDate: newContract.startDate,
      endDate: newContract.endDate || undefined,
      monthlyValue: newContract.monthlyValue ? parseFloat(newContract.monthlyValue) : undefined,
      status: newContract.status,
      notes: newContract.notes || undefined,
    })
    setShowAddContract(false)
    setNewContract({ title: '', startDate: '', endDate: '', monthlyValue: '', status: 'pending', notes: '' })
  }

  async function submitInvoice() {
    const clientId = selectedClient || data.clients[0]?.id
    if (!clientId || !newInvoice.number || !newInvoice.amount || !newInvoice.dueDate) return
    await crm.addInvoice({
      clientId,
      number: newInvoice.number,
      amount: parseFloat(newInvoice.amount),
      currency: newInvoice.currency,
      status: newInvoice.status,
      issuedDate: newInvoice.issuedDate,
      dueDate: newInvoice.dueDate,
      description: newInvoice.description || undefined,
    })
    setShowAddInvoice(false)
    setNewInvoice({ number: '', amount: '', currency: 'RON', status: 'draft', issuedDate: new Date().toISOString().split('T')[0], dueDate: '', description: '' })
  }

  function formatAmount(amount: number, currency = 'RON') {
    return `${amount.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Billing</h2>
          <p className="text-sm text-white/30">
            Contracts & invoices {selectedClient ? `for ${clientLookup[selectedClient]?.name}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex glass rounded-lg p-1">
            <button
              onClick={() => setTab('contracts')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                tab === 'contracts' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'
              }`}
            >
              <FileSignature size={14} className="inline mr-1.5" />Contracts
            </button>
            <button
              onClick={() => setTab('invoices')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                tab === 'invoices' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'
              }`}
            >
              <Receipt size={14} className="inline mr-1.5" />Invoices
            </button>
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Monthly Revenue', value: formatAmount(monthlyRevenue), color: '#10b981', icon: TrendingUp },
          { label: 'Outstanding', value: formatAmount(totalOutstanding), color: '#3b82f6', icon: Clock },
          { label: 'Total Paid', value: formatAmount(totalPaid), color: '#7c3aed', icon: Wallet },
          { label: 'Overdue', value: `${overdueCount} invoice${overdueCount !== 1 ? 's' : ''}`, color: overdueCount > 0 ? '#ef4444' : '#64748b', icon: AlertTriangle },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon size={14} style={{ color: stat.color }} />
              <span className="text-[10px] text-white/25 uppercase tracking-wider">{stat.label}</span>
            </div>
            <p className="text-lg font-bold text-white">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scroll-area pr-1">
        {tab === 'contracts' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/30 font-semibold uppercase tracking-wider">{contracts.length} Contracts</span>
                {hiddenCount > 0 && (
                  <button
                    onClick={() => setShowFree(!showFree)}
                    className="flex items-center gap-1 text-[11px] text-white/25 hover:text-white/50 transition-colors"
                  >
                    {showFree ? <EyeOff size={11} /> : <Eye size={11} />}
                    {showFree ? 'Hide' : 'Show'} free/inactive ({hiddenCount})
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowAddContract(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent-violet/20 text-accent-violet hover:bg-accent-violet/30 transition-all"
              >
                <Plus size={13} /> Add Contract
              </button>
            </div>

            <div className="space-y-2">
              <AnimatePresence>
                {contracts.map(contract => {
                  const sConfig = CONTRACT_STATUS[contract.status as ContractStatus] || CONTRACT_STATUS.pending
                  const client = clientLookup[contract.clientId]
                  return (
                    <motion.div
                      key={contract.id}
                      layout
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="glass rounded-xl p-4 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-white/80 truncate">{contract.title}</h4>
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase"
                              style={{ background: `${sConfig.color}15`, color: sConfig.color, border: `1px solid ${sConfig.color}25` }}
                            >
                              {sConfig.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-[11px] text-white/30">
                            {!selectedClient && client && (
                              <span style={{ color: `${client.color}99` }}>{client.name}</span>
                            )}
                            <span>
                              <Calendar size={10} className="inline mr-1" />
                              {new Date(contract.startDate).toLocaleDateString('ro-RO')}
                              {contract.endDate && ` — ${new Date(contract.endDate).toLocaleDateString('ro-RO')}`}
                            </span>
                            {contract.notes && (
                              <span className="truncate max-w-[200px]">{contract.notes}</span>
                            )}
                          </div>
                        </div>
                        {contract.monthlyValue !== undefined && contract.monthlyValue > 0 && (
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-white">{formatAmount(contract.monthlyValue)}</p>
                            <p className="text-[10px] text-white/25">/month</p>
                          </div>
                        )}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={() => window.open(appUrl(`/contract/${contract.id}`), '_blank')}
                            className="p-1.5 rounded text-white/30 hover:text-accent-cyan transition-colors"
                            title="Generate PDF"
                          >
                            <Download size={14} />
                          </button>
                          {contract.status === 'pending' && (
                            <button
                              onClick={() => crm.updateContract(contract.id, { status: 'active' })}
                              className="p-1.5 rounded text-white/30 hover:text-green-400 transition-colors"
                              title="Activate"
                            >
                              <CheckCircle2 size={14} />
                            </button>
                          )}
                          {contract.status === 'active' && (
                            <button
                              onClick={() => crm.updateContract(contract.id, { status: 'expired' })}
                              className="p-1.5 rounded text-white/30 hover:text-amber-400 transition-colors"
                              title="Mark as expired"
                            >
                              <Clock size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => crm.deleteContract(contract.id)}
                            className="p-1.5 rounded text-white/30 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>

              {contracts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16">
                  <FileSignature size={36} className="text-white/10 mb-3" />
                  <p className="text-sm text-white/25">No contracts yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'invoices' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-white/30 font-semibold uppercase tracking-wider">{invoices.length} Invoices</span>
              <button
                onClick={() => setShowAddInvoice(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent-violet/20 text-accent-violet hover:bg-accent-violet/30 transition-all"
              >
                <Plus size={13} /> Add Invoice
              </button>
            </div>

            {/* Invoice Table */}
            {invoices.length > 0 ? (
              <div className="glass rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      {['Invoice #', ...(selectedClient ? [] : ['Client']), 'Description', 'Amount', 'Issued', 'Due', 'Status', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] text-white/25 uppercase tracking-wider font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map(invoice => {
                      const sConfig = INVOICE_STATUS[invoice.status as InvoiceStatus] || INVOICE_STATUS.draft
                      const client = clientLookup[invoice.clientId]
                      const isOverdue = invoice.status !== 'paid' && new Date(invoice.dueDate) < new Date()

                      return (
                        <tr key={invoice.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] group">
                          <td className="px-4 py-3 text-sm font-mono text-white/60">{invoice.number}</td>
                          {!selectedClient && (
                            <td className="px-4 py-3">
                              <span className="text-xs" style={{ color: client ? `${client.color}99` : 'white' }}>
                                {client?.name || invoice.clientId}
                              </span>
                            </td>
                          )}
                          <td className="px-4 py-3 text-sm text-white/40 max-w-[200px] truncate">{invoice.description || '—'}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-white">{formatAmount(invoice.amount, invoice.currency)}</td>
                          <td className="px-4 py-3 text-xs text-white/30">{new Date(invoice.issuedDate).toLocaleDateString('ro-RO')}</td>
                          <td className={`px-4 py-3 text-xs ${isOverdue && invoice.status !== 'paid' ? 'text-red-400' : 'text-white/30'}`}>
                            {isOverdue && invoice.status !== 'paid' && <AlertTriangle size={10} className="inline mr-1" />}
                            {new Date(invoice.dueDate).toLocaleDateString('ro-RO')}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => {
                                const next: Record<InvoiceStatus, InvoiceStatus> = {
                                  draft: 'sent', sent: 'paid', paid: 'paid', overdue: 'paid',
                                }
                                const updates: any = { status: next[invoice.status as InvoiceStatus] }
                                if (updates.status === 'paid') updates.paidDate = new Date().toISOString().split('T')[0]
                                crm.updateInvoice(invoice.id, updates)
                              }}
                              className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase cursor-pointer hover:brightness-125 transition-all"
                              style={{ background: `${sConfig.color}15`, color: sConfig.color, border: `1px solid ${sConfig.color}25` }}
                            >
                              {sConfig.label}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => crm.deleteInvoice(invoice.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded text-white/20 hover:text-red-400 transition-all"
                            >
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <Receipt size={36} className="text-white/10 mb-3" />
                <p className="text-sm text-white/25">No invoices yet</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Contract Modal */}
      <AnimatePresence>
        {showAddContract && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowAddContract(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white">New Contract</h3>
                <button onClick={() => setShowAddContract(false)} className="p-1 rounded text-white/30 hover:text-white/60">
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] text-white/30 font-medium mb-1 block">Title</label>
                  <input
                    value={newContract.title}
                    onChange={e => setNewContract({ ...newContract, title: e.target.value })}
                    placeholder="Social Media Management"
                    className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-accent-violet/40"
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-white/30 font-medium mb-1 block">Start Date</label>
                    <input
                      type="date"
                      value={newContract.startDate}
                      onChange={e => setNewContract({ ...newContract, startDate: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-accent-violet/40"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-white/30 font-medium mb-1 block">End Date</label>
                    <input
                      type="date"
                      value={newContract.endDate}
                      onChange={e => setNewContract({ ...newContract, endDate: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-accent-violet/40"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-white/30 font-medium mb-1 block">Monthly Value (RON)</label>
                    <input
                      type="number"
                      value={newContract.monthlyValue}
                      onChange={e => setNewContract({ ...newContract, monthlyValue: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-accent-violet/40"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-white/30 font-medium mb-1 block">Status</label>
                    <select
                      value={newContract.status}
                      onChange={e => setNewContract({ ...newContract, status: e.target.value as ContractStatus })}
                      className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-accent-violet/40"
                    >
                      <option value="pending" className="bg-surface-100">Pending</option>
                      <option value="active" className="bg-surface-100">Active</option>
                      <option value="expired" className="bg-surface-100">Expired</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-white/30 font-medium mb-1 block">Notes</label>
                  <textarea
                    value={newContract.notes}
                    onChange={e => setNewContract({ ...newContract, notes: e.target.value })}
                    placeholder="Contract details..."
                    rows={2}
                    className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-accent-violet/40 resize-none"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setShowAddContract(false)} className="px-4 py-2 rounded-lg text-sm text-white/40 hover:text-white/60">Cancel</button>
                  <button
                    onClick={submitContract}
                    disabled={!newContract.title || !newContract.startDate}
                    className="px-5 py-2 rounded-lg text-sm font-medium bg-accent-violet text-white hover:bg-accent-violet/80 transition-all disabled:opacity-30"
                  >
                    Create Contract
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Invoice Modal */}
      <AnimatePresence>
        {showAddInvoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowAddInvoice(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white">New Invoice</h3>
                <button onClick={() => setShowAddInvoice(false)} className="p-1 rounded text-white/30 hover:text-white/60">
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-white/30 font-medium mb-1 block">Invoice Number</label>
                    <input
                      value={newInvoice.number}
                      onChange={e => setNewInvoice({ ...newInvoice, number: e.target.value })}
                      placeholder="INV-001"
                      className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-accent-violet/40"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-white/30 font-medium mb-1 block">Amount (RON)</label>
                    <input
                      type="number"
                      value={newInvoice.amount}
                      onChange={e => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-accent-violet/40"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-white/30 font-medium mb-1 block">Description</label>
                  <input
                    value={newInvoice.description}
                    onChange={e => setNewInvoice({ ...newInvoice, description: e.target.value })}
                    placeholder="Social media management - March 2026"
                    className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-accent-violet/40"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-white/30 font-medium mb-1 block">Issued Date</label>
                    <input
                      type="date"
                      value={newInvoice.issuedDate}
                      onChange={e => setNewInvoice({ ...newInvoice, issuedDate: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-accent-violet/40"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-white/30 font-medium mb-1 block">Due Date</label>
                    <input
                      type="date"
                      value={newInvoice.dueDate}
                      onChange={e => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-accent-violet/40"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-white/30 font-medium mb-1 block">Currency</label>
                    <select
                      value={newInvoice.currency}
                      onChange={e => setNewInvoice({ ...newInvoice, currency: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-accent-violet/40"
                    >
                      <option value="RON" className="bg-surface-100">RON</option>
                      <option value="EUR" className="bg-surface-100">EUR</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-white/30 font-medium mb-1 block">Status</label>
                    <select
                      value={newInvoice.status}
                      onChange={e => setNewInvoice({ ...newInvoice, status: e.target.value as InvoiceStatus })}
                      className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-accent-violet/40"
                    >
                      <option value="draft" className="bg-surface-100">Draft</option>
                      <option value="sent" className="bg-surface-100">Sent</option>
                      <option value="paid" className="bg-surface-100">Paid</option>
                      <option value="overdue" className="bg-surface-100">Overdue</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setShowAddInvoice(false)} className="px-4 py-2 rounded-lg text-sm text-white/40 hover:text-white/60">Cancel</button>
                  <button
                    onClick={submitInvoice}
                    disabled={!newInvoice.number || !newInvoice.amount || !newInvoice.dueDate}
                    className="px-5 py-2 rounded-lg text-sm font-medium bg-accent-violet text-white hover:bg-accent-violet/80 transition-all disabled:opacity-30"
                  >
                    Create Invoice
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
