import { motion } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'
import {
  Plug, Unplug, Facebook, Instagram, Link2, CheckCircle2,
  AlertTriangle, Clock, Plus, Loader2, X, MapPin, Mail,
} from 'lucide-react'
import { useApp } from '../../../core/context'

// ── Google types ─────────────────────────────────────────
interface GoogleConnectionInfo {
  id: string
  label: string
  email?: string
  connectedAt: string
  locations: { name: string; locationName: string; address?: string }[]
}

interface GoogleStatus {
  configured: boolean
  connected: boolean
  loginUrl: string | null
  connections: GoogleConnectionInfo[]
  locations: { name: string; locationName: string; address?: string }[]
}

function useGoogle() {
  const [google, setGoogle] = useState<GoogleStatus>({
    configured: false, connected: false, loginUrl: null, connections: [], locations: [],
  })
  const [googleMapping, setGoogleMappingState] = useState<Record<string, string>>({})
  const [googleLocationErrors, setGoogleLocationErrors] = useState<Record<string, string>>({})
  const [refreshingConnectionId, setRefreshingConnectionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const [statusRes, mappingRes] = await Promise.all([
        fetch('/api/google/status'),
        fetch('/api/google/mapping'),
      ])
      if (statusRes.ok) setGoogle(await statusRes.json())
      if (mappingRes.ok) setGoogleMappingState(await mappingRes.json())
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const connect = useCallback(() => {
    if (google.loginUrl) window.location.href = google.loginUrl
  }, [google.loginUrl])

  const disconnect = useCallback(async (connectionId: string) => {
    await fetch('/api/google/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionId }),
    })
    await refresh()
  }, [refresh])

  const refreshLocations = useCallback(async (connectionId: string) => {
    setRefreshingConnectionId(connectionId)
    setGoogleLocationErrors(prev => {
      const next = { ...prev }
      delete next[connectionId]
      return next
    })
    try {
      const res = await fetch('/api/google/refresh-locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId }),
      })
      const json = await res.json()
      if (!res.ok) {
        setGoogleLocationErrors(prev => ({ ...prev, [connectionId]: json.error || 'Failed to load locations' }))
        return false
      }
      await refresh()
      if (!json.locations?.length) {
        setGoogleLocationErrors(prev => ({ ...prev, [connectionId]: 'Contul este conectat, dar Google nu a returnat nicio locație.' }))
      }
      return true
    } catch (err: any) {
      setGoogleLocationErrors(prev => ({ ...prev, [connectionId]: err.message || 'Failed to load locations' }))
      return false
    } finally {
      setRefreshingConnectionId(null)
    }
  }, [refresh])

  const setGoogleMapping = useCallback(async (clientId: string, locationName: string | null) => {
    setGoogleMappingState(prev => {
      const next = { ...prev }
      if (locationName) next[clientId] = locationName
      else delete next[clientId]
      return next
    })
    await fetch('/api/google/mapping', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, locationName }),
    })
  }, [])

  return {
    google,
    googleMapping,
    googleLocationErrors,
    refreshingConnectionId,
    loading,
    connect,
    disconnect,
    refresh,
    refreshLocations,
    setGoogleMapping,
  }
}

// ── Settings View ────────────────────────────────────────
export function SettingsView() {
  const {
    meta, data, pageMapping,
    connectMeta, disconnectMeta, setPageMapping, refreshMeta,
  } = useApp()
  const {
    google,
    googleMapping,
    googleLocationErrors,
    refreshingConnectionId,
    connect: connectGoogle,
    disconnect: disconnectGoogle,
    refreshLocations,
    setGoogleMapping,
  } = useGoogle()
  const clients = data.clients

  const mappedClients = clients.filter(c => pageMapping[c.id])
  const unmappedClients = clients.filter(c => !pageMapping[c.id])

  const [showAddPage, setShowAddPage] = useState(false)
  const [addPageId, setAddPageId] = useState('')
  const [addPageLoading, setAddPageLoading] = useState(false)
  const [addPageError, setAddPageError] = useState<string | null>(null)
  const [instagramOverrideDrafts, setInstagramOverrideDrafts] = useState<Record<string, string>>({})
  const [instagramOverrideErrors, setInstagramOverrideErrors] = useState<Record<string, string>>({})
  const [instagramOverrideLoadingPageId, setInstagramOverrideLoadingPageId] = useState<string | null>(null)
  const [openInstagramEditors, setOpenInstagramEditors] = useState<Record<string, boolean>>({})

  const handleAddPage = async () => {
    const id = addPageId.trim()
    if (!id) return
    setAddPageLoading(true)
    setAddPageError(null)
    try {
      const res = await fetch('/api/meta/add-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: id }),
      })
      const data = await res.json()
      if (data.success) {
        setAddPageId('')
        setShowAddPage(false)
        refreshMeta()
      } else {
        setAddPageError(data.error || 'Failed to add page')
      }
    } catch (err: any) {
      setAddPageError(err.message || 'Network error')
    } finally {
      setAddPageLoading(false)
    }
  }

  const toggleInstagramEditor = (pageId: string, defaultOpen: boolean) => {
    setOpenInstagramEditors(prev => ({
      ...prev,
      [pageId]: !(prev[pageId] ?? defaultOpen),
    }))
    setInstagramOverrideErrors(prev => {
      const next = { ...prev }
      delete next[pageId]
      return next
    })
  }

  const handleInstagramOverrideChange = (pageId: string, value: string) => {
    setInstagramOverrideDrafts(prev => ({ ...prev, [pageId]: value }))
    setInstagramOverrideErrors(prev => {
      const next = { ...prev }
      delete next[pageId]
      return next
    })
  }

  const handleSaveInstagramOverride = async (pageId: string) => {
    const instagramAccountId = (instagramOverrideDrafts[pageId] || '').trim()
    if (!instagramAccountId) {
      setInstagramOverrideErrors(prev => ({
        ...prev,
        [pageId]: 'Enter an Instagram Business Account ID or clear the override.',
      }))
      return
    }

    setInstagramOverrideLoadingPageId(pageId)
    setInstagramOverrideErrors(prev => {
      const next = { ...prev }
      delete next[pageId]
      return next
    })

    try {
      const res = await fetch('/api/meta/instagram-override', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, instagramAccountId }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setInstagramOverrideErrors(prev => ({
          ...prev,
          [pageId]: data.error || 'Failed to save Instagram override',
        }))
        return
      }
      setInstagramOverrideDrafts(prev => ({ ...prev, [pageId]: instagramAccountId }))
      await refreshMeta()
    } catch (err: any) {
      setInstagramOverrideErrors(prev => ({
        ...prev,
        [pageId]: err.message || 'Network error',
      }))
    } finally {
      setInstagramOverrideLoadingPageId(null)
    }
  }

  const handleClearInstagramOverride = async (pageId: string) => {
    setInstagramOverrideLoadingPageId(pageId)
    setInstagramOverrideErrors(prev => {
      const next = { ...prev }
      delete next[pageId]
      return next
    })

    try {
      const res = await fetch('/api/meta/instagram-override', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, instagramAccountId: null }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setInstagramOverrideErrors(prev => ({
          ...prev,
          [pageId]: data.error || 'Failed to clear Instagram override',
        }))
        return
      }
      setInstagramOverrideDrafts(prev => {
        const next = { ...prev }
        delete next[pageId]
        return next
      })
      await refreshMeta()
    } catch (err: any) {
      setInstagramOverrideErrors(prev => ({
        ...prev,
        [pageId]: err.message || 'Network error',
      }))
    } finally {
      setInstagramOverrideLoadingPageId(null)
    }
  }

  // All locations from all connections for the mapping dropdown
  const allLocations = google.locations || []

  return (
    <div className="h-full flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h2 className="text-2xl font-bold text-white">Settings</h2>
        <p className="text-sm text-white/30 mt-0.5">
          Manage connections and publishing configuration
        </p>
      </motion.div>

      <div className="flex-1 scroll-area pr-2 pb-6 space-y-6">
        {/* Meta Connection Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1877F2]/10 flex items-center justify-center">
                <Facebook size={20} className="text-[#1877F2]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Meta Business Suite</h3>
                <p className="text-xs text-white/35">Facebook & Instagram publishing</p>
              </div>
            </div>

            {meta.connected ? (
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-xs text-status-published font-medium">
                  <span className="w-2 h-2 rounded-full bg-status-published animate-pulse" />
                  Connected
                </span>
                <button
                  onClick={disconnectMeta}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-all"
                >
                  <Unplug size={13} />
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connectMeta}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#1877F2] hover:bg-[#1877F2]/90 transition-all hover:scale-105 active:scale-95"
              >
                <Plug size={15} />
                Connect Meta
              </button>
            )}
          </div>

          {/* Connected pages */}
          {meta.connected && meta.pages.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider text-white/25 font-medium">
                  Connected Pages ({meta.pages.length})
                </span>
                <button
                  onClick={() => setShowAddPage(!showAddPage)}
                  className="flex items-center gap-1 text-[10px] text-accent-cyan/60 hover:text-accent-cyan transition-colors"
                >
                  <Plus size={11} />
                  Add page by ID
                </button>
              </div>

              {/* Add page form */}
              {showAddPage && (
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-2">
                  <div className="text-[10px] text-white/30 mb-2">
                    Some pages don't appear automatically. Paste the Facebook Page ID to add it manually.
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={addPageId}
                      onChange={(e) => setAddPageId(e.target.value)}
                      placeholder="Page ID (e.g. 928304277198046)"
                      className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white/70 outline-none focus:border-accent-violet/40 transition-colors placeholder:text-white/20"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddPage()}
                    />
                    <button
                      onClick={handleAddPage}
                      disabled={addPageLoading || !addPageId.trim()}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white bg-accent-violet/80 hover:bg-accent-violet transition-all disabled:opacity-40"
                    >
                      {addPageLoading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                      Add
                    </button>
                    <button
                      onClick={() => { setShowAddPage(false); setAddPageError(null) }}
                      className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
                    >
                      <X size={12} className="text-white/30" />
                    </button>
                  </div>
                  {addPageError && (
                    <div className="text-[10px] text-red-400/80 mt-2">{addPageError}</div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {meta.pages.map(page => {
                  const editorOpen = openInstagramEditors[page.pageId] ?? (!!page.manualInstagramAccountId || !page.hasInstagram)
                  const overrideValue = instagramOverrideDrafts[page.pageId] ?? page.manualInstagramAccountId ?? ''

                  return (
                    <div
                      key={page.pageId}
                      className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                    >
                      <div className="flex items-start gap-3">
                        <Facebook size={14} className="text-[#1877F2]/60 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs text-white/60 truncate">{page.pageName}</div>
                          <div className="text-[10px] text-white/20 truncate">Page ID: {page.pageId}</div>
                        </div>

                        {page.hasInstagram ? (
                          <span className={`flex items-center gap-1 text-[10px] shrink-0 ${
                            page.instagramSource === 'manual' ? 'text-accent-cyan/80' : 'text-[#E4405F]/70'
                          }`}>
                            <Instagram size={11} />
                            {page.instagramSource === 'manual' ? 'IG Manual' : 'IG'}
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-300/70 shrink-0">No IG</span>
                        )}

                        <CheckCircle2 size={13} className="text-status-published/40 shrink-0 mt-0.5" />
                      </div>

                      <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-white/[0.05]">
                        <div className="text-[10px] text-white/25">
                          {page.manualInstagramAccountId
                            ? 'Manual Instagram override is active for this page.'
                            : page.detectedInstagramAccountId
                              ? 'Instagram account detected automatically from Meta.'
                              : 'No Instagram account was returned by Meta for this page.'}
                        </div>
                        <button
                          onClick={() => toggleInstagramEditor(page.pageId, !!page.manualInstagramAccountId || !page.hasInstagram)}
                          className="text-[10px] text-accent-cyan/70 hover:text-accent-cyan transition-colors shrink-0"
                        >
                          {editorOpen ? 'Hide IG ID' : 'Manual IG ID'}
                        </button>
                      </div>

                      {editorOpen && (
                        <div className="mt-3 space-y-2">
                          <div className="text-[10px] text-white/30 leading-relaxed">
                            Use this only when Meta does not return the Instagram Business Account ID correctly.
                          </div>

                          {page.detectedInstagramAccountId && (
                            <div className="text-[10px] text-white/25">
                              Meta detected: {page.detectedInstagramAccountId}
                            </div>
                          )}

                          {page.manualInstagramAccountId && (
                            <div className="text-[10px] text-accent-cyan/70">
                              Manual override: {page.manualInstagramAccountId}
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={overrideValue}
                              onChange={(e) => handleInstagramOverrideChange(page.pageId, e.target.value)}
                              placeholder="Instagram Business Account ID"
                              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white/70 outline-none focus:border-accent-cyan/40 transition-colors placeholder:text-white/20"
                            />
                            <button
                              onClick={() => handleSaveInstagramOverride(page.pageId)}
                              disabled={instagramOverrideLoadingPageId === page.pageId || !overrideValue.trim()}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white bg-accent-cyan/80 hover:bg-accent-cyan transition-all disabled:opacity-40"
                            >
                              {instagramOverrideLoadingPageId === page.pageId
                                ? <Loader2 size={12} className="animate-spin" />
                                : <CheckCircle2 size={12} />}
                              Save
                            </button>
                            {page.manualInstagramAccountId && (
                              <button
                                onClick={() => handleClearInstagramOverride(page.pageId)}
                                disabled={instagramOverrideLoadingPageId === page.pageId}
                                className="px-3 py-2 rounded-lg text-xs text-red-400/70 hover:text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-40"
                              >
                                Clear
                              </button>
                            )}
                          </div>

                          {instagramOverrideErrors[page.pageId] && (
                            <div className="text-[10px] text-red-400/80">{instagramOverrideErrors[page.pageId]}</div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {!meta.connected && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
              <AlertTriangle size={14} className="text-amber-500/60 shrink-0 mt-0.5" />
              <div className="text-xs text-white/40 leading-relaxed">
                Connect your Meta Business account to publish directly to Facebook and Instagram.
                You need admin access to the pages you want to publish to.
              </div>
            </div>
          )}
        </motion.div>

        {/* Google Business Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#4285F4]/10 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Google Business Profile</h3>
                <p className="text-xs text-white/35">Search performance & location insights</p>
              </div>
            </div>

            {google.configured && (
              <button
                onClick={connectGoogle}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#4285F4] hover:bg-[#4285F4]/90 transition-all hover:scale-105 active:scale-95"
              >
                <Plus size={15} />
                {google.connections.length > 0 ? 'Add Account' : 'Connect Google'}
              </button>
            )}
          </div>

          {/* Connected accounts */}
          {google.connections.length > 0 ? (
            <div className="space-y-4">
              {google.connections.map(conn => (
                <div key={conn.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  {/* Account header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 text-xs text-status-published font-medium">
                        <span className="w-2 h-2 rounded-full bg-status-published animate-pulse" />
                        Connected
                      </span>
                      {conn.email && (
                        <span className="flex items-center gap-1 text-xs text-white/40">
                          <Mail size={11} />
                          {conn.email}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => disconnectGoogle(conn.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-all"
                    >
                      <Unplug size={13} />
                      Disconnect
                    </button>
                  </div>

                  {/* Locations for this account */}
                  {conn.locations.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {conn.locations.map(loc => (
                        <div
                          key={loc.name}
                          className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.03]"
                        >
                          <MapPin size={13} className="text-[#4285F4]/60 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="text-xs text-white/60 truncate block">{loc.locationName}</span>
                            {loc.address && (
                              <span className="text-[10px] text-white/25 truncate block">{loc.address}</span>
                            )}
                          </div>
                          <CheckCircle2 size={12} className="text-status-published/40 shrink-0" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-white/25">No locations loaded yet.</span>
                        <button
                          onClick={() => refreshLocations(conn.id)}
                          disabled={refreshingConnectionId === conn.id}
                          className="text-xs text-[#4285F4] hover:text-[#4285F4]/80 transition-colors disabled:opacity-50"
                        >
                          {refreshingConnectionId === conn.id ? 'Fetching...' : 'Fetch Locations'}
                        </button>
                      </div>
                      {googleLocationErrors[conn.id] && (
                        <div className="text-[11px] text-amber-300/80 mt-2">
                          {googleLocationErrors[conn.id]}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : !google.configured ? (
            <span className="text-xs text-white/20">Not configured — add GOOGLE_CLIENT_ID to .env</span>
          ) : (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-[#4285F4]/5 border border-[#4285F4]/10">
              <AlertTriangle size={14} className="text-[#4285F4]/60 shrink-0 mt-0.5" />
              <div className="text-xs text-white/40 leading-relaxed">
                Connect your Google account to pull search performance, map views, calls, and direction requests.
                You can add multiple accounts if your locations are on separate Google emails.
              </div>
            </div>
          )}
        </motion.div>

        {/* Google Location Mapping */}
        {allLocations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#34A853]/10 flex items-center justify-center">
                <MapPin size={20} className="text-[#34A853]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Location Mapping</h3>
                <p className="text-xs text-white/35">Link each client to their Google Business location</p>
              </div>
            </div>

            <div className="space-y-2">
              {clients.map(client => (
                <div
                  key={client.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${
                    googleMapping[client.id]
                      ? 'bg-white/[0.02] border-white/[0.04]'
                      : 'bg-white/[0.01] border-white/[0.03] border-dashed'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${client.color}${googleMapping[client.id] ? '30' : '15'}, ${client.color}${googleMapping[client.id] ? '10' : '05'})`,
                      color: googleMapping[client.id] ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    {client.displayName.slice(0, 2).toUpperCase()}
                  </div>
                  <span className={`text-xs font-medium flex-1 ${googleMapping[client.id] ? 'text-white/60' : 'text-white/35'}`}>
                    {client.displayName}
                  </span>

                  <span className="text-[10px] text-white/15 mx-2">&rarr;</span>

                  <select
                    value={googleMapping[client.id] || ''}
                    onChange={(e) => setGoogleMapping(client.id, e.target.value || null)}
                    className={`border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[#4285F4]/40 transition-colors max-w-[250px] ${
                      googleMapping[client.id]
                        ? 'bg-white/[0.04] border-white/[0.08] text-white/60'
                        : 'bg-white/[0.03] border-white/[0.06] border-dashed text-white/30'
                    }`}
                  >
                    <option value="">{googleMapping[client.id] ? 'Unlink' : 'Select location...'}</option>
                    {google.connections.map(conn => (
                      <optgroup key={conn.id} label={conn.email || conn.label}>
                        {conn.locations.map(loc => (
                          <option key={loc.name} value={loc.name}>
                            {loc.locationName}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>

                  {googleMapping[client.id] && (
                    <CheckCircle2 size={14} className="text-status-published/50 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Page-to-Client Mapping */}
        {meta.connected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-accent-violet/10 flex items-center justify-center">
                <Link2 size={20} className="text-accent-violet" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Meta Page Mapping</h3>
                <p className="text-xs text-white/35">Link each client to their Facebook page for publishing</p>
              </div>
            </div>

            <div className="space-y-2">
              {mappedClients.map(client => {
                const page = meta.pages.find(p => p.pageId === pageMapping[client.id])
                return (
                  <div
                    key={client.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white/80 shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${client.color}30, ${client.color}10)`,
                      }}
                    >
                      {client.displayName.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-xs text-white/60 font-medium flex-1">{client.displayName}</span>

                    <span className="text-[10px] text-white/20 mx-2">&rarr;</span>

                    <select
                      value={pageMapping[client.id] || ''}
                      onChange={(e) => setPageMapping(client.id, e.target.value || null)}
                      className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white/60 outline-none focus:border-accent-violet/40 transition-colors max-w-[200px]"
                    >
                      <option value="">Unlink</option>
                      {meta.pages.map(p => (
                      <option key={p.pageId} value={p.pageId}>
                          {p.pageName}{p.hasInstagram ? p.instagramSource === 'manual' ? ' (+IG manual)' : ' (+IG)' : ''}
                      </option>
                    ))}
                  </select>

                    {page && (
                      <CheckCircle2 size={14} className="text-status-published/50 shrink-0" />
                    )}
                  </div>
                )
              })}

              {unmappedClients.map(client => (
                <div
                  key={client.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.01] border border-white/[0.03] border-dashed"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white/40 shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${client.color}15, ${client.color}05)`,
                    }}
                  >
                    {client.displayName.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-xs text-white/35 flex-1">{client.displayName}</span>

                  <span className="text-[10px] text-white/15 mx-2">&rarr;</span>

                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) setPageMapping(client.id, e.target.value)
                    }}
                    className="bg-white/[0.03] border border-white/[0.06] border-dashed rounded-lg px-3 py-1.5 text-xs text-white/30 outline-none focus:border-accent-violet/40 transition-colors max-w-[200px]"
                  >
                    <option value="">Select page...</option>
                    {meta.pages.map(p => (
                      <option key={p.pageId} value={p.pageId}>
                        {p.pageName}{p.hasInstagram ? p.instagramSource === 'manual' ? ' (+IG manual)' : ' (+IG)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              {clients.length === 0 && (
                <div className="text-center py-6 text-white/20 text-xs">
                  No clients found. Add editorial calendars to CLIENTI/ folders.
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Publishing tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-6"
        >
          <h3 className="text-sm font-semibold text-white mb-3">Publishing Notes</h3>
          <div className="space-y-2 text-xs text-white/40 leading-relaxed">
            <div className="flex items-start gap-2">
              <Clock size={12} className="text-white/25 mt-0.5 shrink-0" />
              <span>Posts must be in <span className="text-blue-400">Approved</span> or <span className="text-purple-400">Scheduled</span> status before publishing.</span>
            </div>
            <div className="flex items-start gap-2">
              <Facebook size={12} className="text-white/25 mt-0.5 shrink-0" />
              <span>Facebook supports text, image, and now video posts. Video-format posts need an attached video.</span>
            </div>
            <div className="flex items-start gap-2">
              <Instagram size={12} className="text-white/25 mt-0.5 shrink-0" />
              <span>Instagram supports single-image, carousel, video/reel, and single-frame story posts with public asset URLs. If a post needs Instagram library music, mark it for manual Instagram publish instead of auto-publish.</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
