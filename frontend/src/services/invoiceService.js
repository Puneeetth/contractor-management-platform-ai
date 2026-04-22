import apiClient from './apiClient'

export const invoiceService = {

  getAllInvoices: async () => {
    return apiClient.get('/invoices')
  },

  createInvoice: async (invoiceData) => {
    const formData = new FormData()

    formData.append('contractorId', invoiceData.contractorId)
    formData.append('invoiceMonth', invoiceData.invoiceMonth)
    formData.append('totalHours', invoiceData.totalHours)
    formData.append('taxPercentage', invoiceData.taxPercentage)

    if (invoiceData.invoiceFile) {
      formData.append('invoiceFile', invoiceData.invoiceFile)
    }

    if (invoiceData.timesheetFile) {
      formData.append('timesheetFile', invoiceData.timesheetFile)
    }

    return apiClient.post('/invoices', formData)
  },

  // ✅ NEW API (important)
  getContractorRate: async (contractorId) => {
    return apiClient.get(`/invoices/contractor/${contractorId}/rate`)
  },

  approveInvoice: async (id) => {
    return apiClient.put(`/invoices/${id}/approve`)
  },

  approveInvoiceByAdmin: async (id) => {
    return apiClient.put(`/invoices/${id}/approve/admin`)
  },

  approveInvoiceByFinance: async (id) => {
    return apiClient.put(`/invoices/${id}/approve/finance`)
  },

  getInvoicesByContractor: async (contractorId) => {
    return apiClient.get(`/invoices/contractor/${contractorId}`)
  },
}