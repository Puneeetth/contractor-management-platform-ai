import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  DollarSign,
  AlertCircle,
  Clock,
  Upload,
  Building,
  TrendingUp,
  ChevronRight,
  Bell,
  CheckCircle2,
  ClipboardList,
  Calendar,
  AlertTriangle,
} from 'lucide-react'
import { DashboardLayout } from '../components/layout'
import { dashboardData } from '../data/dashboardDummyData'

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
        <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
          <span className="text-xs font-semibold text-emerald-600">+12.4%</span>
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
                  <p className="text-sm font-medium text-gray-900">{contract.name}</p>
                </td>
                <td className="px-5 py-3.5">
                  <p className="text-sm text-gray-600">{contract.client}</p>
                </td>
                <td className="px-5 py-3.5">
                  <p className="text-sm font-semibold text-gray-700">{contract.rate}</p>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE_CONFIG[contract.status]}`}>
                    {contract.status}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <p className="text-sm text-gray-500">{formatDate(contract.endDate)}</p>
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
const UpcomingPayments = ({ payments }) => (
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
                  <p className="text-sm font-medium text-gray-900">{payment.description}</p>
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
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE_CONFIG[payment.status]}`}>
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

// ─── Attention Needed ─────────────────────────────────────────
const AttentionNeeded = ({ data }) => {
  const alerts = []
  const health = data.contractHealth || { expiringSoon: [], expiringCount: 0 }

  // Contract expiry alerts
  (health.expiringSoon || []).forEach((c) => {
    const urgent = c.daysLeft <= 30
    alerts.push({
      id: `exp-${c.name}`,
      level: urgent ? 'urgent' : 'warning',
      title: `Contract expiring: ${c.name}`,
      message: `${c.daysLeft} days remaining (ends ${formatDate(c.endDate)})`,
      icon: urgent ? AlertCircle : AlertTriangle,
    })
  })

  // Pending invoices
  const pending = data.summaryCards?.pendingApprovals || { invoices: 0, timesheets: 0 }
  if (pending.invoices > 0) {
    alerts.push({
      id: 'inv',
      level: 'warning',
      title: `${pending.invoices} invoice(s) awaiting approval`,
      message: 'Your invoices are under review by the finance team',
      icon: AlertTriangle,
    })
  }

  // Missing timesheets
  if (pending.timesheets > 0) {
    alerts.push({
      id: 'ts',
      level: 'urgent',
      title: `${pending.timesheets} timesheet(s) not submitted`,
      message: 'Submit your timesheets to avoid payment delays',
      icon: AlertCircle,
    })
  }

  // PO missing (sample alert if no PO data)
  if (!data.summaryCards?.totalPOValue || data.summaryCards.totalPOValue.count === 0) {
    alerts.push({
      id: 'po-missing',
      level: 'warning',
      title: 'No active purchase orders',
      message: 'Contact your manager to ensure POs are in place',
      icon: AlertTriangle,
    })
  }

  // If no alerts, show a positive message
  if (alerts.length === 0) {
    alerts.push({
      id: 'none',
      level: 'info',
      title: 'All clear!',
      message: 'No pending items. Everything is up to date.',
      icon: CheckCircle2,
    })
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
          const isInfo = a.level === 'info'

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
                <p className={`mt-1 text-xs ${isInfo ? 'text-green-700' : isUrgent ? 'text-red-700' : 'text-amber-700'}`}>
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
  const [isLoading, setIsLoading] = useState(true)
  const data = dashboardData
  const user = data.user
  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening'

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <DashboardLayout>
        <DashboardSkeleton />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ── Header ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              {greeting}, <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{user.name}</span>
            </h1>
            <p className="mt-1 text-sm text-gray-500">Here&apos;s an overview of your contracts and earnings.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm transition-colors hover:bg-gray-50">
              <Bell className="h-5 w-5 text-gray-500" />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                3
              </span>
            </button>
            <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white">
                {user.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">{user.role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Summary Cards ───────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <SummaryCard
            icon={FileText}
            title="Active Contracts"
            value={data.summaryCards.activeContracts.count}
            sublabel={`Total value: ${formatCurrency(data.summaryCards.activeContracts.totalValue)}`}
            accentColor="blue"
          />

          <SummaryCard
            icon={AlertCircle}
            title="Pending Actions"
            value={data.summaryCards.pendingApprovals.invoices + data.summaryCards.pendingApprovals.timesheets}
            sublabel={`${data.summaryCards.pendingApprovals.invoices} invoices · ${data.summaryCards.pendingApprovals.timesheets} timesheets`}
            accentColor="yellow"
          />

          <SummaryCard
            icon={DollarSign}
            title="This Month's Earnings"
            value={formatCurrency(data.summaryCards.thisMonthEarnings.amount)}
            sublabel="Approved earnings this month"
            accentColor="green"
          />
        </div>

        {/* ── Chart + Quick Actions Row ────────────────────────── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <EarningsChart data={data.earningsChart} />
          </div>
          <div>
            <PendingActions />
          </div>
        </div>

        {/* ── Upcoming Payments ────────────────────────────────── */}
        <UpcomingPayments payments={data.upcomingPayments} />

        {/* ── Active Contracts Table ───────────────────────────── */}
        <ActiveContractsTable contracts={data.activeContracts} />

        {/* ── Attention Needed ─────────────────────────────────── */}
        <AttentionNeeded data={data} />
      </div>
    </DashboardLayout>
  )
}

export default ContractorDashboardPage
