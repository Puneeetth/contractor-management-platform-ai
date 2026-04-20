import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, AlertCircle, UserPlus, Mail, Lock, MapPin, Eye, EyeOff, Briefcase } from 'lucide-react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import apiClient from '../../services/apiClient'

const ROLE_OPTIONS = [
  { value: 'FINANCE', label: 'Finance' },
  { value: 'SALES', label: 'Sales' },
  { value: 'HR', label: 'HR' },
  { value: 'GEO_MANAGER', label: 'GEO Manager' },
  { value: 'BDM', label: 'BDM' },
   { value: 'CONTRACTOR', label: 'Contractor' },

]

const GEO_REGION_OPTIONS = [
  { value: 'US', label: 'US' },
  { value: 'EU', label: 'EU' },
  { value: 'APAC', label: 'APAC' },
]

const INITIAL_FORM_DATA = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'FINANCE',
  region: 'US',
  regions: [],
  country: '',
  contractorId: ''
}

const AdministrationPage = () => {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [createdUser, setCreatedUser] = useState(null)
  const [countries, setCountries] = useState([])
  const [lastSubmissionMeta, setLastSubmissionMeta] = useState({ regions: [], country: '' })

  const isGeoManager = formData.role === 'GEO_MANAGER'
  const isBdm = formData.role === 'BDM'
  const isManagerRole = isGeoManager || isBdm
  const isContractor = formData.role === 'CONTRACTOR'

  const selectedRoleLabel = useMemo(
    () => ROLE_OPTIONS.find((option) => option.value === formData.role)?.label || formData.role,
    [formData.role]
  )

  useEffect(() => {
    const loadCountries = async () => {
      try {
        const response = await apiClient.get('/countries')
        setCountries(Array.isArray(response) ? response : [])
      } catch { 
        setCountries([])
      }
    }

    loadCountries()
  }, [])

  const handleChange = (e) => {
    const { name, value, options } = e.target

    if (name === 'role') {
      setFormData((prev) => ({
        ...prev,
        role: value,
        region: ['GEO_MANAGER', 'BDM'].includes(value) ? '' : prev.region || 'US',
        regions: value === 'GEO_MANAGER' ? prev.regions : [],
        country: value === 'BDM' ? prev.country : '',
      }))
      setErrors((prev) => ({ ...prev, role: '', region: '', regions: '', country: '' }))
      return
    }

    if (name === 'regions') {
      const selectedRegions = Array.from(options)
        .filter((option) => option.selected)
        .map((option) => option.value)

      setFormData((prev) => ({ ...prev, regions: selectedRegions }))
      if (errors.regions) {
        setErrors((prev) => ({ ...prev, regions: '' }))
      }
      return
    }

    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
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
    } else if (
      !/[A-Z]/.test(formData.password) ||
      !/[a-z]/.test(formData.password) ||
      !/[0-9]/.test(formData.password) ||
      !/[!@#$%^&*]/.test(formData.password)
    ) {
      newErrors.password = 'Password must contain uppercase, lowercase, number & special character'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (isGeoManager && formData.regions.length === 0) {
      newErrors.regions = 'At least one region is required'
    }

    if (isBdm && !formData.country.trim()) {
      newErrors.country = 'Country is required'
    }

    if (!isManagerRole && !formData.region.trim()) {
      newErrors.region = 'Region is required'
    }
    if (isContractor && !formData.contractorId.trim()) {
  newErrors.contractorId = 'Contractor ID is required'
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
      const response = await apiClient.post('/admin/users/create', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        region: isManagerRole ? '' : formData.region,
        regions: isGeoManager ? formData.regions : [],
        country: isBdm ? formData.country : '',
        contractorId: isContractor ? formData.contractorId : '',
      })

      setCreatedUser(response)
      setLastSubmissionMeta({
        regions: [...formData.regions],
        country: formData.country,
      })
      setSuccess(`${selectedRoleLabel} user created successfully!`)
      setFormData(INITIAL_FORM_DATA)
      setErrors({})
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  const createdCountryName = countries.find((country) => country.code === lastSubmissionMeta.country)?.name

  return (
    <DashboardLayout>
      <div className="p-6 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Administration</h1>
          <p className="text-gray-600">Create Finance, Sales, HR, GEO Manager, and BDM users from one place.</p>
        </div>

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

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3"
          >
            <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-emerald-700 text-sm">{success}</p>
          </motion.div>
        )}

        {createdUser && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg"
          >
            <div className="flex items-start gap-3 mb-4">
              <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-900">User Created Successfully</p>
                <p className="text-sm text-emerald-800 mt-1">The new user can log in immediately.</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-semibold text-gray-900">{createdUser.name}</span>
              </div>
             
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-semibold text-gray-900">{createdUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Role:</span>
                <span className="font-semibold text-gray-900">{createdUser.role}</span>
              </div>
              {createdUser.role === 'GEO_MANAGER' && lastSubmissionMeta.regions.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Regions:</span>
                  <span className="font-semibold text-gray-900">{lastSubmissionMeta.regions.join(', ')}</span>
                </div>
              )}
              {createdUser.role === 'BDM' && createdCountryName && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Country:</span>
                  <span className="font-semibold text-gray-900">{createdCountryName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="inline-block px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-xs font-semibold">
                  Approved
                </span>
              </div>
            </div>
          </motion.div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-blue-600 px-6 py-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Add Administrative User
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm transition-all focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
              {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white text-gray-900 text-sm transition-all focus:outline-none ${errors.name
                    ? 'border-red-400 focus:ring-2 focus:ring-red-50'
                    : 'border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50'
                    }`}
                />
              </div>
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            {/* Contractor ID */}
{isContractor && (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Contractor ID <span className="text-red-500">*</span>
    </label>
    <input
      type="text"
      name="contractorId"
      value={formData.contractorId}
      onChange={handleChange}
      placeholder="Enter unique contractor ID"
      className={`w-full px-4 py-2.5 rounded-lg border bg-white text-gray-900 text-sm transition-all focus:outline-none ${
        errors.contractorId
          ? 'border-red-400 focus:ring-2 focus:ring-red-50'
          : 'border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50'
      }`}
    />
    {errors.contractorId && (
      <p className="text-red-500 text-xs mt-1">{errors.contractorId}</p>
    )}
  </div>
)}

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
                  placeholder="user@example.com"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white text-gray-900 text-sm transition-all focus:outline-none ${errors.email
                    ? 'border-red-400 focus:ring-2 focus:ring-red-50'
                    : 'border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50'
                    }`}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    placeholder="Strong password"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-lg border bg-white text-gray-900 text-sm transition-all focus:outline-none ${errors.password
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
                    placeholder="Re-enter password"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-lg border bg-white text-gray-900 text-sm transition-all focus:outline-none ${errors.confirmPassword
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
            </div>

            {isGeoManager && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Regions <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-4 w-4 h-4 text-gray-400" />
                  <select
                    multiple
                    name="regions"
                    value={formData.regions}
                    onChange={handleChange}
                    className={`w-full min-h-32 pl-10 pr-4 py-2.5 rounded-lg border bg-white text-gray-900 text-sm transition-all focus:outline-none ${errors.regions
                      ? 'border-red-400 focus:ring-2 focus:ring-red-50'
                      : 'border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50'
                      }`}
                  >
                    {GEO_REGION_OPTIONS.map((region) => (
                      <option key={region.value} value={region.value}>{region.label}</option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple regions.</p>
                {errors.regions && <p className="text-red-500 text-xs mt-1">{errors.regions}</p>}
              </div>
            )}

            {isBdm && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white text-gray-900 text-sm transition-all focus:outline-none ${errors.country
                      ? 'border-red-400 focus:ring-2 focus:ring-red-50'
                      : 'border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50'
                      }`}
                  >
                    <option value="">Select a country</option>
                    {countries.map((country) => (
                      <option key={country.code} value={country.code}>{country.name}</option>
                    ))}
                  </select>
                </div>
                {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
              </div>
            )}

            {!isManagerRole && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Region <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="region"
                    value={formData.region}
                    onChange={handleChange}
                    placeholder="US"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white text-gray-900 text-sm transition-all focus:outline-none ${errors.region
                      ? 'border-red-400 focus:ring-2 focus:ring-red-50'
                      : 'border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50'
                      }`}
                  />
                </div>
                {errors.region && <p className="text-red-500 text-xs mt-1">{errors.region}</p>}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                {loading ? 'Creating...' : isManagerRole ? 'Create Manager' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AdministrationPage
