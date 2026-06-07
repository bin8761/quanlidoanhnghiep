import { apiClient } from './client'

function buildQuery(filters = {}) {
  const query = new URLSearchParams()

  if (filters.keyword?.trim()) query.set('keyword', filters.keyword.trim())
  if (filters.status) query.set('status', filters.status)
  if (filters.categoryId) query.set('categoryId', filters.categoryId)
  if (filters.departmentId) query.set('departmentId', filters.departmentId)
  if (filters.employeeId) query.set('employeeId', filters.employeeId)

  const value = query.toString()
  return value ? `?${value}` : ''
}

export const assetApi = Object.freeze({
  async list(filters) {
    const response = await apiClient.get(`/assets${buildQuery(filters)}`)
    return response.data
  },

  async create(payload) {
    const response = await apiClient.post('/assets', payload)
    return response.data
  },

  async update(assetId, payload) {
    const response = await apiClient.put(`/assets/${assetId}`, payload)
    return response.data
  },

  async remove(assetId) {
    return apiClient.delete(`/assets/${assetId}`)
  },
})
