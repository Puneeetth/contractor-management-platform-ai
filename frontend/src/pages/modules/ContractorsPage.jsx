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
import { downloadContractorsPdf } from '../../utils/pdfExport'
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

  const resetContractorForm = () => {
    setContractorFormData(EMPTY_CONTRACTOR_FORM)
    setContractorFormErrors({})
    setShowContractorPassword(false)
    setShowContractorConfirmPassword(false)
  }

  const openContractModal = (contractorId = '') => {
    setContractFormData({ ...EMPTY_CONTRACT_FORM, contractorId: contractorId ? String(contractorId) : '' })
    setContractFormErrors({})
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
        parsedValue = parseFloat(value) || ''
      } else if (['estimatedHours', 'noticePeriodDays'].includes(name)) {
        parsedValue = parseInt(value, 10) || ''
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
    if ((name === 'billRate' || name === 'payRate') && contractFormErrors.rateValidation) {
      setContractFormErrors((prev) => ({ ...prev, rateValidation: '' }))
    }
  }

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
    if (Number(contractFormData.payRate) >= Number(contractFormData.billRate)) errors.rateValidation = 'Pay rate must be less than bill rate'
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
      setContractFormData(EMPTY_CONTRACT_FORM)
      setContractFormErrors({})
      setSuccess('Contract created successfully')
      await loadPageData()
    } catch (err) {
      setContractFormErrors({ submit: err?.message || 'Failed to create contract' })
    } finally {
      setIsCreatingContract(false)
    }
  }

  const regionOptions = ['ALL', 'UK', 'US', 'EU', 'APAC', 'MIDDLE EAST']

  const handleExportData = () => {
    downloadContractorsPdf({
      title: 'Contractors Export',
      filename: `contractors-export-${new Date().toISOString().slice(0, 10)}.pdf`,
      contractors: filteredRows,
      customerNameById,
    })
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
              onClick={handleExportData}
              className="inline-flex items-center gap-2 rounded-xl border border-[#d8e2ef] bg-white px-4 py-2 text-sm font-semibold text-[#1c2f4b] hover:bg-[#f7f9fc]"
            >
              <Download className="h-4 w-4" /> Export Data
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
            <Input label="Contractor ID" name="contractorId" value={contractorFormData.contractorId} onChange={(e) => setContractorFormData((p) => ({ ...p, contractorId: e.target.value }))} error={contractorFormErrors.contractorId} required />
            <Input label="Name" name="name" value={contractorFormData.name} onChange={(e) => setContractorFormData((p) => ({ ...p, name: e.target.value }))} error={contractorFormErrors.name} required />
            <Input label="Address" name="address" value={contractorFormData.address} onChange={(e) => setContractorFormData((p) => ({ ...p, address: e.target.value }))} error={contractorFormErrors.address} required />
            <Input label="Current Location (e.g. US/APAC)" name="currentLocation" value={contractorFormData.currentLocation} onChange={(e) => setContractorFormData((p) => ({ ...p, currentLocation: e.target.value }))} error={contractorFormErrors.currentLocation} required />
            <Input label="Email" name="email" type="email" value={contractorFormData.email} onChange={(e) => setContractorFormData((p) => ({ ...p, email: e.target.value }))} error={contractorFormErrors.email} required />
            <Input label="Secondary Email" name="secondaryEmail" type="email" value={contractorFormData.secondaryEmail} onChange={(e) => setContractorFormData((p) => ({ ...p, secondaryEmail: e.target.value }))} error={contractorFormErrors.secondaryEmail} required />
            <Input label="Phone Number" name="phoneNumber" value={contractorFormData.phoneNumber} onChange={(e) => setContractorFormData((p) => ({ ...p, phoneNumber: e.target.value }))} error={contractorFormErrors.phoneNumber} required />
            <Input label="Notice Period (days)" name="noticePeriodDays" type="number" value={contractorFormData.noticePeriodDays} onChange={(e) => setContractorFormData((p) => ({ ...p, noticePeriodDays: parseInt(e.target.value, 10) || 0 }))} error={contractorFormErrors.noticePeriodDays} />
            <Input label="Customer Manager" name="customerManager" value={contractorFormData.customerManager} onChange={(e) => setContractorFormData((p) => ({ ...p, customerManager: e.target.value }))} error={contractorFormErrors.customerManager} required />
            <Input label="Customer Manager Email" name="customerManagerEmail" type="email" value={contractorFormData.customerManagerEmail} onChange={(e) => setContractorFormData((p) => ({ ...p, customerManagerEmail: e.target.value }))} error={contractorFormErrors.customerManagerEmail} required />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <input
                  type={showContractorPassword ? 'text' : 'password'}
                  value={contractorFormData.password}
                  onChange={(e) => setContractorFormData((p) => ({ ...p, password: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-10 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" onClick={() => setShowContractorPassword((p) => !p)}>
                  {showContractorPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {contractorFormErrors.password && <p className="mt-1 text-xs text-red-600">{contractorFormErrors.password}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Confirm Password</label>
              <div className="relative">
                <input
                  type={showContractorConfirmPassword ? 'text' : 'password'}
                  value={contractorFormData.confirmPassword}
                  onChange={(e) => setContractorFormData((p) => ({ ...p, confirmPassword: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-10 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" onClick={() => setShowContractorConfirmPassword((p) => !p)}>
                  {showContractorConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {contractorFormErrors.confirmPassword && <p className="mt-1 text-xs text-red-600">{contractorFormErrors.confirmPassword}</p>}
            </div>
            <div className="md:col-span-2">
              <Textarea label="Remarks" name="remarks" value={contractorFormData.remarks} onChange={(e) => setContractorFormData((p) => ({ ...p, remarks: e.target.value }))} error={contractorFormErrors.remarks} required />
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={isContractModalOpen}
          onClose={() => setIsContractModalOpen(false)}
          title="Create Contract"
          size="xxl"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsContractModalOpen(false)}>Cancel</Button>
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

            {contractFormErrors.rateValidation && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-700">{contractFormErrors.rateValidation}</p>
              </div>
            )}

            {/* Section 1: Customer & PO Selection */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-[#1c2f4b]">Customer & PO Selection</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Select
                  label="Select Customer"
                  name="customerId"
                  value={contractFormData.customerId}
                  onChange={handleContractInputChange}
                  error={contractFormErrors.customerId}
                  required
                  placeholder="Select customer..."
                  options={customers.map((customer) => ({
                    value: String(customer.id),
                    label: customer.name,
                  }))}
                />
                <Select
                  label="Select PO"
                  name="poAllocation"
                  value={contractFormData.poAllocation}
                  onChange={handleContractInputChange}
                  error={contractFormErrors.poAllocation}
                  required
                  disabled={!contractFormData.customerId}
                  placeholder={contractFormData.customerId ? "Select PO..." : "Select a customer first"}
                  options={filteredPosForCustomer.map((po) => ({
                    value: String(po.poNumber).trim(),
                    label: `${po.poNumber}`,
                  }))}
                />
              </div>
            </div>

            {/* Section 2: Contractor Information */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-[#1c2f4b]">Contractor Information</h3>
              <div>
                <Select
                  label="Contractor"
                  name="contractorId"
                  value={contractFormData.contractorId}
                  onChange={handleContractInputChange}
                  error={contractFormErrors.contractorId}
                  required
                  placeholder="Select contractor..."
                  options={contractors.map((contractor) => ({
                    value: String(contractor.id),
                    label: `${contractor.name} (${contractor.contractorId})`,
                  }))}
                />
              </div>
            </div>

            {/* Section 3: Commercial Details */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-[#1c2f4b]">Commercial Details</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  label="Bill Rate ($)"
                  name="billRate"
                  type="number"
                  step="0.01"
                  value={contractFormData.billRate}
                  onChange={handleContractInputChange}
                  error={contractFormErrors.billRate}
                  required
                />
                <Input
                  label="Pay Rate ($)"
                  name="payRate"
                  type="number"
                  step="0.01"
                  value={contractFormData.payRate}
                  onChange={handleContractInputChange}
                  error={contractFormErrors.payRate}
                  required
                />
                <Input
                  label="Estimated Hours"
                  name="estimatedHours"
                  type="number"
                  value={contractFormData.estimatedHours}
                  onChange={handleContractInputChange}
                  error={contractFormErrors.estimatedHours}
                  required
                />
                <Input
                  label="Estimated Budget ($)"
                  name="estimatedBudget"
                  type="number"
                  value={contractFormData.estimatedBudget}
                  readOnly
                  className="bg-gray-50 cursor-not-allowed"
                  error={contractFormErrors.estimatedBudget}
                />
              </div>
            </div>

            {/* Section 4: Duration */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-[#1c2f4b]">Duration</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  label="Start Date"
                  name="startDate"
                  type="date"
                  value={contractFormData.startDate}
                  onChange={handleContractInputChange}
                  error={contractFormErrors.startDate}
                  required
                  min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}
                />
                <Input
                  label="End Date"
                  name="endDate"
                  type="date"
                  value={contractFormData.endDate}
                  onChange={handleContractInputChange}
                  error={contractFormErrors.endDate}
                  required
                  min={contractFormData.startDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}
                />
              </div>
            </div>

            {/* Section 5: Contract Terms */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-[#1c2f4b]">Contract Terms</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  label="Notice Period (days)"
                  name="noticePeriodDays"
                  type="number"
                  value={contractFormData.noticePeriodDays}
                  onChange={handleContractInputChange}
                  error={contractFormErrors.noticePeriodDays}
                />
                <div className="flex items-center">
                  <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 w-full cursor-pointer">
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

            {/* Section 6: Remarks */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-[#1c2f4b]">Remarks</h3>
              <div className="space-y-4">
                <Textarea label="Remarks" name="remarks" value={contractFormData.remarks} onChange={handleContractInputChange} />
                <Textarea label="Termination Remarks" name="terminationRemarks" value={contractFormData.terminationRemarks} onChange={handleContractInputChange} />
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
