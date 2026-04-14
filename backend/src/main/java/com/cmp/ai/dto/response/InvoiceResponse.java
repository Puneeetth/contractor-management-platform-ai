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
    private String invoiceMonth;
    private Double totalHours;
    private Double baseAmount;
    private Double taxAmount;
    private Double totalAmount;
    private String status;
}