import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const CAMPAIGNS_FILE = resolve(import.meta.dirname, '..', 'data', 'campaigns.json')

// ── Types ──────────────────────────────────────────────

export interface Campaign {
  id: string
  clientId: string
  name: string
  objective: string
  platforms: string[]
  budget: number
  dailyBudget?: number
  startDate: string
  endDate: string
  status: string
  notes?: string
  createdAt: string
  updatedAt: string
  variants: AdVariant[]
  spendEntries: SpendEntry[]
}

export interface AdVariant {
  id: string
  label: string
  headline: string
  primaryText: string
  description?: string
  cta: string
  imageUrl?: string
  status: string
  metrics: {
    impressions: number
    clicks: number
    ctr: number
    cpc: number
    conversions: number
    spend: number
  }
}

export interface SpendEntry {
  id: string
  date: string
  amount: number
  platform: string
  notes?: string
}

// ── Persistence ────────────────────────────────────────

export function readCampaigns(): Campaign[] {
  try {
    if (existsSync(CAMPAIGNS_FILE)) {
      return JSON.parse(readFileSync(CAMPAIGNS_FILE, 'utf-8'))
    }
  } catch { /* ignore */ }
  return []
}

export function writeCampaigns(campaigns: Campaign[]) {
  writeFileSync(CAMPAIGNS_FILE, JSON.stringify(campaigns, null, 2), 'utf-8')
}

// ── Helpers ────────────────────────────────────────────

function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

// ── Route Handlers ─────────────────────────────────────

export function registerCampaignRoutes(app: any) {
  // List all campaigns (optional ?clientId filter)
  app.get('/api/campaigns', (req: any, res: any) => {
    let campaigns = readCampaigns()
    if (req.query.clientId) {
      campaigns = campaigns.filter((c: Campaign) => c.clientId === req.query.clientId)
    }
    campaigns.sort((a: Campaign, b: Campaign) => b.updatedAt.localeCompare(a.updatedAt))
    res.json({ campaigns })
  })

  // Get single campaign
  app.get('/api/campaigns/:id', (req: any, res: any) => {
    const campaigns = readCampaigns()
    const campaign = campaigns.find((c: Campaign) => c.id === req.params.id)
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' })
      return
    }
    res.json({ campaign })
  })

  // Create campaign
  app.post('/api/campaigns', (req: any, res: any) => {
    const { clientId, name, objective, platforms, budget, dailyBudget, startDate, endDate, status, notes } = req.body
    if (!clientId || !name || !objective) {
      res.status(400).json({ error: 'Missing clientId, name, or objective' })
      return
    }
    const now = new Date().toISOString()
    const campaign: Campaign = {
      id: genId('camp'),
      clientId,
      name,
      objective: objective || 'awareness',
      platforms: platforms || ['facebook'],
      budget: budget || 0,
      dailyBudget: dailyBudget || undefined,
      startDate: startDate || new Date().toISOString().slice(0, 10),
      endDate: endDate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      status: status || 'planning',
      notes: notes || undefined,
      createdAt: now,
      updatedAt: now,
      variants: [],
      spendEntries: [],
    }
    const campaigns = readCampaigns()
    campaigns.push(campaign)
    writeCampaigns(campaigns)
    res.json({ success: true, campaign })
  })

  // Update campaign
  app.put('/api/campaigns/:id', (req: any, res: any) => {
    const campaigns = readCampaigns()
    const idx = campaigns.findIndex((c: Campaign) => c.id === req.params.id)
    if (idx === -1) {
      res.status(404).json({ error: 'Campaign not found' })
      return
    }
    const updates = req.body
    // Merge, preserving arrays that shouldn't be overwritten by partial updates
    const campaign = { ...campaigns[idx], ...updates, updatedAt: new Date().toISOString() }
    // Don't let updates overwrite variants/spendEntries unless explicitly sent
    if (!updates.variants) campaign.variants = campaigns[idx].variants
    if (!updates.spendEntries) campaign.spendEntries = campaigns[idx].spendEntries
    campaigns[idx] = campaign
    writeCampaigns(campaigns)
    res.json({ success: true, campaign })
  })

  // Delete campaign
  app.delete('/api/campaigns/:id', (req: any, res: any) => {
    const campaigns = readCampaigns().filter((c: Campaign) => c.id !== req.params.id)
    writeCampaigns(campaigns)
    res.json({ success: true })
  })

  // ── Variant Routes ──────────────────────────────────

  // Add variant to campaign
  app.post('/api/campaigns/:id/variants', (req: any, res: any) => {
    const campaigns = readCampaigns()
    const campaign = campaigns.find((c: Campaign) => c.id === req.params.id)
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' })
      return
    }
    const { label, headline, primaryText, description, cta, imageUrl, status } = req.body
    const variant: AdVariant = {
      id: genId('var'),
      label: label || String.fromCharCode(65 + campaign.variants.length), // A, B, C...
      headline: headline || '',
      primaryText: primaryText || '',
      description,
      cta: cta || '',
      imageUrl,
      status: status || 'draft',
      metrics: { impressions: 0, clicks: 0, ctr: 0, cpc: 0, conversions: 0, spend: 0 },
    }
    campaign.variants.push(variant)
    campaign.updatedAt = new Date().toISOString()
    writeCampaigns(campaigns)
    res.json({ success: true, variant, campaign })
  })

  // Update variant
  app.put('/api/campaigns/:id/variants/:variantId', (req: any, res: any) => {
    const campaigns = readCampaigns()
    const campaign = campaigns.find((c: Campaign) => c.id === req.params.id)
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' })
      return
    }
    const variantIdx = campaign.variants.findIndex((v: AdVariant) => v.id === req.params.variantId)
    if (variantIdx === -1) {
      res.status(404).json({ error: 'Variant not found' })
      return
    }
    campaign.variants[variantIdx] = { ...campaign.variants[variantIdx], ...req.body }
    campaign.updatedAt = new Date().toISOString()
    writeCampaigns(campaigns)
    res.json({ success: true, variant: campaign.variants[variantIdx], campaign })
  })

  // Delete variant
  app.delete('/api/campaigns/:id/variants/:variantId', (req: any, res: any) => {
    const campaigns = readCampaigns()
    const campaign = campaigns.find((c: Campaign) => c.id === req.params.id)
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' })
      return
    }
    campaign.variants = campaign.variants.filter((v: AdVariant) => v.id !== req.params.variantId)
    campaign.updatedAt = new Date().toISOString()
    writeCampaigns(campaigns)
    res.json({ success: true, campaign })
  })

  // ── Spend Entry Routes ──────────────────────────────

  // Add spend entry
  app.post('/api/campaigns/:id/spend', (req: any, res: any) => {
    const campaigns = readCampaigns()
    const campaign = campaigns.find((c: Campaign) => c.id === req.params.id)
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' })
      return
    }
    const { date, amount, platform, notes } = req.body
    if (!date || amount === undefined) {
      res.status(400).json({ error: 'Missing date or amount' })
      return
    }
    const entry: SpendEntry = {
      id: genId('sp'),
      date,
      amount: Number(amount),
      platform: platform || campaign.platforms[0] || 'facebook',
      notes,
    }
    campaign.spendEntries.push(entry)
    campaign.updatedAt = new Date().toISOString()
    writeCampaigns(campaigns)
    res.json({ success: true, entry, campaign })
  })

  // Delete spend entry
  app.delete('/api/campaigns/:id/spend/:entryId', (req: any, res: any) => {
    const campaigns = readCampaigns()
    const campaign = campaigns.find((c: Campaign) => c.id === req.params.id)
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' })
      return
    }
    campaign.spendEntries = campaign.spendEntries.filter((e: SpendEntry) => e.id !== req.params.entryId)
    campaign.updatedAt = new Date().toISOString()
    writeCampaigns(campaigns)
    res.json({ success: true, campaign })
  })

  // ── Bulk metrics update (for variant A/B tracking) ──

  app.put('/api/campaigns/:id/variants/:variantId/metrics', (req: any, res: any) => {
    const campaigns = readCampaigns()
    const campaign = campaigns.find((c: Campaign) => c.id === req.params.id)
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' })
      return
    }
    const variant = campaign.variants.find((v: AdVariant) => v.id === req.params.variantId)
    if (!variant) {
      res.status(404).json({ error: 'Variant not found' })
      return
    }
    const { impressions, clicks, ctr, cpc, conversions, spend } = req.body
    variant.metrics = {
      impressions: impressions ?? variant.metrics.impressions,
      clicks: clicks ?? variant.metrics.clicks,
      ctr: ctr ?? variant.metrics.ctr,
      cpc: cpc ?? variant.metrics.cpc,
      conversions: conversions ?? variant.metrics.conversions,
      spend: spend ?? variant.metrics.spend,
    }
    campaign.updatedAt = new Date().toISOString()
    writeCampaigns(campaigns)
    res.json({ success: true, variant, campaign })
  })
}
