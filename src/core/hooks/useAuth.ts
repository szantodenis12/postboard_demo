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

  const logout = useCallback(async () => {
    console.log('[Auth] logout: Initiating logout process.')
    try {
      await signOut(auth)
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(SESSION_START_KEY)
      console.log('[Auth] logout: Successfully logged out and cleared local storage.')
    } catch (err) {
      console.error('[Auth] logout: Error during signOut:', err)
    }
  }, [])

  useEffect(() => {
    // Immediate check if user is already available
    if (auth.currentUser) {
      console.log('[Auth] currentUser already present on mount')
      setUser(auth.currentUser)
    }

    // Session duration enforcement
    const sessionStart = localStorage.getItem(SESSION_START_KEY)
    const now = Date.now()
    
    if (sessionStart && (now - parseInt(sessionStart)) > SESSION_DURATION_MS) {
      console.warn('[Auth] Session expired (>1h), logging out...')
      logout()
      setChecking(false)
      return
    }

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('[Auth] State changed:', currentUser ? 'LOGGED_IN' : 'LOGGED_OUT')
      
      if (currentUser) {
        setUser(currentUser)
        const token = await currentUser.getIdToken()
        localStorage.setItem(TOKEN_KEY, token)
        
        if (!localStorage.getItem(SESSION_START_KEY)) {
           localStorage.setItem(SESSION_START_KEY, Date.now().toString())
        }
      } else {
        setUser(null)
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(SESSION_START_KEY)
      }
      setChecking(false)
    })

    return () => unsubscribe()
  }, [logout])

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
