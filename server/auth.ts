import jwt from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express'

const JWT_SECRET = process.env.JWT_SECRET || 'postboard-default-secret'
const USERNAME = process.env.POSTBOARD_USERNAME || 'admin'
const PASSWORD = process.env.POSTBOARD_PASSWORD || 'admin'

export function login(req: Request, res: Response) {
  const { username, password } = req.body
  if (username !== USERNAME || password !== PASSWORD) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }
  const token = jwt.sign({ user: username }, JWT_SECRET, { expiresIn: '30d' })
  res.json({ success: true, token, username })
}

export function verify(req: Request, res: Response) {
  res.json({ authenticated: true, username: USERNAME })
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

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
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
    jwt.verify(authHeader.slice(7), JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export function isAuthEnabled(): boolean {
  return !!process.env.POSTBOARD_PASSWORD
}
