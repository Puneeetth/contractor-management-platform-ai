import apiClient from './apiClient'

export const authService = {
  login: async (email, password) => {
    // Returns JWT token string
    const response = await apiClient.post('/auth/login', {
      email,
      password,
    })
    return response
  },

  register: async (userData) => {
    // Returns confirmation message
    const response = await apiClient.post('/auth/register', userData)
    return response
  },

  logout: async () => {
    // Frontend only - clear local storage
    return Promise.resolve()
  },
}
