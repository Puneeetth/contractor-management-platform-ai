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
    private String invoiceFileUrl;
    private String timesheetFileUrl;
    private String status;
}