# System Architecture Diagram

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CONTRACTOR MANAGEMENT PLATFORM                       │
│                         User Approval System                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────┐       ┌──────────────────────────────┐
│      FRONTEND (React)         │       │     BACKEND (Spring Boot)    │
└──────────────────────────────┘       └──────────────────────────────┘
         │                                        │
         ├─ SignupPage                           ├─ AuthService
         │  (FINANCE/MANAGER)                    │  (register/login)
         │                                        │
         ├─ PendingApprovalPage                  ├─ AdminService
         │  (Info after signup)                  │  (approve/reject)
         │                                        │
         ├─ LoginPage                            ├─ AdminController
         │  (Enhanced errors)                    │  (admin endpoints)
         │                                        │
         ├─ AdminPendingApprovalsPage            ├─ User Entity
         │  (Approve/Reject)                     │  + approval fields
         │                                        │
         └─ ContractorCreationPage               └─ Database
            (Create Contractors)                    + migration script
```

---

## User Registration Flow

```
START
  │
  ├─ User → Signup Page
  │          ↓
  │    Select Role (FINANCE or MANAGER)
  │          ↓
  │    Fill Form & Submit
  │          ↓
  ├─ AuthService.register()
  │    ├─ Validate role (NOT CONTRACTOR) ✓
  │    ├─ Check email uniqueness ✓
  │    ├─ Hash password ✓
  │    ├─ Set status = PENDING ✓
  │    └─ Set registeredDate = NOW() ✓
  │          ↓
  ├─ Success Message
  │  "Awaiting admin approval"
  │          ↓
  ├─ Redirect to /pending-approval
  │  (Show approval timeline)
  │          ↓
  ├─ Admin Reviews
  │    ├─ Go to /admin/pending-approvals
  │    ├─ Search/Filter users
  │    ├─ Click [Approve] or [Reject]
  │          ↓
  │    IF Approve:
  │    │    ├─ AdminService.approveUser()
  │    │    ├─ Set status = APPROVED ✓
  │    │    ├─ Set approvalDate = NOW() ✓
  │    │    ├─ Set approvedBy = Admin ID ✓
  │    │    └─ Optional approval reason
  │    │
  │    ELSE Reject:
  │         ├─ AdminService.rejectUser()
  │         ├─ Set status = REJECTED ✓
  │         ├─ Set approvalDate = NOW() ✓
  │         ├─ Required rejection reason ✓
  │         └─ Set approvedBy = Admin ID ✓
  │          ↓
  ├─ User Attempts Login
  │    ├─ Enter email & password
  │    ├─ Find user by email
  │    ├─ Check status:
  │    │    ├─ PENDING → Error: "Awaiting approval"
  │    │    ├─ REJECTED → Error: "Registration rejected"
  │    │    ├─ INACTIVE → Error: "Account inactive"
  │    │    └─ APPROVED → Authenticate password ✓
  │    │         └─ Generate JWT token ✓
  │    └─ Login successful → Redirect to /dashboard
  │
  └─ END
```

---

## Admin Contractor Creation Flow

```
START
  │
  ├─ Admin → Go to /admin/contractors/create
  │          ↓
  │    Fill Contractor Form:
  │    ├─ Name (required)
  │    ├─ Email (required, unique)
  │    ├─ Password (8+ chars, mixed case, number, special)
  │    ├─ Region (required)
  │    └─ Specialization (optional)
  │          ↓
  ├─ Submit Form
  │          ↓
  ├─ AdminService.createContractor()
  │    ├─ Validate email uniqueness ✓
  │    ├─ Validate password strength ✓
  │    ├─ Create User with:
  │    │    ├─ role = CONTRACTOR ✓
  │    │    ├─ status = APPROVED ✓ (Direct approval!)
  │    │    ├─ registeredDate = NOW() ✓
  │    │    ├─ password (BCrypt hashed) ✓
  │    │    └─ region & specialization ✓
  │    └─ Save to Database
  │          ↓
  ├─ Success Card Shows:
  │  ├─ Contractor name
  │  ├─ Email
  │  ├─ Status: APPROVED
  │  └─ Ready to login
  │          ↓
  ├─ Contractor Receives Credentials
  │    └─ Can login immediately
  │          ↓
  └─ END
```

---

## Admin Approval Dashboard Flow

```
┌─ Admin Dashboard: /admin/pending-approvals
│
├─ Display:
│  ├─ Stats card: "Pending Review: X"
│  ├─ Search bar (by name/email)
│  ├─ Filter dropdown (All Roles / FINANCE / MANAGER)
│  └─ Table of pending users:
│      ├─ Name | Email | Role | Region | Registered | Actions
│      └─ Each row has [Approve] [Reject] buttons
│
├─ User Clicks [Approve]:
│  ├─ Modal opens with:
│  │  ├─ User info confirmation
│  │  ├─ Optional approval note
│  │  └─ [Cancel] [Approve] buttons
│  └─ On confirm:
│      ├─ POST /api/admin/users/{userId}/approve
│      ├─ User status → APPROVED
│      ├─ Show success notification
│      └─ Refresh table
│
├─ User Clicks [Reject]:
│  ├─ Modal opens with:
│  │  ├─ User info confirmation
│  │  ├─ Required rejection reason (textarea)
│  │  └─ [Cancel] [Reject] buttons
│  └─ On confirm:
│      ├─ POST /api/admin/users/{userId}/reject
│      ├─ User status → REJECTED
│      ├─ Show success notification
│      └─ Refresh table
│
└─ Table Updates in Real-Time
```

---

## Status Transition Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    USER STATUS LIFECYCLE                │
└─────────────────────────────────────────────────────────┘

    PENDING                  APPROVED
       ↑                         ↑
       │                         │
       │  [Register]             │  [Approve]
       ├─────────────────────────┤
       │                         │
       │                         ↓
       │     ┌──────────────────────────┐
       │     │  Can Login               │
       │     │  Access Dashboard        │
       │     │  Use Application         │
       │     └──────────────────────────┘
       │                         │
       │                         │
       │                    [Deactivate]
       │                         │
       │                         ↓
       │                    INACTIVE
       │                         │
       │                    [Reactivate]
       │                         │
       ├─────────────────────────┘
       │
       │
    [Reject]
       │
       ↓
    REJECTED
       │
       └─ Cannot Login
       └─ Cannot Access System
       └─ Cannot Do Anything

States & Permissions:
═════════════════════════════════════════════════════════
PENDING   → Cannot login, Awaiting approval
APPROVED  → Can login, Full access based on role
REJECTED  → Cannot login, Show rejection message
INACTIVE  → Cannot login, Show account inactive message
═════════════════════════════════════════════════════════
```

---

## API Call Sequence Diagram

```
┌─────────────────────────────────────────────────────────────┐
│              APPROVAL WORKFLOW API SEQUENCE                 │
└─────────────────────────────────────────────────────────────┘

SCENARIO 1: User Registration & Approval
═════════════════════════════════════════

Frontend                          Backend                      Database
   │                               │                            │
   ├──POST /auth/register ─────────→                            │
   │  {name, email, pwd,           │                            │
   │   role, region}               │                            │
   │                               ├─ Validate role ✓           │
   │                               ├─ Check email ✓             │
   │                               ├─ Hash password             │
   │                               ├─ Set status=PENDING        │
   │                               ├─ Set registered_date       │
   │                               │                      ├─ INSERT user
   │                               │                      │  (PENDING)
   │                               │                      ←─
   │←──────── "Success" ───────────│                      │
   │                               │                      │
   ├──GET /admin/users/pending ────→                      │
   │  (Admin only)                 │                 ├─ SELECT * WHERE
   │                               │                 │   status=PENDING
   │                               │                 │
   │←───── [List of pending] ──────│←─────────────────┤
   │                               │                  │
   ├──POST /admin/users/{id}/approve──→              │
   │  {approvalReason}             │                  │
   │                               ├─ Verify ADMIN    │
   │                               ├─ Set status=APPROVED
   │                               ├─ Set approval_date
   │                               │  ├─ UPDATE user
   │                               │  │  SET status=APPROVED
   │                               │  │      approved_date=NOW()
   │                               │  │      approved_by={adminId}
   │                               │  │
   │                               │  ←──────────────┤
   │←────── {user object} ─────────│                  │
   │    (status: APPROVED)         │                  │
   │                               │                  │
   ├──POST /auth/login ────────────→                  │
   │  {email, password}            │                  │
   │                               ├─ Find by email───→ SELECT * FROM users
   │                               │              WHERE email=?
   │                               │   ←───────────────┤
   │                               ├─ Check status
   │                               │  (APPROVED) ✓
   │                               ├─ Verify password
   │                               ├─ Generate JWT
   │←────── {token} ───────────────│                  │
   │                               │                  │
   └───────────────────────────────┴──────────────────┘

SCENARIO 2: Contractor Creation
════════════════════════════════

Frontend                          Backend                      Database
   │                               │                            │
   ├──POST /admin/contractors/create──→                         │
   │  {name, email, pwd,           │                            │
   │   region, specialization}     │                            │
   │                               ├─ Verify ADMIN ✓            │
   │                               ├─ Check email ✓             │
   │                               ├─ Validate password         │
   │                               ├─ Create User with:         │
   │                               │  ├─ role=CONTRACTOR        │
   │                               │  ├─ status=APPROVED ✓      │
   │                               │  ├─ Hash password          │
   │                               │                      ├─ INSERT user
   │                               │                      │  (APPROVED,
   │                               │                      │   CONTRACTOR)
   │                               │                      ←─
   │←────── {contractor} ──────────│                      │
   │    (status: APPROVED)         │                      │
   │    Ready to login             │                      │
   │                               │                      │
   └───────────────────────────────┴──────────────────────┘
```

---

## Database Schema Diagram

```
┌─────────────────────────────────────────────────┐
│                    USERS TABLE                  │
├─────────────────────────────────────────────────┤
│ PK  id                    BIGINT                │
│ UK  email                 VARCHAR(255)          │
│     name                  VARCHAR(255)          │
│     password              VARCHAR(255)  ← Hashed
│     role                  ENUM  ────────┐       │
│                           (ADMIN,       │       │
│                            CONTRACTOR,  │  Role
│                            FINANCE,     │       │
│                            MANAGER)     │       │
│     status                ENUM  ────────┐       │
│                           (PENDING,     │  Status
│                            APPROVED,    │       │
│                            REJECTED,    │       │
│                            INACTIVE)    │       │
│     region                VARCHAR(255)  │       │
│     registered_date       TIMESTAMP NOT NULL   │
│                                    ↑ When user registered
│     approval_reason       VARCHAR(255)        │
│                                    ↑ Approval/rejection notes
│     approval_date         TIMESTAMP          │
│                                    ↑ When approved/rejected
│ FK  approved_by           BIGINT → users(id) │
│                                    ↑ Which admin approved
│     secondaryEmail        VARCHAR(255)       │
│     address               VARCHAR(255)       │
│     location              VARCHAR(255)       │
│     phoneNumber           VARCHAR(255)       │
├─────────────────────────────────────────────────┤
│ INDEXES:                                        │
│  - idx_email              (email)               │
│  - idx_role               (role)                │
│  - idx_status             (status)              │
│  - idx_role_status        (role, status)        │
│  - idx_approved_by        (approved_by)         │
│  - idx_registered_date    (registered_date)     │
│  - idx_approval_date      (approval_date)       │
└─────────────────────────────────────────────────┘
```

---

## Authorization & Access Control

```
┌──────────────────────────────────────────────────────┐
│           ROLE-BASED ACCESS MATRIX                   │
├──────────────────────────────────────────────────────┤
│                                                      │
│                 PUBLIC  FINANCE  MANAGER  CONTRACTOR │
│                                                      │
│ Signup                    ✓        ✓        ✗       │
│ (Register)                                          │
│                                                      │
│ Login                     ✓        ✓        ✓       │
│ (if APPROVED)                                       │
│                                                      │
│ View Pending              ✗        ✗        ✗       │
│ Approvals                                           │
│                                                      │
│ Approve User              ✗        ✗        ✗       │
│                                                      │
│ Reject User               ✗        ✗        ✗       │
│                                                      │
│ Create Contractor         ✗        ✗        ✗       │
│                                                      │
│ Deactivate User           ✗        ✗        ✗       │
│                                                      │
│ ═════════════════════════ ADMIN ONLY ═══════════     │
│                                                      │
└──────────────────────────────────────────────────────┘

NOTES:
- ✓ = Allowed
- ✗ = Not Allowed / Blocked
- ADMIN can do everything (not shown in table)
```

---

## Error Handling Flow

```
LOGIN ATTEMPT
    │
    ├─→ User Not Found
    │       └─→ Error: "User not found"
    │
    ├─→ User Found, Check Status:
    │
    ├─→ Status = PENDING
    │       └─→ Error: "Your registration is pending admin approval"
    │           Icon: Clock (amber)
    │           Action: Tell to wait or contact admin
    │
    ├─→ Status = REJECTED
    │       └─→ Error: "Your registration was rejected"
    │           Icon: X Circle (red)
    │           Action: Contact admin for reason
    │
    ├─→ Status = INACTIVE
    │       └─→ Error: "Your account is inactive"
    │           Icon: Alert Circle (red)
    │           Action: Contact admin to reactivate
    │
    ├─→ Status = APPROVED
    │       ├─→ Password Wrong
    │       │       └─→ Error: "Invalid credentials"
    │       │
    │       ├─→ Password Correct
    │       │       └─→ Generate JWT Token ✓
    │       │           Redirect to Dashboard
    │       │
    │       └─→ SUCCESS ✓
    │
    └─→ COMPLETE
```

---

## Deployment Architecture

```
┌────────────────────────────────────┐
│    Development Environment          │
├────────────────────────────────────┤
│  Frontend (npm dev server)          │
│  Port: 3000                         │
│  Files: src/pages, src/router       │
└────────────────────────────────────┘
         │
         ↓ API calls
┌────────────────────────────────────┐
│    Backend (Spring Boot)            │
├────────────────────────────────────┤
│  Port: 8080                         │
│  Services: Auth, Admin              │
│  Controllers: Auth, Admin           │
└────────────────────────────────────┘
         │
         ↓ SQL queries
┌────────────────────────────────────┐
│    Database (MySQL/PostgreSQL)      │
├────────────────────────────────────┤
│  users table (with new columns)     │
│  Migration: V1_2 applied            │
└────────────────────────────────────┘
```

---

## Summary

This visual representation shows:
1. ✅ User registration flow (PENDING → APPROVED/REJECTED)
2. ✅ Admin approval dashboard operations
3. ✅ Direct contractor creation (APPROVED immediately)
4. ✅ Status lifecycle and transitions
5. ✅ API call sequences
6. ✅ Database schema with approval fields
7. ✅ Authorization matrix
8. ✅ Error handling paths
9. ✅ Overall system architecture
