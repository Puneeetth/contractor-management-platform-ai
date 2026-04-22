import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, AlertCircle, Users, Building2, Globe, Eye } from 'lucide-react'
import { DashboardLayout } from '../../components/layout'
import { Card, Button, Table, Modal, Input, Badge, Loader } from '../../components/ui'
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
  })
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [isPoModalOpen, setIsPoModalOpen] = useState(false)
  const [poFormData, setPoFormData] = useState(createInitialPoFormData())
  const [poFormErrors, setPoFormErrors] = useState({})
  const [isPoSubmitting, setIsPoSubmitting] = useState(false)

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

    if (!acc[po.customerId]) {
      acc[po.customerId] = { total: 0, active: 0, inactive: 0 }
    }

    acc[po.customerId].total += 1
    if (isInactive) {
      acc[po.customerId].inactive += 1
    } else {
      acc[po.customerId].active += 1
    }

    return acc
  }, {})

  const validateForm = () => {
    const newErrors = {}
    if (!validators.isRequired(formData.name)) newErrors.name = 'Customer name is required'
    if (!validators.isRequired(formData.address)) newErrors.address = 'Address is required'
    if (!validators.isRequired(formData.msa)) newErrors.msa = 'MSA is required'
    if (!validators.isRequired(formData.msaContactPerson)) newErrors.msaContactPerson = 'Contact person is required'
    if (!validators.isRequired(formData.msaContactEmail)) {
      newErrors.msaContactEmail = 'Contact email is required'
    } else if (!validators.isEmail(formData.msaContactEmail)) {
      newErrors.msaContactEmail = 'Invalid email address'
    }
    if (formData.noticePeriodDays < 0) newErrors.noticePeriodDays = 'Notice period cannot be negative'
    setFormErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'noticePeriodDays' ? parseInt(value) || 0 : value,
    }))
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
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

    setPoFormData(prev => ({
      ...prev,
      [name]: numberFields.includes(name)
        ? (value === '' ? '' : Number(value))
        : value,
    }))

    if (poFormErrors[name]) {
      setPoFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handlePoFileChange = (e) => {
    const file = e.target.files?.[0] || null
    setPoFormData(prev => ({ ...prev, file }))
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

  const columns = [
    { key: 'name', label: 'Customer Name', render: (row) => <span className="font-medium text-gray-900">{row.name}</span> },
    { key: 'msaContactPerson', label: 'Contact Person' },
    {
      key: 'msaContactEmail',
      label: 'Contact Email',
      render: (row) => <a href={`mailto:${row.msaContactEmail}`} className="text-indigo-400 hover:text-indigo-300 transition-colors">{row.msaContactEmail}</a>,
    },
    {
      key: 'activePos',
      label: 'Active POs',
      render: (row) => <span className="font-medium text-emerald-500">{poCountsByCustomer[row.id]?.active || 0}</span>,
    },
    {
      key: 'inactivePos',
      label: 'Inactive POs',
      render: (row) => <span className="font-medium text-amber-500">{poCountsByCustomer[row.id]?.inactive || 0}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-3 whitespace-nowrap">
          <button
            onClick={() => {
              setSelectedCustomer(row)
              setIsViewModalOpen(true)
            }}
            className="text-indigo-400 hover:text-indigo-300 font-medium text-sm transition-colors"
          >
            View
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={() => openPoModal(row)}
            className="text-emerald-600 hover:text-emerald-700 font-medium text-sm transition-colors"
          >
            Add PO
          </button>
        </div>
      ),
    },
  ]

  const summaryStats = [
    { icon: Users, label: 'Total Customers', value: customers.length, color: 'text-blue-400', bg: 'bg-blue-100' },
    { icon: Building2, label: 'Active MSAs', value: customers.length, color: 'text-emerald-400', bg: 'bg-emerald-100' },
    { icon: Globe, label: 'Countries', value: new Set(customers.map(c => c.countriesApplicable).filter(Boolean)).size || 0, color: 'text-purple-400', bg: 'bg-purple-100' },
  ]

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-600 mt-1 text-sm">Manage your customer database and MSA agreements</p>
          </div>
          {isAdmin && (
            <Button variant="primary" onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Customer
            </Button>
          )}
        </div>

        {/* Summary Stats */}
        {!isLoading && (
          <div className="mb-6 overflow-x-auto">
            <div className="flex min-w-max items-center rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm md:min-w-0">
            {summaryStats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`flex min-w-[240px] flex-1 items-center justify-center gap-4 md:min-w-0 ${i !== 0 ? 'ml-6 pl-6 border-l border-gray-200' : ''}`}
              >
                <div className={`${stat.bg} shrink-0 rounded-xl p-2.5`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="flex items-baseline gap-3 whitespace-nowrap">
                  <p className="text-lg font-medium text-gray-700">{stat.label}</p>
                  <p className="text-2xl font-bold leading-none text-gray-900">{stat.value}</p>
                </div>
              </motion.div>
            ))}
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mb-4 p-4 bg-red-500/10 rounded-xl border border-red-500/20 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </motion.div>
        )}

        {/* Customers Table */}
        <Card isPadded={false}>
          {isLoading ? (
            <div className="py-12 flex justify-center"><Loader message="Loading customers..." /></div>
          ) : customers.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-gray-600 text-lg font-medium">No customers found</p>
              <p className="text-gray-500 text-sm mt-1">Get started by creating your first customer</p>
              {isAdmin && (
                <Button variant="secondary" onClick={() => setIsModalOpen(true)} className="mt-4">
                  Create First Customer
                </Button>
              )}
            </div>
          ) : (
            <Table columns={columns} data={customers} isLoading={false} />
          )}
        </Card>

        {/* Create Customer Modal */}
        {isAdmin && (
          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Customer" size="xxl"
            footer={<>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button variant="primary" isLoading={isSubmitting} onClick={handleSubmit}>Create Customer</Button>
            </>}
          >
            <form className="grid grid-cols-1 md:grid-cols-2 gap-8 gpa-y-2">
              {formErrors.submit && (
                <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                  <p className="text-sm text-red-400">{formErrors.submit}</p>
                </div>
              )}
              <Input label="Customer Name" name="name" value={formData.name} onChange={handleInputChange} error={formErrors.name} placeholder="Acme Corporation" required />
              <Input label="Address" name="address" value={formData.address} onChange={handleInputChange} error={formErrors.address} placeholder="123 Business St, City, State 12345" required />
              <Input label="MSA (Master Service Agreement)" name="msa" value={formData.msa} onChange={handleInputChange} error={formErrors.msa} placeholder="MSA agreement details or reference" required />
              <Input label="MSA Contact Person" name="msaContactPerson" value={formData.msaContactPerson} onChange={handleInputChange} error={formErrors.msaContactPerson} placeholder="John Doe" required />
              <Input label="MSA Contact Email" type="email" name="msaContactEmail" value={formData.msaContactEmail} onChange={handleInputChange} error={formErrors.msaContactEmail} placeholder="contact@acme.com" required />
              <Input label="Countries Applicable" name="countriesApplicable" value={formData.countriesApplicable} onChange={handleInputChange} placeholder="US, Canada, Mexico" />
              <Input label="Notice Period (days)" type="number" name="noticePeriodDays" value={formData.noticePeriodDays} onChange={handleInputChange} error={formErrors.noticePeriodDays} min="0" />
              <Input label="MSA Remarks" name="msaRemark" value={formData.msaRemark} onChange={handleInputChange} placeholder="Additional remarks about MSA" />
            </form>
          </Modal>
        )}

        {/* View Customer Modal */}
        <Modal
          isOpen={isViewModalOpen}
          className="!w-screen !h-screen !max-w-none !rounded-none"
          onClose={() => setIsViewModalOpen(false)}
          title="Customer Details"
          size="xxl"
          
          footer={
            <Button variant="secondary" onClick={() => setIsViewModalOpen(false)}>
              Cancel
            </Button>
          }
        >
          {selectedCustomer && (
            
            <div className="space-y-6 p-2">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer Name</p>
                  <p className="text-sm font-medium text-gray-900">{selectedCustomer.name}</p>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Address</p>
                  <p className="text-sm text-gray-900 leading-relaxed">{selectedCustomer.address}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">MSA Reference</p>
                  <p className="text-sm font-medium text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded inline-block">
                    {selectedCustomer.msa}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Created Date</p>
                  <p className="text-sm text-gray-900">{formatters.formatDate(selectedCustomer.createdDate) || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">MSA Renewal Date</p>
                  <p className="text-sm text-gray-900">{formatters.formatDate(selectedCustomer.msaRenewalDate) || 'Not Set'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">MSA contact person</p>
                  <p className="text-sm text-gray-900">{selectedCustomer.msaContactPerson}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">MSA contact person-email</p>
                  <a href={`mailto:${selectedCustomer.msaContactEmail}`} className="text-sm text-indigo-400 hover:underline">
                    {selectedCustomer.msaContactEmail}
                  </a>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Countries Applicable</p>
                  <p className="text-sm text-gray-900">{selectedCustomer.countriesApplicable || 'Global'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Notice Period given by customer</p>
                  <Badge variant="default" className="text-sm">
                    {selectedCustomer.noticePeriodDays} days
                  </Badge>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">MSA Remark</p>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 italic text-sm text-gray-600">
                    {selectedCustomer.msaRemark || 'No additional remarks'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>

        <Modal
          isOpen={isPoModalOpen}
          onClose={() => setIsPoModalOpen(false)}
          title={selectedCustomer ? `Add PO for ${selectedCustomer.name}` : 'Add PO'}
          size="xxl"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsPoModalOpen(false)}>Cancel</Button>
              <Button variant="primary" isLoading={isPoSubmitting} onClick={handlePoSubmit}>Create PO</Button>
            </>
          }
        >
          <form className="space-y-4">
            {poFormErrors.submit && (
              <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                <p className="text-sm text-red-400">{poFormErrors.submit}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="PO Number" name="poNumber" value={poFormData.poNumber} onChange={handlePoInputChange} error={poFormErrors.poNumber} placeholder="Enter PO number" required />
              <Input label="PO Date" name="poDate" type="date" value={poFormData.poDate} onChange={handlePoInputChange} error={poFormErrors.poDate} required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Start Date" name="startDate" type="date" value={poFormData.startDate} onChange={handlePoInputChange} />
              <Input label="End Date" name="endDate" type="date" value={poFormData.endDate} onChange={handlePoInputChange} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="PO Value" name="poValue" type="number" step="0.01" value={poFormData.poValue} onChange={handlePoInputChange} error={poFormErrors.poValue} required />
              <Input label="Currency" name="currency" value={poFormData.currency} onChange={handlePoInputChange} placeholder="USD" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Payment Terms (no. of days)" name="paymentTermsDays" type="number" value={poFormData.paymentTermsDays} onChange={handlePoInputChange} />
              <Input label="Customer" value={selectedCustomer?.name || ''} readOnly disabled required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="No. of resources - contractors" name="numberOfResources" type="number" value={poFormData.numberOfResources} onChange={handlePoInputChange} />
              <Input label="PO Upload (File)" type="file" name="file" onChange={handlePoFileChange} accept=".pdf,.doc,.docx" />
            </div>

            <Input label="Remark" name="remark" value={poFormData.remark} onChange={handlePoInputChange} />
            <Input
              label={<>Remarks <i>(Indicating with whom it&apos;s being shared e.g. co-worker)</i></>}
              name="sharedWith"
              value={poFormData.sharedWith}
              onChange={handlePoInputChange}
              placeholder="Shared with Finance team"
            />
          </form>
        </Modal>
      </motion.div>
    </DashboardLayout>
  )
}

export default CustomersPage

