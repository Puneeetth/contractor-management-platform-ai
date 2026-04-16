import apiClient from './apiClient'
import { decodeJwtPayload } from '../utils/jwt'

export const userService = {
  getCurrentUser: async () => {
    try {
      const authStoreRaw = localStorage.getItem('auth-store')
      if (!authStoreRaw) return null

      const persisted = JSON.parse(authStoreRaw)
      const token = persisted?.state?.token
      const payload = decodeJwtPayload(token)

      if (!payload) return null

      return {
        id: payload.userId || payload.id,
        email: payload.email,
        name: payload.name,
        role: payload.role,
        status: payload.status,
      }
    } catch (error) {
      console.error('Error parsing token:', error)
      return null
    }
  },

  refreshUserData: async () => {
    try {
      const response = await apiClient.get('/auth/me')
      return response
    } catch (error) {
      console.error('Error refreshing user data:', error)
      return null
    }
  },
}
