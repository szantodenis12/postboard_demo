import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
const WEBHOOKS_FILE = resolve(import.meta.dirname, '..', 'data', 'webhooks.json');
const WEBHOOK_LOG_FILE = resolve(import.meta.dirname, '..', 'data', 'webhook-log.json');
export const WEBHOOK_EVENTS = [
    { value: 'post.status_changed', label: 'Post Status Changed' },
    { value: 'post.published', label: 'Post Published' },
    { value: 'post.approved', label: 'Post Approved' },
    { value: 'post.scheduled', label: 'Post Scheduled' },
    { value: 'feedback.received', label: 'Client Feedback Received' },
    { value: 'review.created', label: 'Review Link Created' },
    { value: 'review.reminder', label: 'Review Reminder Sent' },
    { value: 'report.generated', label: 'Report Generated' },
];
export function readWebhooks() {
    try {
        if (existsSync(WEBHOOKS_FILE)) {
            return JSON.parse(readFileSync(WEBHOOKS_FILE, 'utf-8'));
        }
    }
    catch { /* ignore */ }
    return [];
}
export function writeWebhooks(webhooks) {
    writeFileSync(WEBHOOKS_FILE, JSON.stringify(webhooks, null, 2), 'utf-8');
}
export function readWebhookLog() {
    try {
        if (existsSync(WEBHOOK_LOG_FILE)) {
            return JSON.parse(readFileSync(WEBHOOK_LOG_FILE, 'utf-8'));
        }
    }
    catch { /* ignore */ }
    return [];
}
export function writeWebhookLog(log) {
    const trimmed = log.slice(0, 200);
    writeFileSync(WEBHOOK_LOG_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');
}
export async function triggerWebhooks(event, payload) {
    const webhooks = readWebhooks().filter(w => w.enabled && w.events.includes(event));
    if (webhooks.length === 0)
        return;
    const log = readWebhookLog();
    for (const webhook of webhooks) {
        const logEntry = {
            id: `wl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
            webhookId: webhook.id,
            webhookName: webhook.name,
            event,
            payload,
            status: null,
            success: false,
            timestamp: new Date().toISOString(),
        };
        try {
            const headers = {
                'Content-Type': 'application/json',
                'X-PostBoard-Event': event,
            };
            if (webhook.secret) {
                headers['X-Webhook-Secret'] = webhook.secret;
            }
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);
            const res = await fetch(webhook.url, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    event,
                    timestamp: logEntry.timestamp,
                    data: payload,
                }),
                signal: controller.signal,
            });
            clearTimeout(timeout);
            logEntry.status = res.status;
            logEntry.success = res.ok;
            if (!res.ok) {
                logEntry.error = `HTTP ${res.status}`;
            }
        }
        catch (err) {
            logEntry.error = err.message || 'Request failed';
        }
        log.unshift(logEntry);
        // Update lastTriggered
        const allWebhooks = readWebhooks();
        const wh = allWebhooks.find(w => w.id === webhook.id);
        if (wh) {
            wh.lastTriggered = logEntry.timestamp;
            writeWebhooks(allWebhooks);
        }
    }
    writeWebhookLog(log);
}
