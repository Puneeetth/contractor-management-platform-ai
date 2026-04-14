import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Briefcase, Clock, CreditCard } from 'lucide-react'
import { DashboardLayout } from '../components/layout'
import { Card, Loader, Badge } from '../components/ui'
import { formatters } from '../utils/formatters'

const DashboardPage = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalContractors: 0,
    totalRevenue: 0,
    totalHours: 0,
    pendingExpenses: 0,
  })

  useEffect(() => {
    // Simulate loading dashboard data
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

  const statCards = [
    {
      icon: Users,
      label: 'Total Contractors',
      value: stats.totalContractors,
      color: 'bg-blue-50 text-blue-600',
      trend: '+12% from last month',
    },
    {
      icon: CreditCard,
      label: 'Total Revenue',
      value: formatters.formatCurrency(stats.totalRevenue),
      color: 'bg-green-50 text-green-600',
      trend: '+8.2% from last month',
    },
    {
      icon: Clock,
      label: 'Total Hours',
      value: formatters.formatHours(stats.totalHours),
      color: 'bg-purple-50 text-purple-600',
      trend: '+4.5% from last month',
    },
    {
      icon: Briefcase,
      label: 'Pending Expenses',
      value: stats.pendingExpenses,
      color: 'bg-yellow-50 text-yellow-600',
      trend: '+2 new this week',
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's what's happening with your business today.
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
                  <Card className={`${stat.color} border-0`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium opacity-75">{stat.label}</p>
                        <p className="text-3xl font-bold mt-2">{stat.value}</p>
                        <p className="text-xs opacity-60 mt-3">{stat.trend}</p>
                      </div>
                      <Icon className="w-10 h-10 opacity-20" />
                    </div>
                  </Card>
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
          <Card header={<h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>}>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">Timesheet Submitted</p>
                  <p className="text-xs text-gray-500">John Smith submitted their timesheet</p>
                </div>
                <Badge variant="pending">Pending Review</Badge>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">Invoice Generated</p>
                  <p className="text-xs text-gray-500">Invoice #INV-2024-001 created</p>
                </div>
                <Badge variant="approved">Completed</Badge>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">Expense Approved</p>
                  <p className="text-xs text-gray-500">$450 travel expense approved</p>
                </div>
                <Badge variant="approved">Approved</Badge>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  )
}

export default DashboardPage
