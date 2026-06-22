import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import {
  createNotificationsStream,
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../api/notifications'
import { useAuth } from '../auth/auth-context'
import { NotificationsContext } from './notifications-context'
import { normalizeNotification, normalizeNotifications } from './normalizeNotification'

function mergeNotification(items, notification) {
  return [notification, ...items.filter((item) => item.id !== notification.id)].slice(0, 20)
}

export function NotificationsProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState('idle')
  const [isLoading, setIsLoading] = useState(false)
  const disconnectTimerRef = useRef(null)

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return

    setIsLoading(true)
    try {
      const [listResponse, countResponse] = await Promise.all([
        listNotifications({ limit: 20 }),
        getUnreadNotificationCount(),
      ])

      setNotifications(normalizeNotifications(listResponse.data))
      setUnreadCount(countResponse.data?.count || 0)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined
    }

    let cancelled = false
    const clearDisconnectTimer = () => {
      if (disconnectTimerRef.current) {
        window.clearTimeout(disconnectTimerRef.current)
        disconnectTimerRef.current = null
      }
    }

    Promise.all([listNotifications({ limit: 20 }), getUnreadNotificationCount()])
      .then(([listResponse, countResponse]) => {
        if (cancelled) return
        setNotifications(normalizeNotifications(listResponse.data))
        setUnreadCount(countResponse.data?.count || 0)
      })
      .catch(() => undefined)

    const stream = createNotificationsStream()
    if (!stream) {
      return () => {
        cancelled = true
      }
    }

    setConnectionStatus('connecting')

    stream.addEventListener('connected', () => {
      clearDisconnectTimer()
      setConnectionStatus('connected')
    })

    stream.addEventListener('notification', (event) => {
      clearDisconnectTimer()
      setConnectionStatus('connected')
      const notification = normalizeNotification(JSON.parse(event.data))
      setNotifications((current) => mergeNotification(current, notification))
      setUnreadCount((current) => current + 1)
      toast.info(notification.title)
    })

    stream.onerror = () => {
      clearDisconnectTimer()

      if (document.visibilityState === 'hidden') {
        return
      }

      setConnectionStatus('connecting')
      disconnectTimerRef.current = window.setTimeout(() => {
        if (!navigator.onLine || stream.readyState === EventSource.CLOSED) {
          setConnectionStatus('disconnected')
          return
        }

        setConnectionStatus('connecting')
      }, 8000)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        clearDisconnectTimer()
        setConnectionStatus(stream.readyState === EventSource.OPEN ? 'connected' : 'connecting')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      cancelled = true
      clearDisconnectTimer()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      stream.close()
    }
  }, [isAuthenticated])

  const markRead = useCallback(async (id) => {
    const response = await markNotificationAsRead(id)
    const updated = normalizeNotification(response.data)

    setNotifications((current) => current.map((item) => (item.id === id ? updated : item)))
    setUnreadCount((current) => Math.max(current - 1, 0))

    return updated
  }, [])

  const markAllRead = useCallback(async () => {
    await markAllNotificationsAsRead()
    setNotifications((current) => current.map((item) => ({ ...item, isRead: true, readAt: item.readAt || new Date().toISOString() })))
    setUnreadCount(0)
  }, [])

  const value = useMemo(
    () => ({
      notifications: isAuthenticated ? notifications : [],
      unreadCount: isAuthenticated ? unreadCount : 0,
      connectionStatus: isAuthenticated ? connectionStatus : 'idle',
      isLoading,
      refresh,
      markRead,
      markAllRead,
    }),
    [
      isAuthenticated,
      notifications,
      unreadCount,
      connectionStatus,
      isLoading,
      refresh,
      markRead,
      markAllRead,
    ],
  )

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}
