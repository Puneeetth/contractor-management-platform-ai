import apiClient from './apiClient'

export const poService = {
  createPurchaseOrder: async (poData) => {
  const data = new FormData();

  data.append("poNumber", poData.poNumber);
  data.append("poDate", poData.poDate);
  data.append("startDate", poData.startDate);
  data.append("endDate", poData.endDate);
  data.append("poValue", poData.poValue);
  data.append("currency", poData.currency);
  data.append("paymentTermsDays", poData.paymentTermsDays);
  data.append("customerId", poData.customerId);
  data.append("numberOfResources", poData.numberOfResources);

  if (poData.contractId) {
    data.append("contractId", poData.contractId);
  }

  if (poData.remark) {
    data.append("remark", poData.remark);
  }

  if (poData.sharedWith) {
    data.append("sharedWith", poData.sharedWith);
  }

  if (poData.file) {
    data.append("file", poData.file);
  }

  // 🔥 DEBUG
  for (let pair of data.entries()) {
    console.log(pair[0], pair[1]);
  }

  return apiClient.post('/admin/purchase-orders', data);
},
  getAllPurchaseOrders: async () => {
    return apiClient.get('/admin/purchase-orders')
  },
  getPurchaseOrdersByContractId: async (contractId) => {
    return apiClient.get(`/admin/purchase-orders/contract/${contractId}`)
  },
}
