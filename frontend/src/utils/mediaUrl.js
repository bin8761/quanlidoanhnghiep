import { API_BASE_URL } from '../api/client'

export function resolveMediaUrl(url) {
  if (!url) return ''
  if (/^(https?:|data:|blob:)/i.test(url)) return url

  if (API_BASE_URL === '/api' || API_BASE_URL.endsWith('/api')) {
    return `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`
  }

  const host = API_BASE_URL.replace(/\/api\/?$/, '')
  return `${host}${url.startsWith('/') ? url : `/${url}`}`
}
