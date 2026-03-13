import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Search, User, Mail, Phone, Globe, MapPin, Building2,
  ChevronRight, Plus, Clock, CheckCircle2, ListTodo, FileText,
  MessageCircle, PhoneCall, Send, PenLine, X, Save, Briefcase,
  Calendar, StickyNote, Trash2,
} from 'lucide-react'
import { useApp } from '../../../core/context'
import { useCRM, type CRMProfile, type CRMActivity } from '../hooks/useCRM'

const ACTIVITY_ICONS: Record<string, typeof Clock> = {
  note: StickyNote,
  meeting: Users,
  call: PhoneCall,
  email: Send,
  'task-completed': CheckCircle2,
  'post-published': FileText,
  'invoice-sent': FileText,
  'contract-signed': Briefcase,
  other: Clock,
}

const ACTIVITY_COLORS: Record<string, string> = {
  note: '#f59e0b',
  meeting: '#7c3aed',
  call: '#06b6d4',
  email: '#3b82f6',
  'task-completed': '#10b981',
  'post-published': '#ec4899',
  'invoice-sent': '#f97316',
  'contract-signed': '#6366f1',
  other: '#64748b',
}

const ACTIVITY_TYPES = [
  { value: 'note', label: 'Note' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'call', label: 'Call' },
  { value: 'email', label: 'Email' },
  { value: 'other', label: 'Other' },
]

export function ClientProfiles() {
  const { data, selectedClient, setSelectedClient } = useApp()
  const crm = useCRM()
  const [search, setSearch] = useState('')
  const [detailClient, setDetailClient] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [editProfile, setEditProfile] = useState<CRMProfile | null>(null)
  const [showAddActivity, setShowAddActivity] = useState(false)
  const [newActivity, setNewActivity] = useState({ type: 'note', title: '', description: '', date: new Date().toISOString().split('T')[0] })

  const clients = useMemo(() => {
    let list = data.clients
    if (selectedClient) list = list.filter(c => c.id === selectedClient)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(c => {
        const profile = crm.data.profiles[c.id]
        return (
          c.displayName.toLowerCase().includes(q) ||
          profile?.contactPerson?.toLowerCase().includes(q) ||
          profile?.email?.toLowerCase().includes(q) ||
          profile?.industry?.toLowerCase().includes(q)
        )
      })
    }
    return list
  }, [data.clients, selectedClient, search, crm.data.profiles])

  const openDetail = detailClient || selectedClient
  const activeClient = openDetail ? data.clients.find(c => c.id === openDetail) : null
  const activeProfile = openDetail ? crm.data.profiles[openDetail] || { clientId: openDetail } : null
  const clientActivities = openDetail
    ? crm.data.activities.filter(a => a.clientId === openDetail).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    : []
  const clientTasks = openDetail
    ? crm.data.tasks.filter(t => t.clientId === openDetail)
    : []
  const clientContracts = openDetail
    ? crm.data.contracts.filter(c => c.clientId === openDetail)
    : []

  function startEdit() {
    setEditProfile({ clientId: openDetail!, ...activeProfile })
    setEditing(true)
  }

  async function saveEdit() {
    if (editProfile) {
      await crm.saveProfile(editProfile)
    }
    setEditing(false)
    setEditProfile(null)
  }

  async function submitActivity() {
    if (!newActivity.title.trim() || !openDetail) return
    await crm.addActivity({
      clientId: openDetail,
      type: newActivity.type as any,
      title: newActivity.title,
      description: newActivity.description || undefined,
      date: newActivity.date,
    })
    setNewActivity({ type: 'note', title: '', description: '', date: new Date().toISOString().split('T')[0] })
    setShowAddActivity(false)
  }

  // Grid view when no detail is open
  if (!openDetail) {
    return (
      <div className="h-full flex flex-col">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Client Profiles</h2>
            <p className="text-sm text-white/30">{clients.length} clients in your portfolio</p>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search clients..."
              className="pl-9 pr-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent-violet/40 w-64"
            />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto scroll-area pr-1">
          {clients.map((client, i) => {
            const profile = crm.data.profiles[client.id]
            const taskCount = crm.data.tasks.filter(t => t.clientId === client.id && t.status !== 'done').length
            const activeContract = crm.data.contracts.find(c => c.clientId === client.id && c.status === 'active')
            const lastActivity = crm.data.activities.find(a => a.clientId === client.id)

            return (
              <motion.button
                key={client.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => { setDetailClient(client.id); setSelectedClient(client.id) }}
                className="glass rounded-xl p-5 text-left hover:bg-white/[0.04] transition-all group"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ background: `${client.color}25`, border: `1px solid ${client.color}40` }}
                  >
                    {client.displayName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white truncate">{client.displayName}</h3>
                      <ChevronRight size={14} className="text-white/20 group-hover:text-white/50 transition-colors shrink-0" />
                    </div>
                    {profile?.contactPerson && (
                      <p className="text-xs text-white/40 mt-0.5 truncate">
                        <User size={10} className="inline mr-1" />{profile.contactPerson}
                      </p>
                    )}
                    {profile?.industry && (
                      <p className="text-xs text-white/25 mt-0.5 truncate">
                        <Building2 size={10} className="inline mr-1" />{profile.industry}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[11px]">
                  <span className="text-white/30">
                    <FileText size={11} className="inline mr-1" />{client.stats.total} posts
                  </span>
                  {taskCount > 0 && (
                    <span className="text-accent-orange">
                      <ListTodo size={11} className="inline mr-1" />{taskCount} tasks
                    </span>
                  )}
                  {activeContract && (
                    <span className="text-status-published">
                      <Briefcase size={11} className="inline mr-1" />Active
                    </span>
                  )}
                </div>

                {lastActivity && (
                  <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center gap-2 text-[11px] text-white/25">
                    <Clock size={10} />
                    <span className="truncate">{lastActivity.title}</span>
                    <span className="ml-auto shrink-0">{new Date(lastActivity.date).toLocaleDateString('ro-RO')}</span>
                  </div>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>
    )
  }

  // Detail view
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => { setDetailClient(null); if (!selectedClient) setSelectedClient(null) }}
            className="p-2 rounded-lg glass hover:bg-white/[0.06] text-white/40 hover:text-white transition-all"
          >
            <ChevronRight size={16} className="rotate-180" />
          </button>
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shrink-0"
            style={{ background: `${activeClient?.color}25`, border: `1px solid ${activeClient?.color}40` }}
          >
            {activeClient?.displayName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{activeClient?.displayName}</h2>
            <p className="text-sm text-white/30">
              {activeProfile?.industry || 'Client profile'} {activeProfile?.contactPerson ? `— ${activeProfile.contactPerson}` : ''}
            </p>
          </div>
        </div>
        <button
          onClick={editing ? saveEdit : startEdit}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-accent-violet/20 text-accent-violet hover:bg-accent-violet/30 transition-all"
        >
          {editing ? <><Save size={14} /> Save</> : <><PenLine size={14} /> Edit</>}
        </button>
      </motion.div>

      <div className="flex-1 overflow-y-auto scroll-area pr-1 space-y-6">
        {/* Profile Info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-5">
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Contact Information</h3>
          {editing && editProfile ? (
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'contactPerson', label: 'Contact Person', icon: User, placeholder: 'John Doe' },
                { key: 'email', label: 'Email', icon: Mail, placeholder: 'email@company.com' },
                { key: 'phone', label: 'Phone', icon: Phone, placeholder: '+40 7xx xxx xxx' },
                { key: 'website', label: 'Website', icon: Globe, placeholder: 'www.company.ro' },
                { key: 'address', label: 'Address', icon: MapPin, placeholder: 'City, Romania' },
                { key: 'industry', label: 'Industry', icon: Building2, placeholder: 'e.g., Healthcare' },
              ].map(({ key, label, icon: Icon, placeholder }) => (
                <div key={key}>
                  <label className="text-[11px] text-white/30 font-medium mb-1 flex items-center gap-1">
                    <Icon size={11} /> {label}
                  </label>
                  <input
                    value={(editProfile as any)[key] || ''}
                    onChange={e => setEditProfile({ ...editProfile, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-accent-violet/40"
                  />
                </div>
              ))}
              <div className="col-span-2">
                <label className="text-[11px] text-white/30 font-medium mb-1 flex items-center gap-1">
                  <Briefcase size={11} /> Services We Provide
                </label>
                <input
                  value={editProfile.services?.join(', ') || ''}
                  onChange={e => setEditProfile({ ...editProfile, services: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder="Social media, SEO, Ads..."
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-accent-violet/40"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[11px] text-white/30 font-medium mb-1 flex items-center gap-1">
                  <StickyNote size={11} /> Notes
                </label>
                <textarea
                  value={editProfile.notes || ''}
                  onChange={e => setEditProfile({ ...editProfile, notes: e.target.value })}
                  placeholder="Internal notes about this client..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-accent-violet/40 resize-none"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {[
                { icon: User, label: 'Contact', value: activeProfile?.contactPerson },
                { icon: Mail, label: 'Email', value: activeProfile?.email },
                { icon: Phone, label: 'Phone', value: activeProfile?.phone },
                { icon: Globe, label: 'Website', value: activeProfile?.website },
                { icon: MapPin, label: 'Address', value: activeProfile?.address },
                { icon: Building2, label: 'Industry', value: activeProfile?.industry },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <Icon size={14} className="text-white/20 shrink-0" />
                  <div>
                    <p className="text-[10px] text-white/25 uppercase tracking-wider">{label}</p>
                    <p className="text-sm text-white/70">{value || '—'}</p>
                  </div>
                </div>
              ))}
              {activeProfile?.services && activeProfile.services.length > 0 && (
                <div className="col-span-2 flex items-start gap-3 mt-2">
                  <Briefcase size={14} className="text-white/20 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">Services</p>
                    <div className="flex flex-wrap gap-1.5">
                      {activeProfile.services.map(s => (
                        <span key={s} className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-accent-violet/15 text-accent-violet border border-accent-violet/20">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {activeProfile?.notes && (
                <div className="col-span-2 flex items-start gap-3 mt-2">
                  <StickyNote size={14} className="text-white/20 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">Notes</p>
                    <p className="text-sm text-white/50 whitespace-pre-wrap">{activeProfile.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total Posts', value: activeClient?.stats.total || 0, color: '#7c3aed' },
            { label: 'Open Tasks', value: clientTasks.filter(t => t.status !== 'done').length, color: '#f97316' },
            { label: 'Active Contracts', value: clientContracts.filter(c => c.status === 'active').length, color: '#10b981' },
            { label: 'Activities', value: clientActivities.length, color: '#06b6d4' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-xl p-4 text-center"
            >
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-[11px] text-white/30 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Activity Timeline */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Activity Timeline</h3>
            <button
              onClick={() => setShowAddActivity(!showAddActivity)}
              className="flex items-center gap-1.5 text-xs text-accent-cyan hover:text-accent-cyan/80 transition-colors"
            >
              {showAddActivity ? <X size={13} /> : <Plus size={13} />}
              {showAddActivity ? 'Cancel' : 'Add'}
            </button>
          </div>

          <AnimatePresence>
            {showAddActivity && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-4"
              >
                <div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.06] space-y-3">
                  <div className="flex gap-3">
                    <select
                      value={newActivity.type}
                      onChange={e => setNewActivity({ ...newActivity, type: e.target.value })}
                      className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-accent-violet/40"
                    >
                      {ACTIVITY_TYPES.map(t => (
                        <option key={t.value} value={t.value} className="bg-surface-100">{t.label}</option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={newActivity.date}
                      onChange={e => setNewActivity({ ...newActivity, date: e.target.value })}
                      className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-accent-violet/40"
                    />
                  </div>
                  <input
                    value={newActivity.title}
                    onChange={e => setNewActivity({ ...newActivity, title: e.target.value })}
                    placeholder="Activity title..."
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-accent-violet/40"
                    onKeyDown={e => e.key === 'Enter' && submitActivity()}
                  />
                  <textarea
                    value={newActivity.description}
                    onChange={e => setNewActivity({ ...newActivity, description: e.target.value })}
                    placeholder="Description (optional)..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-accent-violet/40 resize-none"
                  />
                  <button
                    onClick={submitActivity}
                    disabled={!newActivity.title.trim()}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-accent-violet/20 text-accent-violet hover:bg-accent-violet/30 transition-all disabled:opacity-30"
                  >
                    Add Activity
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {clientActivities.length === 0 ? (
            <p className="text-sm text-white/20 text-center py-6">No activities yet. Add one to start tracking.</p>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[17px] top-2 bottom-2 w-px bg-white/[0.06]" />

              <div className="space-y-0">
                {clientActivities.slice(0, 20).map((activity) => {
                  const Icon = ACTIVITY_ICONS[activity.type] || Clock
                  const color = ACTIVITY_COLORS[activity.type] || '#64748b'

                  return (
                    <div key={activity.id} className="relative flex items-start gap-4 py-3 group">
                      <div
                        className="w-[35px] h-[35px] rounded-full flex items-center justify-center shrink-0 relative z-10"
                        style={{ background: `${color}20`, border: `1px solid ${color}35` }}
                      >
                        <Icon size={14} style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-white/70 font-medium truncate">{activity.title}</p>
                          <span className="text-[10px] text-white/20 shrink-0">
                            {new Date(activity.date).toLocaleDateString('ro-RO')}
                          </span>
                          <button
                            onClick={() => crm.deleteActivity(activity.id)}
                            className="opacity-0 group-hover:opacity-100 ml-auto p-1 rounded text-white/20 hover:text-red-400 transition-all"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        {activity.description && (
                          <p className="text-xs text-white/30 mt-0.5">{activity.description}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
