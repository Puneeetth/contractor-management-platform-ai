import apiClient from './apiClient'

export const bankDetailsService = {
  getMyBankDetails: () => apiClient.get('/bank-details/me'),

  saveMyBankDetails: (data) => apiClient.post('/bank-details/me', data),

  getBankDetailsByUserId: (userId) => apiClient.get(`/bank-details/user/${userId}`),
}
