import { apiClient } from './client'

function buildQuery(filters = {}) {
  const query = new URLSearchParams()

  if (filters.assetId) query.set('assetId', filters.assetId)
  if (filters.employeeId) query.set('employeeId', filters.employeeId)
  if (filters.status) query.set('status', filters.status)

  const value = query.toString()
  return value ? `?${value}` : ''
}

export const assignmentApi = Object.freeze({
  async history(filters) {
    const response = await apiClient.get(`/assignments/history${buildQuery(filters)}`)
    return response.data
  },

  async assign(payload) {
    const response = await apiClient.post('/assignments/assign', payload)
    return response.data
  },

  async returnAsset(payload) {
    const response = await apiClient.post('/assignments/return', payload)
    return response.data
  },

  async transfer(payload) {
    const response = await apiClient.post('/assignments/transfer', payload)
    return response.data
  },
})
