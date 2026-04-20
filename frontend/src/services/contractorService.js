import apiClient from './apiClient'

export const contractService = {
  getAllContracts: async () => {
    return apiClient.get('/admin/contracts')
  },

  createContract: async (contractData) => {
    return apiClient.post('/admin/contracts', contractData)
  },
}

export const contractorService = {
  getAllContractors: async () => {
    return apiClient.get('/contractors')
  },

  createContractor: async (contractorData) => {
    return apiClient.post('/admin/contractors/create', contractorData)
  },
}
