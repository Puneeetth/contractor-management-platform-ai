import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  DollarSign,
  AlertCircle,
  Clock,
  Upload,
  Building,
  ChevronRight,
  CheckCircle2,
  ClipboardList,
  Calendar,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import { DashboardLayout } from '../components/layout'
import { dashboardService } from '../services/dashboardService'
import { contractService } from '../services/contractService'
import { invoiceService } from '../services/invoiceService'
import { useAuthStore } from '../hooks/useAuth'

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const STATUS_BADGE_CONFIG = {
  Active: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  Expired: 'bg-red-50 text-red-700 border border-red-200',
  Paid: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
}

// ─── Summary Card ───────────────────────────────────────────────
const SummaryCard = ({ icon: Icon, title, value, sublabel, accentColor = 'blue' }) => {
  const accentMap = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', iconBg: 'bg-blue-100' },
    yellow: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', iconBg: 'bg-amber-100' },
    green: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', iconBg: 'bg-emerald-100' },
  }
  const colors = accentMap[accentColor] || accentMap.blue

  return (
    <div className={`rounded-2xl border ${colors.border} bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors.iconBg}`}>
          <Icon className={`h-6 w-6 ${colors.text}`} />
        </div>
      </div>
      <div className="mt-4">
        <p className={`text-3xl font-bold tracking-tight ${colors.text}`}>{value}</p>
        <p className="mt-1 text-sm font-semibold text-gray-800">{title}</p>
        <p className="mt-0.5 text-xs text-gray-500">{sublabel}</p>
      </div>
    </div>
  )
}

// ─── Earnings Line Chart (pure SVG, no external deps) ───────────
const EarningsChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="text-center">
          <DollarSign className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-500">No earnings data available</p>
          <p className="mt-1 text-xs text-gray-400">Earnings will appear once invoices are approved</p>
        </div>
      </div>
    )
  }

  const maxVal = Math.max(...data.map((d) => d.earnings))
  const minVal = Math.min(...data.map((d) => d.earnings))
  const range = maxVal - minVal || 1
  const padding = { top: 20, right: 20, bottom: 40, left: 60 }
  const width = 600
  const height = 280
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartW,
    y: padding.top + chartH - ((d.earnings - minVal) / range) * chartH,
    ...d,
  }))

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => {
    const val = minVal + range * t
    const y = padding.top + chartH - t * chartH
    return { val, y, label: formatCurrency(val) }
  })

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Earnings Overview</h3>
          <p className="text-xs text-gray-400">Last 6 months performance</p>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        <defs>
          <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
        {yTicks.map((tick, i) => (
          <g key={i}>
            <line x1={padding.left} y1={tick.y} x2={width - padding.right} y2={tick.y} stroke="#f1f5f9" strokeWidth="1" />
            <text x={padding.left - 8} y={tick.y + 4} textAnchor="end" className="fill-gray-400" fontSize="10">
              {tick.label}
            </text>
          </g>
        ))}
        <path d={areaPath} fill="url(#earningsGrad)" />
        <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="white" stroke="#6366f1" strokeWidth="2" />
            <text x={p.x} y={padding.top + chartH + 24} textAnchor="middle" className="fill-gray-500" fontSize="11">
              {p.month}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

// ─── Your Actions Panel ──────────────────────────────────────
const PendingActions = () => {
  const actions = [
    { label: 'Create Invoice', icon: FileText, gradient: 'from-blue-500 to-blue-600', hoverShadow: 'hover:shadow-blue-200', href: '/invoices' },
    { label: 'Submit Timesheet', icon: Clock, gradient: 'from-amber-500 to-amber-600', hoverShadow: 'hover:shadow-amber-200', href: '/timesheets' },
    { label: 'Upload PO', icon: Upload, gradient: 'from-emerald-500 to-emerald-600', hoverShadow: 'hover:shadow-emerald-200', href: '/pos' },
    { label: 'Update Bank Details', icon: Building, gradient: 'from-slate-500 to-slate-600', hoverShadow: 'hover:shadow-slate-200', href: '/bank-account' },
  ]
  const navigate = useNavigate()
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
          <ClipboardList className="h-4 w-4 text-indigo-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Your Actions</h3>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.label}
              onClick={() => navigate(action.href)}
              className={`group flex flex-col items-center gap-2 rounded-2xl bg-gradient-to-br ${action.gradient} px-5 py-5 text-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${action.hoverShadow}`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 transition-transform group-hover:scale-110">
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold">{action.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Active Contracts Table ─────────────────────────────────────
const ActiveContractsTable = ({ contracts }) => {
  const navigate = useNavigate()

  if (!contracts || contracts.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="text-center">
          <FileText className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-500">No contracts available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Active Contracts</h3>
          <p className="text-xs text-gray-400">{contracts.length} total contracts</p>
        </div>
        <button className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
          View All <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-50 bg-gray-50/50">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Contract Name</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Client</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Rate</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">End Date</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((contract) => (
              <tr
                key={contract.id}
                onClick={() => navigate(`/contracts/${contract.id}`)}
                className="cursor-pointer border-b border-gray-50 transition-colors hover:bg-indigo-50/40 last:border-b-0"
              >
                <td className="px-5 py-3.5">
                  <p className="text-sm font-medium text-gray-900">{contract.name || contract.title || 'Unnamed Contract'}</p>
                </td>
                <td className="px-5 py-3.5">
                  <p className="text-sm text-gray-600">{contract.client || contract.clientName || '—'}</p>
                </td>
                <td className="px-5 py-3.5">
                  <p className="text-sm font-semibold text-gray-700">{contract.hourlyRate || contract.rate || '—'}</p>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE_CONFIG[contract.status] || 'bg-gray-50 text-gray-600 border border-gray-200'}`}>
                    {contract.status || 'Unknown'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <p className="text-sm text-gray-500">{contract.endDate ? formatDate(contract.endDate) : '—'}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Upcoming Payments Table ────────────────────────────────────
const UpcomingPayments = ({ payments }) => {
  if (!payments || payments.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="text-center">
          <DollarSign className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-500">No payment data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Upcoming Payments</h3>
          <p className="text-xs text-gray-400">{payments.filter((p) => p.status === 'Pending').length} pending</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-50 bg-gray-50/50">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Description</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Amount</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Date</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => {
              const isPending = payment.status === 'Pending'
              return (
                <tr
                  key={payment.id}
                  className={`border-b border-gray-50 transition-colors last:border-b-0 ${
                    isPending ? 'bg-amber-50/30 hover:bg-amber-50/60' : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-gray-900">{payment.description || 'Payment'}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(payment.amount)}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-sm text-gray-500">{formatDate(payment.date)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE_CONFIG[payment.status] || 'bg-gray-50 text-gray-600 border border-gray-200'}`}>
                      {payment.status}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Attention Needed ─────────────────────────────────────────
const AttentionNeeded = ({ alerts }) => {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">All clear!</h3>
            <p className="text-sm text-gray-500">No pending items. Everything is up to date.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
          <AlertCircle className="h-4 w-4 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Attention Needed</h3>
        <span className="ml-auto rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
          {alerts.length} item{alerts.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-3">
        {alerts.map((a) => {
          const Icon = a.icon || AlertTriangle
          const isUrgent = a.level === 'urgent'
          const isWarning = a.level === 'warning'

          const borderClass = isUrgent
            ? 'border-red-200 bg-red-50'
            : isWarning
              ? 'border-amber-200 bg-amber-50'
              : 'border-green-200 bg-green-50'

          const iconBgClass = isUrgent
            ? 'bg-red-100 text-red-600'
            : isWarning
              ? 'bg-amber-100 text-amber-600'
              : 'bg-green-100 text-green-600'

          const textClass = isUrgent
            ? 'text-red-800'
            : isWarning
              ? 'text-amber-800'
              : 'text-green-800'

          return (
            <div key={a.id} className={`flex items-start gap-4 rounded-xl border px-4 py-4 ${borderClass}`}>
              <div className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${iconBgClass}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold ${textClass}`}>{a.title}</p>
                <p className={`mt-1 text-xs ${isUrgent ? 'text-red-700' : 'text-amber-700'}`}>
                  {a.message}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Loading Skeleton ───────────────────────────────────────────
const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-36 animate-pulse rounded-2xl bg-gray-200" />
      ))}
    </div>
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="h-72 animate-pulse rounded-2xl bg-gray-200 lg:col-span-2" />
      <div className="h-72 animate-pulse rounded-2xl bg-gray-200" />
    </div>
  </div>
)

// ─── Main Dashboard Page ────────────────────────────────────────
const ContractorDashboardPage = () => {
  const { user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [stats, setStats] = useState(null)
  const [contracts, setContracts] = useState([])
  const [payments, setPayments] = useState([])
  const [earningsChart, setEarningsChart] = useState([])
  const [alerts, setAlerts] = useState([])
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const contractorName = user?.name || user?.fullName || user?.email?.split('@')[0] || 'Contractor'

  const handleRefresh = () => {
    fetchDashboardData(false)
  }

  const formatLastUpdated = (date) => {
    if (!date) return 'Never'
    const now = new Date()
    const diff = Math.floor((now - date) / 1000) // seconds
    if (diff < 5) return 'Just now'
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const fetchDashboardData = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setError(null)
        setIsRefreshing(true)
      }

      // Fetch stats
      const statsData = await dashboardService.getContractorStats()
      setStats(statsData)

      // Fetch active contracts
      try {
        const contractsData = await contractService.getAllContracts()
        const activeContracts = (contractsData || []).filter(
          (c) => String(c?.status || '').toUpperCase() === 'ACTIVE'
        )
        setContracts(activeContracts)
      } catch {
        setContracts([])
      }

      // Fetch payments (from invoices)
      try {
        const invoicesData = await invoiceService.getAllInvoices()
        const paymentList = (invoicesData || []).map((inv) => ({
          id: inv.id,
          amount: Number(inv.amount) || Number(inv.total) || 0,
          date: inv.dueDate || inv.invoiceDate || inv.createdAt,
          status: String(inv.status || '').toUpperCase() === 'PAID' ? 'Paid' : 'Pending',
          description: inv.description || inv.title || `Invoice #${inv.id}`,
        }))
        setPayments(paymentList)
      } catch {
        setPayments([])
      }

      // Fetch earnings chart data (from approved invoices by month)
      try {
        const invoicesData = await invoiceService.getAllInvoices()
        const approvedInvoices = (invoicesData || []).filter(
          (inv) => String(inv.status || '').toUpperCase() === 'APPROVED' || String(inv.status || '').toUpperCase() === 'PAID'
        )

        // Group by month
        const monthMap = {}
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const now = new Date()

        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const key = `${d.getFullYear()}-${d.getMonth()}`
          monthMap[key] = { month: monthNames[d.getMonth()], earnings: 0 }
        }

        approvedInvoices.forEach((inv) => {
          const invDate = new Date(inv.createdAt || inv.invoiceDate || inv.date)
          const key = `${invDate.getFullYear()}-${invDate.getMonth()}`
          if (monthMap[key]) {
            monthMap[key].earnings += Number(inv.amount) || Number(inv.total) || 0
          }
        })

        setEarningsChart(Object.values(monthMap))
      } catch {
        setEarningsChart([])
      }

      // Fetch alerts
      try {
        const alertsData = await dashboardService.getContractorAlerts()
        const formattedAlerts = (alertsData?.alerts || []).map((a) => ({
          id: a.id,
          level: a.type || 'warning',
          title: a.title,
          message: a.description || '',
          icon: a.icon === 'alert-triangle' ? AlertTriangle : a.icon === 'alert-circle' ? AlertCircle : AlertTriangle,
        }))

        // Add pending invoice/timesheet alerts from stats
        if (statsData?.pendingInvoices > 0) {
          formattedAlerts.push({
            id: 'pending-invoices',
            level: 'warning',
            title: `${statsData.pendingInvoices} invoice(s) awaiting approval`,
            message: 'Your invoices are under review by the finance team',
            icon: AlertTriangle,
          })
        }
        if (statsData?.pendingTimesheets > 0) {
          formattedAlerts.push({
            id: 'pending-timesheets',
            level: 'urgent',
            title: `${statsData.pendingTimesheets} timesheet(s) not submitted`,
            message: 'Submit your timesheets to avoid payment delays',
            icon: AlertCircle,
          })
        }

        setAlerts(formattedAlerts)
      } catch {
        setAlerts([])
      }

      setLastUpdated(new Date())
    } catch (err) {
      if (!silent) {
        setError(err.message || 'Failed to load dashboard data')
      }
    } finally {
      if (!silent) {
        setIsLoading(false)
      }
      setIsRefreshing(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Auto-refresh every 15 seconds for more realtime updates
  useEffect(() => {
    const interval = setInterval(() => fetchDashboardData(true), 15000)
    return () => clearInterval(interval)
  }, [fetchDashboardData])

  // Refresh when window comes back into focus
  useEffect(() => {
    const handleFocus = () => fetchDashboardData(true)
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [fetchDashboardData])

  if (isLoading) {
    return (
      <DashboardLayout>
        <DashboardSkeleton />
      </DashboardLayout>
    )
  }

  if (error && !stats) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
            <p className="mt-3 text-lg font-semibold text-gray-700">Failed to load dashboard</p>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening'

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ── Header ──────────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              {greeting}, <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{contractorName}</span>
            </h1>
            <p className="mt-1 text-sm text-gray-500">Here&apos;s an overview of your contracts and earnings.</p>
            {lastUpdated && (
              <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                <Clock className="h-3 w-3" />
                Last updated: {formatLastUpdated(lastUpdated)}
              </p>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
            title="Refresh dashboard data"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>

        {/* ── Summary Cards ───────────────────────────────────── */}
        {stats ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <SummaryCard
              icon={FileText}
              title="Active Contracts"
              value={stats.activeContracts || 0}
              sublabel={stats.totalContractValue ? `Total value: ${formatCurrency(stats.totalContractValue)}` : ''}
              accentColor="blue"
            />

            <SummaryCard
              icon={AlertCircle}
              title="Pending Actions"
              value={(stats.pendingInvoices || 0) + (stats.pendingTimesheets || 0)}
              sublabel={`${stats.pendingInvoices || 0} invoices · ${stats.pendingTimesheets || 0} timesheets`}
              accentColor="yellow"
            />

            <SummaryCard
              icon={DollarSign}
              title="This Month's Earnings"
              value={stats.monthlyEarnings ? formatCurrency(stats.monthlyEarnings) : '$0'}
              sublabel="Approved earnings this month"
              accentColor="green"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-2xl bg-gray-200" />
            ))}
          </div>
        )}

        {/* ── Chart + Quick Actions Row ────────────────────────── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <EarningsChart data={earningsChart} />
          </div>
          <div>
            <PendingActions />
          </div>
        </div>

        {/* ── Upcoming Payments ────────────────────────────────── */}
        <UpcomingPayments payments={payments} />

        {/* ── Active Contracts Table ───────────────────────────── */}
        <ActiveContractsTable contracts={contracts} />

        {/* ── Attention Needed ─────────────────────────────────── */}
        <AttentionNeeded alerts={alerts} />
      </div>
    </DashboardLayout>
  )
}

export default ContractorDashboardPage
