import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { resolve, extname } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs'
import { scanClients } from './scanner.ts'
import {
  type FacebookPublishMedia,
  type InstagramPublishMedia,
  META_APP_ID,
  PUBLIC_ORIGIN,
  getLoginUrl,
  exchangeCodeForToken,
  fetchUserPages,
  getEffectiveInstagramAccountId,
  readConnections,
  readInstagramOverrides,
  writeConnections,
  writeInstagramOverrides,
  publishToFacebook,
  publishToInstagram,
} from './meta.ts'
import {
  isAIConfigured,
  streamChat,
  streamBrief,
  streamRewrite,
  streamHashtags,
  streamImagePrompt,
} from './ai.ts'
import {
  readAnalytics,
  writeAnalytics,
  fetchClientAnalytics,
  readReports,
  writeReports,
  type ClientAnalytics,
  type ReportToken as AnalyticsReportToken,
} from './insights.ts'
import {
  readWebhooks,
  writeWebhooks,
  readWebhookLog,
  triggerWebhooks,
  type Webhook,
} from './webhooks.ts'
import {
  readSchedulerConfig,
  writeSchedulerConfig,
  readSchedulerLog,
  addSchedulerLog,
  getBucharestClockTime,
  getBucharestDateString,
  isInPublishWindow,
} from './scheduler.ts'
import crmRouter from './crm.ts'
import {
  GOOGLE_CLIENT_ID,
  getGoogleLoginUrl,
  exchangeGoogleCode,
  fetchLocationInsights,
  scheduleGoogleInsightsRetry,
  getGoogleRetryStatus,
  clearGoogleRetryStatus,
  processGoogleRetryQueue,
  readGoogleRetryQueue,
  isGoogleRateLimitError,
  fetchGoogleEmail,
  refreshGoogleConnectionLocations,
  readGoogleConnections,
  writeGoogleConnections,
  readGoogleMapping,
  writeGoogleMapping,
  readGoogleAnalytics,
  writeGoogleAnalytics,
  publishToGoogle,
  type GoogleInsightsData,
  type GoogleInsightsRetryJob,
} from './google.ts'
import { registerCampaignRoutes } from './campaigns.ts'
import { registerMetaAdsRoutes } from './meta-ads.ts'
import intelligenceRouter from './intelligence.ts'
import { login, verify, authMiddleware, isAuthEnabled } from './auth.ts'

const app = express()
const PORT = 3001

// Root of the Epic Digital Hub project
const PROJECT_ROOT = resolve(import.meta.dirname, '..', '..', '..')
const STATUSES_FILE = resolve(import.meta.dirname, '..', 'data', 'statuses.json')
const CAPTIONS_FILE = resolve(import.meta.dirname, '..', 'data', 'captions.json')
const DATES_FILE = resolve(import.meta.dirname, '..', 'data', 'dates.json')
const POST_PUBLISH_OPTIONS_FILE = resolve(import.meta.dirname, '..', 'data', 'post-publish-options.json')
const HIDDEN_FILE = resolve(import.meta.dirname, '..', 'data', 'hidden.json')
const PAGE_MAPPING_FILE = resolve(import.meta.dirname, '..', 'data', 'page-mapping.json')

const UPLOADS_DIR = resolve(import.meta.dirname, '..', 'uploads')

app.use(cors())
app.use(express.json())

// ── Auth Routes ──────────────────────────────────────────
app.post('/api/auth/login', login)
app.get('/api/auth/verify', authMiddleware, verify)
app.get('/api/auth/status', (_req, res) => {
  res.json({ authEnabled: isAuthEnabled() })
})

// Protect all API routes (except public ones)
if (isAuthEnabled()) {
  app.use(authMiddleware)
}

// Serve uploaded files
app.use('/uploads', express.static(UPLOADS_DIR))

// CRM routes
app.use('/api/crm', crmRouter)

// Intelligence routes (AI calendar fill, health scores, pillar balance, ROI, etc.)
app.use('/api/intelligence', intelligenceRouter)

// ── Multer config ─────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const clientId = _req.params.clientId || 'general'
    const dir = resolve(UPLOADS_DIR, clientId)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`
    cb(null, `${uniqueSuffix}${extname(file.originalname)}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|mp4|mov|svg)$/i
    if (allowed.test(extname(file.originalname))) {
      cb(null, true)
    } else {
      cb(new Error('Only image and video files are allowed'))
    }
  },
})

// ── Status persistence ───────────────────────────────────
function readStatuses(): Record<string, string> {
  try {
    if (existsSync(STATUSES_FILE)) {
      return JSON.parse(readFileSync(STATUSES_FILE, 'utf-8'))
    }
  } catch { /* ignore */ }
  return {}
}

function writeStatuses(statuses: Record<string, string>) {
  writeFileSync(STATUSES_FILE, JSON.stringify(statuses, null, 2), 'utf-8')
}

// ── Caption overrides persistence ─────────────────────────
function readCaptions(): Record<string, { caption?: string; hashtags?: string[] }> {
  try {
    if (existsSync(CAPTIONS_FILE)) {
      return JSON.parse(readFileSync(CAPTIONS_FILE, 'utf-8'))
    }
  } catch { /* ignore */ }
  return {}
}

function writeCaptions(captions: Record<string, { caption?: string; hashtags?: string[] }>) {
  writeFileSync(CAPTIONS_FILE, JSON.stringify(captions, null, 2), 'utf-8')
}

// ── Date overrides persistence ────────────────────────────
function readDates(): Record<string, string> {
  try {
    if (existsSync(DATES_FILE)) {
      return JSON.parse(readFileSync(DATES_FILE, 'utf-8'))
    }
  } catch { /* ignore */ }
  return {}
}

function writeDates(dates: Record<string, string>) {
  writeFileSync(DATES_FILE, JSON.stringify(dates, null, 2), 'utf-8')
}

// ── Post publish options persistence ─────────────────────
function readPostPublishOptions(): Record<string, { requiresInstagramMusic?: boolean }> {
  try {
    if (existsSync(POST_PUBLISH_OPTIONS_FILE)) {
      return JSON.parse(readFileSync(POST_PUBLISH_OPTIONS_FILE, 'utf-8'))
    }
  } catch { /* ignore */ }
  return {}
}

function writePostPublishOptions(options: Record<string, { requiresInstagramMusic?: boolean }>) {
  const sanitized: Record<string, { requiresInstagramMusic?: boolean }> = {}
  for (const [postId, config] of Object.entries(options)) {
    if (config?.requiresInstagramMusic) {
      sanitized[postId] = { requiresInstagramMusic: true }
    }
  }
  writeFileSync(POST_PUBLISH_OPTIONS_FILE, JSON.stringify(sanitized, null, 2), 'utf-8')
}

// ── Hidden posts persistence ─────────────────────────────
function readHidden(): string[] {
  try {
    if (existsSync(HIDDEN_FILE)) {
      return JSON.parse(readFileSync(HIDDEN_FILE, 'utf-8'))
    }
  } catch { /* ignore */ }
  return []
}

function writeHidden(ids: string[]) {
  writeFileSync(HIDDEN_FILE, JSON.stringify(ids, null, 2), 'utf-8')
}

function getTodayIso() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Bucharest',
  }).format(new Date())
}

function applyOverrides(
  data: ReturnType<typeof scanClients>,
  options: { includeExpired?: boolean } = {},
) {
  const statusOverrides = readStatuses()
  const captionOverrides = readCaptions()
  const dateOverrides = readDates()
  const postPublishOptions = readPostPublishOptions()
  const hiddenSet = new Set(readHidden())
  const todayIso = getTodayIso()
  const includeExpired = options.includeExpired ?? true

  for (const client of data.clients) {
    // Filter out hidden posts
    if (hiddenSet.size > 0) {
      client.posts = client.posts.filter(p => !hiddenSet.has(p.id))
    }

    // Reset stats before recount
    client.stats.draft = 0
    client.stats.approved = 0
    client.stats.scheduled = 0
    client.stats.published = 0

    for (const post of client.posts) {
      if (statusOverrides[post.id]) {
        post.status = statusOverrides[post.id] as any
      }
      if (captionOverrides[post.id]) {
        if (captionOverrides[post.id].caption !== undefined) {
          post.caption = captionOverrides[post.id].caption!
        }
        if (captionOverrides[post.id].hashtags !== undefined) {
          post.hashtags = captionOverrides[post.id].hashtags!
        }
      }
      if (dateOverrides[post.id]) {
        post.date = dateOverrides[post.id]
      }
      if (postPublishOptions[post.id]?.requiresInstagramMusic) {
        post.requiresInstagramMusic = true
      } else {
        delete post.requiresInstagramMusic
      }
      client.stats[post.status]++
    }

    if (!includeExpired) {
      // Hide expired posts that were never actually published.
      client.posts = client.posts.filter(post => post.status === 'published' || post.date >= todayIso)
    }

    client.stats.draft = 0
    client.stats.approved = 0
    client.stats.scheduled = 0
    client.stats.published = 0
    client.stats.platforms = {
      facebook: 0,
      instagram: 0,
      linkedin: 0,
      tiktok: 0,
      google: 0,
      stories: 0,
    }

    for (const post of client.posts) {
      client.stats[post.status]++
      client.stats.platforms[post.platform] = (client.stats.platforms[post.platform] || 0) + 1
    }

    client.stats.total = client.posts.length
  }
  // Recalculate totals
  data.totals.posts = data.clients.reduce((s, c) => s + c.stats.total, 0)
  data.totals.draft = data.clients.reduce((s, c) => s + c.stats.draft, 0)
  data.totals.approved = data.clients.reduce((s, c) => s + c.stats.approved, 0)
  data.totals.scheduled = data.clients.reduce((s, c) => s + c.stats.scheduled, 0)
  data.totals.published = data.clients.reduce((s, c) => s + c.stats.published, 0)
  return data
}

function parseIncludeExpired(value: unknown) {
  const raw = String(value ?? '').trim().toLowerCase()
  return raw === '1' || raw === 'true' || raw === 'yes'
}

// ── Page-to-client mapping ───────────────────────────────
function readPageMapping(): Record<string, string> {
  try {
    if (existsSync(PAGE_MAPPING_FILE)) {
      return JSON.parse(readFileSync(PAGE_MAPPING_FILE, 'utf-8'))
    }
  } catch { /* ignore */ }
  return {}
}

function writePageMapping(mapping: Record<string, string>) {
  writeFileSync(PAGE_MAPPING_FILE, JSON.stringify(mapping, null, 2), 'utf-8')
}

function serializeMetaPage(page: {
  pageId: string
  pageName: string
  connectedAt: string
  instagramAccountId?: string
  manualInstagramAccountId?: string
}) {
  const instagramAccountId = getEffectiveInstagramAccountId(page)
  return {
    pageId: page.pageId,
    pageName: page.pageName,
    connectedAt: page.connectedAt,
    hasInstagram: !!instagramAccountId,
    instagramAccountId,
    detectedInstagramAccountId: page.instagramAccountId,
    manualInstagramAccountId: page.manualInstagramAccountId,
    instagramSource: page.manualInstagramAccountId ? 'manual' : page.instagramAccountId ? 'meta' : null,
  }
}

// ── API Routes ───────────────────────────────────────────

// Get all clients with their posts and stats
app.get('/api/clients', (_req, res) => {
  try {
    const data = applyOverrides(scanClients(PROJECT_ROOT), {
      includeExpired: parseIncludeExpired(_req.query.includeExpired),
    })
    res.json(data)
  } catch (error) {
    console.error('Scanner error:', error)
    res.status(500).json({ error: 'Failed to scan clients' })
  }
})

// Get single client by ID
app.get('/api/clients/:id', (req, res) => {
  try {
    const data = applyOverrides(scanClients(PROJECT_ROOT), {
      includeExpired: parseIncludeExpired(req.query.includeExpired),
    })
    const client = data.clients.find(c => c.id === req.params.id)
    if (!client) {
      res.status(404).json({ error: 'Client not found' })
      return
    }
    res.json(client)
  } catch (error) {
    console.error('Scanner error:', error)
    res.status(500).json({ error: 'Failed to scan client' })
  }
})

// Update post status
app.patch('/api/posts/:id/status', (req, res) => {
  const { id } = req.params
  const { status } = req.body
  const valid = ['draft', 'approved', 'scheduled', 'published']
  if (!valid.includes(status)) {
    res.status(400).json({ error: `Invalid status. Must be one of: ${valid.join(', ')}` })
    return
  }
  try {
    const statuses = readStatuses()
    statuses[id] = status
    writeStatuses(statuses)
    res.json({ id, status, updated: true })
    // Fire webhook
    const eventMap: Record<string, string> = { approved: 'post.approved', scheduled: 'post.scheduled', published: 'post.published' }
    const webhookEvent = eventMap[status] || 'post.status_changed'
    triggerWebhooks(webhookEvent as any, { postId: id, status }).catch(() => {})
    if (webhookEvent !== 'post.status_changed') {
      triggerWebhooks('post.status_changed', { postId: id, status }).catch(() => {})
    }
  } catch (error) {
    console.error('Status update error:', error)
    res.status(500).json({ error: 'Failed to update status' })
  }
})

// Update post date
app.patch('/api/posts/:id/date', (req, res) => {
  const { id } = req.params
  const { date } = req.body
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' })
    return
  }
  try {
    const dates = readDates()
    dates[id] = date
    writeDates(dates)
    res.json({ id, date, updated: true })
  } catch (error) {
    console.error('Date update error:', error)
    res.status(500).json({ error: 'Failed to update date' })
  }
})

// Update post caption/hashtags
app.patch('/api/posts/:id/caption', (req, res) => {
  const { id } = req.params
  const { caption, hashtags } = req.body
  if (caption === undefined && hashtags === undefined) {
    res.status(400).json({ error: 'Provide caption and/or hashtags' })
    return
  }
  try {
    const captions = readCaptions()
    const existing = captions[id] || {}
    if (caption !== undefined) existing.caption = caption
    if (hashtags !== undefined) existing.hashtags = hashtags
    captions[id] = existing
    writeCaptions(captions)
    res.json({ id, updated: true, ...existing })
  } catch (error) {
    console.error('Caption update error:', error)
    res.status(500).json({ error: 'Failed to update caption' })
  }
})

// Update post publish options
app.patch('/api/posts/:id/publish-options', (req, res) => {
  const { id } = req.params
  const { requiresInstagramMusic } = req.body
  if (requiresInstagramMusic === undefined || typeof requiresInstagramMusic !== 'boolean') {
    res.status(400).json({ error: 'Provide requiresInstagramMusic as boolean' })
    return
  }
  try {
    const options = readPostPublishOptions()
    if (requiresInstagramMusic) options[id] = { ...(options[id] || {}), requiresInstagramMusic: true }
    else delete options[id]
    writePostPublishOptions(options)
    res.json({ id, updated: true, requiresInstagramMusic })
  } catch (error) {
    console.error('Publish options update error:', error)
    res.status(500).json({ error: 'Failed to update publish options' })
  }
})

// Hide (soft-delete) a post
app.delete('/api/posts/:id', (req, res) => {
  try {
    const hidden = readHidden()
    if (!hidden.includes(req.params.id)) {
      hidden.push(req.params.id)
      writeHidden(hidden)
    }
    res.json({ success: true, hidden: hidden.length })
  } catch (error) {
    console.error('Hide post error:', error)
    res.status(500).json({ error: 'Failed to hide post' })
  }
})

// Restore a hidden post
app.post('/api/posts/:id/restore', (req, res) => {
  try {
    const hidden = readHidden().filter(id => id !== req.params.id)
    writeHidden(hidden)
    res.json({ success: true, hidden: hidden.length })
  } catch (error) {
    console.error('Restore post error:', error)
    res.status(500).json({ error: 'Failed to restore post' })
  }
})

// List all hidden post IDs
app.get('/api/posts/hidden', (_req, res) => {
  res.json({ hidden: readHidden() })
})

// Bulk update statuses
app.patch('/api/posts/status/bulk', (req, res) => {
  const { updates } = req.body as { updates: { id: string; status: string }[] }
  if (!Array.isArray(updates)) {
    res.status(400).json({ error: 'Expected { updates: [{ id, status }] }' })
    return
  }
  try {
    const statuses = readStatuses()
    for (const { id, status } of updates) {
      statuses[id] = status
    }
    writeStatuses(statuses)
    res.json({ updated: updates.length })
  } catch (error) {
    console.error('Bulk status update error:', error)
    res.status(500).json({ error: 'Failed to update statuses' })
  }
})

// ── Post Image Attachments ──────────────────────────────
const POST_IMAGES_FILE = resolve(import.meta.dirname, '..', 'data', 'post-images.json')
const POST_MEDIA_FILE = resolve(import.meta.dirname, '..', 'data', 'post-media.json')

type PostMediaType = 'image' | 'video'

interface PostImage {
  clientId: string
  filename: string
  url: string
}

interface PostMediaItem extends PostImage {
  type: PostMediaType
  mimeType?: string
  originalName?: string
  addedAt?: string
}

function inferPostMediaType(value: string): PostMediaType {
  return /\.(mp4|mov)$/i.test(value) ? 'video' : 'image'
}

function normalizePostMediaItem(item: any): PostMediaItem | null {
  const clientId = String(item?.clientId || '').trim()
  const filename = String(item?.filename || '').trim()
  const url = String(item?.url || '').trim()
  if (!clientId || !filename || !url) return null

  const type = item?.type === 'video' || item?.mimeType?.startsWith?.('video/')
    ? 'video'
    : inferPostMediaType(filename || url)

  return {
    clientId,
    filename,
    url,
    type,
    mimeType: typeof item?.mimeType === 'string' && item.mimeType.trim() ? item.mimeType.trim() : undefined,
    originalName: typeof item?.originalName === 'string' && item.originalName.trim() ? item.originalName.trim() : undefined,
    addedAt: typeof item?.addedAt === 'string' && item.addedAt.trim() ? item.addedAt.trim() : undefined,
  }
}

function readLegacyPostImages(): Record<string, PostImage> {
  try {
    if (existsSync(POST_IMAGES_FILE)) {
      return JSON.parse(readFileSync(POST_IMAGES_FILE, 'utf-8'))
    }
  } catch { /* ignore */ }
  return {}
}

function normalizePostMediaStore(raw: Record<string, any>): Record<string, PostMediaItem[]> {
  const normalized: Record<string, PostMediaItem[]> = {}
  for (const [postId, value] of Object.entries(raw || {})) {
    const entries = Array.isArray(value) ? value : value ? [value] : []
    const items = entries
      .map(normalizePostMediaItem)
      .filter((item): item is PostMediaItem => !!item)
    if (items.length > 0) normalized[postId] = items
  }
  return normalized
}

function readPostMedia(): Record<string, PostMediaItem[]> {
  try {
    if (existsSync(POST_MEDIA_FILE)) {
      return normalizePostMediaStore(JSON.parse(readFileSync(POST_MEDIA_FILE, 'utf-8')))
    }
  } catch { /* ignore */ }

  return normalizePostMediaStore(
    Object.fromEntries(
      Object.entries(readLegacyPostImages()).map(([postId, image]) => [
        postId,
        [{ ...image, type: 'image' as const }],
      ]),
    ),
  )
}

function writePostMedia(media: Record<string, PostMediaItem[]>) {
  const sanitized: Record<string, PostMediaItem[]> = {}
  for (const [postId, items] of Object.entries(media || {})) {
    const normalizedItems = (items || [])
      .map(normalizePostMediaItem)
      .filter((item): item is PostMediaItem => !!item)
    if (normalizedItems.length > 0) sanitized[postId] = normalizedItems
  }
  writeFileSync(POST_MEDIA_FILE, JSON.stringify(sanitized, null, 2), 'utf-8')
  writeFileSync(POST_IMAGES_FILE, JSON.stringify(toLegacyPostImages(sanitized), null, 2), 'utf-8')
}

function getPrimaryPostImage(items: PostMediaItem[] | undefined): PostImage | null {
  const image = (items || []).find(item => item.type === 'image')
  return image ? { clientId: image.clientId, filename: image.filename, url: image.url } : null
}

function toLegacyPostImages(media: Record<string, PostMediaItem[]>): Record<string, PostImage> {
  const images: Record<string, PostImage> = {}
  for (const [postId, items] of Object.entries(media || {})) {
    const image = getPrimaryPostImage(items)
    if (image) images[postId] = image
  }
  return images
}

function postMediaKey(item: Pick<PostMediaItem, 'clientId' | 'filename' | 'url'>) {
  return `${item.clientId}::${item.filename}::${item.url}`
}

function getFirstPostMediaByType(items: PostMediaItem[] | undefined, type: PostMediaType) {
  return (items || []).find(item => item.type === type) || null
}

function toPublicAssetUrl(url: string) {
  return /^https?:\/\//i.test(url) ? url : `${PUBLIC_ORIGIN}${url}`
}

function resolveFacebookPublishMedia(
  post: { format?: string } | null | undefined,
  items: PostMediaItem[] | undefined,
): FacebookPublishMedia | null | undefined {
  const firstVideo = getFirstPostMediaByType(items, 'video')
  const firstImage = getFirstPostMediaByType(items, 'image')

  if (post?.format === 'video' || post?.format === 'reel') {
    if (firstVideo) return { type: 'video', url: firstVideo.url }
    return null
  }

  if (firstImage) return { type: 'image', url: firstImage.url }
  return undefined
}

function resolveInstagramPublishMedia(
  post: { format?: string } | null | undefined,
  items: PostMediaItem[] | undefined,
) {
  const visualItems = (items || []).filter(item => item.type === 'image' || item.type === 'video')
  const firstVideo = getFirstPostMediaByType(items, 'video')
  const firstImage = getFirstPostMediaByType(items, 'image')

  if (post?.format === 'carousel') {
    if (visualItems.length < 2) return { payload: null, error: 'carousel_min' as const }
    if (visualItems.length > 10) return { payload: null, error: 'carousel_max' as const }
    return {
      payload: {
        type: 'carousel' as const,
        items: visualItems.map(item => ({ type: item.type, url: item.url })),
      },
    }
  }

  if (post?.format === 'stories') {
    if (visualItems.length < 1) return { payload: null, error: 'story_missing' as const }
    if (visualItems.length > 1) return { payload: null, error: 'story_multiple' as const }
    const storyMedia = visualItems[0]
    return {
      payload: {
        type: 'story' as const,
        media: { type: storyMedia.type, url: storyMedia.url },
      },
    }
  }

  if (post?.format === 'video') {
    if (firstVideo) return { payload: { type: 'video' as const, url: firstVideo.url, shareToFeed: true } }
    return { payload: null, error: 'missing_video' as const }
  }

  if (post?.format === 'reel') {
    if (firstVideo) return { payload: { type: 'video' as const, url: firstVideo.url, shareToFeed: false } }
    return { payload: null, error: 'missing_video' as const }
  }

  if (firstImage) return { payload: { type: 'image' as const, url: firstImage.url } }
  return { payload: null, error: 'missing_image' as const }
}

function appendPostMedia(postId: string, items: PostMediaItem[]) {
  const store = readPostMedia()
  const existing = store[postId] || []
  const merged = [...existing]
  const seen = new Set(existing.map(postMediaKey))

  for (const item of items) {
    const key = postMediaKey(item)
    if (!seen.has(key)) {
      merged.push(item)
      seen.add(key)
    }
  }

  if (merged.length > 0) store[postId] = merged
  else delete store[postId]
  writePostMedia(store)
  return store[postId] || []
}

function replacePostMedia(postId: string, items: PostMediaItem[]) {
  const store = readPostMedia()
  if (items.length > 0) store[postId] = items
  else delete store[postId]
  writePostMedia(store)
  return store[postId] || []
}

function removePostMedia(postId: string, filename?: string) {
  const store = readPostMedia()
  if (!store[postId]) return []

  if (!filename) {
    delete store[postId]
  } else {
    const next = store[postId].filter(item => item.filename !== filename)
    if (next.length > 0) store[postId] = next
    else delete store[postId]
  }

  writePostMedia(store)
  return store[postId] || []
}

// Get all post→media mappings
app.get('/api/post-media', (_req, res) => {
  res.json(readPostMedia())
})

// Legacy compatibility: expose the first image per post
app.get('/api/post-images', (_req, res) => {
  res.json(toLegacyPostImages(readPostMedia()))
})

// Attach a media item from the library to a post
app.put('/api/posts/:id/media', (req, res) => {
  const { id } = req.params
  const mediaItem = normalizePostMediaItem({
    clientId: req.body?.clientId,
    filename: req.body?.filename,
    url: req.body?.url,
    type: req.body?.type,
    mimeType: req.body?.mimeType,
    originalName: req.body?.originalName,
    addedAt: req.body?.addedAt || new Date().toISOString(),
  })

  if (!mediaItem) {
    res.status(400).json({ error: 'Missing or invalid clientId, filename, or url' })
    return
  }

  const replace = req.body?.replace === true
  const media = replace ? replacePostMedia(id, [mediaItem]) : appendPostMedia(id, [mediaItem])
  res.json({ success: true, media })
})

// Upload + attach one or more media files to a post
app.post('/api/posts/:id/media/:clientId', upload.array('files', 10), (req, res) => {
  const { id, clientId } = req.params
  const files = req.files as Express.Multer.File[]
  if (!files || files.length === 0) {
    res.status(400).json({ error: 'No files uploaded' })
    return
  }

  const items = files
    .map(file => normalizePostMediaItem({
      clientId,
      filename: file.filename,
      url: `/uploads/${clientId}/${file.filename}`,
      type: inferPostMediaType(file.originalname),
      mimeType: file.mimetype,
      originalName: file.originalname,
      addedAt: new Date().toISOString(),
    }))
    .filter((item): item is PostMediaItem => !!item)

  const media = appendPostMedia(id, items)
  res.json({ success: true, media, files: items })
})

// Remove one media item or clear all media from a post
app.delete('/api/posts/:id/media', (req, res) => {
  const filename = typeof req.query.filename === 'string' ? req.query.filename : undefined
  const media = removePostMedia(req.params.id, filename)
  res.json({ success: true, media })
})

// Legacy compatibility: replace a post with a single image attachment
app.put('/api/posts/:id/image', (req, res) => {
  const { id } = req.params
  const image = normalizePostMediaItem({
    clientId: req.body?.clientId,
    filename: req.body?.filename,
    url: req.body?.url,
    type: 'image',
    originalName: req.body?.originalName,
    addedAt: new Date().toISOString(),
  })
  if (!image) {
    res.status(400).json({ error: 'Missing clientId, filename, or url' })
    return
  }
  const media = replacePostMedia(id, [image])
  res.json({ success: true, image: getPrimaryPostImage(media), media })
})

// Legacy compatibility: upload a single image and replace existing media
app.post('/api/posts/:id/image/:clientId', upload.single('file'), (req, res) => {
  const { id, clientId } = req.params
  const file = req.file
  if (!file) {
    res.status(400).json({ error: 'No file uploaded' })
    return
  }
  const image = normalizePostMediaItem({
    clientId,
    filename: file.filename,
    url: `/uploads/${clientId}/${file.filename}`,
    type: 'image',
    mimeType: file.mimetype,
    originalName: file.originalname,
    addedAt: new Date().toISOString(),
  })
  if (!image) {
    res.status(400).json({ error: 'Invalid file metadata' })
    return
  }
  const media = replacePostMedia(id, [image])
  res.json({ success: true, image: { clientId, filename: file.filename, url: image.url, originalName: file.originalname }, media })
})

// Legacy compatibility: clear all attachments for a post
app.delete('/api/posts/:id/image', (req, res) => {
  removePostMedia(req.params.id)
  res.json({ success: true })
})

// ── Media Metadata Persistence ──────────────────────────
const MEDIA_META_FILE = resolve(import.meta.dirname, '..', 'data', 'media-meta.json')

function readMediaMeta(): Record<string, { tags: string[]; description: string; originalName?: string }> {
  try {
    if (existsSync(MEDIA_META_FILE)) {
      return JSON.parse(readFileSync(MEDIA_META_FILE, 'utf-8'))
    }
  } catch { /* ignore */ }
  return {}
}

function writeMediaMeta(meta: Record<string, { tags: string[]; description: string; originalName?: string }>) {
  writeFileSync(MEDIA_META_FILE, JSON.stringify(meta, null, 2), 'utf-8')
}

// Get all media metadata
app.get('/api/media/meta', (_req, res) => {
  res.json(readMediaMeta())
})

// Upsert metadata for a file (key = "clientId/filename")
app.put('/api/media/meta', (req, res) => {
  const { key, meta } = req.body
  if (!key || !meta) {
    res.status(400).json({ error: 'Missing key or meta' })
    return
  }
  const all = readMediaMeta()
  all[key] = { ...all[key], ...meta }
  writeMediaMeta(all)
  res.json({ success: true })
})

// Delete metadata for a file
app.delete('/api/media/meta', (req, res) => {
  const { key } = req.body
  if (!key) {
    res.status(400).json({ error: 'Missing key' })
    return
  }
  const all = readMediaMeta()
  delete all[key]
  writeMediaMeta(all)
  res.json({ success: true })
})

// ── Media Upload Routes ─────────────────────────────────

// List all uploads across all clients
app.get('/api/uploads', (_req, res) => {
  if (!existsSync(UPLOADS_DIR)) {
    res.json({ files: [] })
    return
  }
  try {
    const allFiles: any[] = []
    const clientDirs = readdirSync(UPLOADS_DIR).filter(d => {
      const p = resolve(UPLOADS_DIR, d)
      return statSync(p).isDirectory() && !d.startsWith('.')
    })
    for (const clientId of clientDirs) {
      const dir = resolve(UPLOADS_DIR, clientId)
      const files = readdirSync(dir)
        .filter(f => !f.startsWith('.'))
        .map(f => {
          const filepath = resolve(dir, f)
          const stat = statSync(filepath)
          return {
            filename: f,
            clientId,
            size: stat.size,
            url: `/uploads/${clientId}/${f}`,
            uploadedAt: stat.mtime.toISOString(),
          }
        })
      allFiles.push(...files)
    }
    allFiles.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
    res.json({ files: allFiles })
  } catch (error) {
    console.error('List all uploads error:', error)
    res.status(500).json({ error: 'Failed to list uploads' })
  }
})

// Upload files for a client
app.post('/api/uploads/:clientId', upload.array('files', 10), (req, res) => {
  const files = req.files as Express.Multer.File[]
  if (!files || files.length === 0) {
    res.status(400).json({ error: 'No files uploaded' })
    return
  }
  const uploaded = files.map(f => ({
    filename: f.filename,
    originalName: f.originalname,
    size: f.size,
    mimeType: f.mimetype,
    url: `/uploads/${req.params.clientId}/${f.filename}`,
  }))
  res.json({ success: true, files: uploaded })
})

// List files for a client
app.get('/api/uploads/:clientId', (req, res) => {
  const dir = resolve(UPLOADS_DIR, req.params.clientId)
  if (!existsSync(dir)) {
    res.json({ files: [] })
    return
  }
  try {
    const files = readdirSync(dir)
      .filter(f => !f.startsWith('.'))
      .map(f => {
        const filepath = resolve(dir, f)
        const stat = statSync(filepath)
        return {
          filename: f,
          size: stat.size,
          url: `/uploads/${req.params.clientId}/${f}`,
          uploadedAt: stat.mtime.toISOString(),
        }
      })
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
    res.json({ files })
  } catch (error) {
    console.error('List uploads error:', error)
    res.status(500).json({ error: 'Failed to list uploads' })
  }
})

// Delete a file
app.delete('/api/uploads/:clientId/:filename', (req, res) => {
  const filepath = resolve(UPLOADS_DIR, req.params.clientId, req.params.filename)
  if (!existsSync(filepath)) {
    res.status(404).json({ error: 'File not found' })
    return
  }
  try {
    unlinkSync(filepath)
    res.json({ success: true })
  } catch (error) {
    console.error('Delete upload error:', error)
    res.status(500).json({ error: 'Failed to delete file' })
  }
})

// ── Meta API Routes ──────────────────────────────────────

// Get Meta connection status + login URL
app.get('/api/meta/status', (_req, res) => {
  const connections = readConnections()
  res.json({
    connected: connections.pages.length > 0,
    appId: META_APP_ID,
    loginUrl: getLoginUrl(),
    pages: connections.pages.map(serializeMetaPage),
  })
})

// OAuth callback — exchange code for tokens and fetch pages
app.post('/api/meta/connect', async (req, res) => {
  const { code } = req.body
  if (!code) {
    res.status(400).json({ error: 'Missing authorization code' })
    return
  }
  try {
    const userToken = await exchangeCodeForToken(code)
    const pages = await fetchUserPages(userToken)
    const connections = readConnections()
    connections.userAccessToken = userToken
    connections.userTokenExpiry = new Date(Date.now() + 59 * 24 * 60 * 60 * 1000).toISOString()
    connections.pages = pages
    writeConnections(connections)
    const persisted = readConnections()
    res.json({ success: true, pages: persisted.pages.map(serializeMetaPage) })
  } catch (error: any) {
    console.error('Meta connect error:', error)
    res.status(500).json({ error: error.message || 'Failed to connect' })
  }
})

// Disconnect — remove all tokens
app.post('/api/meta/disconnect', (_req, res) => {
  writeConnections({ pages: [] })
  res.json({ success: true })
})

// Publish a post to Facebook
app.post('/api/meta/publish/facebook', async (req, res) => {
  const { pageId, message, media, imageUrl, videoUrl } = req.body
  if (!pageId || !message) {
    res.status(400).json({ error: 'Missing pageId or message' })
    return
  }
  const connections = readConnections()
  const page = connections.pages.find(p => p.pageId === pageId)
  if (!page) {
    res.status(404).json({ error: 'Page not connected. Please connect via Meta OAuth first.' })
    return
  }
  try {
    let payload: FacebookPublishMedia | undefined
    if (media?.url && (media?.type === 'image' || media?.type === 'video')) {
      payload = { type: media.type, url: String(media.url) }
    } else if (videoUrl) {
      payload = { type: 'video', url: String(videoUrl) }
    } else if (imageUrl) {
      payload = { type: 'image', url: String(imageUrl) }
    }

    const result = await publishToFacebook(pageId, page.pageAccessToken, message, payload)
    res.json({ success: true, postId: result.id })
  } catch (error: any) {
    console.error('Facebook publish error:', error)
    res.status(500).json({ error: error.message || 'Failed to publish' })
  }
})

// Publish a post to Instagram
app.post('/api/meta/publish/instagram', async (req, res) => {
  const { pageId, caption, media, imageUrl, videoUrl } = req.body
  if (!pageId || !caption) {
    res.status(400).json({ error: 'Missing pageId or caption' })
    return
  }
  const connections = readConnections()
  const page = connections.pages.find(p => p.pageId === pageId)
  if (!page) {
    res.status(404).json({ error: 'Page not connected' })
    return
  }
  const instagramAccountId = getEffectiveInstagramAccountId(page)
  if (!instagramAccountId) {
    res.status(400).json({ error: 'No Instagram business account linked to this Facebook page' })
    return
  }
  try {
    let payload: InstagramPublishMedia | undefined
    if (media?.type === 'story' && media.media?.url && (media.media?.type === 'image' || media.media?.type === 'video')) {
      payload = {
        type: 'story',
        media: {
          type: media.media.type,
          url: String(media.media.url),
        },
      }
    } else if (media?.type === 'carousel' && Array.isArray(media.items)) {
      const items = media.items
        .filter((item: any) => item?.url && (item?.type === 'image' || item?.type === 'video'))
        .map((item: any) => ({ type: item.type, url: String(item.url) }))
      if (items.length < 2 || items.length > 10) {
        res.status(400).json({ error: 'Instagram carousel requires between 2 and 10 media items' })
        return
      }
      payload = { type: 'carousel', items }
    } else if (media?.url && (media?.type === 'image' || media?.type === 'video')) {
      payload = {
        type: media.type,
        url: String(media.url),
        shareToFeed: typeof media.shareToFeed === 'boolean' ? media.shareToFeed : undefined,
      }
    } else if (videoUrl) {
      payload = { type: 'video', url: String(videoUrl) }
    } else if (imageUrl) {
      payload = { type: 'image', url: String(imageUrl) }
    }
    if (!payload) {
      res.status(400).json({ error: 'Missing Instagram media payload' })
      return
    }
    const result = await publishToInstagram(instagramAccountId, page.pageAccessToken, caption, payload)
    res.json({ success: true, postId: result.id })
  } catch (error: any) {
    console.error('Instagram publish error:', error)
    res.status(500).json({ error: error.message || 'Failed to publish' })
  }
})

// Add a page manually by ID (for pages that don't appear in /me/accounts)
app.post('/api/meta/add-page', async (req, res) => {
  const { pageId } = req.body
  if (!pageId) {
    res.status(400).json({ error: 'Missing pageId' })
    return
  }
  const connections = readConnections()
  if (!connections.userAccessToken) {
    res.status(400).json({ error: 'Not connected to Meta. Please connect first.' })
    return
  }
  // Check if already connected
  if (connections.pages.find(p => p.pageId === pageId)) {
    res.status(400).json({ error: 'Page already connected' })
    return
  }
  try {
    // Fetch page details directly using the user token
    const url = `https://graph.facebook.com/v21.0/${pageId}?fields=id,name,access_token,instagram_business_account{id},connected_instagram_account{id}&access_token=${connections.userAccessToken}`
    const response = await fetch(url)
    const data = await response.json()
    if (data.error) {
      res.status(400).json({ error: data.error.message || 'Could not access this page' })
      return
    }
    const page = {
      pageId: data.id,
      pageName: data.name,
      pageAccessToken: data.access_token,
      instagramAccountId: data.instagram_business_account?.id || data.connected_instagram_account?.id,
      connectedAt: new Date().toISOString(),
    }
    connections.pages.push(page)
    writeConnections(connections)
    const persisted = readConnections()
    const storedPage = persisted.pages.find(entry => entry.pageId === page.pageId)
    res.json({ success: true, page: storedPage ? serializeMetaPage(storedPage) : serializeMetaPage(page) })
  } catch (error: any) {
    console.error('Add page error:', error)
    res.status(500).json({ error: error.message || 'Failed to add page' })
  }
})

// Set or clear a manual Instagram account ID for a page
app.put('/api/meta/instagram-override', (req, res) => {
  const pageId = String(req.body?.pageId || '').trim()
  const instagramAccountIdRaw = req.body?.instagramAccountId
  const instagramAccountId = instagramAccountIdRaw === null || instagramAccountIdRaw === undefined
    ? ''
    : String(instagramAccountIdRaw).trim()

  if (!pageId) {
    res.status(400).json({ error: 'Missing pageId' })
    return
  }

  const connections = readConnections()
  const page = connections.pages.find(entry => entry.pageId === pageId)
  if (!page) {
    res.status(404).json({ error: 'Page not connected' })
    return
  }

  if (instagramAccountId && !/^\d+$/.test(instagramAccountId)) {
    res.status(400).json({ error: 'Instagram account ID must contain only digits' })
    return
  }

  try {
    const overrides = readInstagramOverrides()
    if (instagramAccountId) {
      overrides[pageId] = instagramAccountId
    } else {
      delete overrides[pageId]
    }
    writeInstagramOverrides(overrides)

    const persisted = readConnections()
    const storedPage = persisted.pages.find(entry => entry.pageId === pageId)
    if (!storedPage) {
      res.status(404).json({ error: 'Page not connected' })
      return
    }

    res.json({
      success: true,
      page: serializeMetaPage(storedPage),
    })
  } catch (error: any) {
    console.error('Instagram override error:', error)
    res.status(500).json({ error: error.message || 'Failed to save Instagram override' })
  }
})

// ── Page-to-Client Mapping Routes ────────────────────────

// Get all page-to-client mappings { clientId: pageId }
app.get('/api/meta/page-mapping', (_req, res) => {
  res.json(readPageMapping())
})

// Set a single client→page mapping
app.put('/api/meta/page-mapping', (req, res) => {
  const { clientId, pageId } = req.body
  if (!clientId) {
    res.status(400).json({ error: 'Missing clientId' })
    return
  }
  const mapping = readPageMapping()
  if (pageId) {
    mapping[clientId] = pageId
  } else {
    delete mapping[clientId]
  }
  writePageMapping(mapping)
  res.json({ success: true, mapping })
})

// ── Shareable Review Links ───────────────────────────────

const REVIEW_TOKENS_FILE = resolve(import.meta.dirname, '..', 'data', 'review-tokens.json')
const FEEDBACK_FILE = resolve(import.meta.dirname, '..', 'data', 'feedback.json')
const NOTIFICATIONS_FILE = resolve(import.meta.dirname, '..', 'data', 'notifications.json')

interface ReviewToken {
  token: string
  clientId: string
  createdAt: string
  expiresAt?: string
  label?: string
}

interface ReviewFeedback {
  id: string
  token: string
  postId: string
  action: 'approved' | 'changes-requested'
  comment?: string
  reviewerName?: string
  createdAt: string
}

interface AppNotification {
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

function readReviewTokens(): ReviewToken[] {
  try {
    if (existsSync(REVIEW_TOKENS_FILE)) {
      return JSON.parse(readFileSync(REVIEW_TOKENS_FILE, 'utf-8'))
    }
  } catch { /* ignore */ }
  return []
}

function writeReviewTokens(tokens: ReviewToken[]) {
  writeFileSync(REVIEW_TOKENS_FILE, JSON.stringify(tokens, null, 2), 'utf-8')
}

function readFeedback(): ReviewFeedback[] {
  try {
    if (existsSync(FEEDBACK_FILE)) {
      return JSON.parse(readFileSync(FEEDBACK_FILE, 'utf-8'))
    }
  } catch { /* ignore */ }
  return []
}

function writeFeedback(feedback: ReviewFeedback[]) {
  writeFileSync(FEEDBACK_FILE, JSON.stringify(feedback, null, 2), 'utf-8')
}

function readNotifications(): AppNotification[] {
  try {
    if (existsSync(NOTIFICATIONS_FILE)) {
      return JSON.parse(readFileSync(NOTIFICATIONS_FILE, 'utf-8'))
    }
  } catch { /* ignore */ }
  return []
}

function writeNotifications(notifs: AppNotification[]) {
  writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(notifs, null, 2), 'utf-8')
}

function validateReviewToken(token: string): { entry: ReviewToken | null; error?: string; status?: number } {
  const tokens = readReviewTokens()
  const entry = tokens.find(t => t.token === token)
  if (!entry) return { entry: null, error: 'Invalid or expired review link', status: 404 }
  if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) {
    return { entry: null, error: 'This review link has expired', status: 410 }
  }
  return { entry }
}

// Generate a review link for a client
app.post('/api/review/create', (req, res) => {
  const { clientId, label, expiresInDays } = req.body
  if (!clientId) {
    res.status(400).json({ error: 'Missing clientId' })
    return
  }
  const token = `rv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
  const entry: ReviewToken = {
    token,
    clientId,
    createdAt: new Date().toISOString(),
    label: label || undefined,
  }
  if (expiresInDays) {
    entry.expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
  }
  const tokens = readReviewTokens()
  tokens.push(entry)
  writeReviewTokens(tokens)
  triggerWebhooks('review.created', { clientId, token, label }).catch(() => {})
  res.json({ success: true, token, url: `/review/${token}` })
})

// List all review tokens
app.get('/api/review/tokens', (_req, res) => {
  res.json(readReviewTokens())
})

// Delete a review token
app.delete('/api/review/:token', (req, res) => {
  const tokens = readReviewTokens().filter(t => t.token !== req.params.token)
  writeReviewTokens(tokens)
  res.json({ success: true })
})

// Public review endpoint — returns client posts (no auth needed)
app.get('/api/review/:token/data', (req, res) => {
  const tokens = readReviewTokens()
  const entry = tokens.find(t => t.token === req.params.token)
  if (!entry) {
    res.status(404).json({ error: 'Invalid or expired review link' })
    return
  }
  if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) {
    res.status(410).json({ error: 'This review link has expired' })
    return
  }
  try {
    const data = applyOverrides(scanClients(PROJECT_ROOT))
    const client = data.clients.find(c => c.id === entry.clientId)
    if (!client) {
      res.status(404).json({ error: 'Client not found' })
      return
    }
    const postMedia = readPostMedia()

    // Return only non-sensitive data
    res.json({
      client: {
        displayName: client.displayName,
        color: client.color,
        stats: client.stats,
        posts: client.posts.map(p => ({
          id: p.id,
          date: p.date,
          time: p.time,
          platform: p.platform,
          format: p.format,
          pillar: p.pillar,
          caption: p.caption,
          visualDescription: p.visualDescription,
          cta: p.cta,
          hashtags: p.hashtags,
          status: p.status,
          imageUrl: getPrimaryPostImage(postMedia[p.id])?.url || null,
          media: postMedia[p.id] || [],
        })),
      },
    })
  } catch (error) {
    console.error('Review data error:', error)
    res.status(500).json({ error: 'Failed to load review data' })
  }
})

// ── Feedback Routes (Client Portal M3) ──────────────────

// Submit feedback on a post (from client review page)
app.post('/api/review/:token/posts/:postId/feedback', (req, res) => {
  const { token, postId } = req.params
  const { action, comment, reviewerName } = req.body

  const validation = validateReviewToken(token)
  if (!validation.entry) {
    res.status(validation.status!).json({ error: validation.error })
    return
  }
  if (!['approved', 'changes-requested'].includes(action)) {
    res.status(400).json({ error: 'Invalid action. Must be "approved" or "changes-requested"' })
    return
  }

  const feedback = readFeedback()
  // Deduplicate: remove previous feedback for same token+postId
  const filtered = feedback.filter(f => !(f.token === token && f.postId === postId))
  const entry: ReviewFeedback = {
    id: `fb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    token,
    postId,
    action,
    comment: comment || undefined,
    reviewerName: reviewerName || undefined,
    createdAt: new Date().toISOString(),
  }
  filtered.push(entry)
  writeFeedback(filtered)

  // ── Update post status based on client feedback ────────
  const newStatus = action === 'approved' ? 'approved' : 'draft'
  try {
    const statuses = readStatuses()
    statuses[postId] = newStatus
    writeStatuses(statuses)
  } catch (err) {
    console.error('Failed to update post status from review feedback:', err)
  }

  // Resolve post caption for notification context
  let postCaption: string | undefined
  try {
    const data = applyOverrides(scanClients(PROJECT_ROOT))
    for (const client of data.clients) {
      const post = client.posts.find(p => p.id === postId)
      if (post) { postCaption = post.caption?.slice(0, 120); break }
    }
  } catch { /* ignore */ }

  // Create notification for the agency
  const reviewerLabel = reviewerName ? reviewerName : 'Client'
  const notifs = readNotifications()
  notifs.unshift({
    id: `n_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    type: action === 'approved' ? 'feedback-approved' : 'feedback-changes-requested',
    token,
    clientId: validation.entry.clientId,
    postId,
    postCaption,
    reviewerName: reviewerLabel,
    comment: comment || undefined,
    read: false,
    createdAt: new Date().toISOString(),
  })
  writeNotifications(notifs)

  // Fire webhooks: feedback event + status-specific event
  const clientId = validation.entry.clientId
  triggerWebhooks('feedback.received', {
    postId,
    clientId,
    action,
    reviewerName: reviewerLabel,
    comment,
    newStatus,
  }).catch(() => {})

  if (action === 'approved') {
    triggerWebhooks('post.approved', { postId, clientId, status: newStatus, source: 'client-review', reviewerName: reviewerLabel }).catch(() => {})
  }
  triggerWebhooks('post.status_changed', { postId, clientId, status: newStatus, source: 'client-review', reviewerName: reviewerLabel }).catch(() => {})

  res.json({ success: true, feedback: entry, statusUpdated: newStatus })
})

// Get feedback for a review session
app.get('/api/review/:token/feedback', (req, res) => {
  const validation = validateReviewToken(req.params.token)
  if (!validation.entry) {
    res.status(validation.status!).json({ error: validation.error })
    return
  }
  const feedback = readFeedback().filter(f => f.token === req.params.token)
  res.json({ feedback })
})

// Get all feedback (internal dashboard)
app.get('/api/feedback', (_req, res) => {
  const feedback = readFeedback().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  res.json({ feedback })
})

// ── Notification Routes ─────────────────────────────────

// List notifications
app.get('/api/notifications', (_req, res) => {
  const notifs = readNotifications().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  res.json({ notifications: notifs })
})

// Mark single notification read
app.patch('/api/notifications/:id/read', (req, res) => {
  const notifs = readNotifications()
  const notif = notifs.find(n => n.id === req.params.id)
  if (!notif) {
    res.status(404).json({ error: 'Notification not found' })
    return
  }
  notif.read = true
  writeNotifications(notifs)
  res.json({ success: true })
})

// Mark all notifications read
app.post('/api/notifications/read-all', (_req, res) => {
  const notifs = readNotifications()
  for (const n of notifs) n.read = true
  writeNotifications(notifs)
  res.json({ success: true })
})

// ── SLA / Approval Tracker Routes ─────────────────────

const SLA_CONFIG_FILE = resolve(import.meta.dirname, '..', 'data', 'sla-config.json')

interface SLAConfig {
  defaultDeadlineHours: number
  reminderIntervals: number[]
  clients: Record<string, { deadlineHours: number }>
}

function readSLAConfig(): SLAConfig {
  try {
    if (existsSync(SLA_CONFIG_FILE)) {
      return JSON.parse(readFileSync(SLA_CONFIG_FILE, 'utf-8'))
    }
  } catch { /* ignore */ }
  return { defaultDeadlineHours: 48, reminderIntervals: [24, 6, 1], clients: {} }
}

function writeSLAConfig(config: SLAConfig) {
  writeFileSync(SLA_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8')
}

// Get SLA config
app.get('/api/sla/config', (_req, res) => {
  res.json(readSLAConfig())
})

// Update SLA config
app.put('/api/sla/config', (req, res) => {
  const { defaultDeadlineHours, reminderIntervals, clients } = req.body
  const config = readSLAConfig()
  if (typeof defaultDeadlineHours === 'number') config.defaultDeadlineHours = defaultDeadlineHours
  if (Array.isArray(reminderIntervals)) config.reminderIntervals = reminderIntervals
  if (clients && typeof clients === 'object') config.clients = clients
  writeSLAConfig(config)
  res.json({ success: true, config })
})

// Get SLA status for all active reviews
app.get('/api/sla/status', (_req, res) => {
  try {
    const config = readSLAConfig()
    const tokens = readReviewTokens()
    const feedback = readFeedback()
    const data = applyOverrides(scanClients(PROJECT_ROOT))

    const clientMap: Record<string, string> = {}
    const postCountMap: Record<string, number> = {}
    for (const c of data.clients) {
      clientMap[c.id] = c.displayName
      postCountMap[c.id] = c.posts.length
    }

    // Build feedback lookup by token
    const feedbackByToken: Record<string, { approved: number; changesRequested: number; lastActivity?: string }> = {}
    for (const fb of feedback) {
      if (!feedbackByToken[fb.token]) feedbackByToken[fb.token] = { approved: 0, changesRequested: 0 }
      if (fb.action === 'approved') feedbackByToken[fb.token].approved++
      else feedbackByToken[fb.token].changesRequested++
      if (!feedbackByToken[fb.token].lastActivity || fb.createdAt > feedbackByToken[fb.token].lastActivity!) {
        feedbackByToken[fb.token].lastActivity = fb.createdAt
      }
    }

    const now = Date.now()
    const statuses = tokens.map(t => {
      // Skip expired tokens (they aren't pending)
      if (t.expiresAt && new Date(t.expiresAt) < new Date()) return null

      const deadlineHours = config.clients[t.clientId]?.deadlineHours || config.defaultDeadlineHours
      const createdMs = new Date(t.createdAt).getTime()
      const deadlineMs = createdMs + deadlineHours * 60 * 60 * 1000
      const hoursRemaining = (deadlineMs - now) / (1000 * 60 * 60)

      const totalPosts = postCountMap[t.clientId] || 0
      const fb = feedbackByToken[t.token] || { approved: 0, changesRequested: 0 }
      const pendingCount = totalPosts - fb.approved - fb.changesRequested

      let status: 'on-track' | 'warning' | 'urgent' | 'overdue'
      if (hoursRemaining < 0) status = 'overdue'
      else if (hoursRemaining <= 6) status = 'urgent'
      else if (hoursRemaining <= 24) status = 'warning'
      else status = 'on-track'

      return {
        token: t.token,
        clientId: t.clientId,
        clientName: clientMap[t.clientId] || t.clientId,
        label: t.label,
        totalPosts,
        approvedCount: fb.approved,
        changesRequestedCount: fb.changesRequested,
        pendingCount: Math.max(0, pendingCount),
        createdAt: t.createdAt,
        deadlineAt: new Date(deadlineMs).toISOString(),
        hoursRemaining: Math.round(hoursRemaining * 10) / 10,
        status,
        lastActivity: fb.lastActivity || null,
      }
    }).filter(Boolean)

    res.json({ statuses, config })
  } catch (error) {
    console.error('SLA status error:', error)
    res.status(500).json({ error: 'Failed to compute SLA status' })
  }
})

// Manually send a reminder for a review token
app.post('/api/sla/remind/:token', (req, res) => {
  const token = req.params.token
  const tokens = readReviewTokens()
  const entry = tokens.find(t => t.token === token)
  if (!entry) {
    res.status(404).json({ error: 'Review token not found' })
    return
  }

  const data = applyOverrides(scanClients(PROJECT_ROOT))
  const client = data.clients.find(c => c.id === entry.clientId)
  const clientName = client?.displayName || entry.clientId

  // Create a reminder notification
  const notifs = readNotifications()
  notifs.unshift({
    id: `n_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    type: 'sla-reminder',
    token,
    clientId: entry.clientId,
    postId: '',
    postCaption: `SLA reminder sent to ${clientName}`,
    reviewerName: 'System',
    read: false,
    createdAt: new Date().toISOString(),
  })
  writeNotifications(notifs)

  // Trigger webhook for reminder
  triggerWebhooks('review.reminder', {
    token,
    clientId: entry.clientId,
    clientName,
    label: entry.label,
    message: req.body.message || `Reminder: pending content review for ${clientName}`,
  }).catch(() => {})

  res.json({ success: true, message: `Reminder sent for ${clientName}` })
})

// Extend deadline for a review token
app.post('/api/sla/extend/:token', (req, res) => {
  const token = req.params.token
  const { hours } = req.body
  if (!hours || typeof hours !== 'number') {
    res.status(400).json({ error: 'Missing hours parameter' })
    return
  }
  // We extend by adjusting the SLA config per-client, or we can store per-token overrides
  // For simplicity, we'll extend by moving the token's createdAt forward
  const tokens = readReviewTokens()
  const entry = tokens.find(t => t.token === token)
  if (!entry) {
    res.status(404).json({ error: 'Review token not found' })
    return
  }
  // Push createdAt forward by the requested hours — effectively extending the deadline
  const newCreatedAt = new Date(new Date(entry.createdAt).getTime() + hours * 60 * 60 * 1000).toISOString()
  entry.createdAt = newCreatedAt
  writeReviewTokens(tokens)

  res.json({ success: true, newCreatedAt })
})

// ── AI Routes ───────────────────────────────────────────

// Check AI status
app.get('/api/ai/status', (_req, res) => {
  res.json({ configured: isAIConfigured() })
})

// AI Chat (streaming)
app.post('/api/ai/chat', async (req, res) => {
  const { clientId, messages } = req.body
  if (!clientId || !Array.isArray(messages)) {
    res.status(400).json({ error: 'Missing clientId or messages' })
    return
  }
  try {
    await streamChat(res, PROJECT_ROOT, clientId, messages)
  } catch (error: any) {
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'AI chat failed' })
    }
  }
})

// Generate content brief (streaming)
app.post('/api/ai/brief', async (req, res) => {
  const { clientId, platform, format, topic, notes } = req.body
  if (!clientId || !platform || !format || !topic) {
    res.status(400).json({ error: 'Missing clientId, platform, format, or topic' })
    return
  }
  try {
    await streamBrief(res, PROJECT_ROOT, clientId, platform, format, topic, notes)
  } catch (error: any) {
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Brief generation failed' })
    }
  }
})

// Rewrite caption (streaming)
app.post('/api/ai/rewrite', async (req, res) => {
  const { clientId, caption, platform, tone } = req.body
  if (!clientId || !caption || !platform) {
    res.status(400).json({ error: 'Missing clientId, caption, or platform' })
    return
  }
  try {
    await streamRewrite(res, PROJECT_ROOT, clientId, caption, platform, tone)
  } catch (error: any) {
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Caption rewrite failed' })
    }
  }
})

// Suggest hashtags (streaming)
app.post('/api/ai/hashtags', async (req, res) => {
  const { clientId, topic, platform } = req.body
  if (!clientId || !topic || !platform) {
    res.status(400).json({ error: 'Missing clientId, topic, or platform' })
    return
  }
  try {
    await streamHashtags(res, PROJECT_ROOT, clientId, topic, platform)
  } catch (error: any) {
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Hashtag suggestion failed' })
    }
  }
})

// Enhance visual description into AI image prompt (streaming)
app.post('/api/ai/image-prompt', async (req, res) => {
  const { visualDescription, clientName, platform, format, pillar } = req.body
  if (!visualDescription || !clientName || !platform || !format) {
    res.status(400).json({ error: 'Missing visualDescription, clientName, platform, or format' })
    return
  }
  try {
    await streamImagePrompt(res, visualDescription, clientName, platform, format, pillar)
  } catch (error: any) {
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Image prompt enhancement failed' })
    }
  }
})

// ── Google Business Profile Routes ──────────────────────

// Get all Google connections
app.get('/api/google/status', (_req, res) => {
  const conns = readGoogleConnections()
  const allLocations = conns.flatMap(c => c.locations)
  res.json({
    configured: !!GOOGLE_CLIENT_ID,
    loginUrl: GOOGLE_CLIENT_ID ? getGoogleLoginUrl() : null,
    connections: conns.map(c => ({
      id: c.id,
      label: c.label,
      email: c.email,
      connectedAt: c.connectedAt,
      locations: c.locations,
    })),
    connected: conns.length > 0,
    locations: allLocations,
  })
})

// Google OAuth callback — adds a new connection
// Step 1: exchange code + save tokens immediately (fast)
// Locations are fetched lazily via /api/google/refresh-locations
app.post('/api/google/connect', async (req, res) => {
  const { code } = req.body
  if (!code) {
    res.status(400).json({ error: 'Missing authorization code' })
    return
  }
  try {
    const tokens = await exchangeGoogleCode(code)
    const email = await fetchGoogleEmail(tokens.accessToken)

    const conns = readGoogleConnections()
    const existingIdx = email ? conns.findIndex(c => c.email === email) : -1
    const connId = existingIdx >= 0 ? conns[existingIdx].id : `gconn_${Date.now().toString(36)}`
    const existingRefreshToken = existingIdx >= 0 ? conns[existingIdx].refreshToken : undefined

    // Save connection immediately — locations fetched separately
    const newConn = {
      id: connId,
      label: email || `Account ${conns.length + 1}`,
      email: email || undefined,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || existingRefreshToken,
      tokenExpiry: new Date(Date.now() + tokens.expiresIn * 1000).toISOString(),
      accountId: undefined as string | undefined,
      locations: [] as any[],
      connectedAt: new Date().toISOString(),
    }

    if (!newConn.refreshToken) {
      throw new Error('Google OAuth did not return a refresh token. Reconnect the account and grant offline access.')
    }

    if (existingIdx >= 0) {
      conns[existingIdx] = newConn
    } else {
      conns.push(newConn)
    }
    writeGoogleConnections(conns)

    let locationsError: string | null = null
    let locations = [] as { name: string; locationName: string; address?: string }[]
    try {
      const refreshed = await refreshGoogleConnectionLocations(connId)
      locations = refreshed.locations.map(l => ({ name: l.name, locationName: l.locationName, address: l.address }))
    } catch (error: any) {
      locationsError = error.message || 'Could not fetch locations yet.'
      console.log(`[google] Connected account ${connId}, but locations are not available yet: ${locationsError}`)
    }

    res.json({
      success: true,
      connectionId: connId,
      email,
      locations,
      locationsError,
      needsLocationRefresh: locations.length === 0,
    })
  } catch (error: any) {
    console.error('Google connect error:', error)
    res.status(500).json({ error: error.message || 'Failed to connect' })
  }
})

// Refresh locations for a connection (use when rate-limited during connect)
app.post('/api/google/refresh-locations', async (req, res) => {
  const { connectionId } = req.body
  try {
    const refreshed = await refreshGoogleConnectionLocations(connectionId)
    res.json({ success: true, connectionId: refreshed.connectionId, locations: refreshed.locations })
  } catch (error: any) {
    const status = error.message === 'Connection not found' ? 404 : 500
    res.status(status).json({ error: error.message })
  }
})

// Disconnect a specific Google account
app.post('/api/google/disconnect', (req, res) => {
  const { connectionId } = req.body
  const conns = readGoogleConnections()
  if (connectionId) {
    writeGoogleConnections(conns.filter(c => c.id !== connectionId))
  } else {
    writeGoogleConnections([])
  }
  res.json({ success: true })
})

// Get location-to-client mapping
app.get('/api/google/mapping', (_req, res) => {
  res.json(readGoogleMapping())
})

// Set a client→location mapping
app.put('/api/google/mapping', (req, res) => {
  const { clientId, locationName } = req.body
  if (!clientId) {
    res.status(400).json({ error: 'Missing clientId' })
    return
  }
  const mapping = readGoogleMapping()
  if (locationName) {
    mapping[clientId] = locationName
  } else {
    delete mapping[clientId]
  }
  writeGoogleMapping(mapping)
  res.json({ success: true, mapping })
})

function toGoogleRetryResponse(job: GoogleInsightsRetryJob | null) {
  if (!job) return null
  return {
    clientId: job.clientId,
    period: job.period,
    attempts: job.attempts,
    nextRetryAt: job.nextRetryAt,
    lastError: job.lastError,
  }
}

// Fetch Google analytics for a client
app.post('/api/google/analytics/:clientId/fetch', async (req, res) => {
  const { clientId } = req.params
  const { period } = req.body
  const mapping = readGoogleMapping()
  const locationName = mapping[clientId]
  if (!locationName) {
    res.status(400).json({ error: 'No Google location mapped to this client. Go to Settings.' })
    return
  }
  try {
    const insights = await fetchLocationInsights(locationName, period)
    const store = readGoogleAnalytics()
    store[clientId] = insights
    writeGoogleAnalytics(store)
    clearGoogleRetryStatus(clientId, insights.period)
    res.json({ success: true, data: insights })
  } catch (error: any) {
    console.error('Google analytics fetch error:', error)
    const message = error.message || 'Failed to fetch Google analytics'
    const status = /No Google connection owns location/i.test(message)
      ? 400
      : isGoogleRateLimitError(message)
        ? 429
        : 500
    const errorWithHint = /No Google connection owns location/i.test(message)
      ? `${message} Go to Settings, refresh locations, then re-check the client mapping.`
      : message
    if (status === 429) {
      const retryJob = scheduleGoogleInsightsRetry({
        clientId,
        locationName,
        period,
        lastError: errorWithHint,
      })
      startSchedulerTimer()
      res.status(status).json({
        error: `${errorWithHint} Retry automat programat la ${new Date(retryJob.nextRetryAt).toLocaleString('ro-RO')}.`,
        retry: toGoogleRetryResponse(retryJob),
      })
      return
    }
    res.status(status).json({ error: errorWithHint })
  }
})

// Get cached Google analytics for a client
app.get('/api/google/analytics/:clientId', (req, res) => {
  const store = readGoogleAnalytics()
  const data = store[req.params.clientId]
  const period = typeof req.query.period === 'string' ? req.query.period : undefined
  const retry = getGoogleRetryStatus(req.params.clientId, period)
  if (!data) {
    res.json({ data: null, retry: toGoogleRetryResponse(retry) })
    return
  }
  res.json({ data, retry: toGoogleRetryResponse(retry) })
})

// Publish to Google Business Profile
app.post('/api/google/publish', async (req, res) => {
  const { clientId, message, imageUrl, ctaUrl } = req.body
  if (!clientId || !message) {
    res.status(400).json({ error: 'Missing clientId or message' })
    return
  }
  const mapping = readGoogleMapping()
  const locationName = mapping[clientId]
  if (!locationName) {
    res.status(400).json({ error: 'No Google location mapped to this client. Go to Settings to map a location.' })
    return
  }
  try {
    const result = await publishToGoogle(locationName, message, imageUrl, ctaUrl)
    res.json({ success: true, postName: result.name })
  } catch (error: any) {
    console.error('Google publish error:', error)
    res.status(500).json({ error: error.message || 'Failed to publish to Google' })
  }
})

// ── Analytics Routes ─────────────────────────────────────

// Get analytics overview for all clients (must be before :clientId to avoid matching)
app.get('/api/analytics', (_req, res) => {
  const store = readAnalytics()
  const summary = Object.values(store).map(a => ({
    clientId: a.clientId,
    pageName: a.pageName,
    period: a.period,
    lastFetched: a.lastFetched,
    totalPosts: a.combined.totalPosts,
    totalEngagement: a.combined.totalEngagement,
    avgEngagement: a.combined.avgEngagement,
    totalLikes: a.combined.totalLikes,
    totalComments: a.combined.totalComments,
    totalShares: a.combined.totalShares,
    facebookPosts: a.facebook.posts.length,
    instagramPosts: a.instagram.posts.length,
  }))
  res.json({ clients: summary })
})

// Get cached analytics for a client
app.get('/api/analytics/:clientId', (req, res) => {
  const store = readAnalytics()
  const analytics = store[req.params.clientId]
  if (!analytics) {
    res.json({ data: null, message: 'No analytics data. Click "Fetch Data" to pull from Meta.' })
    return
  }
  res.json({ data: analytics })
})

// Fetch fresh analytics from Meta for a client
app.post('/api/analytics/:clientId/fetch', async (req, res) => {
  const { clientId } = req.params
  const { period } = req.body // optional 'YYYY-MM'

  // Get page mapping for this client
  const mapping = readPageMapping()
  const pageId = mapping[clientId]
  if (!pageId) {
    res.status(400).json({ error: 'No Meta page mapped to this client. Go to Settings to map a page.' })
    return
  }

  // Get page connection
  const connections = readConnections()
  const page = connections.pages.find(p => p.pageId === pageId)
  if (!page) {
    res.status(400).json({ error: 'Page not connected. Please reconnect via Meta OAuth.' })
    return
  }

  try {
    const analytics = await fetchClientAnalytics(clientId, page, period)
    const store = readAnalytics()
    store[clientId] = analytics
    writeAnalytics(store)
    res.json({ success: true, data: analytics })
  } catch (error: any) {
    console.error('Analytics fetch error:', error)
    res.status(500).json({ error: error.message || 'Failed to fetch analytics' })
  }
})

// ── Report Routes ────────────────────────────────────────

function normalizeReportPeriods(period?: string, periods?: string[]): string[] {
  const candidates = Array.isArray(periods) && periods.length > 0
    ? periods
    : period
      ? [period]
      : []

  return Array.from(
    new Set(
      candidates
        .map(item => String(item || '').trim())
        .filter(item => /^\d{4}-\d{2}$/.test(item)),
    ),
  ).sort()
}

function formatReportPeriodLabel(periods: string[]): string {
  if (periods.length === 0) return ''
  const sorted = [...periods].sort()
  const format = (value: string) => new Date(`${value}-01`).toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })
  return sorted.length === 1
    ? format(sorted[0])
    : `${format(sorted[0])} - ${format(sorted[sorted.length - 1])}`
}

function getReportPeriodsFromEntry(entry: AnalyticsReportToken): string[] {
  if (Array.isArray(entry.periods) && entry.periods.length > 0) return [...entry.periods].sort()
  return String(entry.period || '')
    .split(',')
    .map(item => item.trim())
    .filter(item => /^\d{4}-\d{2}$/.test(item))
    .sort()
}

function mergeAnalyticsSnapshots(entries: ClientAnalytics[]): ClientAnalytics | null {
  if (entries.length === 0) return null

  const allFacebook = entries.flatMap(entry => entry.facebook.posts)
  const allInstagram = entries.flatMap(entry => entry.instagram.posts)
  const allPosts = [...allFacebook, ...allInstagram]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

  const sum = (posts: typeof allPosts, key: 'likes' | 'comments' | 'shares' | 'engagement') =>
    posts.reduce((total, post) => total + post[key], 0)

  const dayMap = new Map<string, { engagement: number; likes: number; comments: number; shares: number }>()
  for (const post of allPosts) {
    const day = post.publishedAt.slice(0, 10)
    const current = dayMap.get(day) || { engagement: 0, likes: 0, comments: 0, shares: 0 }
    current.engagement += post.engagement
    current.likes += post.likes
    current.comments += post.comments
    current.shares += post.shares
    dayMap.set(day, current)
  }

  const totalEngagement = sum(allPosts, 'engagement')
  const sortedPeriods = entries.map(entry => entry.period).sort()

  const lastFetched = entries.map(entry => entry.lastFetched).sort().slice(-1)[0] || new Date().toISOString()

  return {
    clientId: entries[0].clientId,
    pageId: entries[0].pageId,
    pageName: entries[0].pageName,
    lastFetched,
    period: sortedPeriods.join(','),
    facebook: {
      posts: allFacebook,
      totalLikes: sum(allFacebook, 'likes'),
      totalComments: sum(allFacebook, 'comments'),
      totalShares: sum(allFacebook, 'shares'),
      totalEngagement: sum(allFacebook, 'engagement'),
      avgEngagement: allFacebook.length > 0 ? Math.round(sum(allFacebook, 'engagement') / allFacebook.length) : 0,
    },
    instagram: {
      posts: allInstagram,
      totalLikes: sum(allInstagram, 'likes'),
      totalComments: sum(allInstagram, 'comments'),
      totalShares: sum(allInstagram, 'shares'),
      totalEngagement: sum(allInstagram, 'engagement'),
      avgEngagement: allInstagram.length > 0 ? Math.round(sum(allInstagram, 'engagement') / allInstagram.length) : 0,
    },
    combined: {
      totalPosts: allPosts.length,
      totalLikes: sum(allPosts, 'likes'),
      totalComments: sum(allPosts, 'comments'),
      totalShares: sum(allPosts, 'shares'),
      totalEngagement,
      avgEngagement: allPosts.length > 0 ? Math.round(totalEngagement / allPosts.length) : 0,
      engagementByDay: [...dayMap.entries()]
        .map(([date, values]) => ({ date, ...values }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      topPosts: [...allPosts].sort((a, b) => b.engagement - a.engagement).slice(0, 10),
    },
  }
}

function mergeGoogleSnapshots(entries: GoogleInsightsData[]): GoogleInsightsData | null {
  if (entries.length === 0) return null

  const dayMap = new Map<string, { searches: number; maps: number; website: number; phone: number; directions: number }>()
  for (const entry of entries) {
    for (const day of entry.dailyMetrics || []) {
      const current = dayMap.get(day.date) || { searches: 0, maps: 0, website: 0, phone: 0, directions: 0 }
      current.searches += day.searches
      current.maps += day.maps
      current.website += day.website
      current.phone += day.phone
      current.directions += day.directions
      dayMap.set(day.date, current)
    }
  }

  const metrics = entries.reduce((acc, entry) => {
    acc.searchViews += entry.metrics.searchViews
    acc.mapViews += entry.metrics.mapViews
    acc.websiteClicks += entry.metrics.websiteClicks
    acc.phoneClicks += entry.metrics.phoneClicks
    acc.directionRequests += entry.metrics.directionRequests
    acc.totalInteractions += entry.metrics.totalInteractions
    return acc
  }, {
    searchViews: 0,
    mapViews: 0,
    websiteClicks: 0,
    phoneClicks: 0,
    directionRequests: 0,
    totalInteractions: 0,
  })

  const lastFetched = entries.map(entry => entry.lastFetched).sort().slice(-1)[0] || new Date().toISOString()

  return {
    locationName: entries[0].locationName,
    period: entries.map(entry => entry.period).sort().join(','),
    lastFetched,
    metrics,
    dailyMetrics: [...dayMap.entries()]
      .map(([date, values]) => ({ date, ...values }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  }
}

async function resolveMetaSnapshotForReport(clientId: string, periods: string[]): Promise<ClientAnalytics | null> {
  const store = readAnalytics()
  const cached = store[clientId] || null

  if (periods.length === 0) return cached
  if (periods.length === 1 && cached?.period === periods[0]) return cached

  const mapping = readPageMapping()
  const pageId = mapping[clientId]
  if (!pageId) return null

  const connections = readConnections()
  const page = connections.pages.find(entry => entry.pageId === pageId)
  if (!page) return null

  const snapshots: ClientAnalytics[] = []
  for (const period of periods) {
    snapshots.push(await fetchClientAnalytics(clientId, page, period))
  }

  if (snapshots.length === 1) {
    store[clientId] = snapshots[0]
    writeAnalytics(store)
  }

  return mergeAnalyticsSnapshots(snapshots)
}

async function resolveGoogleSnapshotForReport(clientId: string, periods: string[]): Promise<GoogleInsightsData | null> {
  const store = readGoogleAnalytics()
  const cached = store[clientId] || null

  if (periods.length === 0) return cached
  if (periods.length === 1 && cached?.period === periods[0]) return cached

  const mapping = readGoogleMapping()
  const locationName = mapping[clientId]
  if (!locationName) return null

  const snapshots: GoogleInsightsData[] = []
  for (const period of periods) {
    snapshots.push(await fetchLocationInsights(locationName, period))
  }

  if (snapshots.length === 1) {
    store[clientId] = snapshots[0]
    writeGoogleAnalytics(store)
  }

  return mergeGoogleSnapshots(snapshots)
}

// Generate a shareable report
app.post('/api/reports/generate', async (req, res) => {
  const { clientId, period, periods, label } = req.body
  if (!clientId) {
    res.status(400).json({ error: 'Missing clientId' })
    return
  }
  try {
    const requestedPeriods = normalizeReportPeriods(period, periods)
    const analytics = await resolveMetaSnapshotForReport(clientId, requestedPeriods)
    const googleData = await resolveGoogleSnapshotForReport(clientId, requestedPeriods)

    if (!analytics && !googleData) {
      res.status(400).json({ error: 'No analytics data for this client. Fetch data first.' })
      return
    }

    const effectivePeriods = requestedPeriods.length > 0
      ? requestedPeriods
      : Array.from(new Set([analytics?.period, googleData?.period].filter(Boolean) as string[])).sort()

    const token = `rpt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
    const entry: AnalyticsReportToken = {
      token,
      clientId,
      period: effectivePeriods.join(',') || analytics?.period || googleData?.period || '',
      periods: effectivePeriods.length > 0 ? effectivePeriods : undefined,
      periodLabel: effectivePeriods.length > 0 ? formatReportPeriodLabel(effectivePeriods) : undefined,
      createdAt: new Date().toISOString(),
      label: label || undefined,
      snapshot: analytics,
      googleSnapshot: googleData,
    }

    const reports = readReports()
    reports.push(entry)
    writeReports(reports)
    triggerWebhooks('report.generated', { clientId, token, period: entry.period }).catch(() => {})
    res.json({ success: true, token, url: `/report/${token}` })
  } catch (error: any) {
    console.error('Report generation error:', error)
    res.status(500).json({ error: error.message || 'Failed to generate report' })
  }
})

// List all report tokens (without full snapshot data)
app.get('/api/reports/tokens', (_req, res) => {
  const reports = readReports().map(r => ({
    token: r.token,
    clientId: r.clientId,
    period: r.period,
    periods: getReportPeriodsFromEntry(r),
    periodLabel: r.periodLabel || formatReportPeriodLabel(getReportPeriodsFromEntry(r)),
    createdAt: r.createdAt,
    label: r.label,
    pageName: r.snapshot?.pageName,
    totalPosts: r.snapshot?.combined?.totalPosts,
    totalEngagement: r.snapshot?.combined?.totalEngagement,
  }))
  res.json(reports)
})

// Delete a report
app.delete('/api/reports/:token', (req, res) => {
  const reports = readReports().filter(r => r.token !== req.params.token)
  writeReports(reports)
  res.json({ success: true })
})

// Get full report data (public, no auth)
app.get('/api/reports/:token/data', (req, res) => {
  const reports = readReports()
  const entry = reports.find(r => r.token === req.params.token)
  if (!entry) {
    res.status(404).json({ error: 'Report not found' })
    return
  }
  // Also get client display info
  try {
    const clientData = applyOverrides(scanClients(PROJECT_ROOT))
    const client = clientData.clients.find(c => c.id === entry.clientId)
    const entryPeriods = getReportPeriodsFromEntry(entry)
    res.json({
      clientName: client?.displayName || entry.clientId,
      clientColor: client?.color || '#7c3aed',
      period: entry.period,
      periods: entryPeriods,
      periodLabel: entry.periodLabel || formatReportPeriodLabel(entryPeriods),
      createdAt: entry.createdAt,
      analytics: entry.snapshot,
      google: entry.googleSnapshot || null,
    })
  } catch {
    const entryPeriods = getReportPeriodsFromEntry(entry)
    res.json({
      clientName: entry.clientId,
      clientColor: '#7c3aed',
      period: entry.period,
      periods: entryPeriods,
      periodLabel: entry.periodLabel || formatReportPeriodLabel(entryPeriods),
      createdAt: entry.createdAt,
      analytics: entry.snapshot,
      google: entry.googleSnapshot || null,
    })
  }
})

// Serve the report page HTML
const REPORT_PAGE_HTML = existsSync(resolve(import.meta.dirname, 'report-page.html'))
  ? readFileSync(resolve(import.meta.dirname, 'report-page.html'), 'utf-8')
  : '<html><body>Report page not found</body></html>'
app.get('/report/:token', (_req, res) => {
  res.type('html').send(REPORT_PAGE_HTML)
})

// ── Webhook Routes ──────────────────────────────────────

// List all webhooks
app.get('/api/webhooks', (_req, res) => {
  res.json(readWebhooks())
})

// Create a webhook
app.post('/api/webhooks', (req, res) => {
  const { name, url, events, secret } = req.body
  if (!name || !url || !Array.isArray(events) || events.length === 0) {
    res.status(400).json({ error: 'Missing name, url, or events' })
    return
  }
  try { new URL(url) } catch {
    res.status(400).json({ error: 'Invalid URL' })
    return
  }
  const webhook: Webhook = {
    id: `wh_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    url,
    events,
    enabled: true,
    secret: secret || undefined,
    createdAt: new Date().toISOString(),
  }
  const webhooks = readWebhooks()
  webhooks.push(webhook)
  writeWebhooks(webhooks)
  res.json({ success: true, webhook })
})

// Update a webhook
app.put('/api/webhooks/:id', (req, res) => {
  const webhooks = readWebhooks()
  const wh = webhooks.find(w => w.id === req.params.id)
  if (!wh) {
    res.status(404).json({ error: 'Webhook not found' })
    return
  }
  const { name, url, events, enabled, secret } = req.body
  if (name !== undefined) wh.name = name
  if (url !== undefined) wh.url = url
  if (events !== undefined) wh.events = events
  if (enabled !== undefined) wh.enabled = enabled
  if (secret !== undefined) wh.secret = secret || undefined
  writeWebhooks(webhooks)
  res.json({ success: true, webhook: wh })
})

// Delete a webhook
app.delete('/api/webhooks/:id', (req, res) => {
  const webhooks = readWebhooks().filter(w => w.id !== req.params.id)
  writeWebhooks(webhooks)
  res.json({ success: true })
})

// Test a webhook
app.post('/api/webhooks/:id/test', async (req, res) => {
  const webhooks = readWebhooks()
  const wh = webhooks.find(w => w.id === req.params.id)
  if (!wh) {
    res.status(404).json({ error: 'Webhook not found' })
    return
  }
  try {
    await triggerWebhooks(wh.events[0] || 'post.status_changed', {
      test: true,
      message: 'This is a test delivery from PostBoard',
      webhookId: wh.id,
    })
    res.json({ success: true })
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Test failed' })
  }
})

// Get webhook delivery log
app.get('/api/webhooks/log', (_req, res) => {
  res.json(readWebhookLog())
})

// ── Scheduler Routes ────────────────────────────────────

// Get scheduler config
app.get('/api/scheduler/config', (_req, res) => {
  res.json(readSchedulerConfig())
})

// Update scheduler config
app.put('/api/scheduler/config', (req, res) => {
  const config = req.body
  writeSchedulerConfig(config)
  // Restart the scheduler timer with new interval
  startSchedulerTimer(config.checkIntervalMinutes)
  res.json({ success: true, config })
})

// Get scheduler log
app.get('/api/scheduler/log', (_req, res) => {
  res.json(readSchedulerLog())
})

// Manually run scheduler
app.post('/api/scheduler/run', async (_req, res) => {
  try {
    const results = await runScheduler()
    res.json({ success: true, results })
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Scheduler run failed' })
  }
})

// Manually run analytics sync
app.post('/api/scheduler/analytics-sync/run', async (_req, res) => {
  try {
    const results = await runAnalyticsSync({ force: true })
    startSchedulerTimer()
    res.json({ success: true, results })
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Analytics sync run failed' })
  }
})

// ── Scheduler Engine ────────────────────────────────────

async function runScheduler() {
  const config = readSchedulerConfig()
  if (!config.enabled) return { skipped: true, reason: 'Scheduler disabled' }

  const data = applyOverrides(scanClients(PROJECT_ROOT))
  const mapping = readPageMapping()
  const connections = readConnections()
  const results: any[] = []

  const todayStr = getBucharestDateString()

  const googleMapping = readGoogleMapping()
  const postMedia = readPostMedia()

  for (const client of data.clients) {
    const clientConfig = config.clients[client.id]
    if (!clientConfig?.autoPublish) continue
    if (!isInPublishWindow(clientConfig)) {
      continue
    }

    // Resolve Meta page for this client (optional)
    const pageId = mapping[client.id]
    const page = pageId ? connections.pages.find((p: any) => p.pageId === pageId) : null

    // Resolve Google location for this client (optional)
    const googleLocationName = googleMapping[client.id]

    // Skip if no platform is mapped at all
    if (!page && !googleLocationName) continue

    // Find posts that are scheduled and due (date <= today)
    const duePosts = client.posts.filter(p =>
      p.status === 'scheduled' && p.date <= todayStr
    )

    for (const post of duePosts) {
      try {
        const message = post.caption + (post.hashtags.length > 0 ? '\n\n' + post.hashtags.join(' ') : '')

        if (post.platform === 'google') {
          // ── Google Business Profile ──
          if (!googleLocationName) {
            addSchedulerLog({
              postId: post.id, clientId: client.id, clientName: client.displayName,
              platform: post.platform, caption: post.caption?.slice(0, 60),
              action: 'skipped', message: 'Skipped: No Google location mapped for this client',
            })
            results.push({ postId: post.id, action: 'skipped', reason: 'No Google mapping' })
            continue
          }
          const postImage = getPrimaryPostImage(postMedia[post.id])
          const imgUrl = postImage ? `${PUBLIC_ORIGIN}${postImage.url}` : undefined
          await publishToGoogle(googleLocationName, message, imgUrl)
        } else if (post.platform === 'facebook') {
          // ── Facebook ──
          if (!page) {
            addSchedulerLog({
              postId: post.id, clientId: client.id, clientName: client.displayName,
              platform: post.platform, caption: post.caption?.slice(0, 60),
              action: 'skipped', message: 'Skipped: No Meta page mapped for this client',
            })
            results.push({ postId: post.id, action: 'skipped', reason: 'No Meta mapping' })
            continue
          }
          const facebookMedia = resolveFacebookPublishMedia(post, postMedia[post.id])
          if (facebookMedia === null) {
            addSchedulerLog({
              postId: post.id, clientId: client.id, clientName: client.displayName,
              platform: post.platform, caption: post.caption?.slice(0, 60),
              action: 'skipped', message: 'Skipped: Facebook video post requires an attached video',
            })
            results.push({ postId: post.id, action: 'skipped', reason: 'No video for Facebook video post' })
            continue
          }
          const mediaPayload = facebookMedia
            ? { ...facebookMedia, url: `${PUBLIC_ORIGIN}${facebookMedia.url}` }
            : undefined
          await publishToFacebook(pageId!, page.pageAccessToken, message, mediaPayload)
        } else if (post.platform === 'instagram' || post.platform === 'stories') {
          // ── Instagram / Stories ──
          const instagramAccountId = page ? getEffectiveInstagramAccountId(page) : undefined
          if (!page || !instagramAccountId) {
            addSchedulerLog({
              postId: post.id, clientId: client.id, clientName: client.displayName,
              platform: post.platform, caption: post.caption?.slice(0, 60),
              action: 'skipped', message: 'Skipped: No Instagram account linked',
            })
            results.push({ postId: post.id, action: 'skipped', reason: 'No IG account' })
            continue
          }
          if (post.requiresInstagramMusic) {
            addSchedulerLog({
              postId: post.id, clientId: client.id, clientName: client.displayName,
              platform: post.platform, caption: post.caption?.slice(0, 60),
              action: 'skipped',
              message: 'Skipped: Instagram post is marked for manual publish with music in the Instagram app',
            })
            results.push({ postId: post.id, action: 'skipped', reason: 'Manual Instagram music required' })
            continue
          }
          const instagramResolution = resolveInstagramPublishMedia(post, postMedia[post.id])
          if (!instagramResolution.payload) {
            const instagramMessage = instagramResolution.error === 'missing_video'
              ? 'Skipped: Instagram video post requires an attached video'
              : instagramResolution.error === 'carousel_min'
                ? 'Skipped: Instagram carousel requires at least 2 attached media items'
                : instagramResolution.error === 'carousel_max'
                  ? 'Skipped: Instagram carousel supports at most 10 media items'
                  : instagramResolution.error === 'story_missing'
                    ? 'Skipped: Instagram story requires one attached image or video'
                  : instagramResolution.error === 'story_multiple'
                    ? 'Skipped: Instagram story supports exactly one attached image or video'
                  : 'Skipped: Instagram requires an image attachment'
            const instagramReason = instagramResolution.error === 'missing_video'
              ? 'No video for IG video post'
              : instagramResolution.error === 'carousel_min'
                ? 'Not enough media for IG carousel'
                : instagramResolution.error === 'carousel_max'
                  ? 'Too many media items for IG carousel'
                  : instagramResolution.error === 'story_missing'
                    ? 'No media for IG story'
                  : instagramResolution.error === 'story_multiple'
                    ? 'Too many media items for IG story'
                  : 'No image for IG'
            addSchedulerLog({
              postId: post.id, clientId: client.id, clientName: client.displayName,
              platform: post.platform, caption: post.caption?.slice(0, 60),
              action: 'skipped',
              message: instagramMessage,
            })
            results.push({ postId: post.id, action: 'skipped', reason: instagramReason })
            continue
          }
          const instagramMedia = instagramResolution.payload
          const mediaPayload = instagramMedia.type === 'carousel'
            ? {
                type: 'carousel' as const,
                items: instagramMedia.items.map(item => ({ ...item, url: toPublicAssetUrl(item.url) })),
              }
            : instagramMedia.type === 'story'
              ? {
                  type: 'story' as const,
                  media: { ...instagramMedia.media, url: toPublicAssetUrl(instagramMedia.media.url) },
                }
            : { ...instagramMedia, url: toPublicAssetUrl(instagramMedia.url) }
          await publishToInstagram(instagramAccountId, page.pageAccessToken, message, mediaPayload)
        } else {
          addSchedulerLog({
            postId: post.id, clientId: client.id, clientName: client.displayName,
            platform: post.platform, caption: post.caption?.slice(0, 60),
            action: 'skipped', message: `Skipped: Platform "${post.platform}" not yet supported for auto-publish`,
          })
          results.push({ postId: post.id, action: 'skipped', reason: `Platform ${post.platform} not supported` })
          continue
        }

        // Update status to published
        const statuses = readStatuses()
        statuses[post.id] = 'published'
        writeStatuses(statuses)

        addSchedulerLog({
          postId: post.id,
          clientId: client.id,
          clientName: client.displayName,
          platform: post.platform,
          caption: post.caption?.slice(0, 60),
          action: 'published',
          message: `Auto-published to ${post.platform}`,
        })

        // Trigger webhooks
        triggerWebhooks('post.published', {
          postId: post.id,
          clientId: client.id,
          platform: post.platform,
          autoPublished: true,
        })

        results.push({ postId: post.id, action: 'published' })
      } catch (error: any) {
        addSchedulerLog({
          postId: post.id,
          clientId: client.id,
          clientName: client.displayName,
          platform: post.platform,
          caption: post.caption?.slice(0, 60),
          action: 'failed',
          message: `Failed: ${error.message || 'Unknown error'}`,
        })
        results.push({ postId: post.id, action: 'failed', error: error.message })
      }
    }
  }

  return { processed: results.length, results }
}

function getBucharestMonthPeriod() {
  const currentDate = getBucharestDateString()
  return currentDate.slice(0, 7)
}

async function runAnalyticsSync(options: { force?: boolean } = {}) {
  const config = readSchedulerConfig()
  const analyticsConfig = config.analyticsSync

  if (!options.force && !analyticsConfig.enabled) {
    return { skipped: true, reason: 'Analytics sync disabled' }
  }

  if (!analyticsConfig.includeMeta && !analyticsConfig.includeGoogle) {
    return { skipped: true, reason: 'No analytics providers enabled for sync' }
  }

  const currentDate = getBucharestDateString()
  const currentTime = getBucharestClockTime()
  if (!options.force) {
    if (analyticsConfig.lastRunDate === currentDate) {
      return { skipped: true, reason: 'Analytics sync already ran today' }
    }
    if (currentTime < analyticsConfig.runAt) {
      return { skipped: true, reason: `Waiting for scheduled time ${analyticsConfig.runAt}` }
    }
  }

  const targetPeriod = getBucharestMonthPeriod()
  const data = applyOverrides(scanClients(PROJECT_ROOT))
  const mapping = readPageMapping()
  const connections = readConnections()
  const googleMapping = readGoogleMapping()
  const analyticsStore = readAnalytics()
  const googleStore = readGoogleAnalytics()

  const summary = {
    processedClients: 0,
    metaSuccess: 0,
    metaFailed: 0,
    googleSuccess: 0,
    googleFailed: 0,
  }
  const results: Array<{ clientId: string; provider: 'meta' | 'google'; status: 'synced' | 'failed' | 'skipped'; message?: string }> = []

  for (const client of data.clients) {
    let processedClient = false

    if (analyticsConfig.includeMeta) {
      const pageId = mapping[client.id]
      if (pageId) {
        processedClient = true
        const page = connections.pages.find(p => p.pageId === pageId)
        if (!page) {
          summary.metaFailed += 1
          results.push({ clientId: client.id, provider: 'meta', status: 'failed', message: 'Mapped Meta page is not connected' })
        } else {
          try {
            analyticsStore[client.id] = await fetchClientAnalytics(client.id, page, targetPeriod)
            summary.metaSuccess += 1
            results.push({ clientId: client.id, provider: 'meta', status: 'synced' })
          } catch (error: any) {
            summary.metaFailed += 1
            results.push({ clientId: client.id, provider: 'meta', status: 'failed', message: error.message || 'Meta sync failed' })
          }
        }
      }
    }

    if (analyticsConfig.includeGoogle) {
      const locationName = googleMapping[client.id]
      if (locationName) {
        processedClient = true
        try {
          googleStore[client.id] = await fetchLocationInsights(locationName, targetPeriod)
          clearGoogleRetryStatus(client.id, targetPeriod)
          summary.googleSuccess += 1
          results.push({ clientId: client.id, provider: 'google', status: 'synced' })
        } catch (error: any) {
          const message = error.message || 'Google sync failed'
          let scheduledRetry: ReturnType<typeof scheduleGoogleInsightsRetry> | null = null
          if (isGoogleRateLimitError(message)) {
            scheduledRetry = scheduleGoogleInsightsRetry({
              clientId: client.id,
              locationName,
              period: targetPeriod,
              lastError: message,
            })
          }
          summary.googleFailed += 1
          results.push({
            clientId: client.id,
            provider: 'google',
            status: 'failed',
            message: scheduledRetry
              ? `${message} Retry automat programat la ${new Date(scheduledRetry.nextRetryAt).toLocaleString('ro-RO')}.`
              : message,
          })
        }
      }
    }

    if (processedClient) {
      summary.processedClients += 1
    }
  }

  writeAnalytics(analyticsStore)
  writeGoogleAnalytics(googleStore)

  config.analyticsSync = {
    ...analyticsConfig,
    lastRunDate: currentDate,
    lastRunAt: new Date().toISOString(),
    lastRunSummary: summary,
  }
  writeSchedulerConfig(config)

  return {
    period: targetPeriod,
    summary,
    results,
  }
}

let schedulerInterval: ReturnType<typeof setInterval> | null = null

function startSchedulerTimer(intervalMinutes?: number) {
  if (schedulerInterval) clearInterval(schedulerInterval)
  const config = readSchedulerConfig()
  const mins = intervalMinutes ?? config.checkIntervalMinutes ?? 5
  const hasGoogleRetries = readGoogleRetryQueue().length > 0
  if (config.enabled || config.analyticsSync?.enabled || hasGoogleRetries) {
    schedulerInterval = setInterval(async () => {
      runScheduler().catch(err => console.error('Scheduler error:', err))
      runAnalyticsSync().catch(err => console.error('Analytics sync error:', err))
      const retryResults = await processGoogleRetryQueue().catch(err => {
        console.error('Google retry queue error:', err)
        return null
      })
      const latestConfig = readSchedulerConfig()
      const stillHasRetries = (retryResults?.pending || 0) > 0
      if (!latestConfig.enabled && !latestConfig.analyticsSync?.enabled && !stillHasRetries && schedulerInterval) {
        clearInterval(schedulerInterval)
        schedulerInterval = null
        console.log('  💤 Background jobs paused: no active schedules or pending Google retries')
      }
    }, mins * 60 * 1000)
    console.log(`  🕐 Background jobs active: checking every ${mins} minutes`)
  }
}

// ── Team & Workflow Routes (M8) ──────────────────────────

const TEAM_MEMBERS_FILE = resolve(import.meta.dirname, '..', 'data', 'team-members.json')
const WORKFLOW_TASKS_FILE = resolve(import.meta.dirname, '..', 'data', 'workflow-tasks.json')

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'operator'
  color: string
  clients: string[]
  createdAt: string
}

interface WorkflowTask {
  id: string
  clientId: string
  postId?: string
  title: string
  description?: string
  stage: string
  assignedTo: string
  priority: 'low' | 'medium' | 'high'
  dueDate?: string
  createdAt: string
  updatedAt: string
}

function readTeamMembers(): TeamMember[] {
  try {
    if (existsSync(TEAM_MEMBERS_FILE)) {
      return JSON.parse(readFileSync(TEAM_MEMBERS_FILE, 'utf-8'))
    }
  } catch { /* ignore */ }
  return []
}

function writeTeamMembers(members: TeamMember[]) {
  writeFileSync(TEAM_MEMBERS_FILE, JSON.stringify(members, null, 2), 'utf-8')
}

function readWorkflowTasks(): WorkflowTask[] {
  try {
    if (existsSync(WORKFLOW_TASKS_FILE)) {
      return JSON.parse(readFileSync(WORKFLOW_TASKS_FILE, 'utf-8'))
    }
  } catch { /* ignore */ }
  return []
}

function writeWorkflowTasks(tasks: WorkflowTask[]) {
  writeFileSync(WORKFLOW_TASKS_FILE, JSON.stringify(tasks, null, 2), 'utf-8')
}

// List team members
app.get('/api/team/members', (_req, res) => {
  res.json(readTeamMembers())
})

// Add a team member
app.post('/api/team/members', (req, res) => {
  const { name, email, role, color, clients } = req.body
  if (!name) {
    res.status(400).json({ error: 'Missing name' })
    return
  }
  const member: TeamMember = {
    id: `tm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    email: email || '',
    role: role || 'operator',
    color: color || '#7c3aed',
    clients: clients || [],
    createdAt: new Date().toISOString(),
  }
  const members = readTeamMembers()
  members.push(member)
  writeTeamMembers(members)
  res.json(member)
})

// Update a team member
app.patch('/api/team/members/:id', (req, res) => {
  const members = readTeamMembers()
  const member = members.find(m => m.id === req.params.id)
  if (!member) {
    res.status(404).json({ error: 'Member not found' })
    return
  }
  const { name, email, role, color, clients } = req.body
  if (name !== undefined) member.name = name
  if (email !== undefined) member.email = email
  if (role !== undefined) member.role = role
  if (color !== undefined) member.color = color
  if (clients !== undefined) member.clients = clients
  writeTeamMembers(members)
  res.json(member)
})

// Delete a team member
app.delete('/api/team/members/:id', (req, res) => {
  const members = readTeamMembers().filter(m => m.id !== req.params.id)
  writeTeamMembers(members)
  res.json({ success: true })
})

// List workflow tasks
app.get('/api/team/tasks', (_req, res) => {
  res.json(readWorkflowTasks())
})

// Add a workflow task
app.post('/api/team/tasks', (req, res) => {
  const { clientId, postId, title, description, stage, assignedTo, priority, dueDate } = req.body
  if (!title || !clientId || !assignedTo || !stage) {
    res.status(400).json({ error: 'Missing title, clientId, assignedTo, or stage' })
    return
  }
  const now = new Date().toISOString()
  const task: WorkflowTask = {
    id: `wt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    clientId,
    postId: postId || undefined,
    title,
    description: description || undefined,
    stage,
    assignedTo,
    priority: priority || 'medium',
    dueDate: dueDate || undefined,
    createdAt: now,
    updatedAt: now,
  }
  const tasks = readWorkflowTasks()
  tasks.push(task)
  writeWorkflowTasks(tasks)
  res.json(task)
})

// Update a workflow task
app.patch('/api/team/tasks/:id', (req, res) => {
  const tasks = readWorkflowTasks()
  const task = tasks.find(t => t.id === req.params.id)
  if (!task) {
    res.status(404).json({ error: 'Task not found' })
    return
  }
  const { clientId, postId, title, description, stage, assignedTo, priority, dueDate } = req.body
  if (clientId !== undefined) task.clientId = clientId
  if (postId !== undefined) task.postId = postId || undefined
  if (title !== undefined) task.title = title
  if (description !== undefined) task.description = description || undefined
  if (stage !== undefined) task.stage = stage
  if (assignedTo !== undefined) task.assignedTo = assignedTo
  if (priority !== undefined) task.priority = priority
  if (dueDate !== undefined) task.dueDate = dueDate || undefined
  task.updatedAt = new Date().toISOString()
  writeWorkflowTasks(tasks)
  res.json(task)
})

// Delete a workflow task
app.delete('/api/team/tasks/:id', (req, res) => {
  const tasks = readWorkflowTasks().filter(t => t.id !== req.params.id)
  writeWorkflowTasks(tasks)
  res.json({ success: true })
})

// ── Campaign Routes (M4 — Ads Manager) ──────────────────
registerCampaignRoutes(app)
registerMetaAdsRoutes(app)

// ── AI Ad Copy Generation ────────────────────────────────

const VARIANT_ANGLES = [
  { label: 'A', name: 'Direct Benefit', desc: 'lead with the main benefit, clear and direct' },
  { label: 'B', name: 'Problem-Solution', desc: 'start with a pain point, then offer the solution' },
  { label: 'C', name: 'Social Proof / Urgency', desc: 'use scarcity, testimonial angle, or time-limited offer' },
  { label: 'D', name: 'Emotional Hook', desc: 'connect emotionally, tell a micro-story or evoke a feeling' },
  { label: 'E', name: 'Question / Curiosity', desc: 'open with a provocative question that makes the reader stop and think' },
]

app.post('/api/ai/adcopy', async (req, res) => {
  const { clientId, platform, objective, product, audience, keyMessage, tone, numVariants } = req.body
  if (!clientId || !product) {
    res.status(400).json({ error: 'Missing clientId or product' })
    return
  }
  try {
    const { getClientContext } = await import('./ai.ts')
    const context = getClientContext(PROJECT_ROOT, clientId, {
      task: 'ads',
      query: `${platform || ''} ${objective || ''} ${product} ${audience || ''} ${keyMessage || ''} ${tone || ''}`,
    })

    const count = Math.min(Math.max(Number(numVariants) || 3, 1), 5)
    const angles = VARIANT_ANGLES.slice(0, count)
    const anglesBlock = angles.map(a => `- **Variant ${a.label} — ${a.name}** — ${a.desc}`).join('\n')

    const prompt = `You are a senior performance marketing specialist for Epic Digital Hub, a marketing agency based in Romania.

RULES:
- ALL ad copy MUST be written in Romanian with proper diacritics: ă, â, î, ș, ț
- Write high-converting ad copy — punchy, benefit-driven, action-oriented
- Never generic or AI-sounding. Be specific and persuasive.
- Use "tu" (informal) for ad copy unless specified otherwise
- Currency: RON (lei), Romanian number formatting (1.000,00)
- Use only claims confirmed in the client context or in the request fields
- If a product detail is missing, do not invent it

CLIENT CONTEXT:
${context}

---

Generate ad copy variants for a paid advertising campaign.

Platform: ${platform || 'Facebook'}
Objective: ${objective || 'traffic'}
Product/Service: ${product}
${audience ? `Target Audience: ${audience}` : ''}
${keyMessage ? `Key Message: ${keyMessage}` : ''}
${tone ? `Tone: ${tone}` : ''}

Create ${count} distinct ad copy variant${count > 1 ? 's' : ''}, each with:
1. **Headline** (max 40 characters) — attention-grabbing, benefit-focused
2. **Primary Text** (max 125 characters for the main visible text) — hook + benefit + social proof hint
3. **Description** (max 30 characters) — supporting text for link ads
4. **CTA Button** — suggest the best CTA (Learn More, Shop Now, Sign Up, Book Now, Get Offer, Contact Us)
5. **Extended Primary Text** (full version, 2-3 sentences) — for platforms that show longer text

Each variant should take a different angle:
${anglesBlock}

Format each variant clearly with labels. Write everything in Romanian.`

    const { spawn } = await import('child_process')

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    const proc = spawn('claude', ['-p', '--model', 'opus'], {
      env: { ...process.env, NO_COLOR: '1' },
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    // Send prompt via stdin to avoid OS argument length limits
    proc.stdin.write(prompt)
    proc.stdin.end()

    res.on('close', () => { if (!proc.killed) proc.kill('SIGTERM') })

    proc.stdout.on('data', (chunk: Buffer) => {
      const text = chunk.toString()
      if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`)
    })

    proc.stderr.on('data', (chunk: Buffer) => {
      console.error('[claude cli adcopy]', chunk.toString().trim())
    })

    proc.on('close', (code) => {
      if (code !== 0 && !res.writableEnded) {
        res.write(`data: ${JSON.stringify({ error: `Claude exited with code ${code}` })}\n\n`)
      }
      if (!res.writableEnded) {
        res.write('data: [DONE]\n\n')
        res.end()
      }
    })

    proc.on('error', (err) => {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`)
        res.write('data: [DONE]\n\n')
        res.end()
      }
    })
  } catch (error: any) {
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Ad copy generation failed' })
    }
  }
})

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', projectRoot: PROJECT_ROOT })
})

// File change detection — returns a fingerprint based on file modification times
// Frontend polls this to know when to re-fetch data
let cachedFingerprint = ''
let fingerprintTime = 0

function getContentFingerprint(): string {
  const now = Date.now()
  // Cache for 2 seconds to avoid hammering the filesystem
  if (now - fingerprintTime < 2000 && cachedFingerprint) return cachedFingerprint

  const clientiDir = resolve(PROJECT_ROOT, 'CLIENTI')
  let hash = ''
  try {
    const walk = (dir: string) => {
      const entries = readdirSync(dir)
      for (const entry of entries) {
        if (entry.startsWith('.') || entry === 'node_modules') continue
        const full = resolve(dir, entry)
        try {
          const s = statSync(full)
          if (s.isDirectory()) walk(full)
          else if (entry.endsWith('.md')) hash += `${full}:${s.mtimeMs}|`
        } catch { /* skip */ }
      }
    }
    if (existsSync(clientiDir)) walk(clientiDir)
    // Also include override files
    for (const f of [STATUSES_FILE, CAPTIONS_FILE, DATES_FILE, POST_PUBLISH_OPTIONS_FILE]) {
      try { if (existsSync(f)) hash += `${f}:${statSync(f).mtimeMs}|` } catch { /* skip */ }
    }
  } catch { /* skip */ }

  cachedFingerprint = hash
  fingerprintTime = now
  return hash
}

app.get('/api/changes', (_req, res) => {
  res.json({ fingerprint: getContentFingerprint() })
})

// ── UTM Tracking & Revenue Attribution ──────────────────

const UTM_LINKS_FILE = resolve(import.meta.dirname, '..', 'data', 'utm-links.json')
const UTM_CLICKS_FILE = resolve(import.meta.dirname, '..', 'data', 'utm-clicks.json')

interface UtmLink {
  id: string
  postId: string
  clientId: string
  clientName: string
  platform: string
  pillar: string
  campaignName: string
  websiteUrl: string
  fullUrl: string
  shortCode: string
  createdAt: string
  clicks: number
}

interface UtmClick {
  shortCode: string
  timestamp: string
  referrer: string
  userAgent: string
}

function readUtmLinks(): UtmLink[] {
  try {
    if (existsSync(UTM_LINKS_FILE)) {
      return JSON.parse(readFileSync(UTM_LINKS_FILE, 'utf-8'))
    }
  } catch { /* ignore */ }
  return []
}

function writeUtmLinks(links: UtmLink[]) {
  writeFileSync(UTM_LINKS_FILE, JSON.stringify(links, null, 2), 'utf-8')
}

function readUtmClicks(): UtmClick[] {
  try {
    if (existsSync(UTM_CLICKS_FILE)) {
      return JSON.parse(readFileSync(UTM_CLICKS_FILE, 'utf-8'))
    }
  } catch { /* ignore */ }
  return []
}

function writeUtmClicks(clicks: UtmClick[]) {
  writeFileSync(UTM_CLICKS_FILE, JSON.stringify(clicks, null, 2), 'utf-8')
}

function generateShortCode(): string {
  return `pb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function buildUtmUrl(websiteUrl: string, params: Record<string, string>): string {
  const url = new URL(websiteUrl)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  return url.toString()
}

// Generate UTM parameters for a post
app.post('/api/utm/generate', (req, res) => {
  const { postId, clientId, platform, pillar, campaignName, websiteUrl } = req.body
  if (!postId || !clientId || !platform || !websiteUrl) {
    res.status(400).json({ error: 'Missing required fields: postId, clientId, platform, websiteUrl' })
    return
  }

  try {
    // Validate URL
    new URL(websiteUrl)
  } catch {
    res.status(400).json({ error: 'Invalid websiteUrl — must be a valid URL' })
    return
  }

  try {
    const links = readUtmLinks()

    // Check if link already exists for this post
    const existing = links.find(l => l.postId === postId)
    if (existing) {
      res.json({ link: existing, existed: true })
      return
    }

    // Get client name from scanned data
    let clientName = clientId
    try {
      const scanned = applyOverrides(scanClients(PROJECT_ROOT))
      const client = scanned.clients.find(c => c.id === clientId)
      if (client) clientName = client.displayName || client.name
    } catch { /* fallback to clientId */ }

    const now = new Date()
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    const campaign = campaignName || `${clientName.toLowerCase().replace(/\s+/g, '-')}_${monthNames[now.getMonth()]}_${now.getFullYear()}`

    const utmParams: Record<string, string> = {
      utm_source: platform.toLowerCase(),
      utm_medium: 'social',
      utm_campaign: campaign,
      utm_content: postId,
    }
    if (pillar) {
      utmParams.utm_term = pillar.toLowerCase()
    }

    const fullUrl = buildUtmUrl(websiteUrl, utmParams)
    const shortCode = generateShortCode()

    const link: UtmLink = {
      id: `utm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      postId,
      clientId,
      clientName,
      platform: platform.toLowerCase(),
      pillar: pillar || '',
      campaignName: campaign,
      websiteUrl,
      fullUrl,
      shortCode,
      createdAt: now.toISOString(),
      clicks: 0,
    }

    links.push(link)
    writeUtmLinks(links)
    res.json({ link, existed: false })
  } catch (error: any) {
    console.error('UTM generate error:', error)
    res.status(500).json({ error: error.message || 'Failed to generate UTM link' })
  }
})

// Bulk generate UTM links for all posts of a client
app.post('/api/utm/generate-bulk', (req, res) => {
  const { clientId, websiteUrl, campaignName } = req.body
  if (!clientId || !websiteUrl) {
    res.status(400).json({ error: 'Missing required fields: clientId, websiteUrl' })
    return
  }

  try {
    new URL(websiteUrl)
  } catch {
    res.status(400).json({ error: 'Invalid websiteUrl' })
    return
  }

  try {
    const scanned = applyOverrides(scanClients(PROJECT_ROOT))
    const client = scanned.clients.find(c => c.id === clientId)
    if (!client) {
      res.status(404).json({ error: 'Client not found' })
      return
    }

    const links = readUtmLinks()
    const existingPostIds = new Set(links.map(l => l.postId))
    const clientName = client.displayName || client.name

    const now = new Date()
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    const campaign = campaignName || `${clientName.toLowerCase().replace(/\s+/g, '-')}_${monthNames[now.getMonth()]}_${now.getFullYear()}`

    const newLinks: UtmLink[] = []

    for (const post of client.posts) {
      if (existingPostIds.has(post.id)) continue

      const utmParams: Record<string, string> = {
        utm_source: post.platform.toLowerCase(),
        utm_medium: 'social',
        utm_campaign: campaign,
        utm_content: post.id,
      }
      if (post.pillar) {
        utmParams.utm_term = post.pillar.toLowerCase()
      }

      const fullUrl = buildUtmUrl(websiteUrl, utmParams)
      const shortCode = generateShortCode()

      const link: UtmLink = {
        id: `utm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}_${newLinks.length}`,
        postId: post.id,
        clientId,
        clientName,
        platform: post.platform.toLowerCase(),
        pillar: post.pillar || '',
        campaignName: campaign,
        websiteUrl,
        fullUrl,
        shortCode,
        createdAt: now.toISOString(),
        clicks: 0,
      }
      newLinks.push(link)
    }

    links.push(...newLinks)
    writeUtmLinks(links)
    res.json({ generated: newLinks.length, total: links.filter(l => l.clientId === clientId).length })
  } catch (error: any) {
    console.error('UTM bulk generate error:', error)
    res.status(500).json({ error: error.message || 'Failed to generate UTM links' })
  }
})

// Track click — redirect endpoint
app.get('/api/utm/track/:shortCode', (req, res) => {
  const { shortCode } = req.params
  const links = readUtmLinks()
  const link = links.find(l => l.shortCode === shortCode)
  if (!link) {
    res.status(404).json({ error: 'Link not found' })
    return
  }

  // Increment click
  link.clicks++
  writeUtmLinks(links)

  // Log click details
  const clicks = readUtmClicks()
  clicks.push({
    shortCode,
    timestamp: new Date().toISOString(),
    referrer: (req.headers.referer || req.headers.referrer || '') as string,
    userAgent: req.headers['user-agent'] || '',
  })
  writeUtmClicks(clicks)

  // Redirect to the full URL
  res.redirect(302, link.fullUrl)
})

// Get all UTM stats grouped by client
app.get('/api/utm/stats', (_req, res) => {
  const links = readUtmLinks()
  const clicks = readUtmClicks()

  // Group by client
  const byClient: Record<string, { clientId: string; clientName: string; links: UtmLink[]; totalClicks: number }> = {}
  for (const link of links) {
    if (!byClient[link.clientId]) {
      byClient[link.clientId] = {
        clientId: link.clientId,
        clientName: link.clientName,
        links: [],
        totalClicks: 0,
      }
    }
    byClient[link.clientId].links.push(link)
    byClient[link.clientId].totalClicks += link.clicks
  }

  // Clicks by day
  const clicksByDay: Record<string, number> = {}
  for (const click of clicks) {
    const day = click.timestamp.split('T')[0]
    clicksByDay[day] = (clicksByDay[day] || 0) + 1
  }

  res.json({
    clients: Object.values(byClient),
    totalLinks: links.length,
    totalClicks: links.reduce((s, l) => s + l.clicks, 0),
    clicksByDay: Object.entries(clicksByDay).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date)),
  })
})

// Get UTM stats for a specific client
app.get('/api/utm/stats/:clientId', (req, res) => {
  const { clientId } = req.params
  const links = readUtmLinks().filter(l => l.clientId === clientId)
  const clicks = readUtmClicks().filter(c => {
    const link = links.find(l => l.shortCode === c.shortCode)
    return !!link
  })

  // By platform
  const byPlatform: Record<string, number> = {}
  const byPillar: Record<string, number> = {}
  for (const link of links) {
    byPlatform[link.platform] = (byPlatform[link.platform] || 0) + link.clicks
    if (link.pillar) {
      byPillar[link.pillar] = (byPillar[link.pillar] || 0) + link.clicks
    }
  }

  // Clicks by day
  const clicksByDay: Record<string, number> = {}
  for (const click of clicks) {
    const day = click.timestamp.split('T')[0]
    clicksByDay[day] = (clicksByDay[day] || 0) + 1
  }

  // Top posts by clicks
  const topPosts = [...links]
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10)

  res.json({
    clientId,
    links,
    totalClicks: links.reduce((s, l) => s + l.clicks, 0),
    byPlatform: Object.entries(byPlatform).map(([platform, clicks]) => ({ platform, clicks })),
    byPillar: Object.entries(byPillar).map(([pillar, clicks]) => ({ pillar, clicks })),
    clicksByDay: Object.entries(clicksByDay).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date)),
    topPosts,
  })
})

// Delete a UTM link
app.delete('/api/utm/:linkId', (req, res) => {
  const { linkId } = req.params
  const links = readUtmLinks()
  const filtered = links.filter(l => l.id !== linkId)
  if (filtered.length === links.length) {
    res.status(404).json({ error: 'Link not found' })
    return
  }
  writeUtmLinks(filtered)
  res.json({ success: true })
})

// Serve the review page HTML
const REVIEW_PAGE_HTML = readFileSync(resolve(import.meta.dirname, 'review-page.html'), 'utf-8')
app.get('/review/:token', (_req, res) => {
  res.type('html').send(REVIEW_PAGE_HTML)
})

// Serve the client portal HTML
const CLIENT_PORTAL_HTML = existsSync(resolve(import.meta.dirname, 'client-portal.html'))
  ? readFileSync(resolve(import.meta.dirname, 'client-portal.html'), 'utf-8')
  : '<html><body>Client portal page not found</body></html>'
app.get('/portal/:token', (_req, res) => {
  res.type('html').send(CLIENT_PORTAL_HTML)
})

// Client portal API — returns client data, posts, analytics, feedback, and white-label config
app.get('/api/portal/:token/data', (req, res) => {
  const validation = validateReviewToken(req.params.token)
  if (!validation.entry) {
    res.status(validation.status!).json({ error: validation.error })
    return
  }
  try {
    const data = applyOverrides(scanClients(PROJECT_ROOT))
    const client = data.clients.find(c => c.id === validation.entry!.clientId)
    if (!client) {
      res.status(404).json({ error: 'Client not found' })
      return
    }

    const postMedia = readPostMedia()

    // Feedback for this token
    const feedback = readFeedback().filter(f => f.token === req.params.token)

    // Analytics (if available)
    const analyticsStore = readAnalytics()
    const analytics = analyticsStore[validation.entry!.clientId] || null

    // White-label config
    const WL_FILE = resolve(import.meta.dirname, '..', 'data', 'white-label.json')
    let whiteLabel = { agencyName: 'Epic Digital Hub', agencyLogo: '', primaryColor: '#7c3aed', secondaryColor: '#06b6d4', footerText: 'Powered by Epic Digital Hub' }
    try {
      if (existsSync(WL_FILE)) {
        whiteLabel = JSON.parse(readFileSync(WL_FILE, 'utf-8'))
      }
    } catch { /* use defaults */ }

    res.json({
      client: {
        displayName: client.displayName,
        color: client.color,
        stats: client.stats,
        posts: client.posts.map(p => ({
          id: p.id,
          date: p.date,
          time: p.time,
          platform: p.platform,
          format: p.format,
          pillar: p.pillar,
          caption: p.caption,
          visualDescription: p.visualDescription,
          cta: p.cta,
          hashtags: p.hashtags,
          status: p.status,
          imageUrl: getPrimaryPostImage(postMedia[p.id])?.url || null,
          media: postMedia[p.id] || [],
        })),
      },
      feedback,
      analytics: analytics ? {
        period: analytics.period,
        combined: analytics.combined,
      } : null,
      whiteLabel,
    })
  } catch (error) {
    console.error('Portal data error:', error)
    res.status(500).json({ error: 'Failed to load portal data' })
  }
})

// Serve the contract page HTML
const CONTRACT_PAGE_HTML = existsSync(resolve(import.meta.dirname, 'contract-page.html'))
  ? readFileSync(resolve(import.meta.dirname, 'contract-page.html'), 'utf-8')
  : '<html><body>Contract page not found</body></html>'
app.get('/contract/:contractId', (_req, res) => {
  res.type('html').send(CONTRACT_PAGE_HTML)
})

app.listen(PORT, () => {
  console.log(`\n  ⚡ PostBoard API running at http://localhost:${PORT}`)
  console.log(`  📁 Scanning: ${PROJECT_ROOT}/CLIENTI\n`)
  // Start scheduler on boot
  startSchedulerTimer()
})
