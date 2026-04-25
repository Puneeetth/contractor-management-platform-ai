import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { PrivateRoute, PublicRoute } from './PrivateRoute'

// Pages
import LoginPage from '../pages/LoginPage'
import SignupPage from '../pages/SignupPage'
import PendingApprovalPage from '../pages/PendingApprovalPage'
import DashboardPage from '../pages/DashboardPage'
import CustomersPage from '../pages/modules/CustomersPage'
import ContractorsPage from '../pages/modules/ContractorsPage'
import ContractsPage from '../pages/modules/ContractsPage'
import POsPage from '../pages/modules/POsPage'
import InvoicesPage from '../pages/modules/InvoicesPage'
import ExpensesPage from '../pages/modules/ExpensesPage'
import AdminPendingApprovalsPage from '../pages/modules/AdminPendingApprovalsPage'
import AdministrationPage from '../pages/modules/AdministrationPage'
import UnauthorizedPage from '../pages/UnauthorizedPage'
import BankAccountPage from '../pages/modules/BankAccountPage'

export const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <SignupPage />
            </PublicRoute>
          }
        />
        <Route
          path="/pending-approval"
          element={
            <PublicRoute>
              <PendingApprovalPage />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/customers"
          element={
            <PrivateRoute requiredRoles={['ADMIN', 'FINANCE', 'MANAGER']}>
              <CustomersPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/contractors"
          element={
            <PrivateRoute requiredRoles={['ADMIN', 'MANAGER']}>
              <ContractorsPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/contracts"
          element={
            <PrivateRoute requiredRoles={['ADMIN', 'MANAGER']}>
              <ContractsPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/pos"
          element={
            <PrivateRoute requiredRoles={['ADMIN', 'FINANCE', 'MANAGER']}>
              <POsPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/invoices"
          element={
            <PrivateRoute requiredRoles={['ADMIN', 'FINANCE', 'MANAGER', 'CONTRACTOR']}>
              <InvoicesPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/expenses"
          element={
            <PrivateRoute requiredRoles={['ADMIN', 'CONTRACTOR', 'MANAGER', 'FINANCE']}>
              <ExpensesPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/bank-account"
          element={
            <PrivateRoute requiredRoles={['CONTRACTOR']}>
              <BankAccountPage />
            </PrivateRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/pending-approvals"
          element={
            <PrivateRoute requiredRoles={['ADMIN']}>
              <AdminPendingApprovalsPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/administration"
          element={
            <PrivateRoute requiredRoles={['ADMIN']}>
              <AdministrationPage />
            </PrivateRoute>
          }
        />

        {/* Error Routes */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Catch all - redirect to dashboard or login */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}

export default AppRoutes