import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export function AuthCallback({ onComplete }: { onComplete: () => void }) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Connecting to Meta...')
  const [pages, setPages] = useState<{ pageName: string; hasInstagram: boolean }[]>([])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const error = params.get('error')

    if (error) {
      setStatus('error')
      setMessage(`Authorization denied: ${params.get('error_description') || error}`)
      return
    }

    if (!code) {
      setStatus('error')
      setMessage('No authorization code received')
      return
    }

    // Exchange code for tokens
    fetch('/api/meta/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStatus('success')
          setPages(data.pages || [])
          setMessage(`Connected ${data.pages?.length || 0} pages!`)
          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            window.history.replaceState({}, '', '/')
            onComplete()
          }, 3000)
        } else {
          setStatus('error')
          setMessage(data.error || 'Connection failed')
        }
      })
      .catch(err => {
        setStatus('error')
        setMessage(err.message)
      })
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
            <Loader2 size={40} className="text-accent-violet animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">{message}</h2>
            <p className="text-sm text-white/40">Exchanging tokens and fetching your pages...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full bg-status-published/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-status-published" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-3">{message}</h2>
            {pages.length > 0 && (
              <div className="space-y-2 mb-4">
                {pages.map(p => (
                  <div key={p.pageName} className="glass rounded-lg px-3 py-2 text-sm text-white/70 flex items-center justify-between">
                    <span>{p.pageName}</span>
                    {p.hasInstagram && (
                      <span className="text-[10px] text-platform-instagram px-1.5 py-0.5 rounded bg-platform-instagram/10">
                        + Instagram
                      </span>
                    )}
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
