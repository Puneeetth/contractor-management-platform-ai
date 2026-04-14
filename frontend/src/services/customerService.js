import apiClient from './apiClient'

export const customerService = {
  getAllCustomers: async () => {
    return apiClient.get('/admin/customers')
  },

  createCustomer: async (customerData) => {
    return apiClient.post('/admin/customers', customerData)
  },
}
