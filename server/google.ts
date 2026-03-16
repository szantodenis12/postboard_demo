import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// ── Types ────────────────────────────────────────────────
export interface GoogleLocation {
  name: string          // accounts/{id}/locations/{id}
  locationName: string  // Human-readable business name
  address?: string
  locationId: string
}

export interface GoogleConnection {
  id: string            // unique connection id
  label: string         // user-friendly label (e.g. "Personal" or "Agency")
  email?: string        // google email if available
  accessToken: string
  refreshToken: string
  tokenExpiry: string
  accountId?: string
  locations: GoogleLocation[]
  connectedAt: string
}

export interface GoogleInsightsData {
  locationName: string
  period: string // 'YYYY-MM'
  lastFetched: string
  metrics: {
    searchViews: number
    mapViews: number
    websiteClicks: number
    phoneClicks: number
    directionRequests: number
    totalInteractions: number
  }
  dailyMetrics: { date: string; searches: number; maps: number; website: number; phone: number; directions: number }[]
}

export interface GoogleInsightsRetryJob {
  key: string
  clientId: string
  locationName: string
  period: string
  attempts: number
  nextRetryAt: string
  lastError: string
  createdAt: string
  updatedAt: string
}

// ── Config ───────────────────────────────────────────────
const CONNECTIONS_FILE = resolve(process.cwd(), 'data', 'google-connections.json')
const GOOGLE_MAPPING_FILE = resolve(process.cwd(), 'data', 'google-mapping.json')
const GOOGLE_ANALYTICS_FILE = resolve(process.cwd(), 'data', 'google-analytics.json')
const GOOGLE_RETRY_QUEUE_FILE = resolve(process.cwd(), 'data', 'google-retry-queue.json')

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env')
  if (!existsSync(envPath)) return {}
  const content = readFileSync(envPath, 'utf-8')
  const env: Record<string, string> = {}
  for (const line of content.split('\n')) {
    const match = line.match(/^(\w+)=(.*)$/)
    if (match) env[match[1]] = match[2].trim()
  }
  return env
}

const env = loadEnv()
export const GOOGLE_CLIENT_ID = env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || ''
export const GOOGLE_CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || ''
const APP_ORIGIN = (env.POSTBOARD_APP_ORIGIN || process.env.POSTBOARD_APP_ORIGIN || 'http://localhost:5173').replace(/\/+$/, '')
const REDIRECT_URI = (env.GOOGLE_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI || `${APP_ORIGIN}/auth/google/callback`).replace(/\/+$/, '')
const SCOPES = 'https://www.googleapis.com/auth/business.manage https://www.googleapis.com/auth/userinfo.email'

// ── Persistence (multi-account) ─────────────────────────
export function readGoogleConnections(): GoogleConnection[] {
  try {
    if (existsSync(CONNECTIONS_FILE)) {
      const data = JSON.parse(readFileSync(CONNECTIONS_FILE, 'utf-8'))
      // Migration: if old single-connection format, wrap in array
      if (data && !Array.isArray(data) && data.accessToken) {
        return [{ ...data, id: 'conn_1', label: 'Account 1' }]
      }
      if (Array.isArray(data)) return data.filter((c: any) => c.accessToken && c.refreshToken)
    }
  } catch { /* ignore */ }
  return []
}

export function writeGoogleConnections(conns: GoogleConnection[]) {
  writeFileSync(CONNECTIONS_FILE, JSON.stringify(conns, null, 2), 'utf-8')
}

// Legacy compat — returns first connection or null
export function readGoogleConnection(): GoogleConnection | null {
  const conns = readGoogleConnections()
  return conns.length > 0 ? conns[0] : null
}

export function readGoogleMapping(): Record<string, string> {
  try {
    if (existsSync(GOOGLE_MAPPING_FILE)) {
      return JSON.parse(readFileSync(GOOGLE_MAPPING_FILE, 'utf-8'))
    }
  } catch { /* ignore */ }
  return {}
}

export function writeGoogleMapping(mapping: Record<string, string>) {
  writeFileSync(GOOGLE_MAPPING_FILE, JSON.stringify(mapping, null, 2), 'utf-8')
}

export function readGoogleAnalytics(): Record<string, GoogleInsightsData> {
  try {
    if (existsSync(GOOGLE_ANALYTICS_FILE)) {
      return JSON.parse(readFileSync(GOOGLE_ANALYTICS_FILE, 'utf-8'))
    }
  } catch { /* ignore */ }
  return {}
}

export function writeGoogleAnalytics(data: Record<string, GoogleInsightsData>) {
  writeFileSync(GOOGLE_ANALYTICS_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

export function readGoogleRetryQueue(): GoogleInsightsRetryJob[] {
  try {
    if (existsSync(GOOGLE_RETRY_QUEUE_FILE)) {
      const data = JSON.parse(readFileSync(GOOGLE_RETRY_QUEUE_FILE, 'utf-8'))
      if (Array.isArray(data)) {
        return data.filter((job: any) =>
          job?.key &&
          job?.clientId &&
          job?.locationName &&
          job?.period &&
          job?.nextRetryAt,
        )
      }
    }
  } catch { /* ignore */ }
  return []
}

export function writeGoogleRetryQueue(queue: GoogleInsightsRetryJob[]) {
  const sorted = [...queue].sort((a, b) => a.nextRetryAt.localeCompare(b.nextRetryAt))
  writeFileSync(GOOGLE_RETRY_QUEUE_FILE, JSON.stringify(sorted, null, 2), 'utf-8')
}

// ── OAuth helpers ────────────────────────────────────────
export function getGoogleLoginUrl(): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

export async function exchangeGoogleCode(code: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn: number }> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  })
  const data = await res.json()
  if (data.error) {
    throw new Error(`Google OAuth: ${data.error_description || data.error}`)
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || undefined,
    expiresIn: data.expires_in,
  }
}

export async function refreshGoogleToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
  })
  const data = await res.json()
  if (data.error) {
    throw new Error(`Google token refresh: ${data.error_description || data.error}`)
  }
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  }
}

// Fetch the Google email for a token
export async function fetchGoogleEmail(token: string): Promise<string | null> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    return data.email || null
  } catch { return null }
}

function isTokenExpired(tokenExpiry: string): boolean {
  return new Date(tokenExpiry) <= new Date()
}

async function ensureFreshAccessToken(conn: GoogleConnection, conns: GoogleConnection[]): Promise<string> {
  if (!isTokenExpired(conn.tokenExpiry)) {
    return conn.accessToken
  }

  const refreshed = await refreshGoogleToken(conn.refreshToken)
  conn.accessToken = refreshed.accessToken
  conn.tokenExpiry = new Date(Date.now() + refreshed.expiresIn * 1000).toISOString()
  writeGoogleConnections(conns)
  return conn.accessToken
}

async function syncLocationsForConnection(conn: GoogleConnection, conns: GoogleConnection[]): Promise<GoogleLocation[]> {
  const token = await ensureFreshAccessToken(conn, conns)
  const accounts = await fetchAccounts(token)
  if (accounts.length === 0) {
    throw new Error('This Google account has no Business Profile accounts.')
  }
  conn.accountId = accounts[0]?.name
  conn.locations = []
  let failedAccounts = 0

  for (const account of accounts) {
    try {
      const locs = await fetchLocations(token, account.name)
      conn.locations.push(...locs)
    } catch {
      // Keep going so a partial Google account issue does not hide other locations.
      failedAccounts += 1
    }
  }

  if (conn.locations.length === 0) {
    if (failedAccounts === accounts.length) {
      throw new Error('Google account connected, but locations could not be loaded right now.')
    }
    throw new Error('This Google account has no Business Profile locations.')
  }

  writeGoogleConnections(conns)
  return conn.locations
}

export async function refreshGoogleConnectionLocations(connectionId?: string): Promise<{ connectionId: string; locations: GoogleLocation[] }> {
  const conns = readGoogleConnections()
  const conn = connectionId ? conns.find(c => c.id === connectionId) : conns[0]
  if (!conn) throw new Error('Connection not found')

  const locations = await syncLocationsForConnection(conn, conns)
  return { connectionId: conn.id, locations }
}

// Get a valid token for a specific location (finds the right connection)
export async function getValidTokenForLocation(locationName: string): Promise<string> {
  const conns = readGoogleConnections()
  let conn = conns.find(c => c.locations.some(l => l.name === locationName))

  if (!conn) {
    for (const candidate of conns) {
      try {
        await syncLocationsForConnection(candidate, conns)
      } catch {
        // Ignore per-connection failures and try the next account.
      }
    }
    conn = conns.find(c => c.locations.some(l => l.name === locationName))
  }

  if (!conn) {
    const availableLocations = conns
      .flatMap(c => c.locations.map(l => l.locationName))
      .filter(Boolean)
      .join(', ')
    const suffix = availableLocations ? ` Available locations: ${availableLocations}` : ' No locations are currently loaded for the connected Google accounts.'
    throw new Error(`No Google connection owns location: ${locationName}.${suffix}`)
  }

  return ensureFreshAccessToken(conn, conns)
}

// ── Business Profile API ─────────────────────────────────

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
const GOOGLE_INSIGHTS_COOLDOWN_MS = 15 * 60 * 1000
const GOOGLE_RETRY_BASE_DELAY_MS = 15 * 60 * 1000
const GOOGLE_RETRY_MAX_DELAY_MS = 6 * 60 * 60 * 1000
const GOOGLE_RETRY_MAX_ATTEMPTS = 5
const insightsCooldownUntil = new Map<string, number>()

function getInsightsCooldownKey(locationName: string, period: string): string {
  return `${locationName}::${period}`
}

function getRetryJobKey(clientId: string, period: string): string {
  return `${clientId}::${period}`
}

function getRetryDelayMs(attempts: number) {
  return Math.min(
    GOOGLE_RETRY_MAX_DELAY_MS,
    GOOGLE_RETRY_BASE_DELAY_MS * Math.max(1, 2 ** attempts),
  )
}

function normalizeInsightsPeriod(period?: string) {
  if (period && /^\d{4}-\d{2}$/.test(period)) {
    return period
  }
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function isGoogleRateLimitError(message: string) {
  return /Google Insights este limitat temporar|Rate limit exceeded after retries|RESOURCE_EXHAUSTED/i.test(message)
}

export function getGoogleRetryStatus(clientId: string, period?: string): GoogleInsightsRetryJob | null {
  const queue = readGoogleRetryQueue()
  const normalizedPeriod = period ? normalizeInsightsPeriod(period) : null
  const jobs = queue.filter(job =>
    job.clientId === clientId &&
    (!normalizedPeriod || job.period === normalizedPeriod),
  )
  if (jobs.length === 0) return null
  return jobs.sort((a, b) => a.nextRetryAt.localeCompare(b.nextRetryAt))[0]
}

export function clearGoogleRetryStatus(clientId: string, period?: string) {
  const normalizedPeriod = period ? normalizeInsightsPeriod(period) : null
  const queue = readGoogleRetryQueue()
  const nextQueue = queue.filter(job =>
    job.clientId !== clientId ||
    (normalizedPeriod && job.period !== normalizedPeriod),
  )
  if (nextQueue.length !== queue.length) {
    writeGoogleRetryQueue(nextQueue)
  }
}

export function scheduleGoogleInsightsRetry(params: {
  clientId: string
  locationName: string
  period?: string
  lastError: string
}) {
  const targetPeriod = normalizeInsightsPeriod(params.period)
  const queue = readGoogleRetryQueue()
  const key = getRetryJobKey(params.clientId, targetPeriod)
  const existingIndex = queue.findIndex(job => job.key === key)
  const now = new Date().toISOString()

  if (existingIndex >= 0) {
    const existing = queue[existingIndex]
    const updated: GoogleInsightsRetryJob = {
      ...existing,
      locationName: params.locationName,
      lastError: params.lastError,
      updatedAt: now,
    }
    queue[existingIndex] = updated
    writeGoogleRetryQueue(queue)
    return updated
  }

  const job: GoogleInsightsRetryJob = {
    key,
    clientId: params.clientId,
    locationName: params.locationName,
    period: targetPeriod,
    attempts: 0,
    nextRetryAt: new Date(Date.now() + GOOGLE_RETRY_BASE_DELAY_MS).toISOString(),
    lastError: params.lastError,
    createdAt: now,
    updatedAt: now,
  }
  queue.push(job)
  writeGoogleRetryQueue(queue)
  return job
}

export async function processGoogleRetryQueue() {
  const queue = readGoogleRetryQueue()
  if (queue.length === 0) {
    return { processed: 0, completed: 0, rescheduled: 0, failed: 0, pending: 0 }
  }

  const now = Date.now()
  const nextQueue: GoogleInsightsRetryJob[] = []
  const analyticsStore = readGoogleAnalytics()
  let analyticsChanged = false
  let processed = 0
  let completed = 0
  let rescheduled = 0
  let failed = 0

  for (const job of queue) {
    if (new Date(job.nextRetryAt).getTime() > now) {
      nextQueue.push(job)
      continue
    }

    processed += 1

    try {
      const insights = await fetchLocationInsights(job.locationName, job.period)
      analyticsStore[job.clientId] = insights
      analyticsChanged = true
      completed += 1
      console.log(`[google] Retry sync succeeded for ${job.clientId} (${job.period})`)
    } catch (error: any) {
      const message = error?.message || 'Unknown Google retry error'
      if (isGoogleRateLimitError(message) && job.attempts < GOOGLE_RETRY_MAX_ATTEMPTS) {
        const updatedJob: GoogleInsightsRetryJob = {
          ...job,
          attempts: job.attempts + 1,
          nextRetryAt: new Date(Date.now() + getRetryDelayMs(job.attempts + 1)).toISOString(),
          lastError: message,
          updatedAt: new Date().toISOString(),
        }
        nextQueue.push(updatedJob)
        rescheduled += 1
        console.warn(`[google] Retry sync rescheduled for ${job.clientId} (${job.period}) after rate limit`)
        continue
      }

      failed += 1
      console.error(`[google] Retry sync failed for ${job.clientId} (${job.period}):`, message)
    }
  }

  if (analyticsChanged) {
    writeGoogleAnalytics(analyticsStore)
  }
  writeGoogleRetryQueue(nextQueue)

  return {
    processed,
    completed,
    rescheduled,
    failed,
    pending: nextQueue.length,
  }
}

function encodeGoogleResourcePath(resourceName: string): string {
  return resourceName
    .split('/')
    .filter(Boolean)
    .map(segment => encodeURIComponent(segment))
    .join('/')
}

async function fetchWithRetry(
  url: string,
  opts: RequestInit,
  options: { retries?: number; baseDelayMs?: number } = {},
): Promise<any> {
  const retries = options.retries ?? 4
  const baseDelayMs = options.baseDelayMs ?? 15000
  for (let i = 0; i < retries; i++) {
    let res: Response
    try {
      res = await fetch(url, opts)
    } catch (error: any) {
      throw new Error(`Google API request failed for ${url}: ${error?.message || 'Unknown network error'}`)
    }
    const data = await res.json()
    if (data.error?.status === 'RESOURCE_EXHAUSTED' || res.status === 429) {
      const wait = (i + 1) * baseDelayMs
      console.log(`[google] Rate limited, retrying in ${wait / 1000}s...`)
      await sleep(wait)
      continue
    }
    return data
  }
  throw new Error('Google API: Rate limit exceeded after retries. Wait a few minutes and try again.')
}

// Fetch all accounts
export async function fetchAccounts(token: string): Promise<{ name: string; accountName: string }[]> {
  const url = new URL('https://mybusinessaccountmanagement.googleapis.com/v1/accounts')
  const data = await fetchWithRetry(
    url.toString(),
    { headers: { Authorization: `Bearer ${token}` } },
  )
  if (data.error) throw new Error(`Google API: ${data.error.message}`)
  return (data.accounts || []).map((a: any) => ({
    name: a.name,
    accountName: a.accountName,
  }))
}

// Fetch locations for an account
export async function fetchLocations(token: string, accountName: string): Promise<GoogleLocation[]> {
  const url = new URL(`https://mybusinessbusinessinformation.googleapis.com/v1/${encodeGoogleResourcePath(accountName)}/locations`)
  url.searchParams.set('readMask', 'name,title,storefrontAddress')
  const data = await fetchWithRetry(
    url.toString(),
    { headers: { Authorization: `Bearer ${token}` } },
  )
  if (data.error) throw new Error(`Google API: ${data.error.message}`)
  return (data.locations || []).map((loc: any) => {
    const parts = loc.name.split('/')
    return {
      name: loc.name,
      locationName: loc.title || 'Unnamed Location',
      address: loc.storefrontAddress?.addressLines?.join(', '),
      locationId: parts[parts.length - 1],
    }
  })
}

// Fetch performance metrics for a location
export async function fetchLocationInsights(
  locationName: string, // "locations/{id}"
  period?: string, // 'YYYY-MM'
): Promise<GoogleInsightsData> {
  const token = await getValidTokenForLocation(locationName)
  const now = new Date()
  const targetPeriod = period || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [year, month] = targetPeriod.split('-').map(Number)
  const cooldownKey = getInsightsCooldownKey(locationName, targetPeriod)
  const cooldownUntil = insightsCooldownUntil.get(cooldownKey)

  if (cooldownUntil && cooldownUntil > Date.now()) {
    const remainingMinutes = Math.max(1, Math.ceil((cooldownUntil - Date.now()) / 60000))
    throw new Error(`Google Insights este limitat temporar pentru această locație. Reîncearcă peste aproximativ ${remainingMinutes} minute.`)
  }

  const lastDay = new Date(year, month, 0).getDate()

  const dailyUrl = new URL(`https://businessprofileperformance.googleapis.com/v1/${encodeGoogleResourcePath(locationName)}:getDailyMetricsTimeSeries`)
  for (const metric of [
    'BUSINESS_IMPRESSIONS_DESKTOP_MAPS',
    'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH',
    'BUSINESS_IMPRESSIONS_MOBILE_MAPS',
    'BUSINESS_IMPRESSIONS_MOBILE_SEARCH',
    'WEBSITE_CLICKS',
    'CALL_CLICKS',
    'BUSINESS_DIRECTION_REQUESTS',
  ]) {
    dailyUrl.searchParams.append('dailyMetric', metric)
  }
  dailyUrl.searchParams.set('dailyRange.startDate.year', String(year))
  dailyUrl.searchParams.set('dailyRange.startDate.month', String(month))
  dailyUrl.searchParams.set('dailyRange.startDate.day', '1')
  dailyUrl.searchParams.set('dailyRange.endDate.year', String(year))
  dailyUrl.searchParams.set('dailyRange.endDate.month', String(month))
  dailyUrl.searchParams.set('dailyRange.endDate.day', String(lastDay))

  let data: any
  try {
    data = await fetchWithRetry(dailyUrl.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    }, {
      retries: 2,
      baseDelayMs: 5000,
    })
  } catch (error: any) {
    if (/Rate limit exceeded after retries/i.test(error.message || '')) {
      insightsCooldownUntil.set(cooldownKey, Date.now() + GOOGLE_INSIGHTS_COOLDOWN_MS)
      throw new Error('Google Insights este limitat temporar pentru această locație. Reîncearcă peste aproximativ 15 minute.')
    }
    throw error
  }

  if (data.error) {
    throw new Error(`Google Insights: ${data.error.message}`)
  }

  insightsCooldownUntil.delete(cooldownKey)

  // Parse the time series data
  const dayTotals = new Map<string, { searches: number; maps: number; website: number; phone: number; directions: number }>()
  let totalSearches = 0, totalMaps = 0, totalWebsite = 0, totalPhone = 0, totalDirections = 0

  for (const series of data.timeSeries || []) {
    const metric = series.dailyMetric
    for (const point of series.timeSeries?.datedValues || []) {
      const d = point.date
      const dateStr = `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
      const value = parseInt(point.value || '0', 10)

      const existing = dayTotals.get(dateStr) || { searches: 0, maps: 0, website: 0, phone: 0, directions: 0 }

      if (metric === 'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH' || metric === 'BUSINESS_IMPRESSIONS_MOBILE_SEARCH') {
        existing.searches += value
        totalSearches += value
      } else if (metric === 'BUSINESS_IMPRESSIONS_DESKTOP_MAPS' || metric === 'BUSINESS_IMPRESSIONS_MOBILE_MAPS') {
        existing.maps += value
        totalMaps += value
      } else if (metric === 'WEBSITE_CLICKS') {
        existing.website += value
        totalWebsite += value
      } else if (metric === 'CALL_CLICKS') {
        existing.phone += value
        totalPhone += value
      } else if (metric === 'BUSINESS_DIRECTION_REQUESTS') {
        existing.directions += value
        totalDirections += value
      }

      dayTotals.set(dateStr, existing)
    }
  }

  const dailyMetrics = [...dayTotals.entries()]
    .map(([date, d]) => ({ date, ...d }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    locationName,
    period: targetPeriod,
    lastFetched: new Date().toISOString(),
    metrics: {
      searchViews: totalSearches,
      mapViews: totalMaps,
      websiteClicks: totalWebsite,
      phoneClicks: totalPhone,
      directionRequests: totalDirections,
      totalInteractions: totalSearches + totalMaps + totalWebsite + totalPhone + totalDirections,
    },
    dailyMetrics,
  }
}

// ── Publishing (Local Posts) ─────────────────────────────

export interface GoogleLocalPost {
  name?: string
  summary: string
  topicType: 'STANDARD' | 'EVENT' | 'OFFER'
  callToAction?: {
    actionType: 'LEARN_MORE' | 'BOOK' | 'ORDER' | 'SHOP' | 'SIGN_UP' | 'CALL'
    url?: string
  }
  media?: {
    mediaFormat: 'PHOTO' | 'VIDEO'
    sourceUrl: string
  }[]
}

export async function publishToGoogle(
  locationResourceName: string,
  summary: string,
  imageUrl?: string,
  ctaUrl?: string,
): Promise<{ name: string }> {
  const token = await getValidTokenForLocation(locationResourceName)

  const body: GoogleLocalPost = {
    summary,
    topicType: 'STANDARD',
  }

  if (imageUrl) {
    body.media = [{ mediaFormat: 'PHOTO', sourceUrl: imageUrl }]
  }

  if (ctaUrl) {
    body.callToAction = { actionType: 'LEARN_MORE', url: ctaUrl }
  }

  const res = await fetch(
    `https://mybusiness.googleapis.com/v4/${locationResourceName}/localPosts`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  )

  const data = await res.json()
  if (data.error) {
    throw new Error(`Google Publish: ${data.error.message || data.error.status}`)
  }

  return { name: data.name }
}
