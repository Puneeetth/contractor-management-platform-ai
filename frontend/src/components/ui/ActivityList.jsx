import React from 'react'
import { motion } from 'framer-motion'
import { UserPlus, CheckCircle2, AlertTriangle, FileText } from 'lucide-react'

const ActivityItem = ({ icon: Icon, title, description, timeAgo, role, roleColor }) => (
  <div className="flex items-center justify-between p-4 hover:bg-gray-50/80 rounded-2xl transition-all duration-200 group">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl border border-gray-100 flex items-center justify-center text-gray-500 bg-white group-hover:scale-110 transition-transform">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-gray-800">{title}</h4>
        <p className="text-xs font-medium text-gray-500 mt-0.5">{description}</p>
      </div>
    </div>
    <div className="flex flex-col items-end gap-2">
      <span className="text-[11px] font-bold text-gray-400 capitalize">{timeAgo}</span>
      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ${roleColor}`}>
        {role}
      </span>
    </div>
  </div>
)

const ActivityList = ({ activities }) => {
  return (
    <div className="dashboard-card p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-800">Recent Activity</h3>
        <button className="text-sm font-bold text-[#3a57e8] hover:underline">View Ledger</button>
      </div>
      <div className="flex flex-col gap-2">
        {activities.map((activity, index) => (
          <ActivityItem key={index} {...activity} />
        ))}
      </div>
    </div>
  )
}

export default ActivityList
export { ActivityItem }
