import { apiClient } from './client'

function buildQuery(filters = {}) {
  const query = new URLSearchParams()

  if (filters.keyword?.trim()) query.set('keyword', filters.keyword.trim())
  if (filters.status) query.set('status', filters.status)
  if (filters.departmentId) query.set('departmentId', filters.departmentId)

  const value = query.toString()
  return value ? `?${value}` : ''
}

export const employeeApi = Object.freeze({
  async list(filters) {
    const response = await apiClient.get(`/employees${buildQuery(filters)}`)
    return response.data
  },

  async getById(employeeId) {
    const response = await apiClient.get(`/employees/${employeeId}`)
    return response.data
  },

  async create(payload) {
    const response = await apiClient.post('/employees', payload)
    return response.data
  },

  async importRows(rows) {
    const response = await apiClient.post('/employees/import', { rows })
    return response.data
  },

  async update(employeeId, payload) {
    const response = await apiClient.put(`/employees/${employeeId}`, payload)
    return response.data
  },

  async remove(employeeId) {
    return apiClient.delete(`/employees/${employeeId}`)
  },

  async getAttachments(employeeId) {
    const response = await apiClient.get(`/employees/${employeeId}/attachments`)
    return response.data
  },

  async uploadAttachment(employeeId, payload) {
    const response = await apiClient.post(`/employees/${employeeId}/attachments`, payload)
    return response.data
  },

  async deleteAttachment(employeeId, attachmentId) {
    const response = await apiClient.delete(`/employees/${employeeId}/attachments/${attachmentId}`)
    return response.data
  },

  async getLogs(employeeId) {
    const response = await apiClient.get(`/employees/${employeeId}/logs`)
    return response.data
  },
})
