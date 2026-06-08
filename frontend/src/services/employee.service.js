import { apiClient } from '../api/client'

// ─── Tài sản được bàn giao ────────────────────────────────────────────────────

/**
 * Lấy danh sách tài sản đang được bàn giao cho user hiện tại.
 * GET /api/assignments/my
 */
export async function getMyAssets() {
  const response = await apiClient.get('/assignments/my')
  return response.data
}

/**
 * Lấy chi tiết một tài sản theo ID.
 * GET /api/assets/:id
 */
export async function getAssetById(id) {
  const response = await apiClient.get(`/assets/${id}`)
  return response.data
}

// ─── Lịch sử ─────────────────────────────────────────────────────────────────

/**
 * Lấy lịch sử bàn giao của user hiện tại.
 * GET /api/assignments/history/my
 */
export async function getMyAssignmentHistory() {
  const response = await apiClient.get('/assignments/history/my')
  return response.data
}

/**
 * Lấy lịch sử yêu cầu bảo trì của user hiện tại.
 * GET /api/maintenance-requests
 */
export async function getMyMaintenanceHistory() {
  const response = await apiClient.get('/maintenance-requests')
  return response.data
}

// ─── Yêu cầu hỗ trợ ──────────────────────────────────────────────────────────

/**
 * Lấy danh sách yêu cầu bảo trì của user hiện tại.
 * GET /api/maintenance-requests
 */
export async function getMyRequests() {
  const response = await apiClient.get('/maintenance-requests')
  return response.data
}

/**
 * Tạo yêu cầu bảo trì mới.
 * POST /api/maintenance-requests
 * @param {{ assetId: string, description: string, priority: string }} data
 */
export async function createRequest(data) {
  const response = await apiClient.post('/maintenance-requests', data)
  return response.data
}

/**
 * Lấy lịch sử bảo trì của một tài sản cụ thể.
 * GET /api/maintenance-requests?assetId=:id
 */
export async function getMaintenanceByAsset(assetId) {
  const response = await apiClient.get(`/maintenance-requests?assetId=${assetId}`)
  return response.data
}