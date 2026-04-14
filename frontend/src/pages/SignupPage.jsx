import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { authService } from '../services/authService'
import { validators } from '../utils/validators'
import { ROLES } from '../constants'
import { Mail, Lock, Eye, EyeOff, User, CheckCircle, Sparkles } from 'lucide-react'

const SignupPage = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '', role: 'CONTRACTOR',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const newErrors = {}
    if (!validators.isRequired(formData.name)) newErrors.name = 'Full name is required'
    if (!validators.isRequired(formData.email)) newErrors.email = 'Email is required'
    else if (!validators.isEmail(formData.email)) newErrors.email = 'Invalid email address'
    if (!validators.isRequired(formData.password)) newErrors.password = 'Password is required'
    else if (!validators.isStrongPassword(formData.password)) newErrors.password = 'Min 8 chars with uppercase, lowercase, number & special char'
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setIsLoading(true)
    try {
      const response = await authService.register({
        name: formData.name, email: formData.email, password: formData.password, role: formData.role, region: 'US',
      })
      if (response) {
        setSuccessMessage('Registration successful! Awaiting admin approval.')
        setErrors({})
        setFormData({ name: '', email: '', password: '', confirmPassword: '', role: 'CONTRACTOR' })
        setTimeout(() => navigate('/login'), 3000)
      }
    } catch (error) {
      setErrors({ submit: error?.error?.message || error?.message || 'Registration failed.' })
    } finally {
      setIsLoading(false)
    }
  }

  const roleOptions = Object.entries(ROLES).map(([key, value]) => ({ value: key, label: value }))

  // Orbiting icons data (service logos represented as colored circles with letters)
  const orbitIcons = [
    { letter: 'C', bg: 'bg-indigo-500', size: 'w-14 h-14', orbit: 0, angle: 0, text: 'text-lg' },
    { letter: 'T', bg: 'bg-blue-500', size: 'w-9 h-9', orbit: 1, angle: 0 },
    { letter: 'I', bg: 'bg-emerald-500', size: 'w-9 h-9', orbit: 1, angle: 72 },
    { letter: 'E', bg: 'bg-amber-500', size: 'w-9 h-9', orbit: 1, angle: 144 },
    { letter: 'P', bg: 'bg-purple-500', size: 'w-9 h-9', orbit: 1, angle: 216 },
    { letter: 'D', bg: 'bg-rose-500', size: 'w-9 h-9', orbit: 1, angle: 288 },
    { letter: 'M', bg: 'bg-cyan-500', size: 'w-8 h-8', orbit: 2, angle: 30 },
    { letter: 'R', bg: 'bg-orange-500', size: 'w-8 h-8', orbit: 2, angle: 110 },
    { letter: 'F', bg: 'bg-teal-500', size: 'w-8 h-8', orbit: 2, angle: 190 },
    { letter: 'A', bg: 'bg-pink-500', size: 'w-8 h-8', orbit: 2, angle: 270 },
  ]

  const getOrbitPosition = (angle, radius) => {
    const rad = (angle * Math.PI) / 180
    return { x: Math.cos(rad) * radius, y: Math.sin(rad) * radius }
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Panel - Form */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Top Brand Bar */}
        <div className="px-8 py-5 flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-800 text-sm">CMP AI</span>
        </div>

        {/* Dot grid decoration */}
        <div className="px-8 relative">
          <div className="absolute top-0 right-0 w-40 h-20 opacity-[0.06]" style={{
            backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)',
            backgroundSize: '12px 12px',
          }} />
        </div>

        {/* Form content */}
        <div className="flex-1 flex items-center justify-center px-6 md:px-12 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md"
          >
            {/* Icon */}
            <div className="flex justify-center mb-5">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
                <User className="w-6 h-6 text-indigo-600" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">Create your account!</h1>
            <p className="text-gray-400 text-center text-sm mb-7">Enter your details to get started</p>

            {/* Alerts */}
            {errors.submit && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 bg-red-50 rounded-xl border border-red-200">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </motion.div>
            )}
            {successMessage && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <p className="text-sm text-emerald-700">{successMessage}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="John Doe"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white text-gray-900 text-sm transition-all focus:outline-none ${errors.name ? 'border-red-400 focus:ring-2 focus:ring-red-50' : 'border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50'}`} />
                </div>
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="eg. pixelcat@gmail.com"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white text-gray-900 text-sm transition-all focus:outline-none ${errors.email ? 'border-red-400 focus:ring-2 focus:ring-red-50' : 'border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50'}`} />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
                <select name="role" value={formData.role} onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm appearance-none focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50">
                  {roleOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="••••••••••••"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-lg border bg-white text-gray-900 text-sm transition-all focus:outline-none ${errors.password ? 'border-red-400 focus:ring-2 focus:ring-red-50' : 'border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50'}`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••••••"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-lg border bg-white text-gray-900 text-sm transition-all focus:outline-none ${errors.confirmPassword ? 'border-red-400 focus:ring-2 focus:ring-red-50' : 'border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50'}`} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                <span className="text-xs text-gray-500">I agree to the Terms of Service and Privacy Policy</span>
              </div>

              {/* Submit */}
              <button type="submit" disabled={isLoading}
                className={`w-full py-3 px-4 rounded-lg font-semibold text-sm text-white transition-all duration-200
                  ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] shadow-lg shadow-blue-200'}`}>
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Creating account...
                  </span>
                ) : 'Create Account'}
              </button>
            </form>

            {/* Social Login */}
            <div className="mt-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">Or sign up with</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <div className="flex gap-3">
                {/* Google */}
                <button className="flex-1 flex items-center justify-center py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </button>
                {/* Apple */}
                <button className="flex-1 flex items-center justify-center py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                </button>
                {/* Microsoft */}
                <button className="flex-1 flex items-center justify-center py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <rect x="1" y="1" width="10" height="10" fill="#F25022" rx="1" />
                    <rect x="13" y="1" width="10" height="10" fill="#7FBA00" rx="1" />
                    <rect x="1" y="13" width="10" height="10" fill="#00A4EF" rx="1" />
                    <rect x="13" y="13" width="10" height="10" fill="#FFB900" rx="1" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Login Link */}
            <p className="text-center text-sm text-gray-500 mt-5 pb-6">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">Sign in</Link>
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Orbiting Icons (pic-2 style) */}
      <div className="hidden lg:flex lg:w-[48%] bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50 relative overflow-hidden items-center justify-center border-l border-gray-100">
        {/* Concentric circles */}
        <div className="relative w-80 h-80">
          {/* Orbit rings */}
          <div className="absolute inset-0 rounded-full border border-blue-200/40" />
          <div className="absolute inset-[-40px] rounded-full border border-blue-200/30" style={{ top: '-40px', left: '-40px', right: '-40px', bottom: '-40px' }} />
          <div className="absolute rounded-full border border-blue-200/20" style={{ top: '-90px', left: '-90px', right: '-90px', bottom: '-90px' }} />
          <div className="absolute rounded-full border border-dashed border-blue-200/25" style={{ top: '-140px', left: '-140px', right: '-140px', bottom: '-140px' }} />

          {/* Center icon */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200 z-10">
            <Sparkles className="w-8 h-8 text-white" />
          </div>

          {/* Orbit 1 icons */}
          {[0, 72, 144, 216, 288].map((angle, i) => {
            const pos = getOrbitPosition(angle, 110)
            const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-rose-500', 'bg-purple-500']
            const labels = ['C', 'T', 'I', 'E', 'P']
            return (
              <motion.div
                key={`o1-${i}`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1, type: 'spring' }}
                className={`absolute w-10 h-10 ${colors[i]} rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-lg z-10`}
                style={{ top: `calc(50% + ${pos.y}px - 20px)`, left: `calc(50% + ${pos.x}px - 20px)` }}
              >
                {labels[i]}
              </motion.div>
            )
          })}

          {/* Orbit 2 icons */}
          {[20, 90, 160, 230, 300].map((angle, i) => {
            const pos = getOrbitPosition(angle, 170)
            const colors = ['bg-cyan-400', 'bg-orange-400', 'bg-teal-500', 'bg-pink-400', 'bg-indigo-400']
            const labels = ['M', 'R', 'F', 'A', 'D']
            return (
              <motion.div
                key={`o2-${i}`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + i * 0.1, type: 'spring' }}
                className={`absolute w-8 h-8 ${colors[i]} rounded-lg flex items-center justify-center text-white font-bold text-[10px] shadow-md z-10`}
                style={{ top: `calc(50% + ${pos.y}px - 16px)`, left: `calc(50% + ${pos.x}px - 16px)` }}
              >
                {labels[i]}
              </motion.div>
            )
          })}
        </div>

        {/* Bottom text */}
        <div className="absolute bottom-12 left-0 right-0 text-center px-8">
          <p className="text-gray-600 text-sm leading-relaxed">
            Compatible with <em className="font-semibold text-gray-800">Contracts, Invoices, Timesheets</em> and most{' '}
            <em className="font-semibold text-gray-800">management tools</em> for a smooth experience.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="w-8 h-2 rounded-full bg-indigo-500" />
            <div className="w-2 h-2 rounded-full bg-indigo-300" />
            <div className="w-2 h-2 rounded-full bg-indigo-200" />
          </div>
        </div>

        {/* Top right heading */}
        <div className="absolute top-10 left-0 right-0 text-center">
          <h2 className="text-2xl font-bold text-gray-800">
            Manage Better <span className="text-indigo-600">Everywhere</span>
          </h2>
        </div>
      </div>
    </div>
  )
}

export default SignupPage
