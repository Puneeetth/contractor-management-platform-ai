import React, { useState } from 'react'
import { Menu, Search, Bell, User } from 'lucide-react'
import { useAuthStore } from '../hooks/useAuth'

export const Navbar = ({ onMenuClick }) => {
  const { user } = useAuthStore()
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)

  return (
    <nav className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Left side - Menu & Search */}
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="hidden md:flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg w-64">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent outline-none text-sm w-full"
          />
        </div>
      </div>

      {/* Right side - Notifications & Profile */}
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-gray-100 rounded-lg relative">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center gap-3 hover:bg-gray-50 px-3 py-2 rounded-lg"
          >
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </button>

          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <button className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">
                Profile Settings
              </button>
              <button className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">
                Account Security
              </button>
              <hr className="my-2" />
              <button className="w-full text-left px-4 py-2 hover:bg-red-50 text-sm text-red-600">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
