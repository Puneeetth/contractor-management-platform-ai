import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, X, Clock, AlertCircle, Search, Filter } from 'lucide-react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import apiClient from '../../services/apiClient'

const AdminPendingApprovalsPage = () => {
  const [pendingUsers, setPendingUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [action, setAction] = useState(null)
  const [reason, setReason] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')

  useEffect(() => {
    fetchPendingUsers()
  }, [])

  const fetchPendingUsers = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/api/admin/users/pending')
      setPendingUsers(response.data || [])
      setError('')
    } catch (err) {
      setError('Failed to load pending users: ' + (err.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = pendingUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const handleApprove = async () => {
    if (!selectedUser) return
    try {
      await apiClient.post(`/api/admin/users/${selectedUser.id}/approve`, {
        approvalReason: reason || 'Information verified'
      })
      setSuccess(`${selectedUser.name} has been approved!`)
      setSelectedUser(null)
      setAction(null)
      setReason('')
      fetchPendingUsers()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to approve user: ' + (err.message || 'Unknown error'))
    }
  }

  const handleReject = async () => {
    if (!selectedUser || !reason.trim()) {
      setError('Please provide a rejection reason')
      return
    }
    try {
      await apiClient.post(`/api/admin/users/${selectedUser.id}/reject`, {
        rejectionReason: reason
      })
      setSuccess(`${selectedUser.name} has been rejected`)
      setSelectedUser(null)
      setAction(null)
      setReason('')
      fetchPendingUsers()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to reject user: ' + (err.message || 'Unknown error'))
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pending Approvals</h1>
          <p className="text-gray-600">Review and approve user registrations</p>
        </div>

        {/* Alerts */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3"
          >
            <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-emerald-700 text-sm">{success}</p>
          </motion.div>
        )}

        {/* Filters */}
        <div className="mb-6 flex gap-4 flex-wrap">
          <div className="flex-1 min-w-64 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
            >
              <option value="ALL">All Roles</option>
              <option value="FINANCE">Finance Manager</option>
              <option value="MANAGER">Client</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-xs text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">{pendingUsers.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-indigo-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading pending users...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredUsers.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No pending approvals</p>
            <p className="text-gray-500 text-sm mt-1">All registrations have been reviewed</p>
          </div>
        )}

        {/* Users Table */}
        {!loading && filteredUsers.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Region</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Registered</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{user.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          user.role === 'FINANCE' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {user.role === 'FINANCE' ? 'Finance Manager' : 'Client'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">{user.region || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">
                          {user.registeredDate ? new Date(user.registeredDate).toLocaleDateString() : 'N/A'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              setAction('approve')
                              setReason('')
                            }}
                            className="p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Approve"
                          >
                            <Check className="w-4 h-4 text-emerald-600" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              setAction('reject')
                              setReason('')
                            }}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Reject"
                          >
                            <X className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal */}
        {action && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg max-w-md w-full shadow-lg"
            >
              <div className={`p-6 ${action === 'approve' ? 'bg-emerald-50' : 'bg-red-50'} border-b`}>
                <h2 className={`text-lg font-bold ${action === 'approve' ? 'text-emerald-900' : 'text-red-900'}`}>
                  {action === 'approve' ? 'Approve User' : 'Reject User'}
                </h2>
                <p className={`text-sm ${action === 'approve' ? 'text-emerald-800' : 'text-red-800'} mt-1`}>
                  {selectedUser.name} ({selectedUser.email})
                </p>
              </div>

              <div className="p-6 space-y-4">
                {action === 'reject' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rejection Reason (Required)
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Enter the reason for rejection..."
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50"
                      rows={3}
                    />
                  </div>
                )}

                {action === 'approve' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Approval Note (Optional)
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Enter any notes about this approval..."
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50"
                      rows={3}
                    />
                  </div>
                )}
              </div>

              <div className="p-6 border-t flex gap-3">
                <button
                  onClick={() => {
                    setSelectedUser(null)
                    setAction(null)
                    setReason('')
                  }}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={action === 'approve' ? handleApprove : handleReject}
                  className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                    action === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {action === 'approve' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default AdminPendingApprovalsPage
