import { API_BASE_URL, apiClient, getAccessToken } from './client'

export function listNotifications(params = {}) {
  const searchParams = new URLSearchParams()

  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.unreadOnly) searchParams.set('unreadOnly', 'true')

  const query = searchParams.toString()
  return apiClient.get(`/notifications${query ? `?${query}` : ''}`)
}

export function getUnreadNotificationCount() {
  return apiClient.get('/notifications/unread-count')
}

export function markNotificationAsRead(id) {
  return apiClient.patch(`/notifications/${id}/read`)
}

export function markAllNotificationsAsRead() {
  return apiClient.patch('/notifications/read-all')
}

export function createNotificationsStream() {
  const token = getAccessToken()
  if (!token) return null
  if (API_BASE_URL.startsWith('/')) return null

  const url = new URL(`${API_BASE_URL}/notifications/stream`, window.location.origin)
  url.searchParams.set('token', token)

  return new EventSource(url.toString())
}
