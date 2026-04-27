import React from 'react'
import {
  FileText,
  AlertCircle,
  DollarSign,
  Calendar,
} from 'lucide-react'
import { SummaryCard } from './SummaryCard'

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number(value) || 0)
}

const formatNumber = (value) => {
  return Number(value).toLocaleString('en-US')
}

const formatDate = (dateStr) => {
  if (!dateStr) return null
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export const KeySummaryCards = ({
  activeContracts = 0,
  activeContractStatus = 'neutral',
  activeContractStatusLabel = 'No contracts',
  pendingActions = 0,
  thisMonthEarnings = 0,
  lastMonthEarnings = 0,
  upcomingPayments = 0,
  upcomingPaymentsTotal = 0,
  nearestPaymentDate = null,
  nearestPaymentStatus = 'neutral',
  nearestPaymentStatusLabel = 'No payments',
  isLoading = false,
  contractsHref = '/contracts',
  pendingActionsHref = '/admin/pending-approvals',
  earningsHref = '/expenses',
  paymentsHref = '/invoices',
}) => {
  // Calculate earnings trend
  let earningsTrend = null
  let earningsTrendDirection = null
  if (thisMonthEarnings > 0 && lastMonthEarnings > 0) {
    const deltaPercent = Math.round(((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100)
    if (deltaPercent > 0) {
      earningsTrend = `+${deltaPercent}% vs last month`
      earningsTrendDirection = 'up'
    } else if (deltaPercent < 0) {
      earningsTrend = `${deltaPercent}% vs last month`
      earningsTrendDirection = 'down'
    } else {
      earningsTrend = 'No change vs last month'
      earningsTrendDirection = 'neutral'
    }
  }

  const cards = [
    {
      icon: FileText,
      title: 'Active Contracts',
      value: formatNumber(activeContracts),
      status: activeContractStatus,
      statusLabel: activeContractStatusLabel,
      href: contractsHref,
      isEmpty: activeContracts === 0,
      emptyMessage: 'No active contracts',
      tooltipContent: `${activeContracts} active - ${activeContractStatusLabel}`,
    },
    {
      icon: AlertCircle,
      title: 'Pending Actions',
      value: formatNumber(pendingActions),
      secondaryDescription: pendingActions > 0 ? 'Requires your attention' : 'All caught up',
      status: pendingActions > 5 ? 'red' : pendingActions > 0 ? 'amber' : 'green',
      statusLabel: pendingActions > 5 ? 'Urgent' : pendingActions > 0 ? 'Needs Review' : 'All Clear',
      href: pendingActionsHref,
      isEmpty: pendingActions === 0,
      emptyMessage: 'No pending actions',
      tooltipContent: pendingActions > 0 ? `${pendingActions} pending` : 'No pending actions',
    },
    {
      icon: DollarSign,
      title: "This Month's Earnings",
      value: formatCurrency(thisMonthEarnings),
      status: thisMonthEarnings > 0 ? 'green' : 'neutral',
      statusLabel: thisMonthEarnings > 0 ? 'On Track' : 'No earnings',
      href: earningsHref,
      isEmpty: thisMonthEarnings === 0,
      emptyMessage: 'No earnings this month',
      tooltipContent: thisMonthEarnings > 0 ? `Earned ${formatCurrency(thisMonthEarnings)}` : 'No earnings this month',
      trend: earningsTrend,
      trendDirection: earningsTrendDirection,
    },
    {
      icon: Calendar,
      title: 'Upcoming Payments',
      value: upcomingPayments > 0 ? formatCurrency(upcomingPaymentsTotal) : formatNumber(upcomingPayments),
      status: nearestPaymentStatus,
      statusLabel: nearestPaymentStatusLabel,
      href: paymentsHref,
      isEmpty: upcomingPayments === 0,
      emptyMessage: 'No upcoming payments',
      tooltipContent: upcomingPayments > 0 ? `${upcomingPayments} payment(s) totaling ${formatCurrency(upcomingPaymentsTotal)}` : 'No payments scheduled',
      dateLabel: upcomingPayments > 0 ? 'Next payment' : null,
      dateValue: formatDate(nearestPaymentDate),
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <SummaryCard
          key={card.title}
          icon={card.icon}
          title={card.title}
          value={card.value}
          secondaryDescription={card.secondaryDescription}
          status={card.status}
          statusLabel={card.statusLabel}
          href={card.href}
          isEmpty={card.isEmpty}
          emptyMessage={card.emptyMessage}
          isLoading={isLoading}
          tooltipContent={card.tooltipContent}
          trend={card.trend}
          trendDirection={card.trendDirection}
          dateLabel={card.dateLabel}
          dateValue={card.dateValue}
        />
      ))}
    </div>
  )
}
