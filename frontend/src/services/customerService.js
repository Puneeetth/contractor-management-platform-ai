import apiClient from './apiClient'

export const customerService = {
  getAllCustomers: async () => {
    return apiClient.get('/admin/customers')
  },

  createCustomer: async (customerData) => {
    const formData = new FormData()
    Object.keys(customerData).forEach((key) => {
      if (key === 'msaFile') {
        if (customerData[key]) formData.append('msaFile', customerData[key])
      } else if (customerData[key] !== null && customerData[key] !== undefined) {
        formData.append(key, customerData[key])
      }
    })
    return apiClient.post('/admin/customers', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  updateCustomer: async (id, customerData) => {
    const formData = new FormData()
    Object.keys(customerData).forEach((key) => {
      if (key === 'msaFile') {
        if (customerData[key]) formData.append('msaFile', customerData[key])
      } else if (customerData[key] !== null && customerData[key] !== undefined) {
        formData.append(key, customerData[key])
      }
    })
    return apiClient.put(`/admin/customers/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
