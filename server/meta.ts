import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// ── Types ────────────────────────────────────────────────
export interface PageConnection {
  pageId: string
  pageName: string
  pageAccessToken: string
  instagramAccountId?: string
  manualInstagramAccountId?: string
  connectedAt: string
}

export interface MetaConnections {
  userAccessToken?: string
  userTokenExpiry?: string
  pages: PageConnection[]
}

// ── Config ───────────────────────────────────────────────
const DATA_DIR = resolve(process.env.DATA_DIR || resolve(process.cwd(), 'data'))
const CONNECTIONS_FILE = resolve(DATA_DIR, 'connections.json')
const INSTAGRAM_OVERRIDES_FILE = resolve(DATA_DIR, 'instagram-overrides.json')

export const META_APP_ID = process.env.META_APP_ID || ''
export const META_APP_SECRET = process.env.META_APP_SECRET || ''
export const APP_ORIGIN = (process.env.POSTBOARD_APP_ORIGIN || 'http://localhost:5173').replace(/\/+$/, '')
export const PUBLIC_ORIGIN = (process.env.POSTBOARD_PUBLIC_ORIGIN || APP_ORIGIN || 'http://localhost:3001').replace(/\/+$/, '')
const REDIRECT_URI = `${APP_ORIGIN}/auth/callback`

// ── Connections persistence ──────────────────────────────
export function readConnections(): MetaConnections {
  try {
    if (existsSync(CONNECTIONS_FILE)) {
      const connections = JSON.parse(readFileSync(CONNECTIONS_FILE, 'utf-8')) as MetaConnections
      const overrides = readInstagramOverrides()
      return {
        ...connections,
        pages: (connections.pages || []).map(page => ({
          ...page,
          manualInstagramAccountId: overrides[page.pageId],
        })),
      }
    }
  } catch { /* ignore */ }
  return { pages: [] }
}

export function writeConnections(connections: MetaConnections) {
  const sanitized: MetaConnections = {
    ...connections,
    pages: (connections.pages || []).map(({ manualInstagramAccountId: _manualInstagramAccountId, ...page }) => page),
  }
  writeFileSync(CONNECTIONS_FILE, JSON.stringify(sanitized, null, 2), 'utf-8')
}

export function readInstagramOverrides(): Record<string, string> {
  try {
    if (existsSync(INSTAGRAM_OVERRIDES_FILE)) {
      return JSON.parse(readFileSync(INSTAGRAM_OVERRIDES_FILE, 'utf-8'))
    }
  } catch { /* ignore */ }
  return {}
}

export function writeInstagramOverrides(overrides: Record<string, string>) {
  writeFileSync(INSTAGRAM_OVERRIDES_FILE, JSON.stringify(overrides, null, 2), 'utf-8')
}

export function getEffectiveInstagramAccountId(page: Pick<PageConnection, 'instagramAccountId' | 'manualInstagramAccountId'>) {
  return page.manualInstagramAccountId || page.instagramAccountId || undefined
}

function resolveInstagramAccountId(page: any): string | undefined {
  return page?.instagram_business_account?.id || page?.connected_instagram_account?.id || undefined
}

// Scopes are loaded from .env so you can adjust without code changes
// Add META_SCOPES to .env to override
const DEFAULT_SCOPES = 'pages_read_engagement,pages_show_list,pages_manage_posts,instagram_basic,instagram_content_publish,business_management,ads_management,ads_read,read_insights'
const META_SCOPES = process.env.META_SCOPES || DEFAULT_SCOPES

export function getLoginUrl(): string {
  return `https://www.facebook.com/v21.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${META_SCOPES}&response_type=code`
}

async function graphFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, options)
  const data = await res.json()
  if (data.error) {
    throw new Error(`Meta API: ${data.error.message}`)
  }
  return data
}

// Exchange auth code for short-lived token, then long-lived token
export async function exchangeCodeForToken(code: string): Promise<string> {
  // Get short-lived token
  const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_secret=${META_APP_SECRET}&code=${code}`
  const tokenData = await graphFetch(tokenUrl)
  const shortToken = tokenData.access_token

  // Exchange for long-lived token (60 days)
  const longUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${shortToken}`
  const longData = await graphFetch(longUrl)

  return longData.access_token
}

// Fetch all pages the user manages and their tokens (with pagination)
// Also fetches pages via /me/businesses for pages that don't show in /me/accounts
export async function fetchUserPages(userToken: string): Promise<PageConnection[]> {
  const pagesMap = new Map<string, PageConnection>()

  // Method 1: /me/accounts (standard)
  let url: string | null = `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,instagram_business_account{id},connected_instagram_account{id}&limit=100&access_token=${userToken}`
  while (url) {
    const data = await graphFetch(url)
    for (const page of data.data || []) {
      pagesMap.set(page.id, {
        pageId: page.id,
        pageName: page.name,
        pageAccessToken: page.access_token,
        instagramAccountId: resolveInstagramAccountId(page),
        connectedAt: new Date().toISOString(),
      })
    }
    url = data.paging?.next || null
  }

  // Method 2: /me/businesses → each business's /owned_pages
  // Catches pages that don't appear in /me/accounts (New Pages Experience, etc.)
  try {
    const bizData = await graphFetch(
      `https://graph.facebook.com/v21.0/me/businesses?fields=id,name&access_token=${userToken}`
    )
    for (const biz of bizData.data || []) {
      try {
        let bizUrl: string | null = `https://graph.facebook.com/v21.0/${biz.id}/owned_pages?fields=id,name,access_token,instagram_business_account{id},connected_instagram_account{id}&limit=100&access_token=${userToken}`
        while (bizUrl) {
          const pageData = await graphFetch(bizUrl)
          for (const page of pageData.data || []) {
            if (!pagesMap.has(page.id)) {
              pagesMap.set(page.id, {
                pageId: page.id,
                pageName: page.name,
                pageAccessToken: page.access_token,
                instagramAccountId: resolveInstagramAccountId(page),
                connectedAt: new Date().toISOString(),
              })
            }
          }
          bizUrl = pageData.paging?.next || null
        }
      } catch { /* skip business if no access */ }
    }
  } catch { /* /me/businesses may not be available — that's ok */ }

  return [...pagesMap.values()]
}

// ── Publishing ───────────────────────────────────────────

export interface FacebookPublishMedia {
  type: 'image' | 'video'
  url: string
}

export type InstagramPublishMedia =
  | {
    type: 'image' | 'video'
    url: string
    shareToFeed?: boolean
  }
  | {
    type: 'carousel'
    items: Array<{
      type: 'image' | 'video'
      url: string
    }>
  }
  | {
    type: 'story'
    media: {
      type: 'image' | 'video'
      url: string
    }
  }

async function createInstagramContainer(igAccountId: string, payload: Record<string, unknown>) {
  const containerUrl = `https://graph.facebook.com/v21.0/${igAccountId}/media`
  return graphFetch(containerUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }) as Promise<{ id: string }>
}

async function waitForInstagramContainer(containerId: string, pageToken: string, label: string) {
  const maxAttempts = 20
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await graphFetch(
      `https://graph.facebook.com/v21.0/${containerId}?fields=status_code,status&access_token=${pageToken}`,
    )
    const statusCode = String(status.status_code || '').toUpperCase()
    if (!statusCode || statusCode === 'FINISHED') return
    if (statusCode === 'ERROR' || statusCode === 'EXPIRED') {
      throw new Error(`${label} processing failed: ${status.status || status.status_code || 'Unknown error'}`)
    }
    await new Promise(resolve => setTimeout(resolve, 3000))
  }
  throw new Error(`${label} processing timed out before publish`)
}

async function publishInstagramContainer(igAccountId: string, pageToken: string, creationId: string) {
  const publishUrl = `https://graph.facebook.com/v21.0/${igAccountId}/media_publish`
  return graphFetch(publishUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: creationId,
      access_token: pageToken,
    }),
  }) as Promise<{ id: string }>
}

// Publish a text/link post to a Facebook page
export async function publishToFacebook(
  pageId: string,
  pageToken: string,
  message: string,
  media?: FacebookPublishMedia,
): Promise<{ id: string }> {
  if (media?.type === 'video') {
    const url = `https://graph.facebook.com/v21.0/${pageId}/videos`
    const data = await graphFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file_url: media.url,
        description: message,
        access_token: pageToken,
      }),
    })
    return { id: data.id }
  } else if (media?.type === 'image') {
    // Photo post
    const url = `https://graph.facebook.com/v21.0/${pageId}/photos`
    const data = await graphFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: media.url,
        message,
        access_token: pageToken,
      }),
    })
    return { id: data.post_id || data.id }
  } else {
    // Text post
    const url = `https://graph.facebook.com/v21.0/${pageId}/feed`
    const data = await graphFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        access_token: pageToken,
      }),
    })
    return { id: data.id }
  }
}

// Publish to Instagram (single image, reel/video, or carousel)
export async function publishToInstagram(
  igAccountId: string,
  pageToken: string,
  caption: string,
  media: InstagramPublishMedia,
): Promise<{ id: string }> {
  if (media.type === 'story') {
    const containerPayload = media.media.type === 'video'
      ? {
        media_type: 'STORIES',
        video_url: media.media.url,
        access_token: pageToken,
      }
      : {
        media_type: 'STORIES',
        image_url: media.media.url,
        access_token: pageToken,
      }

    const container = await createInstagramContainer(igAccountId, containerPayload)
    if (media.media.type === 'video') {
      await waitForInstagramContainer(container.id, pageToken, 'Instagram story video')
    }

    const result = await publishInstagramContainer(igAccountId, pageToken, container.id)
    return { id: result.id }
  }

  if (media.type === 'carousel') {
    if (media.items.length < 2 || media.items.length > 10) {
      throw new Error('Instagram carousel requires between 2 and 10 media items')
    }

    const childIds: string[] = []
    let hasVideoChild = false

    for (const item of media.items) {
      const childPayload = item.type === 'video'
        ? {
          media_type: 'REELS',
          video_url: item.url,
          is_carousel_item: true,
          access_token: pageToken,
        }
        : {
          image_url: item.url,
          is_carousel_item: true,
          access_token: pageToken,
        }
      const child = await createInstagramContainer(igAccountId, childPayload)
      childIds.push(child.id)
      if (item.type === 'video') {
        hasVideoChild = true
        await waitForInstagramContainer(child.id, pageToken, 'Instagram carousel video')
      }
    }

    const carouselContainer = await createInstagramContainer(igAccountId, {
      media_type: 'CAROUSEL',
      children: childIds,
      caption,
      access_token: pageToken,
    })

    if (hasVideoChild) {
      await waitForInstagramContainer(carouselContainer.id, pageToken, 'Instagram carousel')
    }

    const result = await publishInstagramContainer(igAccountId, pageToken, carouselContainer.id)
    return { id: result.id }
  }

  const containerPayload = media.type === 'video'
    ? {
      media_type: 'REELS',
      video_url: media.url,
      caption,
      share_to_feed: media.shareToFeed ?? false,
      access_token: pageToken,
    }
    : {
      image_url: media.url,
      caption,
      access_token: pageToken,
    }

  const container = await createInstagramContainer(igAccountId, containerPayload)

  if (media.type === 'video') {
    await waitForInstagramContainer(container.id, pageToken, 'Instagram video')
  }

  const result = await publishInstagramContainer(igAccountId, pageToken, container.id)

  return { id: result.id }
}
