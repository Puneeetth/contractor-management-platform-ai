import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Building2, CreditCard, Check, AlertCircle, Save } from 'lucide-react'
import { DashboardLayout } from '../../components/layout'
import { Card, Button, Input } from '../../components/ui'
import { bankDetailsService } from '../../services/bankDetailsService'
import { useAuth } from '../../hooks/useAuth'

const EMPTY_BANK = {
  accountHolderName: '',
  bankName: '',
  accountNumber: '',
  ifscSwift: '',
  upiId: '',
}

const SettingsPage = () => {
  const { user } = useAuth()
  const [bankForm, setBankForm] = useState(EMPTY_BANK)
  const [bankErrors, setBankErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true)
        const data = await bankDetailsService.getMyBankDetails()
        setBankForm({
          accountHolderName: data.accountHolderName || '',
          bankName: data.bankName || '',
          accountNumber: data.accountNumber || '',
          ifscSwift: data.ifscSwift || '',
          upiId: data.upiId || '',
        })
      } catch {
        // No bank details yet — keep empty form
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setBankForm((prev) => ({ ...prev, [name]: value }))
    if (bankErrors[name]) {
      setBankErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const errs = {}
    if (!bankForm.accountHolderName.trim()) errs.accountHolderName = 'Account holder name is required'
    if (!bankForm.bankName.trim()) errs.bankName = 'Bank name is required'
    if (!bankForm.accountNumber.trim()) errs.accountNumber = 'Account number is required'
    if (!bankForm.ifscSwift.trim()) errs.ifscSwift = 'IFSC / SWIFT code is required'
    setBankErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSuccess('')
    setError('')
    if (!validate()) return

    setIsSaving(true)
    try {
      await bankDetailsService.saveMyBankDetails(bankForm)
      setSuccess('Bank details saved successfully.')
    } catch (err) {
      setError(err?.message || 'Failed to save bank details')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1 text-sm">Manage your account preferences and payment information</p>
        </div>

        {/* Profile Info (read-only) */}
        <Card className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Account Info</h2>
              <p className="text-xs text-gray-500">Your profile details</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Name</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{user?.name || '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Email</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{user?.email || '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Role</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{user?.role || '—'}</p>
            </div>
          </div>
        </Card>

        {/* Bank Details */}
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Bank Details</h2>
              <p className="text-xs text-gray-500">Saved details auto-fill your invoices</p>
            </div>
          </div>

          {success && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3"
            >
              <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-emerald-700">{success}</p>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3"
            >
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </motion.div>
          )}

          {isLoading ? (
            <div className="py-8 text-center text-gray-500 text-sm">Loading bank details...</div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              {/* Row 1: Account Holder Name | Bank Name */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  label="Account Holder Name"
                  name="accountHolderName"
                  value={bankForm.accountHolderName}
                  onChange={handleChange}
                  error={bankErrors.accountHolderName}
                  placeholder="Full name as on bank account"
                  required
                />
                <Input
                  label="Bank Name"
                  name="bankName"
                  value={bankForm.bankName}
                  onChange={handleChange}
                  error={bankErrors.bankName}
                  placeholder="e.g. HDFC Bank"
                  required
                />
              </div>

              {/* Row 2: Account Number | IFSC / SWIFT */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  label="Account Number"
                  name="accountNumber"
                  value={bankForm.accountNumber}
                  onChange={handleChange}
                  error={bankErrors.accountNumber}
                  placeholder="Enter account number"
                  required
                />
                <Input
                  label="IFSC / SWIFT Code"
                  name="ifscSwift"
                  value={bankForm.ifscSwift}
                  onChange={handleChange}
                  error={bankErrors.ifscSwift}
                  placeholder="e.g. HDFC0001234 or SWIFT code"
                  required
                />
              </div>

              {/* Row 3: UPI ID (optional, full-width on mobile, half on md) */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  label="UPI ID (Optional)"
                  name="upiId"
                  value={bankForm.upiId}
                  onChange={handleChange}
                  placeholder="yourname@upi"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" variant="primary" isLoading={isSaving} className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Bank Details
                </Button>
              </div>
            </form>
          )}
        </Card>
      </motion.div>
    </DashboardLayout>
  )
}

export default SettingsPage
