import api, { clearToken, saveToken } from './api'

/**
 * Đăng nhập. Trả về { token, user }.
 * Tự lưu token vào localStorage.
 */
export async function login({ email, password }) {
  const data = await api.post('/auth/login', { email, password })
  saveToken(data.token)
  return data.user
}

/**
 * Lấy thông tin user hiện tại từ token đang lưu.
 * Dùng khi bootstrap app.
 */
export async function getMe() {
  return api.get('/auth/me')
}

/**
 * Đổi mật khẩu.
 * @param {string} currentPassword
 * @param {string} newPassword
 */
export async function changePassword({ currentPassword, newPassword }) {
  return api.put('/auth/change-password', { currentPassword, newPassword })
}

/**
 * Đăng xuất — chỉ xóa token local.
 * Backend stateless nên không cần gọi API.
 */
export function logout() {
  clearToken()
}

/**
 * Đăng ký tài khoản nhân viên mới.
 */
export async function register({ employeeCode, email, password, confirmPassword }) {
  return api.post('/auth/register', { employeeCode, email, password, confirmPassword })
}