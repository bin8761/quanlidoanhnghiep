import { apiClient } from './client'

export const departmentApi = Object.freeze({
  async list() {
    const response = await apiClient.get('/departments')
    return response.data
  },

  async create(payload) {
    const response = await apiClient.post('/departments', payload)
    return response.data
  },

  async update(departmentId, payload) {
    const response = await apiClient.put(`/departments/${departmentId}`, payload)
    return response.data
  },

  async get(departmentId, detail = false) {
    const response = await apiClient.get(`/departments/${departmentId}${detail ? '?detail=true' : ''}`)
    return response.data
  },

  async remove(departmentId) {
    return apiClient.delete(`/departments/${departmentId}`)
  },

  async getDashboardSummary() {
    const response = await apiClient.get('/departments/dashboard/summary')
    return response.data
  },

  async updateQuotas(departmentId, quotas) {
    const response = await apiClient.post(`/departments/${departmentId}/quotas`, { quotas })
    return response.data
  },
})
