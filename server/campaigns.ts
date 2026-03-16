import { db } from './firebase.js'

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
  _metaCampaignId?: string
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

// ── Persistence (MIGRATED TO FIRESTORE) ────────────────

export async function readCampaigns(): Promise<Campaign[]> {
  const snapshot = await db.collection('campaigns').get()
  return snapshot.docs.map(doc => doc.data() as Campaign)
}

export async function writeCampaign(campaign: Campaign): Promise<void> {
  await db.collection('campaigns').doc(campaign.id).set(campaign)
}

export async function updateCampaignDoc(id: string, updates: Partial<Campaign>): Promise<void> {
  await db.collection('campaigns').doc(id).update(updates)
}

export async function deleteCampaignDoc(id: string): Promise<void> {
  await db.collection('campaigns').doc(id).delete()
}

// ── Helpers ────────────────────────────────────────────

function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

// ── Route Handlers (Async Firestore logic) ─────────────

export function registerCampaignRoutes(app: any) {
  // List all campaigns (optional ?clientId filter)
  app.get('/api/campaigns', async (req: any, res: any) => {
    try {
      let campaigns = await readCampaigns()
      if (req.query.clientId) {
        campaigns = campaigns.filter((c: Campaign) => c.clientId === req.query.clientId)
      }
      campaigns.sort((a: Campaign, b: Campaign) => b.updatedAt.localeCompare(a.updatedAt))
      res.json({ campaigns })
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch campaigns' })
    }
  })

  // Get single campaign
  app.get('/api/campaigns/:id', async (req: any, res: any) => {
    try {
      const doc = await db.collection('campaigns').doc(req.params.id).get()
      if (!doc.exists) {
        res.status(404).json({ error: 'Campaign not found' })
        return
      }
      res.json({ campaign: doc.data() })
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch campaign' })
    }
  })

  // Create campaign
  app.post('/api/campaigns', async (req: any, res: any) => {
    try {
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
      
      await writeCampaign(campaign)
      res.json({ success: true, campaign })
    } catch (err) {
      res.status(500).json({ error: 'Failed to create campaign' })
    }
  })

  // Update campaign
  app.put('/api/campaigns/:id', async (req: any, res: any) => {
    try {
      const docRef = db.collection('campaigns').doc(req.params.id)
      const doc = await docRef.get()
      if (!doc.exists) {
        res.status(404).json({ error: 'Campaign not found' })
        return
      }
      
      const existing = doc.data() as Campaign
      const updates = req.body
      
      const campaign = { ...existing, ...updates, updatedAt: new Date().toISOString() }
      // Preserve arrays from accidental overwrites
      if (!updates.variants) campaign.variants = existing.variants
      if (!updates.spendEntries) campaign.spendEntries = existing.spendEntries
      
      await writeCampaign(campaign)
      res.json({ success: true, campaign })
    } catch (err) {
      res.status(500).json({ error: 'Failed to update campaign' })
    }
  })

  // Delete campaign
  app.delete('/api/campaigns/:id', async (req: any, res: any) => {
    try {
      await deleteCampaignDoc(req.params.id)
      res.json({ success: true })
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete campaign' })
    }
  })

  // ── Variant Routes ──────────────────────────────────

  // Add variant to campaign
  app.post('/api/campaigns/:id/variants', async (req: any, res: any) => {
    try {
      const docRef = db.collection('campaigns').doc(req.params.id)
      const doc = await docRef.get()
      if (!doc.exists) {
        res.status(404).json({ error: 'Campaign not found' })
        return
      }
      const campaign = doc.data() as Campaign
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
      
      await writeCampaign(campaign)
      res.json({ success: true, variant, campaign })
    } catch (err) {
      res.status(500).json({ error: 'Failed to add variant' })
    }
  })

  // Update variant
  app.put('/api/campaigns/:id/variants/:variantId', async (req: any, res: any) => {
    try {
      const docRef = db.collection('campaigns').doc(req.params.id)
      const doc = await docRef.get()
      if (!doc.exists) {
        res.status(404).json({ error: 'Campaign not found' })
        return
      }
      const campaign = doc.data() as Campaign
      const variantIdx = campaign.variants.findIndex((v: AdVariant) => v.id === req.params.variantId)
      if (variantIdx === -1) {
        res.status(404).json({ error: 'Variant not found' })
        return
      }
      
      campaign.variants[variantIdx] = { ...campaign.variants[variantIdx], ...req.body }
      campaign.updatedAt = new Date().toISOString()
      
      await writeCampaign(campaign)
      res.json({ success: true, variant: campaign.variants[variantIdx], campaign })
    } catch (err) {
      res.status(500).json({ error: 'Failed to update variant' })
    }
  })

  // Delete variant
  app.delete('/api/campaigns/:id/variants/:variantId', async (req: any, res: any) => {
    try {
      const docRef = db.collection('campaigns').doc(req.params.id)
      const doc = await docRef.get()
      if (!doc.exists) {
        res.status(404).json({ error: 'Campaign not found' })
        return
      }
      const campaign = doc.data() as Campaign
      campaign.variants = campaign.variants.filter((v: AdVariant) => v.id !== req.params.variantId)
      campaign.updatedAt = new Date().toISOString()
      
      await writeCampaign(campaign)
      res.json({ success: true, campaign })
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete variant' })
    }
  })

  // ── Spend Entry Routes ──────────────────────────────

  // Add spend entry
  app.post('/api/campaigns/:id/spend', async (req: any, res: any) => {
    try {
      const docRef = db.collection('campaigns').doc(req.params.id)
      const doc = await docRef.get()
      if (!doc.exists) {
        res.status(404).json({ error: 'Campaign not found' })
        return
      }
      const campaign = doc.data() as Campaign
      
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
      
      await writeCampaign(campaign)
      res.json({ success: true, entry, campaign })
    } catch (err) {
      res.status(500).json({ error: 'Failed to add spend entry' })
    }
  })

  // Delete spend entry
  app.delete('/api/campaigns/:id/spend/:entryId', async (req: any, res: any) => {
    try {
      const docRef = db.collection('campaigns').doc(req.params.id)
      const doc = await docRef.get()
      if (!doc.exists) {
        res.status(404).json({ error: 'Campaign not found' })
        return
      }
      const campaign = doc.data() as Campaign
      campaign.spendEntries = campaign.spendEntries.filter((e: SpendEntry) => e.id !== req.params.entryId)
      campaign.updatedAt = new Date().toISOString()
      
      await writeCampaign(campaign)
      res.json({ success: true, campaign })
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete spend entry' })
    }
  })

  // ── Bulk metrics update (for variant A/B tracking) ──

  app.put('/api/campaigns/:id/variants/:variantId/metrics', async (req: any, res: any) => {
    try {
      const docRef = db.collection('campaigns').doc(req.params.id)
      const doc = await docRef.get()
      if (!doc.exists) {
        res.status(404).json({ error: 'Campaign not found' })
        return
      }
      const campaign = doc.data() as Campaign
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
      
      await writeCampaign(campaign)
      res.json({ success: true, variant, campaign })
    } catch (err) {
      res.status(500).json({ error: 'Failed to update variant metrics' })
    }
  })
}
