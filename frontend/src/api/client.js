const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
const TOKEN_KEY = 'eam_access_token'
const USER_KEY = 'eam_current_user'
const INACTIVE_ACCOUNT_ERROR_CODE = 'AUTH_ACCOUNT_INACTIVE'

export class ApiError extends Error {
  constructor(message, options = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = options.status
    this.errorCode = options.errorCode
    this.details = options.details
    this.requestId = options.requestId
  }
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAccessToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

function clearSession() {
  setAccessToken(null)
  localStorage.removeItem(USER_KEY)
}

function redirectToLogin() {
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

async function request(path, options = {}) {
  const token = getAccessToken()
  const headers = new Headers(options.headers)

  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      body:
        options.body && !(options.body instanceof FormData)
          ? JSON.stringify(options.body)
          : options.body,
    })
  } catch {
    throw new ApiError('Không thể kết nối tới máy chủ. Hãy kiểm tra backend đang chạy.')
  }

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const isLoginRequest = path === '/auth/login'
    const isInactiveAccount = payload?.errorCode === INACTIVE_ACCOUNT_ERROR_CODE

    if (isInactiveAccount && token) {
      clearSession()
      if (!isLoginRequest) {
        redirectToLogin()
      }
    } else if (response.status === 401 && token && !isLoginRequest) {
      clearSession()
      redirectToLogin()
    }
    throw new ApiError(payload?.message || 'Yêu cầu không thành công', {
      status: response.status,
      errorCode: payload?.errorCode,
      details: payload?.details,
      requestId: payload?.requestId,
    })
  }

  return payload
}

export const apiClient = Object.freeze({
  get(path, options) {
    return request(path, { ...options, method: 'GET' })
  },
  post(path, body, options) {
    return request(path, { ...options, method: 'POST', body })
  },
  put(path, body, options) {
    return request(path, { ...options, method: 'PUT', body })
  },
  patch(path, body, options) {
    return request(path, { ...options, method: 'PATCH', body })
  },
  delete(path, options) {
    return request(path, { ...options, method: 'DELETE' })
  },
})

export { API_BASE_URL, TOKEN_KEY }
