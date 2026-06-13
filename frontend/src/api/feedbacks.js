import { API_BASE_URL, apiClient } from './client'

export function getFeedbackFileUrl(fileUrl) {
  if (!fileUrl) return ''
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl

  const apiHost = API_BASE_URL.replace(/\/api\/?$/, '')
  const normalizedPath = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`
  return `${apiHost}${normalizedPath}`
}

export function getFeedbackFileName(fileUrl) {
  if (!fileUrl) return ''

  const path = fileUrl.split('?')[0]
  const encodedName = path.split('/').filter(Boolean).pop()

  if (!encodedName) return 'Tệp đính kèm'

  try {
    return decodeURIComponent(encodedName)
  } catch {
    return encodedName
  }
}

export const feedbackApi = Object.freeze({
  async list(params = {}) {
    const query = new URLSearchParams(params).toString()
    const response = await apiClient.get(`/feedbacks${query ? `?${query}` : ''}`)
    return response.data
  },

  async create(data) {
    // If the data has file upload, it should be FormData
    const response = await apiClient.post('/feedbacks', data)
    return response.data
  },

  async updateStatus(id, data) {
    const response = await apiClient.patch(`/feedbacks/${id}/status`, data)
    return response.data
  },

  async getMyHistory() {
    const response = await apiClient.get('/feedbacks/my')
    return response.data
  },
})
