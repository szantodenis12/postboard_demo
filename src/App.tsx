import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AppProvider, useApp } from './core/context'
import { Sidebar } from './core/layout/Sidebar'
import { LoadingScreen } from './core/ui/LoadingScreen'
import { SearchModal } from './core/ui/SearchModal'
import { LoginPage } from './core/ui/LoginPage'
import { useAuth } from './core/hooks/useAuth'
import { AuthCallback } from './modules/settings/components/AuthCallback'
import { GoogleAuthCallback } from './modules/settings/components/GoogleAuthCallback'
import { getViewComponent, defaultViewId } from './modules/registry'
import { PublicReviewBoard } from './modules/client-portal/components/PublicReviewBoard'
import { MetaDataDeletionPage } from './core/ui/MetaDataDeletionPage'
import PrivacyPolicyPage from './core/ui/PrivacyPolicyPage'
import TermsOfServicePage from './core/ui/TermsOfServicePage'

function AppContent({ onLogout, authEnabled }: { onLogout?: () => void; authEnabled?: boolean }) {
  const { data, loading, error, refresh, refreshMeta, setSelectedClient } = useApp()
  const [currentView, setCurrentView] = useState(defaultViewId)
  const [searchOpen, setSearchOpen] = useState(false)

  // Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Custom navigation events (used by IntegrationsHub cards etc.)
  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const viewId = (e as CustomEvent).detail
      if (viewId) setCurrentView(viewId)
    }
    window.addEventListener('postboard:navigate', handleNavigate)
    return () => window.removeEventListener('postboard:navigate', handleNavigate)
  }, [])

  // Handle OAuth callbacks
  const isMetaCallback = window.location.pathname === '/auth/callback'
  const isGoogleCallback = window.location.pathname === '/auth/google/callback'
  if (isMetaCallback) {
    return <AuthCallback onComplete={() => { refreshMeta(); refresh() }} />
  }
  if (isGoogleCallback) {
    return <GoogleAuthCallback onComplete={() => refresh()} />
  }

  // Handle review links
  const isReviewPage = window.location.pathname.startsWith('/review/')
  if (isReviewPage) {
    return <PublicReviewBoard />
  }

  if (loading && data.clients.length === 0) {
    return <LoadingScreen />
  }

  const ViewComponent = getViewComponent(currentView)

  return (
    <div className="h-screen flex overflow-hidden noise">
      {/* Animated background */}
      <div className="animated-bg">
        <div className="orb" />
        <div className="orb" />
        <div className="orb" />
      </div>

      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        onLogout={authEnabled ? onLogout : undefined}
      />

      {/* Main content */}
      <main className="flex-1 h-screen overflow-hidden p-6">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 px-4 py-3 rounded-xl glass border border-red-500/20 text-red-400 text-sm"
            >
              Failed to load data: {error}
              <button
                onClick={refresh}
                className="ml-3 text-red-300 underline hover:no-underline"
              >
                Retry
              </button>
            </motion.div>
          )}

          {ViewComponent && (
            <motion.div
              key={currentView}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <ViewComponent />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Search Modal */}
      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        clients={data.clients}
        onPostClick={() => { setSearchOpen(false) }}
        onClientClick={(clientId) => { setSearchOpen(false); setSelectedClient(clientId); setCurrentView('dashboard') }}
      />
    </div>
  )
}

export default function App() {
  const auth = useAuth()
  const path = window.location.pathname

  // Public pages bypass auth
  if (path === '/meta-data-deletion') {
    return <MetaDataDeletionPage />
  }
  if (path === '/privacy-policy') {
    return <PrivacyPolicyPage />
  }
  if (path === '/terms-of-service') {
    return <TermsOfServicePage />
  }

  // Still checking auth status
  if (auth.checking) {
    return <LoadingScreen />
  }

  // Auth required but not logged in
  if (auth.authRequired && !auth.isAuthenticated) {
    return <LoginPage onLogin={auth.login} error={auth.error} />
  }

  return (
    <AppProvider>
      <AppContent onLogout={auth.logout} authEnabled={!!auth.authRequired} />
    </AppProvider>
  )
}
