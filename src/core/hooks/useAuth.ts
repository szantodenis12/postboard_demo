import { useState, useEffect, useCallback } from 'react'
import { auth } from '../../firebase'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth'

const TOKEN_KEY = 'postboard_token'
const SESSION_START_KEY = 'postboard_session_start'
const SESSION_DURATION_MS = 60 * 60 * 1000 // 1 hour

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Session duration enforcement
    const sessionStart = localStorage.getItem(SESSION_START_KEY)
    const now = Date.now()
    
    if (sessionStart && now - parseInt(sessionStart) > SESSION_DURATION_MS) {
      console.log('Session expired (over 1h)')
      signOut(auth)
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(SESSION_START_KEY)
      setChecking(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        const token = await currentUser.getIdToken()
        localStorage.setItem(TOKEN_KEY, token)
        // If logged in but no session start (e.g. from previous version), set it now
        if (!localStorage.getItem(SESSION_START_KEY)) {
           localStorage.setItem(SESSION_START_KEY, Date.now().toString())
        }
      } else {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(SESSION_START_KEY)
      }
      setChecking(false)
    })

    return () => unsubscribe()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setError(null)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      localStorage.setItem(SESSION_START_KEY, Date.now().toString())
      return true
    } catch (err: any) {
      setError(err.message || 'Login failed')
      return false
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await signOut(auth)
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(SESSION_START_KEY)
    } catch {
      // ignore
    }
  }, [])

  const isAuthenticated = !!user
  const isReviewPath = window.location.pathname.startsWith('/review/')

  return { 
    isAuthenticated, 
    authRequired: isReviewPath ? false : true, 
    checking, 
    user, 
    error, 
    login, 
    logout 
  }
}

// Add auth token to all fetch requests
const originalFetch = window.fetch
window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
  let token = localStorage.getItem(TOKEN_KEY)
  
  if (auth.currentUser) {
    try {
       token = await auth.currentUser.getIdToken()
       localStorage.setItem(TOKEN_KEY, token)
    } catch (e) {
       // use cached token if refresh fails
    }
  }

  if (token) {
    const headers = new Headers(init?.headers)
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    return originalFetch(input, { ...init, headers })
  }
  return originalFetch(input, init)
}
