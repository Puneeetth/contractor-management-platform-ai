import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  Briefcase,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Mail,
  MapPin,
  Phone,
  UserPlus,
} from 'lucide-react'
import { DashboardLayout } from '../../components/layout'
import { Badge, Button, Card, Input, Loader, Modal, Select, Textarea } from '../../components/ui'
import { contractService, contractorService } from '../../services/contractorService'
import { customerService } from '../../services/customerService'
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
  password: '',
  confirmPassword: '',
}

const EMPTY_CONTRACT_FORM = {
  contractorId: '',
  customerId: '',
  billRate: '',
  payRate: '',
  poAllocation: '',
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
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN'
  const canCreateContracts = ['ADMIN', 'MANAGER'].includes(user?.role)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState('')
  const [contracts, setContracts] = useState([])
  const [customers, setCustomers] = useState([])
  const [contractors, setContractors] = useState([])
  const [expandedContractorIds, setExpandedContractorIds] = useState([])

  const [isContractorModalOpen, setIsContractorModalOpen] = useState(false)
  const [isContractModalOpen, setIsContractModalOpen] = useState(false)

  const [contractorFormData, setContractorFormData] = useState(EMPTY_CONTRACTOR_FORM)
  const [contractFormData, setContractFormData] = useState(EMPTY_CONTRACT_FORM)
  const [contractorFormErrors, setContractorFormErrors] = useState({})
  const [contractFormErrors, setContractFormErrors] = useState({})
  const [isCreatingContractor, setIsCreatingContractor] = useState(false)
  const [isCreatingContract, setIsCreatingContract] = useState(false)

  useEffect(() => {
    loadPageData()
  }, [])

  const customerNameById = useMemo(
    () =>
      customers.reduce((lookup, customer) => {
        lookup[customer.id] = customer.name
        return lookup
      }, {}),
    [customers]
  )

  const contractsByContractorId = useMemo(
    () =>
      contracts.reduce((lookup, contract) => {
        const key = contract.contractorId
        if (!lookup[key]) {
          lookup[key] = []
        }
        lookup[key].push(contract)
        return lookup
      }, {}),
    [contracts]
  )

  const contractorRows = useMemo(
    () =>
      [...contractors]
        .sort((left, right) => left.name.localeCompare(right.name))
        .map((contractor) => {
          const contractorContracts = [...(contractsByContractorId[contractor.id] || [])].sort((left, right) =>
            (right.startDate || '').localeCompare(left.startDate || '')
          )
          const activeContractCount = contractorContracts.filter((contract) => contract.status === 'ACTIVE').length
          const totalBudget = contractorContracts.reduce((sum, contract) => sum + (Number(contract.estimatedBudget) || 0), 0)
          const totalPayout = contractorContracts.reduce(
            (sum, contract) => sum + ((Number(contract.payRate) || 0) * (Number(contract.estimatedHours) || 0)),
            0
          )

          return {
            ...contractor,
            contracts: contractorContracts,
            activeContractCount,
            totalBudget,
            totalPayout,
          }
        }),
    [contractors, contractsByContractorId]
  )

  const contractorCountWithContracts = contractorRows.filter((contractor) => contractor.contracts.length > 0).length
  const totalContractBudget = contractorRows.reduce((sum, contractor) => sum + contractor.totalBudget, 0)

  const calculateEstimatedBudget = (billRate, estimatedHours) => {
    const normalizedBillRate = Number(billRate)
    const normalizedHours = Number(estimatedHours)

    if (!normalizedBillRate || !normalizedHours) {
      return ''
    }

    return Number((normalizedBillRate * normalizedHours).toFixed(2))
  }

  const loadPageData = async () => {
    setIsLoading(true)
    setError(null)

    const [contractsResult, customersResult, contractorsResult] = await Promise.allSettled([
      contractService.getAllContracts(),
      customerService.getAllCustomers(),
      contractorService.getAllContractors(),
    ])

    if (contractsResult.status === 'fulfilled') {
      setContracts(Array.isArray(contractsResult.value) ? contractsResult.value : [])
    } else {
      setContracts([])
    }

    if (customersResult.status === 'fulfilled') {
      setCustomers(Array.isArray(customersResult.value) ? customersResult.value : [])
    } else {
      setCustomers([])
    }

    if (contractorsResult.status === 'fulfilled') {
      setContractors(Array.isArray(contractorsResult.value) ? contractorsResult.value : [])
    } else {
      setContractors([])
    }

    if (
      contractsResult.status === 'rejected' ||
      customersResult.status === 'rejected' ||
      contractorsResult.status === 'rejected'
    ) {
      setError('Failed to load contractor management data')
    }

    setIsLoading(false)
  }

  const resetContractorForm = () => {
    setContractorFormData(EMPTY_CONTRACTOR_FORM)
    setContractorFormErrors({})
  }

  const resetContractForm = (contractorId = '') => {
    setContractFormData({ ...EMPTY_CONTRACT_FORM, contractorId })
    setContractFormErrors({})
  }

  const toggleContractorExpansion = (contractorId) => {
    setExpandedContractorIds((previousIds) =>
      previousIds.includes(contractorId)
        ? previousIds.filter((id) => id !== contractorId)
        : [...previousIds, contractorId]
    )
  }

  const handleContractorInputChange = (event) => {
    const { name, value } = event.target

    setContractorFormData((previousData) => ({
      ...previousData,
      [name]: name === 'noticePeriodDays' ? parseInt(value, 10) || '' : value,
    }))

    if (contractorFormErrors[name]) {
      setContractorFormErrors((previousErrors) => ({ ...previousErrors, [name]: '' }))
    }
  }

  const handleContractInputChange = (event) => {
    const { name, value, type, checked } = event.target
    let blockedRateEntry = false

    setContractFormData((previousData) => {
      const parsedValue =
        type === 'checkbox'
          ? checked
          : ['billRate', 'payRate'].includes(name)
            ? parseFloat(value) || ''
            : ['contractorId', 'customerId'].includes(name)
              ? parseInt(value, 10) || ''
            : ['estimatedHours', 'noticePeriodDays'].includes(name)
              ? parseInt(value, 10) || ''
              : value

      const nextData = {
        ...previousData,
        [name]: parsedValue,
      }

      if (name === 'payRate' && parsedValue !== '' && previousData.billRate !== '' && Number(parsedValue) > Number(previousData.billRate)) {
        blockedRateEntry = true
        return previousData
      }

      if (name === 'billRate' && parsedValue !== '' && previousData.payRate !== '' && Number(previousData.payRate) >= Number(parsedValue)) {
        blockedRateEntry = true
        return previousData
      }

      if (name === 'billRate' || name === 'estimatedHours') {
        nextData.estimatedBudget = calculateEstimatedBudget(
          name === 'billRate' ? parsedValue : previousData.billRate,
          name === 'estimatedHours' ? parsedValue : previousData.estimatedHours
        )
      }

      return nextData
    })

    if (blockedRateEntry) {
      setContractFormErrors((previousErrors) => ({
        ...previousErrors,
        rateValidation: 'Pay rate must be less than bill rate',
      }))
      return
    }

    if (contractFormErrors[name]) {
      setContractFormErrors((previousErrors) => ({ ...previousErrors, [name]: '' }))
    }

    if ((name === 'billRate' || name === 'estimatedHours') && contractFormErrors.estimatedBudget) {
      setContractFormErrors((previousErrors) => ({ ...previousErrors, estimatedBudget: '' }))
    }

    if ((name === 'billRate' || name === 'payRate') && (contractFormErrors.billRate || contractFormErrors.payRate || contractFormErrors.rateValidation)) {
      setContractFormErrors((previousErrors) => ({ ...previousErrors, billRate: '', payRate: '', rateValidation: '' }))
    }
  }

  const validateContractorForm = () => {
    const nextErrors = {}

    if (!validators.isRequired(contractorFormData.contractorId)) nextErrors.contractorId = 'Contractor ID is required'
    if (!validators.isRequired(contractorFormData.name)) nextErrors.name = 'Name is required'
    if (!validators.isRequired(contractorFormData.address)) nextErrors.address = 'Address is required'
    if (!validators.isRequired(contractorFormData.currentLocation)) nextErrors.currentLocation = 'Current location is required'
    if (!validators.isRequired(contractorFormData.email)) {
      nextErrors.email = 'Email is required'
    } else if (!validators.isEmail(contractorFormData.email)) {
      nextErrors.email = 'Invalid email address'
    }
    if (!validators.isRequired(contractorFormData.secondaryEmail)) {
      nextErrors.secondaryEmail = 'Secondary email is required'
    } else if (!validators.isEmail(contractorFormData.secondaryEmail)) {
      nextErrors.secondaryEmail = 'Invalid email address'
    }
    if (!validators.isRequired(contractorFormData.phoneNumber)) nextErrors.phoneNumber = 'Phone number is required'
    if (!validators.isRequired(contractorFormData.noticePeriodDays) && contractorFormData.noticePeriodDays !== 0) {
      nextErrors.noticePeriodDays = 'Notice period is required'
    } else if (Number(contractorFormData.noticePeriodDays) < 0) {
      nextErrors.noticePeriodDays = 'Notice period cannot be negative'
    }
    if (!validators.isRequired(contractorFormData.remarks)) nextErrors.remarks = 'Remarks are required'
    if (!validators.isRequired(contractorFormData.password)) {
      nextErrors.password = 'Password is required'
    } else if (!validators.isStrongPassword(contractorFormData.password)) {
      nextErrors.password = 'Password must contain uppercase, lowercase, number and special character'
    }
    if (contractorFormData.password !== contractorFormData.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match'
    }

    setContractorFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const validateContractForm = () => {
    const nextErrors = {}

    if (!validators.isRequired(contractFormData.contractorId)) nextErrors.contractorId = 'Contractor is required'
    if (!validators.isRequired(contractFormData.billRate)) nextErrors.billRate = 'Bill rate is required'
    if (!validators.isRequired(contractFormData.payRate)) nextErrors.payRate = 'Pay rate is required'
    if (!validators.isRequired(contractFormData.estimatedHours)) nextErrors.estimatedHours = 'Estimated hours is required'
    if (!validators.isRequired(contractFormData.estimatedBudget)) nextErrors.estimatedBudget = 'Estimated budget is required'
    if (
      validators.isRequired(contractFormData.billRate) &&
      validators.isRequired(contractFormData.payRate) &&
      Number(contractFormData.payRate) >= Number(contractFormData.billRate)
    ) {
      nextErrors.rateValidation = 'Pay rate must be less than bill rate'
    }
    if (!validators.isRequired(contractFormData.startDate)) nextErrors.startDate = 'Start date is required'
    if (!validators.isRequired(contractFormData.endDate)) nextErrors.endDate = 'End date is required'
    if (
      validators.isRequired(contractFormData.startDate) &&
      validators.isRequired(contractFormData.endDate) &&
      contractFormData.endDate < contractFormData.startDate
    ) {
      nextErrors.endDate = 'End date must be after the start date'
    }
    if (Number(contractFormData.noticePeriodDays) < 0) nextErrors.noticePeriodDays = 'Notice period cannot be negative'

    setContractFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const submitContractor = async (event) => {
    event.preventDefault()
    if (!validateContractorForm()) return

    setIsCreatingContractor(true)
    setSuccess('')

    try {
      await contractorService.createContractor({
        contractorId: contractorFormData.contractorId,
        name: contractorFormData.name,
        address: contractorFormData.address,
        currentLocation: contractorFormData.currentLocation,
        email: contractorFormData.email,
        secondaryEmail: contractorFormData.secondaryEmail,
        phoneNumber: contractorFormData.phoneNumber,
        noticePeriodDays: contractorFormData.noticePeriodDays,
        remarks: contractorFormData.remarks,
        password: contractorFormData.password,
      })

      setIsContractorModalOpen(false)
      setSuccess(`Contractor ${contractorFormData.name} created successfully.`)
      resetContractorForm()
      await loadPageData()
    } catch (submissionError) {
      setContractorFormErrors({
        submit: submissionError?.error?.message || submissionError?.message || 'Failed to create contractor',
      })
    } finally {
      setIsCreatingContractor(false)
    }
  }

  const submitContract = async (event) => {
    event.preventDefault()
    if (!validateContractForm()) return

    setIsCreatingContract(true)
    setSuccess('')

    try {
      await contractService.createContract({
        ...contractFormData,
        contractorId: Number(contractFormData.contractorId),
        customerId: contractFormData.customerId ? Number(contractFormData.customerId) : null,
      })
      setIsContractModalOpen(false)
      setSuccess('Contract created successfully.')
      const createdForContractorId = Number(contractFormData.contractorId)
      resetContractForm()
      await loadPageData()
      if (!expandedContractorIds.includes(createdForContractorId)) {
        setExpandedContractorIds((previousIds) => [...previousIds, createdForContractorId])
      }
    } catch (submissionError) {
      setContractFormErrors({
        submit: submissionError?.error?.message || submissionError?.message || 'Failed to create contract',
      })
    } finally {
      setIsCreatingContract(false)
    }
  }

  const summaryStats = [
    {
      icon: UserPlus,
      label: 'Total Contractors',
      value: contractorRows.length,
      color: 'text-blue-400',
      bg: 'bg-blue-100',
    },
    {
      icon: CalendarDays,
      label: 'With Contracts',
      value: contractorCountWithContracts,
      color: 'text-emerald-400',
      bg: 'bg-emerald-100',
    },
    {
      icon: DollarSign,
      label: 'Total Contract Budget',
      value: formatters.formatCurrency(totalContractBudget),
      color: 'text-indigo-400',
      bg: 'bg-indigo-100',
    },
  ]

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contractors</h1>
            <p className="mt-1 text-sm text-gray-600">
              Create contractor profiles, attach contracts, and expand each contractor to review commercial details.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {isAdmin && (
              <Button
                variant="primary"
                onClick={() => {
                  resetContractorForm()
                  setIsContractorModalOpen(true)
                }}
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" /> Add Contractor
              </Button>
            )}
          </div>
        </div>

        {!isLoading && (
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {summaryStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="!p-4">
                  <div className="flex items-center gap-3">
                    <div className={`${stat.bg} rounded-xl p-2.5`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{stat.label}</p>
                      <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4"
          >
            <p className="text-sm font-medium text-emerald-700">{success}</p>
          </motion.div>
        )}

        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <div className="flex justify-center py-12">
                <Loader message="Loading contractors..." />
              </div>
            </Card>
          ) : contractorRows.length === 0 ? (
            <Card>
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                  <Briefcase className="h-8 w-8 text-gray-500" />
                </div>
                <p className="text-lg font-medium text-gray-700">No contractors found</p>
                <p className="mt-1 text-sm text-gray-500">
                  Add your first contractor to start tracking their contracts and rates.
                </p>
                {isAdmin && (
                  <Button
                    variant="primary"
                    className="mt-4"
                    onClick={() => {
                      resetContractorForm()
                      setIsContractorModalOpen(true)
                    }}
                  >
                    Create First Contractor
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            contractorRows.map((contractor, index) => {
              const isExpanded = expandedContractorIds.includes(contractor.id)

              return (
                <motion.div
                  key={contractor.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <Card isPadded={false} className="overflow-hidden border-gray-200/80 shadow-sm">
                    <div className="p-4 sm:p-5">
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-4">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2.5">
                                <h2 className="text-2xl font-semibold tracking-tight text-gray-900">{contractor.name}</h2>
                                <Badge variant="indigo">{contractor.contractorId || 'No ID'}</Badge>
                                <Badge variant={contractor.activeContractCount > 0 ? 'approved' : 'default'}>
                                  {contractor.activeContractCount} active
                                </Badge>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 lg:flex-shrink-0 lg:justify-end">
                              {canCreateContracts && (
                                <Button
                                  variant="secondary"
                                  className="min-w-[160px]"
                                  onClick={() => {
                                    resetContractForm(String(contractor.id))
                                    setIsContractModalOpen(true)
                                  }}
                                >
                                  Add Contract
                                </Button>
                              )}
                              <Button
                                variant="primary"
                                className="min-w-[180px]"
                                onClick={() => toggleContractorExpansion(contractor.id)}
                              >
                                <span className="flex items-center justify-center gap-2">
                                  {isExpanded ? 'Hide Contracts' : 'View Contracts'}
                                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </span>
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-2 text-sm text-gray-600 sm:grid-cols-2 xl:grid-cols-4">
                            <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2.5">
                              <Mail className="h-4 w-4 flex-shrink-0 text-gray-400" />
                              <span className="truncate">{contractor.email || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2.5">
                              <Phone className="h-4 w-4 flex-shrink-0 text-gray-400" />
                              <span className="truncate">{contractor.phoneNumber || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2.5">
                              <MapPin className="h-4 w-4 flex-shrink-0 text-gray-400" />
                              <span className="truncate">{contractor.currentLocation || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2.5">
                              <CalendarDays className="h-4 w-4 flex-shrink-0 text-gray-400" />
                              <span>{contractor.noticePeriodDays ?? 0} days notice</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 w-full">
                              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-500">Contracts</p>
                              <p className="mt-1 text-2xl font-semibold text-gray-900">{contractor.contracts.length}</p>
                            </div>
                          </div>
                          <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-500">Total Budget</p>
                            <p className="mt-1 text-2xl font-semibold text-gray-900">
                              {formatters.formatCurrency(contractor.totalBudget)}
                            </p>
                          </div>
                          <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-500">Estimated Payout</p>
                            <p className="mt-1 text-2xl font-semibold text-gray-900">
                              {formatters.formatCurrency(contractor.totalPayout)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-12">
                        <div className="rounded-xl bg-gray-50 px-4 py-3.5 text-sm text-gray-700 lg:col-span-5">
                          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-500">Address</p>
                          <p className="mt-1.5 leading-6 text-gray-900">{contractor.address || '-'}</p>
                        </div>
                        <div className="rounded-xl bg-gray-50 px-4 py-3.5 text-sm text-gray-700 lg:col-span-3">
                          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-500">Secondary Email</p>
                          <p className="mt-1.5 break-all text-gray-900">{contractor.secondaryEmail || '-'}</p>
                        </div>
                        <div className="rounded-xl bg-gray-50 px-4 py-3.5 text-sm text-gray-700 lg:col-span-4">
                          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-500">Remarks</p>
                          <p className="mt-1.5 leading-6 text-gray-900">{contractor.remarks || '-'}</p>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-gray-200 bg-gray-50/80 p-5">
                        {contractor.contracts.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center">
                            <p className="font-medium text-gray-700">No contracts assigned yet</p>
                            <p className="mt-1 text-sm text-gray-500">
                              Create a contract to start tracking rate, hours, totals, and EOR details for this contractor.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {contractor.contracts.map((contract) => {
                              const estimatedPayout = (Number(contract.payRate) || 0) * (Number(contract.estimatedHours) || 0)

                              return (
                                <div key={contract.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                    <div>
                                      <div className="flex flex-wrap items-center gap-3">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                          Contract #{String(contract.id).padStart(3, '0')}
                                        </h3>
                                        <Badge
                                          variant={
                                            contract.status === 'ACTIVE'
                                              ? 'approved'
                                              : contract.status === 'TERMINATED'
                                                ? 'rejected'
                                                : 'default'
                                          }
                                        >
                                          {contract.status}
                                        </Badge>
                                      </div>
                                      <p className="mt-1 text-sm text-gray-600">
                                        Customer: {customerNameById[contract.customerId] || 'Not assigned'}
                                      </p>
                                      <p className="mt-1 text-sm text-gray-600">
                                        {formatters.formatDate(contract.startDate)} to {formatters.formatDate(contract.endDate)}
                                      </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                      <Badge variant={contract.throughEor ? 'info' : 'default'}>
                                        {contract.throughEor ? 'Through EOR' : 'Direct'}
                                      </Badge>
                                      <Badge variant="indigo">{contract.noticePeriodDays ?? 0} day notice</Badge>
                                    </div>
                                  </div>

                                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                                    <div className="rounded-xl bg-gray-50 p-3">
                                      <p className="text-xs uppercase tracking-wide text-gray-500">Pay Rate</p>
                                      <p className="mt-1 text-base font-semibold text-gray-900">
                                        {formatters.formatCurrency(contract.payRate)}
                                      </p>
                                    </div>
                                    <div className="rounded-xl bg-gray-50 p-3">
                                      <p className="text-xs uppercase tracking-wide text-gray-500">Bill Rate</p>
                                      <p className="mt-1 text-base font-semibold text-gray-900">
                                        {formatters.formatCurrency(contract.billRate)}
                                      </p>
                                    </div>
                                    <div className="rounded-xl bg-gray-50 p-3">
                                      <p className="text-xs uppercase tracking-wide text-gray-500">Hours</p>
                                      <p className="mt-1 text-base font-semibold text-gray-900">
                                        {formatters.formatHours(contract.estimatedHours)}
                                      </p>
                                    </div>
                                    <div className="rounded-xl bg-gray-50 p-3">
                                      <p className="text-xs uppercase tracking-wide text-gray-500">Total Payout</p>
                                      <p className="mt-1 text-base font-semibold text-gray-900">
                                        {formatters.formatCurrency(estimatedPayout)}
                                      </p>
                                    </div>
                                    <div className="rounded-xl bg-gray-50 p-3">
                                      <p className="text-xs uppercase tracking-wide text-gray-500">Budget</p>
                                      <p className="mt-1 text-base font-semibold text-gray-900">
                                        {formatters.formatCurrency(contract.estimatedBudget)}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                                    <div className="rounded-xl border border-gray-200 p-4">
                                      <p className="text-xs uppercase tracking-wide text-gray-500">Remarks</p>
                                      <p className="mt-2 text-sm text-gray-800">{contract.remarks || '-'}</p>
                                    </div>
                                    <div className="rounded-xl border border-gray-200 p-4">
                                      <p className="text-xs uppercase tracking-wide text-gray-500">Termination Remarks</p>
                                      <p className="mt-2 text-sm text-gray-800">{contract.terminationRemarks || '-'}</p>
                                    </div>
                                  </div>

                                  {contract.poAllocation && (
                                    <div className="mt-4 rounded-xl border border-gray-200 p-4">
                                      <p className="text-xs uppercase tracking-wide text-gray-500">PO Allocation</p>
                                      <p className="mt-2 text-sm text-gray-800">{contract.poAllocation}</p>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                </motion.div>
              )
            })
          )}
        </div>

        <Modal
          isOpen={isContractorModalOpen}
          onClose={() => setIsContractorModalOpen(false)}
          title="Create Contractor"
          size="xxl"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsContractorModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" isLoading={isCreatingContractor} onClick={submitContractor}>
                Create Contractor
              </Button>
            </>
          }
        >
          <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={submitContractor}>
            {contractorFormErrors.submit && (
              <div className="md:col-span-2 rounded-xl border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-700">{contractorFormErrors.submit}</p>
              </div>
            )}

            <Input
              label="Contractor ID"
              name="contractorId"
              value={contractorFormData.contractorId}
              onChange={handleContractorInputChange}
              error={contractorFormErrors.contractorId}
              placeholder="CMP-CTR-001"
              required
            />
            <Input
              label="Full Name"
              name="name"
              value={contractorFormData.name}
              onChange={handleContractorInputChange}
              error={contractorFormErrors.name}
              placeholder="Contractor full name"
              required
            />
            <Input
              label="Email"
              type="email"
              name="email"
              value={contractorFormData.email}
              onChange={handleContractorInputChange}
              error={contractorFormErrors.email}
              placeholder="contractor@example.com"
              required
            />
            <Input
              label="Secondary Email"
              type="email"
              name="secondaryEmail"
              value={contractorFormData.secondaryEmail}
              onChange={handleContractorInputChange}
              error={contractorFormErrors.secondaryEmail}
              placeholder="alternate@example.com"
              required
            />
            <Input
              label="Phone Number"
              name="phoneNumber"
              value={contractorFormData.phoneNumber}
              onChange={handleContractorInputChange}
              error={contractorFormErrors.phoneNumber}
              placeholder="+91 9876543210"
              required
            />
            <Input
              label="Current Location"
              name="currentLocation"
              value={contractorFormData.currentLocation}
              onChange={handleContractorInputChange}
              error={contractorFormErrors.currentLocation}
              placeholder="Bangalore"
              required
            />
            <Input
              label="Notice Period (days)"
              type="number"
              name="noticePeriodDays"
              value={contractorFormData.noticePeriodDays}
              onChange={handleContractorInputChange}
              error={contractorFormErrors.noticePeriodDays}
              min="0"
              required
            />
            <Input
              label="Address"
              name="address"
              value={contractorFormData.address}
              onChange={handleContractorInputChange}
              error={contractorFormErrors.address}
              placeholder="Full address"
              required
            />
            <Input
              label="Password"
              type="password"
              name="password"
              value={contractorFormData.password}
              onChange={handleContractorInputChange}
              error={contractorFormErrors.password}
              placeholder="Strong password"
              required
            />
            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={contractorFormData.confirmPassword}
              onChange={handleContractorInputChange}
              error={contractorFormErrors.confirmPassword}
              placeholder="Re-enter password"
              required
            />

            <div className="md:col-span-2">
              <Textarea
                label="Remarks"
                name="remarks"
                value={contractorFormData.remarks}
                onChange={handleContractorInputChange}
                error={contractorFormErrors.remarks}
                placeholder="Important notes about the contractor"
                required
              />
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
              <Button variant="secondary" onClick={() => setIsContractModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" isLoading={isCreatingContract} onClick={submitContract}>
                Create Contract
              </Button>
            </>
          }
        >
          <form className="space-y-4" onSubmit={submitContract}>
            {contractFormErrors.submit && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-700">{contractFormErrors.submit}</p>
              </div>
            )}

            <Select
              label="Contractor"
              name="contractorId"
              value={contractFormData.contractorId}
              onChange={handleContractInputChange}
              error={contractFormErrors.contractorId}
              required
              options={[
                { value: '', label: 'Select a contractor...' },
                ...contractors.map((contractor) => ({
                  value: contractor.id,
                  label: `${contractor.name} (${contractor.contractorId || `ID-${contractor.id}`})`,
                })),
              ]}
            />

            <Select
              label="Customer"
              name="customerId"
              value={contractFormData.customerId}
              onChange={handleContractInputChange}
              options={[
                { value: '', label: 'Select a customer...' },
                ...customers.map((customer) => ({
                  value: customer.id,
                  label: customer.name,
                })),
              ]}
            />

            {contractFormErrors.rateValidation && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-700">{contractFormErrors.rateValidation}</p>
              </div>
            )}

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
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                step="0.01"
                value={contractFormData.estimatedBudget}
                error={contractFormErrors.estimatedBudget}
                readOnly
                className="cursor-not-allowed bg-gray-50"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Start Date"
                name="startDate"
                type="date"
                value={contractFormData.startDate}
                onChange={handleContractInputChange}
                error={contractFormErrors.startDate}
                required
              />
              <Input
                label="End Date"
                name="endDate"
                type="date"
                value={contractFormData.endDate}
                onChange={handleContractInputChange}
                error={contractFormErrors.endDate}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Notice Period (days)"
                name="noticePeriodDays"
                type="number"
                value={contractFormData.noticePeriodDays}
                onChange={handleContractInputChange}
                error={contractFormErrors.noticePeriodDays}
                min="0"
              />
              <Input
                label="PO Allocation"
                name="poAllocation"
                value={contractFormData.poAllocation}
                onChange={handleContractInputChange}
                placeholder="PO-2026-001"
              />
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <input
                id="throughEor"
                type="checkbox"
                name="throughEor"
                checked={contractFormData.throughEor}
                onChange={handleContractInputChange}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-200"
              />
              <label htmlFor="throughEor" className="text-sm font-medium text-gray-700">
                Through EOR
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Textarea
                label="Remarks"
                name="remarks"
                value={contractFormData.remarks}
                onChange={handleContractInputChange}
                placeholder="Commercial notes, onboarding notes, or delivery context"
              />
              <Textarea
                label="Termination Remarks"
                name="terminationRemarks"
                value={contractFormData.terminationRemarks}
                onChange={handleContractInputChange}
                placeholder="Termination context or exit notes"
              />
            </div>
          </form>
        </Modal>
      </motion.div>
    </DashboardLayout>
  )
}

export default ContractorsPage
