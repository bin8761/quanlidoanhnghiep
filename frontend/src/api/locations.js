import { apiClient } from './client'

export const locationApi = Object.freeze({
  async list() {
    const response = await apiClient.get('/locations')
    return response.data
  },

  async get(id) {
    const response = await apiClient.get(`/locations/${id}`)
    return response.data
  },

  async create(payload) {
    const response = await apiClient.post('/locations', payload)
    return response.data
  },

  async update(id, payload) {
    const response = await apiClient.put(`/locations/${id}`, payload)
    return response.data
  },

  async remove(id) {
    return apiClient.delete(`/locations/${id}`)
  },
})
