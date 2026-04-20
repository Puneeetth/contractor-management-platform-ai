import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Briefcase, Clock, CreditCard, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react'
import { DashboardLayout } from '../components/layout'
import { Card, Loader, Badge } from '../components/ui'
import { contractService } from '../services/contractorService'
import { expenseService } from '../services/expenseService'
import { poService } from '../services/poService'
import { adminActivityService } from '../services/adminActivityService'
import { formatters } from '../utils/formatters'
import { useAuth } from '../hooks/useAuth'

const DEFAULT_STATS = {
  totalContractors: 0,
  totalRevenue: 0,
  totalHours: 1248,
  pendingExpenses: 0,
}

const DashboardPage = () => {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState(DEFAULT_STATS)
  const [activities, setActivities] = useState([])
  const [activitiesLoading, setActivitiesLoading] = useState(false)

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
        if (isMounted) {
          setIsLoading(true)
        }

        const [contracts, purchaseOrders, expenses] = await Promise.all([
          contractService.getAllContracts(),
          poService.getAllPurchaseOrders(),
          expenseService.getAllExpenses(),
        ])

        const contractList = Array.isArray(contracts) ? contracts : []
        const poList = Array.isArray(purchaseOrders) ? purchaseOrders : []
        const expenseList = Array.isArray(expenses) ? expenses : []

        const pendingExpenseCount = expenseList.filter(
          (expense) => expense.status !== 'APPROVED' && expense.status !== 'REJECTED'
        ).length

        if (isMounted) {
          setStats({
            totalContractors: contractList.length,
            totalRevenue: poList.reduce((sum, po) => sum + (Number(po.poValue) || 0), 0),
            totalHours: DEFAULT_STATS.totalHours,
            pendingExpenses: pendingExpenseCount,
          })
        }
      } catch (error) {
        if (isMounted) {
          setStats(DEFAULT_STATS)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    const loadActivities = async () => {
      if (user?.role !== 'ADMIN') return
      
      try {
        if (isMounted) {
          setActivitiesLoading(true)
        }
        const data = await adminActivityService.getRecentActivities(10)
        if (isMounted) {
          setActivities(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error('Failed to load activities:', error)
      } finally {
        if (isMounted) {
          setActivitiesLoading(false)
        }
      }
    }

    loadDashboardStats()
    loadActivities()

    const handleWindowFocus = () => {
      loadDashboardStats()
      loadActivities()
    }

    window.addEventListener('focus', handleWindowFocus)

    return () => {
      isMounted = false
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [user?.role])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return ''
    
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMs = now - date
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    
    return date.toLocaleDateString()
  }

  const statCards = [
    {
      icon: Users,
      label: 'Total Contractors',
      value: stats.totalContractors,
      trend: '+12%',
      trendUp: true,
      trendLabel: 'from last month',
      colorClass: 'stat-card-blue',
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-100',
    },
    {
      icon: CreditCard,
      label: 'Total Revenue',
      value: formatters.formatCurrency(stats.totalRevenue),
      trend: '+8.2%',
      trendUp: true,
      trendLabel: 'from last month',
      colorClass: 'stat-card-green',
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-100',
    },
    {
      icon: Clock,
      label: 'Total Hours',
      value: formatters.formatHours(stats.totalHours),
      trend: '+4.5%',
      trendUp: true,
      trendLabel: 'from last month',
      colorClass: 'stat-card-purple',
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-100',
    },
    {
      icon: Briefcase,
      label: 'Pending Expenses',
      value: stats.pendingExpenses,
      trend: '+2',
      trendUp: false,
      trendLabel: 'new this week',
      colorClass: 'stat-card-amber',
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-100',
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  }

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {getGreeting()}, <span className="gradient-text">{user?.name || 'User'}</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening with your business today.
          </p>
        </div>

        {/* Stats Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader message="Loading dashboard..." />
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            {statCards.map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div key={index} variants={itemVariants}>
                  <div className={`${stat.colorClass} rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02]`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                        <div className="flex items-center gap-1.5 mt-3">
                          {stat.trendUp ? (
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
                          )}
                          <span className={`text-xs font-medium ${stat.trendUp ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {stat.trend}
                          </span>
                          <span className="text-xs text-gray-500">{stat.trendLabel}</span>
                        </div>
                      </div>
                      <div className={`${stat.iconBg} p-2.5 rounded-xl`}>
                        <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {/* Recent Activity Section */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
        >
          <Card 
            header={
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                <button className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
                  View all <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            }
          >
            <div className="space-y-1">
              {activitiesLoading ? (
                <div className="py-8 flex justify-center">
                  <Loader message="Loading activities..." />
                </div>
              ) : activities.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-gray-500 text-sm">No recent activity</p>
                </div>
              ) : (
                activities.map((activity, index) => (
                  <motion.div
                    key={activity.id || index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className={`flex items-center justify-between py-3.5 px-2 rounded-xl hover:bg-gray-50 transition-colors ${
                      index < activities.length - 1 ? 'border-b border-gray-200' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        activity.status === 'approved' ? 'bg-emerald-400' :
                        activity.status === 'pending' ? 'bg-amber-400' :
                        activity.status === 'info' ? 'bg-blue-400' :
                        activity.status === 'warning' ? 'bg-purple-400' :
                        'bg-slate-400'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-0.5">by {activity.userName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Badge variant={activity.status}>{activity.statusLabel}</Badge>
                      <span className="text-xs text-gray-500 hidden sm:block">
                        {formatRelativeTime(activity.createdAt)}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  )
}

export default DashboardPage

