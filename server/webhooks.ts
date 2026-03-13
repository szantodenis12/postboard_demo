import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const WEBHOOKS_FILE = resolve(import.meta.dirname, '..', 'data', 'webhooks.json')
const WEBHOOK_LOG_FILE = resolve(import.meta.dirname, '..', 'data', 'webhook-log.json')

export type WebhookEvent =
  | 'post.status_changed'
  | 'post.published'
  | 'post.approved'
  | 'post.scheduled'
  | 'feedback.received'
  | 'review.created'
  | 'report.generated'

export const WEBHOOK_EVENTS: { value: WebhookEvent; label: string }[] = [
  { value: 'post.status_changed', label: 'Post Status Changed' },
  { value: 'post.published', label: 'Post Published' },
  { value: 'post.approved', label: 'Post Approved' },
  { value: 'post.scheduled', label: 'Post Scheduled' },
  { value: 'feedback.received', label: 'Client Feedback Received' },
  { value: 'review.created', label: 'Review Link Created' },
  { value: 'report.generated', label: 'Report Generated' },
]

export interface Webhook {
  id: string
  name: string
  url: string
  events: WebhookEvent[]
  enabled: boolean
  secret?: string
  createdAt: string
  lastTriggered?: string
}

export interface WebhookLogEntry {
  id: string
  webhookId: string
  webhookName: string
  event: WebhookEvent
  payload: any
  status: number | null
  success: boolean
  error?: string
  timestamp: string
}

export function readWebhooks(): Webhook[] {
  try {
    if (existsSync(WEBHOOKS_FILE)) {
      return JSON.parse(readFileSync(WEBHOOKS_FILE, 'utf-8'))
    }
  } catch { /* ignore */ }
  return []
}

export function writeWebhooks(webhooks: Webhook[]) {
  writeFileSync(WEBHOOKS_FILE, JSON.stringify(webhooks, null, 2), 'utf-8')
}

export function readWebhookLog(): WebhookLogEntry[] {
  try {
    if (existsSync(WEBHOOK_LOG_FILE)) {
      return JSON.parse(readFileSync(WEBHOOK_LOG_FILE, 'utf-8'))
    }
  } catch { /* ignore */ }
  return []
}

export function writeWebhookLog(log: WebhookLogEntry[]) {
  const trimmed = log.slice(0, 200)
  writeFileSync(WEBHOOK_LOG_FILE, JSON.stringify(trimmed, null, 2), 'utf-8')
}

export async function triggerWebhooks(event: WebhookEvent, payload: any) {
  const webhooks = readWebhooks().filter(w => w.enabled && w.events.includes(event))
  if (webhooks.length === 0) return

  const log = readWebhookLog()

  for (const webhook of webhooks) {
    const logEntry: WebhookLogEntry = {
      id: `wl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      webhookId: webhook.id,
      webhookName: webhook.name,
      event,
      payload,
      status: null,
      success: false,
      timestamp: new Date().toISOString(),
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-PostBoard-Event': event,
      }
      if (webhook.secret) {
        headers['X-Webhook-Secret'] = webhook.secret
      }

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)

      const res = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          event,
          timestamp: logEntry.timestamp,
          data: payload,
        }),
        signal: controller.signal,
      })
      clearTimeout(timeout)

      logEntry.status = res.status
      logEntry.success = res.ok
      if (!res.ok) {
        logEntry.error = `HTTP ${res.status}`
      }
    } catch (err: any) {
      logEntry.error = err.message || 'Request failed'
    }

    log.unshift(logEntry)

    // Update lastTriggered
    const allWebhooks = readWebhooks()
    const wh = allWebhooks.find(w => w.id === webhook.id)
    if (wh) {
      wh.lastTriggered = logEntry.timestamp
      writeWebhooks(allWebhooks)
    }
  }

  writeWebhookLog(log)
}
