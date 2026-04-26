import React, { useMemo, useState } from 'react'
import { Button, Modal } from '../ui'
import { validators } from '../../utils/validators'

const EMPTY_FILTERS = {
  month: '',
  customerId: '',
  contractorId: '',
  status: '',
  includeFinancialDetails: false,
}

export const ContractExportModal = ({
  isOpen,
  onClose,
  customers = [],
  contractors = [],
  isExporting = false,
  onExport,
}) => {
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [errors, setErrors] = useState({})
  const [customerSearchTerm, setCustomerSearchTerm] = useState('')
  const [contractorSearchTerm, setContractorSearchTerm] = useState('')

  const filteredCustomers = useMemo(() => {
    const query = customerSearchTerm.trim().toLowerCase()
    return customers.filter((customer) => !query || String(customer.name || '').toLowerCase().includes(query))
  }, [customerSearchTerm, customers])

  const filteredContractors = useMemo(() => {
    const query = contractorSearchTerm.trim().toLowerCase()
    return contractors.filter((contractor) => {
      if (!query) return true
      const name = String(contractor.name || '').toLowerCase()
      const contractorId = String(contractor.contractorId || '').toLowerCase()
      return name.includes(query) || contractorId.includes(query)
    })
  }, [contractorSearchTerm, contractors])

  const resetState = () => {
    setFilters(EMPTY_FILTERS)
    setErrors({})
    setCustomerSearchTerm('')
    setContractorSearchTerm('')
  }

  const handleClose = () => {
    if (isExporting) return
    resetState()
    onClose()
  }

  const handleExport = async () => {
    const nextErrors = {}
    if (!validators.isRequired(filters.month)) nextErrors.month = 'Month is required'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    await onExport(filters, resetState)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Export Contracts"
      size="xxl"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isExporting}>Cancel</Button>
          <Button variant="primary" isLoading={isExporting} onClick={handleExport}>Export</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="mb-1 block text-[11px] font-medium text-gray-700">Month <span className="text-red-500">*</span></label>
            <input
              type="month"
              value={filters.month}
              onChange={(event) => {
                setFilters((prev) => ({ ...prev, month: event.target.value }))
                if (errors.month) {
                  setErrors((prev) => ({ ...prev, month: '' }))
                }
              }}
              className={`h-10 w-full rounded-md border bg-white px-3 text-[12px] text-gray-900 outline-none ${errors.month ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
            />
            {errors.month && <p className="mt-1 text-[10px] text-red-500">{errors.month}</p>}
          </div>

          <div className="space-y-1">
            <label className="mb-1 block text-[11px] font-medium text-gray-700">Status</label>
            <select
              value={filters.status}
              onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
              className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-[12px] text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="UPCOMING">UPCOMING</option>
            </select>
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="mb-1 block text-[11px] font-medium text-gray-700">Customer</label>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_220px]">
              <input
                type="text"
                value={customerSearchTerm}
                onChange={(event) => setCustomerSearchTerm(event.target.value)}
                placeholder="Search customer..."
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-[12px] text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              <select
                value={filters.customerId}
                onChange={(event) => setFilters((prev) => ({ ...prev, customerId: event.target.value }))}
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-[12px] text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">All customers</option>
                {filteredCustomers.map((customer) => (
                  <option key={customer.id} value={String(customer.id)}>{customer.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="mb-1 block text-[11px] font-medium text-gray-700">Contractor</label>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_220px]">
              <input
                type="text"
                value={contractorSearchTerm}
                onChange={(event) => setContractorSearchTerm(event.target.value)}
                placeholder="Search contractor..."
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-[12px] text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              <select
                value={filters.contractorId}
                onChange={(event) => setFilters((prev) => ({ ...prev, contractorId: event.target.value }))}
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-[12px] text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">All contractors</option>
                {filteredContractors.map((contractor) => (
                  <option key={contractor.id} value={String(contractor.id)}>{contractor.name} ({contractor.contractorId})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="mb-1 block text-[11px] font-medium text-gray-700">Include Financial Details</label>
            <label className="flex h-10 items-center gap-2 rounded-md border border-gray-300 bg-[#f8fafc] px-3 text-[12px] text-gray-700">
              <input
                type="checkbox"
                checked={filters.includeFinancialDetails}
                onChange={(event) => setFilters((prev) => ({ ...prev, includeFinancialDetails: event.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Include revenue, cost, and margin
            </label>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default ContractExportModal
