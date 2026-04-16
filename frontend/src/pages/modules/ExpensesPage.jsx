import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, AlertCircle, Check, CreditCard, DollarSign, Clock } from 'lucide-react'
import { DashboardLayout } from '../../components/layout'
import { Card, Button, Table, Modal, Input, Badge, Loader } from '../../components/ui'
import { expenseService } from '../../services/expenseService'
import { formatters } from '../../utils/formatters'
import { validators } from '../../utils/validators'
import { useAuth } from '../../hooks/useAuth'

const ExpensesPage = () => {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    proofUrl: '',
  })
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [approving, setApproving] = useState(null)

  useEffect(() => { loadExpenses() }, [])

  const loadExpenses = async () => {
    try {
      setIsLoading(true); setError(null)
      const data = await expenseService.getAllExpenses()
      setExpenses(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err?.error?.message || 'Failed to load expenses')
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!validators.isRequired(formData.amount) || parseFloat(formData.amount) <= 0) newErrors.amount = 'Amount must be greater than 0'
    if (!validators.isRequired(formData.description)) newErrors.description = 'Description is required'
    if (!validators.isRequired(formData.proofUrl)) newErrors.proofUrl = 'Proof URL is required'
    setFormErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || '' : value,
    }))
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setIsSubmitting(true)
    try {
      await expenseService.createExpense(user?.id, formData)
      setIsModalOpen(false)
      setFormData({ amount: '', description: '', proofUrl: '' })
      await loadExpenses()
    } catch (err) {
      setFormErrors({ submit: err?.error?.message || 'Failed to create expense' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApprove = async (id) => {
    try {
      setApproving(id)
      await expenseService.approveExpense(id)
      await loadExpenses()
    } catch (err) {
      setError(err?.error?.message || 'Failed to approve expense')
    } finally {
      setApproving(null)
    }
  }

  const totalExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0)
  const approvedTotal = expenses.filter(e => e.status === 'APPROVED').reduce((acc, e) => acc + (e.amount || 0), 0)
  const pendingTotal = expenses.filter(e => e.status !== 'APPROVED' && e.status !== 'REJECTED').reduce((acc, e) => acc + (e.amount || 0), 0)

  const columns = [
    { key: 'amount', label: 'Amount', render: (row) => <span className="font-semibold text-emerald-400">{formatters.formatCurrency(row.amount)}</span> },
    { key: 'description', label: 'Description', render: (row) => <span className="text-gray-700">{formatters.truncate(row.description, 40)}</span> },
    {
      key: 'proofUrl', label: 'Proof',
      render: (row) => (
        <a href={row.proofUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors">
          View Document
        </a>
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
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
            <p className="text-gray-600 mt-1 text-sm">Submit and manage expense claims</p>
          </div>
          {user?.role === 'CONTRACTOR' && (
            <Button variant="primary" onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Submit Expense
            </Button>
          )}
        </div>

        {/* Finance-style summary cards (pic-3 inspired) */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              { icon: CreditCard, label: 'Total Expenses', value: formatters.formatCurrency(totalExpenses), color: 'text-blue-400', bg: 'bg-blue-100' },
              { icon: DollarSign, label: 'Approved', value: formatters.formatCurrency(approvedTotal), color: 'text-emerald-400', bg: 'bg-emerald-100' },
              { icon: Clock, label: 'Pending', value: formatters.formatCurrency(pendingTotal), color: 'text-amber-400', bg: 'bg-amber-100' },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className="!p-4">
                  <div className="flex items-center gap-3">
                    <div className={`${stat.bg} p-2.5 rounded-xl`}><stat.icon className={`w-5 h-5 ${stat.color}`} /></div>
                    <div><p className="text-xs text-gray-500">{stat.label}</p><p className="text-xl font-bold text-gray-900">{stat.value}</p></div>
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
            <div className="py-12 flex justify-center"><Loader message="Loading expenses..." /></div>
          ) : expenses.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><CreditCard className="w-8 h-8 text-gray-500" /></div>
              <p className="text-gray-600 text-lg font-medium">No expenses found</p>
              <p className="text-gray-500 text-sm mt-1">Submit your first expense</p>
            </div>
          ) : (
            <Table columns={columns} data={expenses} isLoading={false} />
          )}
        </Card>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Submit Expense" size="md"
          footer={<><Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button variant="primary" isLoading={isSubmitting} onClick={handleSubmit}>Submit</Button></>}>
          <form className="space-y-4">
            {formErrors.submit && <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20"><p className="text-sm text-red-400">{formErrors.submit}</p></div>}
            <Input label="Amount ($)" name="amount" type="number" step="0.01" value={formData.amount} onChange={handleInputChange} error={formErrors.amount} placeholder="0.00" required />
            <Input label="Description" name="description" value={formData.description} onChange={handleInputChange} error={formErrors.description} placeholder="What is this expense for?" required />
            <Input label="Proof Document URL" name="proofUrl" type="url" value={formData.proofUrl} onChange={handleInputChange} error={formErrors.proofUrl} placeholder="https://example.com/receipt.pdf" required />
          </form>
        </Modal>
      </motion.div>
    </DashboardLayout>
  )
}

export default ExpensesPage

