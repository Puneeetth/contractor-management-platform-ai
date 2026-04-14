import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, AlertCircle, FileText, DollarSign, Hash } from 'lucide-react'
import { DashboardLayout } from '../../components/layout'
import { Card, Button, Table, Modal, Input, Badge, Loader } from '../../components/ui'
import { poService } from '../../services/poService'
import { formatters } from '../../utils/formatters'
import { validators } from '../../utils/validators'

const POsPage = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pos, setPos] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    contractId: '', customerId: '', poNumber: '', poDate: '',
    startDate: '', endDate: '', poValue: '', currency: 'USD',
    paymentTermsDays: 30, numberOfResources: '', remark: '',
  })
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => { loadPOs() }, [])

  const loadPOs = async () => {
    try {
      setIsLoading(true); setError(null)
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
      [name]: ['poValue', 'paymentTermsDays', 'numberOfResources', 'contractId', 'customerId'].includes(name) ? parseFloat(value) || '' : value,
    }))
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setIsSubmitting(true)
    try {
      await poService.createPurchaseOrder(formData)
      setIsModalOpen(false)
      setFormData({ contractId: '', customerId: '', poNumber: '', poDate: '', startDate: '', endDate: '', poValue: '', currency: 'USD', paymentTermsDays: 30, numberOfResources: '', remark: '' })
      await loadPOs()
    } catch (err) {
      setFormErrors({ submit: err?.error?.message || 'Failed to create PO' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalValue = pos.reduce((acc, po) => acc + (po.poValue || 0), 0)

  const columns = [
    { key: 'poNumber', label: 'PO Number', render: (row) => <span className="font-mono text-indigo-400 font-medium">{row.poNumber}</span> },
    { key: 'poDate', label: 'PO Date', render: (row) => formatters.formatDate(row.poDate) },
    { key: 'poValue', label: 'PO Value', render: (row) => <span className="text-emerald-400 font-medium">{formatters.formatCurrency(row.poValue)} {row.currency}</span> },
    { key: 'paymentTermsDays', label: 'Payment Terms', render: (row) => <Badge variant="default">{row.paymentTermsDays} days</Badge> },
    { key: 'numberOfResources', label: 'Resources' },
  ]

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Purchase Orders</h1>
            <p className="text-slate-400 mt-1 text-sm">Manage purchase orders for contracts</p>
          </div>
          <Button variant="primary" onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add PO
          </Button>
        </div>

        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              { icon: FileText, label: 'Total POs', value: pos.length, color: 'text-blue-400', bg: 'bg-blue-500/15' },
              { icon: DollarSign, label: 'Total Value', value: formatters.formatCurrency(totalValue), color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
              { icon: Hash, label: 'Total Resources', value: pos.reduce((a, p) => a + (p.numberOfResources || 0), 0), color: 'text-purple-400', bg: 'bg-purple-500/15' },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className="!p-4">
                  <div className="flex items-center gap-3">
                    <div className={`${stat.bg} p-2.5 rounded-xl`}><stat.icon className={`w-5 h-5 ${stat.color}`} /></div>
                    <div>
                      <p className="text-xs text-slate-500">{stat.label}</p>
                      <p className="text-xl font-bold text-white">{stat.value}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-4 bg-red-500/10 rounded-xl border border-red-500/20 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" /><p className="text-red-400 text-sm">{error}</p>
          </motion.div>
        )}

        <Card isPadded={false}>
          {isLoading ? (
            <div className="py-12 flex justify-center"><Loader message="Loading purchase orders..." /></div>
          ) : pos.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-white/[0.03] rounded-2xl flex items-center justify-center mx-auto mb-4"><FileText className="w-8 h-8 text-slate-600" /></div>
              <p className="text-slate-400 text-lg font-medium">No purchase orders found</p>
              <p className="text-slate-600 text-sm mt-1">Create your first PO</p>
              <Button variant="secondary" onClick={() => setIsModalOpen(true)} className="mt-4">Create First PO</Button>
            </div>
          ) : (
            <Table columns={columns} data={pos} isLoading={false} />
          )}
        </Card>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Purchase Order" size="lg"
          footer={<><Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button variant="primary" isLoading={isSubmitting} onClick={handleSubmit}>Create</Button></>}>
          <form className="space-y-4">
            {formErrors.submit && <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20"><p className="text-sm text-red-400">{formErrors.submit}</p></div>}
            <div className="grid grid-cols-2 gap-4">
              <Input label="Contract ID" name="contractId" type="number" value={formData.contractId} onChange={handleInputChange} error={formErrors.contractId} required />
              <Input label="Customer ID" name="customerId" type="number" value={formData.customerId} onChange={handleInputChange} error={formErrors.customerId} required />
            </div>
            <Input label="PO Number" name="poNumber" value={formData.poNumber} onChange={handleInputChange} error={formErrors.poNumber} placeholder="PO-2024-001" required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="PO Date" name="poDate" type="date" value={formData.poDate} onChange={handleInputChange} error={formErrors.poDate} required />
              <Input label="PO Value ($)" name="poValue" type="number" step="0.01" value={formData.poValue} onChange={handleInputChange} error={formErrors.poValue} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Start Date" name="startDate" type="date" value={formData.startDate} onChange={handleInputChange} />
              <Input label="End Date" name="endDate" type="date" value={formData.endDate} onChange={handleInputChange} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Currency" name="currency" value={formData.currency} onChange={handleInputChange} />
              <Input label="Payment Terms (days)" name="paymentTermsDays" type="number" value={formData.paymentTermsDays} onChange={handleInputChange} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Number of Resources" name="numberOfResources" type="number" value={formData.numberOfResources} onChange={handleInputChange} />
              <Input label="Remark" name="remark" value={formData.remark} onChange={handleInputChange} />
            </div>
          </form>
        </Modal>
      </motion.div>
    </DashboardLayout>
  )
}

export default POsPage
