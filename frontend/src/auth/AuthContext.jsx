import { useEffect, useMemo, useState } from 'react'
import { apiClient, getAccessToken, setAccessToken } from '../api/client'
import { AuthContext } from './auth-context'

const USER_KEY = 'eam_current_user'

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY))
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)
  const [isBootstrapping, setIsBootstrapping] = useState(Boolean(getAccessToken()))

  useEffect(() => {
    const token = getAccessToken()

    if (!token) {
      return
    }

    apiClient
      .get('/auth/me')
      .then((response) => {
        setUser(response.data)
        localStorage.setItem(USER_KEY, JSON.stringify(response.data))
      })
      .catch(() => {
        setAccessToken(null)
        localStorage.removeItem(USER_KEY)
        setUser(null)
      })
      .finally(() => setIsBootstrapping(false))
  }, [])

  async function login(credentials) {
    const response = await apiClient.post('/auth/login', credentials)
    const session = response.data

    setAccessToken(session.accessToken)
    localStorage.setItem(USER_KEY, JSON.stringify(session.user))
    setUser(session.user)

    return session.user
  }

  async function register(payload) {
    const response = await apiClient.post('/auth/register', payload)
    return response.data
  }

  function logout() {
    if (getAccessToken()) {
      apiClient.post('/auth/logout').catch(() => undefined)
    }

    setAccessToken(null)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isBootstrapping,
      login,
      register,
      logout,
    }),
    [user, isBootstrapping],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
