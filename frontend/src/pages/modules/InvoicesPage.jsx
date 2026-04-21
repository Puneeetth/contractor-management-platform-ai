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
  const [rateError, setRateError] = useState('')

  const [formData, setFormData] = useState({
    contractorId: user?.id || '',
    invoiceMonth: new Date().toISOString().slice(0, 7),
    totalHours: '',
    rate: '',
    taxPercentage: '',
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
        taxPercentage: '',
        invoiceFile: null,
        timesheetFile: null,
      })

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

      <Card>
        {isLoading ? <Loader /> : <Table data={invoices} />}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Invoice"
      >
        <form onSubmit={handleSubmit} className="space-y-3">

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

          <Input label="Rate" value={formData.rate} readOnly />

          <Input label="Base Amount" value={baseAmount.toFixed(2)} readOnly />

          <Input
            label="Tax (%)"
            name="taxPercentage"
            type="number"
            value={formData.taxPercentage}
            onChange={handleInputChange}
          />

          <Input label="Total Amount" value={totalAmount.toFixed(2)} readOnly />

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

          <Button type="submit" isLoading={isSubmitting}>
            Submit
          </Button>

        </form>
      </Modal>
    </DashboardLayout>
  )
}

export default InvoicesPage