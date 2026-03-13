import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, LogIn, AlertCircle, Loader2 } from 'lucide-react'

export function LoginPage({ onLogin, error }: {
  onLogin: (username: string, password: string) => Promise<boolean>
  error: string | null
}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) return
    setLoading(true)
    await onLogin(username, password)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#07070e] p-6">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-[380px]"
      >
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.2))',
              border: '1px solid rgba(124,58,237,0.3)',
            }}
          >
            <Lock size={24} className="text-accent-violet" />
          </div>
          <h1 className="text-2xl font-bold text-white">PostBoard</h1>
          <p className="text-sm text-white/30 mt-1">Epic Digital Hub</p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-4"
          style={{ border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/25 font-medium mb-1.5 block">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-accent-violet/40 transition-colors placeholder:text-white/15"
              placeholder="Enter username"
              autoFocus
              autoComplete="username"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/25 font-medium mb-1.5 block">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-accent-violet/40 transition-colors placeholder:text-white/15"
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-[12px] text-red-400/80 bg-red-500/[0.08] rounded-lg px-3 py-2.5"
            >
              <AlertCircle size={14} />
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(6,182,212,0.3))',
              border: '1px solid rgba(124,58,237,0.3)',
              color: 'white',
            }}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <LogIn size={16} />
            )}
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-[10px] text-white/10 mt-6">
          Powered by PostBoard — Epic Digital Hub
        </p>
      </motion.div>
    </div>
  )
}
