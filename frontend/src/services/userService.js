import apiClient from './apiClient'

export const userService = {
  // Get current user info from token
 getCurrentUser: async () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) return null

    // ✅ validate JWT format before decoding
    if (!token.includes('.')) return null

    const base64Payload = token.split('.')[1]
    const payload = JSON.parse(atob(base64Payload))

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
