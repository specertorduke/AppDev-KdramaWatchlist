import { createContext, useContext, useEffect, useState } from 'react'
import authService from '../services/authService.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sarangtv_user')
    return saved ? JSON.parse(saved) : null
  })
  const [token, setToken] = useState(() => localStorage.getItem('sarangtv_token'))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const userData = await authService.getMe()
          const userKey = userData?.id || userData?.email
          let customFields = {}
          if (userKey) {
            try {
              const savedCustom = localStorage.getItem(`sarangtv_profile_${userKey}`)
              if (savedCustom) customFields = JSON.parse(savedCustom)
            } catch {
              // Ignore parse errors
            }
          }
          const merged = { ...userData, ...customFields }
          setUser(merged)
          localStorage.setItem('sarangtv_user', JSON.stringify(merged))
        } catch {
          // Token invalid or expired
          setToken(null)
          setUser(null)
          localStorage.removeItem('sarangtv_token')
          localStorage.removeItem('sarangtv_user')
        }
      }
      setIsLoading(false)
    }

    loadUser()
  }, [token])

  const updateProfile = async ({ name, avatar }) => {
    let apiResult = null
    try {
      apiResult = await authService.updateProfile({ name, avatar, avatar_url: avatar })
    } catch {
      // Offline fallback
    }

    setUser((prev) => {
      const updated = {
        ...(prev || {}),
        ...(apiResult?.user || (apiResult?.id ? apiResult : {})),
        ...(name ? { name } : {}),
        ...(avatar ? { avatar, avatar_url: avatar } : {}),
      }
      localStorage.setItem('sarangtv_user', JSON.stringify(updated))
      const userKey = updated?.id || updated?.email
      if (userKey) {
        localStorage.setItem(
          `sarangtv_profile_${userKey}`,
          JSON.stringify({
            name: updated.name,
            avatar: updated.avatar || updated.avatar_url,
            avatar_url: updated.avatar || updated.avatar_url,
          })
        )
      }
      return updated
    })

    return true
  }

  const login = async (credentials) => {
    const data = await authService.login(credentials)
    if (data.token) {
      setToken(data.token)
      setUser(data.user)
      localStorage.setItem('sarangtv_token', data.token)
      localStorage.setItem('sarangtv_user', JSON.stringify(data.user))
    }
    return data
  }

  const register = async (userData) => {
    const data = await authService.register(userData)
    if (data.token) {
      setToken(data.token)
      setUser(data.user)
      localStorage.setItem('sarangtv_token', data.token)
      localStorage.setItem('sarangtv_user', JSON.stringify(data.user))
    }
    return data
  }

  const logout = async () => {
    try {
      if (token) {
        await authService.logout()
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      setToken(null)
      setUser(null)
      localStorage.removeItem('sarangtv_token')
      localStorage.removeItem('sarangtv_user')
    }
  }

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token),
    isLoading,
    login,
    register,
    logout,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
