import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, Check, Download } from 'lucide-react'
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

  useEffect(() => {
    loadInvoices()
  }, [])

  const loadInvoices = async () => {
    try {
      setIsLoading(true)
      setError(null)
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

  const columns = [
    { 
      key: 'invoiceMonth', 
      label: 'Month',
      render: (row) => row.invoiceMonth
    },
    {
      key: 'totalHours',
      label: 'Hours',
      render: (row) => formatters.formatHours(row.totalHours)
    },
    {
      key: 'baseAmount',
      label: 'Base Amount',
      render: (row) => formatters.formatCurrency(row.baseAmount)
    },
    {
      key: 'taxAmount',
      label: 'Tax (10%)',
      render: (row) => formatters.formatCurrency(row.taxAmount)
    },
    {
      key: 'totalAmount',
      label: 'Total',
      render: (row) => <span className="font-semibold">{formatters.formatCurrency(row.totalAmount)}</span>
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'APPROVED' ? 'approved' : row.status === 'REJECTED' ? 'rejected' : 'pending'}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        user?.role === 'FINANCE' && row.status === 'PENDING' ? (
          <Button 
            variant="primary" 
            size="sm" 
            isLoading={approving === row.id}
            onClick={() => handleApprove(row.id)}
            className="flex items-center gap-1"
          >
            <Check className="w-4 h-4" /> Approve
          </Button>
        ) : null
      ),
    },
  ]

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-1">View and manage invoice approvals</p>
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
              <Loader message="Loading invoices..." />
            </div>
          ) : invoices.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500 text-lg">No invoices found</p>
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
