import { useState, useEffect, useCallback } from 'react'
import { API_ORIGIN } from '../../../core/config'

const API = API_ORIGIN || ''

interface AdAccount {
  id: string
  name: string
  accountId: string
  currency: string
  accountStatus: number
  amountSpent: string
  balance: string
}

export function useMetaAds() {
  const [accounts, setAccounts] = useState<AdAccount[]>([])
  const [mapping, setMappingState] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/ads/accounts`)
      if (res.ok) {
        const data = await res.json()
        setAccounts(data.accounts || [])
      }
    } catch {
      // Not connected or no permission — that's fine
    }
  }, [])

  const fetchMapping = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/ads/mapping`)
      if (res.ok) {
        const data = await res.json()
        setMappingState(data)
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    Promise.all([fetchAccounts(), fetchMapping()]).finally(() => setLoading(false))
  }, [fetchAccounts, fetchMapping])

  const setMapping = async (clientId: string, adAccountId: string | null) => {
    const res = await fetch(`${API}/api/ads/mapping`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, adAccountId }),
    })
    const data = await res.json()
    if (data.mapping) {
      setMappingState(data.mapping)
    }
  }

  return {
    accounts,
    mapping,
    loading,
    setMapping,
    refresh: () => Promise.all([fetchAccounts(), fetchMapping()]),
  }
}
