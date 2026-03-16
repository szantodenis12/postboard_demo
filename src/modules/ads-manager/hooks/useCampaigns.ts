import { useState, useEffect, useCallback } from 'react'
import type { Campaign, CampaignStatus, AdVariant, SpendEntry } from '../types'
import { API_ORIGIN } from '../../../core/config'

const API = API_ORIGIN || ''

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/campaigns`)
      const data = await res.json()
      setCampaigns(data.campaigns || [])
    } catch (err) {
      console.error('Failed to fetch campaigns:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCampaigns() }, [fetchCampaigns])

  const createCampaign = async (campaign: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt' | 'variants' | 'spendEntries'>) => {
    const res = await fetch(`${API}/api/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campaign),
    })
    const data = await res.json()
    if (data.campaign) {
      setCampaigns(prev => [data.campaign, ...prev])
    }
    return data.campaign as Campaign
  }

  const updateCampaign = async (id: string, updates: Partial<Campaign>) => {
    const res = await fetch(`${API}/api/campaigns/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    const data = await res.json()
    if (data.campaign) {
      setCampaigns(prev => prev.map(c => c.id === id ? data.campaign : c))
    }
    return data.campaign as Campaign
  }

  const deleteCampaign = async (id: string) => {
    await fetch(`${API}/api/campaigns/${id}`, { method: 'DELETE' })
    setCampaigns(prev => prev.filter(c => c.id !== id))
  }

  const updateStatus = async (id: string, status: CampaignStatus) => {
    return updateCampaign(id, { status })
  }

  // Variant operations
  const addVariant = async (campaignId: string, variant: Omit<AdVariant, 'id'>) => {
    const res = await fetch(`${API}/api/campaigns/${campaignId}/variants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(variant),
    })
    const data = await res.json()
    if (data.campaign) {
      setCampaigns(prev => prev.map(c => c.id === campaignId ? data.campaign : c))
    }
    return data.variant as AdVariant
  }

  const updateVariant = async (campaignId: string, variantId: string, updates: Partial<AdVariant>) => {
    const res = await fetch(`${API}/api/campaigns/${campaignId}/variants/${variantId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    const data = await res.json()
    if (data.campaign) {
      setCampaigns(prev => prev.map(c => c.id === campaignId ? data.campaign : c))
    }
  }

  const deleteVariant = async (campaignId: string, variantId: string) => {
    const res = await fetch(`${API}/api/campaigns/${campaignId}/variants/${variantId}`, {
      method: 'DELETE',
    })
    const data = await res.json()
    if (data.campaign) {
      setCampaigns(prev => prev.map(c => c.id === campaignId ? data.campaign : c))
    }
  }

  // Spend operations
  const addSpendEntry = async (campaignId: string, entry: Omit<SpendEntry, 'id'>) => {
    const res = await fetch(`${API}/api/campaigns/${campaignId}/spend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    })
    const data = await res.json()
    if (data.campaign) {
      setCampaigns(prev => prev.map(c => c.id === campaignId ? data.campaign : c))
    }
    return data.entry as SpendEntry
  }

  const deleteSpendEntry = async (campaignId: string, entryId: string) => {
    const res = await fetch(`${API}/api/campaigns/${campaignId}/spend/${entryId}`, {
      method: 'DELETE',
    })
    const data = await res.json()
    if (data.campaign) {
      setCampaigns(prev => prev.map(c => c.id === campaignId ? data.campaign : c))
    }
  }

  // Computed helpers
  const getCampaignsByClient = (clientId: string) =>
    campaigns.filter(c => c.clientId === clientId)

  const getTotalSpend = (campaign: Campaign) =>
    campaign.spendEntries.reduce((sum, e) => sum + e.amount, 0)

  const getBudgetUtilization = (campaign: Campaign) => {
    const spent = getTotalSpend(campaign)
    return campaign.budget > 0 ? Math.min((spent / campaign.budget) * 100, 100) : 0
  }

  // Meta Ads functionality
  const launchMetaCampaign = async (id: string) => {
    const res = await fetch(`${API}/api/ads/launch/${id}`, { method: 'POST' })
    const data = await res.json()
    if (!data.success) {
      throw new Error(data.error || 'Failed to launch campaign to Meta')
    }
    // Refresh campaigns to get the updated status and Meta ID
    await fetchCampaigns()
    return data
  }

  return {
    campaigns,
    loading,
    refresh: fetchCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    updateStatus,
    addVariant,
    updateVariant,
    deleteVariant,
    addSpendEntry,
    deleteSpendEntry,
    getCampaignsByClient,
    getTotalSpend,
    getBudgetUtilization,
    launchMetaCampaign,
  }
}
