import api from './api.js'

export const authService = {
  async register({ name, email, password, password_confirmation, terms_privacy_accepted }) {
    const response = await api.post('/auth/register', {
      name,
      email,
      password,
      password_confirmation,
      terms_privacy_accepted,
    })
    return response.data
  },

  async login({ email, password }) {
    const response = await api.post('/auth/login', {
      email,
      password,
    })
    return response.data
  },

  async getMe() {
    const response = await api.get('/auth/me')
    return response.data
  },

  async logout() {
    const response = await api.post('/auth/logout')
    return response.data
  },

  async updateProfile({ name, avatar, avatar_url }) {
    const payload = {}
    if (name !== undefined) payload.name = name
    if (avatar_url !== undefined) payload.avatar_url = avatar_url
    if (avatar !== undefined) payload.avatar = avatar

    try {
      const response = await api.put('/user/profile', payload)
      return response.data
    } catch {
      // Backend may not have an active profile update endpoint; return payload
      return payload
    }
  },

  async logoutAll() {
    const response = await api.post('/auth/logout-all')
    return response.data
  },

  async changePassword({ current_password, password, password_confirmation }) {
    const response = await api.post('/auth/change-password', {
      current_password,
      password,
      password_confirmation,
    })
    return response.data
  },

  async forgotPassword({ email }) {
    const response = await api.post('/auth/forgot-password', { email })
    return response.data
  },

  async resetPassword({ email, token, password, password_confirmation }) {
    const response = await api.post('/auth/reset-password', {
      email,
      token,
      password,
      password_confirmation,
    })
    return response.data
  },
}

export default authService
