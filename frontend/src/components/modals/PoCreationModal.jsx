import React, { useEffect, useMemo, useState } from 'react'
import { UploadCloud } from 'lucide-react'
import { Modal, Button, Card } from '../ui'
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

  const countries = String(customer.countriesApplicable)
    .toLowerCase()
    .split(',')
    .map((country) => country.trim())

  const currencyMap = [
    ['india', 'INR'],
    ['in', 'INR'],
    ['united states', 'USD'],
    ['us', 'USD'],
    ['usa', 'USD'],
    ['canada', 'CAD'],
    ['ca', 'CAD'],
    ['united kingdom', 'GBP'],
    ['uk', 'GBP'],
    ['gb', 'GBP'],
    ['australia', 'AUD'],
    ['au', 'AUD'],
    ['germany', 'EUR'],
    ['france', 'EUR'],
    ['spain', 'EUR'],
    ['europe', 'EUR'],
    ['eu', 'EUR'],
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
      setCustomers(dedupeBy(data, (customer, index) => customer?.id || `${customer?.name || 'customer'}-${index}`))
      setCustomersLoaded(true)
    } catch {
      setCustomers([])
    }
  }

  useEffect(() => {
    if (!isOpen) return

    loadCustomers()

    if (preSelectedCustomer) {
      setFormData({
        ...EMPTY_FORM,
        customerId: String(preSelectedCustomer.id),
        currency: getCurrencyForCustomer(preSelectedCustomer),
      })
    } else {
      setFormData(EMPTY_FORM)
    }

    setFormErrors({})
  }, [isOpen, preSelectedCustomer])

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
    if (!validators.isRequired(formData.paymentTermsDays) && formData.paymentTermsDays !== 0) {
      errors.paymentTermsDays = 'Payment terms is required'
    }
    if (!validators.isRequired(formData.numberOfResources) && formData.numberOfResources !== 0) {
      errors.numberOfResources = 'No. of resources is required'
    }
    if (formData.numberOfResources && Number(formData.numberOfResources) <= 0) {
      errors.numberOfResources = 'Number of resources must be greater than 0'
    }
    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      errors.endDate = 'End Date cannot be before Start Date'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (event) => {
    const { name, value } = event.target
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

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleFileChange = (event, fieldName = 'file') => {
    const file = event.target.files?.[0] || null
    setFormData((prev) => ({ ...prev, [fieldName]: file }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await poService.createPurchaseOrder(formData)
      setFormData(EMPTY_FORM)
      setFormErrors({})
      onSuccess?.()
      onClose()
    } catch (error) {
      setFormErrors({ submit: error?.message || 'Failed to create purchase order' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedCustomer = useMemo(
    () => customers.find((customer) => String(customer.id) === String(formData.customerId)),
    [customers, formData.customerId]
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex flex-wrap items-center gap-3">
          <span>Create New Purchase Order For</span>
          {selectedCustomer && preSelectedCustomer && (
            <div className="inline-flex min-h-9 items-center rounded-lg border border-[#c7d7ff] bg-[#eef4ff] px-3 text-[12px] font-semibold text-[#2f56c8] shadow-[0_4px_12px_rgba(59,91,219,0.10)]">
              {selectedCustomer.name}
            </div>
          )}
        </div>
      }
      size="xxl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" isLoading={isSubmitting} onClick={handleSubmit}>
            Create PO
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {formErrors.submit && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-700">{formErrors.submit}</p>
          </div>
        )}

        {!preSelectedCustomer && (
          <div>
            <h2 className="mb-1.5 text-[13px] font-semibold text-[#111827]">Customer</h2>
            <Card className="border-[#d8e2ef] px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
              <div className="w-full">
                <label className="mb-1 block text-[11px] font-medium text-gray-700">
                  Select Customer <span className="text-red-500">*</span>
                </label>
                <select
                  name="customerId"
                  value={formData.customerId}
                  onChange={handleInputChange}
                  className={`h-9 w-full rounded-md border bg-white px-2.5 text-[13px] text-gray-900 outline-none ${formErrors.customerId
                      ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                    }`}
                >
                  <option value="">Choose a customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={String(customer.id)}>
                      {customer.name}
                    </option>
                  ))}
                </select>
                {formErrors.customerId && <p className="mt-1 text-[10px] text-red-500">{formErrors.customerId}</p>}
              </div>
            </Card>
          </div>
        )}

        <div>
          <h2 className="mb-1.5 text-[13px] font-semibold text-[#111827]">Order Identification</h2>
          <Card className="border-[#d8e2ef] px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
            <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2">
              <div className="w-full">
                <label className="mb-1 block text-[11px] font-medium text-gray-700">
                  PO Number <span className="text-red-500">*</span>
                </label>
                <input
                  name="poNumber"
                  value={formData.poNumber}
                  onChange={handleInputChange}
                  placeholder="e.g. PO-2023-001"
                  className={`h-9 w-full rounded-md border bg-white px-2.5 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none ${formErrors.poNumber
                      ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                    }`}
                />
                {formErrors.poNumber && <p className="mt-1 text-[10px] text-red-500">{formErrors.poNumber}</p>}
              </div>

              <div className="w-full">
                <label className="mb-1 block text-[11px] font-medium text-gray-700">
                  PO Date <span className="text-red-500">*</span>
                </label>
                <input
                  name="poDate"
                  type="date"
                  value={formData.poDate}
                  onChange={handleInputChange}
                  className={`h-9 w-full rounded-md border bg-white px-2.5 text-[13px] text-gray-900 focus:outline-none ${formErrors.poDate
                      ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                    }`}
                />
                {formErrors.poDate && <p className="mt-1 text-[10px] text-red-500">{formErrors.poDate}</p>}
              </div>

              <div className="w-full">
                <label className="mb-1 block text-[11px] font-medium text-gray-700">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className={`h-9 w-full rounded-md border bg-white px-2.5 text-[13px] text-gray-900 focus:outline-none ${formErrors.startDate
                      ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                    }`}
                />
                {formErrors.startDate && <p className="mt-1 text-[10px] text-red-500">{formErrors.startDate}</p>}
              </div>

              <div className="w-full">
                <label className="mb-1 block text-[11px] font-medium text-gray-700">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className={`h-9 w-full rounded-md border bg-white px-2.5 text-[13px] text-gray-900 focus:outline-none ${formErrors.endDate
                      ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                    }`}
                />
                {formErrors.endDate && <p className="mt-1 text-[10px] text-red-500">{formErrors.endDate}</p>}
              </div>
            </div>
          </Card>
        </div>

        <div>
          <h2 className="mb-1.5 text-[13px] font-semibold text-[#111827]">Financial Details</h2>
          <Card className="border-[#d8e2ef] px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
            <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2">
              <div className="w-full">
                <label className="mb-1 block text-[11px] font-medium text-gray-700">
                  PO Value <span className="text-red-500">*</span>
                </label>
                <input
                  name="poValue"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.poValue}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className={`h-9 w-full rounded-md border bg-white px-2.5 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none ${formErrors.poValue
                      ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                    }`}
                />
                {formErrors.poValue && <p className="mt-1 text-[10px] text-red-500">{formErrors.poValue}</p>}
              </div>

              <div className="flex gap-2">
                <div className="w-[70%]">
                  <label className="mb-1 block text-[11px] font-medium text-gray-700">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className={`h-9 w-full rounded-md border bg-white px-2.5 text-[13px] text-gray-900 outline-none ${formErrors.country
                        ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                      }`}
                  >
                    <option value="">Select a country</option>
                    {COUNTRIES.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                  {formErrors.country && <p className="mt-1 text-[10px] text-red-500">{formErrors.country}</p>}
                </div>

                <div className="w-[30%]">
                  <label className="mb-1 block text-[11px] font-medium text-gray-700">
                    Currency <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    className={`h-9 w-full rounded-md border bg-white px-2.5 text-[13px] text-gray-900 outline-none ${formErrors.currency
                        ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                      }`}
                  >
                    <option value="">-</option>
                    {['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'JPY', 'SGD', 'AED', 'SAR', 'CNY', 'BRL', 'MXN', 'KRW', 'IDR', 'MYR', 'THB', 'ZAR', 'NGN', 'EGP', 'PLN', 'SEK', 'CHF'].map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                  {formErrors.currency && <p className="mt-1 text-[10px] text-red-500">{formErrors.currency}</p>}
                </div>
              </div>

              <div className="w-full">
                <label className="mb-1 block text-[11px] font-medium text-gray-700">Payment Terms (Days)</label>
                <input
                  name="paymentTermsDays"
                  type="number"
                  min="0"
                  value={formData.paymentTermsDays}
                  onChange={handleInputChange}
                  className={`h-9 w-full rounded-md border bg-white px-2.5 text-[13px] text-gray-900 focus:outline-none ${formErrors.paymentTermsDays
                      ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                    }`}
                />
                {formErrors.paymentTermsDays && <p className="mt-1 text-[10px] text-red-500">{formErrors.paymentTermsDays}</p>}
              </div>

              <div className="w-full">
                <label className="mb-1 block text-[11px] font-medium text-gray-700">
                  Number of Resources <span className="text-red-500">*</span>
                </label>
                <input
                  name="numberOfResources"
                  type="number"
                  min="1"
                  value={formData.numberOfResources}
                  onChange={handleInputChange}
                  placeholder="Contractors"
                  className={`h-9 w-full rounded-md border bg-white px-2.5 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none ${formErrors.numberOfResources
                      ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                    }`}
                />
                {formErrors.numberOfResources && <p className="mt-1 text-[10px] text-red-500">{formErrors.numberOfResources}</p>}
              </div>
            </div>
          </Card>
        </div>

        <div>
          <h2 className="mb-1.5 text-[13px] font-semibold text-[#111827]">Resources & Notes</h2>
          <Card className="border-[#d8e2ef] px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
            <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2">
              <div className="w-full">
                <label className="mb-1 block text-[11px] font-medium text-gray-700">Shared With</label>
                <input
                  name="sharedWith"
                  value={formData.sharedWith}
                  onChange={handleInputChange}
                  placeholder="Team, manager, or stakeholder names"
                  className="h-9 w-full rounded-md border border-gray-300 bg-white px-2.5 text-[13px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="w-full">
                <label className="mb-1 block text-[11px] font-medium text-gray-700">Remarks</label>
                <input
                  name="remark"
                  value={formData.remark}
                  onChange={handleInputChange}
                  placeholder="Any PO-specific notes"
                  className="h-9 w-full rounded-md border border-gray-300 bg-white px-2.5 text-[13px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>
          </Card>
        </div>

        <div>
          <h2 className="mb-1.5 text-[13px] font-semibold text-[#111827]">Documents</h2>
          <Card className="border-[#d8e2ef] px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
            <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2">
              <div className="w-full">
                <label className="mb-1 block text-[11px] font-medium text-gray-700">PO Upload</label>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-[#d5deec] bg-[#f9fbff] p-4 hover:bg-[#f0f5ff]">
                  <UploadCloud className="h-8 w-8 text-[#94a3b8]" />
                  <p className="mt-2 text-[12px] text-[#475569]">{formData.file ? formData.file.name : 'Click to upload PO'}</p>
                  <p className="mt-0.5 text-[10px] text-[#94a3b8]">PDF, DOCX, XLSX (Max 10MB)</p>
                  <input
                    type="file"
                    onChange={(event) => handleFileChange(event, 'file')}
                    accept=".pdf,.doc,.docx,.xlsx"
                    className="hidden"
                  />
                </label>
              </div>

              <div className="w-full">
                <label className="mb-1 block text-[11px] font-medium text-gray-700">Statement of Work (SOW)</label>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-[#d5deec] bg-[#f9fbff] p-4 hover:bg-[#f0f5ff]">
                  <UploadCloud className="h-8 w-8 text-[#94a3b8]" />
                  <p className="mt-2 text-[12px] text-[#475569]">{formData.sowFile ? formData.sowFile.name : 'Click to upload SOW'}</p>
                  <p className="mt-0.5 text-[10px] text-[#94a3b8]">PDF, DOCX, XLSX (Max 10MB)</p>
                  <input
                    type="file"
                    onChange={(event) => handleFileChange(event, 'sowFile')}
                    accept=".pdf,.doc,.docx,.xlsx"
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </Card>
        </div>
      </form>
    </Modal>
  )
}
