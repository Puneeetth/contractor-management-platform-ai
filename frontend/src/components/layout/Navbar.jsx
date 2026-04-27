import React, { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Menu, Bell, User, Settings, KeyRound, LogOut } from 'lucide-react'
import { useAuthStore } from '../../hooks/useAuth'
import { LogoutConfirmModal } from './LogoutConfirmModal'

export const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const fileInputRef = useRef(null)
  const profileMenuRef = useRef(null)
  const notificationsRef = useRef(null)
  const [profileImage, setProfileImage] = useState('')
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true)
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false)
  const displayName = user?.name || user?.fullName || user?.username || user?.email?.split('@')[0] || 'User'
  const profileImageStorageKey =
    user?.id || user?.userId || user?.email || user?.username
      ? `cmpai_profile_image_${String(user?.id || user?.userId || user?.email || user?.username).toLowerCase()}`
      : ''
  const isTopbarPage =
    location.pathname === '/dashboard' ||
    location.pathname === '/customers' ||
    location.pathname === '/contractors' ||
    location.pathname === '/contracts' ||
    location.pathname === '/pos'
  const isAdminShell = isTopbarPage && user?.role === 'ADMIN'
  const isAdminDashboard = location.pathname === '/dashboard' && user?.role === 'ADMIN'
  const isContractorDashboard = location.pathname === '/dashboard' && user?.role === 'CONTRACTOR'

  useEffect(() => {
    if (!profileImageStorageKey) {
      setProfileImage('')
      return
    }

    const savedImage = localStorage.getItem(profileImageStorageKey)
    setProfileImage(savedImage || '')
  }, [profileImageStorageKey])

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) {
        setIsProfileMenuOpen(false)
      }
      if (!notificationsRef.current?.contains(event.target)) {
        setIsNotificationsOpen(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const handleProfileImageChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      const imageData = String(reader.result || '')
      if (!imageData || !profileImageStorageKey) return
      setProfileImage(imageData)
      localStorage.setItem(profileImageStorageKey, imageData)
    }
    reader.readAsDataURL(file)
  }

  return (
    <nav className={`h-16 ${isAdminShell ? 'bg-white border-b border-[#e1e7f1]' : 'bg-white/90 backdrop-blur-xl border-b border-gray-200'} px-6 flex items-center justify-between sticky top-0 z-40`}>
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {isAdminDashboard && (
        <div className="pointer-events-none absolute left-[46%] top-1/2 -translate-x-1/2 -translate-y-1/2">
          <span className="text-[25px] font-extrabold tracking-[-0.02em] text-[#2f56d6]">
            Admin Dashboard
          </span>
        </div>
      )}

      {isContractorDashboard && (
        <div className="pointer-events-none absolute left-[46%] top-1/2 -translate-x-1/2 -translate-y-1/2">
          <span className="text-[25px] font-extrabold tracking-[-0.02em] text-[#2f56d6]">
            Contractor Dashboard
          </span>
        </div>
      )}

      {isTopbarPage && (
        <div className="flex items-center gap-3">
          <div ref={notificationsRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setIsNotificationsOpen((prev) => !prev)
                setHasUnreadNotifications(false)
              }}
              className="p-2 hover:bg-gray-100 rounded-xl relative transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {hasUnreadNotifications && (
                <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-white ${isAdminShell ? 'bg-red-500' : 'bg-indigo-500'}`} />
              )}
            </button>
            {isNotificationsOpen && (
              <div className="absolute right-0 top-11 z-50 w-72 rounded-2xl border border-[#e4e7ee] bg-white p-3 shadow-[0_14px_32px_rgba(15,23,42,0.14)]">
                <p className="text-[14px] font-semibold text-[#0f172a]">Notifications</p>
                <div className="my-2 h-px bg-[#eceff4]" />
                <p className="text-[13px] font-medium text-[#334155]">No notifications yet</p>
                <p className="mt-1 text-[12px] text-[#64748b]">You&apos;ll see contract updates here</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#1f2937]">{displayName}</span>
            <span className="rounded-md bg-[#dce6ff] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-[#3c58c9]">
              {user?.role || 'USER'}
            </span>
          </div>
          <div ref={profileMenuRef} className="relative h-9 w-9 shrink-0">
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              className="block h-9 w-9 rounded-full"
              title="Open profile menu"
            >
              <img
                src={profileImage || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(displayName)}`}
                alt={`${displayName} profile`}
                className="h-full w-full overflow-hidden rounded-full border border-[#d4deeb] bg-[#cfe2ea] object-cover"
              />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                setIsProfileMenuOpen(false)
                fileInputRef.current?.click()
              }}
              className="absolute bottom-[1px] right-[1px] flex h-2.5 w-2.5 items-center justify-center rounded-full bg-[#4b4fe8] text-[8px] font-bold leading-none text-white"
              title="Upload profile photo"
            >
              +
            </button>

            {isProfileMenuOpen && (
              <div className="absolute right-0 top-11 z-50 w-52 rounded-2xl border border-[#e4e7ee] bg-white p-2 shadow-[0_14px_32px_rgba(15,23,42,0.14)]">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false)
                    navigate('/dashboard')
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] font-medium text-[#111827] hover:bg-[#f3f4f6]"
                >
                  <User className="h-4.5 w-4.5 text-[#4b5563]" />
                  <span>Profile</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false)
                    navigate(user?.role === 'CONTRACTOR' ? '/bank-account' : '/admin/administration')
                  }}
                  className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] font-medium text-[#4b5563] hover:bg-[#f3f4f6]"
                >
                  <KeyRound className="h-4.5 w-4.5 text-[#6b7280]" />
                  <span>Change Password</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false)
                    navigate(user?.role === 'CONTRACTOR' ? '/bank-account' : '/admin/administration')
                  }}
                  className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] font-medium text-[#4b5563] hover:bg-[#f3f4f6]"
                >
                  <Settings className="h-4.5 w-4.5 text-[#6b7280]" />
                  <span>Settings</span>
                </button>
                <div className="my-2 h-px bg-[#eceff4]" />
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false)
                    setIsLogoutConfirmOpen(true)
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] font-medium text-[#4b5563] hover:bg-[#f3f4f6]"
                >
                  <LogOut className="h-4.5 w-4.5 text-[#6b7280]" />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleProfileImageChange}
          />
        </div>
      )}
      <LogoutConfirmModal
        isOpen={isLogoutConfirmOpen}
        role={user?.role}
        onCancel={() => setIsLogoutConfirmOpen(false)}
        onConfirm={() => {
          setIsLogoutConfirmOpen(false)
          logout()
        }}
      />
    </nav>
  )
}

