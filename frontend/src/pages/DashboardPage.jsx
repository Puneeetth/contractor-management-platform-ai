import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Wallet,
  UserPlus,
  FileText,
  PlusCircle,
  Download,
  ChevronRight,
} from 'lucide-react'
import { DashboardLayout } from '../components/layout'
import { Loader } from '../components/ui'
import { contractService, contractorService } from '../services/contractorService'
import { customerService } from '../services/customerService'
import { expenseService } from '../services/expenseService'
import { invoiceService } from '../services/invoiceService'
import { poService } from '../services/poService'
import { useAuth } from '../hooks/useAuth'
import { formatters } from '../utils/formatters'
import { downloadTablePdf } from '../utils/pdfExport'

const DEFAULT_STATS = {
  activeContractors: 0,
  pendingApprovals: 0,
  monthlyExpenses: 0,
  contractorDeltaLabel: 'No change',
  pendingApprovalsLabel: 'Awaiting Review',
  monthlyBudgetLabel: 'Budget $0',
}

const formatCompactCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number(value) || 0)
}

const getValidDate = (...values) => {
  for (const value of values) {
    if (!value) continue
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) return date
  }
  return null
}

const getContractorCreatedDate = (contractor) =>
  getValidDate(
    contractor?.createdDate,
    contractor?.createdAt,
    contractor?.dateCreated,
    contractor?.registeredAt,
    contractor?.registrationDate,
    contractor?.joinedDate
  )

const formatDeltaLabel = (currentCount, previousCount) => {
  if (previousCount <= 0) {
    return currentCount > 0 ? `${currentCount} new this month` : 'No change'
  }

  const deltaPercent = Math.round(((currentCount - previousCount) / previousCount) * 100)
  if (deltaPercent > 0) return `+${deltaPercent}% vs last month`
  if (deltaPercent < 0) return `${deltaPercent}% vs last month`
  return 'No change'
}

const DashboardPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [isExportingPos, setIsExportingPos] = useState(false)
  const [isExportingContracts, setIsExportingContracts] = useState(false)
  const [stats, setStats] = useState(DEFAULT_STATS)
  const currentHour = new Date().getHours()
  const greeting =
    currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening'
  const displayName = user?.name || user?.fullName || user?.username || user?.email?.split('@')[0] || 'Admin'

  useEffect(() => {
    let isMounted = true

    const loadDashboardStats = async () => {
      if (user?.role !== 'ADMIN') {
        if (isMounted) {
          setStats(DEFAULT_STATS)
          setIsLoading(false)
        }
        return
      }

      try {
        if (isMounted) setIsLoading(true)

        const [contractors, contracts, invoices, expenses] = await Promise.all([
          contractorService.getAllContractors(),
          contractService.getAllContracts(),
          invoiceService.getAllInvoices(),
          expenseService.getAllExpenses(),
        ])

        const contractorList = Array.isArray(contractors) ? contractors : []
        const contractList = Array.isArray(contracts) ? contracts : []
        const invoiceList = Array.isArray(invoices) ? invoices : []
        const expenseList = Array.isArray(expenses) ? expenses : []
        const now = new Date()
        const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

        const currentMonthContractors = contractorList.filter((contractor) => {
          const createdDate = getContractorCreatedDate(contractor)
          return createdDate && createdDate >= startOfCurrentMonth && createdDate < startOfNextMonth
        }).length

        const previousMonthContractors = contractorList.filter((contractor) => {
          const createdDate = getContractorCreatedDate(contractor)
          return createdDate && createdDate >= startOfPreviousMonth && createdDate < startOfCurrentMonth
        }).length

        const pendingApprovalCount = invoiceList.filter(
          (invoice) => invoice.adminApprovalStatus === 'PENDING' && invoice.status !== 'REJECTED'
        ).length

        const monthlyExpenseValue = expenseList.reduce(
          (sum, expense) => sum + (Number(expense.amount) || 0),
          0
        )

        const currentBudgetValue = contractList.reduce((sum, contract) => {
          const startDate = getValidDate(contract?.startDate)
          const endDate = getValidDate(contract?.endDate)
          const overlapsCurrentMonth =
            (!startDate || startDate < startOfNextMonth) &&
            (!endDate || endDate >= startOfCurrentMonth)

          return overlapsCurrentMonth ? sum + (Number(contract.estimatedBudget) || 0) : sum
        }, 0)

        if (isMounted) {
          setStats({
            activeContractors: contractorList.length,
            pendingApprovals: pendingApprovalCount,
            monthlyExpenses: monthlyExpenseValue,
            contractorDeltaLabel: formatDeltaLabel(currentMonthContractors, previousMonthContractors),
            pendingApprovalsLabel:
              pendingApprovalCount > 0
                ? `${pendingApprovalCount} awaiting review`
                : 'No pending approvals',
            monthlyBudgetLabel: `Budget ${formatCompactCurrency(currentBudgetValue)}`,
          })
        }
      } catch (error) {
        if (isMounted) {
          setStats(DEFAULT_STATS)
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadDashboardStats()
    const refreshInterval = window.setInterval(loadDashboardStats, 30000)
    const handleWindowFocus = () => loadDashboardStats()
    window.addEventListener('focus', handleWindowFocus)

    return () => {
      isMounted = false
      window.clearInterval(refreshInterval)
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [user?.role])

  const statCards = [
    {
      icon: UserPlus,
      iconWrap: 'bg-[#eef1ff] text-[#3e57d8]',
      topTag: stats.contractorDeltaLabel,
      topTagClass: 'text-[#1560b5]',
      label: 'ACTIVE CONTRACTORS',
      value: stats.activeContractors.toLocaleString('en-US'),
    },
    {
      icon: FileText,
      iconWrap: 'bg-[#f0f3f8] text-[#6f7d93]',
      topTag: stats.pendingApprovalsLabel,
      topTagClass: 'text-[#b42348]',
      label: 'PENDING APPROVALS',
      value: stats.pendingApprovals.toLocaleString('en-US'),
    },
    {
      icon: Wallet,
      iconWrap: 'bg-[#ebf4ff] text-[#1778b4]',
      topTag: stats.monthlyBudgetLabel,
      topTagClass: 'text-[#0f4068]',
      label: 'MONTHLY EXPENSES',
      value: formatCompactCurrency(stats.monthlyExpenses),
    },
  ]

  const handleExportPosPdf = async () => {
    try {
      setIsExportingPos(true)
      const [pos, customers] = await Promise.all([
        poService.getAllPurchaseOrders(),
        customerService.getAllCustomers(),
      ])

      const customerNameById = (Array.isArray(customers) ? customers : []).reduce((lookup, customer) => {
        lookup[String(customer.id)] = customer.name
        return lookup
      }, {})

      const rows = (Array.isArray(pos) ? pos : []).map((po) => ({
        poNumber: po.poNumber || '-',
        customer: customerNameById[String(po.customerId)] || `Customer #${po.customerId || '-'}`,
        poDate: formatters.formatDate(po.poDate),
        period: `${formatters.formatDate(po.startDate)} - ${formatters.formatDate(po.endDate)}`,
        value: formatters.formatCurrency(po.poValue || 0, po.currency || 'USD'),
        resources: String(po.numberOfResources || 0),
      }))

      downloadTablePdf({
        title: 'Purchase Orders Report',
        filename: `purchase-orders-${new Date().toISOString().slice(0, 10)}.pdf`,
        columns: [
          { key: 'poNumber', label: 'PO Number', width: 0.16 },
          { key: 'customer', label: 'Customer', width: 0.24 },
          { key: 'poDate', label: 'PO Date', width: 0.14 },
          { key: 'period', label: 'Project Period', width: 0.24 },
          { key: 'value', label: 'PO Value', width: 0.14 },
          { key: 'resources', label: 'Resources', width: 0.08 },
        ],
        rows: rows.length > 0 ? rows : [{
          poNumber: 'No data',
          customer: '-',
          poDate: '-',
          period: '-',
          value: '-',
          resources: '-',
        }],
      })
    } finally {
      setIsExportingPos(false)
    }
  }

  const handleExportContractsPdf = async () => {
    try {
      setIsExportingContracts(true)
      const [contracts, contractors, customers] = await Promise.all([
        contractService.getAllContracts(),
        contractorService.getAllContractors(),
        customerService.getAllCustomers(),
      ])

      const contractorNameById = (Array.isArray(contractors) ? contractors : []).reduce((lookup, contractor) => {
        lookup[String(contractor.id)] = contractor.name
        lookup[String(contractor.userId)] = contractor.name
        return lookup
      }, {})

      const customerNameById = (Array.isArray(customers) ? customers : []).reduce((lookup, customer) => {
        lookup[String(customer.id)] = customer.name
        return lookup
      }, {})

      const rows = (Array.isArray(contracts) ? contracts : []).map((contract) => ({
        contractor: contract.contractorName || contractorNameById[String(contract.contractorId)] || `Contractor #${contract.contractorId || '-'}`,
        customer: customerNameById[String(contract.customerId)] || `Customer #${contract.customerId || '-'}`,
        poRef: contract.poAllocation || `Contract #${contract.id || '-'}`,
        startDate: formatters.formatDate(contract.startDate),
        endDate: formatters.formatDate(contract.endDate),
        billRate: formatters.formatCurrency(contract.billRate || 0),
        payRate: formatters.formatCurrency(contract.payRate || 0),
      }))

      downloadTablePdf({
        title: 'Contracts Report',
        filename: `contracts-${new Date().toISOString().slice(0, 10)}.pdf`,
        columns: [
          { key: 'contractor', label: 'Contractor', width: 0.2 },
          { key: 'customer', label: 'Customer', width: 0.2 },
          { key: 'poRef', label: 'PO / Contract Ref', width: 0.17 },
          { key: 'startDate', label: 'Start Date', width: 0.11 },
          { key: 'endDate', label: 'End Date', width: 0.11 },
          { key: 'billRate', label: 'Bill Rate', width: 0.11 },
          { key: 'payRate', label: 'Pay Rate', width: 0.1 },
        ],
        rows: rows.length > 0 ? rows : [{
          contractor: 'No data',
          customer: '-',
          poRef: '-',
          startDate: '-',
          endDate: '-',
          billRate: '-',
          payRate: '-',
        }],
      })
    } finally {
      setIsExportingContracts(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex min-h-full flex-col gap-3 text-[#111827]">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader message="Loading dashboard..." />
          </div>
        ) : (
          <>
            <div className="mb-1 flex items-center gap-2 text-[18px] font-bold tracking-[-0.02em] text-[#0f2238]">
              <span>{greeting},</span>
              <span className="bg-gradient-to-r from-[#2f56d6] via-[#4f7cff] to-[#8ec5ff] bg-clip-text text-transparent">
                {displayName}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {statCards.map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.label}
                    className="flex h-[72px] min-w-0 items-center rounded-2xl border border-[#dbe3ef] bg-white px-4 py-2.5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
                  >
                    <div className="flex w-full min-w-0 items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className={`rounded-2xl p-2 ${item.iconWrap}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <p className="truncate text-[9px] font-bold tracking-[0.14em] text-[#6a7588]">{item.label}</p>
                          <p className="text-[18px] leading-none font-bold tracking-[-0.02em] text-[#0f2238]">{item.value}</p>
                        </div>
                      </div>
                      <span className={`shrink-0 text-[9px] font-semibold ${item.topTagClass}`}>{item.topTag}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_270px]">
              <div className="flex flex-col rounded-[26px] border border-[#d7e0ec] bg-white px-6 py-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-[16px] font-bold tracking-[-0.02em] text-[#1f2a3d]">Recent Activity</h2>
                  <button className="text-[12px] font-semibold text-[#3155d7] hover:underline">View All</button>
                </div>
                <div className="flex min-h-[210px] items-center justify-center rounded-2xl border border-dashed border-[#dbe3ef] bg-[#fafcff] px-6 py-6 text-center">
                  <div>
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#eef3ff] text-[#4b4fe8]">
                      <FileText className="h-4 w-4" />
                    </div>
                    <p className="text-[13px] font-semibold text-[#1f2a3d]">No recent activity yet</p>
                    <p className="mt-1 text-[11px] text-[#7a8699]">Real dashboard activity will appear here when updates are available.</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-rows-[0.88fr_1fr]">
                <div className="rounded-[26px] border border-[#d7e0ec] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                  <h3 className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#6f7d93]">Quick Directives</h3>
                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={() => navigate('/contractors', { state: { openAddContractor: true } })}
                      className="flex w-full items-center justify-between rounded-2xl bg-[#3f57d8] px-4 py-2.5 text-white"
                    >
                      <span className="flex items-center gap-2.5">
                        <PlusCircle className="h-4 w-4" />
                        <span className="text-[12.5px] font-bold">Onboard Contractor</span>
                      </span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleExportPosPdf}
                      disabled={isExportingPos}
                      className="flex w-full items-center justify-between rounded-2xl bg-[#edf2f7] px-4 py-2.5 text-[#4f5d73] disabled:opacity-60"
                    >
                      <span className="flex items-center gap-2.5">
                        <Download className="h-4 w-4" />
                        <span className="text-[12.5px] font-bold">{isExportingPos ? 'Exporting PO PDF...' : "Export PO's"}</span>
                      </span>
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleExportContractsPdf}
                      disabled={isExportingContracts}
                      className="flex w-full items-center justify-between rounded-2xl bg-[#edf2f7] px-4 py-2.5 text-[#4f5d73] disabled:opacity-60"
                    >
                      <span className="flex items-center gap-2.5">
                        <Download className="h-4 w-4" />
                        <span className="text-[12.5px] font-bold">{isExportingContracts ? 'Exporting Contracts PDF...' : 'Export Contracts'}</span>
                      </span>
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="rounded-[26px] border border-[#d7e0ec] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                  <div className="mb-3.5 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#2c6ac3]" />
                    <h3 className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#6f7d93]">System Integrity</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="mb-1 flex items-center justify-between text-[10px] font-semibold text-[#3d4b61]">
                        <span>Project Completion Rate</span>
                        <span>94.2%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#d8e3fb]">
                        <div className="h-1.5 w-[94.2%] rounded-full bg-[#2d5fd7]" />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between text-[10px] font-semibold text-[#3d4b61]">
                        <span>Compliance Health</span>
                        <span>88.5%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#d8e3fb]">
                        <div className="h-1.5 w-[88.5%] rounded-full bg-[#2d5fd7]" />
                      </div>
                    </div>
                    <div className="rounded-2xl bg-[#eef3ff] px-4 py-3">
                      <p className="text-[9.5px] font-semibold leading-5 text-[#60708a]">
                        <span className="font-bold text-[#2d5fd7]">PRO TIP:</span> High contractor churn detected in Structural Team. Consider reviewing PO processing lead times.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

export default DashboardPage
