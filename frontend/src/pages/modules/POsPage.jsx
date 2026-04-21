import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, AlertCircle, FileText, DollarSign, Hash } from 'lucide-react'
import { DashboardLayout } from '../../components/layout'
import { Card, Button, Table, Modal, Input, Badge, Loader, Select } from '../../components/ui'
import { API_ORIGIN } from '../../services/apiClient'
import { poService } from '../../services/poService'
import { contractService } from '../../services/contractorService'
import { customerService } from '../../services/customerService'
import { formatters } from '../../utils/formatters'
import { validators } from '../../utils/validators'

const POsPage = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pos, setPos] = useState([])
  const [contracts, setContracts] = useState([])
  const [customers, setCustomers] = useState([])
  const [isReferenceLoading, setIsReferenceLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    poNumber: '', poDate: '', startDate: '', endDate: '', 
    poValue: '', currency: 'USD', paymentTermsDays: 30, 
    customerId: '', remark: '', numberOfResources: '', 
    sharedWith: '', fileUrl: '',
    file: null,
  })
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedPO, setSelectedPO] = useState(null)
  

 useEffect(() => {
  loadInitialData()
}, [])
  useEffect(() => {
    if (isModalOpen) {
      loadReferenceData()
    }
  }, [isModalOpen])

  const loadPOs = async () => {
    try {
      setIsLoading(true); setError(null)
      const data = await poService.getAllPurchaseOrders()
      setPos(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err?.message || 'Failed to load purchase orders')
    } finally {
      setIsLoading(false)
    }
  }

  const loadReferenceData = async () => {
    try {
      setIsReferenceLoading(true)
      const [contractsData, customersData] = await Promise.all([
        contractService.getAllContracts(),
        customerService.getAllCustomers(),
      ])
      setContracts(Array.isArray(contractsData) ? contractsData : [])
      setCustomers(Array.isArray(customersData) ? customersData : [])
    } catch (err) {
      setFormErrors({ submit: err?.message || 'Failed to load contracts/customers' })
    } finally {
      setIsReferenceLoading(false)
    }
  }
  const loadInitialData = async () => {
  try {
    setIsLoading(true)
    setError(null)

    const [poData, customerData] = await Promise.all([
      poService.getAllPurchaseOrders(),
      customerService.getAllCustomers(),
    ])

    setPos(Array.isArray(poData) ? poData : [])
    setCustomers(Array.isArray(customerData) ? customerData : [])

  } catch (err) {
    setError(err?.message || 'Failed to load data')
  } finally {
    setIsLoading(false)
  }
}

  const validateForm = () => {
    const newErrors = {}
    if (!validators.isRequired(formData.customerId)) newErrors.customerId = 'Customer is required'
    if (!validators.isRequired(formData.poNumber)) newErrors.poNumber = 'PO Number is required'
    if (!validators.isRequired(formData.poDate)) newErrors.poDate = 'PO Date is required'
    if (!validators.isRequired(formData.poValue)) newErrors.poValue = 'PO Value is required'
    setFormErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  const handleFileChange = (e) => {
  const file = e.target.files[0]

  setFormData(prev => ({
    ...prev,
    file
  }))
}

  const handleInputChange = (e) => {
    const { name, value } = e.target
    const numberFields = ['poValue', 'paymentTermsDays', 'numberOfResources', 'contractId', 'customerId']
    setFormData(prev => ({
      ...prev,
      [name]: numberFields.includes(name)
        ? (value === '' ? '' : Number(value))
        : value,
    }))
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleContractChange = (e) => {
    const contractId = e.target.value === '' ? '' : Number(e.target.value)
    const selected = contracts.find(c => c.id === contractId)
    setFormData(prev => ({
      ...prev,
      contractId,
      customerId: selected?.customerId ?? '',
    }))
    setFormErrors(prev => ({ ...prev, contractId: '', customerId: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setIsSubmitting(true)
    try {
      await poService.createPurchaseOrder(formData)
      setIsModalOpen(false)
      setFormData({ 
        poNumber: '', poDate: '', startDate: '', endDate: '', 
        poValue: '', currency: 'USD', paymentTermsDays: 30, 
        customerId: '', remark: '', numberOfResources: '', 
        sharedWith: '', fileUrl: ''
      })
      await loadPOs()
    } catch (err) {
      setFormErrors({ submit: err?.message || 'Failed to create PO' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalValue = pos.reduce((acc, po) => acc + (po.poValue || 0), 0)
  const customerNameById = (id) => customers.find(c => c.id === id)?.name || `Customer #${id}`
  const getFileViewUrl = (fileUrl) => {
    if (!fileUrl) return ''
    if (/^https?:\/\//i.test(fileUrl)) return fileUrl

    const normalizedPath = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`
    return `${API_ORIGIN}${normalizedPath}`
  }
  const contractOptions = contracts.map(contract => ({
    value: contract.id,
    label: `Contract #${contract.id} · ${customerNameById(contract.customerId)}`,
  }))

  const columns = [
    { key: 'poNumber', label: 'PO Number', render: (row) => <span className="font-mono text-indigo-400 font-medium">{row.poNumber}</span> },
    { key: 'customer', label: 'Customer', render: (row) => <span className="text-gray-900">{customerNameById(row.customerId)}</span> },
    { key: 'poDate', label: 'PO Date', render: (row) => formatters.formatDate(row.poDate) },
{ key: 'poValue', label: 'PO Value', render: (row) => <span className="text-emerald-400 font-medium">{formatters.formatCurrency(row.poValue, row.currency)}</span> },    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <button
          onClick={() => {
            setSelectedPO(row)
            setIsViewModalOpen(true)
          }}
          className="text-indigo-400 hover:text-indigo-300 font-medium text-sm transition-colors"
        >
          View
        </button>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
            <p className="text-gray-600 mt-1 text-sm">Manage purchase orders for contracts</p>
          </div>
          <Button variant="primary" onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add PO
          </Button>
        </div>

        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              { icon: FileText, label: (
                <>
                <b>Total POs</b>
                </>
              ), value: pos.length, color: 'text-blue-400', bg: 'bg-blue-100' },
              { icon: DollarSign, label :(
                <>
                <b>Total Value</b>
                </>
              ), value: formatters.formatCurrency(totalValue), color: 'text-emerald-400', bg: 'bg-emerald-100' },
{
  icon: Hash,
  label: (
    <>
      <b>TotalResources</b> (Contractors)
    </>
  ),
  value: pos.reduce((a, p) => a + (p.numberOfResources || 0), 0),
  color: 'text-purple-400',
  bg: 'bg-purple-100'
}            ].map((stat, i) => (
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-4 bg-red-500/10 rounded-xl border border-red-500/20 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" /><p className="text-red-400 text-sm">{error}</p>
          </motion.div>
        )}

        <Card isPadded={false}>
          {isLoading ? (
            <div className="py-12 flex justify-center"><Loader message="Loading purchase orders..." /></div>
          ) : pos.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><FileText className="w-8 h-8 text-gray-500" /></div>
              <p className="text-gray-600 text-lg font-medium">No purchase orders found</p>
              <p className="text-gray-500 text-sm mt-1">Create your first PO</p>
              <Button variant="secondary" onClick={() => setIsModalOpen(true)} className="mt-4">Create First PO</Button>
            </div>
          ) : (
            <Table columns={columns} data={pos} isLoading={false} />
          )}
        </Card>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Purchase Order" size="xxl"
          footer={<><Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button variant="primary" isLoading={isSubmitting} onClick={handleSubmit}>Create PO</Button></>}>
          <form className="space-y-4">
            {formErrors.submit && <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20"><p className="text-sm text-red-400">{formErrors.submit}</p></div>}
            
            <div className="grid grid-cols-2 gap-4">
              <Input label="PO Number" name="poNumber" value={formData.poNumber} onChange={handleInputChange} error={formErrors.poNumber} placeholder="PO-2024-001" required />
              <Input label="PO Date" name="poDate" type="date" value={formData.poDate} onChange={handleInputChange} error={formErrors.poDate} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Start Date" name="startDate" type="date" value={formData.startDate} onChange={handleInputChange} />
              <Input label="End Date" name="endDate" type="date" value={formData.endDate} onChange={handleInputChange} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="PO Value" name="poValue" type="number" step="0.01" value={formData.poValue} onChange={handleInputChange} error={formErrors.poValue} required />
              <Input label="Currency" name="currency" value={formData.currency} onChange={handleInputChange} placeholder="USD" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Payment Terms (no. of days)" name="paymentTermsDays" type="number" value={formData.paymentTermsDays} onChange={handleInputChange} />
              <Select
                label="Select Customer"
                value={formData.customerId}
                onChange={(e) => setFormData(prev => ({ ...prev, customerId: e.target.value === '' ? '' : Number(e.target.value) }))}
                options={customers.map(c => ({ value: c.id, label: c.name }))}
                error={formErrors.customerId}
                required
                disabled={isReferenceLoading}
                placeholder={isReferenceLoading ? 'Loading customers...' : 'Select a customer'}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="No. of resources - contractors" name="numberOfResources" type="number" value={formData.numberOfResources} onChange={handleInputChange} />
              <Input
  label="PO Upload (File)"
  type="file"
  name="file"
  onChange={handleFileChange}
  accept=".pdf,.doc,.docx"
/>
            </div>

            <Input label="Remark" name="remark" value={formData.remark} onChange={handleInputChange} />
            <Input label = {
              <>
                    Remarks <i>(Indicating with whom it’s being shared e.g. co-worker)</i>

              </>
            } name="sharedWith" value={formData.sharedWith} onChange={handleInputChange} placeholder="Shared with Finance team" />
          </form>
        </Modal>

        {/* View PO Modal */}
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title="Purchase Order Details"
          size="xxl"
          footer={<Button variant="secondary" onClick={() => setIsViewModalOpen(false)}>Cancel</Button>}
        >
          {selectedPO && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">PO Number</p>
                  <p className="text-sm font-mono text-indigo-400">{selectedPO.poNumber}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</p>
                  <p className="text-sm text-gray-900 font-medium">{customerNameById(selectedPO.customerId)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">PO Date</p>
                  <p className="text-sm text-gray-900">{formatters.formatDate(selectedPO.poDate)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">PO Value</p>
                  <p className="text-sm font-bold text-emerald-400">{formatters.formatCurrency(selectedPO.poValue)} {selectedPO.currency}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Start Date</p>
                  <p className="text-sm text-gray-900">{formatters.formatDate(selectedPO.startDate) || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">End Date</p>
                  <p className="text-sm text-gray-900">{formatters.formatDate(selectedPO.endDate) || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment Terms</p>
                  <Badge variant="default">{selectedPO.paymentTermsDays} days</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">No. of Resources</p>
                  <p className="text-sm text-gray-900">{selectedPO.numberOfResources || 0} contractors</p>
                </div>
                {selectedPO.fileUrl && (
                  <div className="space-y-1 md:col-span-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">PO Document</p>
                    <a href={getFileViewUrl(selectedPO.fileUrl)} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-400 hover:underline flex items-center gap-1">
                      <FileText className="w-4 h-4" /> View PO Upload
                    </a>
                  </div>
                )}
                <div className="space-y-1 md:col-span-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Remark</p>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 italic text-sm text-gray-600">
                    {selectedPO.remark || 'No remarks'}
                  </div>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Shared With</p>
                  <p className="text-sm text-gray-600 italic">
                    {selectedPO.sharedWith || 'Not shared'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </motion.div>
    </DashboardLayout>
  )
}

export default POsPage

