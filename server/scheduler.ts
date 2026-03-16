import { resolve } from 'path'
import { db } from './firebase.js'

const SCHEDULER_FILE = resolve(process.cwd(), 'data', 'scheduler.json')
const SCHEDULER_LOG_FILE = resolve(process.cwd(), 'data', 'scheduler-log.json')

export interface ClientScheduleConfig {
  autoPublish: boolean
  publishWindowStart: string  // "09:00"
  publishWindowEnd: string    // "21:00"
}

export interface AnalyticsSyncSummary {
  processedClients: number
  metaSuccess: number
  metaFailed: number
  googleSuccess: number
  googleFailed: number
}

export interface AnalyticsSyncConfig {
  enabled: boolean
  runAt: string // "23:30"
  includeMeta: boolean
  includeGoogle: boolean
  lastRunDate?: string
  lastRunAt?: string
  lastRunSummary?: AnalyticsSyncSummary
}

export interface SchedulerConfig {
  enabled: boolean
  clients: Record<string, ClientScheduleConfig>
  checkIntervalMinutes: number
  analyticsSync: AnalyticsSyncConfig
}

export interface SchedulerLogEntry {
  id: string
  postId: string
  clientId: string
  clientName?: string
  platform: string
  caption?: string
  action: 'published' | 'failed' | 'skipped'
  message: string
  timestamp: string
}

const DEFAULT_ANALYTICS_SYNC: AnalyticsSyncConfig = {
  enabled: false,
  runAt: '23:30',
  includeMeta: true,
  includeGoogle: true,
}

function normalizeSchedulerConfig(config: Partial<SchedulerConfig> | null | undefined): SchedulerConfig {
  return {
    enabled: !!config?.enabled,
    clients: config?.clients || {},
    checkIntervalMinutes: config?.checkIntervalMinutes || 5,
    analyticsSync: {
      ...DEFAULT_ANALYTICS_SYNC,
      ...(config?.analyticsSync || {}),
    },
  }
}

export async function readSchedulerConfig(): Promise<SchedulerConfig> {
  try {
    const doc = await db.collection('settings').doc('scheduler').get()
    if (doc.exists) {
      return normalizeSchedulerConfig(doc.data() as any)
    }
  } catch (err) {
    console.error('Error reading scheduler config from Firestore:', err)
  }
  return normalizeSchedulerConfig(undefined)
}

export async function writeSchedulerConfig(config: SchedulerConfig) {
  try {
    await db.collection('settings').doc('scheduler').set(normalizeSchedulerConfig(config))
  } catch (err) {
    console.error('Error writing scheduler config to Firestore:', err)
  }
}

export async function readSchedulerLog(): Promise<SchedulerLogEntry[]> {
  try {
    const snap = await db.collection('schedulerLogs').orderBy('timestamp', 'desc').limit(500).get()
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }))
  } catch (err) {
    console.error('Error reading scheduler logs from Firestore:', err)
  }
  return []
}

export async function addSchedulerLog(entry: Omit<SchedulerLogEntry, 'id' | 'timestamp'>) {
  try {
    await db.collection('schedulerLogs').add({
      ...entry,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('Error adding scheduler log to Firestore:', err)
  }
}

export function getBucharestClockTime() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Bucharest',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())

  const hour = parts.find(part => part.type === 'hour')?.value || '00'
  const minute = parts.find(part => part.type === 'minute')?.value || '00'
  return `${hour}:${minute}`
}

export function getBucharestDateString() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Bucharest',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const year = parts.find(part => part.type === 'year')?.value || '1970'
  const month = parts.find(part => part.type === 'month')?.value || '01'
  const day = parts.find(part => part.type === 'day')?.value || '01'
  return `${year}-${month}-${day}`
}

export function isInPublishWindow(config: ClientScheduleConfig): boolean {
  const currentTime = getBucharestClockTime()
  const start = config.publishWindowStart || '09:00'
  const end = config.publishWindowEnd || '21:00'

  return currentTime >= start && currentTime <= end
}
