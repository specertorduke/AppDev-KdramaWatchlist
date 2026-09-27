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

  // Helper to read remembered accounts
  const getStoredAccounts = () => {
    try {
      const stored = localStorage.getItem('sarangtv_accounts')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  const [savedAccounts, setSavedAccounts] = useState(getStoredAccounts)

  // Save/update an account in remembered list
  const recordAccount = (accountUser, accountToken) => {
    if (!accountUser || !accountToken) return
    const accountKey = accountUser.id || accountUser.email
    if (!accountKey) return

    setSavedAccounts((prev) => {
      const existing = Array.isArray(prev) ? prev : []
      const filtered = existing.filter((a) => (a.id || a.email) !== accountKey)
      const entry = {
        id: accountUser.id,
        email: accountUser.email,
        name: accountUser.name || accountUser.email?.split('@')[0] || 'User',
        avatar: accountUser.avatar || accountUser.avatar_url || '',
        avatar_url: accountUser.avatar || accountUser.avatar_url || '',
        token: accountToken,
        user: accountUser,
        lastActive: Date.now(),
      }
      const updated = [entry, ...filtered]
      localStorage.setItem('sarangtv_accounts', JSON.stringify(updated))
      return updated
    })
  }

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
          recordAccount(merged, token)
        } catch (err) {
          // Invalidate token only if explicitly 401 Unauthorized
          if (err?.response?.status === 401) {
            setToken(null)
            setUser(null)
            localStorage.removeItem('sarangtv_token')
            localStorage.removeItem('sarangtv_user')

            setSavedAccounts((prev) => {
              const existing = Array.isArray(prev) ? prev : []
              const updated = existing.map((acc) =>
                acc.token === token ? { ...acc, token: null } : acc
              )
              localStorage.setItem('sarangtv_accounts', JSON.stringify(updated))
              return updated
            })
          }
        }
      }
      setIsLoading(false)
    }

    loadUser()
  }, [token])

  // If initial load had user & token from storage, ensure recorded
  useEffect(() => {
    if (user && token) {
      recordAccount(user, token)
    }
  }, [])

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
      if (token) {
        recordAccount(updated, token)
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
      recordAccount(data.user, data.token)
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
      recordAccount(data.user, data.token)
    }
    return data
  }

  const switchAccount = async (targetIdOrEmail) => {
    const accounts = getStoredAccounts()
    const target = accounts.find(
      (a) =>
        (a.id !== undefined && a.id !== null && String(a.id) === String(targetIdOrEmail)) ||
        (a.email && a.email.toLowerCase() === String(targetIdOrEmail).toLowerCase())
    )

    if (!target || !target.token) {
      return false
    }

    // 1. Clear session chat history of previous user
    try {
      sessionStorage.removeItem('sarangtv_chat_history')
      sessionStorage.removeItem('sarangtv_chat_open')
    } catch {
      // Ignore
    }

    // 2. Validate token with backend before updating active session
    try {
      localStorage.setItem('sarangtv_token', target.token)
      const userData = await authService.getMe()

      const userKey = userData?.id || userData?.email
      let customFields = {}
      if (userKey) {
        try {
          const savedCustom = localStorage.getItem(`sarangtv_profile_${userKey}`)
          if (savedCustom) customFields = JSON.parse(savedCustom)
        } catch {
          // Ignore
        }
      }

      const merged = { ...userData, ...customFields }
      setToken(target.token)
      setUser(merged)
      localStorage.setItem('sarangtv_user', JSON.stringify(merged))
      recordAccount(merged, target.token)
      return true
    } catch (err) {
      // Offline fallback for mock token
      if (!err?.response && target.token === 'mock_dev_token_2026') {
        const targetUser = target.user || {
          id: target.id,
          email: target.email,
          name: target.name,
          avatar: target.avatar,
          avatar_url: target.avatar,
        }
        localStorage.setItem('sarangtv_token', target.token)
        localStorage.setItem('sarangtv_user', JSON.stringify(targetUser))
        setToken(target.token)
        setUser(targetUser)
        recordAccount(targetUser, target.token)
        return true
      }

      // Token invalid or revoked (e.g. 401)
      const targetKey = target.id || target.email
      setSavedAccounts((prev) => {
        const existing = Array.isArray(prev) ? prev : []
        const updated = existing.map((acc) => {
          if (
            (acc.id !== undefined && acc.id !== null && String(acc.id) === String(targetKey)) ||
            (acc.email && acc.email.toLowerCase() === String(targetKey).toLowerCase())
          ) {
            return { ...acc, token: null }
          }
          return acc
        })
        localStorage.setItem('sarangtv_accounts', JSON.stringify(updated))
        return updated
      })

      localStorage.removeItem('sarangtv_token')
      localStorage.removeItem('sarangtv_user')
      setToken(null)
      setUser(null)

      return false
    }
  }

  const removeSavedAccount = (targetIdOrEmail) => {
    setSavedAccounts((prev) => {
      const existing = Array.isArray(prev) ? prev : []
      const updated = existing.filter(
        (a) =>
          String(a.id) !== String(targetIdOrEmail) &&
          (!a.email || a.email.toLowerCase() !== String(targetIdOrEmail).toLowerCase())
      )
      localStorage.setItem('sarangtv_accounts', JSON.stringify(updated))
      return updated
    })
  }

  const logout = async () => {
    const currentKey = user?.id || user?.email
    try {
      if (token) {
        await authService.logout()
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      if (currentKey) {
        setSavedAccounts((prev) => {
          const existing = Array.isArray(prev) ? prev : []
          const updated = existing.map((acc) => {
            if (
              (acc.id !== undefined && acc.id !== null && String(acc.id) === String(currentKey)) ||
              (acc.email && acc.email.toLowerCase() === String(currentKey).toLowerCase())
            ) {
              return { ...acc, token: null }
            }
            return acc
          })
          localStorage.setItem('sarangtv_accounts', JSON.stringify(updated))
          return updated
        })
      }
      setToken(null)
      setUser(null)
      localStorage.removeItem('sarangtv_token')
      localStorage.removeItem('sarangtv_user')
    }
  }

  const setSession = (newToken, newUser) => {
    setToken(newToken)
    setUser(newUser)
    localStorage.setItem('sarangtv_token', newToken)
    localStorage.setItem('sarangtv_user', JSON.stringify(newUser))
    recordAccount(newUser, newToken)
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
    savedAccounts,
    switchAccount,
    removeSavedAccount,
    recordAccount,
    setSession,
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
