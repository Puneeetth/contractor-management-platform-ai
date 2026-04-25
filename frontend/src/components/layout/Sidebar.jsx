import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  UserCog,
  FileText,
  Receipt,
  Wallet,
  ShieldCheck,
  LogOut,
  X,
  Sparkles,
} from 'lucide-react'
import { useAuthStore } from '../../hooks/useAuth'

export const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const roleLabel = String(user?.role || '')
    .replace(/_/g, ' ')
    .trim()

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['ADMIN', 'FINANCE', 'MANAGER', 'CONTRACTOR', 'SALES', 'HR', 'GEO_MANAGER', 'BDM'] },
    { icon: Users, label: 'Customers', path: '/customers', roles: ['ADMIN', 'FINANCE', 'MANAGER'] },
    { icon: UserCog, label: 'Contractors', path: '/contractors', roles: ['ADMIN', 'MANAGER'] },
    { icon: FileText, label: 'Contracts', path: '/contracts', roles: ['ADMIN', 'MANAGER'] },
    { icon: Receipt, label: 'POs', path: '/pos', roles: ['ADMIN', 'FINANCE', 'MANAGER'] },
    { icon: Wallet, label: 'Invoices', path: '/invoices', roles: ['ADMIN', 'FINANCE', 'MANAGER', 'CONTRACTOR'] },
    { icon: Wallet, label: 'Expenses', path: '/expenses', roles: ['ADMIN', 'CONTRACTOR', 'MANAGER', 'FINANCE'] },
    { icon: Receipt, label: 'Bank Account', path: '/bank-account', roles: ['CONTRACTOR'] },
  ]

  const systemItems = [
    { icon: ShieldCheck, label: 'Administration', path: '/admin/administration', roles: ['ADMIN'] },
  ]

  const isActive = (path) => location.pathname === path
  const filteredMenuItems = menuItems.filter((item) => user?.role && item.roles.includes(user.role))
  const filteredSystemItems = systemItems.filter((item) => user?.role && item.roles.includes(user.role))

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/35 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen w-[16.5rem] flex-col overflow-hidden border-r border-[#d8dee8] bg-[#eef2f8]
          lg:rounded-r-[30px]
          transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex items-center justify-between px-4 pb-2 pt-8">
          <div className="flex items-center gap-3">
            <div className="flex min-w-0 items-center gap-2 pl-1">
              <h1 className="whitespace-nowrap text-[15px] font-bold leading-none tracking-[-0.01em] text-[#4b4fe8]">Trace</h1>
              {roleLabel && (
                <span className="rounded-md bg-[#dce6ff] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#3c58c9]">
                  {roleLabel}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#64748b] hover:bg-[#e4e9f2] lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-2 pt-3 pb-3">
          <div className="space-y-1">
            {filteredMenuItems.map((item) => {
              const active = isActive(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`
                    flex h-9 items-center gap-2.5 rounded-xl px-3 transition-all
                    ${active ? 'bg-white text-[#4b4fe8] shadow-[0_2px_6px_rgba(15,23,42,0.04)]' : 'text-[#64748b] hover:bg-white/80'}
                  `}
                >
                  <item.icon className={`h-4.5 w-4.5 ${active ? 'text-[#4b4fe8]' : 'text-[#6f7d91]'}`} />
                  <span className="text-[13px] font-medium">{item.label}</span>
                  {item.path === '/pos' && (
                    <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-[#4b4fe8] px-1.5 text-[9px] font-semibold text-white">
                      12
                    </span>
                  )}
                </Link>
              )
            })}
          </div>

          <div className="mt-4 border-t border-[#dde3ec] pt-3">
            {filteredSystemItems.length > 0 && (
              <>
                <p className="mb-2 px-3 text-[10px] font-bold tracking-[0.2em] text-[#8da0b8]">SYSTEM</p>
                <div className="space-y-1">
                  {filteredSystemItems.map((item) => {
                    const active = isActive(item.path)
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className={`
                        flex h-9 items-center gap-2.5 rounded-xl px-3 transition-all
                        ${active ? 'bg-white text-[#4b4fe8] shadow-[0_2px_6px_rgba(15,23,42,0.04)]' : 'text-[#64748b] hover:bg-white/80'}
                      `}
                      >
                        <item.icon className={`h-4.5 w-4.5 ${active ? 'text-[#4b4fe8]' : 'text-[#6f7d91]'}`} />
                        <span className="text-[13px] font-medium">{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </>
            )}

            <div className={`${filteredSystemItems.length > 0 ? 'mt-4 border-t border-[#dde3ec] pt-3' : 'mt-3'}`}>
              <button
                onClick={logout}
                className="flex h-9 w-full items-center gap-2.5 rounded-xl px-3 text-left text-[#cc1b1b] hover:bg-white/80"
              >
                <LogOut className="h-4.5 w-4.5" />
                <span className="text-[14px] font-semibold leading-none">Logout</span>
              </button>
            </div>
          </div>
        </nav>
      </aside>
    </>
  )
}
