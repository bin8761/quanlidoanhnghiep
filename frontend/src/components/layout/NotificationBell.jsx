import { Bell, CheckCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/auth-context'
import { useNotifications } from '../../notifications/notifications-context'
import { useLanguage } from '../../hooks/useLanguage'

function formatTime(value, locale) {
  if (!value) return ''

  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(value))
}

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { locale, t } = useLanguage()
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const hasUnread = unreadCount > 0

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function getNotificationTarget(notification) {
    if (notification.data?.targetUrl) {
      return notification.data.targetUrl
    }

    if (notification.type === 'MAINTENANCE_CREATED' && user?.role === 'ADMIN') {
      return `/admin/maintenance?requestId=${notification.data?.supportRequestId || notification.data?.maintenanceRequestId || ''}`
    }

    if (notification.type === 'MAINTENANCE_UPDATED' && user?.role === 'USER') {
      return `/employee/requests?requestId=${notification.data?.supportRequestId || notification.data?.maintenanceRequestId || ''}`
    }

    if (notification.type === 'ASSET_ASSIGNED' && user?.role === 'USER') {
      return `/employee/assets/${notification.data?.assetCode || ''}`
    }

    return null
  }

  async function openNotification(notification) {
    if (!notification.isRead) {
      await markRead(notification.id)
    }

    const target = getNotificationTarget(notification)
    if (target) {
      setOpen(false)
      navigate(target)
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        className="icon-button relative"
        type="button"
        aria-label={hasUnread ? `${unreadCount} ${locale === 'en' ? 'unread notifications' : 'thông báo chưa đọc'}` : t('Không có thông báo mới')}
        title={hasUnread ? `${unreadCount} ${locale === 'en' ? 'unread notifications' : 'thông báo chưa đọc'}` : t('Không có thông báo mới')}
        onClick={() => setOpen((current) => !current)}
      >
        <Bell size={18} />
        {hasUnread && (
          <span className="absolute top-2 right-2 size-2 rounded-full border-2 border-white bg-amber-500" />
        )}
      </button>

      {open && (
        <div className="absolute top-12 right-0 z-30 w-[min(360px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-premium">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-sm font-bold text-slate-900">{t('Thông báo')}</p>
              <p className="text-xs text-slate-500">{hasUnread ? `${unreadCount} ${locale === 'en' ? 'unread' : 'chưa đọc'}` : t('Tất cả đã đọc')}</p>
            </div>
            <button
              className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40"
              type="button"
              title={t('Đánh dấu tất cả đã đọc')}
              aria-label={t('Đánh dấu tất cả đã đọc')}
              disabled={!hasUnread}
              onClick={() => markAllRead()}
            >
              <CheckCheck size={16} />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-slate-500">{t('Chưa có thông báo.')}</p>
            )}

            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                className="grid w-full grid-cols-[8px_minmax(0,1fr)] gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-slate-50"
                onClick={() => openNotification(notification)}
              >
                <span
                  className={`mt-2 size-2 rounded-full ${notification.isRead ? 'bg-slate-200' : 'bg-amber-500'}`}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-slate-900">{notification.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-600">{notification.message}</span>
                  <span className="mt-2 block text-[11px] font-semibold text-slate-400">
                    {formatTime(notification.createdAt, locale)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
