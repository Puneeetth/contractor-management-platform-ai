# User Approval System - Implementation Guide

## Overview

This document provides step-by-step instructions for implementing the user approval system where:
- Finance Managers and Clients can self-register (status: PENDING)
- Admins must approve these registrations
- Only Admins can create Contractors (they bypass pending approval)
- Users cannot login until approved

---

## Part 1: Backend Implementation

### 1.1 Database Migration

**File Location:** `backend/src/main/resources/db/migration/V1_2__AddUserApprovalFields.sql`

Run the migration to add approval-related fields to the users table:
- `approval_reason` - stores notes about approval/rejection
- `approved_by` - foreign key to User (admin who approved)
- `approval_date` - when the approval/rejection occurred
- `registered_date` - when user initially registered
- Indexes for performance optimization

**Steps:**
1. Ensure you have Flyway configured in your pom.xml
2. Spring Boot will automatically run migrations on startup
3. Verify migration completed successfully in application logs

### 1.2 Enum Updates

**File:** `backend/src/main/java/com/cmp/ai/enums/Status.java`

Updated to include `INACTIVE` status for deactivated accounts:
```java
public enum Status {
    PENDING,      // Awaiting admin approval
    APPROVED,     // Approved and can login
    REJECTED,     // Rejected by admin
    INACTIVE      // Deactivated account
}
```

### 1.3 Entity Updates

**File:** `backend/src/main/java/com/cmp/ai/entity/User.java`

Added approval workflow fields:
```java
private String approvalReason;        // Approval/rejection notes
private User approvedBy;              // Admin reference
private LocalDateTime approvalDate;   // When approved
private LocalDateTime registeredDate; // When registered
```

**Important:** These fields are automatically managed by the application logic.

### 1.4 AuthService Updates

**File:** `backend/src/main/java/com/cmp/ai/service/AuthService.java`

**Changes:**
- Validates that Contractors cannot self-register
- Checks for email uniqueness during registration
- Sets `registeredDate` when user signs up
- Enhanced login validation with specific status checks

**Error Messages:**
- "Contractors can only be created by admin"
- "Email already registered"
- "Your registration is pending admin approval"
- "Your registration was rejected. Please contact admin"
- "Your account is inactive"

### 1.5 New AdminService

**File:** `backend/src/main/java/com/cmp/ai/service/AdminService.java`

Provides admin-only operations:
- `approveUser()` - Approve a pending user
- `rejectUser()` - Reject a pending user with reason
- `createContractor()` - Create contractor (direct approval)
- `deactivateUser()` - Deactivate account
- `reactivateUser()` - Reactivate inactive account
- Query methods for filtering users

### 1.6 New AdminController

**File:** `backend/src/main/java/com/cmp/ai/controller/AdminController.java`

**Protected Endpoints** (Admin only via `@PreAuthorize("hasRole('ADMIN')")`):

```
GET  /api/admin/users/pending
     - Returns all pending users awaiting approval

GET  /api/admin/users/pending/role/{role}
     - Filter pending users by role (FINANCE or MANAGER)

GET  /api/admin/users
     - Get all users with optional filters (?status=PENDING&role=FINANCE)

POST /api/admin/users/{userId}/approve
     - Approve a user
     - Body: { "approvalReason": "optional reason" }

POST /api/admin/users/{userId}/reject
     - Reject a user
     - Body: { "rejectionReason": "required reason" }

POST /api/admin/contractors/create
     - Create new contractor (direct approval)
     - Body: { "name", "email", "password", "region", "specialization" }

PUT  /api/admin/users/{userId}/deactivate
     - Deactivate user account

PUT  /api/admin/users/{userId}/reactivate
     - Reactivate inactive user

GET  /api/admin/users/{userId}
     - Get user details
```

### 1.7 Repository Updates

**File:** `backend/src/main/java/com/cmp/ai/repository/UserRepository.java`

Added new query methods:
```java
List<User> findByStatus(Status status);
List<User> findByRoleAndStatus(Role role, Status status);
```

### 1.8 DTOs

**New Request DTOs:**
- `ApprovalRequest` - Optional approval notes
- `RejectionRequest` - Required rejection reason
- `ContractorCreationRequest` - Contractor details

**Updated Response DTO:**
- `UserResponse` - Now includes approval fields

### 1.9 Transformer Updates

**File:** `backend/src/main/java/com/cmp/ai/transformer/UserTransformer.java`

Updated to map new approval fields to UserResponse

---

## Part 2: Frontend Implementation

### 2.1 Updated SignupPage

**File:** `frontend/src/pages/SignupPage.jsx`

**Changes:**
1. Role dropdown excludes CONTRACTOR option
2. Shows MANAGER as "Client"
3. Default role changed to FINANCE
4. Success message: "Registration successful! Please wait for admin approval to login."
5. Redirects to `/pending-approval` instead of `/login`
6. Validates that only FINANCE and MANAGER roles can register

### 2.2 New PendingApprovalPage

**File:** `frontend/src/pages/PendingApprovalPage.jsx`

Info page displayed after signup showing:
- Registration status (submitted, pending, ready)
- Timeline of approval process
- Information about what happens next
- Expected approval time (~1-2 business hours)
- Links to go back to login or home

**Route:** `/pending-approval` (Public)

### 2.3 Updated LoginPage

**File:** `frontend/src/pages/LoginPage.jsx`

**Enhanced Error Handling:**
- Detects pending approval status → shows clock icon with pending message
- Detects rejected status → shows X icon with rejection message
- Detects inactive status → shows alert icon with inactive message
- Shows appropriate UI for each status

**Error Messages:**
- Pending: "Your registration is pending admin approval. Please wait for approval before logging in."
- Rejected: "Your registration was rejected. Please contact the admin for more information."
- Inactive: "Your account is currently inactive. Please contact the admin."

### 2.4 New AdminPendingApprovalsPage

**File:** `frontend/src/pages/modules/AdminPendingApprovalsPage.jsx`

Admin dashboard to review and approve/reject users:

**Features:**
- Table of all pending users with details
- Search functionality (by name/email)
- Filter by role (Finance Manager, Client)
- One-click approve/reject buttons
- Modal dialog for approval with optional notes
- Modal dialog for rejection with required reason
- Stats card showing pending count
- Success/error notifications

**Route:** `/admin/pending-approvals` (Admin only)

### 2.5 New ContractorCreationPage

**File:** `frontend/src/pages/modules/ContractorCreationPage.jsx`

Admin page to create new contractors:

**Features:**
- Form for contractor details (name, email, password, region, specialization)
- Client-side validation:
  - Password: min 8 chars, uppercase, lowercase, number, special char
  - Email uniqueness check
  - Required fields validation
- Success card showing created contractor info
- Direct approval (contractors created here are immediately approved)
- Reset form functionality

**Route:** `/admin/contractors/create` (Admin only)

### 2.6 Updated Routes

**File:** `frontend/src/router/routes.jsx`

Added new routes:
```
/pending-approval          - Public (info after signup)
/admin/pending-approvals   - Private (admin only)
/admin/contractors/create  - Private (admin only)
```

---

## Part 3: Deployment Steps

### 3.1 Backend Deployment

1. **Update Dependencies** (if needed)
   - Ensure Spring Security is configured with @PreAuthorize support
   - Verify Flyway is in pom.xml

2. **Build Backend**
   ```bash
   cd backend
   mvn clean install
   ```

3. **Database Migration**
   - Spring Boot will automatically run Flyway migrations
   - Check logs for: "Migration completed successfully"
   - Verify columns added to users table

4. **Deploy Backend**
   ```bash
   java -jar target/cmp-ai-application.jar
   ```

### 3.2 Frontend Deployment

1. **Install Dependencies** (if new packages added)
   ```bash
   cd frontend
   npm install
   ```

2. **Build Frontend**
   ```bash
   npm run build
   ```

3. **Deploy Built Files**
   - Copy `dist/` folder to web server
   - Or use: `npm run preview` for testing

---

## Part 4: System Testing

### 4.1 Test Registration Flow

**Test Case 1: Finance Manager Registration**
1. Go to `/signup`
2. Select role: "Finance Manager"
3. Fill form and submit
4. Should see: "Registration successful! Please wait for admin approval to login."
5. Should redirect to `/pending-approval`
6. Try to login → Should see: "Your registration is pending admin approval"

**Test Case 2: Client Registration**
1. Go to `/signup`
2. Select role: "Client"
3. Fill form and submit
4. Should see pending approval message
5. Redirect to pending approval info page

### 4.2 Test Admin Approval Flow

**Test Case 1: Approve User**
1. Login as ADMIN
2. Go to `/admin/pending-approvals`
3. See pending users in table
4. Click approve button
5. Enter optional reason and confirm
6. User status should update to APPROVED
7. User can now login

**Test Case 2: Reject User**
1. Login as ADMIN
2. Go to `/admin/pending-approvals`
3. Click reject button
4. Enter rejection reason (required)
5. Confirm rejection
6. User receives rejection message on login

### 4.3 Test Contractor Creation

**Test Case 1: Create Contractor**
1. Login as ADMIN
2. Go to `/admin/contractors/create`
3. Fill contractor details
4. Submit form
5. Should see success card with contractor info
6. New contractor can login immediately (bypasses pending approval)

---

## Part 5: Configuration

### 5.1 Application Properties

Add to `application.properties`:
```properties
# Security - enable @PreAuthorize annotation
spring.security.enable=true

# JWT Token - for authentication
jwt.secret=your-secret-key-here
jwt.expiration=86400000

# Admin notification email (optional)
admin.notification.email=admin@company.com
```

### 5.2 Database Connection

Ensure database connection is configured:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/contractor_db
spring.datasource.username=root
spring.datasource.password=your-password
spring.jpa.hibernate.ddl-auto=validate
spring.flyway.enabled=true
```

---

## Part 6: User Management

### 6.1 Creating Initial Admin User

Since Admins cannot register through the system, create manually in database:

```sql
INSERT INTO users (id, name, email, password, role, status, region, registered_date, approval_date)
VALUES (
  1,
  'Admin User',
  'admin@company.com',
  '$2a$10$...',  -- Use BCrypt hashed password
  'ADMIN',
  'APPROVED',
  'US',
  NOW(),
  NOW()
);
```

Or use Spring Boot admin creation endpoint (if implemented)

### 6.2 Bulk Approve Users

```sql
UPDATE users 
SET status = 'APPROVED', 
    approval_date = NOW(),
    approved_by = 1
WHERE status = 'PENDING';
```

---

## Part 7: API Response Examples

### Successful Registration
```json
{
  "message": "User registered. Awaiting approval."
}
```

### Successful Login (After Approval)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "name": "John Doe",
    "email": "john@company.com",
    "role": "FINANCE",
    "status": "APPROVED"
  }
}
```

### Login Error - Pending
```json
{
  "error": "Your registration is pending admin approval"
}
```

### Admin Approve User
```json
{
  "id": 2,
  "name": "John Doe",
  "email": "john@company.com",
  "role": "FINANCE",
  "status": "APPROVED",
  "registeredDate": "2024-04-16T10:30:00",
  "approvalDate": "2024-04-16T11:00:00",
  "approvalReason": "Information verified",
  "approvedById": 1,
  "approvedByName": "Admin User"
}
```

### Create Contractor
```json
{
  "id": 5,
  "name": "Jane Contractor",
  "email": "jane@contractor.com",
  "role": "CONTRACTOR",
  "status": "APPROVED",
  "registeredDate": "2024-04-16T11:30:00",
  "approvalDate": "2024-04-16T11:30:00"
}
```

---

## Part 8: Troubleshooting

### Issue: Users can't see pending-approval page after signup
**Solution:** Ensure route `/pending-approval` is added to routes.jsx and PendingApprovalPage is imported

### Issue: Admin can't approve users
**Solution:** 
1. Check user is logged in as ADMIN role
2. Verify @PreAuthorize annotation on controller
3. Check JWT token includes ROLE_ADMIN

### Issue: Contractor creation fails with email error
**Solution:** Email already exists in database. Ensure form validates email before submission

### Issue: Migration fails
**Solution:**
1. Check SQL syntax in V1_2__AddUserApprovalFields.sql
2. Ensure Flyway migration file is in correct location
3. Check database logs for detailed error

---

## Part 9: Next Steps & Future Enhancements

1. **Email Notifications**
   - Send email when registration approved
   - Send email when registration rejected

2. **Admin Dashboard**
   - Overall statistics
   - Bulk operations
   - User activity logs

3. **Advanced Filters**
   - Date range filters
   - Bulk approval/rejection
   - Export user list

4. **Two-Factor Authentication**
   - For ADMIN accounts
   - Additional security layer

5. **Audit Trail**
   - Log all approvals/rejections
   - Track who approved which users
   - Compliance reporting

---

## Support & Questions

For questions about implementation, refer to:
- SYSTEM_DESIGN.md - High-level system design
- Code comments in new classes
- Database migration comments
