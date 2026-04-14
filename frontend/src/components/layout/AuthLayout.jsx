import React from 'react'

export const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">CMP AI</h1>
          <p className="text-indigo-100">Contractor Management Platform</p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-indigo-100 mt-6 text-sm">
          © 2024 Contractor Management Platform. All rights reserved.
        </p>
      </div>
    </div>
  )
}
