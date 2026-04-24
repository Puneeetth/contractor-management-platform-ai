import axios from 'axios'
import { useAuthStore } from '../hooks/useAuth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8080/api')
const API_ORIGIN = (() => {
  try {
    return new URL(API_BASE_URL, window.location.origin).origin
  } catch {
    return window.location.origin
  }
})()

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
  },
})

// Request interceptor - Add JWT token to headers
apiClient.interceptors.request.use(
  (config) => {
    const { token } = useAuthStore.getState()

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 🔥 FIX: let browser set multipart boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - logout
      useAuthStore.getState().logout()
    }
    return Promise.reject(error.response?.data || error.message)
  }
)

export { API_BASE_URL, API_ORIGIN }
export default apiClient
