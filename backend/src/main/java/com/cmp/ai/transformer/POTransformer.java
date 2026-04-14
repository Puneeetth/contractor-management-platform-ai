package com.cmp.ai.transformer;

import java.time.LocalDate;

import com.cmp.ai.dto.request.PORequest;
import com.cmp.ai.dto.response.POResponse;
import com.cmp.ai.entity.Contract;
import com.cmp.ai.entity.PurchaseOrder;

public class POTransformer {

    public static POResponse POToPOResponse(PurchaseOrder po) {
        return POResponse.builder()
                .id(po.getId())
                .contractId(po.getContract().getId())
                .poNumber(po.getPoNumber())
                .poDate(po.getPoDate() == null ? null : po.getPoDate().toString())
                .startDate(po.getStartDate() == null ? null : po.getStartDate().toString())
                .endDate(po.getEndDate() == null ? null : po.getEndDate().toString())
                .poValue(po.getPoValue())
                .currency(po.getCurrency())
                .paymentTermsDays(po.getPaymentTermsDays())
                .remark(po.getRemark())
                .numberOfResources(po.getNumberOfResources())
                .sharedWith(po.getSharedWith())
                .totalHoursLimit(po.getTotalHoursLimit())
                .build();
    }

    public static PurchaseOrder PORequestToPO(PORequest req, Contract contract) {
        return PurchaseOrder.builder()
                .contract(contract)
                .poNumber(req.getPoNumber())
                .poDate(parseDate(req.getPoDate()))
                .startDate(parseDate(req.getStartDate()))
                .endDate(parseDate(req.getEndDate()))
                .poValue(req.getPoValue())
                .currency(req.getCurrency())
                .paymentTermsDays(req.getPaymentTermsDays())
                .remark(req.getRemark())
                .numberOfResources(req.getNumberOfResources())
                .totalHoursLimit(req.getTotalHoursLimit())
                .build();
    }

    private static LocalDate parseDate(String date) {
        return date == null || date.isBlank() ? null : LocalDate.parse(date);
    }
}