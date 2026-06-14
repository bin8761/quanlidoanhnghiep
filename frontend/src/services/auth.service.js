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

/**
 * Gửi yêu cầu mã OTP quên mật khẩu về email.
 */
export async function sendForgotPasswordOtp({ email }) {
  return api.post('/auth/forgot-password', { email })
}

/**
 * Xác thực mã OTP quên mật khẩu.
 */
export async function verifyForgotPasswordOtp({ email, otp }) {
  return api.post('/auth/verify-forgot-password-otp', { email, otp })
}

/**
 * Đặt lại mật khẩu mới sử dụng mã OTP đã xác thực.
 */
export async function resetPassword({ email, otp, newPassword, confirmNewPassword }) {
  return api.post('/auth/reset-password', { email, otp, newPassword, confirmNewPassword })
}