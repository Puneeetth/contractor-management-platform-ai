package com.cmp.ai.transformer;

import com.cmp.ai.dto.request.POResourceDetailsRequest;
import com.cmp.ai.dto.response.POResourceDetailsResponse;
import com.cmp.ai.entity.PurchaseOrder;
import com.cmp.ai.entity.POResourceDetails;

public class POResourceDetailsTransformer {

    public static POResourceDetailsResponse pOResourceDetailsToResponse(POResourceDetails details) {
        return POResourceDetailsResponse.builder()
                .id(details.getId())
                .purchaseOrderId(details.getPurchaseOrder() == null ? null : details.getPurchaseOrder().getId())
                .numberOfResources(details.getNumberOfResources())
                .sharedWith(details.getSharedWith())
                .teamSize(details.getTeamSize())
                .remark(details.getRemark())
                .build();
    }

    public static POResourceDetails pOResourceDetailsRequestToEntity(
            POResourceDetailsRequest request, 
            PurchaseOrder purchaseOrder) {
        return new POResourceDetails(
                request.getPurchaseOrderId(),
                request.getNumberOfResources(),
                request.getSharedWith(),
                request.getTeamSize(),
                request.getRemark(),
                purchaseOrder
        );
    }
}
