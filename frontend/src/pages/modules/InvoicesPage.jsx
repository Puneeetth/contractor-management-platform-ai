import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, Check, Receipt, DollarSign, Clock } from 'lucide-react'
import { DashboardLayout } from '../../components/layout'
import { Card, Button, Table, Badge, Loader } from '../../components/ui'
import { invoiceService } from '../../services/invoiceService'
import { formatters } from '../../utils/formatters'
import { useAuth } from '../../hooks/useAuth'

const InvoicesPage = () => {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [approving, setApproving] = useState(null)

  useEffect(() => { loadInvoices() }, [])

  const loadInvoices = async () => {
    try {
      setIsLoading(true); setError(null)
      const data = await invoiceService.getAllInvoices()
      setInvoices(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err?.error?.message || 'Failed to load invoices')
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
      setError(err?.error?.message || 'Failed to approve invoice')
    } finally {
      setApproving(null)
    }
  }

  const totalAmount = invoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0)
  const approvedAmount = invoices.filter(i => i.status === 'APPROVED').reduce((acc, inv) => acc + (inv.totalAmount || 0), 0)
  const pendingAmount = invoices.filter(i => i.status !== 'APPROVED' && i.status !== 'REJECTED').reduce((acc, inv) => acc + (inv.totalAmount || 0), 0)

  const columns = [
    { 
      key: 'id', label: 'Invoice',
      render: (row) => (
        <div>
          <span className="font-mono text-indigo-400 font-medium">Invoice #{String(row.id).padStart(3, '0')}</span>
          <p className="text-xs text-slate-500 mt-0.5">{row.invoiceMonth}</p>
        </div>
      )
    },
    { key: 'totalHours', label: 'Hours', render: (row) => formatters.formatHours(row.totalHours) },
    { key: 'baseAmount', label: 'Base Amount', render: (row) => formatters.formatCurrency(row.baseAmount) },
    { key: 'taxAmount', label: 'Tax (10%)', render: (row) => <span className="text-slate-400">{formatters.formatCurrency(row.taxAmount)}</span> },
    { key: 'totalAmount', label: 'Total', render: (row) => <span className="font-semibold text-emerald-400">{formatters.formatCurrency(row.totalAmount)}</span> },
    {
      key: 'status', label: 'Status',
      render: (row) => <Badge variant={row.status === 'APPROVED' ? 'approved' : row.status === 'REJECTED' ? 'rejected' : 'pending'}>{row.status}</Badge>,
    },
    {
      key: 'actions', label: 'Actions',
      render: (row) => (
        user?.role === 'FINANCE' && row.status !== 'APPROVED' && row.status !== 'REJECTED' ? (
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
          <h1 className="text-2xl font-bold text-white">Invoices</h1>
          <p className="text-slate-400 mt-1 text-sm">View and manage invoice approvals</p>
        </div>

        {/* Summary Cards - matching pic-2 style */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              { icon: Receipt, label: 'Invoices Total', value: invoices.length, subValue: formatters.formatCurrency(totalAmount), color: 'text-blue-400', bg: 'bg-blue-500/15', borderColor: 'border-blue-500/20' },
              { icon: DollarSign, label: 'Approved Invoices', value: formatters.formatCurrency(approvedAmount), color: 'text-emerald-400', bg: 'bg-emerald-500/15', borderColor: 'border-emerald-500/20' },
              { icon: Clock, label: 'Pending Invoices', value: formatters.formatCurrency(pendingAmount), color: 'text-amber-400', bg: 'bg-amber-500/15', borderColor: 'border-amber-500/20' },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className={`!p-5 border-l-2 ${stat.borderColor}`}>
                  <div className="flex items-center gap-3">
                    <div className={`${stat.bg} p-2.5 rounded-xl`}><stat.icon className={`w-5 h-5 ${stat.color}`} /></div>
                    <div>
                      <p className="text-xs text-slate-500">{stat.label}</p>
                      <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                      {stat.subValue && <p className="text-xs text-slate-500 mt-0.5">{stat.subValue}</p>}
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
              <div className="w-16 h-16 bg-white/[0.03] rounded-2xl flex items-center justify-center mx-auto mb-4"><Receipt className="w-8 h-8 text-slate-600" /></div>
              <p className="text-slate-400 text-lg font-medium">No invoices found</p>
              <p className="text-slate-600 text-sm mt-1">Invoices will appear here once timesheets are processed</p>
            </div>
          ) : (
            <Table columns={columns} data={invoices} isLoading={false} />
          )}
        </Card>
      </motion.div>
    </DashboardLayout>
  )
}

export default InvoicesPage
