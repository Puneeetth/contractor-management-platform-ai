import React, { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Download,
  Plus,
  Search,
  UploadCloud,
} from 'lucide-react'
import { DashboardLayout } from '../../components/layout'
import { Card, Button, Loader, Modal } from '../../components/ui'
import { poService } from '../../services/poService'
import { customerService } from '../../services/customerService'
import { dedupeBy } from '../../utils/dedupe'
import { formatters } from '../../utils/formatters'
import { downloadPOsPdf } from '../../utils/pdfExport'
import { validators } from '../../utils/validators'
import { COUNTRY_CURRENCY_MAP, COUNTRIES } from '../../constants'

const EMPTY_FORM = {
  poNumber: '',
  poDate: '',
  startDate: '',
  endDate: '',
  poValue: '',
  country: '',
  currency: '',
  paymentTermsDays: 30,
  customerId: '',
  remark: '',
  numberOfResources: '',
  sharedWith: '',
  file: null,
  sowFile: null,
}

const POsPage = () => {
  const [mode, setMode] = useState('list')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [pos, setPos] = useState([])
  const [customers, setCustomers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [selectedPo, setSelectedPo] = useState(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState({})

  const PAGE_SIZE = 10

  useEffect(() => {
    loadData()
  }, [])
  const loadData = async () => {
    try {
      setIsLoading(true)
      setError('')
      const [poResult, customerResult] = await Promise.allSettled([
        poService.getAllPurchaseOrders(),
        customerService.getAllCustomers(),
      ])

      setPos(
        poResult.status === 'fulfilled'
          ? dedupeBy(poResult.value, (po, index) => po?.id || `${po?.poNumber || 'po'}-${po?.customerId || index}`)
          : []
      )
      setCustomers(
        customerResult.status === 'fulfilled'
          ? dedupeBy(customerResult.value, (customer, index) => customer?.id || `${customer?.name || 'customer'}-${customer?.msa || index}`)
          : []
      )

      if (poResult.status === 'rejected' || customerResult.status === 'rejected') {
        setError('Failed to load purchase order data')
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

  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return pos
    const q = searchTerm.toLowerCase()
    return pos.filter((po) => {
      return (
        String(po.poNumber || '').toLowerCase().includes(q) ||
        String(customerNameById[String(po.customerId)] || '').toLowerCase().includes(q)
      )
    })
  }, [pos, searchTerm, customerNameById])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [searchTerm, pos.length])

  const stats = useMemo(() => {
    const totalPOs = pos.length
    const totalValue = pos.reduce((sum, po) => sum + (Number(po.poValue) || 0), 0)
    const totalResources = pos.reduce((sum, po) => sum + (Number(po.numberOfResources) || 0), 0)
    return { totalPOs, totalValue, totalResources }
  }, [pos])

  const today = useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }, [])

  const validateForm = () => {
    const errors = {}
    if (!validators.isRequired(formData.customerId)) errors.customerId = 'Customer is required'
    if (!validators.isRequired(formData.poNumber)) errors.poNumber = 'PO Number is required'
    if (!validators.isRequired(formData.poDate)) errors.poDate = 'PO Date is required'
    if (!validators.isRequired(formData.startDate)) errors.startDate = 'Start Date is required'
    if (!validators.isRequired(formData.endDate)) errors.endDate = 'End Date is required'
    if (!validators.isRequired(formData.poValue)) errors.poValue = 'PO Value is required'
    if (formData.poValue && Number(formData.poValue) <= 0) errors.poValue = 'PO Value must be greater than 0'
    if (!validators.isRequired(formData.country)) errors.country = 'Country is required'
    if (!validators.isRequired(formData.currency)) errors.currency = 'Currency is required'
    if (!validators.isRequired(formData.paymentTermsDays) && formData.paymentTermsDays !== 0) errors.paymentTermsDays = 'Payment terms is required'
    if (!validators.isRequired(formData.numberOfResources) && formData.numberOfResources !== 0) errors.numberOfResources = 'No. of resources is required'
    if (formData.numberOfResources && Number(formData.numberOfResources) <= 0) errors.numberOfResources = 'Number of resources must be greater than 0'
    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      errors.endDate = 'End Date cannot be before Start Date'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (event) => {
    const { name, value } = event.target
    const numberFields = ['poValue', 'paymentTermsDays', 'numberOfResources', 'customerId']
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: numberFields.includes(name) ? (value === '' ? '' : Number(value)) : value,
      }
      // Auto-fill currency when country changes
      if (name === 'country' && COUNTRY_CURRENCY_MAP[value]) {
        updated.currency = COUNTRY_CURRENCY_MAP[value]
      }
      return updated
    })
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleFileChange = (event, fieldName = 'file') => {
    const file = event.target.files?.[0] || null
    setFormData((prev) => ({ ...prev, [fieldName]: file }))
  }

  const handleCreatePO = async (event) => {
    event.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await poService.createPurchaseOrder(formData)
      setSuccess('Purchase order created successfully')
      setFormData(EMPTY_FORM)
      setFormErrors({})
      setMode('list')
      await loadData()
    } catch (err) {
      setFormErrors({ submit: err?.message || 'Failed to create purchase order' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleExportData = () => {
    downloadPOsPdf({
      title: 'Purchase Orders Export',
      filename: `purchase-orders-export-${new Date().toISOString().slice(0, 10)}.pdf`,
      pos: filteredRows,
      customerNameById,
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
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

        {mode === 'list' ? (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-[22px] leading-none font-bold text-[#0f1d33]">Purchase Orders</h1>
                <p className="mt-1 text-[13px] text-[#4a5c77]">Manage and track procurement cycles across the enterprise.</p>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={handleExportData} className="inline-flex items-center gap-2 rounded-xl border border-[#d8e2ef] bg-white px-4 py-2 text-sm font-semibold text-[#1c2f4b] hover:bg-[#f7f9fc]">
                  <Download className="h-4 w-4" /> Export
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('create')
                    setFormData(EMPTY_FORM)
                    setFormErrors({})
                    setSuccess('')
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#4b4fe8] px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_16px_rgba(75,79,232,0.25)] hover:bg-[#4347db]"
                >
                  <Plus className="h-4 w-4" /> New PO
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
                    placeholder="Search orders, customers..."
                    className="h-9 w-full rounded-xl border border-[#e6ebf3] bg-white pl-10 pr-3 text-[13px] text-[#263448] placeholder:text-[#9aa8bb] outline-none focus:border-[#a9b9d3]"
                  />
                </div>
                <button type="button" onClick={() => setSearchTerm('')} className="h-9 w-full rounded-xl border border-[#d8e2ef] bg-[#f8fbff] px-3 text-[13px] font-semibold text-[#4f5f78] hover:bg-white">
                  Clear
                </button>
              </div>
            </Card>

            <Card className="border-[#d8e2ef] shadow-[0_8px_24px_rgba(15,23,42,0.05)]" isPadded={false}>
              {isLoading ? (
                <div className="py-12 flex justify-center"><Loader message="Loading purchase orders..." /></div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-[#e0e8f3] bg-[#f7f9fc]">
                          <th className="whitespace-nowrap px-3 py-2.5 text-left text-[9px] font-bold tracking-[0.05em] text-[#5c6e89]">PO Number</th>
                          <th className="whitespace-nowrap px-2.5 py-2.5 text-left text-[9px] font-bold tracking-[0.05em] text-[#5c6e89]">Customer</th>
                          <th className="whitespace-nowrap px-2.5 py-2.5 text-left text-[9px] font-bold tracking-[0.05em] text-[#5c6e89]">PO Date</th>
                          <th className="whitespace-nowrap px-2.5 py-2.5 text-left text-[9px] font-bold tracking-[0.05em] text-[#5c6e89]">PO Value</th>
                          <th className="whitespace-nowrap px-3 py-2.5 text-right text-[9px] font-bold tracking-[0.05em] text-[#5c6e89]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageRows.map((row) => (
                          <tr key={row.id} className="border-b border-[#e5ebf4] bg-white">
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#dee5fb] text-[#3e53dd]">
                                  <Briefcase className="h-3.5 w-3.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate whitespace-nowrap text-[13px] font-semibold leading-none text-[#12203a]">{row.poNumber}</p>
                                  <p className="truncate whitespace-nowrap text-[10px] text-[#8a98ad]">{customerNameById[String(row.customerId)] || `Customer #${row.customerId}`}</p>
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-2.5 py-2.5 text-[13px] font-medium text-[#111827]">{customerNameById[String(row.customerId)] || `Customer #${row.customerId}`}</td>
                            <td className="whitespace-nowrap px-2.5 py-2.5 text-[13px] text-[#374151]">{formatters.formatDate(row.poDate)}</td>
                            <td className="whitespace-nowrap px-2.5 py-2.5 text-[13px] font-semibold text-[#111827]">{formatters.formatCurrency(row.poValue)}</td>
                            <td className="px-3 py-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedPo(row)}
                                className="inline-flex items-center gap-1 text-[13px] font-medium text-[#3f4fe8] hover:underline"
                              >
                                View <ArrowRight className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between px-5 py-4">
                    <p className="text-sm text-[#5f6f88]">
                      Showing {(currentPage - 1) * PAGE_SIZE + (pageRows.length ? 1 : 0)} to {(currentPage - 1) * PAGE_SIZE + pageRows.length} of {filteredRows.length} results
                    </p>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#d8e2ef] text-[#8aa0bc] disabled:opacity-50">‹</button>
                      <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-lg bg-[#4b4fe8] px-3 text-sm font-semibold text-white">{currentPage}</span>
                      <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#d8e2ef] text-[#8aa0bc] disabled:opacity-50">›</button>
                    </div>
                  </div>
                </>
              )}
            </Card>

          </>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-[22px] leading-none font-bold text-[#0f1d33]">Create New Purchase Order</h1>
                <p className="mt-1 text-[12px] text-[#4a5c77]">Initiate a new procurement request by filling in the details below.</p>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setMode('list')} className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#d8e2ef] bg-white px-3.5 text-[13px] font-semibold text-[#1c2f4b] hover:bg-[#f7f9fc]">
                  Cancel
                </button>
                <button type="button" onClick={handleCreatePO} className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#4b4fe8] px-3.5 text-[13px] font-semibold text-white shadow-[0_8px_16px_rgba(75,79,232,0.25)] hover:bg-[#4347db]">
                  Create PO
                </button>
              </div>
            </div>

            {formErrors.submit && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-700">{formErrors.submit}</p>
              </div>
            )}

            <form onSubmit={handleCreatePO} className="space-y-5">
              {/* Section 1: Customer */}
              <div>
                <h2 className="mb-1.5 text-[13px] font-semibold text-[#111827]">Customer</h2>
                <Card className="border-[#d8e2ef] px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                  <div className="w-full">
                    <label className="mb-1 block text-[11px] font-medium text-gray-700">Select Customer <span className="text-red-500">*</span></label>
                    <select
                      name="customerId"
                      value={formData.customerId}
                      onChange={handleInputChange}
                      className={`h-9 w-full rounded-md border bg-white px-2.5 text-[13px] text-gray-900 outline-none ${
                        formErrors.customerId
                          ? 'border-red-400 focus:ring-2 focus:ring-red-100 focus:border-red-500'
                          : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                      }`}
                    >
                      <option value="">Choose a customer</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={String(customer.id)}>{customer.name}</option>
                      ))}
                    </select>
                    {formErrors.customerId && <p className="mt-1 text-[10px] text-red-500">{formErrors.customerId}</p>}
                  </div>
                </Card>
              </div>

              {/* Section 2: Order Identification */}
              <div>
                <h2 className="mb-1.5 text-[13px] font-semibold text-[#111827]">Order Identification</h2>
                <Card className="border-[#d8e2ef] px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                  <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2">
                    <div className="w-full">
                      <label className="mb-1 block text-[11px] font-medium text-gray-700">PO Number <span className="text-red-500">*</span></label>
                      <input
                        name="poNumber"
                        value={formData.poNumber}
                        onChange={handleInputChange}
                        placeholder="e.g. PO-2023-001"
                        className={`h-9 w-full rounded-md border bg-white px-2.5 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none ${
                          formErrors.poNumber
                            ? 'border-red-400 focus:ring-2 focus:ring-red-100 focus:border-red-500'
                            : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                        }`}
                      />
                      {formErrors.poNumber && <p className="mt-1 text-[10px] text-red-500">{formErrors.poNumber}</p>}
                    </div>
                    <div className="w-full">
                      <label className="mb-1 block text-[11px] font-medium text-gray-700">PO Date <span className="text-red-500">*</span></label>
                      <input
                        name="poDate"
                        type="date"
                        value={formData.poDate}
                        onChange={handleInputChange}
                        className={`h-9 w-full rounded-md border bg-white px-2.5 text-[13px] text-gray-900 focus:outline-none ${
                          formErrors.poDate
                            ? 'border-red-400 focus:ring-2 focus:ring-red-100 focus:border-red-500'
                            : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                        }`}
                      />
                      {formErrors.poDate && <p className="mt-1 text-[10px] text-red-500">{formErrors.poDate}</p>}
                    </div>
                    <div className="w-full">
                      <label className="mb-1 block text-[11px] font-medium text-gray-700">Start Date <span className="text-red-500">*</span></label>
                      <input
                        name="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        className={`h-9 w-full rounded-md border bg-white px-2.5 text-[13px] text-gray-900 focus:outline-none ${
                          formErrors.startDate
                            ? 'border-red-400 focus:ring-2 focus:ring-red-100 focus:border-red-500'
                            : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                        }`}
                      />
                      {formErrors.startDate && <p className="mt-1 text-[10px] text-red-500">{formErrors.startDate}</p>}
                    </div>
                    <div className="w-full">
                      <label className="mb-1 block text-[11px] font-medium text-gray-700">End Date <span className="text-red-500">*</span></label>
                      <input
                        name="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        className={`h-9 w-full rounded-md border bg-white px-2.5 text-[13px] text-gray-900 focus:outline-none ${
                          formErrors.endDate
                            ? 'border-red-400 focus:ring-2 focus:ring-red-100 focus:border-red-500'
                            : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                        }`}
                      />
                      {formErrors.endDate && <p className="mt-1 text-[10px] text-red-500">{formErrors.endDate}</p>}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Section 3: Financial Details */}
              <div>
                <h2 className="mb-1.5 text-[13px] font-semibold text-[#111827]">Financial Details</h2>
                <Card className="border-[#d8e2ef] px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                  <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2">
                    <div className="w-full">
                      <label className="mb-1 block text-[11px] font-medium text-gray-700">PO Value <span className="text-red-500">*</span></label>
                      <input
                        name="poValue"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.poValue}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        className={`h-9 w-full rounded-md border bg-white px-2.5 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none ${
                          formErrors.poValue
                            ? 'border-red-400 focus:ring-2 focus:ring-red-100 focus:border-red-500'
                            : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                        }`}
                      />
                      {formErrors.poValue && <p className="mt-1 text-[10px] text-red-500">{formErrors.poValue}</p>}
                    </div>
                    <div className="flex gap-2">
                      <div className="w-[70%]">
                        <label className="mb-1 block text-[11px] font-medium text-gray-700">Country <span className="text-red-500">*</span></label>
                        <select
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          className={`h-9 w-full rounded-md border bg-white px-2.5 text-[13px] text-gray-900 outline-none ${
                            formErrors.country
                              ? 'border-red-400 focus:ring-2 focus:ring-red-100 focus:border-red-500'
                              : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                          }`}
                        >
                          <option value="">Select a country</option>
                          {COUNTRIES.map((country) => (
                            <option key={country} value={country}>{country}</option>
                          ))}
                        </select>
                        {formErrors.country && <p className="mt-1 text-[10px] text-red-500">{formErrors.country}</p>}
                      </div>
                      <div className="w-[30%]">
                        <label className="mb-1 block text-[11px] font-medium text-gray-700">Currency</label>
                        <select
                          name="currency"
                          value={formData.currency}
                          onChange={handleInputChange}
                          className={`h-9 w-full rounded-md border bg-white px-2.5 text-[13px] text-gray-900 outline-none ${
                            formErrors.currency
                              ? 'border-red-400 focus:ring-2 focus:ring-red-100 focus:border-red-500'
                              : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                          }`}
                        >
                          <option value="">-</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                          <option value="INR">INR</option>
                          <option value="AUD">AUD</option>
                          <option value="CAD">CAD</option>
                          <option value="JPY">JPY</option>
                          <option value="SGD">SGD</option>
                          <option value="AED">AED</option>
                          <option value="SAR">SAR</option>
                          <option value="CNY">CNY</option>
                          <option value="BRL">BRL</option>
                          <option value="MXN">MXN</option>
                          <option value="KRW">KRW</option>
                          <option value="IDR">IDR</option>
                          <option value="MYR">MYR</option>
                          <option value="THB">THB</option>
                          <option value="ZAR">ZAR</option>
                          <option value="NGN">NGN</option>
                          <option value="EGP">EGP</option>
                          <option value="PLN">PLN</option>
                          <option value="SEK">SEK</option>
                          <option value="CHF">CHF</option>
                        </select>
                        {formErrors.currency && <p className="mt-1 text-[10px] text-red-500">{formErrors.currency}</p>}
                      </div>
                    </div>
                    <div className="w-full">
                      <label className="mb-1 block text-[11px] font-medium text-gray-700">Payment Terms (Days)</label>
                      <input
                        name="paymentTermsDays"
                        type="number"
                        min="0"
                        value={formData.paymentTermsDays}
                        onChange={handleInputChange}
                        className={`h-9 w-full rounded-md border bg-white px-2.5 text-[13px] text-gray-900 focus:outline-none ${
                          formErrors.paymentTermsDays
                            ? 'border-red-400 focus:ring-2 focus:ring-red-100 focus:border-red-500'
                            : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                        }`}
                      />
                      {formErrors.paymentTermsDays && <p className="mt-1 text-[10px] text-red-500">{formErrors.paymentTermsDays}</p>}
                    </div>
                    <div className="w-full">
                      <label className="mb-1 block text-[11px] font-medium text-gray-700">Number of Resources <span className="text-red-500">*</span></label>
                      <input
                        name="numberOfResources"
                        type="number"
                        min="1"
                        value={formData.numberOfResources}
                        onChange={handleInputChange}
                        placeholder="Contractors"
                        className={`h-9 w-full rounded-md border bg-white px-2.5 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none ${
                          formErrors.numberOfResources
                            ? 'border-red-400 focus:ring-2 focus:ring-red-100 focus:border-red-500'
                            : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                        }`}
                      />
                      {formErrors.numberOfResources && <p className="mt-1 text-[10px] text-red-500">{formErrors.numberOfResources}</p>}
                    </div>
                  </div>
                </Card>
              </div>

              <div>
                <h2 className="mb-1.5 text-[13px] font-semibold text-[#111827]">Resources & Notes</h2>
                <Card className="border-[#d8e2ef] px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                  <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2">
                    <div className="w-full">
                      <label className="mb-1 block text-[11px] font-medium text-gray-700">Shared With</label>
                      <input
                        name="sharedWith"
                        value={formData.sharedWith}
                        onChange={handleInputChange}
                        placeholder="Team, manager, or stakeholder names"
                        className="h-9 w-full rounded-md border border-gray-300 bg-white px-2.5 text-[13px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                    <div className="w-full">
                      <label className="mb-1 block text-[11px] font-medium text-gray-700">Remarks</label>
                      <input
                        name="remark"
                        value={formData.remark}
                        onChange={handleInputChange}
                        placeholder="Any PO-specific notes"
                        className="h-9 w-full rounded-md border border-gray-300 bg-white px-2.5 text-[13px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Section 4: Documents */}
              <div>
                <h2 className="mb-1.5 text-[13px] font-semibold text-[#111827]">Documents</h2>
                <Card className="border-[#d8e2ef] px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                  <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2">
                    <div className="w-full">
                      <label className="mb-1 block text-[11px] font-medium text-gray-700">PO Upload</label>
                      <label className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-[#d5deec] bg-[#f9fbff] p-4 hover:bg-[#f0f5ff]">
                        <UploadCloud className="h-8 w-8 text-[#94a3b8]" />
                        <p className="mt-2 text-[12px] text-[#475569]">{formData.file ? formData.file.name : 'Click to upload PO'}</p>
                        <p className="mt-0.5 text-[10px] text-[#94a3b8]">PDF, DOCX, XLSX (Max 10MB)</p>
                        <input type="file" onChange={(e) => handleFileChange(e, 'file')} accept=".pdf,.doc,.docx,.xlsx" className="hidden" />
                      </label>
                    </div>
                    <div className="w-full">
                      <label className="mb-1 block text-[11px] font-medium text-gray-700">Statement of Work (SOW)</label>
                      <label className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-[#d5deec] bg-[#f9fbff] p-4 hover:bg-[#f0f5ff]">
                        <UploadCloud className="h-8 w-8 text-[#94a3b8]" />
                        <p className="mt-2 text-[12px] text-[#475569]">{formData.sowFile ? formData.sowFile.name : 'Click to upload SOW'}</p>
                        <p className="mt-0.5 text-[10px] text-[#94a3b8]">PDF, DOCX, XLSX (Max 10MB)</p>
                        <input type="file" onChange={(e) => handleFileChange(e, 'sowFile')} accept=".pdf,.doc,.docx,.xlsx" className="hidden" />
                      </label>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Section 6: Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-[#d8e2ef] pt-5">
                <button
                  type="button"
                  onClick={() => setMode('list')}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#d8e2ef] bg-white px-4 text-[13px] font-semibold text-[#1c2f4b] hover:bg-[#f7f9fc]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#4b4fe8] px-4 text-[13px] font-semibold text-white shadow-[0_8px_16px_rgba(75,79,232,0.25)] hover:bg-[#4347db] disabled:opacity-60"
                >
                  {isSubmitting ? 'Creating...' : 'Create PO'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      <Modal
        isOpen={Boolean(selectedPo)}
        onClose={() => setSelectedPo(null)}
        title={
          <div className="flex w-full items-center justify-between gap-4">
            <span>PO Details</span>
            <div className="ml-auto flex items-center gap-2 pr-3">
              <button type="button" className="inline-flex h-8 items-center rounded-sm border border-[#cfd9e7] bg-white px-4 text-[9px] font-bold uppercase tracking-[0.12em] text-[#12203a]">
                Download PDF
              </button>
              <button type="button" className="inline-flex h-8 items-center rounded-sm bg-[#3853a7] px-4 text-[9px] font-bold uppercase tracking-[0.12em] text-white">
                Revise Contract
              </button>
            </div>
          </div>
        }
        titleClassName="flex flex-1 items-center text-lg font-semibold text-gray-900"
        size="xxl"
        footer={
          <Button variant="secondary" onClick={() => setSelectedPo(null)}>
            Close
          </Button>
        }
      >
        {selectedPo && (
          <div className="space-y-5 bg-[#f4f7fb] p-1">
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex rounded-sm px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${selectedPo.endDate && new Date(selectedPo.endDate) < today ? 'bg-[#eef2f7] text-[#66778f]' : 'bg-[#e7eefc] text-[#3853a7]'}`}>
                    {selectedPo.endDate && new Date(selectedPo.endDate) < today ? 'Closed' : 'Active Agreement'}
                  </span>
                  <span className="text-[12px] text-[#7587a0]">Updated {formatters.formatDate(selectedPo.updatedDate || selectedPo.createdDate) || '-'}</span>
                </div>
                <h2 className="mt-2 text-[18px] font-bold tracking-[-0.02em] text-[#0f1d33]">Purchase Order: {selectedPo.poNumber || '-'}</h2>
                <p className="mt-1 text-[13px] text-[#566983]">
                  {selectedPo.customerId
                    ? customerNameById[String(selectedPo.customerId)] || `Customer #${selectedPo.customerId}`
                    : '-'} Service Agreement
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.08fr_1.36fr_0.8fr]">
              <div className="border border-[#dce5f1] bg-white px-4 py-4 shadow-[0_4px_14px_rgba(15,23,42,0.03)]">
                <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-[#7a8ca6]">Document Info</p>
                <div className="mt-5 space-y-5">
                  <div>
                    <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#9aabc0]">Customer</p>
                    <p className="mt-1 text-[14px] font-semibold text-[#10203a]">{selectedPo.customerId ? customerNameById[String(selectedPo.customerId)] || `Customer #${selectedPo.customerId}` : '-'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#9aabc0]">PO Date</p>
                      <p className="mt-1 text-[13px] text-[#16263e]">{formatters.formatDate(selectedPo.poDate) || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#9aabc0]">Status</p>
                      <span className={`mt-1 inline-flex rounded-[2px] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.08em] ${selectedPo.endDate && new Date(selectedPo.endDate) < today ? 'bg-[#eef2f7] text-[#66778f]' : 'bg-[#e5f1ff] text-[#3662cb]'}`}>
                        {selectedPo.endDate && new Date(selectedPo.endDate) < today ? 'Closed' : 'Fulfilled'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#9aabc0]">Payment Terms</p>
                    <p className="mt-1 text-[13px] text-[#16263e]">
                      {selectedPo.paymentTermsDays ?? selectedPo.paymentTerms ?? '-'}
                      {selectedPo.paymentTermsDays != null ? ' Days' : ''}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border border-[#dce5f1] bg-white px-4 py-4 shadow-[0_4px_14px_rgba(15,23,42,0.03)]">
                <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-[#7a8ca6]">Financial Summary</p>
                <div className="mt-5">
                  <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#9aabc0]">Total PO Value</p>
                  <div className="mt-2 flex items-end gap-2">
                    <span className="text-[38px] font-extrabold leading-none tracking-[-0.04em] text-[#3557b8]">
                      {formatters.formatCurrency(selectedPo.poValue).replace(/[A-Z]{3}\s?/g, '').trim() || '0.00'}
                    </span>
                    <span className="pb-1 text-[11px] font-bold uppercase tracking-[0.1em] text-[#2f4f9f]">{selectedPo.currency || ''}</span>
                  </div>
                </div>
                <div className="mt-8 grid grid-cols-2 gap-5 border-t border-[#edf2f8] pt-4">
                  <div>
                    <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#9aabc0]">Budget Allocation</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e9eef7]">
                      <div
                        className="h-full bg-[#3557b8]"
                        style={{
                          width: `${selectedPo.poValue && selectedPo.numberOfResources
                            ? Math.min(100, Math.round((Number(selectedPo.numberOfResources) * 100) / Math.max(1, Number(selectedPo.poValue) / 1000)))
                            : 0}%`,
                        }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-[#6a7d98]">
                      {selectedPo.poValue && selectedPo.numberOfResources
                        ? `${Math.min(100, Math.round((Number(selectedPo.numberOfResources) * 100) / Math.max(1, Number(selectedPo.poValue) / 1000)))}% Consumed`
                        : '0% Consumed'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#9aabc0]">Resource Count</p>
                    <p className="mt-2 text-[13px] font-bold text-[#10203a]">{selectedPo.numberOfResources || 0} Specialists</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#314a99] px-4 py-4 text-white shadow-[0_10px_24px_rgba(47,70,152,0.24)]">
                <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-[#ced8ff]">Project Timeline</p>
                <div className="mt-5 space-y-5">
                  <div className="border-l-2 border-white/35 pl-3">
                    <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#c5d0ff]">Start Date</p>
                    <p className="mt-1 text-[16px] font-bold">{formatters.formatDate(selectedPo.startDate) || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#c5d0ff]">End Date</p>
                    <p className="mt-1 text-[16px] font-bold">{formatters.formatDate(selectedPo.endDate) || '-'}</p>
                  </div>
                  <div className="border-t border-white/20 pt-4">
                    <p className="text-[10px] italic text-[#dde5ff]">
                      Duration:{' '}
                      {selectedPo.startDate && selectedPo.endDate
                        ? `${Math.max(1, Math.round((new Date(selectedPo.endDate) - new Date(selectedPo.startDate)) / (1000 * 60 * 60 * 24 * 30)))} Months`
                        : '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[16px] font-medium text-[#10203a]">Allocated Resources</h3>
                <p className="text-[12px] text-[#60728f]">{selectedPo.numberOfResources || 0} Active Records</p>
              </div>
              <div className="overflow-hidden border border-[#dce5f1] bg-white shadow-[0_4px_14px_rgba(15,23,42,0.03)]">
                <div className="grid grid-cols-[1.15fr_1.2fr_0.95fr_0.9fr_0.95fr] gap-4 border-b border-[#e5ebf4] bg-[#eef3f9] px-4 py-3 text-[8px] font-bold uppercase tracking-[0.18em] text-[#7385a0]">
                  <span>Resource Name</span>
                  <span>Role</span>
                  <span>Rate (Hourly)</span>
                  <span>Billable Status</span>
                  <span className="text-right">Total Invoiced</span>
                </div>
                <div className="grid grid-cols-[1.15fr_1.2fr_0.95fr_0.9fr_0.95fr] gap-4 border-b border-[#eef3f8] px-4 py-4 text-[13px] text-[#12203a]">
                  <div className="flex items-center gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#dce7ff] text-[8px] font-bold text-[#3557b8]">SW</div>
                    <span className="font-medium">{selectedPo.sharedWith || 'Not shared'}</span>
                  </div>
                  <div>{selectedPo.country || 'Regional Stakeholder'}</div>
                  <div>{formatters.formatCurrency(selectedPo.poValue && selectedPo.numberOfResources ? Number(selectedPo.poValue) / Math.max(1, Number(selectedPo.numberOfResources)) : 0)}</div>
                  <div>
                    <span className="inline-flex rounded-[2px] bg-[#e5f1ff] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.08em] text-[#3662cb]">Billable</span>
                  </div>
                  <div className="text-right font-semibold">{formatters.formatCurrency(selectedPo.poValue)}</div>
                </div>
                <div className="grid grid-cols-[1.15fr_1.2fr_0.95fr_0.9fr_0.95fr] gap-4 px-4 py-4 text-[13px] text-[#12203a]">
                  <div className="flex items-center gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#e8f0ff] text-[8px] font-bold text-[#3557b8]">RM</div>
                    <span className="font-medium">Remarks</span>
                  </div>
                  <div className="truncate">{selectedPo.remark || 'No remark added'}</div>
                  <div>{selectedPo.currency || 'N/A'}</div>
                  <div>
                    <span className="inline-flex rounded-[2px] bg-[#e5f1ff] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.08em] text-[#3662cb]">Active</span>
                  </div>
                  <div className="text-right font-semibold">{formatters.formatDate(selectedPo.createdDate) || '-'}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  )
}

export default POsPage
