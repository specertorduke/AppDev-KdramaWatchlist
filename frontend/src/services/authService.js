import api from './api.js'

export const authService = {
  async sendSignupOtp({ email, name, password }) {
    const payload = { email, name }
    if (password) payload.password = password
    const response = await api.post('/auth/send-signup-otp', payload)
    return response.data
  },

  async register({ name, username, email, password, password_confirmation, terms_privacy_accepted, otp, device_name }) {
    const response = await api.post('/auth/register', {
      name,
      username,
      email,
      password,
      password_confirmation,
      terms_privacy_accepted,
      otp,
      device_name,
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

  async updateProfile({ name, username, avatar, avatar_url }) {
    const payload = {}
    if (name !== undefined) payload.name = name
    if (username !== undefined) payload.username = username
    if (avatar_url !== undefined) payload.avatar_url = avatar_url
    if (avatar !== undefined) payload.avatar = avatar

    try {
      const response = await api.put('/user/profile', payload)
      return response.data
    } catch {
      // Offline / fallback support
      return payload
    }
  },

  async requestEmailChange({ new_email, password }) {
    const response = await api.post('/user/email/request-change', {
      new_email,
      password,
    })
    return response.data
  },

  async verifyEmailChange({ new_email, otp }) {
    const response = await api.post('/user/email/verify-change', {
      new_email,
      otp,
    })
    return response.data
  },

  async deleteAccount({ current_password }) {
    const response = await api.delete('/user', {
      data: { current_password },
    })
    return response.data
  },

  async updateUserPreferences(favoriteGenres) {
    const response = await api.patch('/user/preferences', {
      favorite_genres: favoriteGenres,
    })
    return response.data
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

  async checkAvailability(field, value) {
    const response = await api.get('/auth/check-availability', { params: { field, value } })
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
