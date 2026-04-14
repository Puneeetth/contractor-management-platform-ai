# Contractor Management Platform AI

## Overview
The AI-Powered Contractor Management Platform is a centralized system for managing contractors, customers, purchase orders, timesheets, invoices, and expenses with strict validation, role-based access, and region-based control.

The platform ensures:
- Financial accuracy 💰
- Operational transparency 📊
- Controlled contractor lifecycle 🔐

## Core Architecture
- Backend: Spring Boot (Java)
- Frontend: React + vite (Tailwind css) and motion framer
- Database: MySQL
- Authentication: JWT (stateless)

## User Roles
- **ADMIN**: Full control, approvals, customer + PO + contractor creation
- **CONTRACTOR**: Submit timesheets, invoices, expenses
- **MANAGER**: Approve timesheets
- **FINANCE**: Approve invoices & expenses

## Core Modules

### 1. Customer Management
Admin creates and manages customers.

Fields:
- Name
- Address
- MSA
- Created Date
- MSA Renewal Date
- MSA Remarks
- Countries Applicable
- MSA Contact Person
- MSA Contact Email
- Notice Period (given by customer)

Behavior:
- A customer can have multiple Purchase Orders
- Acts as the root entity for business flow

### 2. Purchase Order (PO) Management
Each PO is tied to a customer and defines financial/project scope.

Fields:
- PO Number
- PO Date
- Start Date / End Date
- PO Value
- Currency
- Payment Terms (days)
- Number of Resources (contractors)
- Remarks
- Shared With (stakeholders)

Behavior:
- A PO belongs to one customer
- A PO can have multiple contractors assigned
- PO duration can differ from contract duration

### 3. Contractor Management
Contractors are created by Admin and linked to a PO.

Fields:
- Name
- Address
- Location
- Email
- Email-2
- Phone Number
- Customer (via PO)
- PO Allocation
- Bill Rate (client-facing)
- Pay Rate (internal cost)
- Start Date / End Date
- Notice Period
- Estimated Hours
- Estimated Budget
- EOR (Engaged via Employer of Record)
- Remarks

Behavior:
- Contractor must belong to a PO
- Contractor lifecycle is controlled via approval
- Region-based filtering applies

### 4. Contract Management
Defines contractor engagement terms.

Fields:
- Hourly Rate
- Start / End Date
- Notice Period

Behavior:
- Used for billing calculations
- Can differ from PO duration

### 5. Timesheet Management
Contractors submit monthly work logs.

Structure:
- One timesheet per contractor per month
- Multiple daily entries

Fields:
- Month (YYYY-MM)
- Date-wise entries
- Total hours
- Status (Submitted, Approved, Rejected)

Behavior:
- Submitted by contractor
- Approved by manager
- Drives invoice generation

### 6. Invoice Management
Invoices are generated/uploaded based on approved timesheets.

Fields:
- Invoice Month
- Total Hours
- Base Amount (hours × rate)
- Tax Amount (fixed %)
- Total Amount
- Status

Validations:
- Invoice hours must match timesheet hours
- Only one invoice per month per contractor

Behavior:
- Approved by finance
- Strict financial validation enforced

### 7. Expense Management
Contractors can submit additional expenses.

Fields:
- Amount
- Description
- Proof (file URL)
- Status

Behavior:
- Requires approval (finance/admin)
- Linked to contractor

## Authentication & Security
- JWT-based stateless authentication
- Role-based access control (RBAC)
- Endpoint-level restrictions:
  - `/api/admin/**` → ADMIN only
  - `/api/contractor/**` → CONTRACTOR
  - `/api/finance/**` → FINANCE
- Only approved users can log in
- Token validation on every request

## Region-Based Filtering
- Users tagged with region (UK, EU, etc.)
- Data visibility filtered based on region
- Useful for compliance and organizational segmentation

## End-to-End Flow
1. Admin creates Customer
2. Admin creates PO under Customer
3. Admin creates Contractor under PO
4. Contractor submits Timesheet
5. Manager approves Timesheet
6. Contractor uploads Invoice
7. System validates hours match
8. Finance approves Invoice
9. Contractor submits Expenses
10. Finance/Admin approves Expenses

## Key Validations
- One timesheet per contractor per month
- One invoice per month per contractor
- Invoice hours = Timesheet hours
- Contractor must belong to a PO
- PO must belong to a Customer

## Design Principles
- Monolithic architecture (MVP optimized)
- Clean layered structure: Controller → Service → Repository
- DTO + Transformer pattern
- Lazy loading for performance
- Minimal but scalable schema

## What’s Simplified (MVP)
- Fixed tax calculation
- Single-level approval flow
- No notifications (email/SMS)
- No file storage service (use URLs)
- No multi-currency logic (basic support only)
- No audit/history tracking

## Outcome

## Quick Start

1. Start the backend (default port 8080):

```powershell
cd backend
./mvnw spring-boot:run
# or on Windows
# mvnw.cmd spring-boot:run
```

2. Start the frontend (Vite, default port 3000):

```powershell
cd frontend
npm install
npm run dev
```

3. Open the app in your browser: `http://localhost:3000`

4. Useful endpoints:

- Frontend: `http://localhost:3000` (login/signup)
- Backend API base: `http://localhost:8080/api`
- Health: `http://localhost:8080/actuator/health`

If you see a blank page, ensure `frontend/index.html` contains `<div id="root"></div>` and that the frontend `npm run dev` is running.
This platform delivers:
- Structured contractor lifecycle management
- Accurate financial tracking
- Controlled approval workflows
- Scalable foundation for future expansion
