import apiClient from './apiClient'

export const userService = {
  // Get current user info from token
  getCurrentUser: async () => {
    try {
      // Decode JWT token to get user info (without making an API call)
      const token = localStorage.getItem('token')
      if (!token) return null
      
      // Parse JWT payload
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.user || payload
    } catch (error) {
      console.error('Error parsing token:', error)
      return null
    }
  },

  // Refresh user data from server if needed
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
