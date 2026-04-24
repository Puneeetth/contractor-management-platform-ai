import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, Plus, X } from 'lucide-react'
import { DashboardLayout } from '../../components/layout'
import { Card, Button, Table, Loader, Modal, Input, Badge, Textarea, Select } from '../../components/ui'
import { invoiceService } from '../../services/invoiceService'
import { contractService } from '../../services/contractorService'
import { bankDetailsService } from '../../services/bankDetailsService'
import { API_ORIGIN } from '../../services/apiClient'
import { formatters } from '../../utils/formatters'
import { useAuth } from '../../hooks/useAuth'

const InvoicesPage = () => {
  const { user } = useAuth()

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [approving, setApproving] = useState(null)
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false)
  const [approveTarget, setApproveTarget] = useState({ id: null, role: '' })
  const [rejecting, setRejecting] = useState(null)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [rejectTarget, setRejectTarget] = useState({ id: null, role: '' })
  const [rejectReason, setRejectReason] = useState('')
  const [rejectError, setRejectError] = useState('')
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false)
  const [reasonModalLines, setReasonModalLines] = useState([])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [isEditingInvoiceDetails, setIsEditingInvoiceDetails] = useState(false)
  const [invoiceDetailsForm, setInvoiceDetailsForm] = useState({
    billRate: '',
    payRate: '',
    hoursRate: '',
    totalHoursForCalc: '',
    totalAmount: '',
    tax: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  const [rateError, setRateError] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [canEditTax, setCanEditTax] = useState(false)
  const [contracts, setContracts] = useState([])
  const [selectedContract, setSelectedContract] = useState('')
  const [contractsLoading, setContractsLoading] = useState(false)
  const [contractsError, setContractsError] = useState('')

  const [bankDetails, setBankDetails] = useState({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscSwift: '',
    upiId: '',
  })
  const [bankDetailsLoading, setBankDetailsLoading] = useState(false)

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

  // Load contracts when modal opens
  useEffect(() => {
    const loadContracts = async () => {
      if (!isModalOpen || !user?.id || user?.role !== 'CONTRACTOR') return
      try {
        setContractsLoading(true)
        setContractsError('')
        const data = await contractService.getContractsByContractor(user.id)
        // Filter for active contracts only
        const activeContracts = Array.isArray(data) 
          ? data.filter(contract => contract.status === 'ACTIVE' || contract.status === 'active')
          : []
        setContracts(activeContracts)
        if (activeContracts.length === 0) {
          setContractsError('No active contracts found. Please create a contract first.')
        }
      } catch (err) {
        console.error('Failed to load contracts:', err)
        setContracts([])
        setContractsError('Failed to load contracts. Please try again.')
      } finally {
        setContractsLoading(false)
      }
    }
    loadContracts()
  }, [isModalOpen, user?.id, user?.role])

  // Load bank details when modal opens
  useEffect(() => {
    const loadBankDetails = async () => {
      if (!isModalOpen || user?.role !== 'CONTRACTOR') return
      try {
        setBankDetailsLoading(true)
        const data = await bankDetailsService.getMyBankDetails()
        const bd = data?.data || data || {}
        setBankDetails({
          accountHolderName: bd.accountHolderName || '',
          bankName: bd.bankName || '',
          accountNumber: bd.accountNumber || '',
          ifscSwift: bd.ifscSwift || '',
          upiId: bd.upiId || '',
        })
      } catch (err) {
        // non-critical — leave blank
      } finally {
        setBankDetailsLoading(false)
      }
    }
    loadBankDetails()
  }, [isModalOpen, user?.role])

  // Auto-fill rate when contract is selected
  useEffect(() => {
    if (selectedContract && contracts.length > 0) {
      const selected = contracts.find(c => String(c.id) === String(selectedContract))
      if (selected) {
        const contractRate = selected.payRate ?? selected.billRate ?? 0
        setFormData(prev => ({
          ...prev,
          rate: contractRate ? String(contractRate) : ''
        }))
      }
    }
  }, [selectedContract, contracts])

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

  const openApproveModal = (id, role) => {
    setApproveTarget({ id, role })
    setIsApproveModalOpen(true)
  }

  const handleConfirmApprove = async () => {
    if (!approveTarget.id || !approveTarget.role) return

    try {
      setApproving(`${approveTarget.role}-${approveTarget.id}`)
      if (approveTarget.role === 'admin') {
        await invoiceService.approveInvoiceByAdmin(approveTarget.id)
      } else {
        await invoiceService.approveInvoiceByFinance(approveTarget.id)
      }
      setIsApproveModalOpen(false)
      setApproveTarget({ id: null, role: '' })
      await loadInvoices()
    } finally {
      setApproving(null)
    }
  }

  const openRejectModal = (id, role) => {
    setRejectTarget({ id, role })
    setRejectReason('')
    setRejectError('')
    setIsRejectModalOpen(true)
  }

  const handleReject = async () => {
    if (!rejectTarget.id || !rejectTarget.role) return

    if (!rejectReason.trim()) {
      setRejectError('Rejection reason is required')
      return
    }

    try {
      setRejecting(`${rejectTarget.role}-${rejectTarget.id}`)
      if (rejectTarget.role === 'admin') {
        await invoiceService.rejectInvoiceByAdmin(rejectTarget.id, rejectReason.trim())
      } else {
        await invoiceService.rejectInvoiceByFinance(rejectTarget.id, rejectReason.trim())
      }

      setIsRejectModalOpen(false)
      setRejectTarget({ id: null, role: '' })
      setRejectReason('')
      setRejectError('')
      await loadInvoices()
    } finally {
      setRejecting(null)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, files } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }))
  }

  const handleBankDetailsChange = (e) => {
    const { name, value } = e.target
    setBankDetails(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const newErrors = {}

    const existingMonthInvoice = invoices.find(
      (invoice) => String(invoice.invoiceMonth || '') === String(formData.invoiceMonth || '')
    )
    const existingMonthStatus = String(existingMonthInvoice?.status || '').toUpperCase()

    if (!formData.totalHours || Number(formData.totalHours) <= 0)
      newErrors.totalHours = 'Total hours must be > 0'

    if (!formData.rate || Number(formData.rate) <= 0)
      newErrors.rate = 'Rate must be > 0'

    if (!formData.taxPercentage || Number(formData.taxPercentage) < 0)
      newErrors.taxPercentage = 'Invalid tax'

    if (!formData.invoiceFile) newErrors.invoiceFile = 'Invoice required'
    if (!formData.timesheetFile) newErrors.timesheetFile = 'Timesheet required'

    if (existingMonthInvoice && existingMonthStatus !== 'REJECTED') {
      newErrors.invoiceMonth = `Invoice for ${formData.invoiceMonth} already exists (${existingMonthStatus || 'PENDING'}).`
    }

    setFormErrors(newErrors)
    if (Object.keys(newErrors).length) return

    setIsSubmitting(true)

    try {
      // Save bank details silently (upsert) so they persist for next invoice
      if (user?.role === 'CONTRACTOR') {
        try {
          await bankDetailsService.saveMyBankDetails(bankDetails)
        } catch {
          // non-critical
        }
      }

      await invoiceService.createInvoice({
        contractorId: formData.contractorId,
        invoiceMonth: formData.invoiceMonth,
        totalHours: Number(formData.totalHours),
        rate: Number(formData.rate),
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

  const getRejectionReasons = (invoice) => {
    const adminReason =
      invoice.adminRejectionReason ||
      invoice.adminRejectReason ||
      invoice.adminRejectionRemark ||
      invoice.adminRejectionRemarks ||
      ''
    const financeReason =
      invoice.financeRejectionReason ||
      invoice.financeRejectReason ||
      invoice.financeRejectionRemark ||
      invoice.financeRejectionRemarks ||
      ''

    const reasons = []
    if (adminReason) reasons.push(`Admin: ${adminReason}`)
    if (financeReason) reasons.push(`Finance: ${financeReason}`)
    return reasons
  }

  const getRejectionSummary = (invoice) => {
    const reasons = getRejectionReasons(invoice)
    if (reasons.length === 0) return null

    const fullText = reasons.join(' | ')
    const previewText = fullText.length > 90 ? `${fullText.slice(0, 90)}...` : fullText

    return {
      fullText,
      previewText,
    }
  }

  const openReasonModal = (invoice) => {
    const reasons = getRejectionReasons(invoice)
    if (reasons.length === 0) return
    setReasonModalLines(reasons)
    setIsReasonModalOpen(true)
  }

  const getFileViewUrl = (fileUrl) => {
    if (!fileUrl) return ''
    if (/^https?:\/\//i.test(fileUrl)) return fileUrl

    const normalizedPath = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`
    return `${API_ORIGIN}${normalizedPath}`
  }

  const openInvoiceDetails = (invoice) => {
    setSelectedInvoice(invoice)
    setInvoiceDetailsForm({
      billRate: Number(invoice.billRate ?? 0),
      payRate: Number(invoice.payRate ?? 0),
      hoursRate: Number(invoice.hoursRate ?? 0),
      totalHoursForCalc: Number(invoice.totalHoursForCalc ?? 0),
      totalAmount: Number(invoice.totalAmount ?? 0),
      tax: Number(invoice.tax ?? 0),
    })
    setIsEditingInvoiceDetails(false)
    setIsDetailsModalOpen(true)
  }

  const handleInvoiceDetailChange = (event) => {
    const { name, value } = event.target
    setInvoiceDetailsForm((prev) => ({ ...prev, [name]: value === '' ? '' : Number(value) }))
  }

  const handleSaveInvoiceDetails = () => {
    if (!selectedInvoice) return

    const updatedInvoice = {
      ...selectedInvoice,
      ...invoiceDetailsForm,
    }

    setSelectedInvoice(updatedInvoice)
    setInvoices((prev) => prev.map((invoice) => (invoice.id === updatedInvoice.id ? { ...invoice, ...invoiceDetailsForm } : invoice)))
    setIsEditingInvoiceDetails(false)
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
      key: 'billAttachment',
      label: 'Invoice',
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
      label: 'Timesheet',
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
    {
      key: 'approvalActions',
      label: 'Approval Actions',
      render: (row) => {
        const isAdmin = user?.role === 'ADMIN'
        const isFinance = user?.role === 'FINANCE'
        const canAdminAction = isAdmin && !['APPROVED', 'REJECTED'].includes(row.adminApprovalStatus)
        const canFinanceAction = isFinance && !['APPROVED', 'REJECTED'].includes(row.financeApprovalStatus)

        if (!canAdminAction && !canFinanceAction) return null

        return (
          <div className="flex items-center gap-2">
            {canAdminAction && (
              <>
                <Button
                  variant="success"
                  size="sm"
                  isLoading={approving === `admin-${row.id}`}
                  onClick={() => openApproveModal(row.id, 'admin')}
                  className="flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Approve
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  isLoading={rejecting === `admin-${row.id}`}
                  onClick={() => openRejectModal(row.id, 'admin')}
                  className="flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Reject
                </Button>
              </>
            )}
            {canFinanceAction && (
              <>
                <Button
                  variant="success"
                  size="sm"
                  isLoading={approving === `finance-${row.id}`}
                  onClick={() => openApproveModal(row.id, 'finance')}
                  className="flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Approve
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  isLoading={rejecting === `finance-${row.id}`}
                  onClick={() => openRejectModal(row.id, 'finance')}
                  className="flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Reject
                </Button>
              </>
            )}
          </div>
        )
      },
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
      key: 'rejectionReason',
      label: 'Rejection Reason',
      render: (row) => {
        const summary = getRejectionSummary(row)
        if (!summary) return <span className="text-gray-500 text-sm">-</span>

        return (
          <button
            type="button"
            onClick={() => openReasonModal(row)}
            className="text-sm font-medium text-red-700 hover:text-red-800 hover:underline"
          >
            View Reason
          </button>
        )
      },
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
          {/* Select Contract */}
          <div className="space-y-1">
            <Select
              label="Select Contract"
              placeholder={contractsLoading ? "Loading contracts..." : "Choose an active contract"}
              options={contracts.map(contract => ({
                value: contract.id,
                label: `${contract.customerName ? `${contract.customerName} - ` : ''}${contract.poAllocation || `Contract #${contract.id}`}`
              }))}
              value={selectedContract}
              onChange={(e) => setSelectedContract(e.target.value)}
              disabled={contractsLoading}
              error={contractsError}
            />
            {contractsError && !contractsLoading && (
              <p className="text-xs text-red-500 mt-1">{contractsError}</p>
            )}
          </div>

          {/* Row 1: Month & Total Hours */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Month"
              type="month"
              name="invoiceMonth"
              value={formData.invoiceMonth}
              onChange={handleInputChange}
              error={formErrors.invoiceMonth}
            />
            <Input
              label="Total Hours"
              name="totalHours"
              type="number"
              placeholder="0"
              value={formData.totalHours}
              onChange={handleInputChange}
              error={formErrors.totalHours}
            />
          </div>

          {/* Row 2: Rate & Base Amount */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Rate (per hour)"
              name="rate"
              type="number"
              placeholder="Select a contract"
              step="0.01"
              value={formData.rate}
              onChange={handleInputChange}
              error={formErrors.rate}
              readOnly
            />
            <div>
              <Input
                label="Base Amount"
                value={baseAmount.toFixed(2)}
                readOnly
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">Auto-calculated: Total Hours × Rate</p>
            </div>
          </div>

          {/* Row 3: Tax % & Total Amount */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Input
                label="Tax (%)"
                name="taxPercentage"
                type="number"
                placeholder="18"
                value={formData.taxPercentage}
                onChange={handleInputChange}
                disabled={!canEditTax}
                error={formErrors.taxPercentage}
              />
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
            </div>
            <div>
              <Input
                label="Total Amount"
                value={totalAmount.toFixed(2)}
                readOnly
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">Auto-calculated: Base Amount + Tax</p>
            </div>
          </div>

          {/* Payment Details */}
          <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-indigo-700 uppercase tracking-wide">Payment Details</h3>
              {bankDetailsLoading && <span className="text-xs text-gray-400">Loading…</span>}
            </div>
            <p className="text-xs text-gray-500">Auto-filled from your saved bank details. Edit below to update before submitting.</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Input
                label="Account Holder Name"
                name="accountHolderName"
                placeholder="Full name on account"
                value={bankDetails.accountHolderName}
                onChange={handleBankDetailsChange}
              />
              <Input
                label="Bank Name"
                name="bankName"
                placeholder="e.g. HDFC Bank"
                value={bankDetails.bankName}
                onChange={handleBankDetailsChange}
              />
              <Input
                label="Account Number"
                name="accountNumber"
                placeholder="Bank account number"
                value={bankDetails.accountNumber}
                onChange={handleBankDetailsChange}
              />
              <Input
                label="IFSC / SWIFT Code"
                name="ifscSwift"
                placeholder="e.g. HDFC0001234"
                value={bankDetails.ifscSwift}
                onChange={handleBankDetailsChange}
              />
              <Input
                label="UPI ID"
                name="upiId"
                placeholder="e.g. name@upi"
                value={bankDetails.upiId}
                onChange={handleBankDetailsChange}
                className="md:col-span-2"
              />
            </div>
          </div>

          {/* Row 4: Invoice & Timesheet Files */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Invoice File"
              type="file"
              name="invoiceFile"
              onChange={handleInputChange}
              error={formErrors.invoiceFile}
            />
            <Input
              label="Timesheet File"
              type="file"
              name="timesheetFile"
              onChange={handleInputChange}
              error={formErrors.timesheetFile}
            />
          </div>

          {/* Row 5: Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button 
              type="button" 
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Submit
            </Button>
          </div>

          {/* Display errors */}
          {formErrors.submit && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-700">{formErrors.submit}</p>
            </div>
          )}
        </form>
      </Modal>

      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false)
          setSelectedInvoice(null)
          setIsEditingInvoiceDetails(false)
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
            {getRejectionReasons(selectedInvoice).length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-[14px] font-semibold text-red-800 uppercase tracking-wider">Rejection Reason</p>
                <div className="mt-2 space-y-1">
                  {getRejectionReasons(selectedInvoice).map((reason) => (
                    <p key={reason} className="text-[14px] text-red-700">{reason}</p>
                  ))}
                </div>
              </div>
            )}
            <h2 className="text-[26px] leading-tight font-semibold text-gray-900">Billing Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-[14px] font-semibold text-gray-500 uppercase tracking-wider">Bill Rate</p>
                {isEditingInvoiceDetails ? (
                  <input
                    type="number"
                    step="0.01"
                    name="billRate"
                    value={invoiceDetailsForm.billRate}
                    onChange={handleInvoiceDetailChange}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[15px] text-gray-900 focus:border-indigo-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-[16px] font-semibold text-gray-900">{formatters.formatCurrency(selectedInvoice.billRate)}</p>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-[14px] font-semibold text-gray-500 uppercase tracking-wider">Pay Rate</p>
                {isEditingInvoiceDetails ? (
                  <input
                    type="number"
                    step="0.01"
                    name="payRate"
                    value={invoiceDetailsForm.payRate}
                    onChange={handleInvoiceDetailChange}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[15px] text-gray-900 focus:border-indigo-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-[16px] font-semibold text-gray-900">{formatters.formatCurrency(selectedInvoice.payRate)}</p>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-[14px] font-semibold text-gray-500 uppercase tracking-wider">Hours Rate</p>
                {isEditingInvoiceDetails ? (
                  <input
                    type="number"
                    step="0.01"
                    name="hoursRate"
                    value={invoiceDetailsForm.hoursRate}
                    onChange={handleInvoiceDetailChange}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[15px] text-gray-900 focus:border-indigo-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-[16px] font-semibold text-gray-900">{Number(selectedInvoice.hoursRate || 0).toFixed(2)}</p>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-[14px] font-semibold text-gray-500 uppercase tracking-wider">Total Hours For Calc</p>
                {isEditingInvoiceDetails ? (
                  <input
                    type="number"
                    step="0.01"
                    name="totalHoursForCalc"
                    value={invoiceDetailsForm.totalHoursForCalc}
                    onChange={handleInvoiceDetailChange}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[15px] text-gray-900 focus:border-indigo-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-[16px] font-semibold text-gray-900">{Number(selectedInvoice.totalHoursForCalc || 0).toFixed(2)}</p>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-[14px] font-semibold text-gray-500 uppercase tracking-wider">Total Amount</p>
                {isEditingInvoiceDetails ? (
                  <input
                    type="number"
                    step="0.01"
                    name="totalAmount"
                    value={invoiceDetailsForm.totalAmount}
                    onChange={handleInvoiceDetailChange}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[15px] text-gray-900 focus:border-indigo-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-[16px] font-semibold text-gray-900">{formatters.formatCurrency(selectedInvoice.totalAmount)}</p>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-[14px] font-semibold text-gray-500 uppercase tracking-wider">Tax</p>
                {isEditingInvoiceDetails ? (
                  <input
                    type="number"
                    step="0.01"
                    name="tax"
                    value={invoiceDetailsForm.tax}
                    onChange={handleInvoiceDetailChange}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[15px] text-gray-900 focus:border-indigo-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-[16px] font-semibold text-gray-900">{formatters.formatCurrency(selectedInvoice.tax)}</p>
                )}
              </div>
            </div>
            <h3 className="text-[21px] leading-tight font-semibold text-gray-900">Attachments</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1 md:col-span-2">
                <p className="text-[14px] font-semibold text-gray-500 uppercase tracking-wider">View Invoice</p>
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
            {user?.role === 'CONTRACTOR' && (
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsEditingInvoiceDetails(true)}
                  disabled={isEditingInvoiceDetails}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSaveInvoiceDetails}
                  disabled={!isEditingInvoiceDetails}
                >
                  Save
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isApproveModalOpen}
        onClose={() => {
          setIsApproveModalOpen(false)
          setApproveTarget({ id: null, role: '' })
        }}
        title="Approve Invoice"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to approve this invoice?
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setIsApproveModalOpen(false)
                setApproveTarget({ id: null, role: '' })
              }}
            >
              Cancel
            </Button>
            <Button
              variant="success"
              isLoading={approving === `${approveTarget.role}-${approveTarget.id}`}
              onClick={handleConfirmApprove}
            >
              Approve
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false)
          setRejectTarget({ id: null, role: '' })
          setRejectReason('')
          setRejectError('')
        }}
        title="Reject Invoice"
        size="xl"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Please provide a rejection reason. This will be visible to the contractor.
          </p>
          <Textarea
            label="Rejection Reason"
            rows={6}
            value={rejectReason}
            onChange={(event) => {
              setRejectReason(event.target.value)
              if (rejectError) setRejectError('')
            }}
            placeholder="Enter reason for rejection"
          />
          {rejectError && <p className="text-sm text-red-500">{rejectError}</p>}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setIsRejectModalOpen(false)
                setRejectTarget({ id: null, role: '' })
                setRejectReason('')
                setRejectError('')
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              isLoading={rejecting === `${rejectTarget.role}-${rejectTarget.id}`}
              onClick={handleReject}
            >
              Reject Invoice
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isReasonModalOpen}
        onClose={() => {
          setIsReasonModalOpen(false)
          setReasonModalLines([])
        }}
        title="Invoice Rejection Reason"
        size="md"
      >
        <div className="space-y-3">
          {reasonModalLines.map((line) => (
            <p key={line} className="text-sm text-gray-800">{line}</p>
          ))}
          {reasonModalLines.length === 0 && (
            <p className="text-sm text-gray-500">No rejection reason available.</p>
          )}
          <div className="flex justify-end pt-1">
            <Button
              variant="secondary"
              onClick={() => {
                setIsReasonModalOpen(false)
                setReasonModalLines([])
              }}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}

export default InvoicesPage
