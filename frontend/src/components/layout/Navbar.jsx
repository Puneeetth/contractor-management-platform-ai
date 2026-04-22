import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Menu, Bell, ChevronDown } from 'lucide-react'
import { useAuthStore } from '../../hooks/useAuth'

export const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const isDashboardPage = location.pathname === '/dashboard'

  useEffect(() => {
    if (!isDashboardPage) {
      setShowProfileDropdown(false)
    }
  }, [isDashboardPage])

  return (
    <nav className="h-16 bg-white/90 backdrop-blur-xl border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {isDashboardPage && (
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-100 rounded-xl relative transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full ring-2 ring-white" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-3 hover:bg-gray-100 px-3 py-1.5 rounded-xl transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-white text-xs font-semibold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500 hidden sm:block" />
            </button>

            {showProfileDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-50">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
                  </div>
                  <button className="w-full text-left px-4 py-2.5 hover:bg-gray-100 text-sm text-gray-700 transition-colors">
                    Profile Settings
                  </button>
                  <button className="w-full text-left px-4 py-2.5 hover:bg-gray-100 text-sm text-gray-700 transition-colors">
                    Account Security
                  </button>
                  <div className="border-t border-gray-200 my-1" />
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-sm text-red-600 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
