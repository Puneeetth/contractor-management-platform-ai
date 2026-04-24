import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, AlertCircle, Briefcase, DollarSign, CalendarDays } from 'lucide-react'
import { DashboardLayout } from '../../components/layout'
import { Card, Button, Table, Modal, Input, Select, Badge, Loader, Textarea } from '../../components/ui'
import { contractService, contractorService } from '../../services/contractorService'
import { customerService } from '../../services/customerService'
import { poService } from '../../services/poService'
import { formatters } from '../../utils/formatters'
import { validators } from '../../utils/validators'

const ContractsPage = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [contracts, setContracts] = useState([])
  const [customers, setCustomers] = useState([])
  const [contractors, setContractors] = useState([])
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    contractorId: '',
    customerId: '',
    poAllocation: '',
    billRate: '',
    payRate: '',
    estimatedHours: '',
    estimatedBudget: '',
    startDate: '',
    endDate: '',
    noticePeriodDays: 30,
    throughEor: false,
    remarks: '',
    terminationRemarks: '',
  })
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const today = new Date()
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
  const minStartDate = tomorrow.toISOString().slice(0, 10)

  useEffect(() => {
    loadContracts()
    loadCustomers()
    loadContractors()
    loadPurchaseOrders()
  }, [])

  const customerNameById = useMemo(
    () =>
      customers.reduce((lookup, customer) => {
        lookup[customer.id] = customer.name
        return lookup
      }, {}),
    [customers]
  )

  const purchaseOrderByNumber = useMemo(
    () =>
      purchaseOrders.reduce((lookup, po) => {
        const normalized = String(po?.poNumber || '').trim()
        if (normalized) lookup[normalized] = po
        return lookup
      }, {}),
    [purchaseOrders]
  )

  const selectedPurchaseOrder = useMemo(() => {
    const normalized = String(formData.poAllocation || '').trim()
    if (!normalized) return null
    return purchaseOrderByNumber[normalized] || null
  }, [formData.poAllocation, purchaseOrderByNumber])

  const calculateEstimatedBudget = (billRate, estimatedHours) => {
    const normalizedBillRate = Number(billRate)
    const normalizedHours = Number(estimatedHours)

    if (!normalizedBillRate || !normalizedHours) {
      return ''
    }

    return Number((normalizedBillRate * normalizedHours).toFixed(2))
  }

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

  const loadContractors = async () => {
    try {
      const data = await contractorService.getAllContractors()
      setContractors(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load contractors:', err)
    }
  }

  const loadPurchaseOrders = async () => {
    try {
      const data = await poService.getAllPurchaseOrders()
      setPurchaseOrders(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load purchase orders:', err)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    const hasPo = Boolean(String(formData.poAllocation || '').trim())
    if (!validators.isRequired(formData.contractorId)) newErrors.contractorId = 'Contractor is required'
    if (!hasPo && !validators.isRequired(formData.customerId)) newErrors.customerId = 'Customer is required'
    if (!validators.isRequired(formData.billRate)) newErrors.billRate = 'Bill rate is required'
    if (!validators.isRequired(formData.payRate)) newErrors.payRate = 'Pay rate is required'
    if (!validators.isRequired(formData.estimatedHours)) newErrors.estimatedHours = 'Estimated hours is required'
    if (!validators.isRequired(formData.estimatedBudget)) newErrors.estimatedBudget = 'Estimated budget is required'
    if (
      validators.isRequired(formData.billRate) &&
      validators.isRequired(formData.payRate) &&
      Number(formData.payRate) >= Number(formData.billRate)
    ) {
      newErrors.rateValidation = 'Pay rate must be less than bill rate'
    }
    if (!validators.isRequired(formData.startDate)) newErrors.startDate = 'Start date is required'
    if (!validators.isRequired(formData.endDate)) newErrors.endDate = 'End date is required'
    if (formData.startDate && formData.startDate <= new Date().toISOString().slice(0, 10)) {
      newErrors.startDate = 'Start date must be in the future (upcoming contract only)'
    }
    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      newErrors.endDate = 'End date cannot be before start date'
    }
    setFormErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    let blockedRateEntry = false

    setFormData((prev) => {
      const parsedValue =
        type === 'checkbox'
          ? checked
          : ['billRate', 'payRate'].includes(name)
            ? parseFloat(value) || ''
            : ['estimatedHours', 'noticePeriodDays'].includes(name)
              ? parseInt(value) || ''
              : value

      const nextFormData = {
        ...prev,
        [name]: parsedValue,
      }

      if (name === 'poAllocation') {
        const normalizedPoNumber = String(parsedValue || '').trim()
        const linkedPo = purchaseOrderByNumber[normalizedPoNumber]
        nextFormData.customerId = linkedPo?.customerId ? String(linkedPo.customerId) : ''
      }

      if (name === 'payRate' && parsedValue !== '' && prev.billRate !== '' && Number(parsedValue) > Number(prev.billRate)) {
        blockedRateEntry = true
        return prev
      }

      if (name === 'billRate' && parsedValue !== '' && prev.payRate !== '' && Number(prev.payRate) >= Number(parsedValue)) {
        blockedRateEntry = true
        return prev
      }

      if (name === 'billRate' || name === 'estimatedHours') {
        nextFormData.estimatedBudget = calculateEstimatedBudget(
          name === 'billRate' ? parsedValue : prev.billRate,
          name === 'estimatedHours' ? parsedValue : prev.estimatedHours
        )
      }

      return nextFormData
    })

    if (blockedRateEntry) {
      setFormErrors((prev) => ({
        ...prev,
        rateValidation: 'Pay rate must be less than bill rate',
      }))
      return
    }

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }))
    }

    if ((name === 'billRate' || name === 'estimatedHours') && formErrors.estimatedBudget) {
      setFormErrors((prev) => ({ ...prev, estimatedBudget: '' }))
    }

    if ((name === 'billRate' || name === 'payRate') && (formErrors.billRate || formErrors.payRate || formErrors.rateValidation)) {
      setFormErrors((prev) => ({ ...prev, billRate: '', payRate: '', rateValidation: '' }))
    }

    if ((name === 'startDate' || name === 'endDate') && (formErrors.startDate || formErrors.endDate)) {
      setFormErrors((prev) => ({ ...prev, startDate: '', endDate: '' }))
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
        poAllocation: '',
        billRate: '',
        payRate: '',
        estimatedHours: '',
        estimatedBudget: '',
        startDate: '',
        endDate: '',
        noticePeriodDays: 30,
        throughEor: false,
        remarks: '',
        terminationRemarks: '',
      })
      await loadContracts()
    } catch (err) {
      setFormErrors({ submit: err?.error?.message || 'Failed to create contract' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns = [
    {
      key: 'contractorName',
      label: 'Contractor Name',
      render: (row) => <span className="font-medium text-gray-900">{row.contractorName || 'N/A'}</span>,
    },
    {
      key: 'billRate',
      label: 'Bill Rate',
      render: (row) => <span className="text-emerald-400 font-medium">{formatters.formatCurrency(row.billRate)}</span>,
    },
    {
      key: 'payRate',
      label: 'Pay Rate',
      render: (row) => <span className="text-gray-700">{formatters.formatCurrency(row.payRate)}</span>,
    },
    { key: 'estimatedHours', label: 'Est. Hours', render: (row) => formatters.formatHours(row.estimatedHours) },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge variant={formatters.getStatusColor(row.status)}>
          {row.status}
        </Badge>
      ),
    },
  ]

  const activeContracts = contracts.filter((contract) => contract.status === 'ACTIVE').length
  const upcomingContracts = contracts.filter((contract) => contract.status === 'UPCOMING').length
  const totalBudget = contracts.reduce((acc, contract) => acc + (contract.estimatedBudget || 0), 0)

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

        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[
              { icon: Briefcase, label: 'Total Contracts', value: contracts.length, color: 'text-blue-400', bg: 'bg-blue-100' },
              { icon: CalendarDays, label: 'Active', value: activeContracts, color: 'text-emerald-400', bg: 'bg-emerald-100' },
              { icon: CalendarDays, label: 'Upcoming', value: upcomingContracts, color: 'text-amber-500', bg: 'bg-amber-100' },
              { icon: DollarSign, label: 'Total Budget', value: formatters.formatCurrency(totalBudget), color: 'text-purple-400', bg: 'bg-purple-100' },
            ].map((stat, i) => (
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

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 p-4 bg-red-500/10 rounded-xl border border-red-500/20 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </motion.div>
        )}

        <Card isPadded={false}>
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <Loader message="Loading contracts..." />
            </div>
          ) : contracts.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-gray-600 text-lg font-medium">No contracts found</p>
              <p className="text-gray-500 text-sm mt-1">Create your first contract to get started</p>
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
          size="xxl"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" isLoading={isSubmitting} onClick={handleSubmit}>
                Create
              </Button>
            </>
          }
        >
          <form className="space-y-4">
            {formErrors.submit && (
              <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                <p className="text-sm text-red-400">{formErrors.submit}</p>
              </div>
            )}

            {/* Row 1: Select Customer | Select PO */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {formData.poAllocation ? (
                <Input
                  label="Customer"
                  value={formData.customerId ? (customerNameById[formData.customerId] || `Customer #${formData.customerId}`) : ''}
                  error={formErrors.customerId}
                  readOnly
                  className="cursor-not-allowed bg-gray-50"
                  placeholder="Auto-linked from selected PO"
                />
              ) : (
                <Select
                  label="Select Customer"
                  name="customerId"
                  value={formData.customerId}
                  onChange={handleInputChange}
                  error={formErrors.customerId}
                  required
                  options={[
                    { value: '', label: 'Select a customer...' },
                    ...customers.map((c) => ({ value: String(c.id), label: c.name })),
                  ]}
                />
              )}
              <Select
                label="Select PO (Optional)"
                name="poAllocation"
                value={formData.poAllocation}
                onChange={handleInputChange}
                error={formErrors.poAllocation}
                options={[
                  { value: '', label: 'No PO — select customer manually...' },
                  ...purchaseOrders
                    .filter((po) => Boolean(po?.poNumber))
                    .map((po) => {
                      const normalized = String(po.poNumber).trim()
                      const customerName = customerNameById[po.customerId] || `Customer #${po.customerId}`
                      return { value: normalized, label: `${normalized} | ${customerName}` }
                    }),
                ]}
              />
            </div>

            {selectedPurchaseOrder && (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3">
                <p className="text-sm font-medium text-indigo-900">
                  PO Window: {formatters.formatDate(selectedPurchaseOrder.startDate)} to {formatters.formatDate(selectedPurchaseOrder.endDate)}
                </p>
                <p className="mt-1 text-sm text-indigo-800">
                  Resources: {selectedPurchaseOrder.numberOfResources || 'NA'} allocated
                </p>
              </div>
            )}

            {/* Row 2: Contractor (full width) */}
            <Select
              label="Contractor"
              name="contractorId"
              value={formData.contractorId}
              onChange={handleInputChange}
              error={formErrors.contractorId}
              required
              options={[
                { value: '', label: 'Select a contractor...' },
                ...contractors.map((contractor) => ({
                  value: String(contractor.id),
                  label: `${contractor.name} (${contractor.contractorId})`,
                })),
              ]}
            />

            {formErrors.rateValidation && (
              <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                <p className="text-sm text-red-400">{formErrors.rateValidation}</p>
              </div>
            )}

            {/* Row 3: Bill Rate | Pay Rate */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label="Bill Rate ($)" name="billRate" type="number" step="0.01" value={formData.billRate} onChange={handleInputChange} error={formErrors.billRate} required />
              <Input label="Pay Rate ($)" name="payRate" type="number" step="0.01" value={formData.payRate} onChange={handleInputChange} error={formErrors.payRate} required />
            </div>

            {/* Row 4: Estimated Hours | Estimated Budget */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label="Estimated Hours" name="estimatedHours" type="number" value={formData.estimatedHours} onChange={handleInputChange} error={formErrors.estimatedHours} required />
              <Input label="Estimated Budget ($)" name="estimatedBudget" type="number" step="0.01" value={formData.estimatedBudget} error={formErrors.estimatedBudget} readOnly className="bg-gray-50 cursor-not-allowed" required />
            </div>

            {/* Row 5: Start Date | End Date */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label="Start Date" name="startDate" type="date" value={formData.startDate} onChange={handleInputChange} error={formErrors.startDate} min={minStartDate} required />
              <Input label="End Date" name="endDate" type="date" value={formData.endDate} onChange={handleInputChange} error={formErrors.endDate} min={formData.startDate || minStartDate} required />
            </div>

            {/* Row 6: Notice Period | Through EOR */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label="Notice Period (days)" name="noticePeriodDays" type="number" value={formData.noticePeriodDays} onChange={handleInputChange} error={formErrors.noticePeriodDays} min="0" />
              <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 mt-auto">
                <input
                  type="checkbox"
                  name="throughEor"
                  id="throughEor"
                  checked={formData.throughEor}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-200"
                />
                <label htmlFor="throughEor" className="text-sm font-medium text-gray-700">Through EOR</label>
              </div>
            </div>

            {/* Row 7: Remarks | Termination Remarks */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Textarea
                label="Remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                placeholder="Commercial notes, onboarding notes, or delivery context"
              />
              <Textarea
                label="Termination Remarks"
                name="terminationRemarks"
                value={formData.terminationRemarks}
                onChange={handleInputChange}
                placeholder="Termination context or exit notes"
              />
            </div>
          </form>
        </Modal>
      </motion.div>
    </DashboardLayout>
  )
}

export default ContractsPage
