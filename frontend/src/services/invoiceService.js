import apiClient from './apiClient'

export const invoiceService = {
  getAllInvoices: async () => {
    return apiClient.get('/invoices')
  },

  createInvoice: async (invoiceData) => {
    return apiClient.post('/invoices', invoiceData)
  },

  approveInvoice: async (id) => {
    return apiClient.put(`/invoices/${id}/approve`)
  },

  getInvoicesByContractor: async (contractorId) => {
    return apiClient.get(`/invoices/contractor/${contractorId}`)
  },
}
