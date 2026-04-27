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
]

const GEO_REGION_OPTIONS = [
  { value: 'US', label: 'US' },
  { value: 'EU', label: 'EU' },
  { value: 'APAC', label: 'APAC' },
  { value: 'UK', label: 'UK' },
  { value: 'MIDDLE_EAST', label: 'Middle-East' },
]


const DEFAULT_BDM_COUNTRIES = [
  { code: 'IN', name: 'India' },
  { code: 'US', name: 'USA' },
  { code: 'UK', name: 'UK' },
  { code: 'AE', name: 'UAE' },
  { code: 'CA', name: 'Canada' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'AU', name: 'Australia' },
  { code: 'SG', name: 'Singapore' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'JP', name: 'Japan' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
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
  const [showCountryPopup, setShowCountryPopup] = useState(false)

  const isGeoManager = formData.role === 'GEO_MANAGER'
  const isBdm = formData.role === 'BDM'
  const isManagerRole = isGeoManager || isBdm

  const selectedRoleLabel = useMemo(
    () => ROLE_OPTIONS.find((option) => option.value === formData.role)?.label || formData.role,
    [formData.role]
  )
  const availableCountries = countries.length > 0 ? countries : DEFAULT_BDM_COUNTRIES
  const selectedCountryName = availableCountries.find((country) => country.code === formData.country)?.name || ''

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

  useEffect(() => {
    if (!success && !createdUser) return undefined
    const timeoutId = setTimeout(() => {
      setSuccess('')
      setCreatedUser(null)
    }, 5000)
    return () => clearTimeout(timeoutId)
  }, [success, createdUser])

  const handleChange = (e) => {
    const { name, value } = e.target

    if (name === 'role') {
      setShowCountryPopup(false)
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

    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleRegionToggle = (regionValue) => {
    setFormData((prev) => {
      const isSelected = prev.regions.includes(regionValue)
      const nextRegions = isSelected
        ? prev.regions.filter((value) => value !== regionValue)
        : [...prev.regions, regionValue]

      return { ...prev, regions: nextRegions }
    })

    if (errors.regions) {
      setErrors((prev) => ({ ...prev, regions: '' }))
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
      setError(err?.message || 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  const createdCountryName = availableCountries.find((country) => country.code === lastSubmissionMeta.country)?.name

  return (
    <DashboardLayout>
      <div className="w-full px-6 pb-6 pt-2">
        <div className="mb-5 flex items-baseline gap-3">
          <h1 className="text-3xl font-bold leading-none text-gray-900">Administration</h1>
          <p className="text-sm text-gray-600">Create Finance, Sales, HR, GEO Manager, and BDM users from one place.</p>
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
                <div
                  className={`rounded-lg border bg-white p-3 ${errors.regions
                    ? 'border-red-400'
                    : 'border-gray-200'
                    }`}
                >
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {GEO_REGION_OPTIONS.map((region) => (
                      <label
                        key={region.value}
                        className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={formData.regions.includes(region.value)}
                          onChange={() => handleRegionToggle(region.value)}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-200"
                        />
                        {region.label}
                      </label>
                    ))}
                  </div>
                </div>
                {errors.regions && <p className="text-red-500 text-xs mt-1">{errors.regions}</p>}
              </div>
            )}

            {isBdm && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={selectedCountryName}
                      readOnly
                      placeholder="Select a country"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white text-gray-900 text-sm transition-all focus:outline-none ${errors.country
                        ? 'border-red-400 focus:ring-2 focus:ring-red-50'
                        : 'border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50'
                        }`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCountryPopup(true)}
                    className="px-4 py-2.5 rounded-lg border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 text-sm font-medium"
                  >
                    Select
                  </button>
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
      {showCountryPopup && isBdm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Select Country</h3>
              <button
                type="button"
                onClick={() => setShowCountryPopup(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto p-3">
              {availableCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, country: country.code }))
                    setErrors((prev) => ({ ...prev, country: '' }))
                    setShowCountryPopup(false)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${formData.country === country.code
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'hover:bg-gray-100 text-gray-700'
                    }`}
                >
                  {country.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default AdministrationPage
