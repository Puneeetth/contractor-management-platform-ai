package com.cmp.ai.transformer;

import com.cmp.ai.dto.response.InvoiceResponse;
import com.cmp.ai.entity.Invoice;

public class InvoiceTransformer {

    public static InvoiceResponse invoiceToInvoiceResponse(Invoice i) {
        return InvoiceResponse.builder()
                .id(i.getId())
                .contractorId(i.getContractor().getId())
                .invoiceMonth(i.getInvoiceMonth())
                .totalHours(i.getTotalHours())
                .baseAmount(i.getBaseAmount())
                .taxAmount(i.getTaxAmount())
                .totalAmount(i.getTotalAmount())
                .status(i.getStatus().name())
                .build();
    }
}