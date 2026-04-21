import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, Check, Receipt, DollarSign, Clock, Plus, FileText } from 'lucide-react'
import { DashboardLayout } from '../../components/layout'
import { Card, Button, Table, Badge, Loader, Modal, Input } from '../../components/ui'
import { invoiceService } from '../../services/invoiceService'
import { API_ORIGIN } from '../../services/apiClient'
import { formatters } from '../../utils/formatters'
import { useAuth } from '../../hooks/useAuth'

const InvoicesPage = () => {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [approving, setApproving] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  const [formData, setFormData] = useState({
    contractorId: user?.id || '',
    invoiceMonth: new Date().toISOString().slice(0, 7),
    amount: '',
    invoiceFile: null,
    timesheetFile: null,
  })

  useEffect(() => {
    if (user?.id) {
      loadInvoices()
    }
  }, [user?.id, user?.role])

  useEffect(() => {
    if (user?.id) {
      setFormData(prev => ({ ...prev, contractorId: user.id }))
    }
  }, [user?.id])

  const loadInvoices = async () => {
    try {
      setIsLoading(true); setError(null)
      const data = user?.role === 'CONTRACTOR'
        ? await invoiceService.getInvoicesByContractor(user.id)
        : await invoiceService.getAllInvoices()
      setInvoices(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err?.message || 'Failed to load invoices')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (id) => {
    try {
      setApproving(id)
      await invoiceService.approveInvoice(id)
      await loadInvoices()
    } catch (err) {
      setError(err?.message || 'Failed to approve invoice')
    } finally {
      setApproving(null)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, files } = e.target
    const newValue = files ? files[0] : value
    setFormData(prev => ({ ...prev, [name]: newValue }))
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const newErrors = {}
    if (!formData.contractorId) newErrors.contractorId = 'Contractor is required'
    if (!formData.invoiceMonth) newErrors.invoiceMonth = 'Month is required'
    if (!formData.amount || Number(formData.amount) <= 0) newErrors.amount = 'Amount must be greater than 0'
    if (!formData.invoiceFile) newErrors.invoiceFile = 'Invoice file is required'
    if (!formData.timesheetFile) newErrors.timesheetFile = 'Timesheet file is required'

    setFormErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setIsSubmitting(true)
    try {
      await invoiceService.createInvoice({
        contractorId: formData.contractorId,
        invoiceMonth: formData.invoiceMonth,
        amount: Number(formData.amount),
        invoiceFile: formData.invoiceFile,
        timesheetFile: formData.timesheetFile,
      })
      setIsModalOpen(false)
      setFormData({
        contractorId: user?.id || '',
        invoiceMonth: new Date().toISOString().slice(0, 7),
        amount: '',
        invoiceFile: null,
        timesheetFile: null,
      })
      await loadInvoices()
    } catch (err) {
      setFormErrors(prev => ({ ...prev, submit: err?.message || 'Failed to create invoice' }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const resolveFileUrl = (path) => {
    if (!path) return null
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    return `${API_ORIGIN}${path}`
  }

  const totalAmount = invoices.reduce((acc, inv) => acc + (inv.amount || 0), 0)
  const approvedAmount = invoices.filter(i => i.status === 'APPROVED').reduce((acc, inv) => acc + (inv.amount || 0), 0)
  const pendingAmount = invoices.filter(i => i.status !== 'APPROVED' && i.status !== 'REJECTED').reduce((acc, inv) => acc + (inv.amount || 0), 0)

  const columns = [
    { 
      key: 'id', label: 'Invoice',
      render: (row) => (
        <div>
          <span className="font-mono text-indigo-400 font-medium">Invoice #{String(row.id).padStart(3, '0')}</span>
          <p className="text-xs text-gray-500 mt-0.5">{row.invoiceMonth}</p>
        </div>
      )
    },
    { key: 'contractorName', label: 'Contractor', render: (row) => <span className="text-gray-700 font-medium">{row.contractorName || '-'}</span> },
    { key: 'amount', label: 'Amount', render: (row) => <span className="font-semibold text-emerald-400">{formatters.formatCurrency(row.amount)}</span> },
    {
      key: 'files', label: 'Attachments',
      render: (row) => (
        <div className="flex flex-col gap-1 text-xs">
          {row.invoiceFileUrl && (
            <a href={resolveFileUrl(row.invoiceFileUrl)} target="_blank" rel="noreferrer" className="text-indigo-500 hover:text-indigo-600 inline-flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Invoice File
            </a>
          )}
          {row.timesheetFileUrl && (
            <a href={resolveFileUrl(row.timesheetFileUrl)} target="_blank" rel="noreferrer" className="text-indigo-500 hover:text-indigo-600 inline-flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Timesheet File
            </a>
          )}
          {!row.invoiceFileUrl && !row.timesheetFileUrl && <span className="text-gray-500">No files</span>}
        </div>
      ),
    },
    {
      key: 'status', label: 'Status',
      render: (row) => <Badge variant={row.status === 'APPROVED' ? 'approved' : row.status === 'REJECTED' ? 'rejected' : 'pending'}>{row.status}</Badge>,
    },
    {
      key: 'actions', label: 'Actions',
      render: (row) => (
        (user?.role === 'FINANCE' || user?.role === 'ADMIN') && row.status !== 'APPROVED' && row.status !== 'REJECTED' ? (
          <Button variant="success" size="sm" isLoading={approving === row.id} onClick={() => handleApprove(row.id)} className="flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Approve
          </Button>
        ) : null
      ),
    },
  ]

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
              <p className="text-gray-600 mt-1 text-sm">Manage invoices with attached timesheets</p>
            </div>
            {user?.role === 'CONTRACTOR' && (
              <Button variant="primary" onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
                <Plus className="w-4 h-4" /> Create Invoice
              </Button>
            )}
          </div>
        </div>

        {/* Summary Cards - matching pic-2 style */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              { icon: Receipt, label: 'Invoices Total', value: invoices.length, subValue: formatters.formatCurrency(totalAmount), color: 'text-blue-400', bg: 'bg-blue-100', borderColor: 'border-blue-500/20' },
              { icon: DollarSign, label: 'Approved Invoices', value: formatters.formatCurrency(approvedAmount), color: 'text-emerald-400', bg: 'bg-emerald-100', borderColor: 'border-emerald-500/20' },
              { icon: Clock, label: 'Pending Invoices', value: formatters.formatCurrency(pendingAmount), color: 'text-amber-400', bg: 'bg-amber-100', borderColor: 'border-amber-500/20' },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className={`!p-5 border-l-2 ${stat.borderColor}`}>
                  <div className="flex items-center gap-3">
                    <div className={`${stat.bg} p-2.5 rounded-xl`}><stat.icon className={`w-5 h-5 ${stat.color}`} /></div>
                    <div>
                      <p className="text-xs text-gray-500">{stat.label}</p>
                      <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                      {stat.subValue && <p className="text-xs text-gray-500 mt-0.5">{stat.subValue}</p>}
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
            <div className="py-12 flex justify-center"><Loader message="Loading invoices..." /></div>
          ) : invoices.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Receipt className="w-8 h-8 text-gray-500" /></div>
              <p className="text-gray-600 text-lg font-medium">No invoices found</p>
              <p className="text-gray-500 text-sm mt-1">Create your first invoice to get started</p>
            </div>
          ) : (
            <Table columns={columns} data={invoices} isLoading={false} />
          )}
        </Card>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create Invoice"
          size="lg"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button variant="primary" isLoading={isSubmitting} onClick={handleSubmit}>Create</Button>
            </>
          }
        >
          <form className="space-y-4">
            {formErrors.submit && <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20"><p className="text-sm text-red-400">{formErrors.submit}</p></div>}
            <Input label="Month" name="invoiceMonth" type="month" value={formData.invoiceMonth} onChange={handleInputChange} error={formErrors.invoiceMonth} required />
            <Input label="Amount" name="amount" type="number" min="0" step="0.01" value={formData.amount} onChange={handleInputChange} error={formErrors.amount} required />
            <Input label="Invoice File (PDF)" name="invoiceFile" type="file" accept="application/pdf" onChange={handleInputChange} error={formErrors.invoiceFile} required />
            <Input label="Timesheet File (PDF)" name="timesheetFile" type="file" accept="application/pdf" onChange={handleInputChange} error={formErrors.timesheetFile} required />
          </form>
        </Modal>
      </motion.div>
    </DashboardLayout>
  )
}

export default InvoicesPage

