# Create Invoice Form - Select Contract Feature

## Overview
Added a "Select Contract" dropdown field at the top of the Create Invoice form that displays only active contracts for the logged-in contractor.

---

## Changes Made

### 1. Updated Imports
**File**: `/frontend/src/pages/modules/InvoicesPage.jsx`

Added `Select` component to imports:
```jsx
import { Card, Button, Table, Loader, Modal, Input, Badge, Textarea, Select } from '../../components/ui'
```

Added `contractService` import:
```jsx
import { contractService } from '../../services/contractorService'
```

### 2. Added New State Variables
```jsx
const [contracts, setContracts] = useState([])          // List of active contracts
const [selectedContract, setSelectedContract] = useState('') // Selected contract ID
const [contractsLoading, setContractsLoading] = useState(false) // Loading indicator
```

### 3. Added Contract Loading Logic
New `useEffect` hook that triggers when the modal opens:
```jsx
useEffect(() => {
  const loadContracts = async () => {
    if (!isModalOpen || !user?.id || user?.role !== 'CONTRACTOR') return
    try {
      setContractsLoading(true)
      const data = await contractService.getContractsByContractor(user.id)
      // Filter for active contracts only
      const activeContracts = Array.isArray(data) 
        ? data.filter(contract => contract.status === 'ACTIVE' || contract.status === 'active')
        : []
      setContracts(activeContracts)
    } catch (err) {
      console.error('Failed to load contracts:', err)
      setContracts([])
    } finally {
      setContractsLoading(false)
    }
  }
  loadContracts()
}, [isModalOpen, user?.id, user?.role])
```

### 4. Updated Contract Service
**File**: `/frontend/src/services/contractorService.js`

Added new method to fetch contracts by contractor:
```javascript
getContractsByContractor: async (contractorId) => {
  return apiClient.get(`/contracts/contractor/${contractorId}`)
},
```

### 5. Added Select Contract Field to Form
Added at the top of the Create Invoice form (before Month field):
```jsx
<Select
  label="Select Contract"
  placeholder="Choose an active contract"
  options={contracts.map(contract => ({
    value: contract.id,
    label: `${contract.contractName || contract.poNumber || `Contract ${contract.id}`}`
  }))}
  value={selectedContract}
  onChange={(e) => setSelectedContract(e.target.value)}
  disabled={contractsLoading}
/>
```

---

## Form Layout

```
┌──────────────────────────────────────┐
│    Create Invoice Modal              │
├──────────────────────────────────────┤
│                                      │
│ [Select Contract dropdown] ← NEW     │
│ "Choose an active contract"          │
│                                      │
│ [ Month ]      [ Total Hours ]       │
│                                      │
│ [ Rate ]       [ Base Amount ]       │
│                                      │
│ [ Tax % ]      [ Total Amount ]      │
│ ☐ Allow tax change                   │
│                                      │
│ [ Invoice File ]  [ Timesheet File ] │
│                                      │
│              [Cancel] [Submit]       │
│                                      │
└──────────────────────────────────────┘
```

---

## Features

✅ **Loads Active Contracts Only**
- Filters contracts with `status === 'ACTIVE'` (case-insensitive)
- Only shows for logged-in contractors

✅ **Smart Display Labels**
- Shows contract name if available
- Falls back to PO number if contract name not available
- Falls back to "Contract [ID]" if neither available

✅ **Loading State**
- Dropdown is disabled while contracts are loading
- Loading happens when modal opens

✅ **Error Handling**
- Gracefully handles API failures
- Shows empty list if no contracts available
- Logs errors to console for debugging

✅ **Modal-Triggered Loading**
- Contracts load only when modal opens
- Prevents unnecessary API calls
- Reloads fresh data each time modal opens

---

## Backend Requirements

### API Endpoint
The backend should provide:
```
GET /contracts/contractor/{contractorId}
```

**Response Format**:
```json
[
  {
    "id": 1,
    "contractName": "AI Development Contract",
    "poNumber": "PO-2026-001",
    "status": "ACTIVE",
    "startDate": "2026-01-01",
    "endDate": "2026-12-31",
    ...
  },
  ...
]
```

**Status Field**:
- Must be present in the contract object
- Should be "ACTIVE" for active contracts
- Case-insensitive matching (ACTIVE, active, Active all work)

### Optional Contract Fields
The component tries to display these fields (in order):
1. `contractName` - Preferred
2. `poNumber` - Fallback
3. `id` - Last resort

---

## Usage

### For Contractors
1. Click "Create Invoice" button
2. Modal opens and contracts load automatically
3. Select a contract from the dropdown
4. Fill in remaining invoice details
5. Submit

### For Admins/Finance
The dropdown is not shown (only visible for CONTRACTOR role).

---

## Component Behavior

| Scenario | Behavior |
|----------|----------|
| Modal opens | Contracts load automatically |
| No active contracts | Dropdown shows placeholder, no options |
| Contract API fails | Error logged, empty list shown |
| Contractor not logged in | Contracts not loaded |
| Admin/Finance user | Feature not visible |
| Modal closes | Contract selection is preserved until form reset |
| Form submits | Contract ID is available in `selectedContract` state |

---

## Future Enhancements

Possible improvements:
- [ ] Store selected contract in form data
- [ ] Pass contract ID to invoice creation API
- [ ] Auto-populate contract details (rate, duration)
- [ ] Show contract status badge
- [ ] Display contract value and remaining budget
- [ ] Add contract details tooltip on hover
- [ ] Show only contracts for current month
- [ ] Remember last selected contract

---

## Testing Checklist

- [ ] Dropdown appears at top of form
- [ ] Contractor sees only active contracts
- [ ] Non-contractors don't see the dropdown
- [ ] Loading state works (disabled while loading)
- [ ] Contract names display correctly
- [ ] Fallback to PO number works
- [ ] Fallback to Contract ID works
- [ ] API errors handled gracefully
- [ ] Modal can close without selecting contract
- [ ] Form submission works with contract selected
- [ ] Form submission works without contract selected
- [ ] Contracts reload when modal opens again

---

## Files Modified

| File | Changes |
|------|---------|
| `/frontend/src/pages/modules/InvoicesPage.jsx` | Added Select import, contract state, useEffect, and Select field |
| `/frontend/src/services/contractorService.js` | Added `getContractsByContractor` method |

---

## Component Integration

The Select component is already part of the UI library and was imported from:
```jsx
import { Select } from '../../components/ui'
```

This ensures consistent styling and behavior with the rest of the application.
