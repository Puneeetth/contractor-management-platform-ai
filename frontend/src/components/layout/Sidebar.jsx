import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  FileText, 
  Clock, 
  Receipt, 
  CreditCard, 
  LogOut,
  X,
  Sparkles
} from 'lucide-react'
import { useAuthStore } from '../../hooks/useAuth'

export const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['ADMIN', 'FINANCE', 'MANAGER', 'CONTRACTOR'] },
    { icon: Users, label: 'Customers', path: '/customers', roles: ['ADMIN', 'FINANCE', 'MANAGER'] },
    { icon: Briefcase, label: 'Contractors', path: '/contractors', roles: ['ADMIN', 'MANAGER'] },
    { icon: FileText, label: 'POs', path: '/pos', roles: ['ADMIN', 'FINANCE', 'MANAGER'] },
    { icon: Clock, label: 'Timesheets', path: '/timesheets', roles: ['CONTRACTOR', 'MANAGER', 'FINANCE'] },
    { icon: Receipt, label: 'Invoices', path: '/invoices', roles: ['FINANCE', 'MANAGER'] },
    { icon: CreditCard, label: 'Expenses', path: '/expenses', roles: ['CONTRACTOR', 'MANAGER', 'FINANCE'] },
  ]

  const isActive = (path) => location.pathname === path

  const filteredMenuItems = menuItems.filter(item => 
    user?.role && item.roles.includes(user.role)
  )

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm lg:hidden z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 h-screen w-64 bg-[#0f1219] border-r border-white/[0.06]
        transition-transform duration-300 z-50
        flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header / Brand */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">CMP AI</h1>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 hover:bg-white/[0.06] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* User Profile */}
        <div className="px-4 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email || ''}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {filteredMenuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                ${isActive(item.path)
                  ? 'bg-indigo-500/15 text-indigo-400 border-l-2 border-indigo-400 ml-0'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }
              `}
            >
              <item.icon className={`w-5 h-5 transition-colors ${isActive(item.path) ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/[0.06] p-4 space-y-3">
          {/* Role Badge */}
          <div className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Role</p>
            <p className="text-sm font-semibold text-indigo-400 mt-0.5">{user?.role}</p>
          </div>
          
          {/* Logout */}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}
