import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  AlertCircle,
  Users,
  Building2,
  Globe,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { DashboardLayout } from '../../components/layout'
import { Card, Button, Modal, Input, Badge, Loader } from '../../components/ui'
import { PoCreationModal } from '../../components/modals/PoCreationModal'
import { customerService } from '../../services/customerService'
import { poService } from '../../services/poService'
import { useAuth } from '../../hooks/useAuth'
import { dedupeBy } from '../../utils/dedupe'
import { formatters } from '../../utils/formatters'
import { validators } from '../../utils/validators'

const CustomersPage = () => {
  const navigate = useNavigate()
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
  const [poPreSelectedCustomer, setPoPreSelectedCustomer] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
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
      setCustomers(
        dedupeBy(customersData, (customer, index) => customer?.id || `${customer?.name || 'customer'}-${customer?.msa || customer?.msaContactEmail || index}`)
      )
      setPos(
        dedupeBy(poData, (po, index) => po?.id || `${po?.poNumber || 'po'}-${po?.customerId || index}`)
      )
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

  const handlePoSuccess = async () => {
    await loadCustomers()
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
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-3.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-baseline gap-3">
            <h1 className="shrink-0 text-[24px] leading-none font-extrabold tracking-[-0.02em] text-[#0f1d33]">Customers</h1>
            <p className="truncate text-[13px] font-medium text-[#4a5c77]">Manage your global customer directory and master service agreements.</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#4b4fe8] px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_16px_rgba(75,79,232,0.25)] hover:bg-[#4347db]"
            >
              <Plus className="h-4 w-4" /> Add Customer
            </button>
          )}
        </div>

        {!isLoading && (
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
            {summaryStats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="rounded-2xl border border-[#e3e9f2] bg-white px-3.5 py-3 shadow-[0_2px_4px_rgba(15,23,42,0.04)]">
                  <div className="flex items-center gap-2.5">
                    <div className={`${stat.bg} rounded-xl p-2`}>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold tracking-[0.12em] text-[#5f7290]">{stat.label}</p>
                      <p className="mt-0.5 text-[18px] leading-none font-bold text-[#0f1f36]">{stat.value}</p>
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
                      <th className="whitespace-nowrap px-3 py-2.5 text-left text-[9px] font-bold tracking-[0.05em] text-[#5c6e89]">CUSTOMER NAME</th>
                      <th className="whitespace-nowrap px-2.5 py-2.5 text-left text-[9px] font-bold tracking-[0.05em] text-[#5c6e89]">CONTACT PERSON</th>
                      <th className="whitespace-nowrap px-2.5 py-2.5 text-left text-[9px] font-bold tracking-[0.05em] text-[#5c6e89]">CONTACT EMAIL</th>
                      <th className="whitespace-nowrap px-2.5 py-2.5 text-center text-[9px] font-bold tracking-[0.05em] text-[#5c6e89]">ACTIVE POS</th>
                      <th className="whitespace-nowrap px-2.5 py-2.5 text-center text-[9px] font-bold tracking-[0.05em] text-[#5c6e89]">INACTIVE POS</th>
                      <th className="whitespace-nowrap px-2.5 py-2.5 text-center text-[9px] font-bold tracking-[0.05em] text-[#5c6e89]">STATUS</th>
                      <th className="whitespace-nowrap px-3 py-2.5 text-center text-[9px] font-bold tracking-[0.05em] text-[#5c6e89]">ADD PO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageData.map((customer) => {
                      const activePos = poCountsByCustomer[customer.id]?.active || 0
                      const inactivePos = poCountsByCustomer[customer.id]?.inactive || 0
                      const shortName = String(customer.name || 'CU').split(' ').filter(Boolean).slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join('')
                      return (
                        <tr key={customer.id} className="border-b border-[#e5ebf4] bg-white cursor-pointer hover:bg-[#f8faff]" onClick={() => { setSelectedCustomer(customer); setIsViewModalOpen(true) }}>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#dee5fb] text-[10px] font-bold text-[#3e53dd]">{shortName}</div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate whitespace-nowrap text-[13px] font-semibold leading-none text-[#12203a]">{customer.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-2.5 py-2.5 text-[13px] text-[#1f3048]">{customer.msaContactPerson || '-'}</td>
                          <td className="px-2.5 py-2.5"><a href={`mailto:${customer.msaContactEmail}`} className="text-[13px] text-[#2f3f58] hover:text-[#3f51df]" onClick={(e) => e.stopPropagation()}>{customer.msaContactEmail || '-'}</a></td>
                          <td className="px-2.5 py-2.5">
                            <div className="flex items-center justify-center gap-1">
                              <span className="h-2 w-2 rounded-full bg-[#1db685]" />
                              <span className="text-[15px] font-semibold leading-none text-[#13243d]">{activePos}</span>
                            </div>
                          </td>
                          <td className="px-2.5 py-2.5">
                            <div className="flex items-center justify-center gap-1">
                              <span className="h-2 w-2 rounded-full bg-[#dbe3ef]" />
                              <span className="text-[15px] font-semibold leading-none text-[#7b8ca6]">{inactivePos}</span>
                            </div>
                          </td>
                          <td className="px-2.5 py-2.5 text-center"><span className="inline-flex rounded-full bg-[#c9f0dd] px-2.5 py-0.5 text-[11px] font-semibold text-[#198657]">Active</span></td>
                          <td className="px-3 py-2.5 text-center">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setPoPreSelectedCustomer(customer); setIsPoModalOpen(true) }}
                              className="inline-flex items-center justify-center gap-1 w-[57px] rounded-md border border-[#4b4fe8] bg-white py-1 text-[11px] font-semibold text-[#4b4fe8] hover:bg-[#4b4fe8] hover:text-white transition-colors"
                            >
                              <Plus className="h-3 w-3" /> PO
                            </button>
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
            <form className="space-y-5">
              {formErrors.submit && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3"><p className="text-sm text-red-400">{formErrors.submit}</p></div>}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="mb-1 block text-[11px] font-medium text-gray-700">Customer Name <span className="text-red-500">*</span></label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Acme Corporation"
                    className={`h-10 w-full rounded-md border px-3 text-[12px] text-gray-900 outline-none ${formErrors.name ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
                  />
                  {formErrors.name && <p className="mt-1 text-[10px] text-red-500">{formErrors.name}</p>}
                </div>
                <div className="space-y-1">
                  <label className="mb-1 block text-[11px] font-medium text-gray-700">Address <span className="text-red-500">*</span></label>
                  <input
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="123 Business St, City, State 12345"
                    className={`h-10 w-full rounded-md border px-3 text-[12px] text-gray-900 outline-none ${formErrors.address ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
                  />
                  {formErrors.address && <p className="mt-1 text-[10px] text-red-500">{formErrors.address}</p>}
                </div>
                <div className="space-y-1">
                  <label className="mb-1 block text-[11px] font-medium text-gray-700">MSA (Master Service Agreement) <span className="text-red-500">*</span></label>
                  <input
                    name="msa"
                    value={formData.msa}
                    onChange={handleInputChange}
                    placeholder="MSA agreement details or reference"
                    className={`h-10 w-full rounded-md border px-3 text-[12px] text-gray-900 outline-none ${formErrors.msa ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
                  />
                  {formErrors.msa && <p className="mt-1 text-[10px] text-red-500">{formErrors.msa}</p>}
                </div>
                <div className="space-y-1">
                  <label className="mb-1 block text-[11px] font-medium text-gray-700">Upload MSA PDF</label>
                  <input
                    type="file"
                    name="msaFile"
                    onChange={handleFileChange}
                    accept=".pdf"
                    className="block h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-[12px] text-gray-900 outline-none file:mr-2 file:rounded file:border-0 file:bg-[#eef1ff] file:px-2 file:py-1 file:text-[11px] file:font-medium file:text-[#3e57d8]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="mb-1 block text-[11px] font-medium text-gray-700">MSA Contact Person <span className="text-red-500">*</span></label>
                  <input
                    name="msaContactPerson"
                    value={formData.msaContactPerson}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className={`h-10 w-full rounded-md border px-3 text-[12px] text-gray-900 outline-none ${formErrors.msaContactPerson ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
                  />
                  {formErrors.msaContactPerson && <p className="mt-1 text-[10px] text-red-500">{formErrors.msaContactPerson}</p>}
                </div>
                <div className="space-y-1">
                  <label className="mb-1 block text-[11px] font-medium text-gray-700">MSA Contact Email <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    name="msaContactEmail"
                    value={formData.msaContactEmail}
                    onChange={handleInputChange}
                    placeholder="contact@acme.com"
                    className={`h-10 w-full rounded-md border px-3 text-[12px] text-gray-900 outline-none ${formErrors.msaContactEmail ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
                  />
                  {formErrors.msaContactEmail && <p className="mt-1 text-[10px] text-red-500">{formErrors.msaContactEmail}</p>}
                </div>
                <div className="space-y-1">
                  <label className="mb-1 block text-[11px] font-medium text-gray-700">Countries Applicable</label>
                  <input
                    name="countriesApplicable"
                    value={formData.countriesApplicable}
                    onChange={handleInputChange}
                    placeholder="US, Canada, Mexico"
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-[12px] text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="mb-1 block text-[11px] font-medium text-gray-700">Notice Period (days)</label>
                  <input
                    type="number"
                    name="noticePeriodDays"
                    value={formData.noticePeriodDays}
                    onChange={handleInputChange}
                    min="0"
                    className={`h-10 w-full rounded-md border px-3 text-[12px] text-gray-900 outline-none ${formErrors.noticePeriodDays ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
                  />
                  {formErrors.noticePeriodDays && <p className="mt-1 text-[10px] text-red-500">{formErrors.noticePeriodDays}</p>}
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="mb-1 block text-[11px] font-medium text-gray-700">MSA Remarks</label>
                  <input
                    name="msaRemark"
                    value={formData.msaRemark}
                    onChange={handleInputChange}
                    placeholder="Additional remarks about MSA"
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-[12px] text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>
            </form>
          </Modal>
        )}

        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title={
            selectedCustomer ? (
              <div className="flex w-full items-center justify-between gap-3 pr-1">
                <span className="mt-1 text-[18px] font-extrabold tracking-[-0.03em] text-[#3557b8]">Client Profile</span>
                <div className="flex items-center gap-1.5">
                  <button className="inline-flex h-8 items-center gap-2 rounded-sm border border-[#d8e2ef] bg-white px-3 text-[10px] font-semibold text-[#1b2c46]">
                    Edit Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsViewModalOpen(false)
                      openPoModal(selectedCustomer)
                    }}
                    className="inline-flex h-8 items-center gap-2 rounded-sm bg-[#3e57d8] px-3 text-[10px] font-semibold text-white shadow-[0_8px_14px_rgba(62,87,216,0.22)]"
                  >
                    Add New PO
                  </button>
                </div>
              </div>
            ) : ''
          }
          titleClassName="flex flex-1 items-center text-lg font-semibold text-gray-900"
          headerClassName="px-4 py-3"
          contentClassName="px-4 py-3"
          footerClassName="px-4 py-3"
          size="xxl"
          footer={<Button variant="secondary" onClick={() => setIsViewModalOpen(false)}>Cancel</Button>}
        >
          {selectedCustomer && (
            <div className="space-y-2 px-0.5 py-0.5">
              <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
                <div className="rounded-[22px] border border-[#e2e8f3] border-l-4 border-l-[#3662cb] bg-white px-5 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                  <div className="space-y-2">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#a3b1c3]">Registration Name</p>
                      <p className="mt-1 text-[20px] font-extrabold tracking-[-0.03em] text-[#10203a]">{selectedCustomer.name}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#a3b1c3]">Tax Identifier</p>
                      <p className="mt-1 text-[16px] font-bold text-[#1f3048]">{selectedCustomer.taxIdentifier || selectedCustomer.msa || 'Not Provided'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#a3b1c3]">Headquarters</p>
                      <p className="mt-1 text-[13px] leading-6 text-[#42536b]">{selectedCustomer.address || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[22px] border border-[#e2e8f3] bg-white px-5 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#91a0b7]">Primary Stakeholder</p>
                  <div className="mt-3 rounded-[18px] bg-[#f6f8fc] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                    <div className="flex gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e8edff] text-[16px] font-bold text-[#3e57d8]">
                        {String(selectedCustomer.msaContactPerson || selectedCustomer.name || 'CU')
                          .split(' ')
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((part) => part[0]?.toUpperCase())
                          .join('')}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[16px] font-extrabold tracking-[-0.03em] text-[#10203a]">{selectedCustomer.msaContactPerson || 'Not assigned'}</p>
                        <p className="text-[11px] font-medium text-[#7587a0]">MSA Contact Person</p>
                        <a href={`mailto:${selectedCustomer.msaContactEmail}`} className="mt-3 block truncate text-[12px] text-[#3e57d8] hover:underline">
                          {selectedCustomer.msaContactEmail || 'No email'}
                        </a>
                        <p className="mt-1 text-[12px] text-[#3e57d8]">{selectedCustomer.phoneNumber || 'No phone available'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[22px] border border-[#e2e8f3] bg-white px-5 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#91a0b7]">Contractual Foundation</p>
                  <div className="mt-4 space-y-5">
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#a3b1c3]">MSA Reference</p>
                      <p className="mt-1 text-[18px] font-extrabold tracking-[-0.03em] text-[#3557b8]">{selectedCustomer.msa || 'Not Set'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#a3b1c3]">Created Date</p>
                      <p className="mt-1 text-[15px] font-semibold text-[#16263e]">{formatters.formatDate(selectedCustomer.createdDate) || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#a3b1c3]">Renewal Date</p>
                      <p className={`mt-1 text-[15px] font-semibold ${selectedCustomer.msaRenewalDate ? 'text-[#cf3f32]' : 'text-[#16263e]'}`}>
                        {formatters.formatDate(selectedCustomer.msaRenewalDate) || 'Not Set'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[#f4d7d5] bg-[#fff6f5] px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#c33a31]">
                        {selectedCustomer.msaRenewalDate ? 'Contract review required within 45 days' : 'Renewal date not configured yet'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                <div className="rounded-[22px] border border-[#e2e8f3] bg-white px-5 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#91a0b7]">Global Parameters</p>
                  <div className="mt-4">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#a3b1c3]">Applicable Regions</p>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {String(selectedCustomer.countriesApplicable || 'Global')
                        .split(',')
                        .map((country) => country.trim())
                        .filter(Boolean)
                        .map((country) => (
                          <span key={country} className="inline-flex rounded-md bg-[#edf3ff] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#8ea2c4]">
                            {country}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-[22px] border border-[#e2e8f3] bg-white px-5 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#91a0b7]">Termination Protocol</p>
                  <div className="mt-4">
                    <div className="mt-2.5 flex items-start gap-3">
                      <div>
                        <p className="text-[34px] font-extrabold leading-none tracking-[-0.05em] text-[#3557b8]">{selectedCustomer.noticePeriodDays ?? 0}</p>
                        <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#6b7d96]">Days Notice</p>
                      </div>
                      <p className="max-w-[180px] pt-1 text-[12px] leading-6 text-[#43546b]">Standard institutional exit clause applies</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[22px] border border-[#e2e8f3] bg-white px-5 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#91a0b7]">Operational Context & Remarks</p>
                  <div className="mt-4 rounded-[14px] border-l-4 border-l-[#c8d5e8] bg-[#eef3f8] px-4 py-4 text-[13px] italic leading-6 text-[#4b5d75]">
                    {selectedCustomer.msaRemark || 'No additional remarks available for this customer.'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>

        <PoCreationModal
          isOpen={isPoModalOpen}
          onClose={() => { setIsPoModalOpen(false); setPoPreSelectedCustomer(null) }}
          preSelectedCustomer={poPreSelectedCustomer}
          onSuccess={handlePoSuccess}
        />
      </motion.div>
    </DashboardLayout>
  )
}

export default CustomersPage
