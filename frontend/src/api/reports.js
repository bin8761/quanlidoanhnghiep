import { apiClient } from './client'

export const reportApi = Object.freeze({
  async summary() {
    const response = await apiClient.get('/reports/summary')
    return response.data
  },

  async assetsByCategory() {
    const response = await apiClient.get('/reports/assets-by-category')
    return response.data
  },

  async assetsByDepartment() {
    const response = await apiClient.get('/reports/assets-by-department')
    return response.data
  },
})
