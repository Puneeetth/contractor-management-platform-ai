import apiClient from './apiClient'

export const adminService = {
  getPendingUsers: async () => {
    return apiClient.get('/admin/users/pending')
  },

  getAllUsers: async (role, status) => {
    let url = '/admin/users'
    const params = []
    if (role) params.push(`role=${role}`)
    if (status) params.push(`status=${status}`)
    if (params.length > 0) url += `?${params.join('&')}`
    return apiClient.get(url)
  },

  approveUser: async (userId, reason) => {
    return apiClient.post(`/admin/users/${userId}/approve`, { approvalReason: reason })
  },

  rejectUser: async (userId, reason) => {
    return apiClient.post(`/admin/users/${userId}/reject`, { rejectionReason: reason })
  },
}
