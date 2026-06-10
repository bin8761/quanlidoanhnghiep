import { apiClient } from './client'

export const feedbackApi = Object.freeze({
  async list(params = {}) {
    const query = new URLSearchParams(params).toString()
    const response = await apiClient.get(`/feedbacks${query ? `?${query}` : ''}`)
    return response.data
  },

  async create(data) {
    // If the data has file upload, it should be FormData
    const response = await apiClient.post('/feedbacks', data)
    return response.data
  },

  async updateStatus(id, data) {
    const response = await apiClient.patch(`/feedbacks/${id}/status`, data)
    return response.data
  },

  async getMyHistory() {
    const response = await apiClient.get('/feedbacks/my')
    return response.data
  },
})
