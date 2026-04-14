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
  Menu,
  X 
} from 'lucide-react'
import { useAuthStore } from '../hooks/useAuth'

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
          className="fixed inset-0 bg-black/50 lg:hidden z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200
        transition-transform duration-300 z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-indigo-600">CMP AI</h1>
            <button
              onClick={onClose}
              className="lg:hidden p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredMenuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${isActive(item.path)
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4 space-y-3">
            <div className="px-4 py-3 rounded-lg bg-gray-50">
              <p className="text-xs text-gray-600">Role</p>
              <p className="text-sm font-semibold text-gray-900">{user?.role}</p>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
