import { motion } from 'framer-motion'
import { Users, FileText, FileEdit, CheckCircle2, Clock, Send } from 'lucide-react'

interface Stats {
  clients: number
  posts: number
  draft: number
  approved: number
  scheduled: number
  published: number
}

const STAT_ITEMS = [
  { key: 'clients' as const, label: 'Clients', icon: Users, gradient: 'from-violet-500 to-indigo-500' },
  { key: 'posts' as const, label: 'Total Posts', icon: FileText, gradient: 'from-cyan-500 to-blue-500' },
  { key: 'draft' as const, label: 'Draft', icon: FileEdit, gradient: 'from-amber-500 to-orange-500' },
  { key: 'approved' as const, label: 'Approved', icon: CheckCircle2, gradient: 'from-blue-500 to-indigo-500' },
  { key: 'scheduled' as const, label: 'Scheduled', icon: Clock, gradient: 'from-purple-500 to-violet-500' },
  { key: 'published' as const, label: 'Published', icon: Send, gradient: 'from-emerald-500 to-teal-500' },
]

export function StatsBar({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {STAT_ITEMS.map((item, i) => {
        const Icon = item.icon
        return (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            className="glass glass-hover rounded-xl p-4 cursor-default group"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${item.gradient} bg-opacity-10`}>
                <Icon size={16} className="text-white/90" />
              </div>
              <div>
                <motion.div
                  className="text-xl font-bold text-white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 + 0.2 }}
                >
                  {stats[item.key]}
                </motion.div>
                <div className="text-[11px] text-white/40 uppercase tracking-wider font-medium">
                  {item.label}
                </div>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
