import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, AlertCircle } from 'lucide-react'
import { DashboardLayout } from '../../components/layout'
import { Card, Button, Table, Modal, Input, Badge, Loader } from '../../components/ui'
import { customerService } from '../../services/customerService'
import { formatters } from '../../utils/formatters'
import { validators } from '../../utils/validators'

const CustomersPage = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [customers, setCustomers] = useState([])
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

  // Load customers on mount
  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await customerService.getAllCustomers()
      setCustomers(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err?.error?.message || 'Failed to load customers')
      setCustomers([])
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!validators.isRequired(formData.name)) {
      newErrors.name = 'Customer name is required'
    }

    if (!validators.isRequired(formData.address)) {
      newErrors.address = 'Address is required'
    }

    if (!validators.isRequired(formData.msa)) {
      newErrors.msa = 'MSA is required'
    }

    if (!validators.isRequired(formData.msaContactPerson)) {
      newErrors.msaContactPerson = 'Contact person is required'
    }

    if (!validators.isRequired(formData.msaContactEmail)) {
      newErrors.msaContactEmail = 'Contact email is required'
    } else if (!validators.isEmail(formData.msaContactEmail)) {
      newErrors.msaContactEmail = 'Invalid email address'
    }

    if (formData.noticePeriodDays < 0) {
      newErrors.noticePeriodDays = 'Notice period cannot be negative'
    }

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
      setFormErrors(prev => ({
        ...prev,
        [name]: '',
      }))
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
      setFormErrors({
        submit: err?.error?.message || 'Failed to create customer',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns = [
    { key: 'name', label: 'Customer Name' },
    { key: 'address', label: 'Address' },
    { key: 'msaContactPerson', label: 'Contact Person' },
    {
      key: 'msaContactEmail',
      label: 'Contact Email',
      render: (row) => <a href={`mailto:${row.msaContactEmail}`} className="text-indigo-600 hover:underline">{row.msaContactEmail}</a>,
    },
    {
      key: 'noticePeriodDays',
      label: 'Notice Period',
      render: (row) => `${row.noticePeriodDays} days`,
    },
  ]

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-600 mt-1">Manage your customer database and MSA agreements</p>
          </div>
          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
          </motion.div>
        )}

        {/* Customers Table */}
        <Card>
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <Loader message="Loading customers..." />
            </div>
          ) : customers.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500 text-lg">No customers found</p>
              <Button
                variant="secondary"
                onClick={() => setIsModalOpen(true)}
                className="mt-4"
              >
                Create First Customer
              </Button>
            </div>
          ) : (
            <Table columns={columns} data={customers} isLoading={false} />
          )}
        </Card>

        {/* Create Customer Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Add New Customer"
          size="lg"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                isLoading={isSubmitting}
                onClick={handleSubmit}
              >
                Create Customer
              </Button>
            </>
          }
        >
          <form className="space-y-4">
            {formErrors.submit && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-800">{formErrors.submit}</p>
              </div>
            )}

            <Input
              label="Customer Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              error={formErrors.name}
              placeholder="Acme Corporation"
              required
            />

            <Input
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              error={formErrors.address}
              placeholder="123 Business St, City, State 12345"
              required
            />

            <Input
              label="MSA (Master Service Agreement)"
              name="msa"
              value={formData.msa}
              onChange={handleInputChange}
              error={formErrors.msa}
              placeholder="MSA agreement details or reference"
              required
            />

            <Input
              label="MSA Contact Person"
              name="msaContactPerson"
              value={formData.msaContactPerson}
              onChange={handleInputChange}
              error={formErrors.msaContactPerson}
              placeholder="John Doe"
              required
            />

            <Input
              label="MSA Contact Email"
              type="email"
              name="msaContactEmail"
              value={formData.msaContactEmail}
              onChange={handleInputChange}
              error={formErrors.msaContactEmail}
              placeholder="contact@acme.com"
              required
            />

            <Input
              label="Countries Applicable"
              name="countriesApplicable"
              value={formData.countriesApplicable}
              onChange={handleInputChange}
              placeholder="US, Canada, Mexico"
            />

            <Input
              label="Notice Period (days)"
              type="number"
              name="noticePeriodDays"
              value={formData.noticePeriodDays}
              onChange={handleInputChange}
              error={formErrors.noticePeriodDays}
              min="0"
            />

            <Input
              label="MSA Remarks"
              name="msaRemark"
              value={formData.msaRemark}
              onChange={handleInputChange}
              placeholder="Additional remarks about MSA"
            />
          </form>
        </Modal>
      </motion.div>
    </DashboardLayout>
  )
}

export default CustomersPage
