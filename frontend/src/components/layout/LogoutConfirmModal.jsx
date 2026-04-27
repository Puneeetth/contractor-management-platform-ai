import React from 'react'

export const LogoutConfirmModal = ({ isOpen, role, onCancel, onConfirm }) => {
  if (!isOpen) return null

  const roleLabel = String(role || '')
    .replace(/_/g, ' ')
    .trim()

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-[#dbe3ef] bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.24)]">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-[15px] font-bold text-[#4b4fe8]">Trace</span>
          {roleLabel && (
            <span className="rounded-md bg-[#dce6ff] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#3c58c9]">
              {roleLabel}
            </span>
          )}
        </div>

        <h3 className="text-[18px] font-semibold text-[#0f172a]">Are you sure?</h3>
        <p className="mt-1 text-[13px] text-[#64748b]">Do you want to logout from your account?</p>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[#d4dbe6] px-4 py-2 text-[13px] font-semibold text-[#475569] hover:bg-[#f8fafc]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-[#dc2626] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#b91c1c]"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
