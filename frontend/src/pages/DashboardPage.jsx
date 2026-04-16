import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Briefcase, Clock, CreditCard, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react'
import { DashboardLayout } from '../components/layout'
import { Card, Loader, Badge } from '../components/ui'
import { formatters } from '../utils/formatters'
import { useAuth } from '../hooks/useAuth'

const DashboardPage = () => {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalContractors: 0,
    totalRevenue: 0,
    totalHours: 0,
    pendingExpenses: 0,
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      setStats({
        totalContractors: 24,
        totalRevenue: 125750,
        totalHours: 1248,
        pendingExpenses: 8,
      })
      setIsLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
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

  const recentActivity = [
    {
      title: 'Timesheet Submitted',
      description: 'John Smith submitted their timesheet for March',
      status: 'pending',
      statusLabel: 'Pending Review',
      time: '2 hours ago',
    },
    {
      title: 'Invoice Generated',
      description: 'Invoice #INV-2024-001 created automatically',
      status: 'approved',
      statusLabel: 'Completed',
      time: '5 hours ago',
    },
    {
      title: 'Expense Approved',
      description: '$450 travel expense approved by finance',
      status: 'approved',
      statusLabel: 'Approved',
      time: '1 day ago',
    },
    {
      title: 'New Contract Created',
      description: 'Contract for Project Alpha assigned',
      status: 'info',
      statusLabel: 'New',
      time: '2 days ago',
    },
    {
      title: 'Purchase Order Updated',
      description: 'PO-2024-012 value updated to $85,000',
      status: 'warning',
      statusLabel: 'Updated',
      time: '3 days ago',
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
              {recentActivity.map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className={`flex items-center justify-between py-3.5 px-2 rounded-xl hover:bg-gray-50 transition-colors ${
                    index < recentActivity.length - 1 ? 'border-b border-gray-200' : ''
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
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{activity.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Badge variant={activity.status}>{activity.statusLabel}</Badge>
                    <span className="text-xs text-gray-500 hidden sm:block">{activity.time}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  )
}

export default DashboardPage

