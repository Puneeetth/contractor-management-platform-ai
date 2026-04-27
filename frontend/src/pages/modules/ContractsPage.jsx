import React, { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Download,
  MoreVertical,
  Eye,
  Plus,
  Search,
  User,
} from 'lucide-react'
import { DashboardLayout } from '../../components/layout'
import ContractExportModal from '../../components/contracts/ContractExportModal'
import { Button, Card, Loader, Modal } from '../../components/ui'
import { contractorService } from '../../services/contractorService'
import { contractService } from '../../services/contractService'
import { customerService } from '../../services/customerService'
import { poService } from '../../services/poService'
import { dedupeBy } from '../../utils/dedupe'
import { formatters } from '../../utils/formatters'
import { validators } from '../../utils/validators'

const EMPTY_FORM = {
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

const ContractsPage = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [contracts, setContracts] = useState([])
  const [contractors, setContractors] = useState([])
  const [customers, setCustomers] = useState([])
  const [purchaseOrders, setPurchaseOrders] = useState([])

  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState({})

  const PAGE_SIZE = 10
  const minStartDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError('')
      const [contractsResult, contractorsResult, customersResult, poResult] = await Promise.allSettled([
        contractService.getAllContracts(),
        contractorService.getAllContractors(),
        customerService.getAllCustomers(),
        poService.getAllPurchaseOrders(),
      ])

      setContracts(
        contractsResult.status === 'fulfilled'
          ? dedupeBy(contractsResult.value, (contract, index) => contract?.id || `${contract?.contractorId || 'contractor'}-${contract?.startDate || ''}-${contract?.endDate || ''}-${index}`)
          : []
      )
      setContractors(
        contractorsResult.status === 'fulfilled'
          ? dedupeBy(contractorsResult.value, (contractor, index) => contractor?.id || contractor?.userId || `${contractor?.contractorId || contractor?.email || index}`)
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
        contractsResult.status === 'rejected' ||
        contractorsResult.status === 'rejected' ||
        customersResult.status === 'rejected' ||
        poResult.status === 'rejected'
      ) {
        setError('Failed to load contract management data')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const contractorById = useMemo(
    () =>
      contractors.reduce((lookup, contractor) => {
        lookup[String(contractor.id)] = contractor
        lookup[String(contractor.userId)] = contractor
        return lookup
      }, {}),
    [contractors]
  )

  const customerById = useMemo(
    () =>
      customers.reduce((lookup, customer) => {
        lookup[String(customer.id)] = customer
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

  const rows = useMemo(() => {
    return contracts.map((contract) => {
      const contractor = contractorById[String(contract.contractorId)] || null
      return {
        ...contract,
        displayName: contract.contractorName || contractor?.name || 'N/A',
        roleText: contractor?.remarks || 'Not Assigned',
      }
    })
  }, [contracts, contractorById])

  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows
    const q = searchTerm.toLowerCase()
    return rows.filter((row) => {
      return (
        String(row.displayName || '').toLowerCase().includes(q) ||
        String(row.poAllocation || '').toLowerCase().includes(q) ||
        String(row.status || '').toLowerCase().includes(q)
      )
    })
  }, [rows, searchTerm])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [searchTerm, rows.length])

  useEffect(() => {
    if (!success) return undefined
    const timeoutId = setTimeout(() => setSuccess(''), 5000)
    return () => clearTimeout(timeoutId)
  }, [success])

  const stats = useMemo(() => {
    const total = contracts.length
    const active = contracts.filter((contract) => String(contract.status || '').toUpperCase() === 'ACTIVE').length
    const upcoming = contracts.filter((contract) => String(contract.status || '').toUpperCase() === 'UPCOMING').length
    const totalBudget = contracts.reduce((sum, contract) => sum + (Number(contract.estimatedBudget) || 0), 0)
    return { total, active, upcoming, totalBudget }
  }, [contracts])

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target

    setFormData((prev) => {
      let parsedValue = type === 'checkbox' ? checked : value

      // Parse numeric fields
      if (['billRate', 'payRate'].includes(name)) {
        parsedValue = value === '' ? '' : parseFloat(value)
      } else if (['estimatedHours', 'noticePeriodDays'].includes(name)) {
        parsedValue = value === '' ? '' : parseInt(value, 10)
      }

      // Prevent payRate from being >= billRate
      if (name === 'payRate' && parsedValue !== '' && prev.billRate !== '' && Number(parsedValue) >= Number(prev.billRate)) {
        setFormErrors((p) => ({ ...p, payRate: 'Pay rate must be less than bill rate' }))
        return prev
      }
      if (name === 'billRate' && parsedValue !== '' && prev.payRate !== '' && Number(parsedValue) <= Number(prev.payRate)) {
        setFormErrors((p) => ({ ...p, payRate: 'Bill rate must be greater than pay rate' }))
        return prev
      }

      let next = { ...prev, [name]: parsedValue }

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
        const billRate = Number(name === 'billRate' ? parsedValue : prev.billRate) || 0
        const estimatedHours = Number(name === 'estimatedHours' ? parsedValue : prev.estimatedHours) || 0
        next.estimatedBudget = billRate > 0 && estimatedHours > 0 ? Number((billRate * estimatedHours).toFixed(2)) : ''
      }

      return next
    })

    if (name === 'billRate' || name === 'payRate') {
      setFormErrors((prev) => ({ ...prev, payRate: '' }))
    }
  }

  useEffect(() => {
    if (formData.payRate !== '' && formData.billRate !== '' && 
        Number(formData.payRate) >= Number(formData.billRate)) {
      setFormErrors(prev => ({ ...prev, payRate: 'Pay rate must be less than bill rate' }))
    } else {
      setFormErrors(prev => {
        if (prev.payRate === 'Pay rate must be less than bill rate') {
          return { ...prev, payRate: '' }
        }
        return prev
      })
    }
  }, [formData.payRate, formData.billRate])

  const filteredPosForCustomer = useMemo(() => {
    if (!formData.customerId) return []
    return posByCustomerId[String(formData.customerId)] || []
  }, [formData.customerId, posByCustomerId])

  const validateForm = () => {
    const errors = {}
    if (!validators.isRequired(formData.customerId)) errors.customerId = 'Customer is required'
    if (!validators.isRequired(formData.contractorId)) errors.contractorId = 'Contractor is required'
    if (!validators.isRequired(formData.billRate)) errors.billRate = 'Bill rate is required'
    if (!validators.isRequired(formData.payRate)) errors.payRate = 'Pay rate is required'
    if (formData.payRate && formData.billRate && Number(formData.payRate) >= Number(formData.billRate)) {
      errors.payRate = 'Pay rate must be less than bill rate'
    }
    if (!validators.isRequired(formData.estimatedHours)) errors.estimatedHours = 'Estimated hours is required'
    if (!validators.isRequired(formData.estimatedBudget)) errors.estimatedBudget = 'Estimated budget is required'
    if (!validators.isRequired(formData.startDate)) errors.startDate = 'Start date is required'
    if (!validators.isRequired(formData.endDate)) errors.endDate = 'End date is required'
    if (formData.startDate && formData.startDate < minStartDate) errors.startDate = 'Start date must be in the future'
    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) errors.endDate = 'End date cannot be before start date'
    if (Number(formData.noticePeriodDays) < 0) errors.noticePeriodDays = 'Notice period cannot be negative'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await contractService.createContract({
        contractorId: Number(formData.contractorId),
        customerId: formData.customerId ? Number(formData.customerId) : null,
        poAllocation: String(formData.poAllocation || '').trim() || null,
        billRate: Number(formData.billRate),
        payRate: Number(formData.payRate),
        estimatedHours: Number(formData.estimatedHours),
        estimatedBudget: Number(formData.estimatedBudget),
        startDate: formData.startDate,
        endDate: formData.endDate,
        noticePeriodDays: Number(formData.noticePeriodDays) || 0,
        throughEor: Boolean(formData.throughEor),
        remarks: String(formData.remarks || ''),
        terminationRemarks: String(formData.terminationRemarks || ''),
      })

      setIsModalOpen(false)
      setFormData(EMPTY_FORM)
      setFormErrors({})
      setSuccess('Contract created successfully')
      await loadData()
    } catch (err) {
      setFormErrors({ submit: err?.error?.message || err?.message || 'Failed to create contract' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleExportContracts = async (filters, resetModalState) => {
    setIsExporting(true)
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

      setIsExportModalOpen(false)
      resetModalState()
      setSuccess('Contracts exported successfully')
    } catch (err) {
      setError(err?.message || 'Failed to export contracts')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] leading-none font-bold text-[#0f1d33]">Contracts Management</h1>
            <p className="mt-1 text-[13px] text-[#4a5c77]">Centralized oversight of all organizational agreements and billing rates.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setError('')
                setSuccess('')
                setIsExportModalOpen(true)
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[#4b4fe8] px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_16px_rgba(75,79,232,0.25)] hover:bg-[#4347db]"
            >
              <Download className="h-4 w-4" /> Export Contracts
            </button>
          </div>
        </div>

        <Card className="border-[#d8e2ef] shadow-[0_4px_18px_rgba(15,23,42,0.04)]">
          <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-[minmax(0,1fr)_88px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#95a2b7]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search contracts..."
                className="h-9 w-full rounded-xl border border-[#e6ebf3] bg-white pl-10 pr-3 text-[13px] text-[#263448] placeholder:text-[#9aa8bb] outline-none focus:border-[#a9b9d3]"
              />
            </div>
            <button type="button" onClick={() => setSearchTerm('')} className="h-9 w-full rounded-xl border border-[#d8e2ef] bg-[#f8fbff] px-3 text-[13px] font-semibold text-[#4f5f78] hover:bg-white">
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
            <div className="flex justify-center py-12"><Loader message="Loading contracts..." /></div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-[#e0e8f3] bg-[#f7f9fc]">
                      <th className="whitespace-nowrap px-2.5 py-2 text-left text-[9px] font-bold tracking-[0.05em] text-[#5c6e89]">CONTRACTOR NAME</th>
                      <th className="whitespace-nowrap px-2 py-2 text-left text-[9px] font-bold tracking-[0.05em] text-[#5c6e89]">BILL RATE</th>
                      <th className="whitespace-nowrap px-2 py-2 text-left text-[9px] font-bold tracking-[0.05em] text-[#5c6e89]">PAY RATE</th>
                      <th className="whitespace-nowrap px-2 py-2 text-left text-[9px] font-bold tracking-[0.05em] text-[#5c6e89]">EST. HOURS</th>
                      <th className="whitespace-nowrap px-2 py-2 text-left text-[9px] font-bold tracking-[0.05em] text-[#5c6e89]">STATUS</th>
                      <th className="whitespace-nowrap px-2.5 py-2 text-right text-[9px] font-bold tracking-[0.05em] text-[#5c6e89]">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((row) => {
                      const normalizedStatus = String(row.status || '').toUpperCase()
                      const badgeClass =
                        normalizedStatus === 'ACTIVE'
                          ? 'bg-[#dff3e8] text-[#14834f]'
                          : normalizedStatus === 'UPCOMING'
                            ? 'bg-[#e7efff] text-[#2352d8]'
                            : 'bg-[#eef2f7] text-[#556981]'

                      return (
                        <tr key={row.id} className="border-b border-[#e5ebf4] bg-white">
                          <td className="px-2.5 py-2">
                            <div className="flex items-center gap-1.5">
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#eef2f7] text-[#60748f]">
                                <User className="h-3.5 w-3.5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate whitespace-nowrap text-[12.5px] font-semibold leading-none text-[#12203a]">{row.displayName}</p>
                                <p className="truncate whitespace-nowrap text-[9px] leading-none text-[#8a98ad]">{row.roleText}</p>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 text-[12.5px] font-medium leading-none text-[#23395b]">{formatters.formatCurrency(row.billRate)}/hr</td>
                          <td className="whitespace-nowrap px-2 py-2 text-[12.5px] font-medium leading-none text-[#23395b]">{formatters.formatCurrency(row.payRate)}/hr</td>
                          <td className="whitespace-nowrap px-2 py-2 text-[12.5px] font-medium leading-none text-[#23395b]">{formatters.formatHours(row.estimatedHours)} / week</td>
                          <td className="px-2 py-2"><span className={`inline-flex whitespace-nowrap rounded-lg px-1.5 py-0.5 text-[10px] leading-none ${badgeClass}`}>{normalizedStatus || 'PENDING'}</span></td>
                          <td className="px-2.5 py-2 text-right">
                            <button type="button" className="rounded-lg p-0.5 text-[#7f90ab] hover:bg-[#eef3fb] hover:text-[#4b4fe8]">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between px-5 py-4">
                <p className="text-[13px] text-[#5f6f88]">SHOWING <span className="font-semibold text-[#1e2d45]">{filteredRows.length}</span> OF <span className="font-semibold text-[#1e2d45]">{rows.length}</span> CONTRACT RECORDS</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex h-9 min-w-12 items-center justify-center rounded-lg border border-[#d8e2ef] px-3 text-[13px] font-semibold text-[#8aa0bc] disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex h-9 min-w-12 items-center justify-center rounded-lg border border-[#d8e2ef] px-3 text-[13px] font-semibold text-[#23395b] disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </Card>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create New Contract"
          size="xxl"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button variant="primary" isLoading={isSubmitting} onClick={handleSubmit}>Create Contract</Button>
            </>
          }
        >
          <form className="space-y-5" onSubmit={handleSubmit}>
            {formErrors.submit && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-700">{formErrors.submit}</p>
              </div>
            )}

            {/* Section 1: Customer & PO Selection */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-[#1c2f4b]">Customer & PO Selection</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="mb-1 block text-[11px] font-medium text-gray-700">Select Customer <span className="text-red-500">*</span></label>
                  <select
                    name="customerId"
                    value={formData.customerId}
                    onChange={handleInputChange}
                    className={`h-10 w-full rounded-md border bg-white px-3 text-[12px] text-gray-900 outline-none ${formErrors.customerId ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
                  >
                    <option value="">Select customer...</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={String(customer.id)}>{customer.name}</option>
                    ))}
                  </select>
                  {formErrors.customerId && <p className="mt-1 text-[10px] text-red-500">{formErrors.customerId}</p>}
                </div>
                <div className="space-y-1">
                  <label className="mb-1 block text-[11px] font-medium text-gray-700">Select PO <span className="text-red-500">*</span></label>
                  <select
                    name="poAllocation"
                    value={formData.poAllocation}
                    onChange={handleInputChange}
                    disabled={!formData.customerId}
                    className={`h-10 w-full rounded-md border bg-white px-3 text-[12px] text-gray-900 outline-none disabled:bg-gray-100 ${formErrors.poAllocation ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
                  >
                    <option value="">{formData.customerId ? 'Select PO...' : 'Select a customer first'}</option>
                    {filteredPosForCustomer.map((po) => (
                      <option key={po.id || po.poNumber} value={String(po.poNumber).trim()}>{po.poNumber}</option>
                    ))}
                  </select>
                  {formErrors.poAllocation && <p className="mt-1 text-[10px] text-red-500">{formErrors.poAllocation}</p>}
                </div>
              </div>
            </div>

            {/* Section 2: Contractor Information */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-[#1c2f4b]">Contractor Information</h3>
              <div className="space-y-1">
                <label className="mb-1 block text-[11px] font-medium text-gray-700">Contractor <span className="text-red-500">*</span></label>
                <select
                  name="contractorId"
                  value={formData.contractorId}
                  onChange={handleInputChange}
                  className={`h-10 w-full rounded-md border bg-white px-3 text-[12px] text-gray-900 outline-none ${formErrors.contractorId ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
                >
                  <option value="">Select contractor...</option>
                  {contractors.map((contractor) => (
                    <option key={contractor.id} value={String(contractor.id)}>{contractor.name} ({contractor.contractorId})</option>
                  ))}
                </select>
                {formErrors.contractorId && <p className="mt-1 text-[10px] text-red-500">{formErrors.contractorId}</p>}
              </div>
            </div>

            {/* Section 3: Commercial Details */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-[#1c2f4b]">Commercial Details</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="mb-1 block text-[11px] font-medium text-gray-700">Bill Rate ($) <span className="text-red-500">*</span></label>
                  <input
                    name="billRate"
                    type="number"
                    step="0.01"
                    value={formData.billRate}
                    onChange={handleInputChange}
                    className={`h-10 w-full rounded-md border bg-white px-3 text-[12px] text-gray-900 outline-none ${formErrors.billRate ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
                  />
                  {formErrors.billRate && <p className="mt-1 text-[10px] text-red-500">{formErrors.billRate}</p>}
                </div>
                <div className="space-y-1">
                  <label className="mb-1 block text-[11px] font-medium text-gray-700">Pay Rate ($) <span className="text-red-500">*</span></label>
                  <input
                    name="payRate"
                    type="number"
                    step="0.01"
                    value={formData.payRate}
                    onChange={handleInputChange}
                    className={`h-10 w-full rounded-md border bg-white px-3 text-[12px] text-gray-900 outline-none ${formErrors.payRate ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
                  />
                  {formErrors.payRate && <p className="mt-1 text-[10px] text-red-500">{formErrors.payRate}</p>}
                </div>
                <div className="space-y-1">
                  <label className="mb-1 block text-[11px] font-medium text-gray-700">Estimated Hours <span className="text-red-500">*</span></label>
                  <input
                    name="estimatedHours"
                    type="number"
                    value={formData.estimatedHours}
                    onChange={handleInputChange}
                    className={`h-10 w-full rounded-md border bg-white px-3 text-[12px] text-gray-900 outline-none ${formErrors.estimatedHours ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
                  />
                  {formErrors.estimatedHours && <p className="mt-1 text-[10px] text-red-500">{formErrors.estimatedHours}</p>}
                </div>
                <div className="space-y-1">
                  <label className="mb-1 block text-[11px] font-medium text-gray-700">Estimated Budget ($)</label>
                  <input
                    name="estimatedBudget"
                    type="number"
                    value={formData.estimatedBudget}
                    readOnly
                    className={`h-10 w-full rounded-md border px-3 text-[12px] text-gray-900 outline-none ${formErrors.estimatedBudget ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 bg-gray-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
                  />
                  {formErrors.estimatedBudget && <p className="mt-1 text-[10px] text-red-500">{formErrors.estimatedBudget}</p>}
                </div>
              </div>
            </div>

            {/* Section 4: Duration */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-[#1c2f4b]">Duration</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="mb-1 block text-[11px] font-medium text-gray-700">Start Date <span className="text-red-500">*</span></label>
                  <input
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    min={minStartDate}
                    className={`h-10 w-full rounded-md border bg-white px-3 text-[12px] text-gray-900 outline-none ${formErrors.startDate ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
                  />
                  {formErrors.startDate && <p className="mt-1 text-[10px] text-red-500">{formErrors.startDate}</p>}
                </div>
                <div className="space-y-1">
                  <label className="mb-1 block text-[11px] font-medium text-gray-700">End Date <span className="text-red-500">*</span></label>
                  <input
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    min={formData.startDate || minStartDate}
                    className={`h-10 w-full rounded-md border bg-white px-3 text-[12px] text-gray-900 outline-none ${formErrors.endDate ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
                  />
                  {formErrors.endDate && <p className="mt-1 text-[10px] text-red-500">{formErrors.endDate}</p>}
                </div>
              </div>
            </div>

            {/* Section 5: Contract Terms */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-[#1c2f4b]">Contract Terms</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="mb-1 block text-[11px] font-medium text-gray-700">Notice Period (days)</label>
                  <input
                    name="noticePeriodDays"
                    type="number"
                    value={formData.noticePeriodDays}
                    onChange={handleInputChange}
                    className={`h-10 w-full rounded-md border bg-white px-3 text-[12px] text-gray-900 outline-none ${formErrors.noticePeriodDays ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
                  />
                  {formErrors.noticePeriodDays && <p className="mt-1 text-[10px] text-red-500">{formErrors.noticePeriodDays}</p>}
                </div>
                <div className="flex items-center">
                  <label className="flex h-10 w-full items-center gap-2 rounded-md border border-gray-300 bg-gray-50 px-3 text-[12px] text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      name="throughEor"
                      checked={formData.throughEor}
                      onChange={handleInputChange}
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
                <div className="space-y-1">
                  <label className="mb-1 block text-[11px] font-medium text-gray-700">Remarks</label>
                  <textarea
                    name="remarks"
                    rows={4}
                    value={formData.remarks}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-[12px] text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="mb-1 block text-[11px] font-medium text-gray-700">Termination Remarks</label>
                  <textarea
                    name="terminationRemarks"
                    rows={4}
                    value={formData.terminationRemarks}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-[12px] text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>
            </div>
          </form>
        </Modal>

        <ContractExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          customers={customers}
          contractors={contractors}
          isExporting={isExporting}
          onExport={handleExportContracts}
        />
      </div>
    </DashboardLayout>
  )
}

export default ContractsPage
