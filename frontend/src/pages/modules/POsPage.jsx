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
import { Card, Button, Input, Loader, Modal } from '../../components/ui'
import { poService } from '../../services/poService'
import { customerService } from '../../services/customerService'
import { dedupeBy } from '../../utils/dedupe'
import { formatters } from '../../utils/formatters'
import { downloadPOsPdf } from '../../utils/pdfExport'
import { validators } from '../../utils/validators'

const EMPTY_FORM = {
  poNumber: '',
  poDate: '',
  startDate: '',
  endDate: '',
  poValue: '',
  currency: 'USD',
  paymentTermsDays: 30,
  customerId: '',
  remark: '',
  numberOfResources: '',
  sharedWith: '',
  file: null,
}

const POsPage = () => {
  const [mode, setMode] = useState('list')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
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

  const validateForm = () => {
    const errors = {}
    if (!validators.isRequired(formData.poNumber)) errors.poNumber = 'PO Number is required'
    if (!validators.isRequired(formData.poDate)) errors.poDate = 'PO Date is required'
    if (!validators.isRequired(formData.startDate)) errors.startDate = 'Start Date is required'
    if (!validators.isRequired(formData.endDate)) errors.endDate = 'End Date is required'
    if (!validators.isRequired(formData.poValue)) errors.poValue = 'PO Value is required'
    if (!validators.isRequired(formData.currency)) errors.currency = 'Currency is required'
    if (!validators.isRequired(formData.paymentTermsDays) && formData.paymentTermsDays !== 0) errors.paymentTermsDays = 'Payment terms is required'
    if (!validators.isRequired(formData.customerId)) errors.customerId = 'Customer is required'
    if (!validators.isRequired(formData.numberOfResources) && formData.numberOfResources !== 0) errors.numberOfResources = 'No. of resources is required'
    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      errors.endDate = 'End Date cannot be before Start Date'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (event) => {
    const { name, value } = event.target
    const numberFields = ['poValue', 'paymentTermsDays', 'numberOfResources', 'customerId']
    setFormData((prev) => ({
      ...prev,
      [name]: numberFields.includes(name) ? (value === '' ? '' : Number(value)) : value,
    }))
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null
    setFormData((prev) => ({ ...prev, file }))
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

            <div>
              <h2 className="mb-1.5 text-[13px] font-semibold text-[#111827]">Order Identification</h2>
              <Card className="border-[#d8e2ef] px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                <div className="grid grid-cols-1 gap-x-4 gap-y-2 md:grid-cols-2">
                  <div className="w-full">
                    <label className="mb-1 block text-[11px] font-medium text-gray-700">PO Number</label>
                    <input
                      name="poNumber"
                      value={formData.poNumber}
                      onChange={handleInputChange}
                      placeholder="e.g. PO-2023-001"
                      className={`h-8 w-full rounded-md border bg-white px-2.5 text-[12px] text-gray-900 placeholder:text-gray-400 focus:outline-none ${
                        formErrors.poNumber
                          ? 'border-red-400 focus:ring-2 focus:ring-red-100 focus:border-red-500'
                          : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                      }`}
                    />
                    {formErrors.poNumber && <p className="mt-1 text-[10px] text-red-500">{formErrors.poNumber}</p>}
                  </div>
                  <div className="w-full">
                    <label className="mb-1 block text-[11px] font-medium text-gray-700">PO Date</label>
                    <input
                      name="poDate"
                      type="date"
                      value={formData.poDate}
                      onChange={handleInputChange}
                      className={`h-8 w-full rounded-md border bg-white px-2.5 text-[12px] text-gray-900 focus:outline-none ${
                        formErrors.poDate
                          ? 'border-red-400 focus:ring-2 focus:ring-red-100 focus:border-red-500'
                          : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                      }`}
                    />
                    {formErrors.poDate && <p className="mt-1 text-[10px] text-red-500">{formErrors.poDate}</p>}
                  </div>
                  <div className="w-full">
                    <label className="mb-1 block text-[11px] font-medium text-gray-700">Start Date</label>
                    <input
                      name="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className={`h-8 w-full rounded-md border bg-white px-2.5 text-[12px] text-gray-900 focus:outline-none ${
                        formErrors.startDate
                          ? 'border-red-400 focus:ring-2 focus:ring-red-100 focus:border-red-500'
                          : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                      }`}
                    />
                    {formErrors.startDate && <p className="mt-1 text-[10px] text-red-500">{formErrors.startDate}</p>}
                  </div>
                  <div className="w-full">
                    <label className="mb-1 block text-[11px] font-medium text-gray-700">End Date</label>
                    <input
                      name="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className={`h-8 w-full rounded-md border bg-white px-2.5 text-[12px] text-gray-900 focus:outline-none ${
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

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[2fr_1fr]">
              <div>
                <h2 className="mb-1.5 text-[13px] font-semibold text-[#111827]">Financial Details</h2>
                <Card className="border-[#d8e2ef] px-4 py-3">
                  <div className="grid grid-cols-1 gap-x-4 gap-y-2 md:grid-cols-2">
                    <div className="w-full">
                      <label className="mb-1 block text-[11px] font-medium text-gray-700">PO Value</label>
                      <input
                        name="poValue"
                        type="number"
                        step="0.01"
                        value={formData.poValue}
                        onChange={handleInputChange}
                        placeholder="$ 0.00"
                        className={`h-8 w-full rounded-md border bg-white px-2.5 text-[12px] text-gray-900 placeholder:text-gray-400 focus:outline-none ${
                          formErrors.poValue
                            ? 'border-red-400 focus:ring-2 focus:ring-red-100 focus:border-red-500'
                            : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                        }`}
                      />
                      {formErrors.poValue && <p className="mt-1 text-[10px] text-red-500">{formErrors.poValue}</p>}
                    </div>
                    <div className="w-full">
                      <label className="mb-1 block text-[11px] font-medium text-gray-700">Currency</label>
                      <select
                        name="currency"
                        value={formData.currency}
                        onChange={handleInputChange}
                        className="h-8 w-full rounded-md border border-gray-300 bg-white px-2.5 text-[12px] text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      >
                        <option value="USD">USD</option>
                        <option value="INR">INR</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </div>
                    <div className="w-full">
                      <label className="mb-1 block text-[11px] font-medium text-gray-700">Payment Terms (No. of Days)</label>
                      <input
                        name="paymentTermsDays"
                        type="number"
                        value={formData.paymentTermsDays}
                        onChange={handleInputChange}
                        className={`h-8 w-full rounded-md border bg-white px-2.5 text-[12px] text-gray-900 focus:outline-none ${
                          formErrors.paymentTermsDays
                            ? 'border-red-400 focus:ring-2 focus:ring-red-100 focus:border-red-500'
                            : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                        }`}
                      />
                      {formErrors.paymentTermsDays && <p className="mt-1 text-[10px] text-red-500">{formErrors.paymentTermsDays}</p>}
                    </div>
                    <div className="w-full">
                      <label className="mb-1 block text-[11px] font-medium text-gray-700">Select Customer</label>
                      <select
                        name="customerId"
                        value={formData.customerId}
                        onChange={handleInputChange}
                        className="h-8 w-full rounded-md border border-gray-300 bg-white px-2.5 text-[12px] text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      >
                        <option value="">Choose a customer</option>
                        {customers.map((customer) => (
                          <option key={customer.id} value={String(customer.id)}>{customer.name}</option>
                        ))}
                      </select>
                      {formErrors.customerId && <p className="mt-1 text-[10px] text-red-500">{formErrors.customerId}</p>}
                    </div>
                  </div>
                </Card>
              </div>

              <div>
                <h2 className="mb-1.5 text-[13px] font-semibold text-[#111827]">Resources</h2>
                <Card className="border-[#d8e2ef] px-4 py-3">
                  <div className="w-full">
                    <label className="mb-1 block text-[11px] font-medium text-gray-700">No. of resources - contractors</label>
                    <input
                      name="numberOfResources"
                      type="number"
                      value={formData.numberOfResources}
                      onChange={handleInputChange}
                      className={`h-8 w-full rounded-md border bg-white px-2.5 text-[12px] text-gray-900 focus:outline-none ${
                        formErrors.numberOfResources
                          ? 'border-red-400 focus:ring-2 focus:ring-red-100 focus:border-red-500'
                          : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                      }`}
                    />
                    {formErrors.numberOfResources && <p className="mt-1 text-[10px] text-red-500">{formErrors.numberOfResources}</p>}
                  </div>
                  <p className="mt-2 text-[11px] italic leading-5 text-[#64748b]">Specify the total headcount allocated for this PO.</p>
                </Card>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.3fr_1fr]">
              <div>
                <h2 className="mb-1.5 text-[13px] font-semibold text-[#111827]">PO Upload (File)</h2>
                <Card className="border-[#d8e2ef] px-4 py-3">
                  <label className="block cursor-pointer rounded-md border border-dashed border-[#d5deec] bg-[#f9fbff] p-3 text-center">
                    <UploadCloud className="mx-auto h-6 w-6 text-[#94a3b8]" />
                    <p className="mt-1.5 text-[12px] text-[#475569]">Click to upload or drag and drop</p>
                    <p className="mt-0.5 text-[10px] text-[#94a3b8]">PDF, DOCX, XLSX (Max. 10MB)</p>
                    <input type="file" name="file" onChange={handleFileChange} accept=".pdf,.doc,.docx,.xlsx" className="hidden" />
                  </label>
                </Card>
              </div>

              <div>
                <h2 className="mb-1.5 text-[13px] font-semibold text-[#111827]">Remark</h2>
                <Card className="border-[#d8e2ef] px-4 py-3">
                  <div className="space-y-2">
                    <div className="w-full">
                      <label className="mb-1 block text-[11px] font-medium text-gray-700">Remark</label>
                      <input
                        name="remark"
                        value={formData.remark}
                        onChange={handleInputChange}
                        placeholder="Internal notes about this PO..."
                        className="h-8 w-full rounded-md border border-gray-300 bg-white px-2.5 text-[12px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                    <div className="w-full">
                      <label className="mb-1 block text-[11px] font-medium text-gray-700">Remarks (Worker)</label>
                      <input
                        name="sharedWith"
                        value={formData.sharedWith}
                        onChange={handleInputChange}
                        placeholder="Share with..."
                        className="h-8 w-full rounded-md border border-gray-300 bg-white px-2.5 text-[12px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  </div>
                  <div className="mt-2 rounded-md border border-[#d8e2ef] bg-white p-2.5">
                    <p className="text-[11px] font-semibold text-[#16a34a]">Form Ready</p>
                    <p className="mt-0.5 text-[11px] leading-5 text-[#64748b]">Ensure all mandatory PO details are finalized before submission.</p>
                  </div>
                </Card>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[#d8e2ef] pt-4">
                <button type="button" onClick={() => setMode('list')} className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#d8e2ef] bg-white px-3.5 text-[13px] font-semibold text-[#1c2f4b] hover:bg-[#f7f9fc]">
                Cancel
              </button>
              <button type="button" onClick={handleCreatePO} disabled={isSubmitting} className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#4b4fe8] px-3.5 text-[13px] font-semibold text-white shadow-[0_8px_16px_rgba(75,79,232,0.25)] hover:bg-[#4347db] disabled:opacity-60">
                {isSubmitting ? 'Creating...' : 'Create Purchase Order'}
              </button>
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={Boolean(selectedPo)}
        onClose={() => setSelectedPo(null)}
        title="PO Details"
        size="xxl"
        footer={
          <Button variant="secondary" onClick={() => setSelectedPo(null)}>
            Close
          </Button>
        }
      >
        {selectedPo && (
          <div className="space-y-6 p-2">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">PO Number</p>
                <p className="text-sm font-medium text-gray-900">{selectedPo.poNumber || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Customer</p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedPo.customerId
                    ? customerNameById[String(selectedPo.customerId)] || `Customer #${selectedPo.customerId}`
                    : '-'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">PO Date</p>
                <p className="text-sm text-gray-900">{formatters.formatDate(selectedPo.poDate) || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Created Date</p>
                <p className="text-sm text-gray-900">{formatters.formatDate(selectedPo.createdDate) || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Start Date</p>
                <p className="text-sm text-gray-900">{formatters.formatDate(selectedPo.startDate) || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">End Date</p>
                <p className="text-sm text-gray-900">{formatters.formatDate(selectedPo.endDate) || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">PO Value</p>
                <p className="text-sm font-medium text-gray-900">{formatters.formatCurrency(selectedPo.poValue)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Currency</p>
                <p className="text-sm text-gray-900">{selectedPo.currency || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Payment Terms</p>
                <p className="text-sm text-gray-900">
                  {selectedPo.paymentTermsDays ?? selectedPo.paymentTerms ?? '-'}
                  {selectedPo.paymentTermsDays != null ? ' days' : ''}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">No. of Resources</p>
                <p className="text-sm text-gray-900">{selectedPo.numberOfResources ?? '-'}</p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Shared With</p>
                <p className="text-sm text-gray-900">{selectedPo.sharedWith || '-'}</p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Remark</p>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm italic text-gray-600">
                  {selectedPo.remark || 'No remark added'}
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
