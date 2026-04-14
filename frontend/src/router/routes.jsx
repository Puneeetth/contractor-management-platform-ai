import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { PrivateRoute, PublicRoute } from './PrivateRoute'

// Pages
import LoginPage from '../pages/LoginPage'
import SignupPage from '../pages/SignupPage'
import DashboardPage from '../pages/DashboardPage'
import CustomersPage from '../pages/modules/CustomersPage'
import ContractorsPage from '../pages/modules/ContractorsPage'
import POsPage from '../pages/modules/POsPage'
import TimesheetsPage from '../pages/modules/TimesheetsPage'
import InvoicesPage from '../pages/modules/InvoicesPage'
import ExpensesPage from '../pages/modules/ExpensesPage'
import UnauthorizedPage from '../pages/UnauthorizedPage'

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
          path="/pos"
          element={
            <PrivateRoute requiredRoles={['ADMIN', 'FINANCE', 'MANAGER']}>
              <POsPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/timesheets"
          element={
            <PrivateRoute requiredRoles={['CONTRACTOR', 'MANAGER', 'FINANCE']}>
              <TimesheetsPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/invoices"
          element={
            <PrivateRoute requiredRoles={['FINANCE', 'MANAGER', 'CONTRACTOR']}>
              <InvoicesPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/expenses"
          element={
            <PrivateRoute requiredRoles={['CONTRACTOR', 'MANAGER', 'FINANCE']}>
              <ExpensesPage />
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
