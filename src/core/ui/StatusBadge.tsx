import { FileEdit, CheckCircle2, Clock, Send } from 'lucide-react'
import type { PostStatus } from '../types'

const STATUS_CONFIG: Record<PostStatus, { icon: typeof FileEdit; color: string; label: string }> = {
  draft:     { icon: FileEdit,     color: '#f59e0b', label: 'Draft' },
  approved:  { icon: CheckCircle2, color: '#3b82f6', label: 'Approved' },
  scheduled: { icon: Clock,        color: '#8b5cf6', label: 'Scheduled' },
  published: { icon: Send,         color: '#10b981', label: 'Published' },
}

export function StatusBadge({ status, size = 'sm' }: { status: PostStatus; size?: 'sm' | 'md' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft
  const Icon = config.icon
  const px = size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1'
  const iconSize = size === 'sm' ? 11 : 14
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs'

  return (
    <span
      className={`inline-flex items-center gap-1 ${px} rounded-full ${textSize} font-semibold uppercase tracking-wide`}
      style={{
        background: `${config.color}15`,
        color: config.color,
        border: `1px solid ${config.color}25`,
      }}
    >
      <Icon size={iconSize} />
      {config.label}
    </span>
  )
}
