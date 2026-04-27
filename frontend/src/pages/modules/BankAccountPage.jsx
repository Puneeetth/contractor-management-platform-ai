import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Edit2, Plus, Save, X } from 'lucide-react'
import { DashboardLayout } from '../../components/layout'
import { Card, Button, Input, Loader } from '../../components/ui'
import { bankAccountService } from '../../services/bankAccountService'
import { useAuth } from '../../hooks/useAuth'

const BankAccountPage = () => {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [bankAccount, setBankAccount] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formErrors, setFormErrors] = useState({})

  const [formData, setFormData] = useState({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branch: '',
  })

  // Load bank account on component mount
  useEffect(() => {
    if (user?.id) {
      loadBankAccount()
    }
  }, [user?.id])

  useEffect(() => {
    if (!success) return undefined
    const timeoutId = setTimeout(() => setSuccess(null), 5000)
    return () => clearTimeout(timeoutId)
  }, [success])

  const loadBankAccount = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await bankAccountService.getBankAccount(user.id)
      if (data) {
        setBankAccount(data)
        setFormData({
          accountHolderName: data.accountHolderName || '',
          bankName: data.bankName || '',
          accountNumber: data.accountNumber || '',
          ifscCode: data.ifscCode || '',
          branch: data.branch || '',
        })
      }
    } catch (err) {
      setError(err?.message || 'Failed to load bank account')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.accountHolderName?.trim()) {
      errors.accountHolderName = 'Account holder name is required'
    }

    if (!formData.bankName?.trim()) {
      errors.bankName = 'Bank name is required'
    }

    if (!formData.accountNumber?.trim()) {
      errors.accountNumber = 'Account number is required'
    }

    if (!formData.ifscCode?.trim()) {
      errors.ifscCode = 'IFSC/SWIFT code is required'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const savedData = await bankAccountService.saveBankAccount(user.id, {
        accountHolderName: formData.accountHolderName,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        ifscCode: formData.ifscCode,
        branch: formData.branch,
      })

      setBankAccount(savedData)
      setIsEditing(false)
      setSuccess(bankAccount ? 'Bank account updated successfully!' : 'Bank account added successfully!')
    } catch (err) {
      setError(err?.message || 'Failed to save bank account')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = () => {
    if (bankAccount) {
      setFormData({
        accountHolderName: bankAccount.accountHolderName || '',
        bankName: bankAccount.bankName || '',
        accountNumber: bankAccount.accountNumber || '',
        ifscCode: bankAccount.ifscCode || '',
        branch: bankAccount.branch || '',
      })
    }
    setIsEditing(true)
    setError(null)
    setFormErrors({})
  }

  const handleCancel = () => {
    if (bankAccount) {
      setFormData({
        accountHolderName: bankAccount.accountHolderName || '',
        bankName: bankAccount.bankName || '',
        accountNumber: bankAccount.accountNumber || '',
        ifscCode: bankAccount.ifscCode || '',
        branch: bankAccount.branch || '',
      })
    } else {
      setFormData({
        accountHolderName: '',
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        branch: '',
      })
    }
    setIsEditing(false)
    setFormErrors({})
    setError(null)
  }

  const hasData = bankAccount && !isEditing
  const showAddButton = !bankAccount && !isEditing
  const showEditForm = isEditing || (!bankAccount && !isLoading)

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] leading-none font-bold text-[#0f1d33]">Bank Account</h1>
            <p className="mt-1 text-[13px] text-[#4a5c77]">Manage your bank account details for invoicing.</p>
          </div>
          {hasData && (
            <button
              type="button"
              onClick={handleEdit}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#4b4fe8] px-3.5 text-[13px] font-semibold text-white shadow-[0_8px_16px_rgba(75,79,232,0.25)] hover:bg-[#4347db]"
            >
              <Edit2 className="h-4 w-4" /> Edit
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-red-200 bg-red-50 p-4"
          >
            <p className="text-sm text-red-700">{error}</p>
          </motion.div>
        )}

        {/* Success Message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border border-green-200 bg-green-50 p-4"
          >
            <p className="text-sm text-green-700">{success}</p>
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading && (
          <Card className="border-[#d8e2ef] shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
            <Loader />
          </Card>
        )}

        {/* Display Existing Bank Account */}
        {!isLoading && hasData && (
          <Card className="border-[#d8e2ef] shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
            <div className="space-y-6">
              <div>
                <h2 className="mb-4 text-[16px] font-semibold text-[#111827]">Current Bank Account Details</h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-[12px] font-semibold text-[#64748b] uppercase tracking-wider">Account Holder</p>
                    <p className="text-[15px] font-medium text-[#0f1d33]">{bankAccount.accountHolderName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[12px] font-semibold text-[#64748b] uppercase tracking-wider">Bank Name</p>
                    <p className="text-[15px] font-medium text-[#0f1d33]">{bankAccount.bankName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[12px] font-semibold text-[#64748b] uppercase tracking-wider">Account Number</p>
                    <p className="text-[15px] font-medium text-[#0f1d33] tracking-widest">{bankAccount.maskedAccountNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[12px] font-semibold text-[#64748b] uppercase tracking-wider">IFSC/SWIFT Code</p>
                    <p className="text-[15px] font-medium text-[#0f1d33]">{bankAccount.ifscCode}</p>
                  </div>
                  {bankAccount.branch && (
                    <div className="space-y-1">
                      <p className="text-[12px] font-semibold text-[#64748b] uppercase tracking-wider">Branch</p>
                      <p className="text-[15px] font-medium text-[#0f1d33]">{bankAccount.branch}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Empty State - No Bank Account */}
        {!isLoading && !bankAccount && !isEditing && (
          <Card className="border-[#d8e2ef] shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#eef1ff]">
                <Plus className="h-6 w-6 text-[#4b4fe8]" />
              </div>
              <h3 className="text-[16px] font-semibold text-[#0f1d33]">No Bank Account Found</h3>
              <p className="mt-1 text-[13px] text-[#64748b]">Add your bank details to use them in invoices.</p>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="mt-4 inline-flex h-9 items-center gap-2 rounded-xl bg-[#4b4fe8] px-3.5 text-[13px] font-semibold text-white shadow-[0_8px_16px_rgba(75,79,232,0.25)] hover:bg-[#4347db]"
              >
                <Plus className="h-4 w-4" /> Add Bank Account
              </button>
            </div>
          </Card>
        )}

        {/* Form - Add or Edit */}
        {showEditForm && (
          <Card className="border-[#d8e2ef] shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h2 className="mb-4 text-[16px] font-semibold text-[#111827]">
                  {bankAccount ? 'Edit Bank Account Details' : 'Add Bank Account Details'}
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2">
                <div className="w-full">
                  <label className="mb-1.5 block text-[12px] font-semibold text-[#111827]">
                    Account Holder Name *
                  </label>
                  <input
                    type="text"
                    name="accountHolderName"
                    value={formData.accountHolderName}
                    onChange={handleInputChange}
                    placeholder="Enter account holder name"
                    className={`h-9 w-full rounded-lg border bg-white px-3 text-[13px] text-[#0f1d33] placeholder-gray-400 focus:outline-none ${
                      formErrors.accountHolderName
                        ? 'border-red-400 focus:ring-2 focus:ring-red-100 focus:border-red-500'
                        : 'border-[#d8e2ef] focus:border-[#4b4fe8] focus:ring-2 focus:ring-[#e9edf4]'
                    }`}
                  />
                  {formErrors.accountHolderName && (
                    <p className="mt-1 text-[11px] text-red-500">{formErrors.accountHolderName}</p>
                  )}
                </div>

                <div className="w-full">
                  <label className="mb-1.5 block text-[12px] font-semibold text-[#111827]">
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    placeholder="e.g., HDFC, ICICI"
                    className={`h-9 w-full rounded-lg border bg-white px-3 text-[13px] text-[#0f1d33] placeholder-gray-400 focus:outline-none ${
                      formErrors.bankName
                        ? 'border-red-400 focus:ring-2 focus:ring-red-100 focus:border-red-500'
                        : 'border-[#d8e2ef] focus:border-[#4b4fe8] focus:ring-2 focus:ring-[#e9edf4]'
                    }`}
                  />
                  {formErrors.bankName && (
                    <p className="mt-1 text-[11px] text-red-500">{formErrors.bankName}</p>
                  )}
                </div>

                <div className="w-full">
                  <label className="mb-1.5 block text-[12px] font-semibold text-[#111827]">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                    placeholder="Enter account number"
                    className={`h-9 w-full rounded-lg border bg-white px-3 text-[13px] text-[#0f1d33] placeholder-gray-400 focus:outline-none ${
                      formErrors.accountNumber
                        ? 'border-red-400 focus:ring-2 focus:ring-red-100 focus:border-red-500'
                        : 'border-[#d8e2ef] focus:border-[#4b4fe8] focus:ring-2 focus:ring-[#e9edf4]'
                    }`}
                  />
                  {formErrors.accountNumber && (
                    <p className="mt-1 text-[11px] text-red-500">{formErrors.accountNumber}</p>
                  )}
                </div>

                <div className="w-full">
                  <label className="mb-1.5 block text-[12px] font-semibold text-[#111827]">
                    IFSC/SWIFT Code *
                  </label>
                  <input
                    type="text"
                    name="ifscCode"
                    value={formData.ifscCode}
                    onChange={handleInputChange}
                    placeholder="e.g., HDFC0001234"
                    className={`h-9 w-full rounded-lg border bg-white px-3 text-[13px] text-[#0f1d33] placeholder-gray-400 focus:outline-none ${
                      formErrors.ifscCode
                        ? 'border-red-400 focus:ring-2 focus:ring-red-100 focus:border-red-500'
                        : 'border-[#d8e2ef] focus:border-[#4b4fe8] focus:ring-2 focus:ring-[#e9edf4]'
                    }`}
                  />
                  {formErrors.ifscCode && (
                    <p className="mt-1 text-[11px] text-red-500">{formErrors.ifscCode}</p>
                  )}
                </div>

                <div className="w-full">
                  <label className="mb-1.5 block text-[12px] font-semibold text-[#111827]">
                    Branch (Optional)
                  </label>
                  <input
                    type="text"
                    name="branch"
                    value={formData.branch}
                    onChange={handleInputChange}
                    placeholder="Enter branch name"
                    className="h-9 w-full rounded-lg border border-[#d8e2ef] bg-white px-3 text-[13px] text-[#0f1d33] placeholder-gray-400 focus:border-[#4b4fe8] focus:outline-none focus:ring-2 focus:ring-[#e9edf4]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-[#d8e2ef] pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#d8e2ef] bg-white px-3.5 text-[13px] font-semibold text-[#1c2f4b] hover:bg-[#f7f9fc]"
                >
                  <X className="h-4 w-4" /> Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#4b4fe8] px-3.5 text-[13px] font-semibold text-white shadow-[0_8px_16px_rgba(75,79,232,0.25)] hover:bg-[#4347db] disabled:opacity-60"
                >
                  <Save className="h-4 w-4" /> {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

export default BankAccountPage
