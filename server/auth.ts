import type { Request, Response, NextFunction } from 'express'
import { auth } from './firebase.ts'

export function login(req: Request, res: Response) {
  res.status(400).json({ error: 'Login is now handled client-side via Firebase Auth' })
}

export function verify(req: Request, res: Response) {
  res.json({ authenticated: true })
}

// Public routes that don't require auth
const PUBLIC_PREFIXES = [
  '/api/auth/',
  '/api/review/',
  '/review/',
  '/api/reports/',
  '/report/',
  '/api/portal/',
  '/portal/',
  '/uploads/',
]

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip auth for public routes
  const path = req.path
  if (PUBLIC_PREFIXES.some(prefix => path.startsWith(prefix))) {
    return next()
  }

  // Skip auth for static assets (Vite dev)
  if (!path.startsWith('/api/')) {
    return next()
  }

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }

  try {
    const idToken = authHeader.split('Bearer ')[1]
    const decodedToken = await auth.verifyIdToken(idToken)
    ;(req as any).user = decodedToken
    next()
  } catch (error) {
    console.error('Error verifying auth token:', error)
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export function isAuthEnabled(): boolean {
  return true
}
