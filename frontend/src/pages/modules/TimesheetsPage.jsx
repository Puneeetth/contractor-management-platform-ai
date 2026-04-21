import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, AlertCircle, Check, X, Clock, CheckCircle2, Timer } from 'lucide-react'
import { DashboardLayout } from '../../components/layout'
import { Card, Button, Table, Modal, Input, Badge, Loader } from '../../components/ui'
import { timesheetService } from '../../services/timesheetService'
import { formatters } from '../../utils/formatters'
import { useAuth } from '../../hooks/useAuth'

const TimesheetsPage = () => {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timesheets, setTimesheets] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    contractorId: user?.id || '',
    month: new Date().toISOString().slice(0, 7),
    entries: [{ date: '', hours: '' }],
  })
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [approving, setApproving] = useState(null)

  useEffect(() => { loadTimesheets() }, [])

  const loadTimesheets = async () => {
    try {
      setIsLoading(true); setError(null)
      const data = await timesheetService.getAllTimesheets()
      setTimesheets(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err?.message || 'Failed to load timesheets')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleEntryChange = (index, field, value) => {
    const newEntries = [...formData.entries]
    newEntries[index] = { ...newEntries[index], [field]: value }
    setFormData(prev => ({ ...prev, entries: newEntries }))
  }

  const addEntry = () => {
    setFormData(prev => ({ ...prev, entries: [...prev.entries, { date: '', hours: '' }] }))
  }

  const removeEntry = (index) => {
    setFormData(prev => ({ ...prev, entries: prev.entries.filter((_, i) => i !== index) }))
  }

  const handleApprove = async (id) => {
    try {
      setApproving(id)
      await timesheetService.approveTimesheet(id)
      await loadTimesheets()
    } catch (err) {
      setError(err?.message || 'Failed to approve timesheet')
    } finally {
      setApproving(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = {}
    if (!formData.contractorId) newErrors.contractorId = 'Contractor ID is required'
    if (!formData.month) newErrors.month = 'Month is required'
    if (formData.entries.length === 0) newErrors.entries = 'At least one entry is required'
    setFormErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setIsSubmitting(true)
    try {
      await timesheetService.createTimesheet(formData)
      setIsModalOpen(false)
      setFormData({ contractorId: user?.id || '', month: new Date().toISOString().slice(0, 7), entries: [{ date: '', hours: '' }] })
      await loadTimesheets()
    } catch (err) {
      setFormErrors({ submit: err?.message || 'Failed to create timesheet' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalHours = timesheets.reduce((acc, t) => acc + (t.totalHours || 0), 0)
  const approvedCount = timesheets.filter(t => t.status === 'APPROVED').length
  const pendingCount = timesheets.filter(t => t.status !== 'APPROVED' && t.status !== 'REJECTED').length

  const columns = [
    { key: 'month', label: 'Month', render: (row) => <span className="font-medium text-gray-900">{row.month}</span> },
    { key: 'totalHours', label: 'Total Hours', render: (row) => <span className="text-indigo-400 font-medium">{formatters.formatHours(row.totalHours)}</span> },
    {
      key: 'status', label: 'Status',
      render: (row) => <Badge variant={row.status === 'APPROVED' ? 'approved' : row.status === 'REJECTED' ? 'rejected' : 'pending'}>{row.status}</Badge>,
    },
    { key: 'contractorId', label: 'Contractor', render: (row) => <span className="text-gray-600">Contractor #{row.contractorId}</span> },
    {
      key: 'actions', label: 'Actions',
      render: (row) => (
        (user?.role === 'MANAGER' || user?.role === 'ADMIN') && row.status !== 'APPROVED' && row.status !== 'REJECTED' ? (
          <Button variant="success" size="sm" isLoading={approving === row.id} onClick={() => handleApprove(row.id)} className="flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Approve
          </Button>
        ) : null
      ),
    },
  ]

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Timesheets</h1>
            <p className="text-gray-600 mt-1 text-sm">Submit and manage timesheets</p>
          </div>
          {user?.role === 'CONTRACTOR' && (
            <Button variant="primary" onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Submit Timesheet
            </Button>
          )}
        </div>

        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              { icon: Clock, label: 'Total Hours', value: formatters.formatHours(totalHours), color: 'text-blue-400', bg: 'bg-blue-100' },
              { icon: CheckCircle2, label: 'Approved', value: approvedCount, color: 'text-emerald-400', bg: 'bg-emerald-100' },
              { icon: Timer, label: 'Pending', value: pendingCount, color: 'text-amber-400', bg: 'bg-amber-100' },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className="!p-4">
                  <div className="flex items-center gap-3">
                    <div className={`${stat.bg} p-2.5 rounded-xl`}><stat.icon className={`w-5 h-5 ${stat.color}`} /></div>
                    <div><p className="text-xs text-gray-500">{stat.label}</p><p className="text-xl font-bold text-gray-900">{stat.value}</p></div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-4 bg-red-500/10 rounded-xl border border-red-500/20 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" /><p className="text-red-400 text-sm">{error}</p>
          </motion.div>
        )}

        <Card isPadded={false}>
          {isLoading ? (
            <div className="py-12 flex justify-center"><Loader message="Loading timesheets..." /></div>
          ) : timesheets.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Clock className="w-8 h-8 text-gray-500" /></div>
              <p className="text-gray-600 text-lg font-medium">No timesheets found</p>
              <p className="text-gray-500 text-sm mt-1">Submit your first timesheet</p>
            </div>
          ) : (
            <Table columns={columns} data={timesheets} isLoading={false} />
          )}
        </Card>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Submit Timesheet" size="lg"
          footer={<><Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button variant="primary" isLoading={isSubmitting} onClick={handleSubmit}>Submit</Button></>}>
          <form className="space-y-4">
            {formErrors.submit && <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20"><p className="text-sm text-red-400">{formErrors.submit}</p></div>}
            <Input label="Month" name="month" type="month" value={formData.month} onChange={handleInputChange} error={formErrors.month} required />
            
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-900 text-sm">Timesheet Entries</h3>
                <Button variant="secondary" size="sm" onClick={addEntry}>Add Entry</Button>
              </div>
              {formErrors.entries && <p className="text-red-400 text-xs mb-2">{formErrors.entries}</p>}
              <div className="space-y-3">
                {formData.entries.map((entry, idx) => (
                  <div key={idx} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Input type="date" value={entry.date} onChange={(e) => handleEntryChange(idx, 'date', e.target.value)} placeholder="Date" />
                    </div>
                    <div className="w-28">
                      <Input type="number" value={entry.hours} onChange={(e) => handleEntryChange(idx, 'hours', e.target.value)} placeholder="Hours" />
                    </div>
                    {formData.entries.length > 1 && (
                      <Button variant="danger" size="sm" onClick={() => removeEntry(idx)} className="mb-0.5">
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </form>
        </Modal>
      </motion.div>
    </DashboardLayout>
  )
}

export default TimesheetsPage

