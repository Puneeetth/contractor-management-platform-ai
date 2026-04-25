import React, { useState, useMemo, useEffect } from 'react'
import { UploadCloud } from 'lucide-react'
import { Modal, Button, Card, Select, Input, Textarea } from '../ui'
import { poService } from '../../services/poService'
import { customerService } from '../../services/customerService'
import { COUNTRY_CURRENCY_MAP, COUNTRIES } from '../../constants'
import { dedupeBy } from '../../utils/dedupe'
import { validators } from '../../utils/validators'

const EMPTY_FORM = {
  poNumber: '',
  poDate: '',
  startDate: '',
  endDate: '',
  poValue: '',
  country: '',
  currency: '',
  paymentTermsDays: 30,
  customerId: '',
  remark: '',
  numberOfResources: '',
  sharedWith: '',
  file: null,
  sowFile: null,
}

const getCurrencyForCustomer = (customer) => {
  if (!customer?.countriesApplicable) return 'USD'
  const countries = String(customer.countriesApplicable).toLowerCase().split(',').map((c) => c.trim())
  const currencyMap = [
    ['india', 'INR'], ['in', 'INR'],
    ['united states', 'USD'], ['us', 'USD'], ['usa', 'USD'],
    ['canada', 'CAD'], ['ca', 'CAD'],
    ['united kingdom', 'GBP'], ['uk', 'GBP'], ['gb', 'GBP'],
    ['australia', 'AUD'], ['au', 'AUD'],
    ['germany', 'EUR'], ['france', 'EUR'], ['spain', 'EUR'], ['europe', 'EUR'], ['eu', 'EUR'],
  ]
  for (const [key, currency] of currencyMap) {
    if (countries.some((country) => country.includes(key))) return currency
  }
  return 'USD'
}

export const PoCreationModal = ({ isOpen, onClose, preSelectedCustomer = null, onSuccess }) => {
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customers, setCustomers] = useState([])
  const [customersLoaded, setCustomersLoaded] = useState(false)

  const loadCustomers = async () => {
    if (customersLoaded) return
    try {
      const data = await customerService.getAllCustomers()
      setCustomers(dedupeBy(data, (c, i) => c?.id || `${c?.name || 'c'}-${i}`))
      setCustomersLoaded(true)
    } catch {
      setCustomers([])
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadCustomers()
      if (preSelectedCustomer) {
        const currency = getCurrencyForCustomer(preSelectedCustomer)
        setFormData({
          ...EMPTY_FORM,
          customerId: String(preSelectedCustomer.id),
          country: '',
          currency,
        })
      } else {
        setFormData(EMPTY_FORM)
      }
      setFormErrors({})
    }
  }, [isOpen])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    const numberFields = ['poValue', 'paymentTermsDays', 'numberOfResources', 'customerId']
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: numberFields.includes(name) ? (value === '' ? '' : Number(value)) : value,
      }
      if (name === 'country' && COUNTRY_CURRENCY_MAP[value]) {
        updated.currency = COUNTRY_CURRENCY_MAP[value]
      }
      return updated
    })
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleFileChange = (e, fieldName = 'file') => {
    const file = e.target.files?.[0] || null
    setFormData((prev) => ({ ...prev, [fieldName]: file }))
  }

  const validateForm = () => {
    const errors = {}
    if (!validators.isRequired(formData.customerId)) errors.customerId = 'Customer is required'
    if (!validators.isRequired(formData.poNumber)) errors.poNumber = 'PO Number is required'
    if (!validators.isRequired(formData.poDate)) errors.poDate = 'PO Date is required'
    if (!validators.isRequired(formData.startDate)) errors.startDate = 'Start Date is required'
    if (!validators.isRequired(formData.endDate)) errors.endDate = 'End Date is required'
    if (!validators.isRequired(formData.poValue)) errors.poValue = 'PO Value is required'
    if (formData.poValue && Number(formData.poValue) <= 0) errors.poValue = 'PO Value must be greater than 0'
    if (!validators.isRequired(formData.country)) errors.country = 'Country is required'
    if (!validators.isRequired(formData.currency)) errors.currency = 'Currency is required'
    if (!validators.isRequired(formData.paymentTermsDays) && formData.paymentTermsDays !== 0) errors.paymentTermsDays = 'Payment terms is required'
    if (!validators.isRequired(formData.numberOfResources) && formData.numberOfResources !== 0) errors.numberOfResources = 'No. of resources is required'
    if (formData.numberOfResources && Number(formData.numberOfResources) <= 0) errors.numberOfResources = 'Number of resources must be greater than 0'
    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      errors.endDate = 'End Date cannot be before Start Date'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await poService.createPurchaseOrder(formData)
      setFormData(EMPTY_FORM)
      setFormErrors({})
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      setFormErrors({ submit: err?.message || 'Failed to create purchase order' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedCustomerObj = useMemo(
    () => customers.find((c) => String(c.id) === String(formData.customerId)) || null,
    [customers, formData.customerId]
  )

  const customerOptions = useMemo(
    () => customers.map((c) => ({ value: String(c.id), label: c.name })),
    [customers]
  )

  const countryOptions = useMemo(
    () => COUNTRIES.map((c) => ({ value: c, label: c })),
    []
  )

  const currencyOptions = useMemo(
    () => [
      { value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }, { value: 'GBP', label: 'GBP' },
      { value: 'INR', label: 'INR' }, { value: 'AUD', label: 'AUD' }, { value: 'CAD', label: 'CAD' },
      { value: 'JPY', label: 'JPY' }, { value: 'SGD', label: 'SGD' }, { value: 'AED', label: 'AED' },
      { value: 'SAR', label: 'SAR' }, { value: 'CNY', label: 'CNY' }, { value: 'BRL', label: 'BRL' },
      { value: 'MXN', label: 'MXN' }, { value: 'KRW', label: 'KRW' }, { value: 'IDR', label: 'IDR' },
      { value: 'MYR', label: 'MYR' }, { value: 'THB', label: 'THB' }, { value: 'ZAR', label: 'ZAR' },
      { value: 'NGN', label: 'NGN' }, { value: 'EGP', label: 'EGP' }, { value: 'PLN', label: 'PLN' },
      { value: 'SEK', label: 'SEK' }, { value: 'CHF', label: 'CHF' },
    ],
    []
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Purchase Order"
      size="xxl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" isLoading={isSubmitting} onClick={handleSubmit}>Create PO</Button>
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {formErrors.submit && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-700">{formErrors.submit}</p>
          </div>
        )}

        {/* Section 1: Customer */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-[#1c2f4b]">Customer</h3>
          <Card className="border-[#d8e2ef] px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
            <Select
              label="Select Customer"
              name="customerId"
              value={formData.customerId}
              onChange={handleInputChange}
              error={formErrors.customerId}
              required
              disabled={!!preSelectedCustomer}
              placeholder="Select customer..."
              options={customerOptions}
            />
          </Card>
        </div>

        {/* Section 2: Order Identification */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-[#1c2f4b]">Order Identification</h3>
          <Card className="border-[#d8e2ef] px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
            <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2">
              <Input
                label="PO Number"
                name="poNumber"
                value={formData.poNumber}
                onChange={handleInputChange}
                error={formErrors.poNumber}
                required
                placeholder="e.g. PO-2023-001"
              />
              <Input
                label="PO Date"
                name="poDate"
                type="date"
                value={formData.poDate}
                onChange={handleInputChange}
                error={formErrors.poDate}
                required
              />
              <Input
                label="Start Date"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleInputChange}
                error={formErrors.startDate}
                required
              />
              <Input
                label="End Date"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleInputChange}
                error={formErrors.endDate}
                required
              />
            </div>
          </Card>
        </div>

        {/* Section 3: Financial Details */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-[#1c2f4b]">Financial Details</h3>
          <Card className="border-[#d8e2ef] px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
            <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2">
              <Input
                label="PO Value"
                name="poValue"
                type="number"
                step="0.01"
                min="0"
                value={formData.poValue}
                onChange={handleInputChange}
                error={formErrors.poValue}
                required
                placeholder="0.00"
              />
              <div className="flex gap-2">
                <div className="w-[70%]">
                  <Select
                    label="Country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    error={formErrors.country}
                    required
                    placeholder="Select a country"
                    options={countryOptions}
                  />
                </div>
                <div className="w-[30%]">
                  <Select
                    label="Currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    error={formErrors.currency}
                    required
                    placeholder="-"
                    options={currencyOptions}
                  />
                </div>
              </div>
              <Input
                label="Payment Terms (Days)"
                name="paymentTermsDays"
                type="number"
                min="0"
                value={formData.paymentTermsDays}
                onChange={handleInputChange}
                error={formErrors.paymentTermsDays}
              />
              <Input
                label="Number of Resources"
                name="numberOfResources"
                type="number"
                min="1"
                value={formData.numberOfResources}
                onChange={handleInputChange}
                error={formErrors.numberOfResources}
                required
                placeholder="Contractors"
              />
            </div>
          </Card>
        </div>

        {/* Section 4: Documents */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-[#1c2f4b]">Documents</h3>
          <Card className="border-[#d8e2ef] px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
            <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-700">PO Upload</label>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-[#d5deec] bg-[#f9fbff] p-4 hover:bg-[#f0f5ff]">
                  <UploadCloud className="h-8 w-8 text-[#94a3b8]" />
                  <p className="mt-2 text-[12px] text-[#475569]">{formData.file ? formData.file.name : 'Click to upload PO'}</p>
                  <p className="mt-0.5 text-[10px] text-[#94a3b8]">PDF, DOCX, XLSX (Max 10MB)</p>
                  <input type="file" onChange={(e) => handleFileChange(e, 'file')} accept=".pdf,.doc,.docx,.xlsx" className="hidden" />
                </label>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-700">Statement of Work (SOW)</label>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-[#d5deec] bg-[#f9fbff] p-4 hover:bg-[#f0f5ff]">
                  <UploadCloud className="h-8 w-8 text-[#94a3b8]" />
                  <p className="mt-2 text-[12px] text-[#475569]">{formData.sowFile ? formData.sowFile.name : 'Click to upload SOW'}</p>
                  <p className="mt-0.5 text-[10px] text-[#94a3b8]">PDF, DOCX, XLSX (Max 10MB)</p>
                  <input type="file" onChange={(e) => handleFileChange(e, 'sowFile')} accept=".pdf,.doc,.docx,.xlsx" className="hidden" />
                </label>
              </div>
            </div>
          </Card>
        </div>

        {/* Section 5: Remarks */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-[#1c2f4b]">Remarks</h3>
          <Textarea
            label="Remarks"
            name="remark"
            value={formData.remark}
            onChange={handleInputChange}
            placeholder="Any notes or additional context"
            rows={3}
          />
        </div>
      </form>
    </Modal>
  )
}
