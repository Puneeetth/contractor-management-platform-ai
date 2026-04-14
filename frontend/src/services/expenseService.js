import apiClient from './apiClient'

export const expenseService = {
  getAllExpenses: async () => {
    return apiClient.get('/expenses')
  },

  createExpense: async (contractorId, expenseData) => {
    return apiClient.post(`/expenses?contractorId=${contractorId}`, expenseData)
  },

  approveExpense: async (id) => {
    return apiClient.put(`/expenses/${id}/approve`)
  },

  getExpensesByContractor: async (contractorId) => {
    return apiClient.get(`/expenses/contractor/${contractorId}`)
  },
}
