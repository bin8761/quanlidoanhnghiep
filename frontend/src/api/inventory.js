import { apiClient } from './client'

function buildQuery(filters = {}) {
  const query = new URLSearchParams()

  if (filters.departmentId) query.set('departmentId', filters.departmentId)
  if (filters.status) query.set('status', filters.status)

  const value = query.toString()
  return value ? `?${value}` : ''
}

export const inventoryApi = Object.freeze({
  async list(filters) {
    const response = await apiClient.get(`/inventory-sessions${buildQuery(filters)}`)
    return response.data
  },

  async get(sessionId) {
    const response = await apiClient.get(`/inventory-sessions/${sessionId}`)
    return response.data
  },

  async create(payload) {
    const response = await apiClient.post('/inventory-sessions', payload)
    return response.data
  },

  async updateItem(itemId, payload) {
    const response = await apiClient.put(`/inventory-items/${itemId}`, payload)
    return response.data
  },
})
