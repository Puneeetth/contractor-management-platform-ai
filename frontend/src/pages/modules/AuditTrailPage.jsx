import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, AlertCircle, GitBranch, Loader2, Search } from 'lucide-react'
import { DashboardLayout } from '../../components/layout'
import { Card } from '../../components/ui'
import auditService from '../../services/auditService'
import { formatters } from '../../utils/formatters'

const ENTITY_OPTIONS = [
  { value: '', label: 'All entities' },
  { value: 'USER', label: 'Users' },
  { value: 'CUSTOMER', label: 'Customers' },
  { value: 'CONTRACTOR', label: 'Contractors' },
  { value: 'CONTRACT', label: 'Contracts' },
  { value: 'PURCHASE_ORDER', label: 'Purchase Orders' },
  { value: 'INVOICE', label: 'Invoices' },
  { value: 'TIMESHEET', label: 'Timesheets' },
  { value: 'EXPENSE', label: 'Expenses' },
]

const WORKFLOW_OPTIONS = [
  { value: '', label: 'All workflows' },
  { value: 'USER_APPROVAL', label: 'User Approval' },
  { value: 'USER_STATUS', label: 'User Status' },
  { value: 'INVOICE_SUBMISSION', label: 'Invoice Submission' },
  { value: 'INVOICE_ADMIN_APPROVAL', label: 'Invoice Admin Approval' },
  { value: 'INVOICE_FINANCE_APPROVAL', label: 'Invoice Finance Approval' },
  { value: 'TIMESHEET_APPROVAL', label: 'Timesheet Approval' },
  { value: 'EXPENSE_APPROVAL', label: 'Expense Approval' },
]

const TAB_OPTIONS = [
  { id: 'workflow', label: 'Workflow Tracking', icon: GitBranch },
  { id: 'audit', label: 'System Audit', icon: Activity },
]

const getStatusBadgeClass = (value) => {
  const normalized = String(value || '').toUpperCase()
  if (normalized.includes('APPROVED') || normalized.includes('REACTIVATED')) return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
  if (normalized.includes('REJECTED') || normalized.includes('DEACTIVATED')) return 'bg-red-50 text-red-600 border border-red-200'
  if (normalized.includes('PENDING') || normalized.includes('SUBMITTED') || normalized.includes('RESUBMITTED')) return 'bg-amber-50 text-amber-700 border border-amber-200'
  return 'bg-slate-100 text-slate-700 border border-slate-200'
}

const AuditTrailPage = () => {
  const [activeTab, setActiveTab] = useState('workflow')
  const [entityType, setEntityType] = useState('')
  const [workflowType, setWorkflowType] = useState('')
  const [entityId, setEntityId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [auditLogs, setAuditLogs] = useState([])
  const [workflowEvents, setWorkflowEvents] = useState([])

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const normalizedEntityId = entityId.trim()
      const parsedEntityId = normalizedEntityId ? Number(normalizedEntityId) : undefined
      const [logs, events] = await Promise.all([
        auditService.getAuditLogs({
          ...(entityType ? { entityType } : {}),
          ...(parsedEntityId ? { entityId: parsedEntityId } : {}),
        }),
        auditService.getWorkflowEvents({
          ...(workflowType ? { workflowType } : {}),
          ...(entityType ? { entityType } : {}),
          ...(parsedEntityId ? { entityId: parsedEntityId } : {}),
        }),
      ])
      setAuditLogs(Array.isArray(logs) ? logs : [])
      setWorkflowEvents(Array.isArray(events) ? events : [])
    } catch (err) {
      setError(err?.message || 'Failed to load audit trail data')
      setAuditLogs([])
      setWorkflowEvents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const currentItems = useMemo(
    () => (activeTab === 'workflow' ? workflowEvents : auditLogs),
    [activeTab, workflowEvents, auditLogs]
  )

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-baseline gap-3">
          <h1 className="text-[24px] font-extrabold tracking-[-0.02em] text-[#0f1d33]">Audit Trail</h1>
          <p className="text-[13px] text-[#5b6c85]">Track approvals, rejections, submissions, and system changes across the platform.</p>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <Card className="border-[#d8e2ef] shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {TAB_OPTIONS.map((tab) => {
                const Icon = tab.icon
                const active = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex h-9 items-center gap-2 rounded-xl px-3 text-[12px] font-semibold transition-colors ${
                      active ? 'bg-[#4b4fe8] text-white shadow-[0_8px_16px_rgba(75,79,232,0.2)]' : 'border border-[#d8e2ef] bg-white text-[#30425c] hover:bg-[#f7f9fc]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#96a4b8]" />
                <input
                  type="text"
                  value={entityId}
                  onChange={(event) => setEntityId(event.target.value)}
                  placeholder="Entity ID"
                  className="h-9 w-[110px] rounded-xl border border-[#d8e2ef] bg-white pl-9 pr-3 text-[12px] text-[#1c2f4b] outline-none focus:border-[#aab8d6]"
                />
              </div>
              <select
                value={entityType}
                onChange={(event) => setEntityType(event.target.value)}
                className="h-9 rounded-xl border border-[#d8e2ef] bg-white px-3 text-[12px] text-[#1c2f4b] outline-none focus:border-[#aab8d6]"
              >
                {ENTITY_OPTIONS.map((option) => (
                  <option key={option.value || 'all'} value={option.value}>{option.label}</option>
                ))}
              </select>
              {activeTab === 'workflow' && (
                <select
                  value={workflowType}
                  onChange={(event) => setWorkflowType(event.target.value)}
                  className="h-9 rounded-xl border border-[#d8e2ef] bg-white px-3 text-[12px] text-[#1c2f4b] outline-none focus:border-[#aab8d6]"
                >
                  {WORKFLOW_OPTIONS.map((option) => (
                    <option key={option.value || 'all'} value={option.value}>{option.label}</option>
                  ))}
                </select>
              )}
              <button
                type="button"
                onClick={loadData}
                className="inline-flex h-9 items-center rounded-xl bg-[#4b4fe8] px-4 text-[12px] font-semibold text-white hover:bg-[#4347db]"
              >
                Refresh
              </button>
            </div>
          </div>
        </Card>

        <Card className="border-[#d8e2ef] shadow-[0_8px_24px_rgba(15,23,42,0.05)]" isPadded={false}>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-[13px] text-[#5e6f87]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading audit data...
            </div>
          ) : currentItems.length === 0 ? (
            <div className="py-12 text-center text-[13px] text-[#7c8da5]">No records found for the current filters.</div>
          ) : (
            <div className="divide-y divide-[#e7edf6]">
              {currentItems.map((item, index) => (
                <motion.div
                  key={`${activeTab}-${item.id}-${index}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 gap-3 px-5 py-4 lg:grid-cols-[180px_minmax(0,1fr)_180px]"
                >
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#94a3b8]">{item.entityType}</p>
                    <p className="text-[14px] font-semibold text-[#0f1d33]">#{item.entityId}</p>
                    <p className="text-[11px] text-[#71829b]">{formatters.formatDateTime(item.createdAt)}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[14px] font-semibold text-[#13243d]">{activeTab === 'workflow' ? item.workflowType : item.action}</span>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${getStatusBadgeClass(activeTab === 'workflow' ? item.resultingStatus : item.action)}`}>
                        {activeTab === 'workflow' ? item.resultingStatus : item.action.replaceAll('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[13px] text-[#42536b]">
                      {activeTab === 'workflow'
                        ? item.comment || `${item.action} by ${item.actorName || 'System'}`
                        : item.description}
                    </p>
                    {activeTab === 'audit' && item.details && (
                      <p className="text-[12px] text-[#71829b]">{item.details}</p>
                    )}
                  </div>

                  <div className="space-y-1 lg:text-right">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#94a3b8]">Actor</p>
                    <p className="text-[13px] font-semibold text-[#13243d]">{item.actorName || 'System'}</p>
                    <p className="text-[12px] text-[#71829b]">{item.actorRole || '-'}</p>
                    {item.actorEmail && <p className="text-[12px] text-[#71829b]">{item.actorEmail}</p>}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default AuditTrailPage
