import { Facebook, Instagram, Linkedin, Music2, MapPin, BookImage } from 'lucide-react'
import type { Platform } from '../types'

const PLATFORM_CONFIG: Record<Platform, { icon: typeof Facebook; color: string; label: string }> = {
  facebook:  { icon: Facebook,  color: '#1877F2', label: 'Facebook' },
  instagram: { icon: Instagram, color: '#E4405F', label: 'Instagram' },
  linkedin:  { icon: Linkedin,  color: '#0A66C2', label: 'LinkedIn' },
  tiktok:    { icon: Music2,    color: '#ff0050', label: 'TikTok' },
  google:    { icon: MapPin,    color: '#4285F4', label: 'Google' },
  stories:   { icon: BookImage, color: '#FF6B35', label: 'Stories' },
}

export function PlatformBadge({ platform, size = 'sm' }: { platform: Platform; size?: 'sm' | 'md' }) {
  const config = PLATFORM_CONFIG[platform] || PLATFORM_CONFIG.facebook
  const Icon = config.icon
  const px = size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1'
  const iconSize = size === 'sm' ? 12 : 14
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs'

  return (
    <span
      className={`inline-flex items-center gap-1 ${px} rounded-full ${textSize} font-medium`}
      style={{
        background: `${config.color}15`,
        color: config.color,
        border: `1px solid ${config.color}30`,
      }}
    >
      <Icon size={iconSize} />
      {config.label}
    </span>
  )
}

export function PlatformDot({ platform }: { platform: Platform }) {
  const config = PLATFORM_CONFIG[platform] || PLATFORM_CONFIG.facebook
  return (
    <span
      className="platform-dot"
      style={{ background: config.color }}
      title={config.label}
    />
  )
}
