// ── Ads Manager Types ────────────────────────────────────

export type CampaignStatus = 'planning' | 'active' | 'paused' | 'completed'
export type CampaignObjective = 'awareness' | 'traffic' | 'engagement' | 'leads' | 'conversions' | 'sales'
export type AdPlatform = 'facebook' | 'instagram' | 'google' | 'tiktok'

export interface AdVariant {
  id: string
  label: string // 'A', 'B', 'C', etc.
  headline: string
  primaryText: string
  description?: string
  cta: string
  imageUrl?: string
  status: 'draft' | 'active' | 'winner' | 'loser'
  metrics: VariantMetrics
}

export interface VariantMetrics {
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  conversions: number
  spend: number
}

export interface SpendEntry {
  id: string
  date: string
  amount: number
  platform: AdPlatform
  notes?: string
}

export interface Campaign {
  id: string
  clientId: string
  name: string
  objective: CampaignObjective
  platforms: AdPlatform[]
  budget: number
  dailyBudget?: number
  startDate: string
  endDate: string
  status: CampaignStatus
  notes?: string
  createdAt: string
  updatedAt: string
  variants: AdVariant[]
  spendEntries: SpendEntry[]
}

// ── Constants ────────────────────────────────────────────

export const OBJECTIVES: { value: CampaignObjective; label: string; icon: string }[] = [
  { value: 'awareness', label: 'Brand Awareness', icon: 'Eye' },
  { value: 'traffic', label: 'Traffic', icon: 'MousePointerClick' },
  { value: 'engagement', label: 'Engagement', icon: 'Heart' },
  { value: 'leads', label: 'Lead Generation', icon: 'UserPlus' },
  { value: 'conversions', label: 'Conversions', icon: 'ShoppingCart' },
  { value: 'sales', label: 'Sales', icon: 'DollarSign' },
]

export const AD_PLATFORMS: { value: AdPlatform; label: string; color: string }[] = [
  { value: 'facebook', label: 'Facebook', color: '#1877F2' },
  { value: 'instagram', label: 'Instagram', color: '#E4405F' },
  { value: 'google', label: 'Google Ads', color: '#4285F4' },
  { value: 'tiktok', label: 'TikTok', color: '#ff0050' },
]

export const STATUS_CONFIG: Record<CampaignStatus, { label: string; color: string; bg: string }> = {
  planning: { label: 'Planning', color: '#f59e0b', bg: 'bg-amber-500/10' },
  active: { label: 'Active', color: '#10b981', bg: 'bg-emerald-500/10' },
  paused: { label: 'Paused', color: '#6366f1', bg: 'bg-indigo-500/10' },
  completed: { label: 'Completed', color: '#64748b', bg: 'bg-slate-500/10' },
}

export const VARIANT_STATUS_CONFIG: Record<AdVariant['status'], { label: string; color: string }> = {
  draft: { label: 'Draft', color: '#f59e0b' },
  active: { label: 'Active', color: '#10b981' },
  winner: { label: 'Winner', color: '#7c3aed' },
  loser: { label: 'Loser', color: '#ef4444' },
}

export const EMPTY_METRICS: VariantMetrics = {
  impressions: 0,
  clicks: 0,
  ctr: 0,
  cpc: 0,
  conversions: 0,
  spend: 0,
}
