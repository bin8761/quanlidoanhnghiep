const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'

function getToken() {
  return localStorage.getItem('eam_token')
}

export function saveToken(token) {
  localStorage.setItem('eam_token', token)
}

export function clearToken() {
  localStorage.removeItem('eam_token')
}

async function request(method, path, body) {
  const token = getToken()

  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  // Token hết hạn hoặc không hợp lệ → xóa token và throw error
  if (response.status === 401) {
    clearToken()
    window.location.href = '/login'
    throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
  }

  const data = await response.json()

  if (!data.success) {
    const error = new Error(data.message || 'Đã xảy ra lỗi.')
    error.errorCode = data.errorCode
    throw error
  }

  return data.data
}

const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  patch: (path, body) => request('PATCH', path, body),
  del: (path) => request('DELETE', path),
}

export default api