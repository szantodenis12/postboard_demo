import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Plug,
  CheckCircle2,
  Clock,
  ExternalLink,
  Webhook,
  Timer,
  Share2,
  Briefcase,
  MapPin,
  Music,
  Zap,
  ArrowRight,
  Globe,
  RefreshCw,
  Workflow,
} from 'lucide-react'
import { useApp } from '../../../core/context'

interface PlatformCard {
  id: string
  name: string
  description: string
  color: string
  icon: typeof Plug
  status: 'connected' | 'coming-soon'
  detail?: string
}

export function IntegrationsHub() {
  const { meta } = useApp()
  const [schedulerConfig, setSchedulerConfig] = useState<any>(null)
  const [webhookCount, setWebhookCount] = useState(0)
  const [googleStatus, setGoogleStatus] = useState<any>(null)

  useEffect(() => {
    fetch('/api/scheduler/config').then(r => r.json()).then(setSchedulerConfig).catch(() => {})
    fetch('/api/webhooks').then(r => r.json()).then((data: any[]) => setWebhookCount(data.length)).catch(() => {})
    fetch('/api/google/status').then(r => r.json()).then(setGoogleStatus).catch(() => {})
  }, [])

  const platforms: PlatformCard[] = [
    {
      id: 'meta',
      name: 'Meta (Facebook + Instagram)',
      description: 'Publish posts to Facebook pages and Instagram business accounts',
      color: '#1877F2',
      icon: Share2,
      status: meta.connected ? 'connected' : 'coming-soon',
      detail: meta.connected
        ? `${meta.pages.length} page${meta.pages.length !== 1 ? 's' : ''} connected`
        : 'Not connected — go to Settings',
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      description: 'Publish to LinkedIn company pages and personal profiles',
      color: '#0A66C2',
      icon: Briefcase,
      status: 'coming-soon',
    },
    {
      id: 'google',
      name: 'Google Business Profile',
      description: 'Post updates and track insights for Google Business Profile listings',
      color: '#4285F4',
      icon: MapPin,
      status: googleStatus?.connected ? 'connected' : 'coming-soon',
      detail: googleStatus?.connected
        ? `${googleStatus.locations?.length || 0} location${(googleStatus.locations?.length || 0) !== 1 ? 's' : ''} connected`
        : googleStatus?.configured
          ? 'Not connected — go to Settings'
          : 'Add GOOGLE_CLIENT_ID to .env',
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      description: 'Publish videos to TikTok business accounts',
      color: '#ff0050',
      icon: Music,
      status: 'coming-soon',
    },
  ]

  const automationCards = [
    {
      id: 'webhooks',
      name: 'Webhooks',
      description: 'Send real-time notifications to Slack, Zapier, or any URL when events happen',
      icon: Webhook,
      color: '#f97316',
      stat: webhookCount > 0 ? `${webhookCount} configured` : 'None configured',
      viewId: 'webhooks',
    },
    {
      id: 'scheduler',
      name: 'Auto-Publish',
      description: 'Automatically publish scheduled posts when their date arrives',
      icon: Timer,
      color: '#8b5cf6',
      stat: schedulerConfig?.enabled ? 'Active' : 'Inactive',
      viewId: 'scheduler',
    },
    {
      id: 'smart-queue',
      name: 'Smart Queue',
      description: 'Automatically distribute posts across optimal time slots for the month',
      icon: Workflow,
      color: '#06b6d4',
      stat: 'Ready',
      viewId: 'smart-queue',
    },
    {
      id: 'zapier',
      name: 'Zapier',
      description: 'Connect PostBoard to 5000+ apps via Zapier webhooks',
      icon: Zap,
      color: '#FF4A00',
      stat: 'Use webhooks',
      viewId: 'webhooks',
    },
  ]

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-8 pt-8 pb-4"
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-accent-orange/20 flex items-center justify-center">
            <Plug className="w-5 h-5 text-accent-orange" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Integrations</h1>
            <p className="text-sm text-white/40">Connect platforms and configure automations</p>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scroll-area px-8 pb-8">
        {/* Platform Integrations */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
            Platform Publishing
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {platforms.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                className="glass glass-hover rounded-2xl p-5 relative overflow-hidden group"
              >
                {/* Color accent line */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{ background: p.color }}
                />

                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${p.color}20` }}
                  >
                    <p.icon className="w-6 h-6" style={{ color: p.color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-semibold">{p.name}</h3>
                      {p.status === 'connected' ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Connected
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" />
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/40 mb-2">{p.description}</p>
                    {p.detail && (
                      <p className="text-xs text-white/50">{p.detail}</p>
                    )}
                  </div>
                </div>

                {p.status === 'connected' && p.id === 'meta' && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <div className="flex flex-wrap gap-2">
                      {meta.pages.map(page => (
                        <span
                          key={page.pageId}
                          className="text-xs bg-white/5 text-white/60 px-2 py-1 rounded-lg flex items-center gap-1"
                        >
                          <Globe className="w-3 h-3" />
                          {page.pageName}
                          {page.hasInstagram && (
                            <span className="text-pink-400 ml-1">+ IG</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {p.status === 'connected' && p.id === 'google' && googleStatus?.locations?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <div className="flex flex-wrap gap-2">
                      {googleStatus.locations.map((loc: any) => (
                        <span
                          key={loc.name}
                          className="text-xs bg-white/5 text-white/60 px-2 py-1 rounded-lg flex items-center gap-1"
                        >
                          <MapPin className="w-3 h-3" />
                          {loc.locationName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Automation & Webhooks */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
            Automation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {automationCards.map((card, i) => (
              <motion.button
                key={card.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.05 }}
                onClick={() => {
                  // Navigate to the view — dispatch custom event
                  window.dispatchEvent(new CustomEvent('postboard:navigate', { detail: card.viewId }))
                }}
                className="glass glass-hover rounded-2xl p-5 text-left group relative overflow-hidden"
              >
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: card.color }}
                />
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${card.color}20` }}
                  >
                    <card.icon className="w-5 h-5" style={{ color: card.color }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-1">{card.name}</h3>
                    <p className="text-xs text-white/40 mb-3">{card.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/50">{card.stat}</span>
                      <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Integration Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 glass rounded-2xl p-6"
        >
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-accent-cyan" />
            Integration Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white/50">
            <div className="flex gap-2">
              <span className="text-accent-violet shrink-0">1.</span>
              <p>Use <strong className="text-white/70">webhooks</strong> to notify Slack when a client approves content</p>
            </div>
            <div className="flex gap-2">
              <span className="text-accent-violet shrink-0">2.</span>
              <p>Enable <strong className="text-white/70">auto-publish</strong> to skip manual "Publish" clicks for scheduled posts</p>
            </div>
            <div className="flex gap-2">
              <span className="text-accent-violet shrink-0">3.</span>
              <p>Connect to <strong className="text-white/70">Zapier</strong> via webhook URLs — no native integration needed</p>
            </div>
            <div className="flex gap-2">
              <span className="text-accent-violet shrink-0">4.</span>
              <p>Set <strong className="text-white/70">publish windows</strong> per client to control when auto-publish runs</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
