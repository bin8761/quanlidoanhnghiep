import { apiClient } from './client'
import { API_BASE_URL, getAccessToken } from './client'

function queryString(filters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) params.set(key, value)
  })
  const query = params.toString()
  return query ? `?${query}` : ''
}

export const reportApi = Object.freeze({
  async summary(filters) {
    const response = await apiClient.get(`/reports/summary${queryString(filters)}`)
    return response.data
  },

  async assetsByCategory(filters) {
    const response = await apiClient.get(`/reports/assets-by-category${queryString(filters)}`)
    return response.data
  },

  async assetsByDepartment(filters) {
    const response = await apiClient.get(`/reports/assets-by-department${queryString(filters)}`)
    return response.data
  },
  async trends(filters) {
    const response = await apiClient.get(`/reports/trends${queryString(filters)}`)
    return response.data
  },
  async dataQuality(filters) {
    const response = await apiClient.get(`/reports/data-quality${queryString(filters)}`)
    return response.data
  },
  async assets(filters) {
    const response = await apiClient.get(`/reports/assets${queryString(filters)}`)
    return response.data
  },
  async exportCsv(filters) {
    const response = await fetch(`${API_BASE_URL}/reports/export.csv${queryString(filters)}`, {
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    })
    if (!response.ok) throw new Error('Không thể xuất báo cáo CSV')
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'asset-report.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  },
})
