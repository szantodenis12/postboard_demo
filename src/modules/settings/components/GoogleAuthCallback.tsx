import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, Loader2, MapPin } from 'lucide-react'

export function GoogleAuthCallback({ onComplete }: { onComplete: () => void }) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Connecting to Google...')
  const [locations, setLocations] = useState<{ locationName: string; address?: string }[]>([])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const error = params.get('error')
    let redirectTimer: number | null = null

    if (error) {
      setStatus('error')
      setMessage(`Authorization denied: ${error}`)
      return
    }

    if (!code) {
      setStatus('error')
      setMessage('No authorization code received')
      return
    }

    const connectGoogle = async () => {
      try {
        const res = await fetch('/api/google/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        })
        const data = await res.json()

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Connection failed')
        }

        setStatus('success')

        let nextLocations = data.locations || []
        setLocations(nextLocations)

        if (nextLocations.length === 0 && data.connectionId) {
          setMessage('Connected account. Fetching locations...')

          const refreshRes = await fetch('/api/google/refresh-locations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ connectionId: data.connectionId }),
          })
          const refreshData = await refreshRes.json()

          if (refreshRes.ok) {
            nextLocations = refreshData.locations || []
            setLocations(nextLocations)
          } else {
            setMessage(refreshData.error || data.locationsError || 'Connected account, but locations could not be loaded yet.')
          }
        }

        if (nextLocations.length > 0) {
          setMessage(`Connected ${nextLocations.length} location${nextLocations.length !== 1 ? 's' : ''}!`)
        } else if (!data.locationsError) {
          setMessage('Connected account, but Google did not return any locations yet.')
        }

        redirectTimer = window.setTimeout(() => {
          window.history.replaceState({}, '', '/')
          onComplete()
        }, 3500)
      } catch (err: any) {
        setStatus('error')
        setMessage(err.message)
      }
    }

    void connectGoogle()

    return () => {
      if (redirectTimer) window.clearTimeout(redirectTimer)
    }
  }, [onComplete])

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-surface noise">
      <div className="animated-bg">
        <div className="orb" />
        <div className="orb" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-2xl p-8 max-w-md w-full text-center"
      >
        {status === 'loading' && (
          <>
            <Loader2 size={40} className="text-[#4285F4] animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">{message}</h2>
            <p className="text-sm text-white/40">Exchanging tokens and fetching your locations...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full bg-status-published/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-status-published" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-3">{message}</h2>
            {locations.length > 0 && (
              <div className="space-y-2 mb-4">
                {locations.map(l => (
                  <div key={l.locationName} className="glass rounded-lg px-3 py-2 text-sm text-white/70 flex items-center gap-2">
                    <MapPin size={14} className="text-[#4285F4] shrink-0" />
                    <span className="truncate">{l.locationName}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-white/30">Redirecting to dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">Connection Failed</h2>
            <p className="text-sm text-red-400/80 mb-4">{message}</p>
            <button
              onClick={() => { window.history.replaceState({}, '', '/'); onComplete() }}
              className="px-4 py-2 rounded-lg glass glass-hover text-sm text-white/60"
            >
              Back to Dashboard
            </button>
          </>
        )}
      </motion.div>
    </div>
  )
}
