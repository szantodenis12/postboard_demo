import { useState, useEffect, useCallback } from 'react'

const TOKEN_KEY = 'postboard_token'

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [authRequired, setAuthRequired] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check if auth is enabled on the server
  useEffect(() => {
    fetch('/api/auth/status')
      .then(r => r.json())
      .then(data => {
        setAuthRequired(data.authEnabled)
        if (!data.authEnabled) {
          setChecking(false)
          return
        }
        // If auth is enabled and we have a token, verify it
        const stored = localStorage.getItem(TOKEN_KEY)
        if (stored) {
          return fetch('/api/auth/verify', {
            headers: { Authorization: `Bearer ${stored}` },
          }).then(r => {
            if (r.ok) {
              setToken(stored)
            } else {
              localStorage.removeItem(TOKEN_KEY)
              setToken(null)
            }
            setChecking(false)
          })
        }
        setChecking(false)
      })
      .catch(() => {
        setAuthRequired(false)
        setChecking(false)
      })
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    setError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (data.success) {
        localStorage.setItem(TOKEN_KEY, data.token)
        setToken(data.token)
        return true
      }
      setError(data.error || 'Login failed')
      return false
    } catch {
      setError('Connection error')
      return false
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
  }, [])

  const isAuthenticated = !authRequired || !!token

  return { isAuthenticated, authRequired, checking, token, error, login, logout }
}

// Add auth token to all fetch requests
const originalFetch = window.fetch
window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    const headers = new Headers(init?.headers)
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    return originalFetch(input, { ...init, headers })
  }
  return originalFetch(input, init)
}
