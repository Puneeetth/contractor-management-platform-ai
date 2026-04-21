package com.cmp.ai.transformer;

import com.cmp.ai.dto.response.InvoiceResponse;
import com.cmp.ai.entity.Invoice;

public class InvoiceTransformer {

    public static InvoiceResponse invoiceToInvoiceResponse(Invoice i) {
        return InvoiceResponse.builder()
                .id(i.getId())
                .contractorId(i.getContractor().getId())
                .contractorName(i.getContractor().getName())
                .invoiceMonth(i.getInvoiceMonth())
                .amount(i.getTotalAmount())
                .invoiceFileUrl(i.getInvoiceFileUrl())
                .timesheetFileUrl(i.getTimesheetFileUrl())
                .status(i.getStatus().name())
                .build();
    }
}