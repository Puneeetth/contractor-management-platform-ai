import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, AlertCircle } from 'lucide-react'
import { DashboardLayout } from '../../components/layout'
import { Card, Button, Table, Modal, Input, Loader } from '../../components/ui'
import { poService } from '../../services/poService'
import { formatters } from '../../utils/formatters'
import { validators } from '../../utils/validators'

const POsPage = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pos, setPos] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    contractId: '',
    customerId: '',
    poNumber: '',
    poDate: '',
    startDate: '',
    endDate: '',
    poValue: '',
    currency: 'USD',
    paymentTermsDays: 30,
    numberOfResources: '',
    remark: '',
  })
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadPOs()
  }, [])

  const loadPOs = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await poService.getAllPurchaseOrders()
      setPos(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err?.error?.message || 'Failed to load purchase orders')
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!validators.isRequired(formData.contractId)) newErrors.contractId = 'Contract ID is required'
    if (!validators.isRequired(formData.customerId)) newErrors.customerId = 'Customer ID is required'
    if (!validators.isRequired(formData.poNumber)) newErrors.poNumber = 'PO Number is required'
    if (!validators.isRequired(formData.poDate)) newErrors.poDate = 'PO Date is required'
    if (!validators.isRequired(formData.poValue)) newErrors.poValue = 'PO Value is required'
    setFormErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: ['poValue', 'paymentTermsDays', 'numberOfResources', 'contractId', 'customerId'].includes(name) 
        ? parseFloat(value) || '' 
        : value,
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
      await poService.createPurchaseOrder(formData)
      setIsModalOpen(false)
      setFormData({
        contractId: '',
        customerId: '',
        poNumber: '',
        poDate: '',
        startDate: '',
        endDate: '',
        poValue: '',
        currency: 'USD',
        paymentTermsDays: 30,
        numberOfResources: '',
        remark: '',
      })
      await loadPOs()
    } catch (err) {
      setFormErrors({ submit: err?.error?.message || 'Failed to create PO' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns = [
    { key: 'poNumber', label: 'PO Number' },
    { 
      key: 'poDate', 
      label: 'PO Date',
      render: (row) => formatters.formatDate(row.poDate)
    },
    { 
      key: 'poValue', 
      label: 'PO Value',
      render: (row) => `${formatters.formatCurrency(row.poValue)} ${row.currency}`
    },
    {
      key: 'paymentTermsDays',
      label: 'Payment Terms',
      render: (row) => `${row.paymentTermsDays} days`
    },
    {
      key: 'numberOfResources',
      label: 'Resources',
    },
  ]

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
            <p className="text-gray-600 mt-1">Manage purchase orders for contracts</p>
          </div>
          <Button variant="primary" onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add PO
          </Button>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
          </motion.div>
        )}

        <Card>
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <Loader message="Loading purchase orders..." />
            </div>
          ) : pos.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500 text-lg">No purchase orders found</p>
              <Button variant="secondary" onClick={() => setIsModalOpen(true)} className="mt-4">
                Create First PO
              </Button>
            </div>
          ) : (
            <Table columns={columns} data={pos} isLoading={false} />
          )}
        </Card>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create New Purchase Order"
          size="lg"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button variant="primary" isLoading={isSubmitting} onClick={handleSubmit}>Create</Button>
            </>
          }
        >
          <form className="space-y-4">
            {formErrors.submit && <div className="p-3 bg-red-50 rounded-lg"><p className="text-sm text-red-800">{formErrors.submit}</p></div>}
            
            <Input label="Contract ID" name="contractId" type="number" value={formData.contractId} onChange={handleInputChange} error={formErrors.contractId} required />
            <Input label="Customer ID" name="customerId" type="number" value={formData.customerId} onChange={handleInputChange} error={formErrors.customerId} required />
            <Input label="PO Number" name="poNumber" value={formData.poNumber} onChange={handleInputChange} error={formErrors.poNumber} placeholder="PO-2024-001" required />
            <Input label="PO Date" name="poDate" type="date" value={formData.poDate} onChange={handleInputChange} error={formErrors.poDate} required />
            <Input label="Start Date" name="startDate" type="date" value={formData.startDate} onChange={handleInputChange} />
            <Input label="End Date" name="endDate" type="date" value={formData.endDate} onChange={handleInputChange} />
            <Input label="PO Value ($)" name="poValue" type="number" step="0.01" value={formData.poValue} onChange={handleInputChange} error={formErrors.poValue} required />
            <Input label="Currency" name="currency" value={formData.currency} onChange={handleInputChange} />
            <Input label="Payment Terms (days)" name="paymentTermsDays" type="number" value={formData.paymentTermsDays} onChange={handleInputChange} />
            <Input label="Number of Resources" name="numberOfResources" type="number" value={formData.numberOfResources} onChange={handleInputChange} />
            <Input label="Remark" name="remark" value={formData.remark} onChange={handleInputChange} />
          </form>
        </Modal>
      </motion.div>
    </DashboardLayout>
  )
}

export default POsPage
