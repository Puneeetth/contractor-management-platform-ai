package com.cmp.ai.transformer;

import com.cmp.ai.dto.response.InvoiceResponse;
import com.cmp.ai.entity.Invoice;

public class InvoiceTransformer {

    public static InvoiceResponse invoiceToInvoiceResponse(Invoice i, Double billRate, Double payRate) {
        Double hoursForCalc = i.getTotalHours();
        return InvoiceResponse.builder()
                .id(i.getId())
                .contractorId(i.getContractor().getId())
                .contractorName(i.getContractor().getName())
                .invoiceMonth(i.getInvoiceMonth())
                .amount(i.getTotalAmount())
                .billRate(billRate)
                .payRate(payRate)
                .hoursRate(hoursForCalc)
                .totalHoursForCalc(hoursForCalc)
                .totalAmount(i.getTotalAmount())
                .tax(i.getTaxAmount())
                .invoiceFileUrl(i.getInvoiceFileUrl())
                .timesheetFileUrl(i.getTimesheetFileUrl())
                .status(i.getStatus().name())
                .adminApprovalStatus(i.getAdminApprovalStatus() != null ? i.getAdminApprovalStatus().name() : null)
                .financeApprovalStatus(i.getFinanceApprovalStatus() != null ? i.getFinanceApprovalStatus().name() : null)
                .adminRejectionReason(i.getAdminRejectionReason())
                .financeRejectionReason(i.getFinanceRejectionReason())
                .build();
    }
}
