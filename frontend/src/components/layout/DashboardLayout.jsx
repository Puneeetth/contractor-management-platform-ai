import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'

export const DashboardLayout = ({ children }) => {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isTopbarPage = location.pathname === '/dashboard'

  return (
    <div className="flex h-screen bg-[#f3f4fb]">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-[264px]">
        {isTopbarPage ? (
          <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        ) : (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-xl border border-gray-200 bg-white/90 backdrop-blur-sm shadow-sm"
            aria-label="Open menu"
            title="Open menu"
          >
            <Menu className="w-5 h-5 text-gray-700" />
          </button>
        )}
        
        <main className="flex-1 overflow-y-auto">
          <div className={isTopbarPage ? 'p-5' : 'p-5 pt-4'}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
