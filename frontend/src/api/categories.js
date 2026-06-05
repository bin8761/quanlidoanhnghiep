import { apiClient } from './client'

export const categoryApi = Object.freeze({
  async list(search = '') {
    const query = search ? `?search=${encodeURIComponent(search)}` : ''
    const response = await apiClient.get(`/categories${query}`)
    return response.data
  },

  async create(payload) {
    const response = await apiClient.post('/categories', payload)
    return response.data
  },

  async update(categoryId, payload) {
    const response = await apiClient.put(`/categories/${categoryId}`, payload)
    return response.data
  },

  async remove(categoryId) {
    return apiClient.delete(`/categories/${categoryId}`)
  },
})
