import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { authService } from '../services/authService'
import { validators } from '../utils/validators'
import { ArrowRight, Sparkles } from 'lucide-react'

const LoginPage = () => {
  const navigate = useNavigate()
  const { login: setAuthData } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [rememberMe, setRememberMe] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '' })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const newErrors = {}
    if (!validators.isRequired(formData.email)) newErrors.email = 'Email is required'
    else if (!validators.isEmail(formData.email)) newErrors.email = 'Invalid email address'
    if (!validators.isRequired(formData.password)) newErrors.password = 'Password is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setIsLoading(true)
    try {
      const token = await authService.login(formData.email, formData.password)
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const user = {
          id: payload.userId || payload.id,
          email: payload.email || formData.email,
          name: payload.name || 'User',
          role: payload.role,
          status: payload.status,
        }
        setAuthData(user, token)
        navigate('/dashboard')
      }
    } catch (error) {
      setErrors({ submit: error?.error?.message || error?.message || 'Login failed. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = (role) => {
    const roleNames = { ADMIN: 'Admin', CONTRACTOR: 'Contractor', CUSTOMER: 'Client', FINANCE: 'Finance' }
    setAuthData(
      { id: Math.floor(Math.random() * 1000) + 1, email: `${role.toLowerCase()}@cmp.ai`, name: `Demo ${roleNames[role]}`, role: role, status: 'ACTIVE' },
      'demo-token-12345'
    )
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Panel - Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 md:px-16 lg:px-20 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Brand Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">Welcome Back !</h1>
          <p className="text-gray-400 text-center text-sm mb-8">Please enter your details</p>

          {/* Error Alert */}
          {errors.submit && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 rounded-xl border border-red-200">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <input
                type="email" name="email" value={formData.email} onChange={handleChange}
                placeholder=""
                className={`w-full px-4 py-3 rounded-lg border bg-white text-gray-900 text-sm transition-all focus:outline-none
                  ${errors.email ? 'border-red-400 focus:ring-2 focus:ring-red-100' : 'border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50'}`}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password" name="password" value={formData.password} onChange={handleChange}
                placeholder=""
                className={`w-full px-4 py-3 rounded-lg border bg-white text-gray-900 text-sm transition-all focus:outline-none
                  ${errors.password ? 'border-red-400 focus:ring-2 focus:ring-red-100' : 'border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50'}`}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Remember me / Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                <span className="text-sm text-gray-500">Remember me</span>
              </label>
              <button type="button" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
                Forgot Password?
              </button>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col gap-3">
              <button
                type="submit" disabled={isLoading}
                className={`w-full py-3 px-4 rounded-lg font-semibold text-sm text-white transition-all duration-200 flex items-center justify-center gap-2
                  ${isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] shadow-lg shadow-indigo-200'}`}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Signing in...
                  </span>
                ) : (
                  <>Login <ArrowRight className="w-4 h-4" /></>
                )}
              </button>

              <div className="pt-2">
                <p className="text-xs text-center text-gray-400 mb-2 font-medium">Quick Demo Access</p>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => handleDemoLogin('ADMIN')} className="py-2 px-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-100/50">Admin</button>
                  <button type="button" onClick={() => handleDemoLogin('CONTRACTOR')} className="py-2 px-1 text-[11px] font-semibold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100/50">Contractor</button>
                  <button type="button" onClick={() => handleDemoLogin('CUSTOMER')} className="py-2 px-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-100/50">Client</button>
                  <button type="button" onClick={() => handleDemoLogin('FINANCE')} className="py-2 px-1 text-[11px] font-semibold text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors border border-purple-100/50">Finance</button>
                </div>
              </div>
            </div>
          </form>

          {/* Terms */}
          <p className="text-xs text-gray-400 text-center mt-6 leading-relaxed">
            By creating an account, you agree to our{' '}
            <span className="text-indigo-600 cursor-pointer hover:underline">Terms of Service</span> and{' '}
            <span className="text-indigo-600 cursor-pointer hover:underline">Privacy Policy</span>
          </p>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-gray-500 mt-4">
            Don't have an account?{' '}
            <Link to="/signup" className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">
              Sign Up
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right Panel - Purple Illustration */}
      <div className="hidden lg:flex lg:w-[50%] bg-gradient-to-br from-indigo-500 to-indigo-600 relative overflow-hidden items-center justify-center p-10">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-10 right-10 w-72 h-52 border border-white/30 rounded-2xl" />
          <div className="absolute top-20 right-16 w-60 h-44 border border-white/20 rounded-xl" />
          <div className="absolute bottom-20 left-10 w-32 h-32 border border-white/20 rounded-full" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-lg">
          {/* Dashboard Preview Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-4 mb-6 shadow-2xl">
            <img
              src="/images/login-illustration.png"
              alt="Seamless work experience"
              className="w-full h-auto rounded-xl"
            />
          </div>

          {/* Text */}
          <h2 className="text-2xl font-bold text-white mb-2">Seamless work experience</h2>
          <p className="text-indigo-100 text-sm">Everything you need in an easily customizable dashboard</p>

          {/* Pagination dots */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <div className="w-8 h-2 rounded-full bg-white" />
            <div className="w-2 h-2 rounded-full bg-white/40" />
            <div className="w-2 h-2 rounded-full bg-white/40" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
