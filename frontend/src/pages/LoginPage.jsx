import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button, Input, Loader } from '../components/ui'
import { AuthLayout } from '../components/layout'
import { useAuth } from '../hooks/useAuth'
import { authService } from '../services/authService'
import { validators } from '../utils/validators'

const LoginPage = () => {
  const navigate = useNavigate()
  const { login: setAuthData } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!validators.isRequired(formData.email)) {
      newErrors.email = 'Email is required'
    } else if (!validators.isEmail(formData.email)) {
      newErrors.email = 'Invalid email address'
    }

    if (!validators.isRequired(formData.password)) {
      newErrors.password = 'Password is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    setIsLoading(true)
    try {
      // Backend returns JWT token as string
      const token = await authService.login(formData.email, formData.password)
      
      if (token) {
        // Parse JWT to get user info
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
      const errorMessage = error?.error?.message || error?.message || 'Login failed. Please try again.'
      setErrors({
        submit: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
        <p className="text-gray-500 text-sm mb-6">
          Sign in to your account to continue
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.submit && (
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-800">{errors.submit}</p>
            </div>
          )}

          <Input
            label="Email Address"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="you@example.com"
            required
          />

          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            placeholder="••••••••"
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            className="w-full mt-6"
          >
            Sign In
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Don't have an account?{' '}
          <Link to="/signup" className="text-indigo-600 font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  )
}

export default LoginPage
