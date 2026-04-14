import React, { useState } from 'react'
import { Menu, Search, Bell, User, ChevronDown } from 'lucide-react'
import { useAuthStore } from '../../hooks/useAuth'

export const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuthStore()
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)

  return (
    <nav className="h-16 bg-[#0f1219]/80 backdrop-blur-xl border-b border-white/[0.06] px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Left side - Menu & Search */}
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-white/[0.06] rounded-xl transition-colors"
        >
          <Menu className="w-5 h-5 text-slate-400" />
        </button>
        
        <div className="hidden md:flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] px-4 py-2 rounded-xl w-72">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent outline-none text-sm w-full text-slate-300 placeholder-slate-500"
          />
          <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/[0.06] text-[10px] text-slate-500 font-mono">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right side - Notifications & Profile */}
      <div className="flex items-center gap-3">
        <button className="p-2 hover:bg-white/[0.06] rounded-xl relative transition-colors">
          <Bell className="w-5 h-5 text-slate-400" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full ring-2 ring-[#0f1219]" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center gap-3 hover:bg-white/[0.04] px-3 py-1.5 rounded-xl transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="text-white text-xs font-semibold">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-slate-200">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-500 hidden sm:block" />
          </button>

          {showProfileDropdown && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowProfileDropdown(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-[#1a1f2e] rounded-xl shadow-2xl shadow-black/50 border border-white/[0.06] py-1.5 z-50">
                <div className="px-4 py-3 border-b border-white/[0.06]">
                  <p className="text-sm font-medium text-slate-200">{user?.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
                </div>
                <button className="w-full text-left px-4 py-2.5 hover:bg-white/[0.04] text-sm text-slate-300 transition-colors">
                  Profile Settings
                </button>
                <button className="w-full text-left px-4 py-2.5 hover:bg-white/[0.04] text-sm text-slate-300 transition-colors">
                  Account Security
                </button>
                <div className="border-t border-white/[0.06] my-1" />
                <button 
                  onClick={logout}
                  className="w-full text-left px-4 py-2.5 hover:bg-red-500/10 text-sm text-red-400 transition-colors"
                >
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
