import { apiClient } from './client'

export const loginHistoryApi = Object.freeze({
  // Admin: list all users' login histories
  async listAll(params = {}) {
    const query = new URLSearchParams(params).toString()
    const response = await apiClient.get(`/login-histories${query ? `?${query}` : ''}`)
    return response.data
  },

  // Backward-compatible alias used in AdminLoginHistoryPage
  async list(params = {}) {
    return loginHistoryApi.listAll(params)
  },

  // User: fetch only own login history
  async getMyHistory(params = {}) {
    const query = new URLSearchParams(params).toString()
    const response = await apiClient.get(`/login-histories/my${query ? `?${query}` : ''}`)
    return response.data
  },
})
