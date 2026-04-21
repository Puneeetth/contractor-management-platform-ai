import React from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

const StatCard = ({ icon: Icon, label, value, trend, trendUp, colorClass, subLabel }) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="dashboard-card p-6 flex flex-col justify-between"
    >
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-2xl ${colorClass}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-bold ${trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>
            <span>{trend}</span>
            {trendUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          </div>
        )}
        {subLabel && (
          <span className="text-xs font-semibold text-rose-500 bg-rose-50 px-2.5 py-1 rounded-full">
            {subLabel}
          </span>
        )}
      </div>

      <div className="mt-6">
        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-4xl font-bold text-gray-800 mt-2">{value}</p>
      </div>
    </motion.div>
  )
}

export default StatCard
