package com.cmp.ai.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class POResourceDetailsResponse {

    private Long id;
    private Long purchaseOrderId;
    private Integer numberOfResources;
    private String sharedWith;
    private Integer teamSize;
    private String remark;
}
