import apiClient from './apiClient'

export const poService = {
  getAllPurchaseOrders: async () => {
    return apiClient.get('/admin/purchase-orders')
  },

  createPurchaseOrder: async (poData) => {
    return apiClient.post('/admin/purchase-orders', poData)
  },

  getPurchaseOrdersByContractId: async (contractId) => {
    return apiClient.get(`/admin/purchase-orders/contract/${contractId}`)
  },
}
