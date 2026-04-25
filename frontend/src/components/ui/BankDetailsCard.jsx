import React, { useState, useEffect } from 'react'
import { AlertCircle, Edit2 } from 'lucide-react'
import { Card, Button } from './index'
import { bankAccountService } from '../../services/bankAccountService'

export const BankDetailsCard = ({ userId, onEditClick, isLoading: parentLoading }) => {
  const [bankAccount, setBankAccount] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (userId) {
      loadBankAccount()
    }
  }, [userId])

  const loadBankAccount = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await bankAccountService.getBankAccount(userId)
      setBankAccount(data)
    } catch (err) {
      setError(err?.message || 'Failed to load bank account')
    } finally {
      setIsLoading(false)
    }
  }

  if (parentLoading || isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-32 rounded bg-gray-200"></div>
        <div className="space-y-2">
          <div className="h-3 w-48 rounded bg-gray-200"></div>
          <div className="h-3 w-56 rounded bg-gray-200"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-yellow-200 bg-yellow-50 px-4 py-3">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-yellow-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-yellow-800">Error loading bank details</p>
            <p className="text-sm text-yellow-700">{error}</p>
          </div>
        </div>
      </Card>
    )
  }

  if (!bankAccount) {
    return (
      <Card className="border-orange-200 bg-orange-50 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-orange-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-orange-800">No bank details found</p>
              <p className="text-sm text-orange-700">Please add bank account details to include them in the invoice.</p>
            </div>
          </div>
          {onEditClick && (
            <button
              type="button"
              onClick={onEditClick}
              className="flex-shrink-0 inline-flex h-8 items-center gap-1 rounded-lg bg-orange-600 px-2.5 text-xs font-semibold text-white hover:bg-orange-700"
            >
              <Edit2 className="h-3.5 w-3.5" /> Add
            </button>
          )}
        </div>
      </Card>
    )
  }

  return (
    <Card className="border-[#d8e2ef] px-4 py-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <h3 className="text-[13px] font-semibold text-[#111827] uppercase tracking-wider">Bank Account Details</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-[11px] font-medium text-[#64748b] uppercase tracking-wider">Account Holder</p>
              <p className="mt-1 text-[13px] font-medium text-[#0f1d33]">{bankAccount.accountHolderName}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-[#64748b] uppercase tracking-wider">Bank Name</p>
              <p className="mt-1 text-[13px] font-medium text-[#0f1d33]">{bankAccount.bankName}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-[#64748b] uppercase tracking-wider">Account Number</p>
              <p className="mt-1 text-[13px] font-medium text-[#0f1d33] tracking-widest">{bankAccount.maskedAccountNumber}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-[#64748b] uppercase tracking-wider">IFSC Code</p>
              <p className="mt-1 text-[13px] font-medium text-[#0f1d33]">{bankAccount.ifscCode}</p>
            </div>
            {bankAccount.branch && (
              <div>
                <p className="text-[11px] font-medium text-[#64748b] uppercase tracking-wider">Branch</p>
                <p className="mt-1 text-[13px] font-medium text-[#0f1d33]">{bankAccount.branch}</p>
              </div>
            )}
          </div>
        </div>
        {onEditClick && (
          <button
            type="button"
            onClick={onEditClick}
            className="flex-shrink-0 inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#eef1ff] px-2.5 text-xs font-semibold text-[#4b4fe8] hover:bg-[#e0e5ff]"
          >
            <Edit2 className="h-3.5 w-3.5" /> Edit
          </button>
        )}
      </div>
    </Card>
  )
}
