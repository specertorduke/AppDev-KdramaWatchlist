import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Attach token to outgoing requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sarangtv_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Global response error interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401 Unauthorized, clear stale token
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('sarangtv_token')
      localStorage.removeItem('sarangtv_user')
    }
    return Promise.reject(error)
  }
)

export default api
