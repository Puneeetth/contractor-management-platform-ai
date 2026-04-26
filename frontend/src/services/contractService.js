import axios from 'axios'
import apiClient, { API_BASE_URL } from './apiClient'
import { useAuthStore } from '../hooks/useAuth'

export const contractService = {
  getAllContracts: async () => {
    return apiClient.get('/admin/contracts')
  },

  exportContracts: async (params) => {
    const { token } = useAuthStore.getState()
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/contracts/export`, {
        params,
        responseType: 'blob',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
        const message = await error.response.data.text()
        try {
          const parsed = JSON.parse(message)
          throw new Error(parsed.message || 'Failed to export contracts')
        } catch {
          throw new Error(message || 'Failed to export contracts')
        }
      }
      throw error
    }
  },

  getActiveContractsByContractor: async (contractorId) => {
    return apiClient.get(`/admin/contracts/contractor/${contractorId}/active`)
  },

  createContract: async (contractData) => {
    return apiClient.post('/admin/contracts', contractData)
  },
}
