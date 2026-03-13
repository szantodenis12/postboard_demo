export type Platform = 'facebook' | 'instagram' | 'linkedin' | 'tiktok' | 'google' | 'stories'
export type PostStatus = 'draft' | 'approved' | 'scheduled' | 'published'
export type PostFormat = 'single-image' | 'carousel' | 'reel' | 'video' | 'stories' | 'text'
export type PostMediaType = 'image' | 'video'

export interface PublishMediaPayload {
  type: PostMediaType
  url: string
}

export interface InstagramSinglePublishPayload extends PublishMediaPayload {
  shareToFeed?: boolean
}

export interface InstagramCarouselPublishPayload {
  type: 'carousel'
  items: PublishMediaPayload[]
}

export interface InstagramStoryPublishPayload {
  type: 'story'
  media: PublishMediaPayload
}

export interface PostPublishOptions {
  requiresInstagramMusic?: boolean
}

export type InstagramPublishPayload =
  | InstagramSinglePublishPayload
  | InstagramCarouselPublishPayload
  | InstagramStoryPublishPayload

export interface PostMediaItem {
  clientId: string
  filename: string
  url: string
  type: PostMediaType
  mimeType?: string
  originalName?: string
  addedAt?: string
}

export interface Post {
  id: string
  clientId: string
  clientName: string
  date: string // ISO date
  time?: string
  platform: Platform
  format: PostFormat
  pillar?: string
  caption: string
  visualDescription?: string
  cta?: string
  hashtags: string[]
  status: PostStatus
  sourceFile: string
  requiresInstagramMusic?: boolean
}

export interface ContentFile {
  path: string
  relativePath: string
  clientId: string
  type: string
  priority: string
  lastUpdated: string
  summary: string
  postCount: number
}

export interface Client {
  id: string
  name: string
  displayName: string
  color: string
  posts: Post[]
  files: ContentFile[]
  stats: {
    total: number
    draft: number
    approved: number
    scheduled: number
    published: number
    platforms: Record<Platform, number>
  }
}

export interface MetaPage {
  pageId: string
  pageName: string
  hasInstagram: boolean
  connectedAt: string
  instagramAccountId?: string
  detectedInstagramAccountId?: string
  manualInstagramAccountId?: string
  instagramSource?: 'meta' | 'manual' | null
}

export interface MetaStatus {
  connected: boolean
  appId: string
  loginUrl: string
  pages: MetaPage[]
}

// Maps clientId → pageId
export type PageMapping = Record<string, string>

export interface PublishConfig {
  pageId: string
  pageName: string
  hasInstagram: boolean
}

export interface DashboardData {
  clients: Client[]
  totals: {
    clients: number
    posts: number
    draft: number
    approved: number
    scheduled: number
    published: number
  }
}

// ── M3: Client Portal & Approvals ──────────────────────

export interface ReviewToken {
  token: string
  clientId: string
  createdAt: string
  expiresAt?: string
  label?: string
}

export type FeedbackAction = 'approved' | 'changes-requested'

export interface ReviewFeedback {
  id: string
  token: string
  postId: string
  action: FeedbackAction
  comment?: string
  reviewerName?: string
  createdAt: string
}

export interface AppNotification {
  id: string
  type: 'feedback-approved' | 'feedback-changes-requested' | 'sla-reminder'
  token: string
  clientId: string
  postId: string
  postCaption?: string
  reviewerName?: string
  comment?: string
  read: boolean
  createdAt: string
}

// ── M8: Team & Workflow ──────────────────────────────────

export type TeamRole = 'admin' | 'manager' | 'operator'

export interface TeamMember {
  id: string
  name: string
  email: string
  role: TeamRole
  color: string
  clients: string[] // clientIds
  createdAt: string
}

export type WorkflowStage = 'brief' | 'copy' | 'design' | 'review' | 'approved' | 'scheduled'

export const WORKFLOW_STAGES: { id: WorkflowStage; label: string }[] = [
  { id: 'brief', label: 'Brief' },
  { id: 'copy', label: 'Copy' },
  { id: 'design', label: 'Design' },
  { id: 'review', label: 'Review' },
  { id: 'approved', label: 'Approved' },
  { id: 'scheduled', label: 'Scheduled' },
]

export interface WorkflowTask {
  id: string
  clientId: string
  postId?: string
  title: string
  description?: string
  stage: WorkflowStage
  assignedTo: string // member id
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: string
  createdAt: string
  updatedAt: string
}

// ── Feature: Content Pillar Balance ──────────────────────
export const CONTENT_PILLARS = [
  'educational',
  'promotional',
  'engagement',
  'behind-the-scenes',
  'testimonial',
  'inspirational',
  'informational',
  'entertainment',
] as const

export type ContentPillar = typeof CONTENT_PILLARS[number] | string

export interface PillarDistribution {
  pillar: string
  count: number
  percentage: number
  color: string
}

export interface PillarBalance {
  clientId: string
  total: number
  pillars: PillarDistribution[]
  untagged: number
}

// ── Feature: Client Health Score ─────────────────────────
export interface HealthScore {
  clientId: string
  score: number // 0-100
  grade: 'excellent' | 'good' | 'fair' | 'at-risk' | 'critical'
  factors: {
    postingConsistency: number  // 0-25
    engagementTrend: number     // 0-25
    approvalSpeed: number       // 0-25
    contractStatus: number      // 0-25
  }
  alerts: string[]
}

// ── Feature: AI Calendar Auto-Fill ───────────────────────
export interface CalendarSuggestion {
  date: string
  platform: Platform
  format: PostFormat
  pillar: string
  captionIdea: string
  visualIdea: string
  hashtags: string[]
  bestTime?: string
}

// ── Feature: Performance Prediction ──────────────────────
export interface PerformancePrediction {
  expectedReach: { min: number; max: number }
  expectedEngagement: { min: number; max: number }
  engagementRate: number
  confidence: 'low' | 'medium' | 'high'
  factors: string[]
}

// ── Feature: Smart Scheduling ────────────────────────────
export interface BestTimeSlot {
  day: string // 'monday' | 'tuesday' ...
  hour: number
  avgEngagement: number
  postCount: number
  score: number // 0-100
}

// ── Feature: Competitor Monitoring ───────────────────────
export interface CompetitorProfile {
  name: string
  platform: string
  url: string
  addedAt: string
}

// ── Feature: ROI Calculator ──────────────────────────────
export interface ROIMetrics {
  clientId: string
  monthlyRetainer: number
  postsDelivered: number
  costPerPost: number
  totalEngagement: number
  costPerEngagement: number
  estimatedAdValue: number
  roi: number
}

// ── Feature: Agency Dashboard ────────────────────────────
export interface AgencyMetrics {
  totalClients: number
  totalPosts: number
  postsThisMonth: number
  mrr: number
  avgHealthScore: number
  clientBreakdown: {
    clientId: string
    displayName: string
    color: string
    posts: number
    healthScore: number
    mrr: number
  }[]
  pillarBalance: PillarDistribution[]
  statusBreakdown: Record<PostStatus, number>
}

// ── Feature: White-Label Reports ─────────────────────────
export interface WhiteLabelConfig {
  agencyName: string
  agencyLogo?: string
  primaryColor: string
  secondaryColor: string
  footerText: string
}

// ── Feature: Client Onboarding ───────────────────────────
export interface OnboardingData {
  companyName: string
  website?: string
  facebookUrl?: string
  instagramUrl?: string
  industry?: string
  targetAudience?: string
  tone?: string
  competitors?: string
  services?: string
  monthlyBudget?: number
}
