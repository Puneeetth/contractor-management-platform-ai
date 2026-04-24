import React, { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Download,
  Filter,
  Plus,
  Search,
  UploadCloud,
  Wallet,
  Users2,
} from 'lucide-react'
import { DashboardLayout } from '../../components/layout'
import { Card, Button, Input, Loader } from '../../components/ui'
import { poService } from '../../services/poService'
import { customerService } from '../../services/customerService'
import { formatters } from '../../utils/formatters'
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

      setPos(poResult.status === 'fulfilled' && Array.isArray(poResult.value) ? poResult.value : [])
      setCustomers(customerResult.status === 'fulfilled' && Array.isArray(customerResult.value) ? customerResult.value : [])

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
                <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-[#d8e2ef] bg-white px-4 py-2 text-sm font-semibold text-[#1c2f4b] hover:bg-[#f7f9fc]">
                  <Filter className="h-4 w-4" /> Filter
                </button>
                <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-[#d8e2ef] bg-white px-4 py-2 text-sm font-semibold text-[#1c2f4b] hover:bg-[#f7f9fc]">
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
                  <Plus className="h-4 w-4" /> New Project
                </button>
              </div>
            </div>

            <Card className="border-[#d8e2ef] shadow-[0_4px_18px_rgba(15,23,42,0.04)]">
              <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-[minmax(0,1fr)_88px_88px]">
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
                <button type="button" className="h-9 w-full rounded-xl border border-[#d8e2ef] bg-white px-3 text-[13px] font-semibold text-[#4f5f78] hover:bg-[#f7f9fc]">
                  <span className="inline-flex items-center gap-1.5"><Filter className="h-3.5 w-3.5" /> Filter</span>
                </button>
                <button type="button" onClick={() => setSearchTerm('')} className="h-9 w-full rounded-xl border border-[#d8e2ef] bg-[#f8fbff] px-3 text-[13px] font-semibold text-[#4f5f78] hover:bg-white">
                  Clear
                </button>
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <Card className="border-[#d8e2ef]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[14px] font-semibold tracking-[0.08em] text-[#4b5563]">TOTAL POS</p>
                    <p className="mt-3 text-[22px] leading-none font-bold text-[#0f1f36]">{stats.totalPOs}</p>
                    <p className="mt-2 text-sm font-medium text-[#16a34a]">+12% from last month</p>
                  </div>
                  <div className="rounded-2xl bg-[#e9edff] p-3"><Briefcase className="h-6 w-6 text-[#4b4fe8]" /></div>
                </div>
              </Card>
              <Card className="border-[#4b4fe8] border-l-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[14px] font-semibold tracking-[0.08em] text-[#4b5563]">TOTAL VALUE</p>
                    <p className="mt-3 text-[22px] leading-none font-bold text-[#0f1f36]">{formatters.formatCurrency(stats.totalValue)}</p>
                    <p className="mt-2 text-sm font-medium text-[#4b4fe8]">Active project funding</p>
                  </div>
                  <div className="rounded-2xl bg-[#e9edff] p-3"><Wallet className="h-6 w-6 text-[#4b4fe8]" /></div>
                </div>
              </Card>
              <Card className="border-[#d8e2ef]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[14px] font-semibold tracking-[0.08em] text-[#4b5563]">TOTAL RESOURCES</p>
                    <p className="mt-3 text-[22px] leading-none font-bold text-[#0f1f36]">{stats.totalResources}</p>
                    <p className="mt-2 text-sm font-medium text-[#475569]">Allocated across {Math.max(1, customers.length)} vendors</p>
                  </div>
                  <div className="rounded-2xl bg-[#e9edff] p-3"><Users2 className="h-6 w-6 text-[#4b4fe8]" /></div>
                </div>
              </Card>
            </div>

            <Card className="border-[#d8e2ef] shadow-[0_8px_24px_rgba(15,23,42,0.05)]" isPadded={false}>
              <div className="flex items-center justify-between border-b border-[#e0e8f3] px-5 py-4">
                <h2 className="text-xl font-bold text-[#111c32]">Active Purchase Orders</h2>
                <p className="text-sm font-medium text-[#23395b]"><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#5b64f0]" />Real-time sync active</p>
              </div>
              {isLoading ? (
                <div className="py-12 flex justify-center"><Loader message="Loading purchase orders..." /></div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-[#e0e8f3] bg-[#f7f9fc]">
                          <th className="px-5 py-3 text-left text-[10px] font-bold tracking-[0.08em] text-[#4b5563]">PO Number</th>
                          <th className="px-3 py-3 text-left text-[10px] font-bold tracking-[0.08em] text-[#4b5563]">Customer</th>
                          <th className="px-3 py-3 text-left text-[10px] font-bold tracking-[0.08em] text-[#4b5563]">PO Date</th>
                          <th className="px-3 py-3 text-left text-[10px] font-bold tracking-[0.08em] text-[#4b5563]">PO Value</th>
                          <th className="px-5 py-3 text-right text-[10px] font-bold tracking-[0.08em] text-[#4b5563]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageRows.map((row) => (
                          <tr key={row.id} className="border-b border-[#e5ebf4] bg-white">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-[#e9edff] p-2"><Briefcase className="h-3.5 w-3.5 text-[#4b4fe8]" /></div>
                                <span className="text-[13px] font-semibold text-[#3f4fe8]">{row.poNumber}</span>
                              </div>
                            </td>
                            <td className="px-3 py-3.5 text-[13px] font-medium text-[#111827]">{customerNameById[String(row.customerId)] || `Customer #${row.customerId}`}</td>
                            <td className="px-3 py-3.5 text-[13px] text-[#374151]">{formatters.formatDate(row.poDate)}</td>
                            <td className="px-3 py-3.5 text-[13px] font-semibold text-[#111827]">{formatters.formatCurrency(row.poValue)}</td>
                            <td className="px-5 py-3.5 text-right">
                              <button type="button" className="inline-flex items-center gap-1 text-[13px] font-medium text-[#3f4fe8] hover:underline">
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

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
              <Card className="border-[#d8e2ef]">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-[#e9edff] p-5"><CalendarDays className="h-8 w-8 text-[#4b4fe8]" /></div>
                  <div>
                    <h3 className="text-[20px] font-semibold text-[#111827]">Audit Readiness</h3>
                    <p className="mt-2 text-[16px] leading-7 text-[#334155]">
                      All POs listed are verified and documentation is currently 100% compliant with internal policies.
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="border-[#3f3a96] bg-[#2f2d87] text-white">
                <h3 className="text-[20px] font-semibold">Need bulk import?</h3>
                <p className="mt-3 text-[16px] leading-7 text-white/85">
                  Connect your ERP for automatic sync and real-time reconciliation.
                </p>
                <button type="button" className="mt-6 rounded-xl bg-white px-6 py-3 text-[15px] font-semibold text-[#1d2b8a]">
                  Connect System
                </button>
              </Card>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-[22px] leading-none font-bold text-[#0f1d33]">Create New Purchase Order</h1>
                <p className="mt-1 text-[13px] text-[#4a5c77]">Initiate a new procurement request by filling in the details below.</p>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setMode('list')} className="inline-flex items-center gap-2 rounded-xl border border-[#d8e2ef] bg-white px-4 py-2 text-sm font-semibold text-[#1c2f4b] hover:bg-[#f7f9fc]">
                  Cancel
                </button>
                <button type="button" onClick={handleCreatePO} className="inline-flex items-center gap-2 rounded-xl bg-[#4b4fe8] px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_16px_rgba(75,79,232,0.25)] hover:bg-[#4347db]">
                  Create PO
                </button>
              </div>
            </div>

            {formErrors.submit && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-700">{formErrors.submit}</p>
              </div>
            )}

            <Card className="border-[#d8e2ef] shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
              <h2 className="mb-4 text-[22px] font-semibold text-[#111827]">Order Identification</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input label="PO Number" name="poNumber" value={formData.poNumber} onChange={handleInputChange} placeholder="e.g. PO-2023-001" error={formErrors.poNumber} />
                <Input label="PO Date" name="poDate" type="date" value={formData.poDate} onChange={handleInputChange} error={formErrors.poDate} />
                <Input label="Start Date" name="startDate" type="date" value={formData.startDate} onChange={handleInputChange} error={formErrors.startDate} />
                <Input label="End Date" name="endDate" type="date" value={formData.endDate} onChange={handleInputChange} error={formErrors.endDate} />
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
              <Card className="border-[#d8e2ef]">
                <h2 className="mb-4 text-[22px] font-semibold text-[#111827]">Financial Details</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Input label="PO Value" name="poValue" type="number" step="0.01" value={formData.poValue} onChange={handleInputChange} placeholder="$ 0.00" error={formErrors.poValue} />
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Currency</label>
                    <select name="currency" value={formData.currency} onChange={handleInputChange} className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-indigo-500">
                      <option value="USD">USD</option>
                      <option value="INR">INR</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                  <Input label="Payment Terms (No. of Days)" name="paymentTermsDays" type="number" value={formData.paymentTermsDays} onChange={handleInputChange} error={formErrors.paymentTermsDays} />
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Select Customer</label>
                    <select name="customerId" value={formData.customerId} onChange={handleInputChange} className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-indigo-500">
                      <option value="">Choose a customer</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={String(customer.id)}>{customer.name}</option>
                      ))}
                    </select>
                    {formErrors.customerId && <p className="mt-1 text-xs text-red-600">{formErrors.customerId}</p>}
                  </div>
                </div>
              </Card>

              <Card className="border-[#d8e2ef]">
                <h2 className="mb-4 text-[22px] font-semibold text-[#111827]">Resources</h2>
                <Input label="No. of resources - contractors" name="numberOfResources" type="number" value={formData.numberOfResources} onChange={handleInputChange} error={formErrors.numberOfResources} />
                <p className="mt-4 text-sm italic text-[#64748b]">Specify the total headcount allocated for this PO.</p>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_1fr]">
              <Card className="border-[#d8e2ef]">
                <h2 className="mb-4 text-[28px] font-semibold text-[#111827]">PO Upload (File)</h2>
                <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-[#d5deec] bg-[#f9fbff] p-8 text-center">
                  <UploadCloud className="mx-auto h-10 w-10 text-[#94a3b8]" />
                  <p className="mt-3 text-base text-[#475569]">Click to upload or drag and drop</p>
                  <p className="mt-1 text-sm text-[#94a3b8]">PDF, DOCX, XLSX (Max. 10MB)</p>
                  <input type="file" name="file" onChange={handleFileChange} accept=".pdf,.doc,.docx,.xlsx" className="hidden" />
                </label>
              </Card>

              <Card className="border-[#d8e2ef]">
                <h2 className="mb-4 text-[28px] font-semibold text-[#111827]">Remark</h2>
                <Input label="Remark" name="remark" value={formData.remark} onChange={handleInputChange} placeholder="Internal notes about this PO..." />
                <Input label="Remarks (Worker)" name="sharedWith" value={formData.sharedWith} onChange={handleInputChange} placeholder="Share with..." />
                <div className="mt-4 rounded-xl border border-[#d8e2ef] bg-white p-4">
                  <p className="text-sm font-semibold text-[#16a34a]">Form Ready</p>
                  <p className="mt-1 text-sm text-[#64748b]">Ensure all mandatory PO details are finalized before submission.</p>
                </div>
              </Card>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[#d8e2ef] pt-5">
                <button type="button" onClick={() => setMode('list')} className="inline-flex items-center gap-2 rounded-xl border border-[#d8e2ef] bg-white px-4 py-2 text-sm font-semibold text-[#1c2f4b] hover:bg-[#f7f9fc]">
                Cancel
              </button>
              <button type="button" onClick={handleCreatePO} disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-xl bg-[#4b4fe8] px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_16px_rgba(75,79,232,0.25)] hover:bg-[#4347db] disabled:opacity-60">
                {isSubmitting ? 'Creating...' : 'Create Purchase Order'}
              </button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

export default POsPage
