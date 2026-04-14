import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button, Input, Select } from '../components/ui'
import { AuthLayout } from '../components/layout'
import { useAuth } from '../hooks/useAuth'
import { authService } from '../services/authService'
import { validators } from '../utils/validators'
import { ROLES } from '../constants'

const SignupPage = () => {
  const navigate = useNavigate()
  const { login: setAuthData } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'CONTRACTOR',
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

    if (!validators.isRequired(formData.name)) {
      newErrors.name = 'Full name is required'
    }

    if (!validators.isRequired(formData.email)) {
      newErrors.email = 'Email is required'
    } else if (!validators.isEmail(formData.email)) {
      newErrors.email = 'Invalid email address'
    }

    if (!validators.isRequired(formData.password)) {
      newErrors.password = 'Password is required'
    } else if (!validators.isStrongPassword(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, number and special character'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    setIsLoading(true)
    try {
      const response = await authService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        region: 'US', // Default region - can be extended later
      })
      
      // Backend returns confirmation message
      if (response) {
        // Registration successful - user now needs admin approval
        setSuccessMessage('Registration successful! Your account is awaiting admin approval. You will be notified once approved.')
        setErrors({})
        // Clear form
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'CONTRACTOR',
        })
        // Redirect to login after 3 seconds
        setTimeout(() => navigate('/login'), 3000)
      }
    } catch (error) {
      const errorMessage = error?.error?.message || error?.message || 'Registration failed. Please try again.'
      setErrors({
        submit: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const roleOptions = Object.entries(ROLES).map(([key, value]) => ({
    value: key,
    label: value,
  }))

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h2>
        <p className="text-gray-500 text-sm mb-6">
          Join our platform to get started
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.submit && (
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-800">{errors.submit}</p>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          )}

          <Input
            label="Full Name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="John Doe"
            required
          />

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

          <Select
            label="Role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            options={roleOptions}
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

          <Input
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
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
            Create Account
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  )
}

export default SignupPage
