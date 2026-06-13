import { apiClient } from './client'

export const faqApi = Object.freeze({
  async list(params = {}) {
    const query = new URLSearchParams(params).toString()
    const response = await apiClient.get(`/faqs${query ? `?${query}` : ''}`)
    return response.data
  },

  async create(data) {
    const response = await apiClient.post('/faqs', data)
    return response.data
  },

  async update(id, data) {
    const response = await apiClient.put(`/faqs/${id}`, data)
    return response.data
  },

  async remove(id) {
    const response = await apiClient.delete(`/faqs/${id}`)
    return response.data
  },

  async toggleStatus(id, currentStatus) {
    const nextStatus = currentStatus === 'SHOW' ? 'HIDE' : 'SHOW'
    const response = await apiClient.put(`/faqs/${id}`, { status: nextStatus })
    return response.data
  },
})
