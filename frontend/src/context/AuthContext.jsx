import { createContext, useContext, useEffect, useState } from 'react'
import authService from '../services/authService.js'

const AuthContext = createContext(null)
const DEFAULT_PROFILE_AVATAR = '/default-profile.svg'

const withDefaultProfileAvatar = (accountUser) => {
  if (!accountUser) return accountUser

  const avatar = accountUser.avatar || accountUser.avatar_url || DEFAULT_PROFILE_AVATAR
  return {
    ...accountUser,
    avatar,
    avatar_url: accountUser.avatar_url || avatar,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sarangtv_user')
    return saved ? JSON.parse(saved) : null
  })
  const [token, setToken] = useState(() => localStorage.getItem('sarangtv_token'))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    localStorage.removeItem('sarangtv_accounts')

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
          const merged = withDefaultProfileAvatar({ ...userData, ...customFields })
          setUser(merged)
          localStorage.setItem('sarangtv_user', JSON.stringify(merged))
        } catch (err) {
          // Invalidate token only if explicitly 401 Unauthorized
          if (err?.response?.status === 401) {
            setToken(null)
            setUser(null)
            localStorage.removeItem('sarangtv_token')
            localStorage.removeItem('sarangtv_user')
          }
        }
      }
      setIsLoading(false)
    }

    loadUser()
  }, [token])

  const updateProfile = async ({ name, username, avatar, avatarIcon, color, avatarType, avatar_url }) => {
    const payload = {}
    if (name !== undefined) payload.name = name
    if (username !== undefined) payload.username = username
    if (avatar !== undefined || avatar_url !== undefined) {
      const resolvedAvatar = avatar ?? avatar_url
      payload.avatar = resolvedAvatar
      payload.avatar_url = resolvedAvatar
    }

    let apiResult = null
    if (Object.keys(payload).length > 0) {
      try {
        apiResult = await authService.updateProfile(payload)
      } catch {
        // Offline fallback
      }
    }

    setUser((prev) => {
      const updated = {
        ...(prev || {}),
        ...(apiResult?.user || (apiResult?.id ? apiResult : {})),
        ...(name !== undefined ? { name } : {}),
        ...(username !== undefined ? { username } : {}),
        ...(avatar !== undefined || avatar_url !== undefined ? { avatar: avatar ?? avatar_url, avatar_url: avatar ?? avatar_url } : {}),
        ...(avatarIcon !== undefined ? { avatarIcon } : {}),
        ...(color !== undefined ? { color } : {}),
        ...(avatarType !== undefined ? { avatarType } : {}),
      }
      localStorage.setItem('sarangtv_user', JSON.stringify(updated))
      const userKey = updated?.id || updated?.email
      if (userKey) {
        localStorage.setItem(
          `sarangtv_profile_${userKey}`,
          JSON.stringify({
            name: updated.name,
            username: updated.username,
            avatar: updated.avatar || updated.avatar_url,
            avatar_url: updated.avatar || updated.avatar_url,
            avatarIcon: updated.avatarIcon,
            color: updated.color,
            avatarType: updated.avatarType,
          })
        )
      }
      return updated
    })

    return true
  }

  const updateUserPreferences = async ({ favoriteGenres }) => {
    try {
      await authService.updateUserPreferences(favoriteGenres)
    } catch {
      return false
    }

    const updatedUser = { ...user, favorite_genres: favoriteGenres }
    setUser(updatedUser)
    localStorage.setItem('sarangtv_user', JSON.stringify(updatedUser))
    return true
  }

  const updateUserEmail = async (newEmail) => {
    if (!user) return
    const updatedUser = {
      ...user,
      email: newEmail,
    }
    setUser(updatedUser)
    localStorage.setItem('sarangtv_user', JSON.stringify(updatedUser))

  }

  const deleteAccount = async (currentPassword) => {
    try {
      await authService.deleteAccount({ current_password: currentPassword })

      setToken(null)
      setUser(null)
      localStorage.removeItem('sarangtv_token')
      localStorage.removeItem('sarangtv_user')
      return { success: true }
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.errors?.current_password?.[0] ||
        'Failed to delete account. Please verify your password.'
      return { success: false, error: msg }
    }
  }

  const login = async (credentials) => {
    const data = await authService.login(credentials)
    if (data.token) {
      const userWithAvatar = withDefaultProfileAvatar(data.user)
      setToken(data.token)
      setUser(userWithAvatar)
      localStorage.setItem('sarangtv_token', data.token)
      localStorage.setItem('sarangtv_user', JSON.stringify(userWithAvatar))
    }
    return data
  }

  const register = async (userData) => {
    const data = await authService.register(userData)
    if (data.token) {
      const userWithAvatar = withDefaultProfileAvatar(data.user)
      setToken(data.token)
      setUser(userWithAvatar)
      localStorage.setItem('sarangtv_token', data.token)
      localStorage.setItem('sarangtv_user', JSON.stringify(userWithAvatar))
    }
    return data
  }

  const sendSignupOtp = (data) => authService.sendSignupOtp(data)

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

  const setSession = (newToken, newUser) => {
    const userWithAvatar = withDefaultProfileAvatar(newUser)
    setToken(newToken)
    setUser(userWithAvatar)
    localStorage.setItem('sarangtv_token', newToken)
    localStorage.setItem('sarangtv_user', JSON.stringify(userWithAvatar))
  }

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token),
    isLoading,
    login,
    register,
    sendSignupOtp,
    logout,
    updateProfile,
    updateUserPreferences,
    updateUserEmail,
    deleteAccount,
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
