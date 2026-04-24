import React, { useState, useEffect } from 'react'
import {
  Wallet,
  UserPlus,
  FileCheck2,
  FileWarning,
  FileText,
  PlusCircle,
  CheckSquare,
  Download,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react'
import { DashboardLayout } from '../components/layout'
import { Loader } from '../components/ui'
import { contractService } from '../services/contractorService'
import { expenseService } from '../services/expenseService'
import { invoiceService } from '../services/invoiceService'
import { useAuth } from '../hooks/useAuth'

const DEFAULT_STATS = {
  activeContractors: 0,
  pendingApprovals: 0,
  monthlyExpenses: 0,
  pendingInvoices: 0,
}

const RECENT_ACTIVITIES = [
  {
    icon: UserPlus,
    title: 'New Contractor Registered',
    description: 'ArchiTech Solutions Ltd • Infrastructure Team',
    time: '2m ago',
    tag: 'ADMIN',
    tagClass: 'bg-[#e4ecff] text-[#3359d8]',
  },
  {
    icon: FileCheck2,
    title: 'Expense Report #882 Approved',
    description: "Liam O'Conner • Travel Reimbursement",
    time: '14m ago',
    tag: 'FINANCE',
    tagClass: 'bg-[#dff5ff] text-[#1673a4]',
  },
  {
    icon: FileWarning,
    title: 'Compliance Alert: Insurance Expiring',
    description: 'Structural Masonry Corp • Due in 5 days',
    time: '1h ago',
    tag: 'URGENT',
    tagClass: 'bg-[#ffdce4] text-[#b42348]',
  },
  {
    icon: FileText,
    title: 'New Invoice Submission',
    description: 'Design Flow Studio • PO #2024-001',
    time: '3h ago',
    tag: 'FINANCE',
    tagClass: 'bg-[#dff5ff] text-[#1673a4]',
  },
]

const formatCompactCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number(value) || 0)
}

const DashboardPage = () => {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState(DEFAULT_STATS)

  useEffect(() => {
    let isMounted = true

    const loadDashboardStats = async () => {
      if (user?.role !== 'ADMIN') {
        if (isMounted) {
          setStats(DEFAULT_STATS)
          setIsLoading(false)
        }
        return
      }

      try {
        if (isMounted) setIsLoading(true)

        const [contracts, invoices, expenses] = await Promise.all([
          contractService.getAllContracts(),
          invoiceService.getAllInvoices(),
          expenseService.getAllExpenses(),
        ])

        const contractList = Array.isArray(contracts) ? contracts : []
        const invoiceList = Array.isArray(invoices) ? invoices : []
        const expenseList = Array.isArray(expenses) ? expenses : []

        const pendingApprovalCount = invoiceList.filter(
          (invoice) => invoice.adminApprovalStatus === 'PENDING' && invoice.status !== 'REJECTED'
        ).length

        const pendingInvoiceCount = invoiceList.filter((invoice) => {
          const status = String(invoice.status || '').toUpperCase()
          return status !== 'APPROVED' && status !== 'REJECTED'
        }).length

        const monthlyExpenseValue = expenseList.reduce(
          (sum, expense) => sum + (Number(expense.amount) || 0),
          0
        )

        if (isMounted) {
          setStats({
            activeContractors: contractList.length,
            pendingApprovals: pendingApprovalCount,
            monthlyExpenses: monthlyExpenseValue,
            pendingInvoices: pendingInvoiceCount,
          })
        }
      } catch (error) {
        if (isMounted) {
          setStats(DEFAULT_STATS)
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadDashboardStats()
    const refreshInterval = window.setInterval(loadDashboardStats, 30000)
    const handleWindowFocus = () => loadDashboardStats()
    window.addEventListener('focus', handleWindowFocus)

    return () => {
      isMounted = false
      window.clearInterval(refreshInterval)
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [user?.role])

  const statCards = [
    {
      icon: UserPlus,
      iconWrap: 'bg-[#eef1ff] text-[#3e57d8]',
      topTag: '+12%',
      topTagClass: 'text-[#1560b5]',
      label: 'ACTIVE CONTRACTORS',
      value: stats.activeContractors.toLocaleString('en-US'),
    },
    {
      icon: FileText,
      iconWrap: 'bg-[#f0f3f8] text-[#6f7d93]',
      topTag: `${stats.pendingApprovals} Pending`,
      topTagClass: 'text-[#b42348]',
      label: 'PENDING APPROVALS',
      value: stats.pendingApprovals.toLocaleString('en-US'),
    },
    {
      icon: Wallet,
      iconWrap: 'bg-[#ebf4ff] text-[#1778b4]',
      topTag: 'On Budget',
      topTagClass: 'text-[#0f4068]',
      label: 'MONTHLY EXPENSES',
      value: formatCompactCurrency(stats.monthlyExpenses),
    },
    {
      icon: FileWarning,
      iconWrap: 'bg-[#fff0f3] text-[#bc3f63]',
      topTag: 'Action Required',
      topTagClass: 'text-[#b42348]',
      label: 'PENDING INVOICES',
      value: stats.pendingInvoices.toLocaleString('en-US'),
    },
  ]

  return (
    <DashboardLayout>
      <div className="flex min-h-full flex-col gap-3 text-[#111827]">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader message="Loading dashboard..." />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
              {statCards.map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.label}
                    className="flex h-[72px] min-w-0 items-center rounded-2xl border border-[#dbe3ef] bg-white px-4 py-2.5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
                  >
                    <div className="flex w-full min-w-0 items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className={`rounded-2xl p-2 ${item.iconWrap}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <p className="truncate text-[9px] font-bold tracking-[0.14em] text-[#6a7588]">{item.label}</p>
                          <p className="text-[18px] leading-none font-bold tracking-[-0.02em] text-[#0f2238]">{item.value}</p>
                        </div>
                      </div>
                      <span className={`shrink-0 text-[9px] font-semibold ${item.topTagClass}`}>{item.topTag}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_270px]">
              <div className="flex flex-col rounded-[26px] border border-[#d7e0ec] bg-white px-6 py-4.5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                <div className="mb-3.5 flex items-center justify-between">
                  <h2 className="text-[16px] font-bold tracking-[-0.02em] text-[#1f2a3d]">Recent Activity</h2>
                  <button className="text-[12px] font-semibold text-[#3155d7] hover:underline">View Ledger</button>
                </div>
                <div className="grid gap-1.5">
                  {RECENT_ACTIVITIES.map((activity) => {
                    const Icon = activity.icon
                    return (
                      <div
                        key={activity.title}
                        className="flex min-w-0 items-center justify-between gap-3 rounded-2xl px-3 py-1.5 hover:bg-[#f8fbff]"
                      >
                      <div className="flex min-w-0 items-center gap-3">
                          <div className="rounded-full border border-[#d8e0ed] bg-[#f7f9fd] p-2">
                            <Icon className="h-[13px] w-[13px] text-[#6f7d93]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12.5px] font-semibold leading-5 text-[#1e2a3f]">{activity.title}</p>
                            <p className="truncate text-[10.5px] font-medium leading-4 text-[#7a8699]">{activity.description}</p>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1 pl-2">
                          <span className="text-[9px] font-semibold text-[#8b97ab]">{activity.time}</span>
                          <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold tracking-[0.08em] ${activity.tagClass}`}>
                            {activity.tag}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-rows-[0.88fr_1fr]">
                <div className="rounded-[26px] border border-[#d7e0ec] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                  <h3 className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#6f7d93]">Quick Directives</h3>
                  <div className="space-y-2.5">
                    <button className="flex w-full items-center justify-between rounded-2xl bg-[#3f57d8] px-4 py-2.5 text-white">
                      <span className="flex items-center gap-2.5">
                        <PlusCircle className="h-4 w-4" />
                        <span className="text-[12.5px] font-bold">Onboard Contractor</span>
                      </span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <button className="flex w-full items-center justify-between rounded-2xl bg-[#edf2f7] px-4 py-2.5 text-[#4f5d73]">
                      <span className="flex items-center gap-2.5">
                        <CheckSquare className="h-4 w-4" />
                        <span className="text-[12.5px] font-bold">Approve Timesheets</span>
                      </span>
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                    <button className="flex w-full items-center justify-between rounded-2xl bg-[#edf2f7] px-4 py-2.5 text-[#4f5d73]">
                      <span className="flex items-center gap-2.5">
                        <Download className="h-4 w-4" />
                        <span className="text-[12.5px] font-bold">Export Audit Log</span>
                      </span>
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="rounded-[26px] border border-[#d7e0ec] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                  <div className="mb-3.5 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#2c6ac3]" />
                    <h3 className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#6f7d93]">System Integrity</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="mb-1 flex items-center justify-between text-[10px] font-semibold text-[#3d4b61]">
                        <span>Project Completion Rate</span>
                        <span>94.2%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#d8e3fb]">
                        <div className="h-1.5 w-[94.2%] rounded-full bg-[#2d5fd7]" />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between text-[10px] font-semibold text-[#3d4b61]">
                        <span>Compliance Health</span>
                        <span>88.5%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#d8e3fb]">
                        <div className="h-1.5 w-[88.5%] rounded-full bg-[#2d5fd7]" />
                      </div>
                    </div>
                    <div className="rounded-2xl bg-[#eef3ff] px-4 py-3">
                      <p className="text-[9.5px] font-semibold leading-5 text-[#60708a]">
                        <span className="font-bold text-[#2d5fd7]">PRO TIP:</span> High contractor churn detected in Structural Team. Consider reviewing PO processing lead times.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

export default DashboardPage

