import { useState, useEffect, useCallback, useRef } from 'react'
import type { AppNotification } from '../types'

const POLL_INTERVAL = 30_000 // 30 seconds

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  const markRead = useCallback(async (id: string) => {
    // Optimistic
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
    } catch {
      refresh()
    }
  }, [refresh])

  const markAllRead = useCallback(async () => {
    // Optimistic
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' })
    } catch {
      refresh()
    }
  }, [refresh])

  const unreadCount = notifications.filter(n => !n.read).length

  // Initial fetch + polling
  useEffect(() => {
    refresh()
    intervalRef.current = setInterval(refresh, POLL_INTERVAL)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [refresh])

  return {
    notifications,
    unreadCount,
    loading,
    refresh,
    markRead,
    markAllRead,
  }
}
