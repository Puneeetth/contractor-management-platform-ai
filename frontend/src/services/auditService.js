import apiClient from './apiClient'

export const auditService = {
  getAuditLogs: async (params = {}) => {
    return apiClient.get('/admin/audit/logs', { params })
  },

  getWorkflowEvents: async (params = {}) => {
    return apiClient.get('/admin/audit/workflow', { params })
  },
}

export default auditService
