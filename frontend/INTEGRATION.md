# Frontend-Backend Integration Guide

## Overview

The frontend React application is fully integrated with the Spring Boot backend. This document outlines the integration points, API endpoints, and data flow.

## Backend API Configuration

### Base URL
- Development: `http://localhost:8080/api`
- The Vite dev server (port 3000) proxies `/api` requests to the backend

### Authentication

The backend uses JWT (JSON Web Token) authentication:

1. **Registration**: `POST /auth/register`
   - Request: `{ name, email, password, role, region }`
   - Response: Confirmation message (string)
   - User status: PENDING (requires admin approval)

2. **Login**: `POST /auth/login`
   - Request: `{ email, password }`
   - Response: JWT token (string)
   - Users must have APPROVED status to login

3. **Token Storage**: JWT token stored in localStorage
   - Key: `auth-store` (Zustand persisted store)
   - Automatically included in all API requests via Axios interceptor
   - Format: `Authorization: Bearer {token}`

## API Endpoints by Module

### Customers Module (`/admin/customers`)
- Admin-only access
- **GET** `/admin/customers` - List all customers
- **POST** `/admin/customers` - Create new customer

### Contracts Module (`/admin/contracts`)
- Admin-only access
- **GET** `/admin/contracts` - List all contracts
- **POST** `/admin/contracts` - Create new contract (links contractor to customer)

### Purchase Orders (`/admin/purchase-orders`)
- Admin-only access
- **GET** `/admin/purchase-orders` - List all POs
- **POST** `/admin/purchase-orders` - Create new PO
- **GET** `/admin/purchase-orders/contract/{contractId}` - Get POs for contract

### Timesheets (`/timesheets`)
- **GET** `/timesheets` - List all (ADMIN, MANAGER, FINANCE)
- **POST** `/timesheets` - Create (CONTRACTOR)
- **GET** `/timesheets/contractor/{contractorId}` - Get contractor's timesheets
- **PUT** `/timesheets/{id}/approve` - Approve (MANAGER)

### Invoices (`/invoices`)
- **GET** `/invoices` - List all (FINANCE, MANAGER, ADMIN)
- **POST** `/invoices` - Create from approved timesheet (CONTRACTOR)
- **GET** `/invoices/contractor/{contractorId}` - Get contractor's invoices
- **PUT** `/invoices/{id}/approve` - Approve (FINANCE)

### Expenses (`/expenses`)
- **GET** `/expenses` - List all (ADMIN, FINANCE)
- **POST** `/expenses?contractorId={id}` - Submit expense (CONTRACTOR)
- **GET** `/expenses/contractor/{contractorId}` - Get contractor's expenses
- **PUT** `/expenses/{id}/approve` - Approve (FINANCE)

## Data Models

### User Registration & Authentication
```javascript
// Registration
{
  name: "John Doe",
  email: "john@example.com",
  password: "SecurePass123!",
  role: "CONTRACTOR",
  region: "US"
}

// After approval, user can login with JWT token
// JWT payload contains: userId, email, name, role, status
```

### Customer
```javascript
{
  id: 1,
  name: "Acme Corp",
  address: "123 Business St",
  msa: "MSA-2024",
  msaContactPerson: "John Smith",
  msaContactEmail: "john@acme.com",
  countriesApplicable: "US, Canada",
  msaRemark: "Renewal due Q2 2025",
  noticePeriodDays: 30
}
```

### Contract
```javascript
{
  id: 1,
  contractorId: 5,
  billRate: 150.00,
  payRate: 120.00,
  estimatedHours: 160,
  estimatedBudget: 24000,
  startDate: "2024-01-01",
  endDate: "2024-12-31",
  noticePeriodDays: 15,
  throughEor: false,
  status: "ACTIVE"
}
```

### Timesheet
```javascript
{
  id: 1,
  contractorId: 5,
  month: "2024-04",
  totalHours: 160,
  status: "PENDING",
  entries: [
    { date: "2024-04-01", hours: 8 },
    { date: "2024-04-02", hours: 8 },
    // ... more entries
  ]
}
```

### Invoice
```javascript
{
  id: 1,
  contractorId: 5,
  invoiceMonth: "2024-04",
  totalHours: 160,
  baseAmount: 24000,    // totalHours × billRate
  taxAmount: 2400,      // baseAmount × 10%
  totalAmount: 26400,   // baseAmount + taxAmount
  status: "PENDING"
}
```

### Expense
```javascript
{
  id: 1,
  contractorId: 5,
  amount: 450.00,
  description: "Travel to client site",
  proofUrl: "https://example.com/receipt.pdf",
  status: "PENDING"
}
```

## Frontend Service Layer

All API calls go through service files in `src/services/`:

### Auth Service
```javascript
authService.login(email, password)      // Returns JWT token
authService.register(userData)          // Returns confirmation message
authService.logout()                    // Frontend only
```

### Customer Service
```javascript
customerService.getAllCustomers()
customerService.createCustomer(data)
```

### Contract Service
```javascript
contractService.getAllContracts()
contractService.createContract(data)
```

### Timesheet Service
```javascript
timesheetService.getAllTimesheets()
timesheetService.createTimesheet(data)
timesheetService.getTimesheetsByContractor(contractorId)
timesheetService.approveTimesheet(id)
```

### Invoice Service
```javascript
invoiceService.getAllInvoices()
invoiceService.createInvoice(data)
invoiceService.getInvoicesByContractor(contractorId)
invoiceService.approveInvoice(id)
```

### Expense Service
```javascript
expenseService.getAllExpenses()
expenseService.createExpense(contractorId, data)
expenseService.getExpensesByContractor(contractorId)
expenseService.approveExpense(id)
```

## Error Handling

The backend returns error responses in this format:
```javascript
{
  error: {
    message: "Detailed error message",
    status: 400 // HTTP status code
  }
}
```

Frontend catches these errors and displays user-friendly messages.

## Role-Based Access Control

| Role | Permissions |
|------|-----------|
| ADMIN | Full access to all features |
| FINANCE | View/approve invoices and expenses, view customers |
| MANAGER | View timesheets, approve timesheets, view expenses |
| CONTRACTOR | Submit timesheets, create invoices, submit expenses |

Navigation and features automatically adjust based on user role.

## Workflow Examples

### Timesheet to Invoice Workflow
1. Contractor submits timesheet with daily entries
2. System calculates total hours
3. Manager approves timesheet (status → APPROVED)
4. Contractor creates invoice from approved timesheet
5. System auto-calculates:
   - Base amount = totalHours × billRate
   - Tax = baseAmount × 10%
   - Total = baseAmount + taxAmount
6. Finance approves invoice (status → APPROVED)

### Expense Submission Workflow
1. Contractor submits expense with amount, description, proof URL
2. Status set to PENDING
3. Finance approves expense (status → APPROVED)

## Testing the Integration

### Prerequisites
- Backend running on `http://localhost:8080`
- Frontend running on `http://localhost:3000`

### Test Steps

1. **Register User**
   - Go to `/signup`
   - Create account with CONTRACTOR role
   - Wait for admin approval (can be mocked in backend)

2. **Login**
   - Go to `/login`
   - Login with registered credentials
   - Verify redirect to dashboard

3. **Create Customer** (Admin only)
   - Navigate to Customers page
   - Click "Add Customer"
   - Fill form and submit
   - Verify customer appears in table

4. **Create Contract** (Admin only)
   - Navigate to Contracts page
   - Click "Add Contract"
   - Fill form with contractor ID and rates
   - Submit and verify

5. **Submit Timesheet** (Contractor)
   - Navigate to Timesheets page
   - Click "Submit Timesheet"
   - Add daily entries
   - Submit and verify status is PENDING

6. **Approve Timesheet** (Manager)
   - View timesheet in list
   - Click approve button
   - Verify status changed to APPROVED

7. **Create Invoice** (Contractor)
   - Navigate to Invoices page
   - Create invoice from approved timesheet
   - Verify amounts calculated correctly

8. **Approve Invoice** (Finance)
   - View invoice in list
   - Click approve button
   - Verify status changed to APPROVED

## Troubleshooting

### "Failed to load customers"
- Check backend is running on port 8080
- Check authentication token is valid
- Verify user has ADMIN role
- Check browser console for detailed error

### "Unauthorized" error
- JWT token may be expired
- Clear localStorage and re-login
- Token in header format: `Bearer {token}`

### CORS errors
- Ensure Vite proxy is configured correctly in vite.config.js
- Check backend CORS settings
- Verify API base URL matches backend

### Form validation not working
- Check validators.js for validation logic
- Ensure Error component is displayed
- Verify field names match service expectations

## Deployment Checklist

- [ ] Update `.env` with production API URL
- [ ] Build frontend: `npm run build`
- [ ] Test all user workflows with production backend
- [ ] Verify all API endpoints are accessible
- [ ] Test error handling with invalid data
- [ ] Verify role-based access control
- [ ] Test with different user roles
- [ ] Validate form submissions
- [ ] Test logout and re-login
- [ ] Verify performance (Vite optimization)
