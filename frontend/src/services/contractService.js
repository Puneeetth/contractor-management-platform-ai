import apiClient from './apiClient'

export const contractService = {
  getAllContracts: async () => {
    return apiClient.get('/admin/contracts')
  },

  getActiveContractsByContractor: async (contractorId) => {
    return apiClient.get(`/admin/contracts/contractor/${contractorId}/active`)
  },

  createContract: async (contractData) => {
    return apiClient.post('/admin/contracts', contractData)
  },
}
