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

  async remove(departmentId) {
    return apiClient.delete(`/departments/${departmentId}`)
  },
})
