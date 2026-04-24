export const STATUS_BADGES = {
  APPROVED: {
    label: 'Approved',
    variant: 'approved',
    icon: 'CheckCircle',
  },
  REJECTED: {
    label: 'Rejected',
    variant: 'rejected',
    icon: 'XCircle',
  },
  PENDING: {
    label: 'Pending',
    variant: 'pending',
    icon: 'Clock',
  },
  SUBMITTED: {
    label: 'Submitted',
    variant: 'pending',
    icon: 'Upload',
  },
  ACTIVE: {
    label: 'Active',
    variant: 'approved',
    icon: 'CheckCircle',
  },
  UPCOMING: {
    label: 'Upcoming',
    variant: 'pending',
    icon: 'Clock',
  },
  INACTIVE: {
    label: 'Inactive',
    variant: 'rejected',
    icon: 'XCircle',
  },
}

export const ROLES = {
  ADMIN: 'Admin',
  FINANCE: 'Finance',
  MANAGER: 'Manager',
  CONTRACTOR: 'Contractor',
  SALES: 'Sales',
  HR: 'HR',
  GEO_MANAGER: 'GEO Manager',
  BDM: 'BDM',
}

export const ROLE_PERMISSIONS = {
  ADMIN: ['ALL'],
  FINANCE: ['view_customers', 'view_invoices', 'approve_invoices', 'view_expenses', 'approve_expenses'],
  SALES: ['view_customers', 'view_invoices'],
  HR: ['view_contractors', 'view_timesheets'],
  GEO_MANAGER: ['view_dashboard'],
  BDM: ['view_dashboard'],
  MANAGER: ['view_contractors', 'view_timesheets', 'approve_timesheets', 'view_expenses', 'approve_expenses'],
  CONTRACTOR: ['submit_timesheet', 'submit_expense', 'view_invoices'],
}

export const COUNTRY_CURRENCY_MAP = {
  India: 'INR',
  'United States': 'USD',
  Germany: 'EUR',
  'United Kingdom': 'GBP',
  Australia: 'AUD',
  France: 'EUR',
  Italy: 'EUR',
  Spain: 'EUR',
  Netherlands: 'EUR',
  Canada: 'CAD',
  Japan: 'JPY',
  Singapore: 'SGD',
  'United Arab Emirates': 'AED',
  'Saudi Arabia': 'SAR',
  China: 'CNY',
  Brazil: 'BRL',
  Mexico: 'MXN',
  'South Korea': 'KRW',
  Indonesia: 'IDR',
  Malaysia: 'MYR',
  Thailand: 'THB',
  'South Africa': 'ZAR',
  Nigeria: 'NGN',
  Egypt: 'EGP',
  Poland: 'PLN',
  Sweden: 'SEK',
  Switzerland: 'CHF',
}

export const COUNTRIES = Object.keys(COUNTRY_CURRENCY_MAP)

export const CURRENCIES = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'INR', label: 'Indian Rupee (₹)' },
  { value: 'AUD', label: 'Australian Dollar (A$)' },
]

export const PAYMENT_TERMS = [
  { value: 15, label: '15 days' },
  { value: 30, label: '30 days' },
  { value: 45, label: '45 days' },
  { value: 60, label: '60 days' },
  { value: 90, label: '90 days' },
]
