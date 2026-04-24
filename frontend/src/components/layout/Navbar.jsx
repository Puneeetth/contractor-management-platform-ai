import React, { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Menu, Bell } from 'lucide-react'
import { useAuthStore } from '../../hooks/useAuth'

export const Navbar = ({ onMenuClick }) => {
  const { user } = useAuthStore()
  const location = useLocation()
  const fileInputRef = useRef(null)
  const [profileImage, setProfileImage] = useState('')
  const displayName = user?.name || user?.fullName || user?.username || user?.email?.split('@')[0] || 'User'
  const isTopbarPage =
    location.pathname === '/dashboard' ||
    location.pathname === '/customers' ||
    location.pathname === '/contractors' ||
    location.pathname === '/contracts' ||
    location.pathname === '/pos'
  const isAdminShell = isTopbarPage && user?.role === 'ADMIN'
  const isAdminDashboard = location.pathname === '/dashboard' && user?.role === 'ADMIN'

  useEffect(() => {
    const savedImage = localStorage.getItem('cmpai_profile_image')
    if (savedImage) setProfileImage(savedImage)
  }, [])

  const handleProfileImageChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      const imageData = String(reader.result || '')
      if (!imageData) return
      setProfileImage(imageData)
      localStorage.setItem('cmpai_profile_image', imageData)
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

      {isTopbarPage && (
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-100 rounded-xl relative transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-white ${isAdminShell ? 'bg-red-500' : 'bg-indigo-500'}`} />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#1f2937]">{displayName}</span>
            <span className="rounded-md bg-[#dce6ff] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-[#3c58c9]">
              {user?.role || 'ADMIN'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative h-9 w-9 rounded-full"
            title="Change profile photo"
          >
            <img
              src={profileImage || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(displayName)}`}
              alt={`${displayName} profile`}
              className="h-full w-full overflow-hidden rounded-full border border-[#d4deeb] bg-[#cfe2ea] object-cover"
            />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 border-white bg-[#4b4fe8] text-[10px] font-bold leading-none text-white shadow-sm">
              +
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleProfileImageChange}
          />
        </div>
      )}
    </nav>
  )
}
