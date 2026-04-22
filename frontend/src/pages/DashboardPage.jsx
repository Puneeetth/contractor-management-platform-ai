import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Briefcase, CreditCard } from 'lucide-react'
import { DashboardLayout } from '../components/layout'
import { Card, Loader } from '../components/ui'
import { contractService } from '../services/contractorService'
import { expenseService } from '../services/expenseService'
import { poService } from '../services/poService'
import { formatters } from '../utils/formatters'
import { useAuth } from '../hooks/useAuth'

const DEFAULT_STATS = {
  totalContracts: 0,
  totalRevenue: 0,
  pendingExpenses: 0,
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
            totalContracts: contractList.length,
            totalRevenue: poList.reduce((sum, po) => sum + (Number(po.poValue) || 0), 0),
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

    loadDashboardStats()

    const handleWindowFocus = () => {
      loadDashboardStats()
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

  const statCards = [
    {
      icon: Users,
      label: 'Total Contracts',
      value: stats.totalContracts,
      colorClass: 'stat-card-blue',
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-100',
    },
    {
      icon: CreditCard,
      label: 'Total Revenue',
      value: formatters.formatCurrency(stats.totalRevenue),
      colorClass: 'stat-card-green',
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-100',
    },
    {
      icon: Briefcase,
      label: 'Pending Expenses',
      value: stats.pendingExpenses,
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
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
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
          <Card header={<h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>}>
            <div className="py-8 text-center text-sm text-gray-500">
              No recent activity data available.
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  )
}

export default DashboardPage

