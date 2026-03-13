import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const SCHEDULER_FILE = resolve(import.meta.dirname, '..', 'data', 'scheduler.json')
const SCHEDULER_LOG_FILE = resolve(import.meta.dirname, '..', 'data', 'scheduler-log.json')

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

export function readSchedulerConfig(): SchedulerConfig {
  try {
    if (existsSync(SCHEDULER_FILE)) {
      return normalizeSchedulerConfig(JSON.parse(readFileSync(SCHEDULER_FILE, 'utf-8')))
    }
  } catch { /* ignore */ }
  return normalizeSchedulerConfig(undefined)
}

export function writeSchedulerConfig(config: SchedulerConfig) {
  writeFileSync(SCHEDULER_FILE, JSON.stringify(normalizeSchedulerConfig(config), null, 2), 'utf-8')
}

export function readSchedulerLog(): SchedulerLogEntry[] {
  try {
    if (existsSync(SCHEDULER_LOG_FILE)) {
      return JSON.parse(readFileSync(SCHEDULER_LOG_FILE, 'utf-8'))
    }
  } catch { /* ignore */ }
  return []
}

export function writeSchedulerLog(log: SchedulerLogEntry[]) {
  const trimmed = log.slice(0, 500)
  writeFileSync(SCHEDULER_LOG_FILE, JSON.stringify(trimmed, null, 2), 'utf-8')
}

export function addSchedulerLog(entry: Omit<SchedulerLogEntry, 'id' | 'timestamp'>) {
  const log = readSchedulerLog()
  log.unshift({
    ...entry,
    id: `sl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
  })
  writeSchedulerLog(log)
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
