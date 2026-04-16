# Contractor Management Platform - System Design
## User Approval & Access Control System

---

## 1. OVERVIEW

This system implements a role-based user approval workflow where:
- **Finance Manager** and **Client (Customer)** can self-register (PENDING status)
- **Admin** must approve registrations before users can login
- **Admin** is the only one who can create **Contractors** (manually in DB initially)
- **Contractor** cannot self-register or create themselves

---

## 2. DATA MODEL

### 2.1 User Entity
```java
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    
    @Column(unique = true)
    private String email;
    
    private String password;        // Hashed
    
    @Enumerated(EnumType.STRING)
    private Role role;              // ADMIN, CONTRACTOR, FINANCE, MANAGER (CUSTOMER)
    
    private String region;
    
    @Enumerated(EnumType.STRING)
    private Status status;          // PENDING, APPROVED, REJECTED, INACTIVE
    
    private String approvalReason;  // For rejection/approval notes
    private Long approvedBy;        // User ID of admin who approved
    private LocalDateTime approvalDate;
}
```

### 2.2 Role Enum
```java
public enum Role {
    ADMIN,           // Can approve registrations, create contractors
    CONTRACTOR,      // Created only by admin, works on contracts
    FINANCE,         // Self-register, manage invoices/payments
    MANAGER          // Self-register, approve timesheets (CUSTOMER)
}
```

### 2.3 Status Enum
```java
public enum Status {
    PENDING,         // Awaiting admin approval (default for signup)
    APPROVED,        // Admin approved, can now login
    REJECTED,        // Admin rejected, cannot login
    INACTIVE         // Deactivated account
}
```

---

## 3. AUTHENTICATION & AUTHORIZATION FLOW

### 3.1 Registration Flow

```
User (Finance/Manager) fills signup form
        ↓
POST /api/auth/register
        ↓
Validate input (email uniqueness, password strength)
        ↓
Create User with Status = PENDING, Role = selected
        ↓
Hash password & save to DB
        ↓
Response: "Registration successful. Awaiting admin approval."
        ↓
User gets redirect to login (info message: pending)
```

### 3.2 Admin Approval Workflow

```
Admin views pending users
        ↓
Reviews user details (name, email, region, role)
        ↓
APPROVE or REJECT
        ↓
If APPROVE:
  - Status = APPROVED
  - approvedBy = Admin ID
  - approvalDate = now()
  - User receives notification (email optional)
        ↓
If REJECT:
  - Status = REJECTED
  - approvalReason = Admin's reason
  - User cannot login
```

### 3.3 Login Flow (After Approval)

```
POST /api/auth/login (email, password)
        ↓
Find user by email
        ↓
Check Status == APPROVED (if not → throw error)
        ↓
Authenticate password
        ↓
Generate JWT Token with:
  - userId
  - email
  - role
  - status
        ↓
Return token to frontend
        ↓
Frontend stores token & redirects to dashboard
```

### 3.4 Contractor Creation (Admin Only)

```
Admin dashboard → Create Contractor
        ↓
Fill contractor form + password
        ↓
POST /api/admin/contractors/create
        ↓
Validate authorization (ADMIN role only)
        ↓
Create User with:
  - Role = CONTRACTOR
  - Status = APPROVED (direct, no pending)
  - Password hash & save
        ↓
Return created contractor details
```

---

## 4. API ENDPOINTS

### 4.1 Authentication Endpoints

**POST /api/auth/register**
```json
Request: {
  "name": "John Doe",
  "email": "john@company.com",
  "password": "SecurePass123!",
  "role": "FINANCE",        // or "MANAGER"
  "region": "US"
}

Response: {
  "message": "Registration successful. Awaiting admin approval."
}

Error: 400 Bad Request
- Email already exists
- Password too weak
- Invalid role (CONTRACTOR not allowed)
```

**POST /api/auth/login**
```json
Request: {
  "email": "john@company.com",
  "password": "SecurePass123!"
}

Response: {
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@company.com",
    "role": "FINANCE",
    "status": "APPROVED"
  }
}

Error: 403 Forbidden
- User not found
- Status != APPROVED → "User pending approval" or "User rejected"
```

---

### 4.2 Admin Endpoints (Require ADMIN role)

**GET /api/admin/users/pending**
```json
Response: [
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@company.com",
    "role": "FINANCE",
    "region": "US",
    "status": "PENDING",
    "registeredDate": "2024-04-16T10:30:00"
  }
]
```

**POST /api/admin/users/{userId}/approve**
```json
Request: {
  "approvalReason": "Information verified"  // Optional
}

Response: {
  "id": 1,
  "status": "APPROVED",
  "approvedBy": 99,
  "approvalDate": "2024-04-16T11:00:00"
}
```

**POST /api/admin/users/{userId}/reject**
```json
Request: {
  "rejectionReason": "Invalid credentials"
}

Response: {
  "id": 1,
  "status": "REJECTED",
  "approvalReason": "Invalid credentials"
}
```

**POST /api/admin/contractors/create** (Admin only)
```json
Request: {
  "name": "Jane Contractor",
  "email": "jane@contractor.com",
  "password": "SecurePass123!",
  "region": "US",
  "specialization": "Software Development"  // Optional
}

Response: {
  "id": 5,
  "name": "Jane Contractor",
  "email": "jane@contractor.com",
  "role": "CONTRACTOR",
  "status": "APPROVED",
  "createdBy": 99  // Admin ID
}
```

**GET /api/admin/users?status=PENDING&role=FINANCE**
```json
Response: [
  { user details... }
]
```

---

## 5. DATABASE CHANGES

### Add to User Table:
```sql
ALTER TABLE users ADD COLUMN approval_reason VARCHAR(255);
ALTER TABLE users ADD COLUMN approved_by BIGINT REFERENCES users(id);
ALTER TABLE users ADD COLUMN approval_date TIMESTAMP;
ALTER TABLE users ADD COLUMN registered_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add index for faster queries
CREATE INDEX idx_status ON users(status);
CREATE INDEX idx_role_status ON users(role, status);
```

---

## 6. FRONTEND CHANGES

### 6.1 Updated Signup Page
- Show role selection: **Finance Manager** or **Client**
- Remove Contractor option
- Show success message: "Registration successful. Please wait for admin approval to login."
- Auto-redirect to info page (not login)

### 6.2 Updated Login Page
- Add pending/rejected user message
- If rejected → "Your registration was rejected. Please contact admin."
- If pending → "Your registration is pending admin approval."

### 6.3 Admin Dashboard Pages

**Pending Approvals Page** (`/admin/pending-approvals`)
```
Table with pending users:
- Name, Email, Role, Region, Registration Date
- Action buttons: [Approve] [Reject]
- Modal for rejection reason
- Success notification after action
```

**Contractors Management Page** (`/admin/contractors/create`)
```
Form to create new contractor:
- Name, Email, Password, Region, Specialization
- [Create Contractor] button
- Success notification with contractor details
```

---

## 7. IMPLEMENTATION CHECKLIST

### Backend
- [ ] Add fields to User entity (approvalReason, approvedBy, approvalDate)
- [ ] Create AdminService with approval methods
- [ ] Create AdminController with approval endpoints
- [ ] Add @PreAuthorize("ROLE_ADMIN") to admin endpoints
- [ ] Modify AuthService.login() to check status == APPROVED
- [ ] Modify AuthService.register() to validate role (not CONTRACTOR)
- [ ] Add endpoint to get pending users by status
- [ ] Add endpoint to create contractor (ADMIN only)
- [ ] Create migration script for database changes

### Frontend
- [ ] Update SignupPage:
  - Remove CONTRACTOR role option
  - Show role selection: FINANCE, MANAGER
  - Update success message
  - Redirect to pending info page
- [ ] Create PendingPage (info page after signup)
- [ ] Update LoginPage:
  - Show rejection/pending message
  - Handle 403 responses
- [ ] Create Admin Approval Dashboard:
  - PendingApprovalsPage
  - ContractorCreationPage
  - Pending users table with actions
- [ ] Update AdminLayout with new menu items

---

## 8. SECURITY CONSIDERATIONS

1. **Admin-Only Operations**: Use `@PreAuthorize("ROLE_ADMIN")` on all admin endpoints
2. **Status Check**: Verify user.status == APPROVED before token generation
3. **Role Validation**: Prevent CONTRACTOR self-registration
4. **Password Policy**: Enforce strong passwords for contractors created by admin
5. **Audit Trail**: Log who approved/rejected and when
6. **Email Verification** (Future): Optional email verification before approval

---

## 9. USER JOURNEYS

### Journey 1: Finance Manager Registration
```
1. Finance Manager fills signup form (role = FINANCE)
2. System creates User with status = PENDING
3. Admin reviews pending users
4. Admin approves → status = APPROVED
5. Finance Manager can now login
6. Finance Manager can manage invoices, payments
```

### Journey 2: Client Registration
```
1. Client fills signup form (role = MANAGER/CUSTOMER)
2. System creates User with status = PENDING
3. Admin reviews pending users
4. Admin approves → status = APPROVED
5. Client can now login
6. Client can manage contracts, timesheets
```

### Journey 3: Admin Creates Contractor
```
1. Admin goes to Create Contractor form
2. Admin fills contractor details + password
3. System creates User with role = CONTRACTOR, status = APPROVED
4. Contractor receives credentials (email notification optional)
5. Contractor can login immediately
```

### Journey 4: Rejected Applicant
```
1. Finance Manager tries to login
2. System checks status = REJECTED
3. Shows error: "Your registration was rejected. Please contact admin."
4. Cannot proceed with login
```

---

## 10. ERROR HANDLING

| Error | HTTP Status | Message |
|-------|------------|---------|
| Email already exists | 400 | "Email already registered" |
| Invalid role (CONTRACTOR) | 400 | "Invalid role for registration" |
| User not found | 404 | "User not found" |
| Status not APPROVED | 403 | "User pending approval" or "User rejected" |
| Wrong password | 401 | "Invalid credentials" |
| Unauthorized (not ADMIN) | 403 | "Insufficient permissions" |

---

## 11. NOTIFICATIONS (Optional but Recommended)

- Email when user registration is approved
- Email when user registration is rejected (with reason)
- In-app notification for pending users
- Admin notification when new registrations await approval

---

## 12. FUTURE ENHANCEMENTS

1. **Email Verification**: Send verification link on signup
2. **Two-Factor Authentication**: For ADMIN accounts
3. **Bulk Operations**: Approve/reject multiple users at once
4. **Expiry Logic**: Auto-reject pending users after 30 days
5. **Role Hierarchy**: Manager can approve contractors (configurable)
6. **Audit Logging**: Complete audit trail of approvals
7. **API Token Management**: Different token expiry for roles
