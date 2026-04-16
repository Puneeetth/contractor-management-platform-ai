import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, CheckCircle, AlertCircle, Home } from 'lucide-react'

const PendingApprovalPage = () => {
  const navigate = useNavigate()
  const [checkingStatus] = useState(false)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Top Bar */}
          <div className="bg-gradient-to-r from-indigo-500 to-blue-600 px-6 py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="flex justify-center mb-4"
            >
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Clock className="w-8 h-8 text-white" />
              </div>
            </motion.div>
            <h1 className="text-2xl font-bold text-white text-center">Registration Submitted</h1>
          </div>

          {/* Content */}
          <div className="px-6 py-8">
            {/* Status Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-lg mb-6"
            >
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900 mb-1">Awaiting Admin Approval</p>
                  <p className="text-sm text-amber-800">
                    Your registration has been submitted successfully. Our admin team will review your details and approve your account shortly.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Timeline */}
            <div className="space-y-4 mb-8">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="w-0.5 h-12 bg-gray-200 my-1" />
                </div>
                <div className="py-2">
                  <p className="font-semibold text-gray-900">Registration Complete</p>
                  <p className="text-sm text-gray-500">Your account has been created</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-blue-600 animate-spin" />
                  </div>
                  <div className="w-0.5 h-12 bg-gray-200 my-1" />
                </div>
                <div className="py-2">
                  <p className="font-semibold text-gray-900">Awaiting Approval</p>
                  <p className="text-sm text-gray-500">Our admin is reviewing your application</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-gray-400" />
                  </div>
                </div>
                <div className="py-2">
                  <p className="font-semibold text-gray-900">Account Activated</p>
                  <p className="text-sm text-gray-500">You'll be able to login after approval</p>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-blue-900">What happens next?</span>
                <br />
                You will receive an email notification once your account has been approved. After approval, you can login with your credentials.
              </p>
            </div>

            {/* Buttons */}
            <div className="space-y-3">
              <button
                disabled={checkingStatus}
                onClick={() => navigate('/login')}
                className="w-full py-3 px-4 rounded-lg font-semibold text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Go to Login
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 px-4 rounded-lg font-semibold text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Back to Home
              </button>
            </div>

            {/* Footer Text */}
            <p className="text-center text-xs text-gray-500 mt-6">
              Typical approval time: <span className="font-semibold">1-2 business hours</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default PendingApprovalPage
