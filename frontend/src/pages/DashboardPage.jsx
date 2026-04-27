import React, { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Wallet,
  UserPlus,
  FileText,
  PlusCircle,
  Download,
  ChevronRight,
  Eye,
  EyeOff,
} from 'lucide-react'
import ContractExportModal from '../components/contracts/ContractExportModal'
import { DashboardLayout } from '../components/layout'
import { Button, Loader, Modal } from '../components/ui'
import { contractService, contractorService } from '../services/contractorService'
import { customerService } from '../services/customerService'
import { expenseService } from '../services/expenseService'
import { invoiceService } from '../services/invoiceService'
import { poService } from '../services/poService'
import { useAuth } from '../hooks/useAuth'
import { formatters } from '../utils/formatters'
import { validators } from '../utils/validators'

const DEFAULT_STATS = {
  activeContractors: 0,
  pendingApprovals: 0,
  monthlyExpenses: 0,
  contractorDeltaLabel: 'No change',
  pendingApprovalsLabel: 'Awaiting Review',
  monthlyBudgetLabel: 'Budget $0',
  healthTitle: 'Contract Health',
  primaryHealthLabel: 'Active Contract Coverage',
  primaryHealthValue: 0,
  secondaryHealthLabel: 'Renewal Readiness',
  secondaryHealthValue: 0,
  healthTip: 'No contract health insights available yet.',
}

const EMPTY_CONTRACTOR_FORM = {
  contractorId: '',
  name: '',
  address: '',
  currentLocation: '',
  email: '',
  secondaryEmail: '',
  phoneNumber: '',
  noticePeriodDays: 30,
  remarks: '',
  customerManager: '',
  customerManagerEmail: '',
  password: '',
  confirmPassword: '',
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

const clampPercentage = (value) => {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value * 10) / 10))
}

const DashboardPage = () => {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isExportingPos, setIsExportingPos] = useState(false)
  const [isExportingContracts, setIsExportingContracts] = useState(false)
  const [stats, setStats] = useState(DEFAULT_STATS)
  const [customers, setCustomers] = useState([])
  const [contractors, setContractors] = useState([])
  const [isContractorModalOpen, setIsContractorModalOpen] = useState(false)
  const [isContractExportModalOpen, setIsContractExportModalOpen] = useState(false)
  const [isCreatingContractor, setIsCreatingContractor] = useState(false)
  const [contractorFormData, setContractorFormData] = useState(EMPTY_CONTRACTOR_FORM)
  const [contractorFormErrors, setContractorFormErrors] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showContractorPassword, setShowContractorPassword] = useState(false)
  const [showContractorConfirmPassword, setShowContractorConfirmPassword] = useState(false)
  const currentHour = new Date().getHours()
  const greeting =
    currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening'
  const displayName = user?.name || user?.fullName || user?.username || user?.email?.split('@')[0] || 'Admin'

  const loadDashboardStats = useCallback(async () => {
    try {
      setIsLoading(true)

      if (user?.role !== 'ADMIN') {
        setStats(DEFAULT_STATS)
        return
      }

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

      const activeContracts = contractList.filter(
        (contract) => String(contract?.status || '').toUpperCase() === 'ACTIVE'
      )
      const activeContractorIds = new Set(
        activeContracts.map((contract) => String(contract?.contractorId || '')).filter(Boolean)
      )
      const activeContractCoverage = contractorList.length > 0
        ? clampPercentage((activeContractorIds.size / contractorList.length) * 100)
        : 0

      const nextThirtyDays = new Date(now)
      nextThirtyDays.setDate(nextThirtyDays.getDate() + 30)
      const renewalReadyContracts = activeContracts.filter((contract) => {
        const endDate = getValidDate(contract?.endDate)
        return endDate && endDate > nextThirtyDays
      })
      const renewalReadiness = activeContracts.length > 0
        ? clampPercentage((renewalReadyContracts.length / activeContracts.length) * 100)
        : 0

      const expiringSoonContracts = activeContracts.filter((contract) => {
        const endDate = getValidDate(contract?.endDate)
        return endDate && endDate >= now && endDate <= nextThirtyDays
      })
      const contractorsWithoutActiveContract = contractorList.length - activeContractorIds.size

      const healthTip = 'You can always write a review for rejecting an invoice.'

      setContractors(contractorList)
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
        healthTitle: 'Contract Health',
        primaryHealthLabel: 'Active Contract Coverage',
        primaryHealthValue: activeContractCoverage,
        secondaryHealthLabel: 'Renewal Readiness',
        secondaryHealthValue: renewalReadiness,
        healthTip,
      })
    } catch (error) {
      setStats(DEFAULT_STATS)
    } finally {
      setIsLoading(false)
    }
  }, [user?.role])

  useEffect(() => {
    let isMounted = true
    const runLoad = async () => {
      if (!isMounted) return
      await loadDashboardStats()
    }

    runLoad()
    const refreshInterval = window.setInterval(runLoad, 30000)
    const handleWindowFocus = () => runLoad()
    window.addEventListener('focus', handleWindowFocus)

    return () => {
      isMounted = false
      window.clearInterval(refreshInterval)
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [loadDashboardStats])

  useEffect(() => {
    if (!success) return undefined
    const timeoutId = setTimeout(() => setSuccess(''), 5000)
    return () => clearTimeout(timeoutId)
  }, [success])

  const resetContractorForm = () => {
    setContractorFormData(EMPTY_CONTRACTOR_FORM)
    setContractorFormErrors({})
    setShowContractorPassword(false)
    setShowContractorConfirmPassword(false)
  }

  const openContractorModal = () => {
    resetContractorForm()
    setIsContractorModalOpen(true)
  }

  const closeContractorModal = () => {
    setIsContractorModalOpen(false)
    resetContractorForm()
  }

  const validateContractorForm = () => {
    const errors = {}
    if (!validators.isRequired(contractorFormData.contractorId)) errors.contractorId = 'Contractor ID is required'
    if (!validators.isRequired(contractorFormData.name)) errors.name = 'Name is required'
    if (!validators.isRequired(contractorFormData.address)) errors.address = 'Address is required'
    if (!validators.isRequired(contractorFormData.currentLocation)) errors.currentLocation = 'Current location is required'
    if (!validators.isRequired(contractorFormData.email)) errors.email = 'Email is required'
    else if (!validators.isEmail(contractorFormData.email)) errors.email = 'Invalid email'
    if (!validators.isRequired(contractorFormData.secondaryEmail)) errors.secondaryEmail = 'Secondary email is required'
    else if (!validators.isEmail(contractorFormData.secondaryEmail)) errors.secondaryEmail = 'Invalid secondary email'
    if (!validators.isRequired(contractorFormData.customerManager)) errors.customerManager = 'Customer manager is required'
    if (!validators.isRequired(contractorFormData.customerManagerEmail)) errors.customerManagerEmail = 'Customer manager email is required'
    else if (!validators.isEmail(contractorFormData.customerManagerEmail)) errors.customerManagerEmail = 'Invalid customer manager email'
    if (!validators.isRequired(contractorFormData.phoneNumber)) errors.phoneNumber = 'Phone number is required'
    if (Number(contractorFormData.noticePeriodDays) < 0) errors.noticePeriodDays = 'Notice period cannot be negative'
    if (!validators.isRequired(contractorFormData.remarks)) errors.remarks = 'Remarks are required'
    if (!validators.isRequired(contractorFormData.password)) errors.password = 'Password is required'
    else if (!validators.isStrongPassword(contractorFormData.password)) errors.password = 'Weak password format'
    if (contractorFormData.password !== contractorFormData.confirmPassword) errors.confirmPassword = 'Passwords do not match'

    setContractorFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const submitContractor = async (event) => {
    event?.preventDefault()
    if (!validateContractorForm()) return

    setIsCreatingContractor(true)
    try {
      await contractorService.createContractor({
        contractorId: contractorFormData.contractorId.trim(),
        name: contractorFormData.name.trim(),
        address: contractorFormData.address.trim(),
        currentLocation: contractorFormData.currentLocation.trim().toUpperCase(),
        email: contractorFormData.email.trim(),
        secondaryEmail: contractorFormData.secondaryEmail.trim(),
        phoneNumber: contractorFormData.phoneNumber.trim(),
        noticePeriodDays: Number(contractorFormData.noticePeriodDays) || 0,
        remarks: contractorFormData.remarks.trim(),
        customerManager: contractorFormData.customerManager.trim(),
        customerManagerEmail: contractorFormData.customerManagerEmail.trim(),
        password: contractorFormData.password,
      })
      closeContractorModal()
      setError('')
      setSuccess('Contractor added successfully')
      await loadDashboardStats()
    } catch (err) {
      setContractorFormErrors({ submit: err?.message || 'Failed to create contractor' })
    } finally {
      setIsCreatingContractor(false)
    }
  }

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

  const openContractExportModal = async () => {
    try {
      setIsExportingContracts(true)
      const [customersResult, contractorsResult] = await Promise.all([
        customerService.getAllCustomers(),
        contractorService.getAllContractors(),
      ])
      setCustomers(Array.isArray(customersResult) ? customersResult : [])
      setContractors(Array.isArray(contractorsResult) ? contractorsResult : [])
      setError('')
      setSuccess('')
      setIsContractExportModalOpen(true)
    } catch (error) {
      setError('Failed to load contract export filters')
      setSuccess('')
    } finally {
      setIsExportingContracts(false)
    }
  }

  const handleContractExport = async (filters, resetModalState) => {
    setIsExportingContracts(true)
    setError('')
    setSuccess('')

    try {
      const blob = await contractService.exportContracts({
        month: filters.month,
        customerId: filters.customerId || undefined,
        contractorId: filters.contractorId || undefined,
        status: filters.status || undefined,
        includeFinancialDetails: filters.includeFinancialDetails,
      })

      const fileUrl = window.URL.createObjectURL(
        blob instanceof Blob
          ? blob
          : new Blob([blob], {
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            })
      )
      const link = document.createElement('a')
      link.href = fileUrl
      link.download = `contracts-export-${filters.month}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(fileUrl)

      setIsContractExportModalOpen(false)
      resetModalState()
      setSuccess('Contracts exported successfully')
    } catch (error) {
      setError(error?.message || 'Failed to export contracts')
      setSuccess('')
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
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                <p className="text-sm text-emerald-700">{success}</p>
              </div>
            )}

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
                      onClick={openContractorModal}
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
                      disabled
                      className="flex w-full cursor-not-allowed items-center justify-between rounded-2xl bg-[#edf2f7] px-4 py-2.5 text-[#4f5d73] opacity-60 disabled:opacity-60"
                    >
                      <span className="flex items-center gap-2.5">
                        <Download className="h-4 w-4" />
                        <span className="text-[12.5px] font-bold">Export PO's (Disabled)</span>
                      </span>
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={openContractExportModal}
                      disabled={isExportingContracts}
                      className="flex w-full items-center justify-between rounded-2xl bg-[#edf2f7] px-4 py-2.5 text-[#4f5d73] disabled:opacity-60"
                    >
                      <span className="flex items-center gap-2.5">
                        <Download className="h-4 w-4" />
                        <span className="text-[12.5px] font-bold">{isExportingContracts ? 'Preparing Export...' : 'Export Contracts'}</span>
                      </span>
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="rounded-[26px] border border-[#d7e0ec] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                  <div className="mb-3.5 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#2c6ac3]" />
                    <h3 className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#6f7d93]">{stats.healthTitle}</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="mb-1 flex items-center justify-between text-[10px] font-semibold text-[#3d4b61]">
                        <span>{stats.primaryHealthLabel}</span>
                        <span>{stats.primaryHealthValue}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#d8e3fb]">
                        <div className="h-1.5 rounded-full bg-[#2d5fd7]" style={{ width: `${stats.primaryHealthValue}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between text-[10px] font-semibold text-[#3d4b61]">
                        <span>{stats.secondaryHealthLabel}</span>
                        <span>{stats.secondaryHealthValue}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#d8e3fb]">
                        <div className="h-1.5 rounded-full bg-[#2d5fd7]" style={{ width: `${stats.secondaryHealthValue}%` }} />
                      </div>
                    </div>
                    <div className="rounded-2xl bg-[#eef3ff] px-4 py-3">
                      <p className="text-[9.5px] font-semibold leading-5 text-[#60708a]">
                        <span className="font-bold text-[#2d5fd7]">PRO TIP:</span> {stats.healthTip}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <Modal
        isOpen={isContractorModalOpen}
        onClose={closeContractorModal}
        title="Onboard Contractor"
        size="xxl"
        footer={
          <>
            <Button variant="secondary" onClick={closeContractorModal}>Cancel</Button>
            <Button variant="primary" isLoading={isCreatingContractor} onClick={submitContractor}>Create Contractor</Button>
          </>
        }
      >
        <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={submitContractor}>
          {contractorFormErrors.submit && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 md:col-span-2">
              <p className="text-sm text-red-700">{contractorFormErrors.submit}</p>
            </div>
          )}
          <div className="space-y-1">
            <label className="mb-1 block text-[11px] font-medium text-gray-700">Contractor ID <span className="text-red-500">*</span></label>
            <input name="contractorId" value={contractorFormData.contractorId} onChange={(e) => setContractorFormData((p) => ({ ...p, contractorId: e.target.value }))} className={`h-10 w-full rounded-md border px-3 text-[12px] text-gray-900 outline-none ${contractorFormErrors.contractorId ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`} />
            {contractorFormErrors.contractorId && <p className="mt-1 text-[10px] text-red-500">{contractorFormErrors.contractorId}</p>}
          </div>
          <div className="space-y-1">
            <label className="mb-1 block text-[11px] font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
            <input name="name" value={contractorFormData.name} onChange={(e) => setContractorFormData((p) => ({ ...p, name: e.target.value }))} className={`h-10 w-full rounded-md border px-3 text-[12px] text-gray-900 outline-none ${contractorFormErrors.name ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`} />
            {contractorFormErrors.name && <p className="mt-1 text-[10px] text-red-500">{contractorFormErrors.name}</p>}
          </div>
          <div className="space-y-1">
            <label className="mb-1 block text-[11px] font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
            <input type="email" name="email" value={contractorFormData.email} onChange={(e) => setContractorFormData((p) => ({ ...p, email: e.target.value }))} className={`h-10 w-full rounded-md border px-3 text-[12px] text-gray-900 outline-none ${contractorFormErrors.email ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`} />
            {contractorFormErrors.email && <p className="mt-1 text-[10px] text-red-500">{contractorFormErrors.email}</p>}
          </div>
          <div className="space-y-1">
            <label className="mb-1 block text-[11px] font-medium text-gray-700">Phone Number <span className="text-red-500">*</span></label>
            <input name="phoneNumber" value={contractorFormData.phoneNumber} onChange={(e) => setContractorFormData((p) => ({ ...p, phoneNumber: e.target.value }))} className={`h-10 w-full rounded-md border px-3 text-[12px] text-gray-900 outline-none ${contractorFormErrors.phoneNumber ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`} />
            {contractorFormErrors.phoneNumber && <p className="mt-1 text-[10px] text-red-500">{contractorFormErrors.phoneNumber}</p>}
          </div>
          <div className="space-y-1">
            <label className="mb-1 block text-[11px] font-medium text-gray-700">Secondary Email <span className="text-red-500">*</span></label>
            <input type="email" name="secondaryEmail" value={contractorFormData.secondaryEmail} onChange={(e) => setContractorFormData((p) => ({ ...p, secondaryEmail: e.target.value }))} className={`h-10 w-full rounded-md border px-3 text-[12px] text-gray-900 outline-none ${contractorFormErrors.secondaryEmail ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`} />
            {contractorFormErrors.secondaryEmail && <p className="mt-1 text-[10px] text-red-500">{contractorFormErrors.secondaryEmail}</p>}
          </div>
          <div className="space-y-1">
            <label className="mb-1 block text-[11px] font-medium text-gray-700">Current Location <span className="text-red-500">*</span></label>
            <input name="currentLocation" value={contractorFormData.currentLocation} onChange={(e) => setContractorFormData((p) => ({ ...p, currentLocation: e.target.value }))} className={`h-10 w-full rounded-md border px-3 text-[12px] text-gray-900 outline-none ${contractorFormErrors.currentLocation ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`} />
            {contractorFormErrors.currentLocation && <p className="mt-1 text-[10px] text-red-500">{contractorFormErrors.currentLocation}</p>}
          </div>
          <div className="space-y-1">
            <label className="mb-1 block text-[11px] font-medium text-gray-700">Customer Manager <span className="text-red-500">*</span></label>
            <input name="customerManager" value={contractorFormData.customerManager} onChange={(e) => setContractorFormData((p) => ({ ...p, customerManager: e.target.value }))} className={`h-10 w-full rounded-md border px-3 text-[12px] text-gray-900 outline-none ${contractorFormErrors.customerManager ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`} />
            {contractorFormErrors.customerManager && <p className="mt-1 text-[10px] text-red-500">{contractorFormErrors.customerManager}</p>}
          </div>
          <div className="space-y-1">
            <label className="mb-1 block text-[11px] font-medium text-gray-700">Manager Email <span className="text-red-500">*</span></label>
            <input type="email" name="customerManagerEmail" value={contractorFormData.customerManagerEmail} onChange={(e) => setContractorFormData((p) => ({ ...p, customerManagerEmail: e.target.value }))} className={`h-10 w-full rounded-md border px-3 text-[12px] text-gray-900 outline-none ${contractorFormErrors.customerManagerEmail ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`} />
            {contractorFormErrors.customerManagerEmail && <p className="mt-1 text-[10px] text-red-500">{contractorFormErrors.customerManagerEmail}</p>}
          </div>
          <div className="space-y-1">
            <label className="mb-1 block text-[11px] font-medium text-gray-700">Notice Period (days)</label>
            <input type="number" name="noticePeriodDays" value={contractorFormData.noticePeriodDays} onChange={(e) => setContractorFormData((p) => ({ ...p, noticePeriodDays: parseInt(e.target.value, 10) || 0 }))} min="0" className={`h-10 w-full rounded-md border px-3 text-[12px] text-gray-900 outline-none ${contractorFormErrors.noticePeriodDays ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`} />
            {contractorFormErrors.noticePeriodDays && <p className="mt-1 text-[10px] text-red-500">{contractorFormErrors.noticePeriodDays}</p>}
          </div>
          <div className="space-y-1">
            <label className="mb-1 block text-[11px] font-medium text-gray-700">Address <span className="text-red-500">*</span></label>
            <input name="address" value={contractorFormData.address} onChange={(e) => setContractorFormData((p) => ({ ...p, address: e.target.value }))} className={`h-10 w-full rounded-md border px-3 text-[12px] text-gray-900 outline-none ${contractorFormErrors.address ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`} />
            {contractorFormErrors.address && <p className="mt-1 text-[10px] text-red-500">{contractorFormErrors.address}</p>}
          </div>
          <div className="space-y-1">
            <label className="mb-1 block text-[11px] font-medium text-gray-700">Password <span className="text-red-500">*</span></label>
            <div className="relative">
              <input name="password" type={showContractorPassword ? 'text' : 'password'} value={contractorFormData.password} onChange={(e) => setContractorFormData((p) => ({ ...p, password: e.target.value }))} className={`h-10 w-full rounded-md border bg-white px-3 pr-10 text-[12px] text-gray-900 outline-none ${contractorFormErrors.password ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`} />
              <button type="button" onClick={() => setShowContractorPassword((prev) => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                {showContractorPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {contractorFormErrors.password && <p className="mt-1 text-[10px] text-red-500">{contractorFormErrors.password}</p>}
          </div>
          <div className="space-y-1">
            <label className="mb-1 block text-[11px] font-medium text-gray-700">Confirm Password <span className="text-red-500">*</span></label>
            <div className="relative">
              <input name="confirmPassword" type={showContractorConfirmPassword ? 'text' : 'password'} value={contractorFormData.confirmPassword} onChange={(e) => setContractorFormData((p) => ({ ...p, confirmPassword: e.target.value }))} className={`h-10 w-full rounded-md border bg-white px-3 pr-10 text-[12px] text-gray-900 outline-none ${contractorFormErrors.confirmPassword ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`} />
              <button type="button" onClick={() => setShowContractorConfirmPassword((prev) => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                {showContractorConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {contractorFormErrors.confirmPassword && <p className="mt-1 text-[10px] text-red-500">{contractorFormErrors.confirmPassword}</p>}
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="mb-1 block text-[11px] font-medium text-gray-700">Remarks <span className="text-red-500">*</span></label>
            <textarea name="remarks" rows={4} value={contractorFormData.remarks} onChange={(e) => setContractorFormData((p) => ({ ...p, remarks: e.target.value }))} className={`w-full rounded-md border px-3 py-2.5 text-[12px] text-gray-900 outline-none ${contractorFormErrors.remarks ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`} />
            {contractorFormErrors.remarks && <p className="mt-1 text-[10px] text-red-500">{contractorFormErrors.remarks}</p>}
          </div>
        </form>
      </Modal>
      <ContractExportModal
        isOpen={isContractExportModalOpen}
        onClose={() => setIsContractExportModalOpen(false)}
        customers={customers}
        contractors={contractors}
        isExporting={isExportingContracts}
        onExport={handleContractExport}
      />
    </DashboardLayout>
  )
}

export default DashboardPage
