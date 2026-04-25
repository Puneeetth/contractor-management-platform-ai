# Bank Account Module - Implementation Guide

## Overview
This document describes the Bank Account functionality that has been implemented for the Contractor Management Platform. The feature allows contractors to manage their bank account details and display them when creating invoices.

---

## Backend Implementation

### 1. Entity: BankAccount
**File:** `backend/src/main/java/com/cmp/ai/entity/BankAccount.java`

- One-to-One relationship with User entity
- Fields:
  - `accountHolderName` (required)
  - `bankName` (required)
  - `accountNumber` (required)
  - `ifscCode` (required)
  - `branch` (optional)
  - `createdAt` & `updatedAt` (timestamps)

### 2. Repository: BankAccountRepository
**File:** `backend/src/main/java/com/cmp/ai/repository/BankAccountRepository.java`

- `findByUserId(Long userId)` - Fetch bank account by user ID
- `findByUser(User user)` - Fetch bank account by User entity
- Extends JpaRepository for CRUD operations

### 3. Service: BankAccountService
**File:** `backend/src/main/java/com/cmp/ai/service/BankAccountService.java`

**Methods:**
- `getBankAccount(Long userId)` - Retrieve bank account (returns null if not exists)
- `saveBankAccount(Long userId, BankAccountRequest)` - Create or update bank account
- `deleteBankAccount(Long userId)` - Delete bank account

**Features:**
- Account number masking (shows only last 4 digits)
- Automatic timestamp management
- Transaction support for data consistency

### 4. Controller: BankAccountController
**File:** `backend/src/main/java/com/cmp/ai/controller/BankAccountController.java`

**Endpoints:**
```
GET    /api/bank-accounts/user/{userId}     - Get bank account
POST   /api/bank-accounts/user/{userId}     - Create/Update bank account
DELETE /api/bank-accounts/user/{userId}     - Delete bank account
```

**Security:** All endpoints require `CONTRACTOR`, `ADMIN`, or `FINANCE` roles

### 5. DTOs

**BankAccountRequest** - For POST/PUT requests
```java
{
  "accountHolderName": "John Doe",
  "bankName": "HDFC",
  "accountNumber": "1234567890",
  "ifscCode": "HDFC0001234",
  "branch": "Downtown Branch" (optional)
}
```

**BankAccountResponse** - API response
```java
{
  "id": 1,
  "accountHolderName": "John Doe",
  "bankName": "HDFC",
  "accountNumber": "1234567890",
  "maskedAccountNumber": "****7890",
  "ifscCode": "HDFC0001234",
  "branch": "Downtown Branch",
  "createdAt": "2026-04-25T10:00:00",
  "updatedAt": "2026-04-25T10:00:00"
}
```

### 6. Database Migration
**File:** `backend/src/main/resources/bank-accounts-migration.sql`

Run the SQL migration to create the table. JPA will auto-create it with `spring.jpa.hibernate.ddl-auto=update`.

---

## Frontend Implementation

### 1. Bank Account Service
**File:** `frontend/src/services/bankAccountService.js`

**Methods:**
```javascript
getBankAccount(userId)                    // Get bank account details
saveBankAccount(userId, bankAccountData)  // Create or update
deleteBankAccount(userId)                 // Delete bank account
```

### 2. Bank Account Page
**File:** `frontend/src/pages/modules/BankAccountPage.jsx`

**Features:**
- Display existing bank account (read-only)
- Form to add/edit bank account details
- Client-side validation for required fields
- Success/error notifications
- Loading states

**Routes to add in your routing:**
```
/bank-account - Bank Account management page (CONTRACTOR only)
```

### 3. Bank Details Card Component
**File:** `frontend/src/components/ui/BankDetailsCard.jsx`

Reusable component that displays:
- Bank details summary (read-only)
- Masked account number
- Edit button
- Loading state
- Error handling
- "No bank details" message with Add button

### 4. Sidebar Navigation
**Updated:** `frontend/src/components/layout/Sidebar.jsx`

- Added "Bank Account" menu item
- Only visible to CONTRACTOR role
- Links to `/bank-account` page

### 5. Invoice Form Integration
**Updated:** `frontend/src/pages/modules/InvoicesPage.jsx`

- Added `BankDetailsCard` component to Create Invoice modal
- Displays at bottom of form before submit button
- Edit button redirects to Bank Account page
- Shows appropriate message if no bank details exist

---

## User Journey

### For Contractors:

#### 1. **Adding Bank Account**
1. Click "Bank Account" in left sidebar
2. See empty state with "Add Bank Account" button
3. Click button to open form
4. Fill in all required fields:
   - Account Holder Name
   - Bank Name
   - Account Number
   - IFSC/SWIFT Code
   - Branch (optional)
5. Click "Save"
6. Success message appears
7. Bank details now display in read-only format

#### 2. **Editing Bank Account**
1. From Bank Account page, click "Edit" button
2. Form opens with pre-filled data
3. Modify any fields
4. Click "Save"
5. Data updates successfully

#### 3. **Using Bank Details in Invoice**
1. Click "Create Invoice" button
2. Fill in invoice details
3. Scroll to "Bank Account Details" section
4. See bank details displayed (account number is masked)
5. To update: Click "Edit" button
6. Redirected to Bank Account page
7. After updating, return and create invoice

---

## API Testing

### Get Bank Account
```bash
GET http://localhost:8080/api/bank-accounts/user/1
Authorization: Bearer <token>

Response:
{
  "id": 1,
  "accountHolderName": "John Doe",
  "bankName": "HDFC",
  "maskedAccountNumber": "****7890",
  "ifscCode": "HDFC0001234",
  "branch": "Downtown",
  "createdAt": "2026-04-25T10:00:00",
  "updatedAt": "2026-04-25T10:00:00"
}
```

### Create/Update Bank Account
```bash
POST http://localhost:8080/api/bank-accounts/user/1
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "accountHolderName": "John Doe",
  "bankName": "HDFC",
  "accountNumber": "1234567890",
  "ifscCode": "HDFC0001234",
  "branch": "Downtown"
}

Response: 201 Created (with updated data)
```

### Delete Bank Account
```bash
DELETE http://localhost:8080/api/bank-accounts/user/1
Authorization: Bearer <token>

Response: 204 No Content
```

---

## File Structure

```
Backend Files:
├── entity/
│   └── BankAccount.java
├── repository/
│   └── BankAccountRepository.java
├── service/
│   └── BankAccountService.java
├── controller/
│   └── BankAccountController.java
├── dto/
│   ├── request/
│   │   └── BankAccountRequest.java
│   └── response/
│       └── BankAccountResponse.java
└── resources/
    └── bank-accounts-migration.sql

Frontend Files:
├── pages/modules/
│   └── BankAccountPage.jsx
├── components/ui/
│   └── BankDetailsCard.jsx
├── services/
│   └── bankAccountService.js
├── components/layout/
│   └── Sidebar.jsx (updated)
├── pages/modules/
│   └── InvoicesPage.jsx (updated)
└── router/
    └── routes.jsx (updated)
```

---

## Security Considerations

1. **Account Number Masking:** Only last 4 digits shown to frontend
2. **Authorization:** All endpoints check user role (CONTRACTOR, ADMIN, FINANCE)
3. **Data Validation:** Required fields validated on both frontend and backend
4. **Database:** User-BankAccount is one-to-one with CASCADE delete
5. **Transaction Management:** Service methods use @Transactional

---

## Validation Rules

### Frontend (Client-side):
- Account Holder Name: Required, non-empty string
- Bank Name: Required, non-empty string
- Account Number: Required, non-empty string
- IFSC Code: Required, non-empty string
- Branch: Optional

### Backend (Server-side):
- Same validations via @NotBlank and @NotNull annotations
- Enforced via Jakarta validation framework

---

## Future Enhancements

1. **Bank Verification API Integration** - Validate IFSC code against RBI database
2. **Multiple Bank Accounts** - Allow contractors to store multiple accounts
3. **Bank Account Selection** - Choose which account to use per invoice
4. **Account History** - Track changes and previous accounts
5. **Bulk Upload** - Import bank details from CSV
6. **Payment Integration** - Use stored account for automatic payments

---

## Troubleshooting

### Issue: 404 Not Found on Bank Account endpoints
**Solution:** Ensure backend is running and user ID is valid

### Issue: "No bank details found" message in invoice form
**Solution:** User hasn't added bank account yet. Navigate to Bank Account page to add.

### Issue: Account number not masked in frontend
**Solution:** Ensure API response includes `maskedAccountNumber` field

### Issue: Form not submitting
**Solution:** Check browser console for validation errors. All required fields must be filled.

---

## Testing Checklist

- [ ] Create bank account successfully
- [ ] Edit bank account successfully
- [ ] Delete bank account successfully
- [ ] Account number is masked (****1234)
- [ ] Bank details appear in invoice form
- [ ] Edit button redirects to bank account page
- [ ] Empty state message shows when no account exists
- [ ] Required field validation works
- [ ] Sidebar menu item visible only for CONTRACTOR role
- [ ] Success/error notifications display properly
- [ ] Loading states work correctly

---

## Support & Questions

For questions or issues with the Bank Account functionality, check:
1. Database migration ran successfully
2. Backend service is running on correct port
3. Frontend environment variables are set correctly
4. User has CONTRACTOR role for bank account management
5. API endpoints are accessible and returning correct data
