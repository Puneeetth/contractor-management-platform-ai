import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, AlertCircle, User, Mail, Lock, MapPin, Eye, EyeOff } from 'lucide-react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import apiClient from '../../services/apiClient'

const ContractorCreationPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    region: 'US',
    specialization: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [createdContractor, setCreatedContractor] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Contractor name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    } else if (!/[A-Z]/.test(formData.password) || !/[a-z]/.test(formData.password) ||
               !/[0-9]/.test(formData.password) || !/[!@#$%^&*]/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, number & special character'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (!formData.region.trim()) {
      newErrors.region = 'Region is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await apiClient.post('/api/admin/contractors/create', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        region: formData.region,
        specialization: formData.specialization
      })

      setCreatedContractor(response.data)
      setSuccess('Contractor created successfully!')
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        region: 'US',
        specialization: ''
      })
      setErrors({})

      // Reset after 5 seconds
      setTimeout(() => {
        setSuccess('')
        setCreatedContractor(null)
      }, 5000)
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to create contractor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Contractor</h1>
          <p className="text-gray-600">Add a new contractor to the system</p>
        </div>

        {/* Alerts */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </motion.div>
        )}

        {success && !createdContractor && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3"
          >
            <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-emerald-700 text-sm">{success}</p>
          </motion.div>
        )}

        {/* Success Card */}
        {createdContractor && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg"
          >
            <div className="flex items-start gap-3 mb-4">
              <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-900">Contractor Created Successfully!</p>
                <p className="text-sm text-emerald-800 mt-1">The contractor has been created and can login immediately.</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-semibold text-gray-900">{createdContractor.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-semibold text-gray-900">{createdContractor.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Role:</span>
                <span className="font-semibold text-gray-900">Contractor</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="inline-block px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-xs font-semibold">Approved</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-blue-600 px-6 py-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <User className="w-5 h-5" />
              Contractor Details
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contractor Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter contractor name"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white text-gray-900 text-sm transition-all focus:outline-none ${
                    errors.name
                      ? 'border-red-400 focus:ring-2 focus:ring-red-50'
                      : 'border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50'
                  }`}
                />
              </div>
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contractor@example.com"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white text-gray-900 text-sm transition-all focus:outline-none ${
                    errors.email
                      ? 'border-red-400 focus:ring-2 focus:ring-red-50'
                      : 'border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50'
                  }`}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 8 chars with uppercase, lowercase, number & special char"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-lg border bg-white text-gray-900 text-sm transition-all focus:outline-none ${
                    errors.password
                      ? 'border-red-400 focus:ring-2 focus:ring-red-50'
                      : 'border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-lg border bg-white text-gray-900 text-sm transition-all focus:outline-none ${
                    errors.confirmPassword
                      ? 'border-red-400 focus:ring-2 focus:ring-red-50'
                      : 'border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            {/* Region */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Region <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  placeholder="e.g., US, EU, APAC"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white text-gray-900 text-sm transition-all focus:outline-none ${
                    errors.region
                      ? 'border-red-400 focus:ring-2 focus:ring-red-50'
                      : 'border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50'
                  }`}
                />
              </div>
              {errors.region && <p className="text-red-500 text-xs mt-1">{errors.region}</p>}
            </div>

            {/* Specialization */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specialization (Optional)
              </label>
              <input
                type="text"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                placeholder="e.g., Software Development, Cloud Architecture"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm transition-all focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm text-white transition-all ${
                  loading
                    ? 'bg-indigo-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'
                }`}
              >
                {loading ? 'Creating...' : 'Create Contractor'}
              </button>
              <button
                type="reset"
                className="px-6 py-3 rounded-lg font-semibold text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setFormData({
                    name: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    region: 'US',
                    specialization: ''
                  })
                  setErrors({})
                }}
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">Note:</span> Contractors created by admin are directly approved and can login immediately. They will not go through the pending approval process.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ContractorCreationPage
