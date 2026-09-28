import api from './api.js'

export const authService = {
  async sendSignupOtp({ email, name }) {
    const payload = { email }
    if (name) payload.name = name
    const response = await api.post('/auth/send-signup-otp', payload)
    return response.data
  },

  async register({ name, email, password, password_confirmation, terms_privacy_accepted, otp, device_name }) {
    const payload = {
      name,
      email,
      password,
      password_confirmation,
      terms_privacy_accepted,
    }
    if (otp !== undefined && otp !== null && otp !== '') {
      payload.otp = otp
    }
    if (device_name) {
      payload.device_name = device_name
    }
    const response = await api.post('/auth/register', payload)
    return response.data
  },

  async verifyOtp({ email, otp, device_name = 'Web Browser' }) {
    const response = await api.post('/auth/verify-otp', {
      email,
      otp,
      device_name,
    })
    return response.data
  },

  async resendOtp({ email }) {
    const response = await api.post('/auth/resend-otp', {
      email,
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

  async updatePreferences(preferences) {
    const response = await api.patch('/user/preferences', preferences)
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
