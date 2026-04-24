package com.cmp.ai.transformer;

import java.time.LocalDate;

import com.cmp.ai.dto.request.PORequest;
import com.cmp.ai.dto.response.POResponse;
import com.cmp.ai.entity.Contract;
import com.cmp.ai.entity.Customer;
import com.cmp.ai.entity.PurchaseOrder;

public class POTransformer {

    public static POResponse pOToPOResponse(PurchaseOrder po) {
        return POResponse.builder()
                .id(po.getId())
                .customerId(po.getCustomer() != null ? po.getCustomer().getId() : null)
                .contractId(po.getContract() != null ? po.getContract().getId() : null)
                .poNumber(po.getPoNumber())
                .poDate(po.getPoDate() == null ? null : po.getPoDate().toString())
                .startDate(po.getStartDate() == null ? null : po.getStartDate().toString())
                .endDate(po.getEndDate() == null ? null : po.getEndDate().toString())
                .poValue(po.getPoValue())
                .currency(po.getCurrency())
                .country(po.getCountry())
                .paymentTermsDays(po.getPaymentTermsDays())
                .remark(po.getRemark())
                .numberOfResources(po.getNumberOfResources())
                .sharedWith(po.getSharedWith())
                .fileUrl(po.getFileUrl())
                .totalHoursLimit(po.getTotalHoursLimit())
                .build();
    }

    public static PurchaseOrder pORequestToPO(PORequest req, Contract contract, Customer customer) {
        return PurchaseOrder.builder()
                .contract(contract)
                .customer(customer)
                .poNumber(req.getPoNumber())
                .poDate(parseDate(req.getPoDate()))
                .startDate(parseDate(req.getStartDate()))
                .endDate(parseDate(req.getEndDate()))
                .poValue(req.getPoValue())
                .currency(req.getCurrency())
                .country(req.getCountry())
                .paymentTermsDays(req.getPaymentTermsDays())
                .remark(req.getRemark())
                .numberOfResources(req.getNumberOfResources())
                .sharedWith(req.getSharedWith())
                .fileUrl(req.getFileUrl())
                .totalHoursLimit(req.getTotalHoursLimit())
                .build();
    }

    private static LocalDate parseDate(String date) {
        return date == null || date.isBlank() ? null : LocalDate.parse(date);
    }
}