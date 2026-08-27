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
          setUser(userData)
          localStorage.setItem('sarangtv_user', JSON.stringify(userData))
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
