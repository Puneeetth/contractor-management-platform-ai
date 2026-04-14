import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, AlertCircle, Check, X } from 'lucide-react'
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

  useEffect(() => {
    loadTimesheets()
  }, [])

  const loadTimesheets = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await timesheetService.getAllTimesheets()
      setTimesheets(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err?.error?.message || 'Failed to load timesheets')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleEntryChange = (index, field, value) => {
    const newEntries = [...formData.entries]
    newEntries[index] = { ...newEntries[index], [field]: value }
    setFormData(prev => ({ ...prev, entries: newEntries }))
  }

  const addEntry = () => {
    setFormData(prev => ({
      ...prev,
      entries: [...prev.entries, { date: '', hours: '' }]
    }))
  }

  const removeEntry = (index) => {
    setFormData(prev => ({
      ...prev,
      entries: prev.entries.filter((_, i) => i !== index)
    }))
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
      setFormData({
        contractorId: user?.id || '',
        month: new Date().toISOString().slice(0, 7),
        entries: [{ date: '', hours: '' }],
      })
      await loadTimesheets()
    } catch (err) {
      setFormErrors({ submit: err?.error?.message || 'Failed to create timesheet' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns = [
    { key: 'month', label: 'Month' },
    { 
      key: 'totalHours', 
      label: 'Total Hours',
      render: (row) => formatters.formatHours(row.totalHours)
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'APPROVED' ? 'approved' : row.status === 'REJECTED' ? 'rejected' : 'pending'}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'contractorId',
      label: 'Contractor',
      render: (row) => `Contractor #${row.contractorId}`
    },
  ]

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Timesheets</h1>
            <p className="text-gray-600 mt-1">Submit and manage timesheets</p>
          </div>
          {user?.role === 'CONTRACTOR' && (
            <Button variant="primary" onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Submit Timesheet
            </Button>
          )}
        </div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
          </motion.div>
        )}

        <Card>
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <Loader message="Loading timesheets..." />
            </div>
          ) : timesheets.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500 text-lg">No timesheets found</p>
            </div>
          ) : (
            <Table columns={columns} data={timesheets} isLoading={false} />
          )}
        </Card>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Submit Timesheet"
          size="lg"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button variant="primary" isLoading={isSubmitting} onClick={handleSubmit}>Submit</Button>
            </>
          }
        >
          <form className="space-y-4">
            {formErrors.submit && <div className="p-3 bg-red-50 rounded-lg"><p className="text-sm text-red-800">{formErrors.submit}</p></div>}
            
            <Input label="Month" name="month" type="month" value={formData.month} onChange={handleInputChange} error={formErrors.month} required />
            
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Timesheet Entries</h3>
                <Button variant="secondary" size="sm" onClick={addEntry}>Add Entry</Button>
              </div>
              {formErrors.entries && <p className="text-red-500 text-sm mb-2">{formErrors.entries}</p>}
              <div className="space-y-3">
                {formData.entries.map((entry, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input type="date" value={entry.date} onChange={(e) => handleEntryChange(idx, 'date', e.target.value)} placeholder="Date" className="flex-1" />
                    <Input type="number" value={entry.hours} onChange={(e) => handleEntryChange(idx, 'hours', e.target.value)} placeholder="Hours" className="w-24" />
                    {formData.entries.length > 1 && (
                      <Button variant="danger" size="sm" onClick={() => removeEntry(idx)}>
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
