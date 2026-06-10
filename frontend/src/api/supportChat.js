import { apiClient } from './client'

export const supportChatApi = Object.freeze({
  async sendMessage(message) {
    const response = await apiClient.post('/support-chat/messages', { message })
    return response.data
  },

  async getMessages() {
    const response = await apiClient.get('/support-chat/messages')
    return response.data
  },

  async adminListSessions() {
    const response = await apiClient.get('/support-chat/admin/sessions')
    return response.data
  },

  async adminGetSessionDetails(sessionId) {
    const response = await apiClient.get(`/support-chat/admin/sessions/${sessionId}/messages`)
    return response.data
  },

  async adminSendMessage(sessionId, message) {
    const response = await apiClient.post(`/support-chat/admin/sessions/${sessionId}/messages`, { message })
    return response.data
  },

  async adminCloseSession(sessionId) {
    const response = await apiClient.put(`/support-chat/admin/sessions/${sessionId}/close`, { status: 'CLOSED' })
    return response.data
  },
})
