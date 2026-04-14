export const validators = {
  isEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  isPhoneNumber: (phone) => {
    const phoneRegex = /^\d{10}$/
    return phoneRegex.test(phone.replace(/\D/g, ''))
  },

  isStrongPassword: (password) => {
    // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    return strongRegex.test(password)
  },

  isNumeric: (value) => {
    return !isNaN(parseFloat(value)) && isFinite(value)
  },

  isPositive: (value) => {
    return Number(value) > 0
  },

  isRequired: (value) => {
    return value !== null && value !== undefined && value.toString().trim() !== ''
  },

  validateField: (fieldName, value, rules) => {
    for (const rule of rules) {
      const error = rule(value)
      if (error) return error
    }
    return null
  },

  // Rule generators
  required: (fieldName) => (value) => 
    !validators.isRequired(value) ? `${fieldName} is required` : null,

  email: () => (value) =>
    value && !validators.isEmail(value) ? 'Invalid email address' : null,

  minLength: (length) => (value) =>
    value && value.length < length ? `Minimum ${length} characters required` : null,

  maxLength: (length) => (value) =>
    value && value.length > length ? `Maximum ${length} characters allowed` : null,

  pattern: (pattern, message) => (value) =>
    value && !pattern.test(value) ? message : null,

  strongPassword: () => (value) =>
    value && !validators.isStrongPassword(value)
      ? 'Password must contain uppercase, lowercase, number and special character'
      : null,

  match: (otherValue) => (value) =>
    value !== otherValue ? 'Fields do not match' : null,
}

export default validators
