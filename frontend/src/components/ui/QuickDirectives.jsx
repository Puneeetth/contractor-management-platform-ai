import React from 'react'
import { motion } from 'framer-motion'
import { Plus, CheckSquare, Download, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const QuickDirectives = () => {
  const navigate = useNavigate()

  const directives = [
    {
      icon: Plus,
      label: 'Onboard Contractor',
      color: 'bg-[#3a57e8]',
      textColor: 'text-white',
      showArrow: true,
      onClick: () => navigate('/admin/contractors/create')
    },
    {
      icon: CheckSquare,
      label: 'Approve Timesheets',
      color: 'bg-[#e9ecef]',
      textColor: 'text-gray-700',
      showArrow: true,
      onClick: () => navigate('/admin/pending-approvals')
    },
    {
      icon: Download,
      label: 'Export Audit Log',
      color: 'bg-[#e9ecef]',
      textColor: 'text-gray-700',
      showArrow: false,
      onClick: () => alert('Export started.')
    },
  ]

  return (
    <div className="dashboard-card p-6">
      <h3 className="text-gray-400 font-bold uppercase tracking-wider text-sm mb-6">Quick Directives</h3>
      <div className="flex flex-col gap-3">
        {directives.map((item, index) => (
          <motion.button
            key={index}
            whileHover={{ x: 5 }}
            onClick={item.onClick}
            className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${item.color}`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-lg bg-white/20`}>
                <item.icon className={`w-5 h-5 ${item.color === 'bg-[#e9ecef]' ? 'text-gray-600' : 'text-white'}`} />
              </div>
              <span className={`font-bold text-sm ${item.textColor}`}>{item.label}</span>
            </div>
            {item.showArrow ? (
              <ChevronRight className={`w-5 h-5 ${item.textColor === 'text-white' ? 'text-white' : 'text-gray-400'}`} />
            ) : (
                <Download className="w-5 h-5 text-gray-400" />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

export default QuickDirectives
