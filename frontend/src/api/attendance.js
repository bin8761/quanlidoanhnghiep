import { apiClient } from './client'

export const attendanceApi = Object.freeze({
  async getStatus() {
    const response = await apiClient.get('/attendance/status')
    return response.data
  },

  async checkIn() {
    const response = await apiClient.post('/attendance/check-in')
    return response.data
  },

  async checkOut() {
    const response = await apiClient.post('/attendance/check-out')
    return response.data
  },

  async getMyHistory(params = {}) {
    const query = new URLSearchParams(params).toString()
    const response = await apiClient.get(`/attendance/my-history${query ? `?${query}` : ''}`)
    return response.data
  },

  async getAllHistory(params = {}) {
    const query = new URLSearchParams(params).toString()
    const response = await apiClient.get(`/attendance/all${query ? `?${query}` : ''}`)
    return response.data
  },
})
