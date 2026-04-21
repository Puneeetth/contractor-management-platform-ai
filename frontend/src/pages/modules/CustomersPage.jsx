import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, AlertCircle, Users, Building2, Globe, Eye } from 'lucide-react'
import { DashboardLayout } from '../../components/layout'
import { Card, Button, Table, Modal, Input, Badge, Loader } from '../../components/ui'
import { customerService } from '../../services/customerService'
import { poService } from '../../services/poService'
import { formatters } from '../../utils/formatters'
import { validators } from '../../utils/validators'

const CustomersPage = () => {
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
      setError(err?.error?.message || 'Failed to load customers')
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
      setFormErrors({ submit: err?.error?.message || 'Failed to create customer' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns = [
    { key: 'name', label: 'Customer Name', render: (row) => <span className="font-medium text-gray-900">{row.name}</span> },
    { 
      key: 'address', 
      label: 'Address',
      render: (row) => (
        <div className="max-w-[200px] truncate cursor-help" title={row.address}>
          {row.address}
        </div>
      )
    },
    { key: 'msaContactPerson', label: 'Contact Person' },
    {
      key: 'totalPos',
      label: 'Total POs',
      render: (row) => <span className="font-medium text-gray-900">{poCountsByCustomer[row.id]?.total || 0}</span>,
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
      key: 'msaContactEmail',
      label: 'Contact Email',
      render: (row) => <a href={`mailto:${row.msaContactEmail}`} className="text-indigo-400 hover:text-indigo-300 transition-colors">{row.msaContactEmail}</a>,
    },
    {
      key: 'noticePeriodDays',
      label: 'Notice Period',
      render: (row) => <Badge variant="default">{row.noticePeriodDays} days</Badge>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <button
          onClick={() => {
            setSelectedCustomer(row)
            setIsViewModalOpen(true)
          }}
          className="text-indigo-400 hover:text-indigo-300 font-medium text-sm transition-colors"
        >
          View
        </button>
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
          <Button variant="primary" onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Customer
          </Button>
        </div>

        {/* Summary Stats */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {summaryStats.map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className="!p-4">
                  <div className="flex items-center gap-3">
                    <div className={`${stat.bg} p-2.5 rounded-xl`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
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
              <Button variant="secondary" onClick={() => setIsModalOpen(true)} className="mt-4">
                Create First Customer
              </Button>
            </div>
          ) : (
            <Table columns={columns} data={customers} isLoading={false} />
          )}
        </Card>

        {/* Create Customer Modal */}
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
      </motion.div>
    </DashboardLayout>
  )
}

export default CustomersPage

