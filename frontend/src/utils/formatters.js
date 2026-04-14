export const formatters = {
  formatDate: (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  },

  formatDateTime: (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  },

  formatCurrency: (value, currency = 'USD') => {
    if (!value) return '$0.00'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(value)
  },

  formatNumber: (value, decimals = 2) => {
    if (!value) return '0'
    return Number(value).toFixed(decimals)
  },

  formatPhoneNumber: (phoneString) => {
    if (!phoneString) return '-'
    const cleaned = phoneString.replace(/\D/g, '')
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }
    return phoneString
  },

  formatHours: (hours) => {
    if (!hours) return '0h'
    const wholeHours = Math.floor(hours)
    const minutes = Math.round((hours - wholeHours) * 60)
    return minutes > 0 ? `${wholeHours}h ${minutes}m` : `${wholeHours}h`
  },

  getStatusColor: (status) => {
    const colors = {
      APPROVED: 'approved',
      REJECTED: 'rejected',
      PENDING: 'pending',
      SUBMITTED: 'pending',
      ACTIVE: 'approved',
      INACTIVE: 'rejected',
    }
    return colors[status] || 'default'
  },

  truncate: (text, length = 50) => {
    if (!text || text.length <= length) return text
    return text.slice(0, length) + '...'
  },

  capitalizeFirstLetter: (text) => {
    if (!text) return ''
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
  },
}

export default formatters
