import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  AlertCircle,
  Users,
  Building2,
  Globe,
  Search,
  SlidersHorizontal,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { DashboardLayout } from '../../components/layout'
import { Card, Button, Modal, Input, Badge, Loader } from '../../components/ui'
import { customerService } from '../../services/customerService'
import { poService } from '../../services/poService'
import { useAuth } from '../../hooks/useAuth'
import { formatters } from '../../utils/formatters'
import { validators } from '../../utils/validators'

const createInitialPoFormData = (customerId = '') => ({
  poNumber: '',
  poDate: '',
  startDate: '',
  endDate: '',
  poValue: '',
  currency: 'USD',
  paymentTermsDays: 30,
  customerId,
  remark: '',
  numberOfResources: '',
  sharedWith: '',
  file: null,
})

const CustomersPage = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [customers, setCustomers] = useState([])
  const [pos, setPos] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    msa: '',
    msaContactPerson: '',
    msaContactEmail: '',
    countriesApplicable: '',
    msaRemark: '',
    noticePeriodDays: 30,
    msaFile: null,
  })
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [isPoModalOpen, setIsPoModalOpen] = useState(false)
  const [poFormData, setPoFormData] = useState(createInitialPoFormData())
  const [poFormErrors, setPoFormErrors] = useState({})
  const [isPoSubmitting, setIsPoSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionMenuCustomerId, setActionMenuCustomerId] = useState(null)
  const [page, setPage] = useState(1)

  const PAGE_SIZE = 10

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const [customersData, poData] = await Promise.all([
        customerService.getAllCustomers(),
        poService.getAllPurchaseOrders(),
      ])
      setCustomers(Array.isArray(customersData) ? customersData : [])
      setPos(Array.isArray(poData) ? poData : [])
    } catch (err) {
      setError(err?.message || 'Failed to load customers')
      setCustomers([])
      setPos([])
    } finally {
      setIsLoading(false)
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const poCountsByCustomer = pos.reduce((acc, po) => {
    if (!po?.customerId) return acc
    const endDate = po.endDate ? new Date(po.endDate) : null
    const isInactive = endDate instanceof Date && !Number.isNaN(endDate.getTime()) && endDate < today

    if (!acc[po.customerId]) acc[po.customerId] = { total: 0, active: 0, inactive: 0 }
    acc[po.customerId].total += 1
    if (isInactive) acc[po.customerId].inactive += 1
    else acc[po.customerId].active += 1
    return acc
  }, {})

  const validateForm = () => {
    const newErrors = {}
    if (!validators.isRequired(formData.name)) newErrors.name = 'Customer name is required'
    if (!validators.isRequired(formData.address)) newErrors.address = 'Address is required'
    if (!validators.isRequired(formData.msa)) newErrors.msa = 'MSA is required'
    if (!validators.isRequired(formData.msaContactPerson)) newErrors.msaContactPerson = 'Contact person is required'
    if (!validators.isRequired(formData.msaContactEmail)) newErrors.msaContactEmail = 'Contact email is required'
    else if (!validators.isEmail(formData.msaContactEmail)) newErrors.msaContactEmail = 'Invalid email address'
    if (formData.noticePeriodDays < 0) newErrors.noticePeriodDays = 'Notice period cannot be negative'
    setFormErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: name === 'noticePeriodDays' ? parseInt(value, 10) || 0 : value }))
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, msaFile: e.target.files?.[0] || null }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isAdmin) {
      setFormErrors({ submit: 'Only admins can create customers.' })
      return
    }
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await customerService.createCustomer(formData)
      setIsModalOpen(false)
      setFormData({
        name: '',
        address: '',
        msa: '',
        msaContactPerson: '',
        msaContactEmail: '',
        countriesApplicable: '',
        msaRemark: '',
        noticePeriodDays: 30,
        msaFile: null,
      })
      await loadCustomers()
    } catch (err) {
      setFormErrors({ submit: err?.message || 'Failed to create customer' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openPoModal = (customer) => {
    setSelectedCustomer(customer)
    setPoFormData(createInitialPoFormData(customer.id))
    setPoFormErrors({})
    setIsPoModalOpen(true)
  }

  const handlePoInputChange = (e) => {
    const { name, value } = e.target
    const numberFields = ['poValue', 'paymentTermsDays', 'numberOfResources', 'customerId']
    setPoFormData((prev) => ({
      ...prev,
      [name]: numberFields.includes(name) ? (value === '' ? '' : Number(value)) : value,
    }))
    if (poFormErrors[name]) setPoFormErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handlePoFileChange = (e) => {
    setPoFormData((prev) => ({ ...prev, file: e.target.files?.[0] || null }))
  }

  const validatePoForm = () => {
    const newErrors = {}
    if (!validators.isRequired(poFormData.customerId)) newErrors.customerId = 'Customer is required'
    if (!validators.isRequired(poFormData.poNumber)) newErrors.poNumber = 'PO Number is required'
    if (!validators.isRequired(poFormData.poDate)) newErrors.poDate = 'PO Date is required'
    if (!validators.isRequired(poFormData.poValue)) newErrors.poValue = 'PO Value is required'
    setPoFormErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePoSubmit = async (e) => {
    e.preventDefault()
    if (!validatePoForm()) return

    setIsPoSubmitting(true)
    try {
      await poService.createPurchaseOrder(poFormData)
      setIsPoModalOpen(false)
      setPoFormData(createInitialPoFormData())
      setPoFormErrors({})
      await loadCustomers()
    } catch (err) {
      setPoFormErrors({ submit: err?.message || 'Failed to create PO' })
    } finally {
      setIsPoSubmitting(false)
    }
  }

  const filteredCustomers = customers.filter((customer) => {
    if (!searchTerm.trim()) return true
    const q = searchTerm.toLowerCase()
    return (
      String(customer.name || '').toLowerCase().includes(q) ||
      String(customer.msa || '').toLowerCase().includes(q) ||
      String(customer.msaContactPerson || '').toLowerCase().includes(q) ||
      String(customer.msaContactEmail || '').toLowerCase().includes(q)
    )
  })

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const pageData = filteredCustomers.slice(pageStart, pageStart + PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [searchTerm, customers.length])

  const summaryStats = [
    { icon: Users, label: 'TOTAL CUSTOMERS', value: customers.length, color: 'text-[#4b54e6]', bg: 'bg-[#e9edff]' },
    { icon: Building2, label: 'ACTIVE MSAS', value: customers.length, color: 'text-[#12a26e]', bg: 'bg-[#e7f7f1]' },
    {
      icon: Globe,
      label: 'COUNTRIES',
      value: new Set(
        customers.flatMap((c) => String(c.countriesApplicable || '').split(',')).map((c) => c.trim()).filter(Boolean)
      ).size || 0,
      color: 'text-[#d07c0f]',
      bg: 'bg-[#faf3e2]',
    },
  ]

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] leading-none font-bold text-[#0f1d33]">Customers</h1>
            <p className="mt-1 text-[13px] text-[#4a5c77]">Manage your global customer directory and master service agreements.</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-1 inline-flex items-center gap-2 rounded-xl bg-[#4b4fe8] px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_16px_rgba(75,79,232,0.25)] hover:bg-[#4347db]"
            >
              <Plus className="h-4 w-4" /> Add Customer
            </button>
          )}
        </div>

        {!isLoading && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {summaryStats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="rounded-2xl border border-[#e3e9f2] bg-white px-4 py-3.5 shadow-[0_2px_4px_rgba(15,23,42,0.04)]">
                  <div className="flex items-center gap-3">
                    <div className={`${stat.bg} rounded-xl p-2.5`}>
                      <Icon className={`h-4.5 w-4.5 ${stat.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold tracking-[0.12em] text-[#5f7290]">{stat.label}</p>
                      <p className="mt-1 text-[20px] leading-none font-bold text-[#0f1f36]">{stat.value}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div>
          <div className="relative max-w-lg">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#95a2b7]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search customers..."
              className="h-10 w-full rounded-xl border border-[#e6ebf3] bg-[#f7f9fc] pl-11 pr-3 text-sm text-[#263448] placeholder:text-[#9aa8bb] outline-none focus:border-[#a9b9d3]"
            />
          </div>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
          </motion.div>
        )}

        <Card className="border-[#d8e2ef] shadow-[0_8px_24px_rgba(15,23,42,0.05)]" isPadded={false}>
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader message="Loading customers..." /></div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-[#e0e8f3] bg-[#f7f9fc]">
                      <th className="px-5 py-3 text-left text-[11px] font-bold tracking-[0.08em] text-[#5c6e89]">CUSTOMER NAME</th>
                      <th className="px-4 py-3 text-left text-[11px] font-bold tracking-[0.08em] text-[#5c6e89]">IDENTIFIER</th>
                      <th className="px-4 py-3 text-left text-[11px] font-bold tracking-[0.08em] text-[#5c6e89]">CONTACT EMAIL</th>
                      <th className="px-4 py-3 text-center text-[11px] font-bold tracking-[0.08em] text-[#5c6e89]">ACTIVE POS</th>
                      <th className="px-4 py-3 text-center text-[11px] font-bold tracking-[0.08em] text-[#5c6e89]">INACTIVE POS</th>
                      <th className="px-4 py-3 text-center text-[11px] font-bold tracking-[0.08em] text-[#5c6e89]">STATUS</th>
                      <th className="px-5 py-3 text-right text-[11px] font-bold tracking-[0.08em] text-[#5c6e89]">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageData.map((customer) => {
                      const activePos = poCountsByCustomer[customer.id]?.active || 0
                      const inactivePos = poCountsByCustomer[customer.id]?.inactive || 0
                      const shortName = String(customer.name || 'CU').split(' ').filter(Boolean).slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join('')
                      return (
                        <tr key={customer.id} className="border-b border-[#e5ebf4] bg-white">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#dee5fb] text-sm font-bold text-[#3e53dd]">{shortName}</div>
                              <div>
                                <p className="text-sm font-semibold text-[#12203a]">{customer.name}</p>
                                <p className="text-xs text-[#8a98ad]">Standard Tier</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-[#1f3048]">{customer.msa || '-'}</td>
                          <td className="px-4 py-4"><a href={`mailto:${customer.msaContactEmail}`} className="text-sm text-[#2f3f58] hover:text-[#3f51df]">{customer.msaContactEmail || '-'}</a></td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-[18px] font-semibold leading-none text-[#13243d]">{activePos}</span>
                              <span className="h-2.5 w-2.5 rounded-full bg-[#1db685]" />
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-[18px] font-semibold leading-none text-[#7b8ca6]">{inactivePos}</span>
                              <span className="h-2.5 w-2.5 rounded-full bg-[#dbe3ef]" />
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center"><span className="inline-flex rounded-full bg-[#c9f0dd] px-3 py-1 text-xs font-semibold text-[#198657]">Active</span></td>
                          <td className="px-5 py-4 text-right">
                            <div className="relative inline-block text-left">
                              <button type="button" onClick={() => setActionMenuCustomerId((prev) => (prev === customer.id ? null : customer.id))} className="rounded-lg p-1.5 text-[#7f90ab] hover:bg-[#eef3fb]">
                                <MoreVertical className="h-5 w-5" />
                              </button>
                              {actionMenuCustomerId === customer.id && (
                                <div className="absolute right-0 z-20 mt-2 w-32 rounded-lg border border-[#dbe4f1] bg-white p-1 shadow-lg">
                                  <button onClick={() => { setSelectedCustomer(customer); setIsViewModalOpen(true); setActionMenuCustomerId(null) }} className="block w-full rounded-md px-3 py-2 text-left text-sm text-[#243752] hover:bg-[#f3f7fd]">View</button>
                                  <button onClick={() => { openPoModal(customer); setActionMenuCustomerId(null) }} className="block w-full rounded-md px-3 py-2 text-left text-sm text-[#243752] hover:bg-[#f3f7fd]">Add PO</button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {pageData.length > 0 && filteredCustomers.length <= PAGE_SIZE && (
                <div className="border-b border-[#e6ecf5] py-5 text-center text-lg italic text-[#d0d7e2]">No additional customers found in current view</div>
              )}

              <div className="flex items-center justify-between px-5 py-3.5">
                <p className="text-sm text-[#5f6f88]">
                  Showing {filteredCustomers.length === 0 ? 0 : pageStart + 1} to {Math.min(pageStart + PAGE_SIZE, filteredCustomers.length)} of {filteredCustomers.length} customers
                </p>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setPage((prev) => Math.max(1, prev - 1))} className="rounded-lg p-1.5 text-[#8394ad] hover:bg-[#edf2f9]" disabled={currentPage === 1}><ChevronLeft className="h-5 w-5" /></button>
                  <span className="inline-flex min-w-8 justify-center rounded-lg border border-[#d5deec] bg-white px-2 py-1 text-sm font-semibold text-[#3b52d8]">{currentPage}</span>
                  <button type="button" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} className="rounded-lg p-1.5 text-[#8394ad] hover:bg-[#edf2f9]" disabled={currentPage === totalPages}><ChevronRight className="h-5 w-5" /></button>
                </div>
              </div>
            </>
          )}
        </Card>

        {isAdmin && (
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Add New Customer"
            size="xxl"
            footer={<><Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button variant="primary" isLoading={isSubmitting} onClick={handleSubmit}>Create Customer</Button></>}
          >
            <form className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {formErrors.submit && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3"><p className="text-sm text-red-400">{formErrors.submit}</p></div>}
              <Input label="Customer Name" name="name" value={formData.name} onChange={handleInputChange} error={formErrors.name} placeholder="Acme Corporation" required />
              <Input label="Address" name="address" value={formData.address} onChange={handleInputChange} error={formErrors.address} placeholder="123 Business St, City, State 12345" required />
              <Input label="MSA (Master Service Agreement)" name="msa" value={formData.msa} onChange={handleInputChange} error={formErrors.msa} placeholder="MSA agreement details or reference" required />
              <Input label="Upload MSA PDF" type="file" name="msaFile" onChange={handleFileChange} accept=".pdf" />
              <Input label="MSA Contact Person" name="msaContactPerson" value={formData.msaContactPerson} onChange={handleInputChange} error={formErrors.msaContactPerson} placeholder="John Doe" required />
              <Input label="MSA Contact Email" type="email" name="msaContactEmail" value={formData.msaContactEmail} onChange={handleInputChange} error={formErrors.msaContactEmail} placeholder="contact@acme.com" required />
              <Input label="Countries Applicable" name="countriesApplicable" value={formData.countriesApplicable} onChange={handleInputChange} placeholder="US, Canada, Mexico" />
              <Input label="Notice Period (days)" type="number" name="noticePeriodDays" value={formData.noticePeriodDays} onChange={handleInputChange} error={formErrors.noticePeriodDays} min="0" />
              <Input label="MSA Remarks" name="msaRemark" value={formData.msaRemark} onChange={handleInputChange} placeholder="Additional remarks about MSA" />
            </form>
          </Modal>
        )}

        <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Customer Details" size="xxl" footer={<Button variant="secondary" onClick={() => setIsViewModalOpen(false)}>Cancel</Button>}>
          {selectedCustomer && (
            <div className="space-y-6 p-2">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-1"><p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Customer Name</p><p className="text-sm font-medium text-gray-900">{selectedCustomer.name}</p></div>
                <div className="space-y-1 md:col-span-2"><p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Address</p><p className="text-sm leading-relaxed text-gray-900">{selectedCustomer.address}</p></div>
                <div className="space-y-1"><p className="text-xs font-semibold uppercase tracking-wider text-gray-500">MSA Reference</p><p className="inline-block rounded bg-indigo-50 px-2 py-0.5 text-sm font-medium text-indigo-400">{selectedCustomer.msa}</p></div>
                <div className="space-y-1"><p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Created Date</p><p className="text-sm text-gray-900">{formatters.formatDate(selectedCustomer.createdDate) || 'N/A'}</p></div>
                <div className="space-y-1"><p className="text-xs font-semibold uppercase tracking-wider text-gray-500">MSA Renewal Date</p><p className="text-sm text-gray-900">{formatters.formatDate(selectedCustomer.msaRenewalDate) || 'Not Set'}</p></div>
                <div className="space-y-1"><p className="text-xs font-semibold uppercase tracking-wider text-gray-500">MSA contact person</p><p className="text-sm text-gray-900">{selectedCustomer.msaContactPerson}</p></div>
                <div className="space-y-1"><p className="text-xs font-semibold uppercase tracking-wider text-gray-500">MSA contact person-email</p><a href={`mailto:${selectedCustomer.msaContactEmail}`} className="text-sm text-indigo-400 hover:underline">{selectedCustomer.msaContactEmail}</a></div>
                <div className="space-y-1"><p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Countries Applicable</p><p className="text-sm text-gray-900">{selectedCustomer.countriesApplicable || 'Global'}</p></div>
                <div className="space-y-1"><p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Notice Period given by customer</p><Badge variant="default" className="text-sm">{selectedCustomer.noticePeriodDays} days</Badge></div>
                <div className="space-y-1 md:col-span-2"><p className="text-xs font-semibold uppercase tracking-wider text-gray-500">MSA Remark</p><div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm italic text-gray-600">{selectedCustomer.msaRemark || 'No additional remarks'}</div></div>
              </div>
            </div>
          )}
        </Modal>

        <Modal
          isOpen={isPoModalOpen}
          onClose={() => setIsPoModalOpen(false)}
          title={selectedCustomer ? `Add PO for ${selectedCustomer.name}` : 'Add PO'}
          size="xxl"
          footer={<><Button variant="secondary" onClick={() => setIsPoModalOpen(false)}>Cancel</Button><Button variant="primary" isLoading={isPoSubmitting} onClick={handlePoSubmit}>Create PO</Button></>}
        >
          <form className="space-y-4">
            {poFormErrors.submit && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3"><p className="text-sm text-red-400">{poFormErrors.submit}</p></div>}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label="PO Number" name="poNumber" value={poFormData.poNumber} onChange={handlePoInputChange} error={poFormErrors.poNumber} placeholder="Enter PO number" required />
              <Input label="PO Date" name="poDate" type="date" value={poFormData.poDate} onChange={handlePoInputChange} error={poFormErrors.poDate} required />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label="Start Date" name="startDate" type="date" value={poFormData.startDate} onChange={handlePoInputChange} />
              <Input label="End Date" name="endDate" type="date" value={poFormData.endDate} onChange={handlePoInputChange} />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label="PO Value" name="poValue" type="number" step="0.01" value={poFormData.poValue} onChange={handlePoInputChange} error={poFormErrors.poValue} required />
              <Input label="Currency" name="currency" value={poFormData.currency} onChange={handlePoInputChange} placeholder="USD" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label="Payment Terms (no. of days)" name="paymentTermsDays" type="number" value={poFormData.paymentTermsDays} onChange={handlePoInputChange} />
              <Input label="Customer" value={selectedCustomer?.name || ''} readOnly disabled required />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label="No. of resources - contractors" name="numberOfResources" type="number" value={poFormData.numberOfResources} onChange={handlePoInputChange} />
              <Input label="PO Upload (File)" type="file" name="file" onChange={handlePoFileChange} accept=".pdf,.doc,.docx" />
            </div>
            <Input label="Remark" name="remark" value={poFormData.remark} onChange={handlePoInputChange} />
            <Input label={<>Remarks <i>(Indicating with whom it&apos;s being shared e.g. co-worker)</i></>} name="sharedWith" value={poFormData.sharedWith} onChange={handlePoInputChange} placeholder="Shared with Finance team" />
          </form>
        </Modal>
      </motion.div>
    </DashboardLayout>
  )
}

export default CustomersPage
