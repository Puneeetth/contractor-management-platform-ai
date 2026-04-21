import apiClient from './apiClient'

export const invoiceService = {
  getAllInvoices: async () => {
    return apiClient.get('/invoices')
  },

  createInvoice: async (invoiceData) => {
    const formData = new FormData()
    formData.append('contractorId', invoiceData.contractorId)
    formData.append('invoiceMonth', invoiceData.invoiceMonth)
    formData.append('amount', invoiceData.amount)

    if (invoiceData.invoiceFile) {
      formData.append('invoiceFile', invoiceData.invoiceFile)
    }
    if (invoiceData.timesheetFile) {
      formData.append('timesheetFile', invoiceData.timesheetFile)
    }

    return apiClient.post('/invoices', formData)
  },

  approveInvoice: async (id) => {
    return apiClient.put(`/invoices/${id}/approve`)
  },

  getInvoicesByContractor: async (contractorId) => {
    return apiClient.get(`/invoices/contractor/${contractorId}`)
  },
}
