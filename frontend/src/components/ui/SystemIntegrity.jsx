import React from 'react'
import { motion } from 'framer-motion'

const ProgressBar = ({ label, value, color }) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center justify-between text-xs font-bold text-gray-800">
      <span>{label}</span>
      <span>{value}%</span>
    </div>
    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className={`h-full ${color}`}
      />
    </div>
  </div>
)

const SystemIntegrity = () => {
  return (
    <div className="dashboard-card p-6 flex flex-col gap-8">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#3a57e8] animate-pulse" />
        <h3 className="text-gray-400 font-bold uppercase tracking-wider text-[11px]">System Integrity</h3>
      </div>

      <div className="flex flex-col gap-6">
        <ProgressBar label="Project Completion Rate" value={94.2} color="bg-[#3a57e8]" />
        <ProgressBar label="Compliance Health" value={88.5} color="bg-[#3a57e8]" />
      </div>

      <div className="bg-[#f0f3ff] rounded-2xl p-4 mt-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-loose">
          <span className="text-[#3a57e8] mr-2">PRO TIP:</span>
          You can always write a review for rejecting a invoice
        </p>
      </div>
    </div>
  )
}

export default SystemIntegrity
export { ProgressBar }
