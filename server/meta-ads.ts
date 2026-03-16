
import { readConnections } from './meta.js'

// ── Types ──────────────────────────────────────────────

export interface AdAccount {
  id: string             // act_XXXXXXXXX
  name: string
  accountId: string      // numeric ID
  currency: string
  accountStatus: number  // 1=active, 2=disabled, 3=unsettled
  amountSpent: string    // lifetime spend in cents
  balance: string
}

export interface MetaCampaign {
  id: string
  name: string
  objective: string
  status: string         // ACTIVE, PAUSED, DELETED, ARCHIVED
  dailyBudget?: string   // in cents
  lifetimeBudget?: string
  startTime?: string
  stopTime?: string
  createdTime: string
  updatedTime: string
}

export interface MetaAdSet {
  id: string
  name: string
  campaignId: string
  status: string
  dailyBudget?: string
  lifetimeBudget?: string
  targeting?: any
  startTime?: string
  endTime?: string
}

export interface MetaAd {
  id: string
  name: string
  adsetId: string
  campaignId: string
  status: string
  creative?: {
    title?: string
    body?: string
    linkDescription?: string
    callToActionType?: string
    imageUrl?: string
    thumbnailUrl?: string
  }
}

export interface MetaInsights {
  impressions: number
  reach: number
  clicks: number
  ctr: number
  cpc: number
  cpm: number
  spend: number
  conversions: number
  actions?: any[]
  dateStart: string
  dateStop: string
}

export interface CampaignWithInsights {
  campaign: MetaCampaign
  adSets: MetaAdSet[]
  ads: (MetaAd & { insights?: MetaInsights })[]
  insights?: MetaInsights
}

export interface AdAccountSync {
  adAccountId: string
  adAccountName: string
  clientId: string
  lastSynced?: string
  campaigns: CampaignWithInsights[]
}

import { db } from './firebase.js'

// ── Persistence (MIGRATED TO FIRESTORE) ────────────────

// Maps clientId → adAccountId
export async function readAdAccountMapping(): Promise<Record<string, string>> {
  const doc = await db.collection('settings').doc('adAccountMapping').get()
  return doc.exists ? (doc.data() as Record<string, string>) : {}
}

export async function writeAdAccountMapping(mapping: Record<string, string>): Promise<void> {
  await db.collection('settings').doc('adAccountMapping').set(mapping)
}

export async function readAdDataForClient(clientId: string): Promise<AdAccountSync | null> {
  const doc = await db.collection('adData').doc(clientId).get()
  return doc.exists ? (doc.data() as AdAccountSync) : null
}

export async function writeAdDataForClient(clientId: string, data: AdAccountSync): Promise<void> {
  await db.collection('adData').doc(clientId).set(data)
}

// ── Graph API Helpers ──────────────────────────────────

async function graphGet(path: string, token: string, params: Record<string, string> = {}): Promise<any> {
  const url = new URL(`https://graph.facebook.com/v21.0${path}`)
  url.searchParams.set('access_token', token)
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v)
  }
  const res: any = await fetch(url.toString())
  const data: any = await res.json()
  if (data.error) {
    throw new Error(`Meta Ads API: ${data.error.message} (code ${data.error.code})`)
  }
  return data
}

// Paginate through all results
async function graphGetAll(path: string, token: string, params: Record<string, string> = {}): Promise<any[]> {
  const results: any[] = []
  let url: string | null = null

  // Build initial URL
  const initial = new URL(`https://graph.facebook.com/v21.0${path}`)
  initial.searchParams.set('access_token', token)
  initial.searchParams.set('limit', '100')
  for (const [k, v] of Object.entries(params)) {
    initial.searchParams.set(k, v)
  }
  url = initial.toString()

  while (url) {
    const response: any = await fetch(url)
    const json: any = await response.json()
    if (json.error) {
      throw new Error(`Meta Ads API: ${json.error.message}`)
    }
    results.push(...(json.data || []))
    url = json.paging?.next || null
  }
  return results
}

// ── API Functions ──────────────────────────────────────

export async function fetchAdAccounts(userToken: string): Promise<AdAccount[]> {
  const raw = await graphGetAll('/me/adaccounts', userToken, {
    fields: 'id,name,account_id,currency,account_status,amount_spent,balance',
  })
  return raw.map((a: any) => ({
    id: a.id,
    name: a.name,
    accountId: a.account_id,
    currency: a.currency,
    accountStatus: a.account_status,
    amountSpent: a.amount_spent,
    balance: a.balance,
  }))
}

export async function fetchCampaigns(adAccountId: string, userToken: string): Promise<MetaCampaign[]> {
  const raw = await graphGetAll(`/${adAccountId}/campaigns`, userToken, {
    fields: 'id,name,objective,status,daily_budget,lifetime_budget,start_time,stop_time,created_time,updated_time',
    // Get active + paused + recently completed (last 90 days)
    filtering: JSON.stringify([{ field: 'effective_status', operator: 'IN', value: ['ACTIVE', 'PAUSED', 'CAMPAIGN_PAUSED', 'ADSET_PAUSED'] }]),
  })

  // Also fetch recently completed campaigns
  let archivedRaw: any[] = []
  try {
    archivedRaw = await graphGetAll(`/${adAccountId}/campaigns`, userToken, {
      fields: 'id,name,objective,status,daily_budget,lifetime_budget,start_time,stop_time,created_time,updated_time',
      filtering: JSON.stringify([{ field: 'effective_status', operator: 'IN', value: ['ARCHIVED'] }]),
      limit: '20',
    })
  } catch { /* archived may fail, that's ok */ }

  const all = [...raw, ...archivedRaw]
  return all.map((c: any) => ({
    id: c.id,
    name: c.name,
    objective: c.objective?.toLowerCase() || 'unknown',
    status: c.status,
    dailyBudget: c.daily_budget,
    lifetimeBudget: c.lifetime_budget,
    startTime: c.start_time,
    stopTime: c.stop_time,
    createdTime: c.created_time,
    updatedTime: c.updated_time,
  }))
}

export async function fetchAdSets(campaignId: string, userToken: string): Promise<MetaAdSet[]> {
  const raw = await graphGetAll(`/${campaignId}/adsets`, userToken, {
    fields: 'id,name,campaign_id,status,daily_budget,lifetime_budget,start_time,end_time',
  })
  return raw.map((s: any) => ({
    id: s.id,
    name: s.name,
    campaignId: s.campaign_id,
    status: s.status,
    dailyBudget: s.daily_budget,
    lifetimeBudget: s.lifetime_budget,
    startTime: s.start_time,
    endTime: s.end_time,
  }))
}

export async function fetchAds(adSetId: string, userToken: string): Promise<MetaAd[]> {
  const raw = await graphGetAll(`/${adSetId}/ads`, userToken, {
    fields: 'id,name,adset_id,campaign_id,status,creative{title,body,link_description,call_to_action_type,image_url,thumbnail_url}',
  })
  return raw.map((a: any) => ({
    id: a.id,
    name: a.name,
    adsetId: a.adset_id,
    campaignId: a.campaign_id,
    status: a.status,
    creative: a.creative ? {
      title: a.creative.title,
      body: a.creative.body,
      linkDescription: a.creative.link_description,
      callToActionType: a.creative.call_to_action_type,
      imageUrl: a.creative.image_url,
      thumbnailUrl: a.creative.thumbnail_url,
    } : undefined,
  }))
}

export async function fetchInsights(
  objectId: string,
  userToken: string,
  datePreset: string = 'last_30d',
): Promise<MetaInsights | null> {
  try {
    const data = await graphGet(`/${objectId}/insights`, userToken, {
      fields: 'impressions,reach,clicks,ctr,cpc,cpm,spend,actions',
      date_preset: datePreset,
    })
    const row = data.data?.[0]
    if (!row) return null

    // Extract conversions from actions
    const conversions = (row.actions || [])
      .filter((a: any) => ['offsite_conversion', 'lead', 'purchase', 'complete_registration'].includes(a.action_type))
      .reduce((sum: number, a: any) => sum + Number(a.value || 0), 0)

    return {
      impressions: Number(row.impressions || 0),
      reach: Number(row.reach || 0),
      clicks: Number(row.clicks || 0),
      ctr: Number(row.ctr || 0),
      cpc: Number(row.cpc || 0),
      cpm: Number(row.cpm || 0),
      spend: Number(row.spend || 0),
      conversions,
      actions: row.actions,
      dateStart: row.date_start,
      dateStop: row.date_stop,
    }
  } catch {
    return null
  }
}

// ── Campaign Creation (LAUNCH) ────────────────────────

export async function createMetaCampaign(
  adAccountId: string,
  userToken: string,
  params: {
    name: string
    objective: string
    status?: 'PAUSED' | 'ACTIVE'
    dailyBudget?: number
    totalBudget?: number
  }
): Promise<{ id: string }> {
  // Map our internal objectives to Meta ODAX objectives
  const objectiveMap: Record<string, string> = {
    awareness: 'OUTCOME_AWARENESS',
    traffic: 'OUTCOME_TRAFFIC',
    engagement: 'OUTCOME_ENGAGEMENT',
    leads: 'OUTCOME_LEADS',
    sales: 'OUTCOME_SALES',
    conversions: 'OUTCOME_SALES', // Most common mapping for general conversions
  }

  const payload: any = {
    name: params.name,
    objective: objectiveMap[params.objective] || 'OUTCOME_TRAFFIC',
    status: params.status || 'PAUSED',
    special_ad_categories: '[]', // Required field
  }

  // Budgets are in cents in Meta API
  if (params.dailyBudget) {
    payload.daily_budget = Math.round(params.dailyBudget * 100)
  } else if (params.totalBudget) {
    payload.lifetime_budget = Math.round(params.totalBudget * 100)
  }

  const data = await graphPost(`/${adAccountId}/campaigns`, userToken, payload)
  return { id: data.id }
}

async function graphPost(path: string, token: string, payload: Record<string, any>): Promise<any> {
  const url = new URL(`https://graph.facebook.com/v21.0${path}`)
  url.searchParams.set('access_token', token)

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await res.json()
  if (data.error) {
    throw new Error(`Meta Ads API Error: ${data.error.message} (code ${data.error.code})`)
  }
  return data
}

// ── Full Sync ──────────────────────────────────────────

export async function syncAdAccount(
  adAccountId: string,
  clientId: string,
  userToken: string,
): Promise<AdAccountSync> {
  // 1. Fetch campaigns
  const campaigns = await fetchCampaigns(adAccountId, userToken)

  // 2. For each campaign, fetch ad sets, ads, and insights
  const campaignsWithData: CampaignWithInsights[] = []

  for (const campaign of campaigns) {
    // Campaign-level insights
    const campaignInsights = await fetchInsights(campaign.id, userToken)

    // Fetch ad sets
    const adSets = await fetchAdSets(campaign.id, userToken)

    // Fetch ads for each ad set (with insights)
    const allAds: (MetaAd & { insights?: MetaInsights })[] = []
    for (const adSet of adSets) {
      const ads = await fetchAds(adSet.id, userToken)
      for (const ad of ads) {
        const adInsights = await fetchInsights(ad.id, userToken)
        allAds.push({ ...ad, insights: adInsights || undefined })
      }
    }

    campaignsWithData.push({
      campaign,
      adSets,
      ads: allAds,
      insights: campaignInsights || undefined,
    })
  }

  // Get account name
  let adAccountName = adAccountId
  try {
    const acct = await graphGet(`/${adAccountId}`, userToken, { fields: 'name' })
    adAccountName = acct.name || adAccountId
  } catch { /* ignore */ }

  return {
    adAccountId,
    adAccountName,
    clientId,
    lastSynced: new Date().toISOString(),
    campaigns: campaignsWithData,
  }
}

// ── Convert Meta data to PostBoard Campaign format ─────

export function metaToPostboardCampaigns(sync: AdAccountSync): any[] {
  return sync.campaigns.map(c => {
    const budget = c.campaign.lifetimeBudget
      ? Number(c.campaign.lifetimeBudget) / 100
      : c.campaign.dailyBudget
        ? Number(c.campaign.dailyBudget) / 100 * 30
        : 0

    const dailyBudget = c.campaign.dailyBudget
      ? Number(c.campaign.dailyBudget) / 100
      : undefined

    // Map Meta objective to our objectives
    const objectiveMap: Record<string, string> = {
      outcome_awareness: 'awareness',
      outcome_traffic: 'traffic',
      outcome_engagement: 'engagement',
      outcome_leads: 'leads',
      outcome_sales: 'sales',
      outcome_app_promotion: 'conversions',
      brand_awareness: 'awareness',
      reach: 'awareness',
      link_clicks: 'traffic',
      post_engagement: 'engagement',
      lead_generation: 'leads',
      conversions: 'conversions',
      product_catalog_sales: 'sales',
      messages: 'leads',
      video_views: 'engagement',
      store_visits: 'traffic',
    }

    // Map Meta status to our status
    const statusMap: Record<string, string> = {
      ACTIVE: 'active',
      PAUSED: 'paused',
      CAMPAIGN_PAUSED: 'paused',
      ADSET_PAUSED: 'paused',
      ARCHIVED: 'completed',
      DELETED: 'completed',
    }

    // Build variants from ads
    const variants = c.ads.map((ad, i) => ({
      id: `meta_${ad.id}`,
      label: String.fromCharCode(65 + i),
      headline: ad.creative?.title || ad.name || '',
      primaryText: ad.creative?.body || '',
      description: ad.creative?.linkDescription || '',
      cta: ad.creative?.callToActionType?.replace(/_/g, ' ') || '',
      imageUrl: ad.creative?.imageUrl || ad.creative?.thumbnailUrl || '',
      status: ad.status === 'ACTIVE' ? 'active' : ad.status === 'PAUSED' ? 'draft' : 'draft',
      metrics: ad.insights ? {
        impressions: ad.insights.impressions,
        clicks: ad.insights.clicks,
        ctr: Number(ad.insights.ctr.toFixed(2)),
        cpc: Number(ad.insights.cpc.toFixed(2)),
        conversions: ad.insights.conversions,
        spend: ad.insights.spend,
      } : { impressions: 0, clicks: 0, ctr: 0, cpc: 0, conversions: 0, spend: 0 },
    }))

    // Build spend entries from campaign insights (single entry for the period)
    const spendEntries = c.insights?.spend ? [{
      id: `meta_spend_${c.campaign.id}`,
      date: c.insights.dateStop || new Date().toISOString().slice(0, 10),
      amount: c.insights.spend,
      platform: 'facebook' as const,
      notes: `Meta Ads — ${c.insights.dateStart} to ${c.insights.dateStop}`,
    }] : []

    return {
      id: `meta_${c.campaign.id}`,
      clientId: sync.clientId,
      name: c.campaign.name,
      objective: objectiveMap[c.campaign.objective] || 'traffic',
      platforms: ['facebook'],
      budget,
      dailyBudget,
      startDate: c.campaign.startTime?.slice(0, 10) || c.campaign.createdTime?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      endDate: c.campaign.stopTime?.slice(0, 10) || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      status: statusMap[c.campaign.status] || 'planning',
      notes: `Synced from Meta Ads (Campaign ID: ${c.campaign.id})`,
      createdAt: c.campaign.createdTime || new Date().toISOString(),
      updatedAt: sync.lastSynced || new Date().toISOString(),
      variants,
      spendEntries,
      _metaCampaignId: c.campaign.id,
      _metaInsights: c.insights,
    }
  })
}

// ── Route Registration ─────────────────────────────────

export function registerMetaAdsRoutes(app: any) {
  // List available ad accounts
  app.get('/api/ads/accounts', async (_req: any, res: any) => {
    const connections = readConnections()
    if (!connections.userAccessToken) {
      res.status(400).json({ error: 'Not connected to Meta. Connect in Settings first.' })
      return
    }
    try {
      const accounts = await fetchAdAccounts(connections.userAccessToken)
      res.json({ accounts })
    } catch (error: any) {
      console.error('Fetch ad accounts error:', error)
      res.status(500).json({ error: error.message || 'Failed to fetch ad accounts' })
    }
  })

  // Get ad account → client mapping
  app.get('/api/ads/mapping', async (_req: any, res: any) => {
    try {
      const mapping = await readAdAccountMapping()
      res.json(mapping)
    } catch (err) {
      res.status(500).json({ error: 'Failed to read mapping' })
    }
  })

  // Set ad account → client mapping
  app.put('/api/ads/mapping', async (req: any, res: any) => {
    try {
      let { clientId, adAccountId } = req.body
      
      // Attempt to extract ad account ID safely if an object was passed by accident in frontend
      if (adAccountId && typeof adAccountId === 'object' && adAccountId.id) {
        adAccountId = adAccountId.id
      }
      
      if (!clientId) {
        res.status(400).json({ error: 'Missing clientId' })
        return
      }
      const mapping = await readAdAccountMapping()
      if (adAccountId) {
        mapping[clientId] = adAccountId
      } else {
        delete mapping[clientId]
      }
      await writeAdAccountMapping(mapping)
      res.json({ success: true, mapping })
    } catch (err) {
      res.status(500).json({ error: 'Failed to update mapping' })
    }
  })

  // Sync ad data for a client
  app.post('/api/ads/sync/:clientId', async (req: any, res: any) => {
    try {
      const { clientId } = req.params
      const mapping = await readAdAccountMapping()
      const adAccountId = mapping[clientId]

      if (!adAccountId) {
        res.status(400).json({ error: 'No ad account mapped to this client. Go to Settings to map one.' })
        return
      }

      const connections = readConnections()
      if (!connections.userAccessToken) {
        res.status(400).json({ error: 'Not connected to Meta.' })
        return
      }

      const syncResult = await syncAdAccount(adAccountId, clientId, connections.userAccessToken)

      // Save raw sync data
      await writeAdDataForClient(clientId, syncResult)

      // Convert to PostBoard campaign format and merge with existing campaigns
      const { readCampaigns, writeCampaign } = await import('./campaigns.js')
      const existingCampaigns = await readCampaigns()
      const metaCampaigns = metaToPostboardCampaigns(syncResult)

      // Merge: update existing meta campaigns, add new ones, keep manual campaigns
      for (const metaCamp of metaCampaigns) {
        const existingIdx = existingCampaigns.findIndex((c: any) => c.id === metaCamp.id)
        if (existingIdx >= 0) {
          // Update existing — preserve any manual edits to notes
          const existing = existingCampaigns[existingIdx]
          const updatedCampaign = {
            ...metaCamp,
            notes: existing.notes?.includes('Synced from Meta')
              ? metaCamp.notes
              : existing.notes || metaCamp.notes,
          }
          await writeCampaign(updatedCampaign)
        } else {
          await writeCampaign(metaCamp)
        }
      }

      res.json({
        success: true,
        synced: metaCampaigns.length,
        adAccountName: syncResult.adAccountName,
        campaigns: metaCampaigns.map((c: any) => ({ id: c.id, name: c.name, status: c.status })),
      })
    } catch (error: any) {
      console.error('Ad sync error:', error)
      res.status(500).json({ error: error.message || 'Failed to sync ad data' })
    }
  })

  // Get cached ad data for a client
  app.get('/api/ads/data/:clientId', async (req: any, res: any) => {
    try {
      const data = await readAdDataForClient(req.params.clientId)
      if (!data) {
        res.json({ data: null, message: 'No ad data. Click "Sync from Meta" to pull campaigns.' })
        return
      }
      res.json({ data })
    } catch (err) {
      res.status(500).json({ error: 'Failed to read ad data' })
    }
  })

  // Sync all mapped clients at once
  app.post('/api/ads/sync-all', async (_req: any, res: any) => {
    try {
      const mapping = await readAdAccountMapping()
      const connections = readConnections()

      if (!connections.userAccessToken) {
        res.status(400).json({ error: 'Not connected to Meta.' })
        return
      }

      const results: any[] = []
      for (const [clientId, adAccountId] of Object.entries(mapping)) {
        try {
          const syncResult = await syncAdAccount(adAccountId, clientId, connections.userAccessToken)
          await writeAdDataForClient(clientId, syncResult)

          const { readCampaigns, writeCampaign } = await import('./campaigns.js')
          const existing = await readCampaigns()
          const metaCampaigns = metaToPostboardCampaigns(syncResult)

          for (const mc of metaCampaigns) {
            const idx = existing.findIndex((c: any) => c.id === mc.id)
            if (idx >= 0) {
              await writeCampaign({ ...existing[idx], ...mc })
            } else {
              await writeCampaign(mc)
            }
          }

          results.push({ clientId, success: true, synced: metaCampaigns.length })
        } catch (error: any) {
          results.push({ clientId, success: false, error: error.message })
        }
      }

      res.json({ results })
    } catch (err) {
      res.status(500).json({ error: 'Failed to sync all' })
    }
  })

  // Launch a campaign to Meta
  app.post('/api/ads/launch/:id', async (req: any, res: any) => {
    try {
      const { id } = req.params
      const { readCampaigns, updateCampaignDoc } = await import('./campaigns.js')
      const campaigns = await readCampaigns()
      const campaign = campaigns.find(c => c.id === id)

      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' })
        return
      }

      if (campaign.status === 'active' && campaign._metaCampaignId) {
        res.status(400).json({ error: 'Campaign is already active on Meta' })
        return
      }

      const mapping = await readAdAccountMapping()
      const adAccountId = mapping[campaign.clientId]

      if (!adAccountId) {
        res.status(400).json({ error: 'No ad account mapped to this client. Go to Settings to map one.' })
        return
      }

      const connections = readConnections()
      if (!connections.userAccessToken) {
        res.status(400).json({ error: 'Not connected to Meta.' })
        return
      }

      // Create on Meta
      const result = await createMetaCampaign(adAccountId, connections.userAccessToken, {
        name: campaign.name,
        objective: campaign.objective,
        status: 'PAUSED', // Always launch as paused for safety
        dailyBudget: campaign.dailyBudget,
        totalBudget: campaign.budget,
      })

      // Update local campaign with Meta ID and status
      const now = new Date().toISOString()
      await updateCampaignDoc(id, {
        status: 'active', // Mark as active in our system once launched
        _metaCampaignId: result.id,
        notes: (campaign.notes || '') + `\nLaunched to Meta — Campaign Shell Created (Meta ID: ${result.id}) at ${now}`,
        updatedAt: now
      })

      res.json({ success: true, metaId: result.id })
    } catch (error: any) {
      console.error('Launch error:', error)
      res.status(500).json({ error: error.message || 'Failed to launch campaign' })
    }
  })
}
