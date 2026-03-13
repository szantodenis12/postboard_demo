import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Brain, MessageSquare, FileText, Sparkles, AlertCircle } from 'lucide-react'
import { useApp } from '../../../core/context'
import { useAIStatus } from '../hooks/useAI'
import { ChatPanel } from './ChatPanel'
import { BriefGenerator } from './BriefGenerator'
import { CaptionLab } from './CaptionLab'

const TABS = [
  { id: 'chat', label: 'Research', icon: MessageSquare },
  { id: 'brief', label: 'Brief Generator', icon: FileText },
  { id: 'caption', label: 'Caption Lab', icon: Sparkles },
] as const

type TabId = typeof TABS[number]['id']

export function AIStudio() {
  const { data, selectedClient: globalClient } = useApp()
  const { configured, check } = useAIStatus()
  const [activeTab, setActiveTab] = useState<TabId>('chat')
  const [selectedClientId, setSelectedClientId] = useState<string>('')

  useEffect(() => { check() }, [check])

  // Sync with global client selector
  useEffect(() => {
    if (globalClient) setSelectedClientId(globalClient)
    else if (!selectedClientId && data.clients.length > 0) setSelectedClientId(data.clients[0].id)
  }, [globalClient, data.clients, selectedClientId])

  const selectedClient = data.clients.find(c => c.id === selectedClientId)

  // Not configured state
  if (configured === false) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-2xl p-8 max-w-md text-center"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} className="text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Claude Code CLI Not Found</h3>
          <p className="text-sm text-white/40 mb-4">
            AI Studio requires the <code className="text-accent-cyan/60 text-xs">claude</code> CLI to be installed and available in PATH.
          </p>
          <div className="glass rounded-lg p-3 text-left">
            <code className="text-xs text-white/60">npm install -g @anthropic-ai/claude-code</code>
          </div>
          <p className="text-xs text-white/25 mt-3">Then restart the PostBoard server.</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-violet to-accent-cyan flex items-center justify-center">
            <Brain size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">AI Studio</h2>
            <p className="text-xs text-white/25">Content intelligence powered by Claude</p>
          </div>
        </div>

        {/* Client selector */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-white/20 font-semibold">Client</span>
          <select
            value={selectedClientId}
            onChange={e => setSelectedClientId(e.target.value)}
            className="glass rounded-lg px-3 py-2 text-sm text-white/80 bg-transparent border border-white/[0.08] outline-none focus:border-accent-violet/40 transition-colors min-w-[180px]"
          >
            {data.clients.map(c => (
              <option key={c.id} value={c.id} className="bg-[#12121a] text-white">
                {c.displayName}
              </option>
            ))}
          </select>
          {selectedClient && (
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: selectedClient.color }}
            />
          )}
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {TABS.map(tab => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${active
                  ? 'glass-active text-white'
                  : 'text-white/35 hover:text-white/60 hover:bg-white/[0.03]'
                }`}
            >
              <Icon size={14} className={active ? 'text-accent-violet' : ''} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0">
        {activeTab === 'chat' && selectedClientId && (
          <ChatPanel clientId={selectedClientId} />
        )}
        {activeTab === 'brief' && selectedClientId && (
          <BriefGenerator clientId={selectedClientId} />
        )}
        {activeTab === 'caption' && selectedClientId && (
          <CaptionLab clientId={selectedClientId} />
        )}
      </div>
    </div>
  )
}
