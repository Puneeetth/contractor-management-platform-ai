import apiClient from './apiClient'

export const adminActivityService = {
  getRecentActivities: async (limit = 10) => {
    return apiClient.get(`/admin/activities?limit=${limit}`)
  },
  
  getAllRecentActivities: async (limit = 10) => {
    return apiClient.get(`/admin/activities/all?limit=${limit}`)
  },
}
