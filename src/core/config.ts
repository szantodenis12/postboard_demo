function normalizeOrigin(value?: string | null): string {
  return String(value || '').trim().replace(/\/+$/, '')
}

function getWindowOrigin(): string {
  if (typeof window === 'undefined') return ''
  return normalizeOrigin(window.location.origin)
}

export const APP_ORIGIN = normalizeOrigin(import.meta.env.VITE_APP_ORIGIN) || getWindowOrigin()
export const API_ORIGIN = normalizeOrigin(import.meta.env.VITE_API_ORIGIN) || APP_ORIGIN

export function appUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  const base = APP_ORIGIN || getWindowOrigin()
  return new URL(path, `${base}/`).toString()
}

export function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  const base = API_ORIGIN || getWindowOrigin()
  return new URL(path, `${base}/`).toString()
}

export function absoluteAssetUrl(path?: string | null): string | undefined {
  if (!path) return undefined
  if (/^https?:\/\//i.test(path)) return path
  const base = API_ORIGIN || APP_ORIGIN || getWindowOrigin()
  return new URL(path, `${base}/`).toString()
}
