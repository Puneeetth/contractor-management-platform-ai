# Invoice Creation - Backend Implementation Guide

## Overview
The frontend is now sending the `rate` parameter when creating invoices. The backend needs to handle this parameter and use it for calculations instead of fetching from the contractor's stored rate.

---

## API Endpoint Changes

### Endpoint: `POST /invoices`

#### Request Body (NEW Format)
```json
{
  "contractorId": "contractor-123",
  "invoiceMonth": "2026-04",
  "totalHours": 160,
  "rate": 50.00,
  "taxPercentage": 18,
  "invoiceFile": <File>,
  "timesheetFile": <File>
}
```

#### Changes from Previous Format
- ✅ **NEW**: `rate` field (decimal, per hour)
- ✅ All other fields remain the same

---

## Backend Calculation Logic

### Calculation Formula
The backend should calculate invoice amounts using this formula:

```
baseAmount = totalHours × rate
taxAmount = baseAmount × (taxPercentage / 100)
totalAmount = baseAmount + taxAmount
```

### Example Calculation
```
Input:
  totalHours: 160
  rate: 50.00
  taxPercentage: 18

Calculation:
  baseAmount = 160 × 50.00 = 8,000.00
  taxAmount = 8,000.00 × (18 / 100) = 1,440.00
  totalAmount = 8,000.00 + 1,440.00 = 9,440.00

Output:
  {
    "baseAmount": 8000.00,
    "taxAmount": 1440.00,
    "totalAmount": 9440.00
  }
```

---

## Database Schema Update (if needed)

### Invoice Table
Ensure your invoice table includes these columns:

```sql
CREATE TABLE invoices (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  contractor_id BIGINT NOT NULL,
  invoice_month VARCHAR(7), -- Format: YYYY-MM
  
  -- Work Input Fields
  total_hours DECIMAL(10, 2) NOT NULL,
  rate DECIMAL(10, 2) NOT NULL,  -- ← NEW FIELD
  
  -- Calculation Fields
  base_amount DECIMAL(12, 2) NOT NULL,
  tax_percentage DECIMAL(5, 2) NOT NULL,
  tax_amount DECIMAL(12, 2) NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  
  -- File References
  invoice_file_url VARCHAR(255),
  timesheet_file_url VARCHAR(255),
  
  -- Audit Fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Status Fields
  status VARCHAR(20), -- PENDING, APPROVED, REJECTED
  admin_approval_status VARCHAR(20),
  finance_approval_status VARCHAR(20),
  
  -- Rejection Reasons
  admin_rejection_reason TEXT,
  finance_rejection_reason TEXT,
  
  FOREIGN KEY (contractor_id) REFERENCES contractors(id)
);
```

### Key Changes
- ✅ **NEW**: `rate` column - to store the hourly rate used
- ✅ **NEW**: `tax_amount` column - to store calculated tax separately
- ✅ **UPDATED**: Ensure `base_amount` and `total_amount` are calculated from `rate` × `total_hours`

---

## Java/Spring Implementation Example

### Controller Layer
```java
@PostMapping("/invoices")
public ResponseEntity<?> createInvoice(
    @RequestParam("contractorId") Long contractorId,
    @RequestParam("invoiceMonth") String invoiceMonth,
    @RequestParam("totalHours") BigDecimal totalHours,
    @RequestParam("rate") BigDecimal rate,  // ← NEW PARAMETER
    @RequestParam("taxPercentage") BigDecimal taxPercentage,
    @RequestParam("invoiceFile") MultipartFile invoiceFile,
    @RequestParam("timesheetFile") MultipartFile timesheetFile
) throws Exception {
    
    // Validate inputs
    if (totalHours.compareTo(BigDecimal.ZERO) <= 0) {
        return ResponseEntity.badRequest()
            .body("Total hours must be greater than 0");
    }
    
    if (rate.compareTo(BigDecimal.ZERO) <= 0) {
        return ResponseEntity.badRequest()
            .body("Rate must be greater than 0");
    }
    
    if (taxPercentage.compareTo(BigDecimal.ZERO) < 0) {
        return ResponseEntity.badRequest()
            .body("Tax percentage cannot be negative");
    }
    
    // Create invoice
    Invoice invoice = invoiceService.createInvoice(
        contractorId, invoiceMonth, totalHours, rate, taxPercentage,
        invoiceFile, timesheetFile
    );
    
    return ResponseEntity.ok(invoice);
}
```

### Service Layer
```java
@Service
public class InvoiceService {
    
    public Invoice createInvoice(
        Long contractorId,
        String invoiceMonth,
        BigDecimal totalHours,
        BigDecimal rate,  // ← NEW PARAMETER
        BigDecimal taxPercentage,
        MultipartFile invoiceFile,
        MultipartFile timesheetFile
    ) throws Exception {
        
        // Create invoice object
        Invoice invoice = new Invoice();
        invoice.setContractorId(contractorId);
        invoice.setInvoiceMonth(invoiceMonth);
        invoice.setTotalHours(totalHours);
        invoice.setRate(rate);  // ← STORE RATE
        invoice.setTaxPercentage(taxPercentage);
        
        // Calculate amounts
        BigDecimal baseAmount = totalHours.multiply(rate);
        BigDecimal taxAmount = baseAmount.multiply(
            taxPercentage.divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
        );
        BigDecimal totalAmount = baseAmount.add(taxAmount);
        
        invoice.setBaseAmount(baseAmount);
        invoice.setTaxAmount(taxAmount);
        invoice.setTotalAmount(totalAmount);
        
        // Upload files
        String invoiceFileUrl = fileService.uploadFile(invoiceFile, "invoices");
        String timesheetFileUrl = fileService.uploadFile(timesheetFile, "timesheets");
        
        invoice.setInvoiceFileUrl(invoiceFileUrl);
        invoice.setTimesheetFileUrl(timesheetFileUrl);
        
        // Set initial status
        invoice.setStatus("PENDING");
        invoice.setAdminApprovalStatus("PENDING");
        invoice.setFinanceApprovalStatus("PENDING");
        
        // Save to database
        return invoiceRepository.save(invoice);
    }
}
```

### Entity Model
```java
@Entity
@Table(name = "invoices")
public class Invoice {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "contractor_id", nullable = false)
    private Long contractorId;
    
    @Column(name = "invoice_month")
    private String invoiceMonth;
    
    // Work Details
    @Column(name = "total_hours", nullable = false)
    private BigDecimal totalHours;
    
    @Column(name = "rate", nullable = false)  // ← NEW FIELD
    private BigDecimal rate;
    
    // Calculations
    @Column(name = "base_amount", nullable = false)
    private BigDecimal baseAmount;
    
    @Column(name = "tax_percentage", nullable = false)
    private BigDecimal taxPercentage;
    
    @Column(name = "tax_amount", nullable = false)
    private BigDecimal taxAmount;
    
    @Column(name = "total_amount", nullable = false)
    private BigDecimal totalAmount;
    
    // Files
    @Column(name = "invoice_file_url")
    private String invoiceFileUrl;
    
    @Column(name = "timesheet_file_url")
    private String timesheetFileUrl;
    
    // Status
    @Column(name = "status")
    private String status;
    
    @Column(name = "admin_approval_status")
    private String adminApprovalStatus;
    
    @Column(name = "finance_approval_status")
    private String financeApprovalStatus;
    
    // Rejection Reasons
    @Column(name = "admin_rejection_reason", columnDefinition = "TEXT")
    private String adminRejectionReason;
    
    @Column(name = "finance_rejection_reason", columnDefinition = "TEXT")
    private String financeRejectionReason;
    
    // Timestamps
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Getters and Setters
    // ...
}
```

---

## Error Handling

### Validation Errors
```json
{
  "error": "Validation failed",
  "messages": [
    "Total hours must be greater than 0",
    "Rate must be greater than 0",
    "Invoice file is required",
    "Timesheet file is required"
  ]
}
```

### Business Logic Errors
```json
{
  "error": "Invoice creation failed",
  "message": "Invoice for 2026-04 already exists with status PENDING"
}
```

---

## Migration Path (if adding new field)

If `rate` is a new column in the database:

```sql
-- Add the new column
ALTER TABLE invoices 
ADD COLUMN rate DECIMAL(10, 2) NOT NULL DEFAULT 0;

-- Update existing invoices (if needed)
-- You might calculate rate from total_amount / total_hours
UPDATE invoices 
SET rate = total_amount / total_hours 
WHERE rate = 0;

-- Make sure NOT NULL constraint is applied
ALTER TABLE invoices 
MODIFY rate DECIMAL(10, 2) NOT NULL;
```

---

## API Response Example

### Success Response
```json
{
  "id": 1,
  "contractorId": 123,
  "invoiceMonth": "2026-04",
  "totalHours": 160,
  "rate": 50.00,
  "baseAmount": 8000.00,
  "taxPercentage": 18,
  "taxAmount": 1440.00,
  "totalAmount": 9440.00,
  "invoiceFileUrl": "/uploads/1776925000000_invoice.pdf",
  "timesheetFileUrl": "/uploads/1776925000001_timesheet.pdf",
  "status": "PENDING",
  "adminApprovalStatus": "PENDING",
  "financeApprovalStatus": "PENDING",
  "createdAt": "2026-04-24T10:30:00Z",
  "updatedAt": "2026-04-24T10:30:00Z"
}
```

---

## Important Notes

1. **Rate is User-Provided**: The frontend now sends the rate explicitly, so don't override it with contractor's stored rate
2. **Preserve Rate**: Store the exact rate used in the calculation for audit/reference
3. **Decimal Precision**: Use at least 2 decimal places for monetary values
4. **Rounding**: Use consistent rounding (e.g., HALF_UP) for all calculations
5. **Validation**: Validate all numeric inputs > 0 before processing
6. **Files Required**: Both invoice and timesheet files must be present

---

## Testing Checklist

- [ ] Create invoice with rate parameter
- [ ] Verify baseAmount = totalHours × rate
- [ ] Verify taxAmount = baseAmount × (taxPercentage / 100)
- [ ] Verify totalAmount = baseAmount + taxAmount
- [ ] Test with various rates (e.g., 25.00, 50.50, 100.00)
- [ ] Test with various hours (e.g., 80, 160, 200)
- [ ] Test with various tax rates (e.g., 5, 18, 28)
- [ ] Verify rate is stored in database
- [ ] Test validation (rate = 0, rate < 0)
- [ ] Test file uploads still work
- [ ] Test error handling
- [ ] Verify API response includes all calculated fields

---

## Backward Compatibility

⚠️ **Important**: If you have existing invoices that don't have a `rate` field:
1. Migrate existing data by calculating: `rate = baseAmount / totalHours`
2. Or: `rate = totalAmount / (totalHours × (1 + taxPercentage/100))`

Make sure to handle NULL rates gracefully in responses.
