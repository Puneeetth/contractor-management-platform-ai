package com.cmp.ai.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceResponse {

    private Long id;
    private Long contractorId;
    private String contractorName;
    private String invoiceMonth;
    private Double amount;
    private Double billRate;
    private Double payRate;
    private Double hoursRate;
    private Double totalHoursForCalc;
    private Double totalAmount;
    private Double tax;
    private String invoiceFileUrl;
    private String timesheetFileUrl;
    private String status;
    private String adminApprovalStatus;
    private String financeApprovalStatus;
    private String adminRejectionReason;
    private String financeRejectionReason;
}
