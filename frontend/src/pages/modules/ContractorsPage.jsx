import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, AlertCircle, Briefcase, DollarSign, CalendarDays } from 'lucide-react'
import { DashboardLayout } from '../../components/layout'
import { Card, Button, Table, Modal, Input, Select, Badge, Loader } from '../../components/ui'
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
        contractorId: '', customerId: '', billRate: '', payRate: '',
        estimatedHours: '', estimatedBudget: '', startDate: '', endDate: '',
        noticePeriodDays: 30, throughEor: false, remarks: '',
      })
      await loadContracts()
    } catch (err) {
      setFormErrors({ submit: err?.error?.message || 'Failed to create contract' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns = [
    { key: 'id', label: 'Contract ID', render: (row) => <span className="font-mono text-indigo-400">#CT-{String(row.id).padStart(3, '0')}</span> },
    { key: 'billRate', label: 'Bill Rate', render: (row) => <span className="text-emerald-400 font-medium">{formatters.formatCurrency(row.billRate)}</span> },
    { key: 'payRate', label: 'Pay Rate', render: (row) => <span className="text-gray-700">{formatters.formatCurrency(row.payRate)}</span> },
    { key: 'estimatedHours', label: 'Est. Hours', render: (row) => formatters.formatHours(row.estimatedHours) },
    {
      key: 'status', label: 'Status',
      render: (row) => <Badge variant={row.status === 'ACTIVE' ? 'approved' : row.status === 'TERMINATED' ? 'rejected' : 'default'}>{row.status}</Badge>,
    },
  ]

  const activeContracts = contracts.filter(c => c.status === 'ACTIVE').length
  const totalBudget = contracts.reduce((acc, c) => acc + (c.estimatedBudget || 0), 0)

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contracts</h1>
            <p className="text-gray-600 mt-1 text-sm">Manage contractor contracts and assignments</p>
          </div>
          <Button variant="primary" onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Contract
          </Button>
        </div>

        {/* Summary Stats */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              { icon: Briefcase, label: 'Total Contracts', value: contracts.length, color: 'text-blue-400', bg: 'bg-blue-100' },
              { icon: CalendarDays, label: 'Active', value: activeContracts, color: 'text-emerald-400', bg: 'bg-emerald-100' },
              { icon: DollarSign, label: 'Total Budget', value: formatters.formatCurrency(totalBudget), color: 'text-purple-400', bg: 'bg-purple-100' },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className="!p-4">
                  <div className="flex items-center gap-3">
                    <div className={`${stat.bg} p-2.5 rounded-xl`}><stat.icon className={`w-5 h-5 ${stat.color}`} /></div>
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

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mb-4 p-4 bg-red-500/10 rounded-xl border border-red-500/20 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </motion.div>
        )}

        <Card isPadded={false}>
          {isLoading ? (
            <div className="py-12 flex justify-center"><Loader message="Loading contracts..." /></div>
          ) : contracts.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-gray-600 text-lg font-medium">No contracts found</p>
              <p className="text-gray-500 text-sm mt-1">Create your first contract to get started</p>
              <Button variant="secondary" onClick={() => setIsModalOpen(true)} className="mt-4">Create First Contract</Button>
            </div>
          ) : (
            <Table columns={columns} data={contracts} isLoading={false} />
          )}
        </Card>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Contract" size="xxl"
          footer={<>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" isLoading={isSubmitting} onClick={handleSubmit}>Create</Button>
          </>}
        >
          <form className="space-y-4">
            {formErrors.submit && <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20"><p className="text-sm text-red-400">{formErrors.submit}</p></div>}
            <Input label="Contractor ID" name="contractorId" type="number" value={formData.contractorId} onChange={handleInputChange} error={formErrors.contractorId} required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Bill Rate ($)" name="billRate" type="number" step="0.01" value={formData.billRate} onChange={handleInputChange} error={formErrors.billRate} required />
              <Input label="Pay Rate ($)" name="payRate" type="number" step="0.01" value={formData.payRate} onChange={handleInputChange} error={formErrors.payRate} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Estimated Hours" name="estimatedHours" type="number" value={formData.estimatedHours} onChange={handleInputChange} error={formErrors.estimatedHours} required />
              <Input label="Estimated Budget ($)" name="estimatedBudget" type="number" step="0.01" value={formData.estimatedBudget} onChange={handleInputChange} error={formErrors.estimatedBudget} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Start Date" name="startDate" type="date" value={formData.startDate} onChange={handleInputChange} error={formErrors.startDate} required />
              <Input label="End Date" name="endDate" type="date" value={formData.endDate} onChange={handleInputChange} error={formErrors.endDate} required />
            </div>
            <Input label="Notice Period (days)" name="noticePeriodDays" type="number" value={formData.noticePeriodDays} onChange={handleInputChange} />
            <div className="flex items-center gap-3 py-2">
              <input type="checkbox" name="throughEor" id="throughEor" checked={formData.throughEor} onChange={handleInputChange} className="w-4 h-4 rounded border-gray-300 bg-white text-indigo-600 focus:ring-indigo-200" />
              <label htmlFor="throughEor" className="text-sm text-gray-700">Through EOR</label>
            </div>
            <Input label="Remarks" name="remarks" value={formData.remarks} onChange={handleInputChange} placeholder="Additional notes..." />
          </form>
        </Modal>
      </motion.div>
    </DashboardLayout>
  )
}

export default ContractorsPage

