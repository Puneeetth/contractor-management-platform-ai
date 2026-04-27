import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  Plus,
  PlusCircle,
  Search,
} from 'lucide-react'
import { DashboardLayout } from '../../components/layout'
import { Badge, Button, Card, Input, Loader, Modal, Select, Textarea } from '../../components/ui'
import { contractService, contractorService } from '../../services/contractorService'
import { customerService } from '../../services/customerService'
import { poService } from '../../services/poService'
import { dedupeBy } from '../../utils/dedupe'
import { useAuthStore } from '../../hooks/useAuth'
import { formatters } from '../../utils/formatters'
import { validators } from '../../utils/validators'

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

const EMPTY_CONTRACT_FORM = {
  contractorId: '',
  customerId: '',
  poAllocation: '',
  billRate: '',
  payRate: '',
  estimatedHours: '',
  estimatedBudget: '',
  startDate: '',
  endDate: '',
  noticePeriodDays: 30,
  throughEor: false,
  remarks: '',
  terminationRemarks: '',
}

const EMPTY_EXPORT_FILTERS = {
  month: '',
  customerId: '',
  region: '',
  status: '',
  includeFinancials: false,
}

const ContractorsPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN'
  const canCreateContracts = ['ADMIN', 'MANAGER'].includes(user?.role)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [contractors, setContractors] = useState([])
  const [contracts, setContracts] = useState([])
  const [customers, setCustomers] = useState([])
  const [purchaseOrders, setPurchaseOrders] = useState([])

  const [searchTerm, setSearchTerm] = useState('')
  const [regionFilter, setRegionFilter] = useState('ALL')
  const [customerFilter, setCustomerFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportFilters, setExportFilters] = useState(EMPTY_EXPORT_FILTERS)
  const [exportFilterErrors, setExportFilterErrors] = useState({})
  const [customerSearchTerm, setCustomerSearchTerm] = useState('')

  const [isContractorModalOpen, setIsContractorModalOpen] = useState(false)
  const [contractorFormData, setContractorFormData] = useState(EMPTY_CONTRACTOR_FORM)
  const [contractorFormErrors, setContractorFormErrors] = useState({})
  const [isCreatingContractor, setIsCreatingContractor] = useState(false)
  const [showContractorPassword, setShowContractorPassword] = useState(false)
  const [showContractorConfirmPassword, setShowContractorConfirmPassword] = useState(false)

  const [isContractModalOpen, setIsContractModalOpen] = useState(false)
  const [contractFormData, setContractFormData] = useState(EMPTY_CONTRACT_FORM)
  const [contractFormErrors, setContractFormErrors] = useState({})
  const [isCreatingContract, setIsCreatingContract] = useState(false)
  const [isContractorLocked, setIsContractorLocked] = useState(false)

  const [viewingContractor, setViewingContractor] = useState(null)

  const PAGE_SIZE = 10

  useEffect(() => {
    loadPageData()
  }, [])

  useEffect(() => {
    if (location.state?.openAddContractor && isAdmin) {
      setIsContractorModalOpen(true)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [isAdmin, location.pathname, location.state, navigate])

  const loadPageData = async () => {
    try {
      setIsLoading(true)
      setError('')

      const [contractorsResult, contractsResult, customersResult, poResult] = await Promise.allSettled([
        contractorService.getAllContractors(),
        contractService.getAllContracts(),
        customerService.getAllCustomers(),
        poService.getAllPurchaseOrders(),
      ])

      setContractors(
        contractorsResult.status === 'fulfilled'
          ? dedupeBy(contractorsResult.value, (contractor, index) => contractor?.id || contractor?.userId || `${contractor?.contractorId || contractor?.email || index}`)
          : []
      )
      setContracts(
        contractsResult.status === 'fulfilled'
          ? dedupeBy(contractsResult.value, (contract, index) => contract?.id || `${contract?.contractorId || 'contractor'}-${contract?.startDate || ''}-${contract?.endDate || ''}-${index}`)
          : []
      )
      setCustomers(
        customersResult.status === 'fulfilled'
          ? dedupeBy(customersResult.value, (customer, index) => customer?.id || `${customer?.name || 'customer'}-${customer?.msa || index}`)
          : []
      )
      setPurchaseOrders(
        poResult.status === 'fulfilled'
          ? dedupeBy(poResult.value, (po, index) => po?.id || `${po?.poNumber || 'po'}-${po?.customerId || index}`)
          : []
      )

      if (
        contractorsResult.status === 'rejected' ||
        contractsResult.status === 'rejected' ||
        customersResult.status === 'rejected' ||
        poResult.status === 'rejected'
      ) {
        setError('Failed to load contractor data')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const customerNameById = useMemo(
    () =>
      customers.reduce((lookup, customer) => {
        lookup[String(customer.id)] = customer.name
        return lookup
      }, {}),
    [customers]
  )

  const exportCustomerOptions = useMemo(() => {
    const query = customerSearchTerm.trim().toLowerCase()
    return customers.filter((customer) => !query || String(customer.name || '').toLowerCase().includes(query))
  }, [customerSearchTerm, customers])

  const poByNumber = useMemo(
    () =>
      purchaseOrders.reduce((lookup, po) => {
        const key = String(po.poNumber || '').trim()
        if (key) lookup[key] = po
        return lookup
      }, {}),
    [purchaseOrders]
  )

  const posByCustomerId = useMemo(
    () =>
      purchaseOrders.reduce((lookup, po) => {
        const customerId = String(po.customerId || '')
        if (!lookup[customerId]) lookup[customerId] = []
        if (po.poNumber) lookup[customerId].push(po)
        return lookup
      }, {}),
    [purchaseOrders]
  )

  const contractsByContractor = useMemo(
    () =>
      contracts.reduce((lookup, contract) => {
        const contractorKey = String(contract.contractorId || '')
        if (!lookup[contractorKey]) lookup[contractorKey] = []
        lookup[contractorKey].push(contract)
        return lookup
      }, {}),
    [contracts]
  )

  const rows = useMemo(() => {
    return contractors.map((contractor) => {
      const byUserId = contractsByContractor[String(contractor.userId)] || []
      const byContractorId = contractsByContractor[String(contractor.id)] || []
      const contractorContracts = dedupeBy(
        [...byUserId, ...byContractorId],
        (contract, index) => contract?.id || `${contract?.contractorId || contractor.id}-${contract?.startDate || ''}-${contract?.endDate || ''}-${index}`
      ).sort((a, b) => String(b.startDate || '').localeCompare(String(a.startDate || '')))
      const latestContract = contractorContracts[0] || null
      return {
        ...contractor,
        contracts: contractorContracts,
        latestContract,
      }
    })
  }, [contractors, contractsByContractor])

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesSearch =
        !searchTerm ||
        String(row.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(row.contractorId || '').toLowerCase().includes(searchTerm.toLowerCase())
      if (!matchesSearch) return false

      const matchesRegion = regionFilter === 'ALL' || String(row.currentLocation || '').toUpperCase() === regionFilter
      if (!matchesRegion) return false

      const matchesCustomer =
        customerFilter === 'ALL' ||
        row.contracts.some((contract) => String(contract.customerId || '') === customerFilter)
      if (!matchesCustomer) return false

      if (statusFilter === 'ALL') return true
      const status = String(row.latestContract?.status || 'INACTIVE').toUpperCase()
      return status === statusFilter
    })
  }, [rows, searchTerm, regionFilter, customerFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pagedRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [searchTerm, regionFilter, customerFilter, statusFilter, contractors.length, contracts.length])

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

  const resetExportFilters = () => {
    setExportFilters(EMPTY_EXPORT_FILTERS)
    setExportFilterErrors({})
    setCustomerSearchTerm('')
  }

  const resetContractForm = () => {
    setContractFormData(EMPTY_CONTRACT_FORM)
    setContractFormErrors({})
    setIsContractorLocked(false)
  }

  const openContractModal = (contractorId = '') => {
    setContractFormData({ ...EMPTY_CONTRACT_FORM, contractorId: contractorId ? String(contractorId) : '' })
    setContractFormErrors({})
    setIsContractorLocked(Boolean(contractorId))
    setIsContractModalOpen(true)
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
    event.preventDefault()
    if (!validateContractorForm()) return

    setIsCreatingContractor(true)
    setSuccess('')
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
      setIsContractorModalOpen(false)
      resetContractorForm()
      setSuccess('Contractor added successfully')
      await loadPageData()
    } catch (err) {
      setContractorFormErrors({ submit: err?.message || 'Failed to create contractor' })
    } finally {
      setIsCreatingContractor(false)
    }
  }

  const updateContractBudget = (nextData) => {
    const billRate = Number(nextData.billRate) || 0
    const estimatedHours = Number(nextData.estimatedHours) || 0
    return {
      ...nextData,
      estimatedBudget: billRate > 0 && estimatedHours > 0 ? Number((billRate * estimatedHours).toFixed(2)) : '',
    }
  }

  const handleContractInputChange = (event) => {
    const { name, value, type, checked } = event.target
    setContractFormData((prev) => {
      let parsedValue = type === 'checkbox' ? checked : value

      // Parse numeric fields
      if (['billRate', 'payRate'].includes(name)) {
        parsedValue = value === '' ? '' : parseFloat(value)
      } else if (['estimatedHours', 'noticePeriodDays'].includes(name)) {
        parsedValue = value === '' ? '' : parseInt(value, 10)
      }

      // Prevent payRate from being >= billRate
      if (name === 'payRate' && parsedValue !== '' && prev.billRate !== '' && Number(parsedValue) >= Number(prev.billRate)) {
        setContractFormErrors((p) => ({ ...p, payRate: 'Pay rate must be less than bill rate' }))
        return prev
      }
      if (name === 'billRate' && parsedValue !== '' && prev.payRate !== '' && Number(parsedValue) <= Number(prev.payRate)) {
        setContractFormErrors((p) => ({ ...p, payRate: 'Bill rate must be greater than pay rate' }))
        return prev
      }

      let next = {
        ...prev,
        [name]: parsedValue,
      }

      // When customer changes, clear PO selection
      if (name === 'customerId') {
        next.poAllocation = ''
      }

      // When PO is selected, auto-fill customer from PO
      if (name === 'poAllocation' && parsedValue) {
        const linkedPo = poByNumber[String(parsedValue).trim()]
        next.customerId = linkedPo?.customerId ? String(linkedPo.customerId) : ''
      }

      // Auto-calculate budget
      if (name === 'billRate' || name === 'estimatedHours') {
        next = updateContractBudget(next)
      }

      return next
    })
    if (contractFormErrors[name]) {
      setContractFormErrors((prev) => ({ ...prev, [name]: '' }))
    }
    if (name === 'billRate' || name === 'payRate') {
      setContractFormErrors((prev) => ({ ...prev, payRate: '' }))
    }
  }

  useEffect(() => {
    if (contractFormData.payRate !== '' && contractFormData.billRate !== '' && 
        Number(contractFormData.payRate) >= Number(contractFormData.billRate)) {
      setContractFormErrors(prev => ({ ...prev, payRate: 'Pay rate must be less than bill rate' }))
    } else {
      setContractFormErrors(prev => {
        if (prev.payRate === 'Pay rate must be less than bill rate') {
          return { ...prev, payRate: '' }
        }
        return prev
      })
    }
  }, [contractFormData.payRate, contractFormData.billRate])

  const filteredPosForCustomer = useMemo(() => {
    if (!contractFormData.customerId) return []
    return posByCustomerId[String(contractFormData.customerId)] || []
  }, [contractFormData.customerId, posByCustomerId])

  const validateContractForm = () => {
    const errors = {}
    if (!validators.isRequired(contractFormData.customerId)) errors.customerId = 'Customer is required'
    if (!validators.isRequired(contractFormData.contractorId)) errors.contractorId = 'Contractor is required'
    if (!validators.isRequired(contractFormData.billRate)) errors.billRate = 'Bill rate is required'
    if (!validators.isRequired(contractFormData.payRate)) errors.payRate = 'Pay rate is required'
    if (contractFormData.payRate && contractFormData.billRate && Number(contractFormData.payRate) >= Number(contractFormData.billRate)) {
      errors.payRate = 'Pay rate must be less than bill rate'
    }
    if (!validators.isRequired(contractFormData.estimatedHours)) errors.estimatedHours = 'Estimated hours is required'
    if (!validators.isRequired(contractFormData.estimatedBudget)) errors.estimatedBudget = 'Estimated budget is required'
    if (!validators.isRequired(contractFormData.startDate)) errors.startDate = 'Start date is required'
    if (!validators.isRequired(contractFormData.endDate)) errors.endDate = 'End date is required'
    if (contractFormData.startDate && contractFormData.endDate && contractFormData.endDate < contractFormData.startDate) {
      errors.endDate = 'End date cannot be before start date'
    }
    if (!validators.isRequired(contractFormData.noticePeriodDays) && contractFormData.noticePeriodDays !== 0) errors.noticePeriodDays = 'Notice period is required'
    if (Number(contractFormData.noticePeriodDays) < 0) errors.noticePeriodDays = 'Notice period cannot be negative'

    setContractFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const submitContract = async (event) => {
    event.preventDefault()
    if (!validateContractForm()) return

    setIsCreatingContract(true)
    try {
      await contractService.createContract({
        contractorId: Number(contractFormData.contractorId),
        customerId: contractFormData.customerId ? Number(contractFormData.customerId) : null,
        poAllocation: String(contractFormData.poAllocation || '').trim() || null,
        billRate: Number(contractFormData.billRate),
        payRate: Number(contractFormData.payRate),
        estimatedHours: Number(contractFormData.estimatedHours),
        estimatedBudget: Number(contractFormData.estimatedBudget),
        startDate: contractFormData.startDate,
        endDate: contractFormData.endDate,
        noticePeriodDays: Number(contractFormData.noticePeriodDays) || 0,
        throughEor: Boolean(contractFormData.throughEor),
        remarks: String(contractFormData.remarks || ''),
        terminationRemarks: String(contractFormData.terminationRemarks || ''),
      })
      setIsContractModalOpen(false)
      resetContractForm()
      setSuccess('Contract created successfully')
      await loadPageData()
    } catch (err) {
      setContractFormErrors({ submit: err?.message || 'Failed to create contract' })
    } finally {
      setIsCreatingContract(false)
    }
  }

  const regionOptions = ['ALL', 'UK', 'US', 'EU', 'APAC', 'MIDDLE EAST']

  const validateExportFilters = () => {
    const errors = {}
    if (!validators.isRequired(exportFilters.month)) errors.month = 'Month is required'
    setExportFilterErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleExportData = async () => {
    if (!validateExportFilters()) return

    setIsExporting(true)
    setError('')
    setSuccess('')

    try {
      const blob = await contractorService.exportContractors({
        month: exportFilters.month,
        customerId: exportFilters.customerId || undefined,
        region: exportFilters.region || undefined,
        status: exportFilters.status || undefined,
        includeFinancials: exportFilters.includeFinancials,
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
      link.download = `contractors-export-${exportFilters.month}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(fileUrl)

      setIsExportModalOpen(false)
      resetExportFilters()
      setSuccess('Contractors exported successfully')
    } catch (err) {
      setError(err?.message || 'Failed to export contractors')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-baseline gap-3">
            <h1 className="shrink-0 text-[22px] leading-none font-bold text-[#0f1d33]">Contractors</h1>
            <p className="truncate text-[13px] text-[#4a5c77]">Manage and track your extended workforce ecosystem.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSuccess('')
                setError('')
                setIsExportModalOpen(true)
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-[#d8e2ef] bg-white px-4 py-2 text-sm font-semibold text-[#1c2f4b] hover:bg-[#f7f9fc]"
            >
              <Download className="h-4 w-4" /> Export Contractors
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsContractorModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#4b4fe8] px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_16px_rgba(75,79,232,0.25)] hover:bg-[#4347db]"
              >
                <PlusCircle className="h-4 w-4" /> Add Contractor
              </button>
            )}
          </div>
        </div>

        <Card className="border-[#d8e2ef] shadow-[0_4px_18px_rgba(15,23,42,0.04)]">
          <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-[minmax(0,1fr)_128px_148px_78px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#95a2b7]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search contractor..."
                className="h-9 w-full rounded-xl border border-[#e6ebf3] bg-white pl-10 pr-3 text-[13px] text-[#263448] placeholder:text-[#9aa8bb] outline-none focus:border-[#a9b9d3]"
              />
            </div>
            <select
              value={regionFilter}
              onChange={(event) => setRegionFilter(event.target.value)}
              className="h-9 w-full rounded-xl border border-[#d8e2ef] bg-white px-3 text-[13px] text-[#263448] outline-none focus:border-[#a9b9d3]"
            >
              {regionOptions.map((option) => (
                <option key={option} value={option}>{option === 'ALL' ? 'All regions' : option}</option>
              ))}
            </select>
            <select
              value={customerFilter}
              onChange={(event) => setCustomerFilter(event.target.value)}
              className="h-9 w-full rounded-xl border border-[#d8e2ef] bg-white px-3 text-[13px] text-[#263448] outline-none focus:border-[#a9b9d3]"
            >
              <option value="ALL">All customers</option>
              {customers.map((customer) => (
                <option key={customer.id} value={String(customer.id)}>{customer.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('')
                setRegionFilter('ALL')
                setCustomerFilter('ALL')
                setStatusFilter('ALL')
              }}
              className="h-9 w-full rounded-xl border border-[#d8e2ef] bg-[#f8fbff] px-3 text-[13px] font-semibold text-[#4f5f78] hover:bg-white"
            >
              Clear
            </button>
          </div>
        </Card>

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

        <Card className="border-[#d8e2ef] shadow-[0_8px_24px_rgba(15,23,42,0.05)]" isPadded={false}>
          {isLoading ? (
            <div className="py-12 flex justify-center"><Loader message="Loading contractors..." /></div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-[#e0e8f3] bg-[#f7f9fc]">
                      <th className="whitespace-nowrap px-3 py-2.5 text-left text-[9px] font-bold tracking-[0.05em] text-[#5c6e89]">CONTRACTOR</th>
                      <th className="whitespace-nowrap px-2.5 py-2.5 text-left text-[9px] font-bold tracking-[0.05em] text-[#5c6e89]">CUSTOMER</th>
                      <th className="whitespace-nowrap px-2.5 py-2.5 text-left text-[9px] font-bold tracking-[0.05em] text-[#5c6e89]">PO / CONTRACT REF</th>
                      <th className="whitespace-nowrap px-2.5 py-2.5 text-left text-[9px] font-bold tracking-[0.05em] text-[#5c6e89]">START DATE</th>
                      <th className="whitespace-nowrap px-2.5 py-2.5 text-left text-[9px] font-bold tracking-[0.05em] text-[#5c6e89]">END DATE</th>
                      <th className="whitespace-nowrap px-2.5 py-2.5 text-left text-[9px] font-bold tracking-[0.05em] text-[#5c6e89]">PAY RATE</th>
                      <th className="whitespace-nowrap px-2.5 py-2.5 text-left text-[9px] font-bold tracking-[0.05em] text-[#5c6e89]">BILL RATE</th>
                      <th className="whitespace-nowrap px-3 py-2.5 text-right text-[9px] font-bold tracking-[0.05em] text-[#5c6e89]">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedRows.map((row) => {
                      const contract = row.latestContract
                      const initials = String(row.name || 'CT').split(' ').filter(Boolean).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('')
                      const customerName = contract?.customerId ? customerNameById[String(contract.customerId)] || `Customer #${contract.customerId}` : 'Not assigned'
                      const contractRef = contract?.poAllocation || (contract?.id ? `Contract #${contract.id}` : '-')
                      return (
                        <tr key={row.id} className="border-b border-[#e5ebf4] bg-white">
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#dee5fb] text-[10px] font-bold text-[#3e53dd]">{initials}</div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate whitespace-nowrap text-[13px] font-semibold leading-none text-[#12203a]">{row.name}</p>
                                <p className="truncate whitespace-nowrap text-[10px] text-[#8a98ad]">{row.remarks || 'Contractor'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-2.5 py-2.5">
                            <span className={`inline-flex whitespace-nowrap rounded-lg px-2 py-0.5 text-[11px] ${contract?.customerId ? 'bg-[#e8edff] text-[#3b50d7]' : 'bg-[#eef2f7] text-[#5f6f88]'}`}>
                              {customerName}
                            </span>
                          </td>
                          <td className="px-2.5 py-2.5 text-[13px] text-[#1f3048]">{contractRef}</td>
                          <td className="px-2.5 py-2.5 text-[13px] text-[#1f3048]">{formatters.formatDate(contract?.startDate) || '-'}</td>
                          <td className="px-2.5 py-2.5 text-[13px] text-[#1f3048]">{formatters.formatDate(contract?.endDate) || '-'}</td>
                          <td className="px-2.5 py-2.5 text-[13px] font-medium text-[#111827]">{contract ? formatters.formatCurrency(contract.payRate) : '-'}</td>
                          <td className="px-2.5 py-2.5 text-[13px] font-medium text-[#111827]">{contract ? formatters.formatCurrency(contract.billRate) : '-'}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center justify-end gap-1.5">
                              {canCreateContracts && (
                                <button
                                  type="button"
                                  onClick={() => openContractModal(row.id)}
                                  className="rounded-lg p-1 text-[#7f90ab] hover:bg-[#eef3fb] hover:text-[#4b4fe8]"
                                  title="Add contract"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setViewingContractor(row)}
                                className="rounded-lg p-1 text-[#7f90ab] hover:bg-[#eef3fb] hover:text-[#4b4fe8]"
                                title="View contracts"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between px-6 py-5">
                <p className="text-base text-[#5f6f88]">Showing <span className="font-semibold text-[#1e2d45]">{filteredRows.length}</span> of <span className="font-semibold text-[#1e2d45]">{rows.length}</span> results</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#d8e2ef] text-[#94a1b6] disabled:opacity-50"
                  >
                    ‹
                  </button>
                  <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl bg-[#4b4fe8] px-3 text-sm font-semibold text-white">{currentPage}</span>
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#d8e2ef] text-[#94a1b6] disabled:opacity-50"
                  >
                    ›
                  </button>
                </div>
              </div>
            </>
          )}
        </Card>

        <Modal
          isOpen={isExportModalOpen}
          onClose={() => {
            setIsExportModalOpen(false)
            resetExportFilters()
          }}
          title="Export Contractors"
          size="xxl"
          footer={
            <>
              <Button variant="secondary" onClick={() => {
                setIsExportModalOpen(false)
                resetExportFilters()
              }}>Cancel</Button>
              <Button variant="primary" isLoading={isExporting} onClick={handleExportData}>Export</Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="mb-1 block text-[11px] font-medium text-gray-700">Month <span className="text-red-500">*</span></label>
                <input
                  type="month"
                  value={exportFilters.month}
                  onChange={(event) => {
                    setExportFilters((prev) => ({ ...prev, month: event.target.value }))
                    if (exportFilterErrors.month) {
                      setExportFilterErrors((prev) => ({ ...prev, month: '' }))
                    }
                  }}
                  className={`h-10 w-full rounded-md border bg-white px-3 text-[12px] text-gray-900 outline-none ${exportFilterErrors.month ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
                />
                {exportFilterErrors.month && <p className="mt-1 text-[10px] text-red-500">{exportFilterErrors.month}</p>}
              </div>

              <div className="space-y-1">
                <label className="mb-1 block text-[11px] font-medium text-gray-700">Region</label>
                <select
                  value={exportFilters.region}
                  onChange={(event) => setExportFilters((prev) => ({ ...prev, region: event.target.value }))}
                  className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-[12px] text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">All regions</option>
                  {regionOptions.filter((option) => option !== 'ALL').map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="mb-1 block text-[11px] font-medium text-gray-700">Customer</label>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_220px]">
                  <input
                    type="text"
                    value={customerSearchTerm}
                    onChange={(event) => setCustomerSearchTerm(event.target.value)}
                    placeholder="Search customer..."
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-[12px] text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                  <select
                    value={exportFilters.customerId}
                    onChange={(event) => setExportFilters((prev) => ({ ...prev, customerId: event.target.value }))}
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-[12px] text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="">All customers</option>
                    {exportCustomerOptions.map((customer) => (
                      <option key={customer.id} value={String(customer.id)}>{customer.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="mb-1 block text-[11px] font-medium text-gray-700">Status</label>
                <select
                  value={exportFilters.status}
                  onChange={(event) => setExportFilters((prev) => ({ ...prev, status: event.target.value }))}
                  className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-[12px] text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">All statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="mb-1 block text-[11px] font-medium text-gray-700">Include Financials</label>
                <label className="flex h-10 items-center gap-2 rounded-md border border-gray-300 bg-[#f8fafc] px-3 text-[12px] text-gray-700">
                  <input
                    type="checkbox"
                    checked={exportFilters.includeFinancials}
                    onChange={(event) => setExportFilters((prev) => ({ ...prev, includeFinancials: event.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Include revenue, cost, and margin
                </label>
              </div>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={isContractorModalOpen}
          onClose={() => {
            setIsContractorModalOpen(false)
            resetContractorForm()
          }}
          title="Add New Contractor"
          size="xxl"
          footer={
            <>
              <Button variant="secondary" onClick={() => { setIsContractorModalOpen(false); resetContractorForm() }}>Cancel</Button>
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
              <input
                name="contractorId"
                value={contractorFormData.contractorId}
                onChange={(e) => setContractorFormData((p) => ({ ...p, contractorId: e.target.value }))}
                className={`h-10 w-full rounded-md border px-3 text-[12px] text-gray-900 outline-none ${contractorFormErrors.contractorId ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
              />
              {contractorFormErrors.contractorId && <p className="mt-1 text-[10px] text-red-500">{contractorFormErrors.contractorId}</p>}
            </div>
            <div className="space-y-1">
              <label className="mb-1 block text-[11px] font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
              <input
                name="name"
                value={contractorFormData.name}
                onChange={(e) => setContractorFormData((p) => ({ ...p, name: e.target.value }))}
                className={`h-10 w-full rounded-md border px-3 text-[12px] text-gray-900 outline-none ${contractorFormErrors.name ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
              />
              {contractorFormErrors.name && <p className="mt-1 text-[10px] text-red-500">{contractorFormErrors.name}</p>}
            </div>
            <div className="space-y-1">
              <label className="mb-1 block text-[11px] font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                name="email"
                value={contractorFormData.email}
                onChange={(e) => setContractorFormData((p) => ({ ...p, email: e.target.value }))}
                className={`h-10 w-full rounded-md border px-3 text-[12px] text-gray-900 outline-none ${contractorFormErrors.email ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
              />
              {contractorFormErrors.email && <p className="mt-1 text-[10px] text-red-500">{contractorFormErrors.email}</p>}
            </div>
            <div className="space-y-1">
              <label className="mb-1 block text-[11px] font-medium text-gray-700">Phone Number <span className="text-red-500">*</span></label>
              <input
                name="phoneNumber"
                value={contractorFormData.phoneNumber}
                onChange={(e) => setContractorFormData((p) => ({ ...p, phoneNumber: e.target.value }))}
                className={`h-10 w-full rounded-md border px-3 text-[12px] text-gray-900 outline-none ${contractorFormErrors.phoneNumber ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
              />
              {contractorFormErrors.phoneNumber && <p className="mt-1 text-[10px] text-red-500">{contractorFormErrors.phoneNumber}</p>}
            </div>
            <div className="space-y-1">
              <label className="mb-1 block text-[11px] font-medium text-gray-700">Secondary Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                name="secondaryEmail"
                value={contractorFormData.secondaryEmail}
                onChange={(e) => setContractorFormData((p) => ({ ...p, secondaryEmail: e.target.value }))}
                className={`h-10 w-full rounded-md border px-3 text-[12px] text-gray-900 outline-none ${contractorFormErrors.secondaryEmail ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
              />
              {contractorFormErrors.secondaryEmail && <p className="mt-1 text-[10px] text-red-500">{contractorFormErrors.secondaryEmail}</p>}
            </div>
            <div className="space-y-1">
              <label className="mb-1 block text-[11px] font-medium text-gray-700">Current Location <span className="text-red-500">*</span></label>
              <input
                name="currentLocation"
                value={contractorFormData.currentLocation}
                onChange={(e) => setContractorFormData((p) => ({ ...p, currentLocation: e.target.value }))}
                className={`h-10 w-full rounded-md border px-3 text-[12px] text-gray-900 outline-none ${contractorFormErrors.currentLocation ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
              />
              {contractorFormErrors.currentLocation && <p className="mt-1 text-[10px] text-red-500">{contractorFormErrors.currentLocation}</p>}
            </div>
            <div className="space-y-1">
              <label className="mb-1 block text-[11px] font-medium text-gray-700">Customer Manager <span className="text-red-500">*</span></label>
              <input
                name="customerManager"
                value={contractorFormData.customerManager}
                onChange={(e) => setContractorFormData((p) => ({ ...p, customerManager: e.target.value }))}
                className={`h-10 w-full rounded-md border px-3 text-[12px] text-gray-900 outline-none ${contractorFormErrors.customerManager ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
              />
              {contractorFormErrors.customerManager && <p className="mt-1 text-[10px] text-red-500">{contractorFormErrors.customerManager}</p>}
            </div>
            <div className="space-y-1">
              <label className="mb-1 block text-[11px] font-medium text-gray-700">Manager Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                name="customerManagerEmail"
                value={contractorFormData.customerManagerEmail}
                onChange={(e) => setContractorFormData((p) => ({ ...p, customerManagerEmail: e.target.value }))}
                className={`h-10 w-full rounded-md border px-3 text-[12px] text-gray-900 outline-none ${contractorFormErrors.customerManagerEmail ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
              />
              {contractorFormErrors.customerManagerEmail && <p className="mt-1 text-[10px] text-red-500">{contractorFormErrors.customerManagerEmail}</p>}
            </div>
            <div className="space-y-1">
              <label className="mb-1 block text-[11px] font-medium text-gray-700">Notice Period (days)</label>
              <input
                type="number"
                name="noticePeriodDays"
                value={contractorFormData.noticePeriodDays}
                onChange={(e) => setContractorFormData((p) => ({ ...p, noticePeriodDays: parseInt(e.target.value, 10) || 0 }))}
                min="0"
                className={`h-10 w-full rounded-md border px-3 text-[12px] text-gray-900 outline-none ${contractorFormErrors.noticePeriodDays ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
              />
              {contractorFormErrors.noticePeriodDays && <p className="mt-1 text-[10px] text-red-500">{contractorFormErrors.noticePeriodDays}</p>}
            </div>
            <div className="space-y-1">
              <label className="mb-1 block text-[11px] font-medium text-gray-700">Address <span className="text-red-500">*</span></label>
              <input
                name="address"
                value={contractorFormData.address}
                onChange={(e) => setContractorFormData((p) => ({ ...p, address: e.target.value }))}
                className={`h-10 w-full rounded-md border px-3 text-[12px] text-gray-900 outline-none ${contractorFormErrors.address ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
              />
              {contractorFormErrors.address && <p className="mt-1 text-[10px] text-red-500">{contractorFormErrors.address}</p>}
            </div>
            <div className="space-y-1">
              <label className="mb-1 block text-[11px] font-medium text-gray-700">Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  name="password"
                  type={showContractorPassword ? 'text' : 'password'}
                  value={contractorFormData.password}
                  onChange={(e) => setContractorFormData((p) => ({ ...p, password: e.target.value }))}
                  className={`h-10 w-full rounded-md border bg-white px-3 pr-10 text-[12px] text-gray-900 outline-none ${contractorFormErrors.password ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" onClick={() => setShowContractorPassword((p) => !p)}>
                  {showContractorPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {contractorFormErrors.password && <p className="mt-1 text-[10px] text-red-500">{contractorFormErrors.password}</p>}
            </div>
            <div className="space-y-1">
              <label className="mb-1 block text-[11px] font-medium text-gray-700">Confirm Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  name="confirmPassword"
                  type={showContractorConfirmPassword ? 'text' : 'password'}
                  value={contractorFormData.confirmPassword}
                  onChange={(e) => setContractorFormData((p) => ({ ...p, confirmPassword: e.target.value }))}
                  className={`h-10 w-full rounded-md border bg-white px-3 pr-10 text-[12px] text-gray-900 outline-none ${contractorFormErrors.confirmPassword ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" onClick={() => setShowContractorConfirmPassword((p) => !p)}>
                  {showContractorConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {contractorFormErrors.confirmPassword && <p className="mt-1 text-[10px] text-red-500">{contractorFormErrors.confirmPassword}</p>}
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="mb-1 block text-[11px] font-medium text-gray-700">Remarks <span className="text-red-500">*</span></label>
              <textarea
                name="remarks"
                rows={4}
                value={contractorFormData.remarks}
                onChange={(e) => setContractorFormData((p) => ({ ...p, remarks: e.target.value }))}
                className={`w-full rounded-md border bg-white px-3 py-2.5 text-[12px] text-gray-900 outline-none ${contractorFormErrors.remarks ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
              />
              {contractorFormErrors.remarks && <p className="mt-1 text-[10px] text-red-500">{contractorFormErrors.remarks}</p>}
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={isContractModalOpen}
          onClose={() => {
            setIsContractModalOpen(false)
            resetContractForm()
          }}
          title="Create Contract"
          size="xxl"
          footer={
            <>
              <Button variant="secondary" onClick={() => {
                setIsContractModalOpen(false)
                resetContractForm()
              }}>Cancel</Button>
              <Button variant="primary" isLoading={isCreatingContract} onClick={submitContract}>Create Contract</Button>
            </>
          }
        >
          <form className="space-y-5" onSubmit={submitContract}>
            {contractFormErrors.submit && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-700">{contractFormErrors.submit}</p>
              </div>
            )}

            <div>
              <h3 className="mb-3 text-sm font-semibold text-[#1c2f4b]">Customer & PO Selection</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="mb-1 block text-[11px] font-medium text-gray-700">Select Customer <span className="text-red-500">*</span></label>
                  <select
                    name="customerId"
                    value={contractFormData.customerId}
                    onChange={handleContractInputChange}
                    className={`h-10 w-full rounded-md border bg-white px-3 text-[12px] text-gray-900 outline-none ${contractFormErrors.customerId ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
                  >
                    <option value="">Select customer...</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={String(customer.id)}>{customer.name}</option>
                    ))}
                  </select>
                  {contractFormErrors.customerId && <p className="mt-1 text-[10px] text-red-500">{contractFormErrors.customerId}</p>}
                </div>

                <div className="space-y-1">
                  <label className="mb-1 block text-[11px] font-medium text-gray-700">Select PO <span className="text-red-500">*</span></label>
                  <select
                    name="poAllocation"
                    value={contractFormData.poAllocation}
                    onChange={handleContractInputChange}
                    disabled={!contractFormData.customerId}
                    className={`h-10 w-full rounded-md border bg-white px-3 text-[12px] text-gray-900 outline-none disabled:bg-gray-100 ${contractFormErrors.poAllocation ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
                  >
                    <option value="">{contractFormData.customerId ? 'Select PO...' : 'Select a customer first'}</option>
                    {filteredPosForCustomer.map((po) => (
                      <option key={po.id || po.poNumber} value={String(po.poNumber).trim()}>{po.poNumber}</option>
                    ))}
                  </select>
                  {contractFormErrors.poAllocation && <p className="mt-1 text-[10px] text-red-500">{contractFormErrors.poAllocation}</p>}
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-[#1c2f4b]">Contractor Information</h3>
              <div className="space-y-1">
                <label className="mb-1 block text-[11px] font-medium text-gray-700">Contractor <span className="text-red-500">*</span></label>
                <select
                  name="contractorId"
                  value={contractFormData.contractorId}
                  onChange={handleContractInputChange}
                  disabled={isContractorLocked}
                  className={`h-10 w-full rounded-md border bg-white px-3 text-[12px] text-gray-900 outline-none disabled:cursor-not-allowed disabled:bg-gray-100 ${contractFormErrors.contractorId ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
                >
                  <option value="">Select contractor...</option>
                  {contractors.map((contractor) => (
                    <option key={contractor.id} value={String(contractor.id)}>{contractor.name} ({contractor.contractorId})</option>
                  ))}
                </select>
                {contractFormErrors.contractorId && <p className="mt-1 text-[10px] text-red-500">{contractFormErrors.contractorId}</p>}
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-[#1c2f4b]">Commercial Details</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="mb-1 block text-[11px] font-medium text-gray-700">Bill Rate ($) <span className="text-red-500">*</span></label>
                  <input
                    name="billRate"
                    type="number"
                    step="0.01"
                    value={contractFormData.billRate}
                    onChange={handleContractInputChange}
                    className={`h-10 w-full rounded-md border bg-white px-3 text-[12px] text-gray-900 outline-none ${contractFormErrors.billRate ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
                  />
                  {contractFormErrors.billRate && <p className="mt-1 text-[10px] text-red-500">{contractFormErrors.billRate}</p>}
                </div>

                <div className="space-y-1">
                  <label className="mb-1 block text-[11px] font-medium text-gray-700">Pay Rate ($) <span className="text-red-500">*</span></label>
                  <input
                    name="payRate"
                    type="number"
                    step="0.01"
                    value={contractFormData.payRate}
                    onChange={handleContractInputChange}
                    className={`h-10 w-full rounded-md border bg-white px-3 text-[12px] text-gray-900 outline-none ${contractFormErrors.payRate ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
                  />
                  {contractFormErrors.payRate && <p className="mt-1 text-[10px] text-red-500">{contractFormErrors.payRate}</p>}
                </div>

                <div className="space-y-1">
                  <label className="mb-1 block text-[11px] font-medium text-gray-700">Estimated Hours <span className="text-red-500">*</span></label>
                  <input
                    name="estimatedHours"
                    type="number"
                    value={contractFormData.estimatedHours}
                    onChange={handleContractInputChange}
                    className={`h-10 w-full rounded-md border bg-white px-3 text-[12px] text-gray-900 outline-none ${contractFormErrors.estimatedHours ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
                  />
                  {contractFormErrors.estimatedHours && <p className="mt-1 text-[10px] text-red-500">{contractFormErrors.estimatedHours}</p>}
                </div>

                <div className="space-y-1">
                  <label className="mb-1 block text-[11px] font-medium text-gray-700">Estimated Budget ($)</label>
                  <input
                    name="estimatedBudget"
                    type="number"
                    value={contractFormData.estimatedBudget}
                    readOnly
                    className={`h-10 w-full rounded-md border px-3 text-[12px] text-gray-900 outline-none ${contractFormErrors.estimatedBudget ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 bg-gray-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
                  />
                  {contractFormErrors.estimatedBudget && <p className="mt-1 text-[10px] text-red-500">{contractFormErrors.estimatedBudget}</p>}
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-[#1c2f4b]">Duration</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="mb-1 block text-[11px] font-medium text-gray-700">Start Date <span className="text-red-500">*</span></label>
                  <input
                    name="startDate"
                    type="date"
                    value={contractFormData.startDate}
                    onChange={handleContractInputChange}
                    min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}
                    className={`h-10 w-full rounded-md border bg-white px-3 text-[12px] text-gray-900 outline-none ${contractFormErrors.startDate ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
                  />
                  {contractFormErrors.startDate && <p className="mt-1 text-[10px] text-red-500">{contractFormErrors.startDate}</p>}
                </div>

                <div className="space-y-1">
                  <label className="mb-1 block text-[11px] font-medium text-gray-700">End Date <span className="text-red-500">*</span></label>
                  <input
                    name="endDate"
                    type="date"
                    value={contractFormData.endDate}
                    onChange={handleContractInputChange}
                    min={contractFormData.startDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}
                    className={`h-10 w-full rounded-md border bg-white px-3 text-[12px] text-gray-900 outline-none ${contractFormErrors.endDate ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
                  />
                  {contractFormErrors.endDate && <p className="mt-1 text-[10px] text-red-500">{contractFormErrors.endDate}</p>}
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-[#1c2f4b]">Contract Terms</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="mb-1 block text-[11px] font-medium text-gray-700">Notice Period (days)</label>
                  <input
                    name="noticePeriodDays"
                    type="number"
                    value={contractFormData.noticePeriodDays}
                    onChange={handleContractInputChange}
                    className={`h-10 w-full rounded-md border bg-white px-3 text-[12px] text-gray-900 outline-none ${contractFormErrors.noticePeriodDays ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
                  />
                  {contractFormErrors.noticePeriodDays && <p className="mt-1 text-[10px] text-red-500">{contractFormErrors.noticePeriodDays}</p>}
                </div>

                <div className="space-y-1">
                  <label className="mb-1 block text-[11px] font-medium text-gray-700">Through EOR</label>
                  <label className="flex h-10 items-center gap-2 rounded-md border border-gray-300 bg-[#f8fafc] px-3 text-[12px] text-gray-700">
                    <input
                      type="checkbox"
                      name="throughEor"
                      checked={contractFormData.throughEor}
                      onChange={handleContractInputChange}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Through EOR
                  </label>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-[#1c2f4b]">Remarks</h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="mb-1 block text-[11px] font-medium text-gray-700">Remarks</label>
                  <textarea
                    name="remarks"
                    rows={4}
                    value={contractFormData.remarks}
                    onChange={handleContractInputChange}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-[12px] text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="mb-1 block text-[11px] font-medium text-gray-700">Termination Remarks</label>
                  <textarea
                    name="terminationRemarks"
                    rows={4}
                    value={contractFormData.terminationRemarks}
                    onChange={handleContractInputChange}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-[12px] text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={Boolean(viewingContractor)}
          onClose={() => setViewingContractor(null)}
          title={`${viewingContractor?.name || 'Contractor'} - Contracts`}
          size="xxl"
        >
          {!viewingContractor || viewingContractor.contracts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center">
              <p className="font-medium text-gray-700">No contracts assigned yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {viewingContractor.contracts.map((contract) => (
                <div key={contract.id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">Contract #{contract.id}</p>
                    <Badge variant={String(contract.status).toUpperCase() === 'ACTIVE' ? 'approved' : 'default'}>{contract.status}</Badge>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <p className="text-sm text-gray-700">Customer: <span className="font-medium text-gray-900">{customerNameById[String(contract.customerId)] || '-'}</span></p>
                    <p className="text-sm text-gray-700">PO: <span className="font-medium text-gray-900">{contract.poAllocation || '-'}</span></p>
                    <p className="text-sm text-gray-700">Duration: <span className="font-medium text-gray-900">{formatters.formatDate(contract.startDate)} - {formatters.formatDate(contract.endDate)}</span></p>
                    <p className="text-sm text-gray-700">Pay Rate: <span className="font-medium text-gray-900">{formatters.formatCurrency(contract.payRate)}</span></p>
                    <p className="text-sm text-gray-700">Bill Rate: <span className="font-medium text-gray-900">{formatters.formatCurrency(contract.billRate)}</span></p>
                    <p className="text-sm text-gray-700">Hours: <span className="font-medium text-gray-900">{contract.estimatedHours || 0}</span></p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  )
}

export default ContractorsPage
