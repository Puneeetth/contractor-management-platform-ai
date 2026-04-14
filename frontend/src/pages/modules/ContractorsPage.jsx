import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, AlertCircle } from 'lucide-react'
import { DashboardLayout } from '../../components/layout'
import { Card, Button, Table, Modal, Input, Select, Loader } from '../../components/ui'
import { contractService } from '../../services/contractorService'
import { customerService } from '../../services/customerService'
import { formatters } from '../../utils/formatters'
import { validators } from '../../utils/validators'

const ContractorsPage = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [contracts, setContracts] = useState([])
  const [customers, setCustomers] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    contractorId: '',
    customerId: '',
    billRate: '',
    payRate: '',
    estimatedHours: '',
    estimatedBudget: '',
    startDate: '',
    endDate: '',
    noticePeriodDays: 30,
    throughEor: false,
    remarks: '',
  })
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadContracts()
    loadCustomers()
  }, [])

  const loadContracts = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await contractService.getAllContracts()
      setContracts(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err?.error?.message || 'Failed to load contracts')
    } finally {
      setIsLoading(false)
    }
  }

  const loadCustomers = async () => {
    try {
      const data = await customerService.getAllCustomers()
      setCustomers(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load customers:', err)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!validators.isRequired(formData.contractorId)) newErrors.contractorId = 'Contractor ID is required'
    if (!validators.isRequired(formData.billRate)) newErrors.billRate = 'Bill rate is required'
    if (!validators.isRequired(formData.payRate)) newErrors.payRate = 'Pay rate is required'
    if (!validators.isRequired(formData.estimatedHours)) newErrors.estimatedHours = 'Estimated hours is required'
    if (!validators.isRequired(formData.estimatedBudget)) newErrors.estimatedBudget = 'Estimated budget is required'
    if (!validators.isRequired(formData.startDate)) newErrors.startDate = 'Start date is required'
    if (!validators.isRequired(formData.endDate)) newErrors.endDate = 'End date is required'

    setFormErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (
        ['billRate', 'payRate', 'estimatedBudget'].includes(name) ? parseFloat(value) || '' :
        ['estimatedHours', 'noticePeriodDays'].includes(name) ? parseInt(value) || '' :
        value
      ),
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
      await contractService.createContract(formData)
      setIsModalOpen(false)
      setFormData({
        contractorId: '',
        customerId: '',
        billRate: '',
        payRate: '',
        estimatedHours: '',
        estimatedBudget: '',
        startDate: '',
        endDate: '',
        noticePeriodDays: 30,
        throughEor: false,
        remarks: '',
      })
      await loadContracts()
    } catch (err) {
      setFormErrors({ submit: err?.error?.message || 'Failed to create contract' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns = [
    { key: 'id', label: 'Contract ID' },
    { 
      key: 'billRate', 
      label: 'Bill Rate',
      render: (row) => formatters.formatCurrency(row.billRate)
    },
    { 
      key: 'payRate', 
      label: 'Pay Rate',
      render: (row) => formatters.formatCurrency(row.payRate)
    },
    {
      key: 'estimatedHours',
      label: 'Est. Hours',
      render: (row) => formatters.formatHours(row.estimatedHours)
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className={`px-2 py-1 rounded text-sm ${row.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {row.status}
        </span>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Contracts</h1>
            <p className="text-gray-600 mt-1">Manage contractor contracts and assignments</p>
          </div>
          <Button variant="primary" onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Contract
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
              <Loader message="Loading contracts..." />
            </div>
          ) : contracts.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500 text-lg">No contracts found</p>
              <Button variant="secondary" onClick={() => setIsModalOpen(true)} className="mt-4">
                Create First Contract
              </Button>
            </div>
          ) : (
            <Table columns={columns} data={contracts} isLoading={false} />
          )}
        </Card>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create New Contract"
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
            
            <Input label="Contractor ID" name="contractorId" type="number" value={formData.contractorId} onChange={handleInputChange} error={formErrors.contractorId} required />
            <Input label="Bill Rate ($)" name="billRate" type="number" step="0.01" value={formData.billRate} onChange={handleInputChange} error={formErrors.billRate} required />
            <Input label="Pay Rate ($)" name="payRate" type="number" step="0.01" value={formData.payRate} onChange={handleInputChange} error={formErrors.payRate} required />
            <Input label="Estimated Hours" name="estimatedHours" type="number" value={formData.estimatedHours} onChange={handleInputChange} error={formErrors.estimatedHours} required />
            <Input label="Estimated Budget ($)" name="estimatedBudget" type="number" step="0.01" value={formData.estimatedBudget} onChange={handleInputChange} error={formErrors.estimatedBudget} required />
            <Input label="Start Date" name="startDate" type="date" value={formData.startDate} onChange={handleInputChange} error={formErrors.startDate} required />
            <Input label="End Date" name="endDate" type="date" value={formData.endDate} onChange={handleInputChange} error={formErrors.endDate} required />
            <Input label="Notice Period (days)" name="noticePeriodDays" type="number" value={formData.noticePeriodDays} onChange={handleInputChange} />
            <Input label="Through EOR?" name="throughEor" type="checkbox" checked={formData.throughEor} onChange={handleInputChange} />
            <Input label="Remarks" name="remarks" value={formData.remarks} onChange={handleInputChange} />
          </form>
        </Modal>
      </motion.div>
    </DashboardLayout>
  )
}

export default ContractorsPage
