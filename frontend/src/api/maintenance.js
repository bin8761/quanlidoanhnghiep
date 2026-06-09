import { apiClient } from './client'

function buildQuery(filters = {}) {
  const query = new URLSearchParams()

  if (filters.status) query.set('status', filters.status)
  if (filters.type) query.set('type', filters.type)
  if (filters.priority) query.set('priority', filters.priority)
  if (filters.assetId) query.set('assetId', filters.assetId)
  if (filters.requesterId) query.set('requesterId', filters.requesterId)
  if (filters.assigneeId) query.set('assigneeId', filters.assigneeId)

  const value = query.toString()
  return value ? `?${value}` : ''
}

export const supportRequestApi = Object.freeze({
  async list(filters) {
    const response = await apiClient.get(`/support-requests${buildQuery(filters)}`)
    return response.data
  },

  async create(payload) {
    const response = await apiClient.post('/support-requests', payload)
    return response.data
  },

  async updateStatus(requestId, payload) {
    const response = await apiClient.patch(`/support-requests/${requestId}/status`, payload)
    return response.data
  },

  async fulfill(requestId, payload) {
    const response = await apiClient.post(`/support-requests/${requestId}/fulfill`, payload)
    return response.data
  },
})

export const maintenanceApi = supportRequestApi
