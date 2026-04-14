import apiClient from './apiClient'

export const timesheetService = {
  getAllTimesheets: async () => {
    return apiClient.get('/timesheets')
  },

  createTimesheet: async (timesheetData) => {
    return apiClient.post('/timesheets', timesheetData)
  },

  getTimesheetsByContractor: async (contractorId) => {
    return apiClient.get(`/timesheets/contractor/${contractorId}`)
  },

  approveTimesheet: async (id) => {
    return apiClient.put(`/timesheets/${id}/approve`)
  },
}
