import { useState, useEffect, useCallback } from 'react'
import { auth } from '../../firebase'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth'

const TOKEN_KEY = 'postboard_token'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        const token = await currentUser.getIdToken()
        localStorage.setItem(TOKEN_KEY, token)
      } else {
        localStorage.removeItem(TOKEN_KEY)
      }
      setChecking(false)
    })

    return () => unsubscribe()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setError(null)
    try {
      await signInWithEmailAndPassword(auth, email, password)
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
