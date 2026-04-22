import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, Plus } from 'lucide-react'
import { DashboardLayout } from '../../components/layout'
import { Card, Button, Table, Loader, Modal, Input, Badge } from '../../components/ui'
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
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  const [rateError, setRateError] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [canEditTax, setCanEditTax] = useState(false)

  const [formData, setFormData] = useState({
    contractorId: user?.id || '',
    invoiceMonth: new Date().toISOString().slice(0, 7),
    totalHours: '',
    rate: '',
    taxPercentage: '18',
    invoiceFile: null,
    timesheetFile: null,
  })

  useEffect(() => {
    if (user?.id) loadInvoices()
  }, [user?.id, user?.role])

  useEffect(() => {
    if (user?.id) {
      setFormData(prev => ({ ...prev, contractorId: user.id }))
    }
  }, [user?.id])

  useEffect(() => {
    const loadRate = async () => {
      if (!user?.id || user?.role !== 'CONTRACTOR') return
      try {
        setRateError('')
        const rate = await invoiceService.getContractorRate(user.id)
        setFormData(prev => ({ ...prev, rate: rate ?? '' }))
      } catch (err) {
        setRateError('Unable to fetch rate. Ensure backend is updated.')
      }
    }
    loadRate()
  }, [user?.id, user?.role])

  const loadInvoices = async () => {
    try {
      setIsLoading(true)
      setError(null)
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
    } finally {
      setApproving(null)
    }
  }

  const handleAdminApprove = async (id) => {
    try {
      setApproving(`admin-${id}`)
      await invoiceService.approveInvoiceByAdmin(id)
      await loadInvoices()
    } finally {
      setApproving(null)
    }
  }

  const handleFinanceApprove = async (id) => {
    try {
      setApproving(`finance-${id}`)
      await invoiceService.approveInvoiceByFinance(id)
      await loadInvoices()
    } finally {
      setApproving(null)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, files } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const newErrors = {}

    if (!formData.totalHours || Number(formData.totalHours) <= 0)
      newErrors.totalHours = 'Total hours must be > 0'

    if (!formData.taxPercentage || Number(formData.taxPercentage) < 0)
      newErrors.taxPercentage = 'Invalid tax'

    if (!formData.invoiceFile) newErrors.invoiceFile = 'Invoice required'
    if (!formData.timesheetFile) newErrors.timesheetFile = 'Timesheet required'

    setFormErrors(newErrors)
    if (Object.keys(newErrors).length) return

    setIsSubmitting(true)

    try {
      await invoiceService.createInvoice({
        contractorId: formData.contractorId,
        invoiceMonth: formData.invoiceMonth,
        totalHours: Number(formData.totalHours),
        taxPercentage: Number(formData.taxPercentage),
        invoiceFile: formData.invoiceFile,
        timesheetFile: formData.timesheetFile,
      })

      setIsModalOpen(false)

      setFormData({
        contractorId: user?.id || '',
        invoiceMonth: new Date().toISOString().slice(0, 7),
        totalHours: '',
        rate: formData.rate,
        taxPercentage: '18',
        invoiceFile: null,
        timesheetFile: null,
      })
      setCanEditTax(false)

      await loadInvoices()
    } catch (err) {
      setFormErrors({ submit: err?.message || 'Failed to create invoice' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const baseAmount = (Number(formData.totalHours) || 0) * (Number(formData.rate) || 0)
  const taxAmount = baseAmount * ((Number(formData.taxPercentage) || 0) / 100)
  const totalAmount = baseAmount + taxAmount
  const canViewInvoiceDetails =
    user?.role === 'ADMIN' || user?.role === 'FINANCE' || user?.role === 'CONTRACTOR'

  const preparedInvoices = invoices.map((invoice) => {
    const resolvedHours = Number(invoice.totalHoursForCalc ?? invoice.hoursRate ?? 0)
    return {
      ...invoice,
      billRate: Number(invoice.billRate ?? 0),
      payRate: Number(invoice.payRate ?? 0),
      hoursRate: Number(invoice.hoursRate ?? resolvedHours),
      totalHoursForCalc: resolvedHours,
      tax: Number(invoice.tax ?? 0),
      totalAmount: Number(invoice.totalAmount ?? invoice.amount ?? 0),
    }
  })

  const filteredInvoices = monthFilter
    ? preparedInvoices.filter((invoice) => invoice.invoiceMonth === monthFilter)
    : preparedInvoices

  const getFileViewUrl = (fileUrl) => {
    if (!fileUrl) return ''
    if (/^https?:\/\//i.test(fileUrl)) return fileUrl

    const normalizedPath = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`
    return `${API_ORIGIN}${normalizedPath}`
  }

  const openInvoiceDetails = (invoice) => {
    setSelectedInvoice(invoice)
    setIsDetailsModalOpen(true)
  }

  const columns = [
    {
      key: 'contractorName',
      label: 'Contractor Name',
      render: (row) => <span className="font-medium text-gray-900">{row.contractorName || '-'}</span>,
    },
    {
      key: 'invoiceMonth',
      label: 'Month (YYYY-MM)',
      render: (row) => <span>{row.invoiceMonth || '-'}</span>,
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => <span className="font-semibold text-emerald-400">{formatters.formatCurrency(row.totalAmount)}</span>,
    },
    {
      key: 'adminApprovalStatus',
      label: 'Admin Approval',
      render: (row) => {
        const status = row.adminApprovalStatus || 'PENDING'
        const variant = status === 'APPROVED' ? 'approved' : status === 'REJECTED' ? 'rejected' : 'pending'
        return <Badge variant={variant}>{status}</Badge>
      },
    },
    {
      key: 'financeApprovalStatus',
      label: 'Finance Approval',
      render: (row) => {
        const status = row.financeApprovalStatus || 'PENDING'
        const variant = status === 'APPROVED' ? 'approved' : status === 'REJECTED' ? 'rejected' : 'pending'
        return <Badge variant={variant}>{status}</Badge>
      },
    },
    {
      key: 'approvalActions',
      label: 'Approval Actions',
      render: (row) => {
        const isAdmin = user?.role === 'ADMIN'
        const isFinance = user?.role === 'FINANCE'
        const canAdminApprove = isAdmin && row.adminApprovalStatus !== 'APPROVED'
        const canFinanceApprove = isFinance && row.financeApprovalStatus !== 'APPROVED'

        if (!canAdminApprove && !canFinanceApprove) return null

        return (
          <div className="flex items-center gap-2">
            {canAdminApprove && (
              <Button
                variant="success"
                size="sm"
                isLoading={approving === `admin-${row.id}`}
                onClick={() => handleAdminApprove(row.id)}
                className="flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" /> Approve (Admin)
              </Button>
            )}
            {canFinanceApprove && (
              <Button
                variant="success"
                size="sm"
                isLoading={approving === `finance-${row.id}`}
                onClick={() => handleFinanceApprove(row.id)}
                className="flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" /> Approve (Finance)
              </Button>
            )}
          </div>
        )
      },
    },
    {
      key: 'billAttachment',
      label: 'invoice',
      render: (row) => {
        if (canViewInvoiceDetails) {
          return (
            <button
              type="button"
              onClick={() => openInvoiceDetails(row)}
              className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
            >
              View Invoice
            </button>
          )
        }

        return row.invoiceFileUrl ? (
            <a
              href={getFileViewUrl(row.invoiceFileUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
            >
              View Invoice
            </a>
        ) : (
          <span className="text-gray-500 text-sm">N/A</span>
        )
      },
    },
    {
      key: 'payAttachment',
      label: 'timesheet',
      render: (row) => (
        row.timesheetFileUrl ? (
          <a
            href={getFileViewUrl(row.timesheetFileUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
          >
            View Timesheet
          </a>
        ) : (
          <span className="text-gray-500 text-sm">N/A</span>
        )
      ),
    },
  ].filter((column) => {
    if (user?.role !== 'CONTRACTOR') return true
    return column.key !== 'contractorName' && column.key !== 'approvalActions'
  })

  return (
    <DashboardLayout>
      <div className="flex justify-between mb-6">
        <h1 className="text-xl font-bold">Invoices</h1>
        {user?.role === 'CONTRACTOR' && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus /> Create Invoice
          </Button>
        )}
      </div>

      <div className="mb-4 max-w-xs">
        <Input
          label="Filter by Month"
          type="month"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
        />
      </div>

      <Card>
        {isLoading ? <Loader /> : <Table columns={columns} data={filteredInvoices} />}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Invoice"
        size="xxl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Month"
              type="month"
              name="invoiceMonth"
              value={formData.invoiceMonth}
              onChange={handleInputChange}
            />
            <Input
              label="Total Hours"
              name="totalHours"
              type="number"
              value={formData.totalHours}
              onChange={handleInputChange}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Base Amount" value={baseAmount.toFixed(2)} readOnly />
            <Input label="Total Amount" value={totalAmount.toFixed(2)} readOnly />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={canEditTax}
                  onChange={(e) => {
                    const allowed = e.target.checked
                    setCanEditTax(allowed)
                    if (!allowed) {
                      setFormData((prev) => ({ ...prev, taxPercentage: '18' }))
                    }
                  }}
                />
                Allow tax change (default 18%)
              </label>
              <Input
                label="Tax (%)"
                name="taxPercentage"
                type="number"
                value={formData.taxPercentage}
                onChange={handleInputChange}
                disabled={!canEditTax}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Invoice File"
              type="file"
              name="invoiceFile"
              onChange={handleInputChange}
            />
            <Input
              label="Timesheet File"
              type="file"
              name="timesheetFile"
              onChange={handleInputChange}
            />
          </div>

          <Button type="submit" isLoading={isSubmitting}>
            Submit
          </Button>
        </form>
      </Modal>

      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false)
          setSelectedInvoice(null)
        }}
        title="Invoice Details"
        size="xxl"
        titleClassName="text-[34px] leading-tight font-semibold text-gray-900"
      >
        {selectedInvoice && (
          <div
            className="space-y-6 p-2 text-[16px] text-gray-700"
            style={{ fontFamily: 'Inter, Roboto, "Open Sans", "Segoe UI", sans-serif' }}
          >
            <h2 className="text-[26px] leading-tight font-semibold text-gray-900">Billing Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-[14px] font-semibold text-gray-500 uppercase tracking-wider">billRate</p>
                <p className="text-[16px] font-semibold text-gray-900">{formatters.formatCurrency(selectedInvoice.billRate)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[14px] font-semibold text-gray-500 uppercase tracking-wider">payRate</p>
                <p className="text-[16px] font-semibold text-gray-900">{formatters.formatCurrency(selectedInvoice.payRate)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[14px] font-semibold text-gray-500 uppercase tracking-wider">hoursRate</p>
                <p className="text-[16px] font-semibold text-gray-900">{Number(selectedInvoice.hoursRate || 0).toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[14px] font-semibold text-gray-500 uppercase tracking-wider">totalHoursForCalc</p>
                <p className="text-[16px] font-semibold text-gray-900">{Number(selectedInvoice.totalHoursForCalc || 0).toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[14px] font-semibold text-gray-500 uppercase tracking-wider">totalAmount</p>
                <p className="text-[16px] font-semibold text-gray-900">{formatters.formatCurrency(selectedInvoice.totalAmount)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[14px] font-semibold text-gray-500 uppercase tracking-wider">tax</p>
                <p className="text-[16px] font-semibold text-gray-900">{formatters.formatCurrency(selectedInvoice.tax)}</p>
              </div>
            </div>
            <h3 className="text-[21px] leading-tight font-semibold text-gray-900">Attachments</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1 md:col-span-2">
                <p className="text-[14px] font-semibold text-gray-500 uppercase tracking-wider">view invoice</p>
                {selectedInvoice.invoiceFileUrl ? (
                  <a
                    href={getFileViewUrl(selectedInvoice.invoiceFileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[16px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Open PDF
                  </a>
                ) : (
                  <p className="text-[16px] font-semibold text-gray-500">N/A</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  )
}

export default InvoicesPage
