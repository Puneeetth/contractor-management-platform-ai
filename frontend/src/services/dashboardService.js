import apiClient from './apiClient'

export const dashboardService = {
  // Fetch contractor dashboard stats
  getContractorStats: async () => {
    try {
      const response = await apiClient.get('/dashboard/stats')
      return response
    } catch {
      // Fallback: calculate stats from individual endpoints
      return dashboardService.calculateFallbackStats()
    }
  },

  // Fallback stats calculation from existing APIs
  calculateFallbackStats: async () => {
    const [contracts, invoices, timesheets, pos] = await Promise.allSettled([
      apiClient.get('/admin/contracts').catch(() => ({ data: [] })),
      apiClient.get('/invoices').catch(() => ({ data: [] })),
      apiClient.get('/timesheets').catch(() => ({ data: [] })),
      apiClient.get('/admin/purchase-orders').catch(() => ({ data: [] })),
    ])

    const contractList = contracts.status === 'fulfilled' ? (contracts.value.data || []) : []
    const invoiceList = invoices.status === 'fulfilled' ? (invoices.value.data || []) : []
    const timesheetList = timesheets.status === 'fulfilled' ? (timesheets.value.data || []) : []
    const poList = pos.status === 'fulfilled' ? (pos.value.data || []) : []

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const activeContracts = contractList.filter(
      (c) => String(c?.status || '').toUpperCase() === 'ACTIVE'
    )

    const activeContractValue = activeContracts.reduce(
      (sum, c) => sum + (Number(c.estimatedBudget) || Number(c.value) || 0),
      0
    )

    const monthlyEarnings = invoiceList
      .filter((inv) => {
        const invDate = new Date(inv.createdAt || inv.invoiceDate || inv.date)
        return (
          invDate.getMonth() === currentMonth &&
          invDate.getFullYear() === currentYear &&
          String(inv.status || '').toUpperCase() === 'APPROVED'
        )
      })
      .reduce((sum, inv) => sum + (Number(inv.amount) || Number(inv.total) || 0), 0)

    const pendingInvoices = invoiceList.filter(
      (inv) => String(inv.adminApprovalStatus || inv.status || '').toUpperCase() === 'PENDING'
    ).length

    const pendingTimesheets = timesheetList.filter(
      (ts) => String(ts.status || '').toUpperCase() === 'PENDING'
    ).length

    const poValue = poList.reduce(
      (sum, po) => sum + (Number(po.poValue) || 0),
      0
    )

    return {
      activeContracts: activeContracts.length,
      totalContractValue: activeContractValue,
      monthlyEarnings,
      pendingApprovals: pendingInvoices + pendingTimesheets,
      pendingInvoices,
      pendingTimesheets,
      poValue,
      currency: 'USD',
    }
  },

  // Fetch alerts for attention needed section
  getContractorAlerts: async () => {
    try {
      const response = await apiClient.get('/dashboard/alerts')
      return response
    } catch {
      // Fallback alerts from contracts data
      const contracts = await apiClient.get('/admin/contracts').catch(() => ({ data: [] }))
      const contractList = contracts.data || []
      const now = new Date()
      const nextThirtyDays = new Date(now)
      nextThirtyDays.setDate(nextThirtyDays.getDate() + 30)

      const alerts = []

      contractList.forEach((contract) => {
        const endDate = new Date(contract.endDate || contract.endDateStr)
        if (endDate >= now && endDate <= nextThirtyDays) {
          const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))
          alerts.push({
            id: `contract-expiring-${contract.id}`,
            type: 'urgent',
            title: 'Contract Expiring Soon',
            description: `${contract.name || contract.title} expires in ${daysLeft} days`,
            icon: 'alert-triangle',
          })
        }
      })

      return { alerts }
    }
  },
}

export default dashboardService
