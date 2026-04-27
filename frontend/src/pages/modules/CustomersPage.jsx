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
  Download,
} from 'lucide-react'
import { DashboardLayout } from '../../components/layout'
import { Card, Button, Modal, Input, Badge, Loader } from '../../components/ui'
import { PoCreationModal } from '../../components/modals/PoCreationModal'
import { customerService } from '../../services/customerService'
import { poService } from '../../services/poService'
import { useAuth } from '../../hooks/useAuth'
import { API_ORIGIN } from '../../services/apiClient'
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
    id: null,
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

  const handleEditClick = (customer) => {
    setFormData({
      id: customer.id,
      name: customer.name || '',
      address: customer.address || '',
      msa: customer.msa || '',
      msaContactPerson: customer.msaContactPerson || '',
      msaContactEmail: customer.msaContactEmail || '',
      countriesApplicable: customer.countriesApplicable || '',
      msaRemark: customer.msaRemark || '',
      noticePeriodDays: customer.noticePeriodDays || 30,
      msaFile: null,
    })
    setIsViewModalOpen(false)
    setIsModalOpen(true)
  }
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [isPoModalOpen, setIsPoModalOpen] = useState(false)
  const [poPreSelectedCustomer, setPoPreSelectedCustomer] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const PAGE_SIZE_OPTIONS = [10, 25, 50]

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
      setFormErrors({ submit: 'Only admins can manage customers.' })
      return
    }
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      if (formData.id) {
        await customerService.updateCustomer(formData.id, formData)
      } else {
        await customerService.createCustomer(formData)
      }
      setIsModalOpen(false)
      setFormData({
        id: null,
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
      setFormErrors({ submit: err?.message || `Failed to ${formData.id ? 'update' : 'create'} customer` })
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

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * pageSize
  const pageData = filteredCustomers.slice(pageStart, pageStart + pageSize)
  const pageEnd = filteredCustomers.length === 0 ? 0 : Math.min(pageStart + pageSize, filteredCustomers.length)

  const paginationItems = React.useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)

    const items = [1]
    let start = Math.max(2, currentPage - 1)
    let end = Math.min(totalPages - 1, currentPage + 1)

    if (currentPage <= 4) end = 5
    if (currentPage >= totalPages - 3) start = totalPages - 4

    if (start > 2) items.push('ellipsis-left')
    for (let pageNumber = start; pageNumber <= end; pageNumber += 1) {
      items.push(pageNumber)
    }
    if (end < totalPages - 1) items.push('ellipsis-right')

    items.push(totalPages)
    return items
  }, [currentPage, totalPages])

  useEffect(() => {
    setPage(1)
  }, [searchTerm, customers.length, pageSize])

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
            <h1 className="shrink-0 text-[24px] leading-none font-bold tracking-[-0.02em] text-[#0f1d33]">Customers</h1>
            <p className="truncate text-[13px] font-medium text-[#4a5c77]">Manage your global customer directory and master service agreements.</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => {
                setFormData({
                  id: null,
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
                setFormErrors({})
                setIsModalOpen(true)
              }}
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

              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                <p className="text-sm text-[#5f6f88]">
                  Showing {filteredCustomers.length === 0 ? 0 : pageStart + 1} to {pageEnd} of {filteredCustomers.length} customers
                </p>
                <div className="flex items-center gap-2">
                  <select
                    value={pageSize}
                    onChange={(event) => setPageSize(Number(event.target.value))}
                    className="h-9 rounded-lg border border-[#d5deec] bg-white px-2 text-[12px] font-medium text-[#334155] outline-none focus:border-[#4b4fe8]"
                    aria-label="Rows per page"
                  >
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>
                        {size}/page
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setPage(1)} className="rounded-lg border border-[#d8e2ef] px-2 py-1.5 text-[12px] text-[#64748b] disabled:opacity-50" disabled={currentPage === 1}>First</button>
                  <button type="button" onClick={() => setPage((prev) => Math.max(1, prev - 1))} className="rounded-lg p-1.5 text-[#8394ad] hover:bg-[#edf2f9] disabled:opacity-50" disabled={currentPage === 1}><ChevronLeft className="h-5 w-5" /></button>
                  {paginationItems.map((item) =>
                    typeof item === 'number' ? (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setPage(item)}
                        className={`inline-flex min-w-8 justify-center rounded-lg border px-2 py-1 text-sm font-semibold ${
                          item === currentPage
                            ? 'border-[#4b4fe8] bg-[#4b4fe8] text-white'
                            : 'border-[#d5deec] bg-white text-[#3b52d8]'
                        }`}
                      >
                        {item}
                      </button>
                    ) : (
                      <span key={item} className="px-1 text-[#94a3b8]">...</span>
                    )
                  )}
                  <button type="button" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} className="rounded-lg p-1.5 text-[#8394ad] hover:bg-[#edf2f9] disabled:opacity-50" disabled={currentPage === totalPages}><ChevronRight className="h-5 w-5" /></button>
                  <button type="button" onClick={() => setPage(totalPages)} className="rounded-lg border border-[#d8e2ef] px-2 py-1.5 text-[12px] text-[#64748b] disabled:opacity-50" disabled={currentPage === totalPages}>Last</button>
                </div>
              </div>
            </>
          )}
        </Card>

        {isAdmin && (
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={formData.id ? "Edit Customer" : "Add New Customer"}
            titleClassName="text-[20px] font-black text-[#111827]"
            headerClassName="px-5 py-2 border-b border-gray-100"
            contentClassName="px-5 py-3"
            size="xxl"
            footer={<><Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button variant="primary" isLoading={isSubmitting} onClick={handleSubmit}>{formData.id ? "Update Customer" : "Create Customer"}</Button></>}
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
                  <div className="flex h-10 items-center rounded-md border border-gray-300 bg-white px-2.5">
                    <label className="inline-flex h-7 cursor-pointer items-center rounded-md bg-[#eef1ff] px-2.5 text-[11px] font-medium text-[#3e57d8]">
                      Choose File
                      <input
                        type="file"
                        name="msaFile"
                        onChange={handleFileChange}
                        accept=".pdf"
                        className="hidden"
                      />
                    </label>
                    <span className="ml-2 block min-w-0 flex-1 truncate text-[12px] text-gray-500">
                      {formData.msaFile ? formData.msaFile.name : 'No file chosen'}
                    </span>
                  </div>
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
              <div className="flex w-full items-center justify-between gap-3 pr-1 py-1">
                <span className="text-[20px] font-black text-[#111827]">Customer Profile</span>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <button
                      onClick={() => handleEditClick(selectedCustomer)}
                      className="inline-flex h-9 items-center gap-2 rounded-md border border-[#d8e2ef] bg-white px-4 text-[12px] font-bold text-[#1b2c46] hover:bg-gray-50 transition-colors"
                    >
                      Edit Profile
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsViewModalOpen(false)
                      setPoPreSelectedCustomer(selectedCustomer)
                      setIsPoModalOpen(true)
                    }}
                    className="inline-flex h-9 items-center gap-2 rounded-md bg-[#3e57d8] px-4 text-[12px] font-bold text-white shadow-md hover:bg-[#354bc4] transition-colors"
                  >
                    Add New PO
                  </button>
                </div>
              </div>
            ) : ''
          }
          titleClassName="flex flex-1 items-center"
          headerClassName="px-5 py-2 border-b border-gray-100"
          contentClassName="px-5 py-3"
          size="xxl"
        >
          {selectedCustomer && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Customer Name</label>
                  <p className="mt-1 text-[16px] font-semibold text-gray-900">{selectedCustomer.name}</p>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Address</label>
                  <p className="mt-1 text-[14px] text-gray-700 leading-relaxed">{selectedCustomer.address || 'Not provided'}</p>
                </div>

                <div className="pt-2 border-t border-gray-50">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">MSA (Master Service Agreement)</label>
                  <p className="mt-1 text-[15px] font-medium text-[#3557b8]">{selectedCustomer.msa || 'Not Provided'}</p>
                </div>

                <div className="pt-2 border-t border-gray-50">
                  {selectedCustomer.msaFileUrl ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">MSA Document View</label>
                        <div className="mt-1">
                          <a
                            href={`${API_ORIGIN}${selectedCustomer.msaFileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#3e57d8] hover:underline"
                          >
                            <Search className="h-3.5 w-3.5" /> View PDF
                          </a>
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">MSA Download</label>
                        <div className="mt-1">
                          <a
                            href={`${API_ORIGIN}${selectedCustomer.msaFileUrl}`}
                            download
                            className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#3e57d8] hover:underline"
                          >
                            <Download className="h-3.5 w-3.5" /> Download
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">MSA Document</label>
                      <p className="mt-1 text-[13px] text-gray-400">No file uploaded</p>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-gray-50">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">MSA Contact Person</label>
                  <p className="mt-1 text-[15px] text-gray-900">{selectedCustomer.msaContactPerson || 'Not assigned'}</p>
                </div>
                <div className="pt-2 border-t border-gray-50">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">MSA Contact Email</label>
                  <p className="mt-1 text-[15px] text-[#3e57d8] hover:underline cursor-pointer">
                    {selectedCustomer.msaContactEmail || 'No email'}
                  </p>
                </div>

                <div className="pt-2 border-t border-gray-50">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Countries Applicable</label>
                  <p className="mt-1 text-[14px] text-gray-700">{selectedCustomer.countriesApplicable || 'Global'}</p>
                </div>
                <div className="pt-2 border-t border-gray-50">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Notice Period (days)</label>
                  <p className="mt-1 text-[14px] text-gray-700">{selectedCustomer.noticePeriodDays ?? 0} days</p>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-50">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">MSA Remarks</label>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg text-[14px] text-gray-700">
                  {selectedCustomer.msaRemark || 'No additional remarks.'}
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
