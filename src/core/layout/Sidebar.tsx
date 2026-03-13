import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, Zap, Plug, Bell, LogOut, ChevronDown, Users, Clock3 } from 'lucide-react'
import { useApp } from '../context'
import { modules } from '../../modules/registry'

function ClientSelector({
  clients,
  selectedClient,
  onSelect,
}: {
  clients: { id: string; displayName: string; color: string; stats: { total: number } }[]
  selectedClient: string | null
  onSelect: (id: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const active = clients.find(c => c.id === selectedClient)

  return (
    <div className="relative shrink-0" ref={ref}>
      {/* Dropdown trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="mx-3 mb-2 w-[calc(100%-24px)] flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-200 hover:bg-white/[0.04] border border-white/[0.06]"
      >
        {active ? (
          <>
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: active.color }} />
            <span className="text-[13px] font-semibold text-white truncate flex-1">{active.displayName}</span>
            <span className="text-[10px] text-white/30 font-mono">{active.stats.total}</span>
          </>
        ) : (
          <>
            <Users size={14} className="text-accent-cyan shrink-0" />
            <span className="text-[13px] font-semibold text-accent-cyan flex-1">All Clients</span>
            <span className="text-[10px] text-white/30 font-mono">{clients.reduce((s, c) => s + c.stats.total, 0)}</span>
          </>
        )}
        <ChevronDown size={13} className={`text-white/25 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown list — overlays content below */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 z-50 mx-3 rounded-xl border border-white/[0.08] bg-[#16161e]/95 backdrop-blur-xl shadow-2xl"
          >
            <div className="scroll-area max-h-[280px] p-2">
              <button
                onClick={() => { onSelect(null); setOpen(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 ${
                  selectedClient === null ? 'glass-active' : 'hover:bg-white/[0.04]'
                }`}
              >
                <Users size={12} className={selectedClient === null ? 'text-accent-cyan' : 'text-white/20'} />
                <span className={`text-[13px] font-medium flex-1 ${
                  selectedClient === null ? 'text-accent-cyan' : 'text-white/40'
                }`}>All Clients</span>
              </button>
              {clients.map(client => (
                <button
                  key={client.id}
                  onClick={() => { onSelect(client.id); setOpen(false) }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 group ${
                    selectedClient === client.id ? 'glass-active' : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0 transition-transform group-hover:scale-125"
                    style={{ background: client.color }}
                  />
                  <span className={`text-[13px] font-medium truncate flex-1 transition-colors ${
                    selectedClient === client.id ? 'text-white' : 'text-white/40 group-hover:text-white/70'
                  }`}>{client.displayName}</span>
                  <span className={`text-[11px] font-mono tabular-nums ${
                    selectedClient === client.id ? 'text-white/60' : 'text-white/20'
                  }`}>{client.stats.total}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Sidebar({
  currentView,
  onViewChange,
  onLogout,
}: {
  currentView: string
  onViewChange: (viewId: string) => void
  onLogout?: () => void
}) {
  const {
    data,
    selectedClient,
    setSelectedClient,
    refresh,
    loading,
    meta,
    unreadCount,
    markAllNotificationsRead,
    showExpiredPosts,
    setShowExpiredPosts,
  } = useApp()
  const clients = data.clients

  const mainModules = modules.filter(m => m.navSection === 'main')
  const bottomModules = modules.filter(m => m.navSection === 'bottom')

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="w-[260px] h-screen flex flex-col border-r border-white/[0.06] bg-surface-50/50 shrink-0"
    >
      {/* Logo */}
      <div className="p-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-violet to-accent-cyan flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">PostBoard</h1>
            <p className="text-[10px] text-white/30 font-medium">Epic Digital Hub</p>
          </div>
        </div>
      </div>

      {/* Global Client Selector — right under logo */}
      <ClientSelector
        clients={clients}
        selectedClient={selectedClient}
        onSelect={setSelectedClient}
      />

      <div className="px-3 mb-3">
        <button
          onClick={() => setShowExpiredPosts(!showExpiredPosts)}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all duration-200 ${
            showExpiredPosts
              ? 'border-amber-400/30 bg-amber-500/[0.06] text-amber-200'
              : 'border-white/[0.06] text-white/35 hover:text-white/60 hover:bg-white/[0.03]'
          }`}
          title="Show or hide old unpublished posts"
        >
          <Clock3 size={14} className={showExpiredPosts ? 'text-amber-300' : 'text-white/25'} />
          <span className="flex-1 text-left text-[12px] font-medium">
            {showExpiredPosts ? 'Expired Visible' : 'Expired Hidden'}
          </span>
          <span className={`text-[10px] font-semibold tracking-wider ${showExpiredPosts ? 'text-amber-200' : 'text-white/20'}`}>
            {showExpiredPosts ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="px-3 mb-2 overflow-y-auto scroll-area shrink min-h-0">
        <div className="text-[10px] uppercase tracking-widest text-white/20 font-semibold px-3 mb-2">
          Views
        </div>
        {mainModules.flatMap(mod => mod.navItems).map(item => {
          const Icon = item.icon
          const active = currentView === item.id
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                ${active
                  ? 'text-white glass-active'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/[0.02]'
                }`}
            >
              <Icon size={16} className={active ? 'text-accent-violet' : ''} />
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Footer — Bottom modules + Meta indicator + Refresh */}
      <div className="p-3 border-t border-white/[0.04] space-y-1">
        {bottomModules.flatMap(mod => mod.navItems).map(item => {
          const Icon = item.icon
          const active = currentView === item.id
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${active
                  ? 'text-white glass-active'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/[0.02]'
                }`}
            >
              <Icon size={16} className={active ? 'text-accent-violet' : ''} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.id === 'settings' && (
                meta.connected ? (
                  <span className="w-2 h-2 rounded-full bg-status-published animate-pulse" />
                ) : (
                  <Plug size={12} className="text-white/20" />
                )
              )}
            </button>
          )
        })}

        <div className="flex items-center gap-1">
          <button
            onClick={() => { onViewChange('feedback'); markAllNotificationsRead() }}
            className="relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/30 hover:text-white/60 hover:bg-white/[0.03] transition-all"
            title="Notifications"
          >
            <Bell size={13} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 left-5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-accent-violet text-[9px] font-bold text-white px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={refresh}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-white/30 hover:text-white/60 hover:bg-white/[0.03] transition-all"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Scanning...' : 'Refresh'}
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/20 hover:text-red-400/70 hover:bg-red-500/[0.05] transition-all"
              title="Sign out"
            >
              <LogOut size={13} />
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  )
}
