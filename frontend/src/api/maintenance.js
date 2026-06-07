import { apiClient } from './client'

function buildQuery(filters = {}) {
  const query = new URLSearchParams()

  if (filters.status) query.set('status', filters.status)
  if (filters.assetId) query.set('assetId', filters.assetId)
  if (filters.requesterId) query.set('requesterId', filters.requesterId)

  const value = query.toString()
  return value ? `?${value}` : ''
}

export const maintenanceApi = Object.freeze({
  async list(filters) {
    const response = await apiClient.get(`/maintenance-requests${buildQuery(filters)}`)
    return response.data
  },

  async create(payload) {
    const response = await apiClient.post('/maintenance-requests', payload)
    return response.data
  },

  async updateStatus(requestId, payload) {
    const response = await apiClient.put(`/maintenance-requests/${requestId}/status`, payload)
    return response.data
  },
})
