import apiClient from './apiClient'

export const bankAccountService = {
  /**
   * Get bank account for current user
   */
  getBankAccount: async (userId) => {
    try {
      return await apiClient.get(`/bank-accounts/user/${userId}`)
    } catch (error) {
      if (error.response?.status === 404) {
        return null
      }
      throw error
    }
  },

  /**
   * Create or update bank account
   */
  saveBankAccount: async (userId, bankAccountData) => {
    return apiClient.post(`/bank-accounts/user/${userId}`, bankAccountData)
  },

  /**
   * Delete bank account
   */
  deleteBankAccount: async (userId) => {
    return apiClient.delete(`/bank-accounts/user/${userId}`)
  },
}
